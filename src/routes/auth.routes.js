const express = require('express');
const multer = require('multer');
const router = express.Router();
const { registrarUsuario, loginUsuario, obtenerUsuarios } = require('../controllers/auth.controller');
const { validarRegistro, validarLogin } = require('../middlewares/auth.validacion');
const { verificarToken, esAdmin } = require('../middlewares/auth.middleware');

router.post('/registro', multer().none(), validarRegistro, registrarUsuario);
router.post('/login', multer().none(), validarLogin, loginUsuario);
router.get('/usuarios', verificarToken, esAdmin, obtenerUsuarios);

module.exports = router;