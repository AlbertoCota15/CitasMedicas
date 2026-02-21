const express = require('express');
const multer = require('multer');
const router = express.Router();
const { registrarUsuario, loginUsuario } = require('../controllers/auth.controller');
const { validarRegistro, validarLogin } = require('../middlewares/auth.validacion');

router.post('/registro', multer().none(), validarRegistro, registrarUsuario);
router.post('/login', multer().none(), validarLogin, loginUsuario);

module.exports = router;