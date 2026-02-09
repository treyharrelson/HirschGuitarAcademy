const { Sequelize, DataTypes } = require('sequelize');
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
		threadId: {
			type: DataTypes.INTEGER,
			allowNull: false,
			references: {
				model: 'Threads',
				key: 'id',
			},
			field: 'thread_id'
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
			field: 'created_at'
		},
		numLikes: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
			field: 'num_likes'
		},
	},
	{
		tableName: 'Posts',
	}
	
)

module.exports = Post;