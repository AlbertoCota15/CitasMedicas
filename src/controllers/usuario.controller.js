const md5 = require('md5');
const { Op } = require('sequelize');
const Usuario = require('../models/usuario.model');

const obtenerUsuarios = async (req, res) => {
  try {
    const usuarios = await Usuario.findAll({
      attributes: { exclude: ['contrasena'] },
      order: [['createdAt', 'DESC']],
    });
    return res.status(200).json({ ok: true, total: usuarios.length, data: usuarios });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor' });
  }
};

const crearUsuario = async (req, res) => {
  try {
    const { nombre, apellido, usuario, correo, telefono, contrasena, id_rol, cedula, consultorio, duracion_cita } = req.body;

    if (!nombre || !apellido || !usuario || !correo || !contrasena || !id_rol) {
      return res.status(400).json({ ok: false, mensaje: 'Todos los campos obligatorios son requeridos' });
    }

    const usuarioExiste = await Usuario.findOne({ where: { usuario } });
    if (usuarioExiste) return res.status(400).json({ ok: false, mensaje: 'El nombre de usuario ya existe' });

    const correoExiste = await Usuario.findOne({ where: { correo } });
    if (correoExiste) return res.status(400).json({ ok: false, mensaje: 'El correo ya está registrado' });

    const nuevoUsuario = await Usuario.create({
      id: md5(usuario + correo + Date.now()),
      nombre,
      apellido,
      usuario,
      correo,
      telefono: telefono || null,
      contrasena: md5(contrasena),
      id_rol: parseInt(id_rol),
    });

    // Si es doctor crear registro en tabla doctores
    if (parseInt(id_rol) === 2) {
      const Doctor = require('../models/doctor.model');
      await Doctor.create({
        id: md5('doctor' + nuevoUsuario.id + Date.now()),
        id_usuario: nuevoUsuario.id,
        cedula: cedula || 'N/A',
        consultorio: consultorio || null,
        duracion_cita: duracion_cita || 30,
        estado: 'activo',
      });
    }

    return res.status(201).json({ ok: true, mensaje: 'Usuario creado correctamente', data: nuevoUsuario });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor' });
  }
};

const editarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, apellido, telefono, correo, id_rol } = req.body;

    const usuario = await Usuario.findOne({ where: { id } });
    if (!usuario) return res.status(404).json({ ok: false, mensaje: 'Usuario no encontrado' });

    const correoExiste = await Usuario.findOne({ where: { correo, id: { [Op.ne]: id } } });
    if (correoExiste) return res.status(400).json({ ok: false, mensaje: 'El correo ya está en uso' });

    await usuario.update({ nombre, apellido, telefono, correo, id_rol: parseInt(id_rol) });

    return res.status(200).json({ ok: true, mensaje: 'Usuario actualizado correctamente' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor' });
  }
};

const eliminarUsuario = async (req, res) => {
  try {
    const { id } = req.params;

    const usuario = await Usuario.findOne({ where: { id } });
    if (!usuario) return res.status(404).json({ ok: false, mensaje: 'Usuario no encontrado' });

    if (usuario.id_rol === 1) {
      return res.status(400).json({ ok: false, mensaje: 'No puedes eliminar un administrador' });
    }

    await usuario.destroy();

    return res.status(200).json({ ok: true, mensaje: 'Usuario eliminado correctamente' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor' });
  }
};

module.exports = { obtenerUsuarios, crearUsuario, editarUsuario, eliminarUsuario };