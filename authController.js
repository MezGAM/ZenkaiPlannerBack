const db = require('../config/db'); // Tu conexión a MySQL
const bcrypt = require('bcryptjs');
const { enviarBienvenida } = require('../utils/mailer');

exports.registrar = async (req, res) => {
    try {
        const { username, email, password, mascota } = req.body;

        // 1. Encriptar contraseña con Bcrypt
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // 2. Insertar en MySQL
        const sql = 'INSERT INTO usuarios (username, email, password, mascota_elegida) VALUES (?, ?, ?, ?)';
        db.query(sql, [username, email, passwordHash, mascota], async (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: "Error en la base de datos" });
            }

            // 3. Enviar correo de bienvenida
            try {
                await enviarBienvenida(email, username);
            } catch (mailErr) {
                console.log("Error al enviar correo, pero usuario creado.");
            }

            res.status(201).json({ mensaje: "Usuario creado con éxito" });
        });
    } catch (error) {
        res.status(500).json({ error: "Error al procesar el registro" });
    }
};