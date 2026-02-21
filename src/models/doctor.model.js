const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Doctor = sequelize.define('doctores', {
  id: { type: DataTypes.CHAR(32), primaryKey: true },
  id_usuario: { type: DataTypes.CHAR(32), allowNull: false, unique: true },
  cedula: { type: DataTypes.STRING(20), allowNull: false, unique: true },
  consultorio: { type: DataTypes.STRING(100), allowNull: true },
  duracion_cita: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 30 },
  estado: { type: DataTypes.STRING(10), allowNull: false, defaultValue: 'activo' },
  createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, { timestamps: false, freezeTableName: true });

const Usuario = require('./usuario.model');
Doctor.belongsTo(Usuario, { foreignKey: 'id_usuario', as: 'usuario' });

module.exports = Doctor;