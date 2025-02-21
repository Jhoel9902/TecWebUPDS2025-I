// Importar dependencias
const express = require('express');
const mysql = require('mysql2');
const app = express();
const port = 3000;

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root', 
  password: '9902',
  database: 'Nutricion'
});

// Conexión a la base de datos
db.connect((err) => {
  if (err) {
    console.error('Error al conectar a la base de datos:', err);
    return;
  }
  console.log('Conectado a la base de datos MySQL');
});

// Middleware para parsear JSON en el cuerpo de las peticiones
app.use(express.json());

// Ruta de prueba para asegurarnos de que el servidor está corriendo
app.get('/', (req, res) => {
  res.send('¡Servidor de Nutrición funcionando!');
});


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
});
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

// Ruta POST para agregar un nuevo usuario
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

// Ruta POST para agregar un nuevo plan de alimentación
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
  const { id } = req.params;
  const { alimento_id, restriccion } = req.body;
  db.query('CALL PostCondicionAlimento(?, ?, ?)', [id, alimento_id, restriccion], (err, results) => {
    if (err) {
      console.error('Error al agregar el alimento restringido por condición médica:', err);
      res.status(500).json({ error: 'Error al agregar el alimento restringido por condición médica' });
    } else {
      res.json({ message: 'Alimento restringido por condición médica agregado exitosamente' });
    }
  });
});

// Levantar el servidor en el puerto especificado
app.listen(port, () => {
  console.log(`Servidor levantado en http://localhost:${port}`);
});
