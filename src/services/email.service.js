const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const enviarContrasenaTemp = async (correo, nombre, contrasenaTemp) => {
  await transporter.sendMail({
    from: `"Citas Médicas" <${process.env.EMAIL_USER}>`,
    to: correo,
    subject: 'Recuperación de contraseña',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">Recuperación de contraseña</h2>
        <p>Hola <strong>${nombre}</strong>,</p>
        <p>Recibimos una solicitud para recuperar tu contraseña. Tu nueva contraseña temporal es:</p>
        <div style="background-color: #f4f4f4; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0;">
          <h3 style="color: #e74c3c; letter-spacing: 3px;">${contrasenaTemp}</h3>
        </div>
        <p>Por seguridad te recomendamos cambiarla después de iniciar sesión.</p>
        <p style="color: #7f8c8d; font-size: 12px;">Si no solicitaste este cambio ignora este correo.</p>
      </div>
    `,
  });
};

module.exports = { enviarContrasenaTemp };