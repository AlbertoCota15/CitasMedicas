const express = require('express');
const multer = require('multer');
const router = express.Router();
const { calificarDoctor, obtenerCalificaciones } = require('../controllers/calificacion.controller');
const { verificarToken } = require('../middlewares/auth.middleware');

router.post('/calificar', multer().none(), verificarToken, calificarDoctor);
router.get('/doctor/:id_doctor', obtenerCalificaciones);

module.exports = router;