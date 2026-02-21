const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DoctorEspecialidad = sequelize.define('doctor_especialidad', {
  id: { type: DataTypes.CHAR(32), primaryKey: true },
  id_doctor: { type: DataTypes.CHAR(32), allowNull: false },
  id_especialidad: { type: DataTypes.CHAR(32), allowNull: false },
}, { timestamps: false, freezeTableName: true });

module.exports = DoctorEspecialidad;