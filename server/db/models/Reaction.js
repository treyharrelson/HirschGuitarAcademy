const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const Reaction = sequelize.define('Reaction', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER, allowNull: false, field: 'user_id' },
    postId: { type: DataTypes.INTEGER, allowNull: true, field: 'post_id' },
    commentId: { type: DataTypes.INTEGER, allowNull: true, field: 'comment_id' },
    type: {
        type: DataTypes.ENUM('like', 'love', 'laugh', 'fire', 'celebrate'),
        allowNull: false
    }
}, {
    tableName: 'Reactions',
    timestamps: true,
    indexes: [
        { unique: true, fields: ['user_id', 'post_id'], where: { post_id: { [require('sequelize').Op.ne]: null } } },
        { unique: true, fields: ['user_id', 'comment_id'], where: { comment_id: { [require('sequelize').Op.ne]: null } } }
    ]
});

module.exports = Reaction;