const md5 = require("md5");
const Usuario = require("../models/usuario.model");
const Doctor = require("../models/doctor.model");
const Especialidad = require("../models/especialidad.model");
const DoctorEspecialidad = require("../models/doctor_especialidad.model");
const HorarioDoctor = require("../models/horario_doctor.model");
const Cita = require("../models/cita.model");
const { Op } = require("sequelize");
// Registro de doctor
const registrarDoctor = async (req, res) => {
  try {
    const {
      nombre,
      apellido,
      usuario,
      correo,
      telefono,
      direccion,
      contrasena,
      cedula,
      consultorio,
      duracion_cita,
    } = req.body;

    const correoExiste = await Usuario.findOne({ where: { correo } });
    if (correoExiste) {
      return res
        .status(400)
        .json({ ok: false, mensaje: "El correo ya está registrado" });
    }

    const usuarioExiste = await Usuario.findOne({ where: { usuario } });
    if (usuarioExiste) {
      return res
        .status(400)
        .json({ ok: false, mensaje: "El nombre de usuario ya está en uso" });
    }

    const cedulaExiste = await Doctor.findOne({ where: { cedula } });
    if (cedulaExiste) {
      return res
        .status(400)
        .json({ ok: false, mensaje: "La cédula ya está registrada" });
    }

    // Crear usuario con rol doctor (id_rol = 2)
    const nuevoUsuario = await Usuario.create({
      id: md5(correo + Date.now()),
      id_rol: 2,
      nombre,
      apellido,
      usuario,
      correo,
      telefono: telefono || null,
      direccion: direccion || null,
      contrasena: md5(contrasena),
      estado: "activo",
    });

    // Crear doctor con estado pendiente
    const nuevoDoctor = await Doctor.create({
      id: md5(cedula + Date.now()),
      id_usuario: nuevoUsuario.id,
      cedula,
      consultorio: consultorio || null,
      duracion_cita: duracion_cita || 30,
      estado: "pendiente",
    });

    return res.status(201).json({
      ok: true,
      mensaje: "Registro enviado, espera la aprobación del administrador",
      data: {
        id: nuevoUsuario.id,
        nombre: nuevoUsuario.nombre,
        apellido: nuevoUsuario.apellido,
        usuario: nuevoUsuario.usuario,
        correo: nuevoUsuario.correo,
        estado: nuevoDoctor.estado,
      },
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ ok: false, mensaje: "Error interno del servidor" });
  }
};

// Aprobar doctor (solo admin)
const aprobarDoctor = async (req, res) => {
  try {
    const { id } = req.params;

    const doctor = await Doctor.findOne({ where: { id } });
    if (!doctor) {
      return res
        .status(404)
        .json({ ok: false, mensaje: "Doctor no encontrado" });
    }

    if (doctor.estado === "activo") {
      return res
        .status(400)
        .json({ ok: false, mensaje: "El doctor ya está aprobado" });
    }

    await doctor.update({ estado: "activo" });

    return res.status(200).json({
      ok: true,
      mensaje: "Doctor aprobado correctamente",
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ ok: false, mensaje: "Error interno del servidor" });
  }
};

// Obtener todos los doctores activos
const obtenerDoctores = async (req, res) => {
  try {
    const doctores = await Doctor.findAll({
      where: { estado: "activo" },
      include: [
        {
          model: Usuario,
          as: "usuario",
          attributes: ["id", "nombre", "apellido", "correo", "telefono"],
        },
      ],
    });

    return res.status(200).json({
      ok: true,
      total: doctores.length,
      data: doctores,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ ok: false, mensaje: "Error interno del servidor" });
  }
};

const buscarPorEspecialidad = async (req, res) => {
  try {
    const { id_especialidad } = req.params;

    const doctoresEspecialidad = await DoctorEspecialidad.findAll({
      where: { id_especialidad },
    });

    if (doctoresEspecialidad.length === 0) {
      return res
        .status(404)
        .json({ ok: false, mensaje: "No hay doctores para esa especialidad" });
    }

    const doctores = await Promise.all(
      doctoresEspecialidad.map(async (de) => {
        const doctor = await Doctor.findOne({
          where: { id: de.id_doctor, estado: "activo" },
        });
        if (!doctor) return null;
        const usuario = await Usuario.findOne({
          where: { id: doctor.id_usuario },
          attributes: ["nombre", "apellido", "correo", "telefono"],
        });
        return {
          id_doctor: doctor.id,
          cedula: doctor.cedula,
          consultorio: doctor.consultorio,
          duracion_cita: doctor.duracion_cita,
          nombre: `Dr. ${usuario.nombre} ${usuario.apellido}`,
          correo: usuario.correo,
          telefono: usuario.telefono,
        };
      }),
    );

    const resultado = doctores.filter((d) => d !== null);

    return res
      .status(200)
      .json({ ok: true, total: resultado.length, data: resultado });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ ok: false, mensaje: "Error interno del servidor" });
  }
};

const verDisponibilidad = async (req, res) => {
  try {
    const { id_doctor, fecha } = req.params;

    const doctor = await Doctor.findOne({
      where: { id: id_doctor, estado: "activo" },
    });
    if (!doctor) {
      return res
        .status(404)
        .json({ ok: false, mensaje: "Doctor no encontrado o no disponible" });
    }

    // Obtener el día de la semana de la fecha
    const diasSemana = [
      "domingo",
      "lunes",
      "martes",
      "miercoles",
      "jueves",
      "viernes",
      "sabado",
    ];
    const diaSemana = diasSemana[new Date(fecha).getDay()];

    // Verificar que el doctor tenga horario ese día
    const horario = await HorarioDoctor.findOne({
      where: { id_doctor, dia_semana: diaSemana, disponible: true },
    });

    if (!horario) {
      return res
        .status(400)
        .json({ ok: false, mensaje: `El doctor no atiende los ${diaSemana}` });
    }

    // Obtener citas ya agendadas ese día
    const citasAgendadas = await Cita.findAll({
      where: {
        id_doctor,
        fecha,
        estado: { [Op.notIn]: ["cancelada"] },
      },
    });

    // Generar slots disponibles
    const slots = [];
    let horaActual = horario.hora_inicio.slice(0, 5);
    const horaFin = horario.hora_fin.slice(0, 5);

    while (horaActual < horaFin) {
      const [horas, minutos] = horaActual.split(":").map(Number);
      const siguienteHora = new Date();
      siguienteHora.setHours(horas, minutos + doctor.duracion_cita, 0);
      const slotFin = `${String(siguienteHora.getHours()).padStart(2, "0")}:${String(siguienteHora.getMinutes()).padStart(2, "0")}`;

      if (slotFin > horaFin) break;

      // Verificar si el slot está ocupado
      const ocupado = citasAgendadas.some((cita) => {
        const citaInicio = cita.hora_inicio.slice(0, 5);
        return citaInicio === horaActual;
      });

      slots.push({
        hora_inicio: horaActual,
        hora_fin: slotFin,
        disponible: !ocupado,
      });

      horaActual = slotFin;
    }

    return res.status(200).json({
      ok: true,
      doctor: `Dr. ${(await Usuario.findOne({ where: { id: doctor.id_usuario } })).nombre}`,
      fecha,
      dia: diaSemana,
      duracion_cita: doctor.duracion_cita,
      total_slots: slots.length,
      disponibles: slots.filter((s) => s.disponible).length,
      slots,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ ok: false, mensaje: "Error interno del servidor" });
  }
};

const obtenerDoctoresPendientes = async (req, res) => {
  try {
    const doctores = await Doctor.findAll({
      where: { estado: 'pendiente' },
      include: [{
        model: Usuario,
        as: 'usuario',
        attributes: ['id', 'nombre', 'apellido', 'correo', 'telefono'],
      }],
    });
    return res.status(200).json({ ok: true, total: doctores.length, data: doctores });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor' });
  }
};

const editarDoctor = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, apellido, telefono, consultorio, duracion_cita } = req.body;

    const doctor = await Doctor.findOne({ where: { id } });
    if (!doctor) return res.status(404).json({ ok: false, mensaje: 'Doctor no encontrado' });

    await doctor.update({
      consultorio: consultorio || doctor.consultorio,
      duracion_cita: duracion_cita || doctor.duracion_cita,
    });

    await Usuario.update(
      { nombre: nombre || undefined, apellido: apellido || undefined, telefono: telefono || undefined },
      { where: { id: doctor.id_usuario } }
    );

    return res.status(200).json({ ok: true, mensaje: 'Doctor actualizado correctamente' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor' });
  }
};

const eliminarDoctor = async (req, res) => {
  try {
    const { id } = req.params;
    const doctor = await Doctor.findOne({ where: { id } });
    if (!doctor) return res.status(404).json({ ok: false, mensaje: 'Doctor no encontrado' });

    await doctor.update({ estado: 'inactivo' });

    return res.status(200).json({ ok: true, mensaje: 'Doctor eliminado correctamente' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor' });
  }
};

module.exports = { registrarDoctor, aprobarDoctor, obtenerDoctores, buscarPorEspecialidad, verDisponibilidad, obtenerDoctoresPendientes, editarDoctor, eliminarDoctor };