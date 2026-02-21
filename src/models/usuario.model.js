const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Usuario = sequelize.define('usuarios', {
  id: {
    type: DataTypes.CHAR(32),
    primaryKey: true,
  },
  id_rol: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 3,
  },
  nombre: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  apellido: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  usuario: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
  },
  correo: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
  },
  telefono: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  direccion: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  contrasena: {
    type: DataTypes.CHAR(32),
    allowNull: false,
  },
  estado: {
  type: DataTypes.STRING(20),
  allowNull: false,
  defaultValue: 'activo',
},
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  timestamps: false,
  freezeTableName: true,
});

module.exports = Usuario;
