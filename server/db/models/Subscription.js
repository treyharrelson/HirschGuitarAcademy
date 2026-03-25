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
	},
	{
		tableName: 'Subscriptions',
		timestamps: true,
	}

)

module.exports = Subscription;