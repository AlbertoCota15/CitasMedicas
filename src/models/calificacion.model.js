const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Calificacion = sequelize.define('calificaciones', {
  id: { type: DataTypes.CHAR(32), primaryKey: true },
  id_paciente: { type: DataTypes.CHAR(32), allowNull: false },
  id_doctor: { type: DataTypes.CHAR(32), allowNull: false },
  id_cita: { type: DataTypes.CHAR(32), allowNull: false, unique: true },
  calificacion: { type: DataTypes.INTEGER, allowNull: false },
  resena: { type: DataTypes.TEXT, allowNull: true },
  createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, { timestamps: false, freezeTableName: true });

module.exports = Calificacion;