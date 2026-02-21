const express = require("express");
const multer = require("multer");
const router = express.Router();
const {
  registrarDoctor,
  aprobarDoctor,
  obtenerDoctores,
  buscarPorEspecialidad,verDisponibilidad 
} = require("../controllers/doctor.controller");
const { validarRegistroDoctor } = require("../middlewares/doctor.validacion");
const { verificarToken, esAdmin } = require("../middlewares/auth.middleware");

router.post(
  "/registro",
  multer().none(),
  validarRegistroDoctor,
  registrarDoctor,
);
router.put("/aprobar/:id", verificarToken, esAdmin, aprobarDoctor);
router.get("/porEspecialidad/:id_especialidad", buscarPorEspecialidad);
router.get("/obtener", obtenerDoctores);
router.get('/disponibilidad/:id_doctor/:fecha', verDisponibilidad);

module.exports = router;
