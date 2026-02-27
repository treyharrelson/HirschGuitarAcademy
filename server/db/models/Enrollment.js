const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../db');

const Enrollment = sequelize.define(
	'Enrollment',
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
			field: 'course_id'
		},
	},
	{
		tableName: 'Enrollments',
		timestamps: true,
	}
);

module.exports = Enrollment;