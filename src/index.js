const express = require('express');
const mysql = require('mysql2');
const app = express();

// Middleware para analizar JSON
app.use(express.json());

// Crear conexión a la base de datos
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root', // Usa tu usuario de MySQL
  password: '', // Usa tu contraseña de MySQL
  database: 'sistema_nutricion'
});

// Verificar conexión
db.connect((err) => {
  if (err) {
    console.error('Error de conexión a la base de datos:', err);
  } else {
    console.log('Conexión exitosa a la base de datos');
  }
});

// Iniciar servidor
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
