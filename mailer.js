const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const enviarBienvenida = async (email, nombre) => {
    await transporter.sendMail({
        from: '"Zenkai Team" <tu-correo@gmail.com>',
        to: email,
        subject: "¡Bienvenido a Zenkai! 🐾",
        html: `<b>Hola ${nombre}!</b><p>Tu cuenta ha sido creada con éxito.</p>`
    });
};

module.exports = { enviarBienvenida };