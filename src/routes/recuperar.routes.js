const express = require('express');
const multer = require('multer');
const router = express.Router();
const { recuperarContrasena } = require('../controllers/recuperar.controller');

router.post('/contrasena', multer().none(), recuperarContrasena);

module.exports = router;