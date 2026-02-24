const PDFDocument = require("pdfkit");
const { Op } = require("sequelize");
const Cita = require("../models/cita.model");
const Doctor = require("../models/doctor.model");
const Usuario = require("../models/usuario.model");
const Especialidad = require("../models/especialidad.model");
const DoctorEspecialidad = require("../models/doctor_especialidad.model");
const { Sequelize } = require('sequelize');

// Reporte general del sistema
const reporteGeneral = async (req, res) => {
  try {
    const totalUsuarios = await Usuario.count();
    const totalDoctores = await Doctor.count({ where: { estado: "activo" } });
    const totalEspecialidades = await Especialidad.count();
    const totalCitas = await Cita.count();
    const citasPendientes = await Cita.count({
      where: { estado: "pendiente" },
    });
    const citasCompletadas = await Cita.count({
      where: { estado: "completada" },
    });
    const citasCanceladas = await Cita.count({
      where: { estado: "cancelada" },
    });
    const citasReprogramadas = await Cita.count({
      where: { estado: "reprogramada" },
    });

    return res.status(200).json({
      ok: true,
      data: {
        totalUsuarios,
        totalDoctores,
        totalEspecialidades,
        totalCitas,
        citasPendientes,
        citasCompletadas,
        citasCanceladas,
        citasReprogramadas,
      },
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ ok: false, mensaje: "Error interno del servidor" });
  }
};

// Reporte de citas por período PDF
const reporteCitasPeriodo = async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin } = req.query;

    const citas = await Cita.findAll({
      where: { fecha: { [Op.between]: [fecha_inicio, fecha_fin] } },
      order: [["fecha", "ASC"]],
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

    const doc = new PDFDocument({ margin: 40, size: "A4" });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=reporte_citas_${fecha_inicio}_${fecha_fin}.pdf`,
    );
    doc.pipe(res);

    // Header
    doc.rect(0, 0, 612, 80).fill("#6a1b9a");
    doc
      .fontSize(22)
      .fillColor("white")
      .text("Reporte de Citas por Período", 40, 20, { align: "center" });
    doc
      .fontSize(12)
      .fillColor("white")
      .text(`Del ${fecha_inicio} al ${fecha_fin}`, 40, 50, { align: "center" });
    doc.y = 100;

    // Cajas resumen
    const cajas = [
      { label: "Total", valor: citasDetalle.length, color: "#6a1b9a" },
      {
        label: "Pendientes",
        valor: citasDetalle.filter((c) => c.estado === "pendiente").length,
        color: "#f9a825",
      },
      {
        label: "Completadas",
        valor: citasDetalle.filter((c) => c.estado === "completada").length,
        color: "#388e3c",
      },
      {
        label: "Canceladas",
        valor: citasDetalle.filter((c) => c.estado === "cancelada").length,
        color: "#d32f2f",
      },
    ];

    const resumenY = doc.y;
    cajas.forEach((caja, i) => {
      const x = 40 + i * 130;
      doc.rect(x, resumenY, 120, 55).fill(caja.color);
      doc
        .fontSize(22)
        .fillColor("white")
        .text(caja.valor.toString(), x, resumenY + 8, {
          width: 120,
          align: "center",
        });
      doc
        .fontSize(10)
        .fillColor("white")
        .text(caja.label, x, resumenY + 35, { width: 120, align: "center" });
    });

    doc.y = resumenY + 70;
    doc.moveDown(0.5);

    // Tabla header
    const colWidths = [70, 70, 150, 150, 80];
    const colX = [40, 110, 180, 330, 480];
    const headers = ["Fecha", "Hora", "Paciente", "Doctor", "Estado"];

    const tablaHeaderY = doc.y;
    doc.rect(40, tablaHeaderY, 532, 25).fill("#6a1b9a");
    headers.forEach((h, i) => {
      doc
        .fontSize(10)
        .fillColor("white")
        .text(h, colX[i], tablaHeaderY + 7, { width: colWidths[i] });
    });
    doc.y = tablaHeaderY + 25;

    // Colores por estado
    const estadoColores = {
      pendiente: "#f9a825",
      completada: "#388e3c",
      cancelada: "#d32f2f",
      reprogramada: "#1565c0",
    };

    // Filas
    citasDetalle.forEach((cita, i) => {
      const rowY = doc.y;
      doc.rect(40, rowY, 532, 22).fill(i % 2 === 0 ? "#f9f9f9" : "#ffffff");
      doc
        .fontSize(9)
        .fillColor("#333")
        .text(cita.fecha, colX[0], rowY + 5, { width: colWidths[0] })
        .text(
          `${cita.hora_inicio.slice(0, 5)}-${cita.hora_fin.slice(0, 5)}`,
          colX[1],
          rowY + 5,
          { width: colWidths[1] },
        )
        .text(cita.paciente, colX[2], rowY + 5, { width: colWidths[2] })
        .text(cita.doctor, colX[3], rowY + 5, { width: colWidths[3] });
      doc
        .fillColor(estadoColores[cita.estado] || "#333")
        .text(cita.estado.toUpperCase(), colX[4], rowY + 5, {
          width: colWidths[4],
        });
      doc.y = rowY + 22;
    });

    // Footer
    doc.moveDown();
    doc
      .fontSize(9)
      .fillColor("#888")
      .text(`Generado el ${new Date().toLocaleDateString("es-MX")}`, {
        align: "right",
      });

    doc.end();
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ ok: false, mensaje: "Error interno del servidor" });
  }
};

// Estadísticas por doctor
const estadisticasDoctor = async (req, res) => {
  try {
    const doctores = await Doctor.findAll({ where: { estado: "activo" } });

    const estadisticas = await Promise.all(
      doctores.map(async (doctor) => {
        const usuario = await Usuario.findOne({
          where: { id: doctor.id_usuario },
          attributes: ["nombre", "apellido"],
        });
        const totalCitas = await Cita.count({
          where: { id_doctor: doctor.id },
        });
        const completadas = await Cita.count({
          where: { id_doctor: doctor.id, estado: "completada" },
        });
        const canceladas = await Cita.count({
          where: { id_doctor: doctor.id, estado: "cancelada" },
        });
        const pendientes = await Cita.count({
          where: { id_doctor: doctor.id, estado: "pendiente" },
        });

        return {
          id: doctor.id,
          nombre: usuario
            ? `Dr. ${usuario.nombre} ${usuario.apellido}`
            : "Desconocido",
          consultorio: doctor.consultorio || "No especificado",
          totalCitas,
          completadas,
          canceladas,
          pendientes,
        };
      }),
    );

    return res.status(200).json({ ok: true, data: estadisticas });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ ok: false, mensaje: "Error interno del servidor" });
  }
};

// Reporte por especialidades
const reporteEspecialidades = async (req, res) => {
  try {
    const especialidades = await Especialidad.findAll();

    const estadisticas = await Promise.all(
      especialidades.map(async (esp) => {
        const doctoresAsignados = await DoctorEspecialidad.count({
          where: { id_especialidad: esp.id },
        });
        const citas = await Cita.count({ where: { id_especialidad: esp.id } });
        const completadas = await Cita.count({
          where: { id_especialidad: esp.id, estado: "completada" },
        });
        const canceladas = await Cita.count({
          where: { id_especialidad: esp.id, estado: "cancelada" },
        });

        return {
          id: esp.id,
          nombre: esp.nombre,
          descripcion: esp.descripcion || "Sin descripción",
          doctoresAsignados,
          totalCitas: citas,
          completadas,
          canceladas,
        };
      }),
    );

    return res.status(200).json({ ok: true, data: estadisticas });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ ok: false, mensaje: "Error interno del servidor" });
  }
};

const reporteUsuariosPDF = async (req, res) => {
  try {
    const usuarios = await Usuario.findAll({ order: [["createdAt", "DESC"]] });

    const doc = new PDFDocument({ margin: 40, size: "A4" });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=reporte_usuarios.pdf",
    );
    doc.pipe(res);

    doc.rect(0, 0, 612, 80).fill("#6a1b9a");
    doc
      .fontSize(22)
      .fillColor("white")
      .text("Reporte de Usuarios", 40, 20, { align: "center" });
    doc
      .fontSize(12)
      .fillColor("white")
      .text(`Total: ${usuarios.length} usuarios`, 40, 50, { align: "center" });
    doc.y = 100;

    const colWidths = [140, 150, 100, 80, 60];
    const colX = [40, 180, 330, 430, 510];
    const headers = ["Nombre", "Correo", "Usuario", "Teléfono", "Rol"];
    const roles = { 1: "Admin", 2: "Doctor", 3: "Paciente" };

    const tablaHeaderY = doc.y;
    doc.rect(40, tablaHeaderY, 532, 25).fill("#6a1b9a");
    headers.forEach((h, i) => {
      doc
        .fontSize(10)
        .fillColor("white")
        .text(h, colX[i], tablaHeaderY + 7, { width: colWidths[i] });
    });
    doc.y = tablaHeaderY + 25;

    usuarios.forEach((u, i) => {
      const rowY = doc.y;
      doc.rect(40, rowY, 532, 22).fill(i % 2 === 0 ? "#f9f9f9" : "#ffffff");
      doc
        .fontSize(9)
        .fillColor("#333")
        .text(`${u.nombre} ${u.apellido}`, colX[0], rowY + 5, {
          width: colWidths[0],
        })
        .text(u.correo, colX[1], rowY + 5, { width: colWidths[1] })
        .text(u.usuario, colX[2], rowY + 5, { width: colWidths[2] })
        .text(u.telefono || "N/A", colX[3], rowY + 5, { width: colWidths[3] })
        .text(roles[u.id_rol] || "N/A", colX[4], rowY + 5, {
          width: colWidths[4],
        });
      doc.y = rowY + 22;
    });

    doc.moveDown();
    doc
      .fontSize(9)
      .fillColor("#888")
      .text(`Generado el ${new Date().toLocaleDateString("es-MX")}`, {
        align: "right",
      });
    doc.end();
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ ok: false, mensaje: "Error interno del servidor" });
  }
};

const reporteDoctoresPDF = async (req, res) => {
  try {
    const doctores = await Doctor.findAll({ where: { estado: "activo" } });

    const estadisticas = await Promise.all(
      doctores.map(async (doctor) => {
        const usuario = await Usuario.findOne({
          where: { id: doctor.id_usuario },
          attributes: ["nombre", "apellido"],
        });
        const totalCitas = await Cita.count({
          where: { id_doctor: doctor.id },
        });
        const completadas = await Cita.count({
          where: { id_doctor: doctor.id, estado: "completada" },
        });
        const canceladas = await Cita.count({
          where: { id_doctor: doctor.id, estado: "cancelada" },
        });
        const pendientes = await Cita.count({
          where: { id_doctor: doctor.id, estado: "pendiente" },
        });
        return {
          usuario,
          doctor,
          totalCitas,
          completadas,
          canceladas,
          pendientes,
        };
      }),
    );

    const doc = new PDFDocument({ margin: 40, size: "A4" });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=reporte_doctores.pdf",
    );
    doc.pipe(res);

    doc.rect(0, 0, 612, 80).fill("#1565c0");
    doc
      .fontSize(22)
      .fillColor("white")
      .text("Reporte de Doctores", 40, 20, { align: "center" });
    doc
      .fontSize(12)
      .fillColor("white")
      .text(`Total: ${estadisticas.length} doctores activos`, 40, 50, {
        align: "center",
      });
    doc.y = 100;

    const colWidths = [130, 90, 60, 70, 70, 70];
    const colX = [40, 170, 260, 320, 390, 460];
    const headers = [
      "Doctor",
      "Consultorio",
      "Cédula",
      "Total",
      "Completadas",
      "Canceladas",
    ];

    const tablaHeaderY = doc.y;
    doc.rect(40, tablaHeaderY, 532, 25).fill("#1565c0");
    headers.forEach((h, i) => {
      doc
        .fontSize(10)
        .fillColor("white")
        .text(h, colX[i], tablaHeaderY + 7, { width: colWidths[i] });
    });
    doc.y = tablaHeaderY + 25;

    estadisticas.forEach((e, i) => {
      const rowY = doc.y;
      doc.rect(40, rowY, 532, 22).fill(i % 2 === 0 ? "#f9f9f9" : "#ffffff");
      doc
        .fontSize(9)
        .fillColor("#333")
        .text(
          e.usuario ? `Dr. ${e.usuario.nombre} ${e.usuario.apellido}` : "N/A",
          colX[0],
          rowY + 5,
          { width: colWidths[0] },
        )
        .text(e.doctor.consultorio || "N/A", colX[1], rowY + 5, {
          width: colWidths[1],
        })
        .text(e.doctor.cedula || "N/A", colX[2], rowY + 5, {
          width: colWidths[2],
        })
        .text(e.totalCitas.toString(), colX[3], rowY + 5, {
          width: colWidths[3],
        })
        .text(e.completadas.toString(), colX[4], rowY + 5, {
          width: colWidths[4],
        })
        .text(e.canceladas.toString(), colX[5], rowY + 5, {
          width: colWidths[5],
        });
      doc.y = rowY + 22;
    });

    doc.moveDown();
    doc
      .fontSize(9)
      .fillColor("#888")
      .text(`Generado el ${new Date().toLocaleDateString("es-MX")}`, {
        align: "right",
      });
    doc.end();
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ ok: false, mensaje: "Error interno del servidor" });
  }
};

const reporteEspecialidadesPDF = async (req, res) => {
  try {
    const especialidades = await Especialidad.findAll();

    const estadisticas = await Promise.all(
      especialidades.map(async (esp) => {
        const doctoresAsignados = await DoctorEspecialidad.count({
          where: { id_especialidad: esp.id },
        });
        const totalCitas = await Cita.count({
          where: { id_especialidad: esp.id },
        });
        const completadas = await Cita.count({
          where: { id_especialidad: esp.id, estado: "completada" },
        });
        const canceladas = await Cita.count({
          where: { id_especialidad: esp.id, estado: "cancelada" },
        });
        return { esp, doctoresAsignados, totalCitas, completadas, canceladas };
      }),
    );

    const doc = new PDFDocument({ margin: 40, size: "A4" });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=reporte_especialidades.pdf",
    );
    doc.pipe(res);

    doc.rect(0, 0, 612, 80).fill("#00695c");
    doc
      .fontSize(22)
      .fillColor("white")
      .text("Reporte de Especialidades", 40, 20, { align: "center" });
    doc
      .fontSize(12)
      .fillColor("white")
      .text(`Total: ${estadisticas.length} especialidades`, 40, 50, {
        align: "center",
      });
    doc.y = 100;

    const colWidths = [120, 160, 70, 70, 70, 70];
    const colX = [40, 160, 320, 390, 460, 510];
    const headers = [
      "Especialidad",
      "Descripción",
      "Doctores",
      "Total",
      "Completadas",
      "Canceladas",
    ];

    const tablaHeaderY = doc.y;
    doc.rect(40, tablaHeaderY, 532, 25).fill("#00695c");
    headers.forEach((h, i) => {
      doc
        .fontSize(10)
        .fillColor("white")
        .text(h, colX[i], tablaHeaderY + 7, { width: colWidths[i] });
    });
    doc.y = tablaHeaderY + 25;

    estadisticas.forEach((e, i) => {
      const rowY = doc.y;
      doc.rect(40, rowY, 532, 22).fill(i % 2 === 0 ? "#f9f9f9" : "#ffffff");
      doc
        .fontSize(9)
        .fillColor("#333")
        .text(e.esp.nombre, colX[0], rowY + 5, { width: colWidths[0] })
        .text(e.esp.descripcion || "N/A", colX[1], rowY + 5, {
          width: colWidths[1],
        })
        .text(e.doctoresAsignados.toString(), colX[2], rowY + 5, {
          width: colWidths[2],
        })
        .text(e.totalCitas.toString(), colX[3], rowY + 5, {
          width: colWidths[3],
        })
        .text(e.completadas.toString(), colX[4], rowY + 5, {
          width: colWidths[4],
        })
        .text(e.canceladas.toString(), colX[5], rowY + 5, {
          width: colWidths[5],
        });
      doc.y = rowY + 22;
    });

    doc.moveDown();
    doc
      .fontSize(9)
      .fillColor("#888")
      .text(`Generado el ${new Date().toLocaleDateString("es-MX")}`, {
        align: "right",
      });
    doc.end();
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ ok: false, mensaje: "Error interno del servidor" });
  }
};

const reporteCitasEstadoPDF = async (req, res) => {
  try {
    const { estado } = req.params;

    const coloresEstado = {
      pendiente: "#f9a825",
      completada: "#388e3c",
      cancelada: "#d32f2f",
      reprogramada: "#1565c0",
    };

    const citas = await Cita.findAll({
      where: { estado },
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

    const color = coloresEstado[estado] || "#6a1b9a";
    const titulo = `Reporte de Citas ${estado.charAt(0).toUpperCase() + estado.slice(1)}s`;

    const doc = new PDFDocument({ margin: 40, size: "A4" });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=reporte_citas_${estado}.pdf`,
    );
    doc.pipe(res);

    // Header
    doc.rect(0, 0, 612, 80).fill(color);
    doc
      .fontSize(22)
      .fillColor("white")
      .text(titulo, 40, 20, { align: "center" });
    doc
      .fontSize(12)
      .fillColor("white")
      .text(`Total: ${citasDetalle.length} citas`, 40, 50, { align: "center" });
    doc.y = 100;

    // Tabla header
    const colWidths = [70, 70, 150, 150, 80];
    const colX = [40, 110, 180, 330, 480];
    const headers = ["Fecha", "Hora", "Paciente", "Doctor", "Motivo"];

    const tablaHeaderY = doc.y;
    doc.rect(40, tablaHeaderY, 532, 25).fill(color);
    headers.forEach((h, i) => {
      doc
        .fontSize(10)
        .fillColor("white")
        .text(h, colX[i], tablaHeaderY + 7, { width: colWidths[i] });
    });
    doc.y = tablaHeaderY + 25;

    citasDetalle.forEach((cita, i) => {
      const rowY = doc.y;
      doc.rect(40, rowY, 532, 22).fill(i % 2 === 0 ? "#f9f9f9" : "#ffffff");
      doc
        .fontSize(9)
        .fillColor("#333")
        .text(cita.fecha, colX[0], rowY + 5, { width: colWidths[0] })
        .text(
          `${cita.hora_inicio.slice(0, 5)}-${cita.hora_fin.slice(0, 5)}`,
          colX[1],
          rowY + 5,
          { width: colWidths[1] },
        )
        .text(cita.paciente, colX[2], rowY + 5, { width: colWidths[2] })
        .text(cita.doctor, colX[3], rowY + 5, { width: colWidths[3] })
        .text(cita.motivo || "Sin motivo", colX[4], rowY + 5, {
          width: colWidths[4],
        });
      doc.y = rowY + 22;
    });

    doc.moveDown();
    doc
      .fontSize(9)
      .fillColor("#888")
      .text(`Generado el ${new Date().toLocaleDateString("es-MX")}`, {
        align: "right",
      });
    doc.end();
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ ok: false, mensaje: "Error interno del servidor" });
  }
};

const datosGraficas = async (req, res) => {
  try {
    const { Sequelize } = require('sequelize');

    // Citas por día de la semana
    const diasSemanaLabel = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const diasDOW = [1, 2, 3, 4, 5, 6]; // PostgreSQL DOW: 0=domingo, 1=lunes...6=sábado
    const citasPorDia = await Promise.all(diasDOW.map(async (dia, i) => {
      const total = await Cita.count({
        where: Sequelize.where(
          Sequelize.fn('EXTRACT', Sequelize.literal('DOW FROM "fecha"')),
          dia
        )
      });
      return { dia: diasSemanaLabel[i], total };
    }));

    // Citas por mes (año actual)
    const anio = new Date().getFullYear();
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const citasPorMes = await Promise.all(meses.map(async (mes, i) => {
      const mesNum = String(i + 1).padStart(2, '0');
      const ultimoDia = new Date(anio, i + 1, 0).getDate();
      const total = await Cita.count({
        where: {
          fecha: {
            [Op.between]: [`${anio}-${mesNum}-01`, `${anio}-${mesNum}-${ultimoDia}`]
          }
        }
      });
      return { mes, total };
    }));

    // Top doctores con más citas completadas
    const doctores = await Doctor.findAll({ where: { estado: 'activo' } });
    const topDoctores = await Promise.all(doctores.map(async (doctor) => {
      const usuario = await Usuario.findOne({
        where: { id: doctor.id_usuario },
        attributes: ['nombre', 'apellido'],
      });
      const completadas = await Cita.count({
        where: { id_doctor: doctor.id, estado: 'completada' },
      });
      return {
        nombre: usuario ? `Dr. ${usuario.nombre} ${usuario.apellido}` : 'N/A',
        completadas,
      };
    }));
    topDoctores.sort((a, b) => b.completadas - a.completadas);

    return res.status(200).json({
      ok: true,
      data: {
        citasPorDia,
        citasPorMes,
        topDoctores: topDoctores.slice(0, 5),
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor' });
  }
};

module.exports = {
  reporteGeneral,
  reporteCitasPeriodo,
  estadisticasDoctor,
  reporteEspecialidades,
  reporteUsuariosPDF,
  reporteDoctoresPDF,
  reporteEspecialidadesPDF,
  reporteCitasEstadoPDF,
  datosGraficas,
};
