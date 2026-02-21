const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Notificacion = sequelize.define('notificaciones', {
  id: { type: DataTypes.CHAR(32), primaryKey: true },
  id_usuario: { type: DataTypes.CHAR(32), allowNull: false },
  id_cita: { type: DataTypes.CHAR(32), allowNull: false },
  titulo: { type: DataTypes.STRING(100), allowNull: false },
  mensaje: { type: DataTypes.TEXT, allowNull: false },
  leida: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, { timestamps: false, freezeTableName: true });

module.exports = Notificacion;