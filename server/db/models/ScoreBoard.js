const { DataTypes } = require('sequelize');
const sequelize = require('../db');
const { DatatypeModule } = require('@faker-js/faker');

const ScoreBoard = sequelize.define(
	'Scoreboard',
	{
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
			allowNull: false,
		},
		belts: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
		},
		awards: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
		},
		practiceTime: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
		},
	},
	{
		tableName: 'Scoreboard',
		timestamps: true,
	}

)

module.exports = ScoreBoard;