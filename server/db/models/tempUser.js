const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../db');

const TempUser = sequelize.define(
	'TempUser',
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
		token: {
			type: DataTypes.STRING,
			allowNull: true,
		},
		emailConfirmed: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
			allowNull: false,
			field: 'email_confirmed',
		},
		adminConfirmed: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
			allowNull: false,
			field: 'admin_confirmed',
		}
	},
	{
		tableName: 'TempUsers',
		timestamps: true,
	}

);

module.exports = TempUser;