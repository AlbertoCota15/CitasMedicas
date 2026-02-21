const jwt = require('jsonwebtoken');

const verificarToken = async (req, res, next) => {
  try {
    const token = req.headers['authorization'];
    if (!token) {
      return res.status(401).json({ ok: false, mensaje: 'Token no proporcionado' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ ok: false, mensaje: 'Token inválido o expirado' });
  }
};

const esAdmin = (req, res, next) => {
  if (req.usuario.id_rol !== 1) {
    return res.status(403).json({ ok: false, mensaje: 'No tienes permisos para realizar esta acción' });
  }
  next();
};

const esDoctor = (req, res, next) => {
  if (req.usuario.id_rol !== 2) {
    return res.status(403).json({ ok: false, mensaje: 'No tienes permisos para realizar esta acción' });
  }
  next();
};

const esRecepcionista = (req, res, next) => {
  if (req.usuario.id_rol !== 4) {
    return res.status(403).json({ ok: false, mensaje: 'No tienes permisos para realizar esta acción' });
  }
  next();
};

const esAdminORecepcionista = (req, res, next) => {
  if (req.usuario.id_rol !== 1 && req.usuario.id_rol !== 4) {
    return res.status(403).json({ ok: false, mensaje: 'No tienes permisos para realizar esta acción' });
  }
  next();
};

module.exports = { verificarToken, esAdmin, esDoctor, esRecepcionista, esAdminORecepcionista };