const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const Belt = sequelize.define(
	'Belt',
	{
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
			allowNull: false,
		},
	},
	{
		tableName: 'Belts',
		timestamps: true,
	}

)

module.exports = Belt;