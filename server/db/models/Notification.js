const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../db');

const Notification = sequelize.define(
	'Notification',
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
		content: {
			type: DataTypes.TEXT,
			allowNull: false,
		},
		seen: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
		},
		urgency: {
			type: DataTypes.ENUM('normal', 'urgent'),
			defaultValue: 'normal',
		},
	},
	{
		tableName: 'Notification',
		timestamps: true,
	}
);

module.exports = Notification;