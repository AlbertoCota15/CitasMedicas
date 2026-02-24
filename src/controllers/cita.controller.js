const md5 = require("md5");
const Cita = require("../models/cita.model");
const Doctor = require("../models/doctor.model");
const HorarioDoctor = require("../models/horario_doctor.model");
const Notificacion = require("../models/notificacion.model");
const Usuario = require("../models/usuario.model");
const { Op } = require("sequelize");

const diasSemana = [
  "domingo",
  "lunes",
  "martes",
  "miercoles",
  "jueves",
  "viernes",
  "sabado",
];

// Agendar cita
const agendarCita = async (req, res) => {
  try {
    const { id_doctor, id_especialidad, fecha, hora_inicio, motivo } = req.body;
    const id_paciente = req.usuario.id;

    // Verificar que el doctor existe y está activo
    const doctor = await Doctor.findOne({
      where: { id: id_doctor, estado: "activo" },
    });
    if (!doctor) {
      return res
        .status(404)
        .json({ ok: false, mensaje: "Doctor no encontrado o no disponible" });
    }

    // Verificar que el día de la fecha coincide con el horario del doctor
    //const diaSemana = diasSemana[new Date(fecha).getDay()];

    const [anio, mes, dia] = fecha.split("-").map(Number);
    const diaSemana = diasSemana[new Date(anio, mes - 1, dia).getDay()];
    const horario = await HorarioDoctor.findOne({
      where: { id_doctor, dia_semana: diaSemana, disponible: true },
    });

    if (!horario) {
      return res.status(400).json({
        ok: false,
        mensaje: `El doctor no tiene horario disponible los ${diaSemana}`,
      });
    }

    // Calcular hora_fin según duración de cita del doctor
    const [horas, minutos] = hora_inicio.split(":").map(Number);
    const horaFin = new Date();
    horaFin.setHours(horas, minutos + doctor.duracion_cita, 0);
    const hora_fin = `${String(horaFin.getHours()).padStart(2, "0")}:${String(horaFin.getMinutes()).padStart(2, "0")}`;

    // Verificar que la hora está dentro del horario del doctor
    if (hora_inicio < horario.hora_inicio || hora_fin > horario.hora_fin) {
      return res.status(400).json({
        ok: false,
        mensaje: `El doctor atiende de ${horario.hora_inicio} a ${horario.hora_fin}`,
      });
    }

    // Verificar que no haya otra cita en ese horario
    const citaExiste = await Cita.findOne({
      where: {
        id_doctor,
        fecha,
        estado: { [Op.notIn]: ["cancelada"] },
        [Op.or]: [
          { hora_inicio: { [Op.between]: [hora_inicio, hora_fin] } },
          { hora_fin: { [Op.between]: [hora_inicio, hora_fin] } },
        ],
      },
    });

    if (citaExiste) {
      return res.status(400).json({
        ok: false,
        mensaje: "El doctor ya tiene una cita en ese horario",
      });
    }

    // Crear la cita
    const nuevaCita = await Cita.create({
      id: md5(id_paciente + id_doctor + fecha + hora_inicio + Date.now()),
      id_paciente,
      id_doctor,
      id_especialidad,
      fecha,
      hora_inicio,
      hora_fin,
      motivo: motivo || null,
      estado: "pendiente",
    });

    // Crear notificación para el paciente
    await Notificacion.create({
      id: md5("notif_paciente" + nuevaCita.id + Date.now()),
      id_usuario: id_paciente,
      id_cita: nuevaCita.id,
      titulo: "Cita agendada",
      mensaje: `Tu cita ha sido agendada para el ${fecha} a las ${hora_inicio}`,
    });

    // Crear notificación para el doctor
    await Notificacion.create({
      id: md5("notif_doctor" + nuevaCita.id + Date.now()),
      id_usuario: doctor.id_usuario,
      id_cita: nuevaCita.id,
      titulo: "Nueva cita",
      mensaje: `Tienes una nueva cita agendada para el ${fecha} a las ${hora_inicio}`,
    });

    return res.status(201).json({
      ok: true,
      mensaje: "Cita agendada correctamente",
      data: nuevaCita,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ ok: false, mensaje: "Error interno del servidor" });
  }
};

// Obtener citas del paciente
const obtenerCitasPaciente = async (req, res) => {
  try {
    const id_paciente = req.usuario.id;

    const citas = await Cita.findAll({
      where: { id_paciente },
      order: [["fecha", "DESC"]],
    });

    return res.status(200).json({ ok: true, total: citas.length, data: citas });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ ok: false, mensaje: "Error interno del servidor" });
  }
};

// Cancelar cita
const cancelarCita = async (req, res) => {
  try {
    const { id } = req.params;
    const id_usuario = req.usuario.id;

    const cita = await Cita.findOne({ where: { id } });
    if (!cita) {
      return res.status(404).json({ ok: false, mensaje: "Cita no encontrada" });
    }

    if (
      cita.id_paciente !== id_usuario &&
      ![1, 4].includes(req.usuario.id_rol)
    ) {
      return res.status(403).json({
        ok: false,
        mensaje: "No tienes permisos para cancelar esta cita",
      });
    }

    if (cita.estado === "cancelada") {
      return res
        .status(400)
        .json({ ok: false, mensaje: "La cita ya está cancelada" });
    }

    await cita.update({ estado: "cancelada" });

    // Notificar al paciente solo si tiene cuenta
    if (cita.id_paciente) {
      await Notificacion.create({
        id: md5("cancel" + cita.id + Date.now()),
        id_usuario: cita.id_paciente,
        id_cita: cita.id,
        titulo: "Cita cancelada",
        mensaje: `Tu cita del ${cita.fecha} a las ${cita.hora_inicio} ha sido cancelada`,
      });
    }

    // Notificar al doctor
    const doctorCita = await Doctor.findOne({ where: { id: cita.id_doctor } });
    if (doctorCita) {
      await Notificacion.create({
        id: md5("cancel_doctor" + cita.id + Date.now()),
        id_usuario: doctorCita.id_usuario,
        id_cita: cita.id,
        titulo: "Cita cancelada",
        mensaje: `La cita del ${cita.fecha} a las ${cita.hora_inicio} ha sido cancelada`,
      });
    }

    return res
      .status(200)
      .json({ ok: true, mensaje: "Cita cancelada correctamente" });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ ok: false, mensaje: "Error interno del servidor" });
  }
};

// Obtener citas del doctor
const obtenerCitasDoctor = async (req, res) => {
  try {
    const { id_doctor } = req.params;

    const citas = await Cita.findAll({
      where: { id_doctor, estado: { [Op.notIn]: ["cancelada"] } },
      order: [["fecha", "ASC"]],
    });

    return res.status(200).json({ ok: true, total: citas.length, data: citas });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ ok: false, mensaje: "Error interno del servidor" });
  }
};

const obtenerCitasDelDoctor = async (req, res) => {
  try {
    const id_usuario = req.usuario.id;
    const Doctor = require("../models/doctor.model");
    const Usuario = require("../models/usuario.model");

    const doctor = await Doctor.findOne({ where: { id_usuario } });
    if (!doctor) {
      return res
        .status(404)
        .json({ ok: false, mensaje: "Doctor no encontrado" });
    }

    const citas = await Cita.findAll({
      where: { id_doctor: doctor.id },
      order: [["fecha", "DESC"]],
    });

    // Obtener nombre del paciente por cada cita
    const citasConPaciente = await Promise.all(
      citas.map(async (cita) => {
        const paciente = await Usuario.findOne({
          where: { id: cita.id_paciente },
          attributes: ["nombre", "apellido", "telefono"],
        });
        return {
          ...cita.toJSON(),
          paciente: paciente
            ? `${paciente.nombre} ${paciente.apellido}`
            : "Desconocido",
          telefono_paciente: paciente?.telefono || "No registrado",
        };
      }),
    );

    return res.status(200).json({
      ok: true,
      total: citasConPaciente.length,
      data: citasConPaciente,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ ok: false, mensaje: "Error interno del servidor" });
  }
};

// Reprogramar cita
const reprogramarCita = async (req, res) => {
  try {
    const { id } = req.params;
    const { fecha, hora_inicio } = req.body;
    const id_usuario = req.usuario.id;

    const cita = await Cita.findOne({ where: { id } });
    if (!cita) {
      return res.status(404).json({ ok: false, mensaje: "Cita no encontrada" });
    }

    if (
      cita.id_paciente !== id_usuario &&
      ![1, 4].includes(req.usuario.id_rol)
    ) {
      return res.status(403).json({
        ok: false,
        mensaje: "No tienes permisos para reprogramar esta cita",
      });
    }

    if (cita.estado === "cancelada") {
      return res.status(400).json({
        ok: false,
        mensaje: "No puedes reprogramar una cita cancelada",
      });
    }

    if (cita.estado === "completada") {
      return res.status(400).json({
        ok: false,
        mensaje: "No puedes reprogramar una cita completada",
      });
    }

    const doctor = await Doctor.findOne({ where: { id: cita.id_doctor } });
    const diaSemana = diasSemana[new Date(fecha).getDay()];
    const horario = await HorarioDoctor.findOne({
      where: {
        id_doctor: cita.id_doctor,
        dia_semana: diaSemana,
        disponible: true,
      },
    });

    if (!horario) {
      return res.status(400).json({
        ok: false,
        mensaje: `El doctor no tiene horario disponible los ${diaSemana}`,
      });
    }

    const [horas, minutos] = hora_inicio.split(":").map(Number);
    const horaFin = new Date();
    horaFin.setHours(horas, minutos + doctor.duracion_cita, 0);
    const hora_fin = `${String(horaFin.getHours()).padStart(2, "0")}:${String(horaFin.getMinutes()).padStart(2, "0")}`;

    if (hora_inicio < horario.hora_inicio || hora_fin > horario.hora_fin) {
      return res.status(400).json({
        ok: false,
        mensaje: `El doctor atiende de ${horario.hora_inicio} a ${horario.hora_fin}`,
      });
    }

    const citaExiste = await Cita.findOne({
      where: {
        id_doctor: cita.id_doctor,
        fecha,
        id: { [Op.ne]: id },
        estado: { [Op.notIn]: ["cancelada"] },
        [Op.or]: [
          { hora_inicio: { [Op.between]: [hora_inicio, hora_fin] } },
          { hora_fin: { [Op.between]: [hora_inicio, hora_fin] } },
        ],
      },
    });

    if (citaExiste) {
      return res.status(400).json({
        ok: false,
        mensaje: "El doctor ya tiene una cita en ese horario",
      });
    }

    await cita.update({ fecha, hora_inicio, hora_fin, estado: "reprogramada" });

    // Notificar al paciente
    await Notificacion.create({
      id: md5("reprog" + cita.id + Date.now()),
      id_usuario: cita.id_paciente,
      id_cita: cita.id,
      titulo: "Cita reprogramada",
      mensaje: `Tu cita ha sido reprogramada para el ${fecha} a las ${hora_inicio}`,
    });

    // Notificar al doctor
    if (doctor) {
      await Notificacion.create({
        id: md5("reprog_doctor" + cita.id + Date.now()),
        id_usuario: doctor.id_usuario,
        id_cita: cita.id,
        titulo: "Cita reprogramada",
        mensaje: `Una cita fue reprogramada para el ${fecha} a las ${hora_inicio}`,
      });
    }

    return res.status(200).json({
      ok: true,
      mensaje: "Cita reprogramada correctamente",
      data: cita,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ ok: false, mensaje: "Error interno del servidor" });
  }
};

// Completar cita y agregar notas médicas (solo doctor)
const completarCita = async (req, res) => {
  try {
    const { id } = req.params;
    const { notas } = req.body;
    const id_usuario = req.usuario.id;

    // Buscar el doctor por id_usuario del token
    const Doctor = require("../models/doctor.model");
    const doctor = await Doctor.findOne({ where: { id_usuario } });
    if (!doctor) {
      return res.status(403).json({
        ok: false,
        mensaje: "No tienes permisos para completar citas",
      });
    }

    const cita = await Cita.findOne({ where: { id } });
    if (!cita) {
      return res.status(404).json({ ok: false, mensaje: "Cita no encontrada" });
    }

    // Verificar que la cita pertenece al doctor
    if (cita.id_doctor !== doctor.id) {
      return res.status(403).json({
        ok: false,
        mensaje: "No tienes permisos para completar esta cita",
      });
    }

    if (cita.estado === "cancelada") {
      return res
        .status(400)
        .json({ ok: false, mensaje: "No puedes completar una cita cancelada" });
    }

    if (cita.estado === "completada") {
      return res
        .status(400)
        .json({ ok: false, mensaje: "La cita ya está completada" });
    }

    await cita.update({ estado: "completada", notas: notas || null });

    // Notificar al paciente solo si tiene cuenta
    if (cita.id_paciente) {
      await Notificacion.create({
        id: md5("completada" + cita.id + Date.now()),
        id_usuario: cita.id_paciente,
        id_cita: cita.id,
        titulo: "Cita completada",
        mensaje: `Tu cita del ${cita.fecha} a las ${cita.hora_inicio} ha sido completada`,
      });
    }

    return res
      .status(200)
      .json({ ok: true, mensaje: "Cita completada correctamente", data: cita });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ ok: false, mensaje: "Error interno del servidor" });
  }
};

const obtenerTodasCitas = async (req, res) => {
  try {
    const Usuario = require("../models/usuario.model");
    const Doctor = require("../models/doctor.model");

    const citas = await Cita.findAll({
      order: [["fecha", "DESC"]],
    });

    const citasDetalle = await Promise.all(
      citas.map(async (cita) => {
        const paciente = await Usuario.findOne({
          where: { id: cita.id_paciente },
          attributes: ["nombre", "apellido"],
        });

        const doctor = await Doctor.findOne({ where: { id: cita.id_doctor } });
        const usuarioDoctor = doctor
          ? await Usuario.findOne({
              where: { id: doctor.id_usuario },
              attributes: ["nombre", "apellido"],
            })
          : null;

        return {
          ...cita.toJSON(),
          paciente: paciente
            ? `${paciente.nombre} ${paciente.apellido}`
            : "Desconocido",
          doctor: usuarioDoctor
            ? `Dr. ${usuarioDoctor.nombre} ${usuarioDoctor.apellido}`
            : "Desconocido",
        };
      }),
    );

    return res
      .status(200)
      .json({ ok: true, total: citasDetalle.length, data: citasDetalle });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ ok: false, mensaje: "Error interno del servidor" });
  }
};

const agendarCitaExterna = async (req, res) => {
  try {
    const {
      id_doctor,
      id_especialidad,
      fecha,
      hora_inicio,
      motivo,
      nombre_paciente,
      telefono_paciente,
    } = req.body;

    if (!nombre_paciente || !telefono_paciente) {
      return res.status(400).json({
        ok: false,
        mensaje: "Nombre y teléfono del paciente son requeridos",
      });
    }

    const doctor = await Doctor.findOne({
      where: { id: id_doctor, estado: "activo" },
    });
    if (!doctor) {
      return res
        .status(404)
        .json({ ok: false, mensaje: "Doctor no encontrado o no disponible" });
    }

    const diaSemana = diasSemana[new Date(fecha).getDay()];
    const horario = await HorarioDoctor.findOne({
      where: { id_doctor, dia_semana: diaSemana, disponible: true },
    });

    if (!horario) {
      return res.status(400).json({
        ok: false,
        mensaje: `El doctor no tiene horario disponible los ${diaSemana}`,
      });
    }

    const [horas, minutos] = hora_inicio.split(":").map(Number);
    const horaFin = new Date();
    horaFin.setHours(horas, minutos + doctor.duracion_cita, 0);
    const hora_fin = `${String(horaFin.getHours()).padStart(2, "0")}:${String(horaFin.getMinutes()).padStart(2, "0")}`;

    if (hora_inicio < horario.hora_inicio || hora_fin > horario.hora_fin) {
      return res.status(400).json({
        ok: false,
        mensaje: `El doctor atiende de ${horario.hora_inicio} a ${horario.hora_fin}`,
      });
    }

    const citaExiste = await Cita.findOne({
      where: {
        id_doctor,
        fecha,
        estado: { [Op.notIn]: ["cancelada"] },
        [Op.or]: [
          { hora_inicio: { [Op.between]: [hora_inicio, hora_fin] } },
          { hora_fin: { [Op.between]: [hora_inicio, hora_fin] } },
        ],
      },
    });

    if (citaExiste) {
      return res.status(400).json({
        ok: false,
        mensaje: "El doctor ya tiene una cita en ese horario",
      });
    }

    const nuevaCita = await Cita.create({
      id: md5(
        "externo" +
          nombre_paciente +
          id_doctor +
          fecha +
          hora_inicio +
          Date.now(),
      ),
      id_paciente: null,
      id_doctor,
      id_especialidad,
      fecha,
      hora_inicio,
      hora_fin,
      motivo: motivo || null,
      estado: "pendiente",
      nombre_paciente,
      telefono_paciente,
      es_paciente_externo: true,
    });

    // Notificar al doctor
    await Notificacion.create({
      id: md5("notif_doctor_externo" + nuevaCita.id + Date.now()),
      id_usuario: doctor.id_usuario,
      id_cita: nuevaCita.id,
      titulo: "Nueva cita agendada",
      mensaje: `Tienes una nueva cita con ${nombre_paciente} el ${fecha} a las ${hora_inicio}`,
    });

    return res.status(201).json({
      ok: true,
      mensaje: "Cita agendada correctamente",
      data: nuevaCita,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ ok: false, mensaje: "Error interno del servidor" });
  }
};

const obtenerCitasHoy = async (req, res) => {
  try {
    const hoy = new Date().toISOString().split("T")[0];

    const citas = await Cita.findAll({
      where: { fecha: hoy },
      order: [["hora_inicio", "ASC"]],
    });

    const citasDetalle = await Promise.all(
      citas.map(async (cita) => {
        let paciente = "Paciente externo";
        if (!cita.es_paciente_externo && cita.id_paciente) {
          const usuario = await Usuario.findOne({
            where: { id: cita.id_paciente },
            attributes: ["nombre", "apellido"],
          });
          paciente = usuario
            ? `${usuario.nombre} ${usuario.apellido}`
            : "Desconocido";
        } else if (cita.es_paciente_externo) {
          paciente = cita.nombre_paciente;
        }

        const doctor = await Doctor.findOne({ where: { id: cita.id_doctor } });
        const usuarioDoctor = doctor
          ? await Usuario.findOne({
              where: { id: doctor.id_usuario },
              attributes: ["nombre", "apellido"],
            })
          : null;

        return {
          ...cita.toJSON(),
          paciente,
          doctor: usuarioDoctor
            ? `Dr. ${usuarioDoctor.nombre} ${usuarioDoctor.apellido}`
            : "Desconocido",
        };
      }),
    );

    return res
      .status(200)
      .json({ ok: true, total: citasDetalle.length, data: citasDetalle });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ ok: false, mensaje: "Error interno del servidor" });
  }
};

module.exports = {
  agendarCita,
  obtenerCitasPaciente,
  cancelarCita,
  obtenerCitasDoctor,
  reprogramarCita,
  completarCita,
  obtenerTodasCitas,
  obtenerCitasDelDoctor,
  agendarCitaExterna,
  obtenerCitasHoy,
};
