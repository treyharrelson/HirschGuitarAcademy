const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../db');

const ProfileSettings = sequelize.define(
	'ProfileSettings',
	{
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
			allowNull: false,
		},
		userId: {
			type: DataTypes.INTEGER,
			field: 'user_id',
		},
		private: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
		},
		showName: {
			type: DataTypes.BOOLEAN,
			defaultValue: true,

		}
	},
	{
		tableName: 'ProfileSettings',
		timestamps: true,
	}

);

module.exports = ProfileSettings;