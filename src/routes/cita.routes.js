const express = require("express");
const multer = require("multer");
const router = express.Router();
const { agendarCita, obtenerCitasPaciente, cancelarCita, obtenerCitasDoctor, reprogramarCita, completarCita, obtenerTodasCitas, obtenerCitasDelDoctor, agendarCitaExterna, obtenerCitasHoy, historialPaciente, historialPacienteDoctor } = require('../controllers/cita.controller');

const { verificarToken, esAdmin } = require("../middlewares/auth.middleware");

router.post("/agendar", multer().none(), verificarToken, agendarCita);
router.get("/misCitas", verificarToken, obtenerCitasPaciente);
router.put("/cancelar/:id", verificarToken, cancelarCita);
router.get("/doctor/:id_doctor", verificarToken, obtenerCitasDoctor);
router.put("/reprogramar/:id", multer().none(), verificarToken, reprogramarCita,);
router.put("/completar/:id", multer().none(), verificarToken, completarCita);
router.get("/todas", verificarToken, esAdmin, obtenerTodasCitas);
router.get('/miscitasdoctor', verificarToken, obtenerCitasDelDoctor);
router.post('/agendar-externo', multer().none(), verificarToken, agendarCitaExterna);
router.get('/hoy', verificarToken, obtenerCitasHoy);
router.get('/historial', verificarToken, historialPaciente);
router.get('/historial/:id_paciente', verificarToken, historialPacienteDoctor);
module.exports = router;
