const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../db');

const User = sequelize.define(
	'User',
	{
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
			allowNull: false,
		},
		firstName: {
			type: DataTypes.STRING,
			field: 'first_name',
		},
		lastName: {
			type: DataTypes.STRING,
			field: 'last_name',
		},
		userName: {
			type: DataTypes.STRING,
			unique: true,
			allowNull: false,
			field: 'user_name'
		},
		email: {
			type: DataTypes.STRING,
			unique: true,
			allowNull: false,
		},
		password: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		role: {
			type: DataTypes.ENUM('student', 'moderator', 'instructor', 'admin'),
			defaultValue: 'student',
			allowNull: false,
		},
		private: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
			allowNull: false,
		},
		bio: {
			type: DataTypes.TEXT,
			allowNull: true,
		},
	},
	{
		tableName: 'Users',
		timestamps: true,
	}

);

module.exports = User;