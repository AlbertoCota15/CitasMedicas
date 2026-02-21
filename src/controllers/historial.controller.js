const PDFDocument = require('pdfkit');
const Cita = require('../models/cita.model');
const Usuario = require('../models/usuario.model');
const Doctor = require('../models/doctor.model');
const Especialidad = require('../models/especialidad.model');

const generarHistorial = async (req, res) => {
  try {
    const id_paciente = req.usuario.id;

    // Obtener datos del paciente
    const paciente = await Usuario.findOne({ where: { id: id_paciente } });
    if (!paciente) {
      return res.status(404).json({ ok: false, mensaje: 'Paciente no encontrado' });
    }

    // Obtener citas del paciente
    const citas = await Cita.findAll({
      where: { id_paciente },
      order: [['fecha', 'DESC']],
    });

    // Obtener datos extra de cada cita
    const citasDetalle = await Promise.all(citas.map(async (cita) => {
      const doctor = await Doctor.findOne({ where: { id: cita.id_doctor } });
      const usuarioDoctor = await Usuario.findOne({ where: { id: doctor.id_usuario } });
      const especialidad = await Especialidad.findOne({ where: { id: cita.id_especialidad } });
      return {
        fecha: cita.fecha,
        hora_inicio: cita.hora_inicio,
        hora_fin: cita.hora_fin,
        motivo: cita.motivo || 'Sin motivo especificado',
        estado: cita.estado,
        notas: cita.notas || 'Sin notas',
        doctor: `Dr. ${usuarioDoctor.nombre} ${usuarioDoctor.apellido}`,
        especialidad: especialidad.nombre,
      };
    }));

    // Generar PDF
    const doc = new PDFDocument({ margin: 50 });
    const buffers = [];

    doc.on('data', (chunk) => buffers.push(chunk));
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(buffers);
      const base64 = pdfBuffer.toString('base64');
      return res.status(200).json({
        ok: true,
        mensaje: 'Historial generado correctamente',
        pdf: base64,
      });
    });

    // Encabezado
    doc.fontSize(20).font('Helvetica-Bold').text('Historial Médico', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).font('Helvetica').text(`Fecha de generación: ${new Date().toLocaleDateString('es-MX')}`, { align: 'center' });
    doc.moveDown();

    // Línea separadora
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown();

    // Datos del paciente
    doc.fontSize(14).font('Helvetica-Bold').text('Datos del Paciente');
    doc.moveDown(0.5);
    doc.fontSize(11).font('Helvetica');
    doc.text(`Nombre: ${paciente.nombre} ${paciente.apellido}`);
    doc.text(`Usuario: ${paciente.usuario}`);
    doc.text(`Correo: ${paciente.correo}`);
    doc.text(`Teléfono: ${paciente.telefono || 'No registrado'}`);
    doc.text(`Dirección: ${paciente.direccion || 'No registrada'}`);
    doc.moveDown();

    // Línea separadora
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown();

    // Historial de citas
    doc.fontSize(14).font('Helvetica-Bold').text('Historial de Citas');
    doc.moveDown(0.5);

    if (citasDetalle.length === 0) {
      doc.fontSize(11).font('Helvetica').text('No hay citas registradas.');
    } else {
      citasDetalle.forEach((cita, index) => {
        doc.fontSize(12).font('Helvetica-Bold').text(`Cita #${index + 1}`);
        doc.fontSize(11).font('Helvetica');
        doc.text(`Fecha: ${cita.fecha}`);
        doc.text(`Horario: ${cita.hora_inicio} - ${cita.hora_fin}`);
        doc.text(`Doctor: ${cita.doctor}`);
        doc.text(`Especialidad: ${cita.especialidad}`);
        doc.text(`Motivo: ${cita.motivo}`);
        doc.text(`Estado: ${cita.estado}`);
        doc.text(`Notas: ${cita.notas}`);
        doc.moveDown();
      });
    }

    doc.end();

  } catch (error) {
    console.error(error);
    return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor' });
  }
};

const generarHistorialDoctor = async (req, res) => {
  try {
    const id_usuario = req.usuario.id;

    // Obtener doctor por id_usuario del token
    const doctor = await Doctor.findOne({ where: { id_usuario } });
    if (!doctor) {
      return res.status(404).json({ ok: false, mensaje: 'Doctor no encontrado' });
    }

    const usuarioDoctor = await Usuario.findOne({ where: { id: id_usuario } });

    // Obtener citas del doctor
    const citas = await Cita.findAll({
      where: { id_doctor: doctor.id },
      order: [['fecha', 'DESC']],
    });

    // Obtener datos extra de cada cita
    const citasDetalle = await Promise.all(citas.map(async (cita) => {
      const paciente = await Usuario.findOne({ where: { id: cita.id_paciente } });
      const especialidad = await Especialidad.findOne({ where: { id: cita.id_especialidad } });
      return {
        fecha: cita.fecha,
        hora_inicio: cita.hora_inicio,
        hora_fin: cita.hora_fin,
        motivo: cita.motivo || 'Sin motivo especificado',
        estado: cita.estado,
        notas: cita.notas || 'Sin notas',
        paciente: `${paciente.nombre} ${paciente.apellido}`,
        especialidad: especialidad.nombre,
      };
    }));

    // Generar PDF
    const doc = new PDFDocument({ margin: 50 });
    const buffers = [];

    doc.on('data', (chunk) => buffers.push(chunk));
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(buffers);
      const base64 = pdfBuffer.toString('base64');
      return res.status(200).json({
        ok: true,
        mensaje: 'Historial generado correctamente',
        pdf: base64,
      });
    });

    // Encabezado
    doc.fontSize(20).font('Helvetica-Bold').text('Historial de Citas - Doctor', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).font('Helvetica').text(`Fecha de generación: ${new Date().toLocaleDateString('es-MX')}`, { align: 'center' });
    doc.moveDown();

    // Línea separadora
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown();

    // Datos del doctor
    doc.fontSize(14).font('Helvetica-Bold').text('Datos del Doctor');
    doc.moveDown(0.5);
    doc.fontSize(11).font('Helvetica');
    doc.text(`Nombre: Dr. ${usuarioDoctor.nombre} ${usuarioDoctor.apellido}`);
    doc.text(`Correo: ${usuarioDoctor.correo}`);
    doc.text(`Teléfono: ${usuarioDoctor.telefono || 'No registrado'}`);
    doc.text(`Cédula: ${doctor.cedula}`);
    doc.text(`Consultorio: ${doctor.consultorio || 'No registrado'}`);
    doc.text(`Duración por cita: ${doctor.duracion_cita} minutos`);
    doc.moveDown();

    // Línea separadora
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown();

    // Historial de citas
    doc.fontSize(14).font('Helvetica-Bold').text('Historial de Citas Atendidas');
    doc.moveDown(0.5);

    if (citasDetalle.length === 0) {
      doc.fontSize(11).font('Helvetica').text('No hay citas registradas.');
    } else {
      citasDetalle.forEach((cita, index) => {
        doc.fontSize(12).font('Helvetica-Bold').text(`Cita #${index + 1}`);
        doc.fontSize(11).font('Helvetica');
        doc.text(`Fecha: ${cita.fecha}`);
        doc.text(`Horario: ${cita.hora_inicio} - ${cita.hora_fin}`);
        doc.text(`Paciente: ${cita.paciente}`);
        doc.text(`Especialidad: ${cita.especialidad}`);
        doc.text(`Motivo: ${cita.motivo}`);
        doc.text(`Estado: ${cita.estado}`);
        doc.text(`Notas: ${cita.notas}`);
        doc.moveDown();
      });
    }

    doc.end();

  } catch (error) {
    console.error(error);
    return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor' });
  }
};

module.exports = { generarHistorial, generarHistorialDoctor };
