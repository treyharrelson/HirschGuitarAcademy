const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const PracticeTime = sequelize.define(
	'PracticeTime',
	{
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
			allowNull: false,
		},
		totalTime: {
			type: DataTypes.INTEGER,
			allowNull: false,
			field: 'total_time',
		},
		timeThisWeek: {
			type: DataTypes.INTEGER,
			field: 'time_this_week',
		},
	},
	{
		tableName: 'Practicetimes',
		timestamps: true,
	}

)

module.exports = PracticeTime;