const express = require('express');
const dotenv = require('dotenv');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const authRoutes = require('./src/routes/auth.routes');
const doctorRoutes = require('./src/routes/doctor.routes');
const especialidadRoutes = require('./src/routes/especialidad.routes');
const horarioRoutes = require('./src/routes/horario.routes');
const citaRoutes = require('./src/routes/cita.routes');
const notificacionRoutes = require('./src/routes/notificacion.routes');
const historialRoutes = require('./src/routes/historial.routes');
const perfilRoutes = require('./src/routes/perfil.routes');
const calificacionRoutes = require('./src/routes/calificacion.routes');
const recuperarRoutes = require('./src/routes/recuperar.routes');
const reporteRoutes = require('./src/routes/reporte.routes');
const usuarioRoutes = require('./src/routes/usuario.routes');


dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Helmet - headers de seguridad
app.use(helmet());

// CORS - controla quién puede consumir la API
app.use(cors({
  origin: '*', // En producción cambia esto por tu dominio o IP
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'authorization'],
}));

// Rate limiting - máximo 100 peticiones por 15 minutos por IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500, // subimos de 100 a 500 para desarrollo
  message: {
    ok: false,
    mensaje: 'Demasiadas peticiones, intenta de nuevo en 15 minutos',
  },
});

const limiterAuth = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50, // subimos de 10 a 50 para desarrollo
  message: {
    ok: false,
    mensaje: 'Demasiados intentos, intenta de nuevo en 15 minutos',
  },
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Aplicar rate limiting global
app.use('/api/', limiter);

// Aplicar rate limiting estricto en auth
app.use('/api/auth', limiterAuth);

app.use('/api/auth', authRoutes);
app.use('/api/doctores', doctorRoutes);
app.use('/api/especialidades', especialidadRoutes);
app.use('/api/horarios', horarioRoutes);
app.use('/api/citas', citaRoutes);
app.use('/api/notificaciones', notificacionRoutes);
app.use('/api/historial', historialRoutes);
app.use('/api/perfil', perfilRoutes);
app.use('/api/calificaciones', calificacionRoutes);
app.use('/api/recuperar', recuperarRoutes);
app.use('/api/reportes', reporteRoutes);
app.use('/api/usuarios', usuarioRoutes);

app.get('/', (req, res) => {
  res.json({ message: '¡API Citas Médicas funcionando! 🏥' });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});