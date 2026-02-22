const express = require('express');
const multer = require('multer');
const router = express.Router();
const { agregarHorario, obtenerHorarios, actualizarHorario, obtenerMisHorarios } = require('../controllers/horario.controller');
const { verificarToken, esAdmin, esDoctor } = require('../middlewares/auth.middleware');

router.post('/agregar', multer().none(), verificarToken, agregarHorario);
router.get('/obtener/:id_doctor', obtenerHorarios);
router.put('/actualizar/:id', multer().none(), verificarToken, actualizarHorario);
router.get('/mio', verificarToken, obtenerMisHorarios);

module.exports = router;