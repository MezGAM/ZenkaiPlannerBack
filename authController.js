const db = require('../config/db'); 
const bcrypt = require('bcryptjs');
const { enviarBienvenida } = require('mailer');

exports.registrar = async (req, res) => {
    try {
        const { username, email, password, mascota } = req.body;

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const sql = 'INSERT INTO usuarios (username, email, password, mascota_elegida) VALUES (?, ?, ?, ?)';
        db.query(sql, [username, email, passwordHash, mascota], async (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: "Error en la base de datos" });
            }

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