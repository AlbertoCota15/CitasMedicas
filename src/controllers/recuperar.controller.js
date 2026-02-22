const md5 = require('md5');
const Usuario = require('../models/usuario.model');
const { enviarContrasenaTemp } = require('../services/email.service');

const recuperarContrasena = async (req, res) => {
  try {
    const { correo } = req.body;

    const usuario = await Usuario.findOne({ where: { correo } });
    if (!usuario) {
      return res.status(404).json({ ok: false, mensaje: 'No existe una cuenta con ese correo' });
    }

    // Generar contraseña aleatoria de 8 caracteres
    const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let contrasenaTemp = '';
    for (let i = 0; i < 8; i++) {
      contrasenaTemp += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
    }

    // Actualizar contraseña en BD
    await usuario.update({ contrasena: md5(contrasenaTemp) });

    // Enviar correo
    await enviarContrasenaTemp(usuario.correo, usuario.nombre, contrasenaTemp);

    return res.status(200).json({
      ok: true,
      mensaje: 'Se ha enviado una contraseña temporal a tu correo',
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor' });
  }
};

module.exports = { recuperarContrasena };