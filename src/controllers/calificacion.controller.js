const md5 = require('md5');
const Calificacion = require('../models/calificacion.model');
const Cita = require('../models/cita.model');
const Doctor = require('../models/doctor.model');
const Usuario = require('../models/usuario.model');

// Calificar doctor
const calificarDoctor = async (req, res) => {
  try {
    const { id_cita, calificacion, resena } = req.body;
    const id_paciente = req.usuario.id;

    // Verificar que la cita existe y está completada
    const cita = await Cita.findOne({ where: { id: id_cita } });
    if (!cita) {
      return res.status(404).json({ ok: false, mensaje: 'Cita no encontrada' });
    }

    if (cita.estado !== 'completada') {
      return res.status(400).json({ ok: false, mensaje: 'Solo puedes calificar citas completadas' });
    }

    // Verificar que la cita pertenece al paciente
    if (cita.id_paciente !== id_paciente) {
      return res.status(403).json({ ok: false, mensaje: 'No tienes permisos para calificar esta cita' });
    }

    // Verificar que no haya calificado ya esta cita
    const yaCalifico = await Calificacion.findOne({ where: { id_cita } });
    if (yaCalifico) {
      return res.status(400).json({ ok: false, mensaje: 'Ya calificaste esta cita' });
    }

    // Verificar que la calificación sea entre 1 y 5
    if (calificacion < 1 || calificacion > 5) {
      return res.status(400).json({ ok: false, mensaje: 'La calificación debe ser entre 1 y 5' });
    }

    const nuevaCalificacion = await Calificacion.create({
      id: md5(id_paciente + id_cita + Date.now()),
      id_paciente,
      id_doctor: cita.id_doctor,
      id_cita,
      calificacion,
      resena: resena || null,
    });

    return res.status(201).json({
      ok: true,
      mensaje: 'Calificación registrada correctamente',
      data: nuevaCalificacion,
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor' });
  }
};

// Obtener calificaciones de un doctor
const obtenerCalificaciones = async (req, res) => {
  try {
    const { id_doctor } = req.params;

    const calificaciones = await Calificacion.findAll({
      where: { id_doctor },
      order: [['createdAt', 'DESC']],
    });

    // Calcular promedio
    const promedio = calificaciones.length > 0
      ? (calificaciones.reduce((acc, c) => acc + c.calificacion, 0) / calificaciones.length).toFixed(1)
      : 0;

    // Obtener nombre del paciente de cada calificación
    const detalle = await Promise.all(calificaciones.map(async (c) => {
      const paciente = await Usuario.findOne({
        where: { id: c.id_paciente },
        attributes: ['nombre', 'apellido'],
      });
      return {
        id: c.id,
        calificacion: c.calificacion,
        resena: c.resena,
        paciente: `${paciente.nombre} ${paciente.apellido}`,
        fecha: c.createdAt,
      };
    }));

    return res.status(200).json({
      ok: true,
      promedio: parseFloat(promedio),
      total_calificaciones: calificaciones.length,
      data: detalle,
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor' });
  }
};

module.exports = { calificarDoctor, obtenerCalificaciones };