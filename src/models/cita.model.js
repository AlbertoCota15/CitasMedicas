const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Cita = sequelize.define('citas', {
  id: { type: DataTypes.CHAR(32), primaryKey: true },
  id_paciente: { type: DataTypes.CHAR(32), allowNull: false },
  id_doctor: { type: DataTypes.CHAR(32), allowNull: false },
  id_especialidad: { type: DataTypes.CHAR(32), allowNull: false },
  fecha: { type: DataTypes.DATEONLY, allowNull: false },
  hora_inicio: { type: DataTypes.TIME, allowNull: false },
  hora_fin: { type: DataTypes.TIME, allowNull: false },
  motivo: { type: DataTypes.TEXT, allowNull: true },
  estado: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'pendiente' },
  notas: { type: DataTypes.TEXT, allowNull: true },
  createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, { timestamps: false, freezeTableName: true });

module.exports = Cita;