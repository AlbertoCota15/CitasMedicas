const md5 = require('md5');
const Notificacion = require('../models/notificacion.model');

const crearNotificacion = async (id_usuario, titulo, mensaje) => {
  try {
    await Notificacion.create({
      id: md5(id_usuario + titulo + Date.now() + Math.random()),
      id_usuario,
      titulo,
      mensaje,
      leida: false,
    });
  } catch (error) {
    console.error('Error al crear notificación:', error);
  }
};

module.exports = { crearNotificacion };