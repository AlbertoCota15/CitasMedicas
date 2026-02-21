const md5 = require('md5');
const Especialidad = require('../models/especialidad.model');

// Agregar especialidad (solo admin)
const agregarEspecialidad = async (req, res) => {
  try {
    const { nombre, descripcion } = req.body;

    const existe = await Especialidad.findOne({ where: { nombre } });
    if (existe) {
      return res.status(400).json({ ok: false, mensaje: 'La especialidad ya existe' });
    }

    const nueva = await Especialidad.create({
      id: md5(nombre + Date.now()),
      nombre,
      descripcion: descripcion || null,
    });

    return res.status(201).json({ ok: true, mensaje: 'Especialidad agregada correctamente', data: nueva });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor' });
  }
};

// Obtener todas las especialidades
const obtenerEspecialidades = async (req, res) => {
  try {
    const especialidades = await Especialidad.findAll();
    return res.status(200).json({ ok: true, total: especialidades.length, data: especialidades });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor' });
  }
};

// Asignar especialidad a doctor (solo admin)
const asignarEspecialidad = async (req, res) => {
  try {
    const { id_doctor, id_especialidad } = req.body;
    const DoctorEspecialidad = require('../models/doctor_especialidad.model');

    const existe = await DoctorEspecialidad.findOne({ where: { id_doctor, id_especialidad } });
    if (existe) {
      return res.status(400).json({ ok: false, mensaje: 'El doctor ya tiene esa especialidad asignada' });
    }

    const nueva = await DoctorEspecialidad.create({
      id: md5(id_doctor + id_especialidad + Date.now()),
      id_doctor,
      id_especialidad,
    });

    return res.status(201).json({ ok: true, mensaje: 'Especialidad asignada correctamente', data: nueva });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor' });
  }
};

module.exports = { agregarEspecialidad, obtenerEspecialidades, asignarEspecialidad };