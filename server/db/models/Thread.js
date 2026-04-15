const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../db');

const Thread = sequelize.define(
    'Thread',
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true, // <--- This line is missing!
            allowNull: true
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