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
		description: {
			type: DataTypes.TEXT,
			allowNull: true,
		},
		thumbnail: {
			type: DataTypes.STRING,
			allowNull: true,
		},
	},
	{
		tableName: 'Courses',
		timestamps: true,
	}

)

module.exports = Course;