const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const CourseRequirement = sequelize.define(
	'CourseRequirement',
	{
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
			allowNull: false,
		},
		courseId: {
			type: DataTypes.INTEGER,
			allowNull: false,
			field: 'course_id',
		},
		requiredCourseId: {
			type: DataTypes.INTEGER,
			allowNull: false,
			field: 'required_course_id'
		},
	},
	{
		tableName: 'CourseRequirements',
		timestamps: true,
	}
);

module.exports = CourseRequirement;
