const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../db');

const Comment = sequelize.define(
	'Comment',
	{
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
			allowNull: false,
		},
		authorId: {
			type: DataTypes.INTEGER,
			allowNull: false,
			field: 'author_id',
		},
		postId: {
			type: DataTypes.INTEGER,
			allowNull: false,
			field: 'post_id',
		},
		content: {
			type: DataTypes.TEXT,
			allowNull: false,
		},
		numLikes: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
			field: 'num_likes'
		},
	},
	{
		tableName: 'Comments',
		timestamps: true,
	}
);

module.exports = Comment;