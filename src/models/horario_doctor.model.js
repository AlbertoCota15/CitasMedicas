const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const HorarioDoctor = sequelize.define('horarios_doctor', {
  id: { type: DataTypes.CHAR(32), primaryKey: true },
  id_doctor: { type: DataTypes.CHAR(32), allowNull: false },
  dia_semana: { type: DataTypes.STRING(10), allowNull: false },
  hora_inicio: { type: DataTypes.TIME, allowNull: false },
  hora_fin: { type: DataTypes.TIME, allowNull: false },
  disponible: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
}, { timestamps: false, freezeTableName: true });

module.exports = HorarioDoctor;