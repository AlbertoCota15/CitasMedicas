const Joi = require('joi');

const validarRegistroDoctor = (req, res, next) => {
  const schema = Joi.object({
    nombre: Joi.string().max(100).required().messages({
      'string.empty': 'El nombre es requerido',
      'any.required': 'El nombre es requerido',
    }),
    apellido: Joi.string().max(100).required().messages({
      'string.empty': 'El apellido es requerido',
      'any.required': 'El apellido es requerido',
    }),
    usuario: Joi.string().max(50).required().messages({
      'string.empty': 'El usuario es requerido',
      'any.required': 'El usuario es requerido',
    }),
    correo: Joi.string().email().max(255).required().messages({
      'string.empty': 'El correo es requerido',
      'string.email': 'El correo no tiene un formato válido',
      'any.required': 'El correo es requerido',
    }),
    telefono: Joi.string().pattern(/^[0-9]{10}$/).optional().messages({
      'string.pattern.base': 'El teléfono debe tener exactamente 10 dígitos',
    }),
    direccion: Joi.string().max(255).optional().allow(''),
    contrasena: Joi.string().min(6).required().messages({
      'string.empty': 'La contraseña es requerida',
      'string.min': 'La contraseña debe tener al menos 6 caracteres',
      'any.required': 'La contraseña es requerida',
    }),
    confirmar_contrasena: Joi.string().valid(Joi.ref('contrasena')).required().messages({
      'any.only': 'Las contraseñas no coinciden',
      'any.required': 'La confirmación de contraseña es requerida',
    }),
    cedula: Joi.string().max(20).required().messages({
      'string.empty': 'La cédula es requerida',
      'any.required': 'La cédula es requerida',
    }),
    consultorio: Joi.string().max(100).optional().allow(''),
    duracion_cita: Joi.number().integer().min(10).max(120).optional().messages({
      'number.base': 'La duración debe ser un número',
      'number.min': 'La duración mínima es 10 minutos',
      'number.max': 'La duración máxima es 120 minutos',
    }),
  });

  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      ok: false,
      errores: error.details.map((e) => e.message),
    });
  }
  next();
};

module.exports = { validarRegistroDoctor };