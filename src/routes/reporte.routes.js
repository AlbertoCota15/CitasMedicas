const express = require('express');
const router = express.Router();
const { reporteGeneral, reporteCitasPeriodo, estadisticasDoctor, reporteEspecialidades, reporteUsuariosPDF, reporteDoctoresPDF, reporteEspecialidadesPDF, reporteCitasEstadoPDF, datosGraficas, historialPDF } = require('../controllers/reporte.controller');
const { verificarToken, esAdmin } = require('../middlewares/auth.middleware');

router.get('/general', verificarToken, esAdmin, reporteGeneral);
router.get('/citas/periodo', verificarToken, esAdmin, reporteCitasPeriodo);
router.get('/doctores/estadisticas', verificarToken, esAdmin, estadisticasDoctor);
router.get('/especialidades', verificarToken, esAdmin, reporteEspecialidades);
router.get('/usuarios/pdf', verificarToken, esAdmin, reporteUsuariosPDF);
router.get('/doctores/pdf', verificarToken, esAdmin, reporteDoctoresPDF);
router.get('/especialidades/pdf', verificarToken, esAdmin, reporteEspecialidadesPDF);
router.get('/citas/estado/:estado', verificarToken, esAdmin, reporteCitasEstadoPDF);
router.get('/graficas', verificarToken, esAdmin, datosGraficas);
router.get('/historial-pdf', verificarToken, historialPDF);

module.exports = router;