require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const { enviarBienvenida } = require('./mailer');

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

app.post('/api/auth/registrar', async (req, res) => {
    const { email, username, password, mascota } = req.body;
    try {
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);
        const query = 'INSERT INTO usuarios (username, password, mascota_elegida, email) VALUES (?, ?, ?, ?)';
        await pool.query(query, [username, passwordHash, mascota, email]);

        try {
            await enviarBienvenida(email, username);
        } catch (mailError) {
            console.error('Usuario creado, pero el envío de correo falló');
        }

        res.status(200).json({ mensaje: '¡Registro exitoso!' });
    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({ error: 'Error al registrar en la base de datos' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const sql = 'SELECT * FROM usuarios WHERE username = ?';
        const [results] = await pool.query(sql, [username]);

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
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ error: "Error en el servidor" });
    }
});


app.post('/api/tareas', async (req, res) => {
    const { username, fecha, titulo, hora } = req.body;
    try {
        const query = 'INSERT INTO tareas (username, fecha, titulo, hora) VALUES (?, ?, ?, ?)';
        const [result] = await pool.query(query, [username, fecha, titulo, hora]);
        res.status(200).json({ mensaje: 'Tarea guardada', id: result.insertId });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/tareas/:username', async (req, res) => {
    const username = req.params.username;
    try {
        const query = 'SELECT * FROM tareas WHERE username = ?';
        const [results] = await pool.query(query, [username]);
        res.status(200).json(results);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/tareas/:id', async (req, res) => {
    const id = req.params.id;
    try {
        await pool.query('DELETE FROM tareas WHERE id = ?', [id]);
        res.status(200).json({ mensaje: 'Tarea eliminada' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.patch('/api/tareas/:id', async (req, res) => {
    const { id } = req.params;
    const valorCompletada = req.body.completada ? 1 : 0; 
    try {
        const sql = 'UPDATE tareas SET completada = ? WHERE id = ?';
        await pool.query(sql, [valorCompletada, id]);
        res.status(200).json({ mensaje: "Actualizado" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/metas', async (req, res) => {
    const { username, texto } = req.body;
    try {
        const sql = 'INSERT INTO metas (username, texto) VALUES (?, ?)';
        const [result] = await pool.query(sql, [username, texto]);
        res.status(200).json({ id: result.insertId });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/metas/:username', async (req, res) => {
    const { username } = req.params;
    try {
        const sql = 'SELECT * FROM metas WHERE username = ?';
        const [results] = await pool.query(sql, [username]);
        res.status(200).json(results);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/metas/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM metas WHERE id = ?', [id]);
        res.status(200).json({ mensaje: "Meta eliminada" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.patch('/api/metas/:id', async (req, res) => {
    const { id } = req.params;
    const { completada } = req.body;
    try {
        const sql = 'UPDATE metas SET completada = ? WHERE id = ?';
        await pool.query(sql, [completada, id]);
        res.status(200).json({ mensaje: "estado de meta actualizado" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 10000; 
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor Zenkai corriendo en puerto ${PORT}`);
});