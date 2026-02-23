const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../db');

const Message = sequelize.define(
	'Message',
	{
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
			allowNull: false,
		},
		recipientId: {
			type: DataTypes.INTEGER,
			allowNull: false,
			field: 'recipient_id',
		},
		senderId: {
			type: DataTypes.INTEGER,
			allowNull: false,
			field: 'sender_id',
		},
		content: {
			type: DataTypes.TEXT,
			allowNull: false,
		},
		seen: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
		},
	},
	{
		tableName: 'Messages',
		timestamps: true,
	}

)

module.exports = Message;