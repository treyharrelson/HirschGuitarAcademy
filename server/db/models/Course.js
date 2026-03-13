const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const Course = sequelize.define(
	'Course',
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
		instructorId: {
			type: DataTypes.INTEGER,
			allowNull: false,
			field: 'instructor_id'
		},
		enrolled: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
		},
		completed: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
		},
		isPrivate: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
			field: 'is_private',
		},
	},
	{
		tableName: 'Courses',
		timestamps: true,
	}

)

module.exports = Course;