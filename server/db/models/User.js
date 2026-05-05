const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../db');
const ProfileSettings = require('./ProfileSettings');

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
		name: {
			type: DataTypes.VIRTUAL,
			get() {
				const first = this.getDataValue('firstName');
				const last = this.getDataValue('lastName');
				if (first || last) {
					return `${first || ''} ${last || ''}`.trim();
				}
				return this.getDataValue('userName');
			}
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
		bio: {
			type: DataTypes.TEXT,
			allowNull: true,
		},
		activeBadgeId: {
			type: DataTypes.INTEGER,
			allowNull: true,
			field: 'active_badge_id',
		}
	},
	{
		tableName: 'Users',
		timestamps: true,
	}

);

module.exports = User;