const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const Post = sequelize.define(
	'Post',
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
			references: {
				model: 'Users',
				key: 'id',
			}
		},
		content: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		datePosted: {
			type: DataTypes.DATE,
			defaultValue: DataTypes.NOW,
		},
		numLikes: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
		},
	},
	{
		tableName: 'Posts',
	}
	
)

module.exports = Post;