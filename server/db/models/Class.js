const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../db');

const Class = sequelize.define(
	'Class',
	{
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
			allowNull: false,
		},
		name: {
			type: DataTypes.STRING,
			unique: true,
			allowNull: false,
		},
		enrolled: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
		},
		capacity: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
	},
	{
		tableName: 'Classes',
	}
	
)

module.exports = Class;