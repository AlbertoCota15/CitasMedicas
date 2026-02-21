const express = require('express');
const router = express.Router();
const { generarHistorial, generarHistorialDoctor } = require('../controllers/historial.controller');
const { verificarToken, esDoctor } = require('../middlewares/auth.middleware');

router.get('/miHistorial', verificarToken, generarHistorial);
router.get('/miHistorialDoctor', verificarToken, esDoctor, generarHistorialDoctor);

module.exports = router;