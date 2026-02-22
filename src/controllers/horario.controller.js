const md5 = require('md5');
const HorarioDoctor = require('../models/horario_doctor.model');
const Doctor = require('../models/doctor.model');

// Agregar horario (solo doctor)
const agregarHorario = async (req, res) => {
  try {
    const { dia_semana, hora_inicio, hora_fin } = req.body;
    const id_usuario = req.usuario.id;

    // Buscar el doctor por id_usuario
    const doctor = await Doctor.findOne({ where: { id_usuario, estado: 'activo' } });
    if (!doctor) {
      return res.status(404).json({ ok: false, mensaje: 'Doctor no encontrado o no aprobado' });
    }

    const id_doctor = doctor.id;

    const existe = await HorarioDoctor.findOne({ where: { id_doctor, dia_semana } });
    if (existe) {
      return res.status(400).json({ ok: false, mensaje: 'Ya existe un horario para ese día' });
    }

    const nuevoHorario = await HorarioDoctor.create({
      id: md5(id_doctor + dia_semana + Date.now()),
      id_doctor,
      dia_semana,
      hora_inicio,
      hora_fin,
      disponible: true,
    });

    return res.status(201).json({ ok: true, mensaje: 'Horario agregado correctamente', data: nuevoHorario });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor' });
  }
};

// Obtener horarios de un doctor
const obtenerHorarios = async (req, res) => {
  try {
    const { id_doctor } = req.params;

    const horarios = await HorarioDoctor.findAll({
      where: { id_doctor, disponible: true },
      order: [['dia_semana', 'ASC']],
    });

    return res.status(200).json({ ok: true, total: horarios.length, data: horarios });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor' });
  }
};

// Actualizar horario
const actualizarHorario = async (req, res) => {
  try {
    const { id } = req.params;
    const { hora_inicio, hora_fin, disponible } = req.body;

    const horario = await HorarioDoctor.findOne({ where: { id } });
    if (!horario) {
      return res.status(404).json({ ok: false, mensaje: 'Horario no encontrado' });
    }

    await horario.update({
      hora_inicio: hora_inicio || horario.hora_inicio,
      hora_fin: hora_fin || horario.hora_fin,
      disponible: disponible !== undefined ? disponible : horario.disponible,
    });

    return res.status(200).json({ ok: true, mensaje: 'Horario actualizado correctamente', data: horario });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor' });
  }
};

const obtenerMisHorarios = async (req, res) => {
  try {
    const id_usuario = req.usuario.id;
    const doctor = await Doctor.findOne({ where: { id_usuario } });
    if (!doctor) {
      return res.status(404).json({ ok: false, mensaje: 'Doctor no encontrado' });
    }

    const horarios = await HorarioDoctor.findAll({
      where: { id_doctor: doctor.id },
      order: [['dia_semana', 'ASC']],
    });

    return res.status(200).json({ ok: true, total: horarios.length, data: horarios });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor' });
  }
};

module.exports = { agregarHorario, obtenerHorarios, actualizarHorario, obtenerMisHorarios };
