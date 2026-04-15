const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../db');
const User = require('./User')
const Thread = require('./Thread')

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
			allowNull: true,
			field: 'thread_id',
		},
		authorId: {
			type: DataTypes.INTEGER,
			allowNull: false,
			field: 'author_id',
		},
		content: {
			type: DataTypes.TEXT,
			allowNull: false,
		},
		scope: {
			type: DataTypes.ENUM('thread', 'global'),
			allowNull: false,
			defaultValue: 'thread'
		},
		// set when scope='global' and this post announces a new thread
		announcedThreadId: {
			type: DataTypes.INTEGER,
			allowNull: true,
			field: 'announced_thread_id',
		},
		numLikes: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
			field: 'num_likes'
		},
	},
	{
		tableName: 'Posts',
		timestamps: true,
	}

)

module.exports = Post;
