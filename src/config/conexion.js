const mysql = require('mysql2/promise');

const conexion = mysql.createPool({ 
    host: 'localhost',
    user: 'root',
    password: '9902',
    database: 'nutricion'
});

module.exports = conexion; // Exportamos la conexión para usarla en el backend
