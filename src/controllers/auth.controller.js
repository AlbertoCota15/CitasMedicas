const md5 = require('md5');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const Usuario = require('../models/usuario.model');

const registrarUsuario = async (req, res) => {
  try {
    const { nombre, apellido, usuario, correo, telefono, direccion, contrasena } = req.body;

    const correoExiste = await Usuario.findOne({ where: { correo } });
    if (correoExiste) {
      return res.status(400).json({ ok: false, mensaje: 'El correo ya está registrado' });
    }

    const usuarioExiste = await Usuario.findOne({ where: { usuario } });
    if (usuarioExiste) {
      return res.status(400).json({ ok: false, mensaje: 'El nombre de usuario ya está en uso' });
    }

    const nuevoUsuario = await Usuario.create({
      id: md5(correo + Date.now()),
      nombre,
      apellido,
      usuario,
      correo,
      telefono: telefono || null,
      direccion: direccion || null,
      contrasena: md5(contrasena),
    });

    return res.status(201).json({
      ok: true,
      mensaje: 'Usuario registrado correctamente',
      data: {
        id: nuevoUsuario.id,
        nombre: nuevoUsuario.nombre,
        apellido: nuevoUsuario.apellido,
        usuario: nuevoUsuario.usuario,
        correo: nuevoUsuario.correo,
      },
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor' });
  }
};

const loginUsuario = async (req, res) => {
  try {
    const { identificador, contrasena } = req.body;

    const usuario = await Usuario.findOne({
      where: {
        [Op.or]: [
          { correo: identificador },
          { usuario: identificador },
        ],
      },
    });

    if (!usuario) {
      return res.status(400).json({ ok: false, mensaje: 'Credenciales incorrectas' });
    }

    const contrasenaValida = usuario.contrasena === md5(contrasena);
    if (!contrasenaValida) {
      return res.status(400).json({ ok: false, mensaje: 'Credenciales incorrectas' });
    }

    const token = jwt.sign(
      {
        id: usuario.id,
        usuario: usuario.usuario,
        correo: usuario.correo,
        id_rol: usuario.id_rol,
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.status(200).json({
      ok: true,
      mensaje: 'Login correcto',
      token,
      data: {
        id: usuario.id,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        usuario: usuario.usuario,
        correo: usuario.correo,
        id_rol: usuario.id_rol,
      },
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor' });
  }
};

const obtenerUsuarios = async (req, res) => {
  try {
    const usuarios = await Usuario.findAll({
      attributes: ['id', 'nombre', 'apellido', 'usuario', 'correo', 'telefono', 'id_rol', 'createdAt'],
      order: [['createdAt', 'DESC']],
    });
    return res.status(200).json({ ok: true, total: usuarios.length, data: usuarios });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor' });
  }
};

module.exports = { registrarUsuario, loginUsuario, obtenerUsuarios };