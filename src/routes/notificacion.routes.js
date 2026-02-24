const express = require('express');
const router = express.Router();
const { obtenerNotificaciones, obtenerNoLeidas, marcarLeida, marcarTodasLeidas, enviarNotificacion, enviarNotificacionTodos } = require('../controllers/notificacion.controller');
const { verificarToken, esAdmin } = require('../middlewares/auth.middleware');
const multer = require('multer');

router.get('/mis-notificaciones', verificarToken, obtenerNotificaciones);
router.get('/no-leidas', verificarToken, obtenerNoLeidas);
router.put('/marcar-leida/:id', verificarToken, marcarLeida);
router.put('/marcar-todas', verificarToken, marcarTodasLeidas);
router.post('/enviar', multer().none(), verificarToken, esAdmin, enviarNotificacion);
router.post('/enviar-todos', multer().none(), verificarToken, esAdmin, enviarNotificacionTodos);

module.exports = router;