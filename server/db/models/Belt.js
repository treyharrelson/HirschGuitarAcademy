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
		userId: {
			type: DataTypes.INTEGER,
			allowNull: false,
			field: 'user_id',
		},
		courseId: {
			type: DataTypes.INTEGER,
			allowNull: false,
			field: 'course_id',
		},
	},
	{
		tableName: 'Belts',
		timestamps: true,
	}

)

module.exports = Belt;