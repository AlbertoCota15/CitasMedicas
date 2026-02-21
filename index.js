const express = require('express');
const dotenv = require('dotenv');
const authRoutes = require('./src/routes/auth.routes');
const doctorRoutes = require('./src/routes/doctor.routes');
const especialidadRoutes = require('./src/routes/especialidad.routes');
const horarioRoutes = require('./src/routes/horario.routes');
const citaRoutes = require('./src/routes/cita.routes');
const notificacionRoutes = require('./src/routes/notificacion.routes');
const historialRoutes = require('./src/routes/historial.routes');
const perfilRoutes = require('./src/routes/perfil.routes');
const calificacionRoutes = require('./src/routes/calificacion.routes');


dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/doctores', doctorRoutes);
app.use('/api/especialidades', especialidadRoutes);
app.use('/api/horarios', horarioRoutes);
app.use('/api/citas', citaRoutes);
app.use('/api/notificaciones', notificacionRoutes);
app.use('/api/historial', historialRoutes);
app.use('/api/perfil', perfilRoutes);
app.use('/api/calificaciones', calificacionRoutes);

app.get('/', (req, res) => {
  res.json({ message: '¡API Citas Médicas funcionando! 🏥' });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});