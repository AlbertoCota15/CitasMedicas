const express = require("express");
const multer = require("multer");
const router = express.Router();
const {
  agendarCita,
  obtenerCitasPaciente,
  cancelarCita,
  obtenerCitasDoctor,
  reprogramarCita,
  completarCita 
} = require("../controllers/cita.controller");
const { verificarToken } = require("../middlewares/auth.middleware");

router.post("/agendar", multer().none(), verificarToken, agendarCita);
router.get("/misCitas", verificarToken, obtenerCitasPaciente);
router.put("/cancelar/:id", verificarToken, cancelarCita);
router.get("/doctor/:id_doctor", verificarToken, obtenerCitasDoctor);
router.put('/reprogramar/:id', multer().none(), verificarToken, reprogramarCita);
router.put('/completar/:id', multer().none(), verificarToken, completarCita);



module.exports = router;
