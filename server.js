require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const { enviarBienvenida } = require('mailer');

const app = express();
app.use(express.json());
app.use(cors());

const connectionConfig = {
  host: process.env.TIDB_HOST,
  port: process.env.TIDB_PORT,
  user: process.env.TIDB_USER,
  password: process.env.TIDB_PASSWORD,
  database: process.env.TIDB_DATABASE,
  ssl: {
    minVersion: 'TLSv1.2',
    rejectUnauthorized: true 
  }
};

const pool = mysql.createPool(connectionConfig);
module.exports = pool;

app.post('/api/auth/registrar', async (req, res) => {
    const { email, username, password, mascota } = req.body;
    
    try {
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const query = 'INSERT INTO usuarios (email, username, password, mascota_elegida) VALUES (?, ?, ?, ?)';

        db.query(query, [email, username, passwordHash, mascota], async (err, result) => {
            if (err) {
                console.error('Error en DB al registrar:', err.message);
                return res.status(500).json({ error: 'Error al registrar en la base de datos' });
            }

            try {
                await enviarBienvenida(email, username);
            } catch (mailError) {
                console.error('Usuario creado, pero correo falló');
            }

            res.status(200).json({ mensaje: '¡Registro exitoso!' });
        });
    } catch (error) {
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;

    const sql = 'SELECT * FROM usuarios WHERE username = ?';
    db.query(sql, [username], async (err, results) => {
        if (err) return res.status(500).json({ error: "Error en el servidor" });
        
        if (results.length === 0) {
            return res.status(401).json({ error: "El usuario no existe" });
        }

        const usuario = results[0];

        const coinciden = await bcrypt.compare(password, usuario.password);

        if (coinciden) {
            res.status(200).json({ 
                mensaje: "Login correcto", 
                username: usuario.username,
                mascota: usuario.mascota_elegida 
            });
        } else {
            res.status(401).json({ error: "Contraseña incorrecta" });
        }
    });
});

app.post('/api/tareas', (req, res) => {
    const { username, fecha, titulo, hora } = req.body;
    const query = 'INSERT INTO tareas (username, fecha, titulo, hora) VALUES (?, ?, ?, ?)';
    
    db.query(query, [username, fecha, titulo, hora], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json({ mensaje: 'Tarea guardada', id: result.insertId });
    });
});

app.get('/api/tareas/:username', (req, res) => {
    const username = req.params.username;
    const query = 'SELECT * FROM tareas WHERE username = ?';
    
    db.query(query, [username], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json(results);
    });
});

app.delete('/api/tareas/:id', (req, res) => {
    const id = req.params.id;
    db.query('DELETE FROM tareas WHERE id = ?', [id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json({ mensaje: 'Tarea eliminada' });
    });
});

app.post('/api/metas', (req, res) => {
    const { username, texto } = req.body;
    const sql = 'INSERT INTO metas (username, texto) VALUES (?, ?)';
    db.query(sql, [username, texto], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json({ id: result.insertId });
    });
});

app.get('/api/metas/:username', (req, res) => {
    const { username } = req.params;
    const sql = 'SELECT * FROM metas WHERE username = ?';
    db.query(sql, [username], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json(results);
    });
});

app.delete('/api/metas/:id', (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM metas WHERE id = ?', [id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json({ mensaje: "Meta eliminada" });
    });
});

app.patch('/api/tareas/:id', (req, res) => {
    const { id } = req.params;
    const valorCompletada = req.body.completada ? 1 : 0; 

    const sql = 'UPDATE tareas SET completada = ? WHERE id = ?';
    db.query(sql, [valorCompletada, id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json({ mensaje: "Actualizado" });
    });
});

app.patch('/api/metas/:id', (req, res) => {
    const { id } = req.params;
    const { completada } = req.body;
    const sql = 'UPDATE metas SET completada = ? WHERE id = ?';
    db.query(sql, [completada, id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json({ mensaje: "estado de meta actualizado" });
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Servidor Zenkai corriendo en puerto ${PORT} `));
