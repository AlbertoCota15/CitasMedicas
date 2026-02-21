const express = require('express');
const multer = require('multer');
const router = express.Router();
const { agregarHorario, obtenerHorarios, actualizarHorario } = require('../controllers/horario.controller');
const { verificarToken, esAdmin, esDoctor } = require('../middlewares/auth.middleware');

router.post('/agregar', multer().none(), verificarToken, esAdmin, agregarHorario);
router.get('/obtener/:id_doctor', obtenerHorarios);
router.put('/actualizar/:id', multer().none(), verificarToken, esAdmin, actualizarHorario);

module.exports = router;