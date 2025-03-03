// Importar dependencias
//debe recibir un no haul jaul faul? del servidor

const express = require('express');
//const mysql = require('mysql2*');
const app = express();
const port = 3000;
const db = require('./config/conexion')
app.use(express.json());


// Función para calcular el TMB
//edad no calculada correctamente, cambiar la base de datos para que se pueda calcular la edad
//perdon micaela, tendremos que cambiar la base de datos para que se pueda calcular la edad
function calcularTMB(peso, altura, edad, sexo) {
  // Convertir altura de metros a centímetros
  altura = altura * 100;
  
  if (sexo === "Hombre") {
    return (10 * peso) + (6.25 * altura) - (5 * edad) + 5;
  } else {
    return (10 * peso) + (6.25 * altura) - (5 * edad) - 161;
  }
}

// Función para calcular el GET (suponiendo un nivel de actividad moderado = 1.55) 
//Ojo cambiar el nivel de actividad si es necesario (falta implementar la opción para que el usuario pueda elegir su nivel de actividad)
//Niveles de actividad: Sedentario (1.2), Ligero (1.375), Moderado (1.55), Activo (1.725), Muy activo (1.9)
function calcularGET(tmb) {
  return tmb * 1.55;
}

// Endpoint para obtener datos del usuario y calcular TMB y GET
app.get("/calcular/:usuarioID", async (req, res) => {
  try {
    const usuarioID = req.params.usuarioID;
    const [rows] = await db.query("SELECT * FROM USUARIOS WHERE UsuarioID = ?", [usuarioID]);

    if (rows.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const usuario = rows[0];
    const edad = new Date().getFullYear() - new Date(usuario.FechaRegistro).getFullYear(); // Edad aproximada
    const tmb = calcularTMB(usuario.Peso, usuario.Altura, edad, usuario.Sexo);
    const get = calcularGET(tmb);


    res.json({ usuario, tmb, get });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error en el servidor" });
  }
});

// Endpoint para ingresar objetivo y calcular duración del plan
app.post("/objetivo", async (req, res) => {
  try {
    const { usuarioID,  objetivo, kilos } = req.body;

    // Obtener TMB y GET del usuario
    const [rows] = await db.query("SELECT * FROM USUARIOS WHERE UsuarioID = ?", [usuarioID]);

    if (rows.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const usuario = rows[0];
    const edad = new Date().getFullYear() - new Date(usuario.FechaRegistro).getFullYear();
    const tmb = calcularTMB(usuario.Peso, usuario.Altura, edad, usuario.Sexo);
    const get = calcularGET(tmb);

    // Cálculo de duración del plan (Ejemplo: 7000 kcal ≈ 1kg de grasa)
    const deficitDiario = objetivo === "perder_peso" ? -500 : 500; // Reducimos o aumentamos 500 kcal/día
    const diasRequeridos = Math.abs(kilos * 7000 / deficitDiario);

    res.json({ usuario, tmb, get, objetivo, kilos, diasRequeridos, deficitDiario });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error en el servidor" });
  }
});
 

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
    const { Nombre, ApellidoPaterno, ApellidoMaterno, Sexo, Peso, Altura } = req.body;
    await db.query('CALL PostUsuario(?, ?, ?, ?, ?, ?)', [Nombre, ApellidoPaterno, ApellidoMaterno, Sexo, Peso, Altura]);
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
