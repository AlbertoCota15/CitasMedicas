const express = require("express");
const multer = require("multer");
const router = express.Router();
const { registrarDoctor, aprobarDoctor, obtenerDoctores, buscarPorEspecialidad, verDisponibilidad, obtenerDoctoresPendientes, editarDoctor, eliminarDoctor } = require('../controllers/doctor.controller');

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
router.get('/pendientes', verificarToken, esAdmin, obtenerDoctoresPendientes);
router.put('/editar/:id', multer().none(), verificarToken, esAdmin, editarDoctor);
router.delete('/eliminar/:id', verificarToken, esAdmin, eliminarDoctor);
module.exports = router;
