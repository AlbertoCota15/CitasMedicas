const express = require('express');
const multer = require('multer');
const router = express.Router();
const { verPerfil, editarPerfil, cambiarContrasena } = require('../controllers/perfil.controller');
const { verificarToken } = require('../middlewares/auth.middleware');

router.get('/verPerfil', verificarToken, verPerfil);
router.put('/editarPerfil', multer().none(), verificarToken, editarPerfil);
router.put('/cambiarContrasena', multer().none(), verificarToken, cambiarContrasena);

module.exports = router;