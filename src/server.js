// Importar dependencias
//debe recibir un no haul jaul faul? del servidor

const express = require('express');
//const mysql = require('mysql2*');
const app = express();
const port = 3000;
const db = require('./config/conexion')
 


// Ruta GET para obtener todos los usuarios
app.get('/usuarios', (req, res) => {
  db.query('CALL GetUsuarios()', (err, results) => {
    if (err) {
      console.error('Error al obtener los usuarios:', err);
      res.status(500).json({ error: 'Error al obtener los usuarios' });
    } else {
      res.json(results[0]); // Retorna la lista de usuarios
    }
  });
});
// Ruta GET para obtener todas las condiciones médicas
app.get('/condiciones-medicas', (req, res) => {
  db.query('CALL GetCondicionesMedicas()', (err, results) => {
    if (err) {
      console.error('Error al obtener las condiciones médicas:', err);
      res.status(500).json({ error: 'Error al obtener las condiciones médicas' });
    } else {
      res.json(results[0]); // Retorna la lista de condiciones médicas
    }
  });
});
// Ruta GET para obtener todas las condiciones médicas de un usuario
app.get('/usuarios/:id/condiciones', (req, res) => {
  const { id } = req.params;
  db.query('CALL GetUsuarioCondiciones(?)', [id], (err, results) => {
    if (err) {
      console.error('Error al obtener las condiciones del usuario:', err);
      res.status(500).json({ error: 'Error al obtener las condiciones del usuario' });
    } else {
      res.json(results[0]); // Retorna las condiciones médicas del usuario
    }
  });
});
// Ruta GET para obtener todos los alimentos
app.get('/alimentos', (req, res) => {
  db.query('CALL GetAlimentos()', (err, results) => {
    if (err) {
      console.error('Error al obtener los alimentos:', err);
      res.status(500).json({ error: 'Error al obtener los alimentos' });
    } else {
      res.json(results[0]); // Retorna la lista de alimentos
    }
  });
});//-------------------------------------------------------------------------------------------------------------------------------------------------------
// Ruta GET para obtener todos los alimentos restringidos por una condición médica
app.get('/condiciones-medicas/:id/alimentos', (req, res) => {
  const { id } = req.params;
  db.query('CALL GetCondicionesAlimentos(?)', [id], (err, results) => {
    if (err) {
      console.error('Error al obtener los alimentos restringidos por condición médica:', err);
      res.status(500).json({ error: 'Error al obtener los alimentos restringidos por condición médica' });
    } else {
      res.json(results[0]); // Retorna los alimentos restringidos por la condición médica
    }
  });
});
// Ruta GET para obtener todas las sugerencias de alimentos para un usuario
app.get('/usuarios/:id/sugerencias', (req, res) => {
  const { id } = req.params;
  db.query('CALL GetSugerencias(?)', [id], (err, results) => {
    if (err) {
      console.error('Error al obtener las sugerencias de alimentos del usuario:', err);
      res.status(500).json({ error: 'Error al obtener las sugerencias de alimentos del usuario' });
    } else {
      res.json(results[0]); // Retorna las sugerencias de alimentos para el usuario
    }
  });
});
// Ruta GET para obtener todos los planes de alimentación de un usuario
app.get('/usuarios/:id/planes-alimentacion', (req, res) => {
  const { id } = req.params;
  db.query('CALL GetPlanesAlimentacion(?)', [id], (err, results) => {
    if (err) {
      console.error('Error al obtener los planes de alimentación del usuario:', err);
      res.status(500).json({ error: 'Error al obtener los planes de alimentación del usuario' });
    } else {
      res.json(results[0]); // Retorna los planes de alimentación del usuario
    }
  });
});
// Ruta GET para obtener todos los detalles de un plan de alimentación
app.get('/planes-alimentacion/:id/detalles', (req, res) => {
  const { id } = req.params;
  db.query('CALL GetDetallePlan(?)', [id], (err, results) => {
    if (err) {
      console.error('Error al obtener los detalles del plan de alimentación:', err);
      res.status(500).json({ error: 'Error al obtener los detalles del plan de alimentación' });
    } else {
      res.json(results[0]); // Retorna los detalles del plan de alimentación
    }
  });
});

// Ruta POST para agregar un nuevo usuario-------------------------------------------------------------------------------------------------------------
app.post('/usuarios', (req, res) => {
  const { Nombre, ApellidoPaterno, ApellidoMaterno, Sexo, Peso, Altura } = req.body;
  db.query('CALL PostUsuario(?, ?, ?, ?, ?, ?)', [Nombre, ApellidoPaterno, ApellidoMaterno, Sexo, Peso, Altura], (err, results) => {
    if (err) {
      console.error('Error al agregar el usuario:', err);
      res.status(500).json({ error: 'Error al agregar el usuario' });
    } else {
      res.json({ message: 'Usuario agregado exitosamente' });
    }
  });
});

// Ruta POST para agregar un nuevo alimento
app.post('/alimentos', (req, res) => {
  console.log("Datos recibidos en el Body:", req.body); //  Depuración
  const { nombre, calorias, carbohidratos, proteinas, grasas, fibra, porcion } = req.body;
  db.query('CALL PostAlimento(?, ?, ?, ?, ?, ?, ?)', [nombre, calorias, carbohidratos, proteinas, grasas, fibra, porcion], (err, results) => {
    if (err) {
      console.error('Error al agregar el alimento:', err);
      res.status(500).json({ error: 'Error al agregar el alimento' });
    } else {
      res.json({ message: 'Alimento agregado exitosamente' });
    }
  });
});

// Ruta POST para agregar una nueva condición médica
app.post('/condiciones-medicas', (req, res) => {
  const { nombre, descripcion } = req.body;
  db.query('CALL PostCondicionMedica(?, ?)', [nombre, descripcion], (err, results) => {
    if (err) {
      console.error('Error al agregar la condición médica:', err);
      res.status(500).json({ error: 'Error al agregar la condición médica' });
    } else {
      res.json({ message: 'Condición médica agregada exitosamente' });
    }
  });
});

// Ruta POST para agregar una nueva condición médica a un usuario
app.post('/usuarios/:id/condiciones', (req, res) => {
  const { id } = req.params;
  const { condicion_medica_id } = req.body;
  db.query('CALL PostUsuarioCondicion(?, ?)', [id, condicion_medica_id], (err, results) => {
    if (err) {
      console.error('Error al agregar la condición médica al usuario:', err);
      res.status(500).json({ error: 'Error al agregar la condición médica al usuario' });
    } else {
      res.json({ message: 'Condición médica agregada al usuario exitosamente' });
    }
  });
});

// Ruta POST para agregar un nuevo plan de alimentación---------------------------------------------------------------------------------------------------------------
app.post('/usuarios/:id/planes-alimentacion', (req, res) => {
  const { id } = req.params;
  const { nombre_plan, observacion } = req.body;
  db.query('CALL PostPlanAlimentacion(?, ?, ?)', [id, nombre_plan, observacion], (err, results) => {
    if (err) {
      console.error('Error al agregar el plan de alimentación:', err);
      res.status(500).json({ error: 'Error al agregar el plan de alimentación' });
    } else {
      res.json({ message: 'Plan de alimentación agregado exitosamente' });
    }
  });
});

// Ruta POST para agregar un detalle al plan de alimentación
app.post('/planes-alimentacion/:id/detalles', (req, res) => {
  const { id } = req.params;
  const { alimento_id, cantidad, fecha_sugerida } = req.body;
  db.query('CALL PostDetallePlan(?, ?, ?, ?)', [id, alimento_id, cantidad, fecha_sugerida], (err, results) => {
    if (err) {
      console.error('Error al agregar el detalle del plan de alimentación:', err);
      res.status(500).json({ error: 'Error al agregar el detalle del plan de alimentación' });
    } else {
      res.json({ message: 'Detalle del plan de alimentación agregado exitosamente' });
    }
  });
});

// Ruta POST para agregar una sugerencia de alimento para un usuario
app.post('/usuarios/:id/sugerencias', (req, res) => {
  const { id } = req.params;
  const { alimento_id, justificacion } = req.body;
  db.query('CALL PostSugerencia(?, ?, ?)', [id, alimento_id, justificacion], (err, results) => {
    if (err) {
      console.error('Error al agregar la sugerencia de alimento:', err);
      res.status(500).json({ error: 'Error al agregar la sugerencia de alimento' });
    } else {
      res.json({ message: 'Sugerencia de alimento agregada exitosamente' });
    }
  });
});

// Ruta POST para agregar un alimento restringido por condición médica

app.post('/condiciones-medicas/:id/alimentos', (req, res) => {
  //const { id } = req.params;
  //const { alimento_id, restriccion } = req.body;
  db.query('CALL PostCondicionAlimento(?, ?, ?)', [id, alimento_id, restriccion], (err, results) => {
    if (err) {
      console.error('Error al agregar el alimento restringido por condición médica:', err);
      res.status(500).json({ error: 'Error al agregar el alimento restringido por condición médica' });
    } else {
      res.json({ message: 'Alimento restringido por condición médica agregado exitosamente' });
    }
  });
});

//Funciones PUT para las tablas: USUARIOS, CONDICIONESMEDICAS, USUARIOCONDICIONES y ALIMENTOS---------------------------------------------------------------------
// Ruta PUT para actualizar un usuario
app.put('/usuarios/:id', (req, res) => {
  const { id } = req.params;
  const { Nombre, ApellidoPaterno, ApellidoMaterno, Sexo, Peso, Altura } = req.body;

  if (!Nombre || !ApellidoPaterno || !ApellidoMaterno || !Sexo || !Peso || !Altura) {
    return res.status(400).json({ error: 'Todos los campos (Nombre, ApellidoPaterno, ApellidoMaterno, Sexo, Peso, Altura) son requeridos' });
  }

  db.query('CALL UpdateUsuario(?, ?, ?, ?, ?, ?, ?)', [id, Nombre, ApellidoPaterno, ApellidoMaterno, Sexo, Peso, Altura], (err, results) => {
    if (err) {
      console.error('Error al actualizar el usuario:', err);
      res.status(500).json({ error: 'Error al actualizar el usuario' });
    } else {
      res.json({ message: 'Usuario actualizado correctamente' });
    }
  });
});

// Ruta PUT para actualizar un alimento
app.put('/alimentos/:id', (req, res) => {
  const { id } = req.params;
  const { nombre, calorias, carbohidratos, proteinas, grasas, fibra, porcion } = req.body;

  if (!nombre || !calorias || !carbohidratos || !proteinas || !grasas || !fibra || !porcion) {
    return res.status(400).json({ error: 'Todos los campos (nombre, calorías, carbohidratos, proteínas, grasas, fibra, porción) son requeridos' });
  }

  db.query('CALL UpdateAlimento(?, ?, ?, ?, ?, ?, ?, ?)', [id, nombre, calorias, carbohidratos, proteinas, grasas, fibra, porcion], (err, results) => {
    if (err) {
      console.error('Error al actualizar el alimento:', err);
      res.status(500).json({ error: 'Error al actualizar el alimento' });
    } else {
      res.json({ message: 'Alimento actualizado correctamente' });
    }
  });
});

// Ruta PUT para actualizar una condición médica
app.put('/condiciones-medicas/:id', (req, res) => {
  const { id } = req.params;
  const { nombre, descripcion } = req.body;

  if (!nombre || !descripcion) {
    return res.status(400).json({ error: 'Los campos (nombre, descripción) son requeridos' });
  }

  db.query('CALL UpdateCondicionMedica(?, ?)', [id, nombre, descripcion], (err, results) => {
    if (err) {
      console.error('Error al actualizar la condición médica:', err);
      res.status(500).json({ error: 'Error al actualizar la condición médica' });
    } else {
      res.json({ message: 'Condición médica actualizada correctamente' });
    }
  });
});

// Ruta PUT para actualizar la condición médica de un usuario
app.put('/usuarios/:id/condiciones/:condicionId', (req, res) => {
  const { id, condicionId } = req.params;

  db.query('CALL UpdateUsuarioCondicion(?, ?)', [id, condicionId], (err, results) => {
    if (err) {
      console.error('Error al actualizar la condición médica del usuario:', err);
      res.status(500).json({ error: 'Error al actualizar la condición médica del usuario' });
    } else {
      res.json({ message: 'Condición médica del usuario actualizada correctamente' });
    }
  });
});
//funiciones PUT parA las tablas CONDICIONESALIMENTOS, SUGERENCIAS, PLANALIMENTACION Y DETALLE PLAN ----------------------------------------------------------------
// Ruta PUT para actualizar un plan de alimentación
app.put('/usuarios/:id/planes-alimentacion/:plan_id', (req, res) => {
  const { id, plan_id } = req.params;
  const { nombre_plan, observacion } = req.body;
  db.query('CALL PutPlanAlimentacion(?, ?, ?, ?)', [id, plan_id, nombre_plan, observacion], (err, results) => {
    if (err) {
      console.error('Error al actualizar el plan de alimentación:', err);
      res.status(500).json({ error: 'Error al actualizar el plan de alimentación' });
    } else {
      res.json({ message: 'Plan de alimentación actualizado exitosamente' });
    }
  });
});

// Ruta PUT para actualizar un detalle del plan de alimentación
app.put('/planes-alimentacion/:id/detalles/:detalle_id', (req, res) => {
  const { id, detalle_id } = req.params;
  const { alimento_id, cantidad, fecha_sugerida } = req.body;
  db.query('CALL PutDetallePlan(?, ?, ?, ?, ?)', [id, detalle_id, alimento_id, cantidad, fecha_sugerida], (err, results) => {
    if (err) {
      console.error('Error al actualizar el detalle del plan de alimentación:', err);
      res.status(500).json({ error: 'Error al actualizar el detalle del plan de alimentación' });
    } else {
      res.json({ message: 'Detalle del plan de alimentación actualizado exitosamente' });
    }
  });
});

// Ruta PUT para actualizar una sugerencia de alimento para un usuario
app.put('/usuarios/:id/sugerencias/:sugerencia_id', (req, res) => {
  const { id, sugerencia_id } = req.params;
  const { alimento_id, justificacion } = req.body;
  db.query('CALL PutSugerencia(?, ?, ?, ?)', [id, sugerencia_id, alimento_id, justificacion], (err, results) => {
    if (err) {
      console.error('Error al actualizar la sugerencia de alimento:', err);
      res.status(500).json({ error: 'Error al actualizar la sugerencia de alimento' });
    } else {
      res.json({ message: 'Sugerencia de alimento actualizada exitosamente' });
    }
  });
});

// Ruta PUT para actualizar un alimento restringido por condición médica
app.put('/condiciones-medicas/:id/alimentos/:alimento_id', (req, res) => {
  const { id, alimento_id } = req.params;
  const { restriccion } = req.body;
  db.query('CALL PutCondicionAlimento(?, ?, ?)', [id, alimento_id, restriccion], (err, results) => {
    if (err) {
      console.error('Error al actualizar el alimento restringido por condición médica:', err);
      res.status(500).json({ error: 'Error al actualizar el alimento restringido por condición médica' });
    } else {
      res.json({ message: 'Alimento restringido por condición médica actualizado exitosamente' });
    }
  });
});

//Funciones DELETE para las tablas:  USUARIOS, CONDICIONESMEDICAS, USUARIOCONDICIONES y ALIMENTOS---------------------------------------------------------------------
// Ruta DELETE para eliminar un usuario
app.delete('/usuarios/:id', (req, res) => {
  const { id } = req.params;

  db.query('CALL DeleteUsuario(?)', [id], (err, results) => {
    if (err) {
      console.error('Error al eliminar el usuario:', err);
      res.status(500).json({ error: 'Error al eliminar el usuario' });
    } else {
      res.json({ message: 'Usuario eliminado correctamente' });
    }
  });
});

// Ruta DELETE para eliminar un alimento
app.delete('/alimentos/:id', (req, res) => {
  const { id } = req.params;

  db.query('CALL DeleteAlimento(?)', [id], (err, results) => {
    if (err) {
      console.error('Error al eliminar el alimento:', err);
      res.status(500).json({ error: 'Error al eliminar el alimento' });
    } else {
      res.json({ message: 'Alimento eliminado correctamente' });
    }
  });
});

// Ruta DELETE para eliminar una condición médica
app.delete('/condiciones-medicas/:id', (req, res) => {
  const { id } = req.params;

  db.query('CALL DeleteCondicionMedica(?)', [id], (err, results) => {
    if (err) {
      console.error('Error al eliminar la condición médica:', err);
      res.status(500).json({ error: 'Error al eliminar la condición médica' });
    } else {
      res.json({ message: 'Condición médica eliminada correctamente' });
    }
  });
});

// Ruta DELETE para eliminar una condición médica de un usuario
app.delete('/usuarios/:id/condiciones/:condicionId', (req, res) => {
  const { id, condicionId } = req.params;

  db.query('CALL DeleteUsuarioCondicion(?, ?)', [id, condicionId], (err, results) => {
    if (err) {
      console.error('Error al eliminar la condición médica del usuario:', err);
      res.status(500).json({ error: 'Error al eliminar la condición médica del usuario' });
    } else {
      res.json({ message: 'Condición médica del usuario eliminada correctamente' });
    }
  });
});

//funiciones DELETE par las tablas CONDICIONESALIMENTOS, SUGERENCIAS, PLANALIMENTACION Y DETALLE PLAN ----------------------------------------------------------------
// Ruta DELETE para eliminar un plan de alimentación
app.delete('/usuarios/:id/planes-alimentacion/:plan_id', (req, res) => {
  const { id, plan_id } = req.params;
  db.query('CALL DeletePlanAlimentacion(?, ?)', [id, plan_id], (err, results) => {
    if (err) {
      console.error('Error al eliminar el plan de alimentación:', err);
      res.status(500).json({ error: 'Error al eliminar el plan de alimentación' });
    } else {
      res.json({ message: 'Plan de alimentación eliminado exitosamente' });
    }
  });
});

// Ruta DELETE para eliminar un detalle del plan de alimentación
app.delete('/planes-alimentacion/:id/detalles/:detalle_id', (req, res) => {
  const { id, detalle_id } = req.params;
  db.query('CALL DeleteDetallePlan(?, ?)', [id, detalle_id], (err, results) => {
    if (err) {
      console.error('Error al eliminar el detalle del plan de alimentación:', err);
      res.status(500).json({ error: 'Error al eliminar el detalle del plan de alimentación' });
    } else {
      res.json({ message: 'Detalle del plan de alimentación eliminado exitosamente' });
    }
  });
});

// Ruta DELETE para eliminar una sugerencia de alimento
app.delete('/usuarios/:id/sugerencias/:sugerencia_id', (req, res) => {
  const { id, sugerencia_id } = req.params;
  db.query('CALL DeleteSugerencia(?, ?)', [id, sugerencia_id], (err, results) => {
    if (err) {
      console.error('Error al eliminar la sugerencia de alimento:', err);
      res.status(500).json({ error: 'Error al eliminar la sugerencia de alimento' });
    } else {
      res.json({ message: 'Sugerencia de alimento eliminada exitosamente' });
    }
  });
});

// Ruta DELETE para eliminar un alimento restringido por condición médica
app.delete('/condiciones-medicas/:id/alimentos/:condicion_alimento_id', (req, res) => {
  const { id, condicion_alimento_id } = req.params;
  db.query('CALL DeleteCondicionAlimento(?, ?)', [id, condicion_alimento_id], (err, results) => {
    if (err) {
      console.error('Error al eliminar el alimento restringido por condición médica:', err);
      res.status(500).json({ error: 'Error al eliminar el alimento restringido por condición médica' });
    } else {
      res.json({ message: 'Alimento restringido por condición médica eliminado exitosamente' });
    }
  });
});





// Levantar el servidor en el puerto especificado
app.listen(port, () => {
  console.log(`Servidor levantado en http://localhost:${port}`);
});
