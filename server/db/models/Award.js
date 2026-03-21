const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const Award = sequelize.define(
	'Award',
	{
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
			allowNull: false,
		},
	},
	{
		tableName: 'Awards',
		timestamps: true,
	}

)

module.exports = Award;