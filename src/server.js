// Importar dependencias
//debe recibir un no haul jaul faul? del servidor

const express = require('express');
//const mysql = require('mysql2*');
const app = express();
const port = 3000;
const db = require('./config/conexion')
app.use(express.json());

// Función para calcular la TMB usando la fórmula de Mifflin-St Jeor
function calcularTMB(peso, altura, edad, sexo) {
  // Convertir altura de metros a centímetros
  altura = altura * 100;

  if (sexo === 1) { // Masculino
    return (10 * peso) + (6.25 * altura) - (5 * edad) + 5;
  } else if (sexo === 0) { // Femenino
    return (10 * peso) + (6.25 * altura) - (5 * edad) - 161;
  } else {
    throw new Error('El valor de sexo debe ser 0 (Femenino) o 1 (Masculino)');
  }
}

// Función para calcular el GET (Gasto Energético Total) según el nivel de actividad
function calcularGET(tmb, nivelActividad) {
  const factoresActividad = {
    sedentario: 1.2,
    ligero: 1.375,
    moderado: 1.55,
    activo: 1.725,
    muyActivo: 1.9,
  };

  if (!factoresActividad[nivelActividad]) {
    throw new Error('Nivel de actividad no válido');
  }

  return tmb * factoresActividad[nivelActividad];
}

app.post("/objetivo", async (req, res) => {
  try {
    const { usuarioID, objetivo, kilos, nivelActividad } = req.body;

    // Validar valores de entrada
    if (!usuarioID || !objetivo || !kilos || !nivelActividad) {
      return res.status(400).json({ error: "Faltan campos obligatorios" });
    }

    if (objetivo !== "perder_peso" && objetivo !== "ganar_peso" && objetivo !== "mantener_peso") {
      return res.status(400).json({ error: "El objetivo debe ser 'perder_peso', 'ganar_peso' o 'mantener_peso'" });
    }

    if (isNaN(kilos) || kilos <= 0) {
      return res.status(400).json({ error: "El valor de kilos debe ser un número positivo" });
    }

    // Obtener datos del usuario
    const [rows] = await db.query("SELECT * FROM USUARIOS WHERE UsuarioID = ?", [usuarioID]);

    if (rows.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const usuario = rows[0];
    console.log("Datos del usuario:", usuario); // Depuración

    // Convertir el campo Sexo (Buffer) a número
    const sexo = usuario.Sexo.readUInt8(0); // Convierte el Buffer a número
    console.log("Sexo convertido:", sexo); // Depuración

    // Validar el valor de Sexo
    if (sexo !== 0 && sexo !== 1) {
      return res.status(400).json({ error: "El valor de Sexo en la base de datos no es válido" });
    }

    // Calcular la edad a partir de la fecha de nacimiento
    const fechaNacimiento = new Date(usuario.FechaNacimiento);
    const hoy = new Date();
    let edad = hoy.getFullYear() - fechaNacimiento.getFullYear();
    const mes = hoy.getMonth() - fechaNacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < fechaNacimiento.getDate())) {
      edad--;
    }

    // Calcular TMB y GET
    const tmb = calcularTMB(usuario.Peso, usuario.Altura, edad, sexo); // Usar el valor convertido
    const get = calcularGET(tmb, nivelActividad);

    // Ajustar el GET según el objetivo
    let getAjustado;
    let deficitDiario = 0;
    let superavitDiario = 0;

    switch (objetivo) {
      case "perder_peso":
        deficitDiario = -500; // Déficit de 500 kcal/día
        getAjustado = get + deficitDiario;
        break;
      case "ganar_peso":
        superavitDiario = 500; // Superávit de 500 kcal/día
        getAjustado = get + superavitDiario;
        break;
      case "mantener_peso":
        getAjustado = get; // Sin déficit ni superávit
        break;
      default:
        return res.status(400).json({ error: "Objetivo no válido" });
    }

    // Cálculo de duración del plan (7000 kcal ≈ 1kg de grasa)
    const diasRequeridos = Math.abs(kilos * 7000 / (objetivo === "perder_peso" ? -500 : 500)) || 0;

    // Respuesta con los resultados
    res.json({
      usuario: {
        ...usuario,
        Sexo: sexo, // Incluir el valor convertido en la respuesta
      },
      tmb: tmb.toFixed(2),  // Redondear a 2 decimales
      get: get.toFixed(2),   // Redondear a 2 decimales
      getAjustado: getAjustado.toFixed(2), // GET ajustado según el objetivo
      objetivo,
      kilos,
      diasRequeridos: Math.ceil(diasRequeridos),  // Redondear hacia arriba
      deficitDiario: objetivo === "perder_peso" ? deficitDiario : 0,
      superavitDiario: objetivo === "ganar_peso" ? superavitDiario : 0,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error en el servidor" });
  }
});
 

app.post("/generar-plan", async (req, res) => {
  try {
    const { usuarioID, objetivo, kilos, nivelActividad, diasRequeridos, getAjustado } = req.body;

    // 1. Generar manualmente el PlanAlimentacionID
    const [maxPlanID] = await db.query("SELECT MAX(PlanAlimentacionID) AS maxID FROM PLANALIMENTACION");
    const planID = maxPlanID[0].maxID ? maxPlanID[0].maxID + 1 : 1; // Si no hay registros, empezar con 1

    // 2. Crear el plan de alimentación
    const nombrePlan = `Plan ${objetivo.replace("_", " ")}`;
    await db.query(
      "INSERT INTO PLANALIMENTACION (PlanAlimentacionID, UsuarioID, NombrePlan, Estado) VALUES (?, ?, ?, ?)",
      [planID, usuarioID, nombrePlan, "Activo"]
    );

    // 3. Obtener alimentos permitidos para el usuario
    const alimentosPermitidos = await obtenerAlimentosPermitidos(usuarioID);

    // 4. Generar detalles del plan para cada día
    for (let dia = 1; dia <= diasRequeridos; dia++) {
      const fechaSugerida = new Date();
      fechaSugerida.setDate(fechaSugerida.getDate() + dia);

      // Distribuir las calorías en comidas
      const comidas = distribuirCalorias(getAjustado);

      // Seleccionar alimentos para cada comida
      const detalles = await generarDetallesComida(alimentosPermitidos, comidas);

      // Insertar detalles en DETALLEPLAN
      for (const detalle of detalles) {
        // Generar manualmente el DetalleID
        const [maxDetalleID] = await db.query("SELECT MAX(DetalleID) AS maxID FROM DETALLEPLAN");
        const detalleID = maxDetalleID[0].maxID ? maxDetalleID[0].maxID + 1 : 1; // Si no hay registros, empezar con 1

        await db.query(
          "INSERT INTO DETALLEPLAN (DetalleID, PlanID, AlimentoID, Cantidad, FechaSugerida) VALUES (?, ?, ?, ?, ?)",
          [detalleID, planID, detalle.AlimentoID, detalle.Cantidad, fechaSugerida]
        );
      }
    }

    res.json({
      message: "Plan de alimentación generado exitosamente",
      planID,
      diasRequeridos,
      getAjustado,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al generar el plan de alimentación" });
  }
});

// Función para obtener alimentos permitidos
async function obtenerAlimentosPermitidos(usuarioID) {
  const [rows] = await db.query(
    `SELECT a.* 
FROM ALIMENTOS a
WHERE NOT EXISTS (
    SELECT 1
    FROM CONDICIONESALIMENTOS ca
    LEFT JOIN USUARIOCONDICIONES uc ON ca.CondicionMedicaID = uc.CondicionMedicaID
    WHERE uc.UsuarioID = ? AND ca.AlimentoID = a.AlimentoID
)`,
    [usuarioID]
  );
  return rows;
}

// Función para distribuir las calorías en comidas
function distribuirCalorias(getAjustado) {
  return {
    desayuno: getAjustado * 0.25,
    almuerzo: getAjustado * 0.35,
    cena: getAjustado * 0.30,
    snacks: getAjustado * 0.10,
  };
}

// Función para generar detalles de comida
async function generarDetallesComida(alimentosPermitidos, comidas) {
  const detalles = [];

  // Seleccionar alimentos aleatorios para cada comida
  for (const [comida, calorias] of Object.entries(comidas)) {
    const alimentosSeleccionados = seleccionarAlimentos(alimentosPermitidos, calorias);
    detalles.push(...alimentosSeleccionados);
  }

  return detalles;
}

// Función para seleccionar alimentos aleatorios
function seleccionarAlimentos(alimentosPermitidos, caloriasRequeridas) {
  const alimentosSeleccionados = [];
  let caloriasAcumuladas = 0;

  while (caloriasAcumuladas < caloriasRequeridas) {
    const alimento = alimentosPermitidos[Math.floor(Math.random() * alimentosPermitidos.length)];
    const cantidad = Math.min(100, (caloriasRequeridas - caloriasAcumuladas) / alimento.Calorias * 100);

    alimentosSeleccionados.push({
      AlimentoID: alimento.AlimentoID,
      Cantidad: cantidad,
    });

    caloriasAcumuladas += alimento.Calorias * (cantidad / 100);
  }

  return alimentosSeleccionados;
}


// Ruta GET para obtener todos los usuarios
app.get('/usuarios', async (req, res) => {
  try {
    const [results] = await db.query('CALL GetUsuarios()');
    res.json(results[0]); 
  } catch (err) {
    console.error('Error al obtener los usuarios:', err);
    res.status(500).json({ error: 'Error al obtener los usuarios' });
  }
});

// Ruta GET para obtener todas las condiciones médicas
app.get('/condiciones-medicas', async (req, res) => {
  try {
    const [results] = await db.query('CALL GetCondicionesMedicas()');
    res.json(results[0]);
  } catch (err) {
    console.error('Error al obtener las condiciones médicas:', err);
    res.status(500).json({ error: 'Error al obtener las condiciones médicas' });
  }
});

// Ruta GET para obtener todas las condiciones médicas de un usuario
app.get('/usuarios/:id/condiciones', async (req, res) => {
  try {
    const { id } = req.params;
    const [results] = await db.query('CALL GetUsuarioCondiciones(?)', [id]);
    res.json(results[0]);
  } catch (err) {
    console.error('Error al obtener las condiciones del usuario:', err);
    res.status(500).json({ error: 'Error al obtener las condiciones del usuario' });
  }
});

// Ruta GET para obtener todos los alimentos
app.get('/alimentos', async (req, res) => {
  try {
    const [results] = await db.query('CALL GetAlimentos()');
    res.json(results[0]);
  } catch (err) {
    console.error('Error al obtener los alimentos:', err);
    res.status(500).json({ error: 'Error al obtener los alimentos' });
  }
});

// Ruta GET para obtener todos los alimentos restringidos por una condición médica
app.get('/condiciones-medicas/:id/alimentos', async (req, res) => {
  try {
    const { id } = req.params;
    const [results] = await db.query('CALL GetCondicionesAlimentos(?)', [id]);
    res.json(results[0]);
  } catch (err) {
    console.error('Error al obtener los alimentos restringidos por condición médica:', err);
    res.status(500).json({ error: 'Error al obtener los alimentos restringidos por condición médica' });
  }
});

// Ruta GET para obtener todas las sugerencias de alimentos para un usuario
app.get('/usuarios/:id/sugerencias', async (req, res) => {
  try {
    const { id } = req.params;
    const [results] = await db.query('CALL GetSugerencias(?)', [id]);
    res.json(results[0]);
  } catch (err) {
    console.error('Error al obtener las sugerencias de alimentos del usuario:', err);
    res.status(500).json({ error: 'Error al obtener las sugerencias de alimentos del usuario' });
  }
});

// Ruta GET para obtener todos los planes de alimentación de un usuario
app.get('/usuarios/:id/planes-alimentacion', async (req, res) => {
  try {
    const { id } = req.params;
    const [results] = await db.query('CALL GetPlanesAlimentacion(?)', [id]);
    res.json(results[0]);
  } catch (err) {
    console.error('Error al obtener los planes de alimentación del usuario:', err);
    res.status(500).json({ error: 'Error al obtener los planes de alimentación del usuario' });
  }
});

// Ruta GET para obtener todos los detalles de un plan de alimentación
app.get('/planes-alimentacion/:id/detalles', async (req, res) => {
  try {
    const { id } = req.params;
    const [results] = await db.query('CALL GetDetallePlan(?)', [id]);
    res.json(results[0]);
  } catch (err) {
    console.error('Error al obtener los detalles del plan de alimentación:', err);
    res.status(500).json({ error: 'Error al obtener los detalles del plan de alimentación' });
  }
});

// Ruta POST para agregar un nuevo usuario
app.post('/usuarios', async (req, res) => {
  try {
    const { Nombre, ApellidoPaterno, ApellidoMaterno, Sexo, Peso, Altura, FechaNacimiento } = req.body;

    // Validar que el valor de Sexo sea 0 o 1
    if (Sexo !== 0 && Sexo !== 1) {
      return res.status(400).json({ error: 'El valor de Sexo debe ser 0 (Femenino) o 1 (Masculino)' });
    }

    // Llamar al procedimiento almacenado con los parámetros
    await db.query('CALL PostUsuario(?, ?, ?, ?, ?, ?, ?)', [
      Nombre,
      ApellidoPaterno,
      ApellidoMaterno,
      Sexo,  // Sexo como BIT (0 o 1)
      Peso,
      Altura,
      FechaNacimiento  // Nuevo campo
    ]);

    res.json({ message: 'Usuario agregado exitosamente' });
  } catch (err) {
    console.error('Error al agregar el usuario:', err);
    res.status(500).json({ error: 'Error al agregar el usuario' });
  }
});

// Ruta POST para agregar un nuevo alimento
app.post('/alimentos', async (req, res) => {
  try {
    const { nombre, calorias, carbohidratos, proteinas, grasas, fibra, porcion } = req.body;
    await db.query('CALL PostAlimento(?, ?, ?, ?, ?, ?, ?)', [nombre, calorias, carbohidratos, proteinas, grasas, fibra, porcion]);
    res.json({ message: 'Alimento agregado exitosamente' });
  } catch (err) {
    console.error('Error al agregar el alimento:', err);
    res.status(500).json({ error: 'Error al agregar el alimento' });
  }
});

// Ruta POST para agregar una nueva condición médica
app.post('/condiciones-medicas', async (req, res) => {
  try {
    const { nombre, descripcion } = req.body;
    await db.query('CALL PostCondicionMedica(?, ?)', [nombre, descripcion]);
    res.json({ message: 'Condición médica agregada exitosamente' });
  } catch (err) {
    console.error('Error al agregar la condición médica:', err);
    res.status(500).json({ error: 'Error al agregar la condición médica' });
  }
});

// Ruta POST para agregar una nueva condición médica a un usuario
app.post('/usuarios/:id/condiciones', async (req, res) => {
  try {
    const { id } = req.params;
    const { condicion_medica_id } = req.body;
    await db.query('CALL PostUsuarioCondicion(?, ?)', [id, condicion_medica_id]);
    res.json({ message: 'Condición médica agregada al usuario exitosamente' });
  } catch (err) {
    console.error('Error al agregar la condición médica al usuario:', err);
    res.status(500).json({ error: 'Error al agregar la condición médica al usuario' });
  }
});

// Ruta POST para agregar un nuevo plan de alimentación
app.post('/usuarios/:id/planes-alimentacion', async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre_plan, observacion } = req.body;
    await db.query('CALL PostPlanAlimentacion(?, ?, ?)', [id, nombre_plan, observacion]);
    res.json({ message: 'Plan de alimentación agregado exitosamente' });
  } catch (err) {
    console.error('Error al agregar el plan de alimentación:', err);
    res.status(500).json({ error: 'Error al agregar el plan de alimentación' });
  }
});

// Ruta POST para agregar un detalle al plan de alimentación
app.post('/planes-alimentacion/:id/detalles', async (req, res) => {
  try {
    const { id } = req.params;
    const { alimento_id, cantidad, fecha_sugerida } = req.body;
    await db.query('CALL PostDetallePlan(?, ?, ?, ?)', [id, alimento_id, cantidad, fecha_sugerida]);
    res.json({ message: 'Detalle del plan de alimentación agregado exitosamente' });
  } catch (err) {
    console.error('Error al agregar el detalle del plan de alimentación:', err);
    res.status(500).json({ error: 'Error al agregar el detalle del plan de alimentación' });
  }
});

// Ruta POST para agregar una sugerencia de alimento para un usuario
app.post('/usuarios/:id/sugerencias', async (req, res) => {
  try {
    const { id } = req.params;
    const { alimento_id, justificacion } = req.body;
    await db.query('CALL PostSugerencia(?, ?, ?)', [id, alimento_id, justificacion]);
    res.json({ message: 'Sugerencia de alimento agregada exitosamente' });
  } catch (err) {
    console.error('Error al agregar la sugerencia de alimento:', err);
    res.status(500).json({ error: 'Error al agregar la sugerencia de alimento' });
  }
});

// Ruta POST para agregar un alimento restringido por condición médica
app.post('/condiciones-medicas/:id/alimentos', async (req, res) => {
  try {
    const { id } = req.params;
    const { alimento_id, restriccion } = req.body;
    await db.query('CALL PostCondicionAlimento(?, ?, ?)', [id, alimento_id, restriccion]);
    res.json({ message: 'Alimento restringido por condición médica agregado exitosamente' });
  } catch (err) {
    console.error('Error al agregar el alimento restringido por condición médica:', err);
    res.status(500).json({ error: 'Error al agregar el alimento restringido por condición médica' });
  }
});

// Ruta PUT para actualizar un usuario
app.put('/usuarios/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { Nombre, ApellidoPaterno, ApellidoMaterno, Sexo, Peso, Altura } = req.body;
    await db.query('CALL PutUsuario(?, ?, ?, ?, ?, ?, ?)', [id, Nombre, ApellidoPaterno, ApellidoMaterno, Sexo, Peso, Altura]);
    res.json({ message: 'Usuario actualizado exitosamente' });
  } catch (err) {
    console.error('Error al actualizar el usuario:', err);
    res.status(500).json({ error: 'Error al actualizar el usuario' });
  }
});

// Ruta DELETE para eliminar un usuario
app.delete('/usuarios/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('CALL DeleteUsuario(?)', [id]);
    res.json({ message: 'Usuario eliminado exitosamente' });
  } catch (err) {
    console.error('Error al eliminar el usuario:', err);
    res.status(500).json({ error: 'Error al eliminar el usuario' });
  }
});

// Ruta PUT para actualizar un alimento
app.put('/alimentos/:id', (req, res) => {
  const { id } = req.params;
  const { nombre, calorias, carbohidratos, proteinas, grasas, fibra, porcion } = req.body;
  db.query('CALL PutAlimento(?, ?, ?, ?, ?, ?, ?, ?)', [id, nombre, calorias, carbohidratos, proteinas, grasas, fibra, porcion], (err) => {
    if (err) {
      console.error('Error al actualizar el alimento:', err);
      res.status(500).json({ error: 'Error al actualizar el alimento' });
    } else {
      res.json({ message: 'Alimento actualizado exitosamente' });
    }
  });
});

// Ruta DELETE para eliminar un alimento
app.delete('/alimentos/:id', (req, res) => {
  const { id } = req.params;
  db.query('CALL DeleteAlimento(?)', [id], (err) => {
    if (err) {
      console.error('Error al eliminar el alimento:', err);
      res.status(500).json({ error: 'Error al eliminar el alimento' });
    } else {
      res.json({ message: 'Alimento eliminado exitosamente' });
    }
  });
});

// Ruta PUT para actualizar una condición médica
app.put('/condiciones-medicas/:id', (req, res) => {
  const { id } = req.params;
  const { nombre, descripcion } = req.body;
  db.query('CALL PutCondicionMedica(?, ?, ?)', [id, nombre, descripcion], (err) => {
    if (err) {
      console.error('Error al actualizar la condición médica:', err);
      res.status(500).json({ error: 'Error al actualizar la condición médica' });
    } else {
      res.json({ message: 'Condición médica actualizada exitosamente' });
    }
  });
});

// Ruta DELETE para eliminar una condición médica
app.delete('/condiciones-medicas/:id', (req, res) => {
  const { id } = req.params;
  db.query('CALL DeleteCondicionMedica(?)', [id], (err) => {
    if (err) {
      console.error('Error al eliminar la condición médica:', err);
      res.status(500).json({ error: 'Error al eliminar la condición médica' });
    } else {
      res.json({ message: 'Condición médica eliminada exitosamente' });
    }
  });
});

// Ruta DELETE para eliminar una condición médica de un usuario
app.delete('/usuarios/:id/condiciones/:condicionId', (req, res) => {
  const { id, condicionId } = req.params;
  db.query('CALL DeleteUsuarioCondicion(?, ?)', [id, condicionId], (err) => {
    if (err) {
      console.error('Error al eliminar la condición médica del usuario:', err);
      res.status(500).json({ error: 'Error al eliminar la condición médica del usuario' });
    } else {
      res.json({ message: 'Condición médica eliminada del usuario exitosamente' });
    }
  });
});

// Ruta PUT para actualizar un plan de alimentación
app.put('/usuarios/:id/planes-alimentacion/:planId', (req, res) => {
  const { id, planId } = req.params;
  const { nombre_plan, observacion } = req.body;
  db.query('CALL PutPlanAlimentacion(?, ?, ?, ?)', [id, planId, nombre_plan, observacion], (err) => {
    if (err) {
      console.error('Error al actualizar el plan de alimentación:', err);
      res.status(500).json({ error: 'Error al actualizar el plan de alimentación' });
    } else {
      res.json({ message: 'Plan de alimentación actualizado exitosamente' });
    }
  });
});

// Ruta DELETE para eliminar un plan de alimentación
app.delete('/usuarios/:id/planes-alimentacion/:planId', (req, res) => {
  const { id, planId } = req.params;
  db.query('CALL DeletePlanAlimentacion(?, ?)', [id, planId], (err) => {
    if (err) {
      console.error('Error al eliminar el plan de alimentación:', err);
      res.status(500).json({ error: 'Error al eliminar el plan de alimentación' });
    } else {
      res.json({ message: 'Plan de alimentación eliminado exitosamente' });
    }
  });
});

// Ruta PUT para actualizar un detalle del plan de alimentación
app.put('/planes-alimentacion/:planId/detalles/:detalleId', (req, res) => {
  const { planId, detalleId } = req.params;
  const { alimento_id, cantidad, fecha_sugerida } = req.body;
  db.query('CALL PutDetallePlan(?, ?, ?, ?, ?)', [planId, detalleId, alimento_id, cantidad, fecha_sugerida], (err) => {
    if (err) {
      console.error('Error al actualizar el detalle del plan de alimentación:', err);
      res.status(500).json({ error: 'Error al actualizar el detalle del plan de alimentación' });
    } else {
      res.json({ message: 'Detalle del plan de alimentación actualizado exitosamente' });
    }
  });
});

// Ruta DELETE para eliminar un detalle del plan de alimentación
app.delete('/planes-alimentacion/:planId/detalles/:detalleId', (req, res) => {
  const { planId, detalleId } = req.params;
  db.query('CALL DeleteDetallePlan(?, ?)', [planId, detalleId], (err) => {
    if (err) {
      console.error('Error al eliminar el detalle del plan de alimentación:', err);
      res.status(500).json({ error: 'Error al eliminar el detalle del plan de alimentación' });
    } else {
      res.json({ message: 'Detalle del plan de alimentación eliminado exitosamente' });
    }
  });
});

// Ruta DELETE para eliminar una sugerencia de alimento
app.delete('/usuarios/:id/sugerencias/:sugerenciaId', (req, res) => {
  const { id, sugerenciaId } = req.params;
  db.query('CALL DeleteSugerencia(?, ?)', [id, sugerenciaId], (err) => {
    if (err) {
      console.error('Error al eliminar la sugerencia de alimento:', err);
      res.status(500).json({ error: 'Error al eliminar la sugerencia de alimento' });
    } else {
      res.json({ message: 'Sugerencia de alimento eliminada exitosamente' });
    }
  });
});

// Ruta DELETE para eliminar una restricción de alimento por condición médica
app.delete('/condiciones-medicas/:id/alimentos/:alimentoId', (req, res) => {
  const { id, alimentoId } = req.params;
  db.query('CALL DeleteCondicionAlimento(?, ?)', [id, alimentoId], (err) => {
    if (err) {
      console.error('Error al eliminar la restricción de alimento por condición médica:', err);
      res.status(500).json({ error: 'Error al eliminar la restricción de alimento por condición médica' });
    } else {
      res.json({ message: 'Restricción de alimento eliminada exitosamente' });
    }
  });
});


// Levantar el servidor en el puerto especificado
app.listen(port, () => {
  console.log(`Servidor levantado en http://localhost:${port}`);
});
