// going to use this for Forum subscriptions
const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../db');

const Subscription = sequelize.define(
	'Subscription',
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
		threadId: {
			type: DataTypes.INTEGER,
			allowNull: false,
			field: 'thread_id',
		},
		lastReadAt: {
			type: DataTypes.DATE,
			allowNull: true,
			defaultValue: null,
			field: 'last_read_at',
		},
	},
	{
		tableName: 'Subscriptions',
		timestamps: true,
	}

)

module.exports = Subscription;