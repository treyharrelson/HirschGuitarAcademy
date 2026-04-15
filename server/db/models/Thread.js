const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../db');

const Thread = sequelize.define(
    'Thread',
    {
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1, // Change this to a valid ID from your Threads table
            references: {
                model: 'Threads',
                key: 'id'
            }
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        authorId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'author_id'
        },
        isGlobalFeed: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            field: 'is_global_feed',
        },
    },
    {
        tableName: 'Threads',
        timestamps: true,
    }
);

module.exports = Thread;