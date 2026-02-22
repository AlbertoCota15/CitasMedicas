const express = require('express');
const multer = require('multer');
const router = express.Router();
const { agregarEspecialidad, obtenerEspecialidades, asignarEspecialidad, editarEspecialidad, eliminarEspecialidad } = require('../controllers/especialidad.controller');
const { verificarToken, esAdmin } = require('../middlewares/auth.middleware');

router.post('/agregar', multer().none(), verificarToken, esAdmin, agregarEspecialidad);
router.get('/obtener', obtenerEspecialidades);
router.post('/asignar', multer().none(), verificarToken, esAdmin, asignarEspecialidad);
router.put('/editar/:id', multer().none(), verificarToken, esAdmin, editarEspecialidad);
router.delete('/eliminar/:id', verificarToken, esAdmin, eliminarEspecialidad);
module.exports = router;