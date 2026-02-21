const md5 = require('md5');
const Usuario = require('../models/usuario.model');

// Ver perfil
const verPerfil = async (req, res) => {
  try {
    const id = req.usuario.id;

    const usuario = await Usuario.findOne({
      where: { id },
      attributes: ['id', 'nombre', 'apellido', 'usuario', 'correo', 'telefono', 'direccion', 'id_rol', 'createdAt'],
    });

    if (!usuario) {
      return res.status(404).json({ ok: false, mensaje: 'Usuario no encontrado' });
    }

    return res.status(200).json({ ok: true, data: usuario });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor' });
  }
};

// Editar perfil
const editarPerfil = async (req, res) => {
  try {
    const id = req.usuario.id;
    const { nombre, apellido, telefono, direccion } = req.body;

    const usuario = await Usuario.findOne({ where: { id } });
    if (!usuario) {
      return res.status(404).json({ ok: false, mensaje: 'Usuario no encontrado' });
    }

    await usuario.update({
      nombre: nombre || usuario.nombre,
      apellido: apellido || usuario.apellido,
      telefono: telefono || usuario.telefono,
      direccion: direccion || usuario.direccion,
    });

    return res.status(200).json({
      ok: true,
      mensaje: 'Perfil actualizado correctamente',
      data: {
        id: usuario.id,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        usuario: usuario.usuario,
        correo: usuario.correo,
        telefono: usuario.telefono,
        direccion: usuario.direccion,
      },
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor' });
  }
};

// Cambiar contraseña
const cambiarContrasena = async (req, res) => {
  try {
    const id = req.usuario.id;
    const { contrasena_actual, nueva_contrasena, confirmar_contrasena } = req.body;

    const usuario = await Usuario.findOne({ where: { id } });
    if (!usuario) {
      return res.status(404).json({ ok: false, mensaje: 'Usuario no encontrado' });
    }

    if (usuario.contrasena !== md5(contrasena_actual)) {
      return res.status(400).json({ ok: false, mensaje: 'La contraseña actual es incorrecta' });
    }

    if (nueva_contrasena !== confirmar_contrasena) {
      return res.status(400).json({ ok: false, mensaje: 'Las contraseñas no coinciden' });
    }

    if (nueva_contrasena.length < 6) {
      return res.status(400).json({ ok: false, mensaje: 'La contraseña debe tener al menos 6 caracteres' });
    }

    await usuario.update({ contrasena: md5(nueva_contrasena) });

    return res.status(200).json({ ok: true, mensaje: 'Contraseña actualizada correctamente' });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor' });
  }
};

module.exports = { verPerfil, editarPerfil, cambiarContrasena };