const Notificacion = require('../models/notificacion.model');

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

module.exports = { obtenerNotificaciones, obtenerNoLeidas, marcarLeida, marcarTodasLeidas };