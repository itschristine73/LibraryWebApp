const mysql = require('mysql2');
require('dotenv').config()

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,       // ← Update this
    password: process.env.DB_PWD, // ← Update this
    database: process.env.DB_NAME   // ← Should match your created DB
});

db.connect((err) => {
    if (err) throw err;
    console.log(' MySQL connected');
});

module.exports = db;
