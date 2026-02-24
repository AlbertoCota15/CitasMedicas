const md5 = require('md5');
const Notificacion = require('../models/notificacion.model');
const Usuario = require('../models/usuario.model');
// Obtener todas las notificaciones del usuario
const obtenerNotificaciones = async (req, res) => {
  try {
    const id_usuario = req.usuario.id;

    const notificaciones = await Notificacion.findAll({
      where: { id_usuario },
      order: [['createdAt', 'DESC']],
    });

    return res.status(200).json({
      ok: true,
      total: notificaciones.length,
      data: notificaciones,
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor' });
  }
};

// Obtener notificaciones no leídas
const obtenerNoLeidas = async (req, res) => {
  try {
    const id_usuario = req.usuario.id;

    const notificaciones = await Notificacion.findAll({
      where: { id_usuario, leida: false },
      order: [['createdAt', 'DESC']],
    });

    return res.status(200).json({
      ok: true,
      total: notificaciones.length,
      data: notificaciones,
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor' });
  }
};

// Marcar una notificación como leída
const marcarLeida = async (req, res) => {
  try {
    const { id } = req.params;
    const id_usuario = req.usuario.id;

    const notificacion = await Notificacion.findOne({ where: { id, id_usuario } });
    if (!notificacion) {
      return res.status(404).json({ ok: false, mensaje: 'Notificación no encontrada' });
    }

    await notificacion.update({ leida: true });

    return res.status(200).json({ ok: true, mensaje: 'Notificación marcada como leída' });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor' });
  }
};

// Marcar todas las notificaciones como leídas
const marcarTodasLeidas = async (req, res) => {
  try {
    const id_usuario = req.usuario.id;

    await Notificacion.update(
      { leida: true },
      { where: { id_usuario, leida: false } }
    );

    return res.status(200).json({ ok: true, mensaje: 'Todas las notificaciones marcadas como leídas' });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor' });
  }
};

const enviarNotificacion = async (req, res) => {
  try {
    const { id_usuario, titulo, mensaje } = req.body;

    const usuario = await Usuario.findOne({ where: { id: id_usuario } });
    if (!usuario) return res.status(404).json({ ok: false, mensaje: 'Usuario no encontrado' });

    await Notificacion.create({
      id: md5(id_usuario + titulo + Date.now()),
      id_usuario,
      id_cita: null,
      titulo,
      mensaje,
      leida: false,
    });

    return res.status(201).json({ ok: true, mensaje: 'Notificación enviada correctamente' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor' });
  }
};

const enviarNotificacionTodos = async (req, res) => {
  try {
    const { titulo, mensaje } = req.body;

    const usuarios = await Usuario.findAll();
    await Promise.all(usuarios.map(async (u) => {
      await Notificacion.create({
        id: md5(u.id + titulo + Date.now() + Math.random()),
        id_usuario: u.id,
        id_cita: null,
        titulo,
        mensaje,
        leida: false,
      });
    }));

    return res.status(201).json({ ok: true, mensaje: `Notificación enviada a ${usuarios.length} usuarios` });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor' });
  }
};

module.exports = { obtenerNotificaciones, obtenerNoLeidas, marcarLeida, marcarTodasLeidas, enviarNotificacion, enviarNotificacionTodos };