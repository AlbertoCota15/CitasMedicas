const express = require('express');
const router = express.Router();
const { obtenerUsuarios, crearUsuario, editarUsuario, eliminarUsuario } = require('../controllers/usuario.controller');
const { verificarToken, esAdmin } = require('../middlewares/auth.middleware');
const multer = require('multer');

router.get('/', verificarToken, esAdmin, obtenerUsuarios);
router.post('/crear', multer().none(), verificarToken, esAdmin, crearUsuario);
router.put('/editar/:id', multer().none(), verificarToken, esAdmin, editarUsuario);
router.delete('/eliminar/:id', verificarToken, esAdmin, eliminarUsuario);

module.exports = router;