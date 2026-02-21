const express = require('express');
const router = express.Router();
const { obtenerNotificaciones, obtenerNoLeidas, marcarLeida, marcarTodasLeidas } = require('../controllers/notificacion.controller');
const { verificarToken } = require('../middlewares/auth.middleware');

router.get('/mis-notificaciones', verificarToken, obtenerNotificaciones);
router.get('/no-leidas', verificarToken, obtenerNoLeidas);
router.put('/marcar-leida/:id', verificarToken, marcarLeida);
router.put('/marcar-todas', verificarToken, marcarTodasLeidas);

module.exports = router;