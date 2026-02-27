const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../db');

const Thread = sequelize.define(
    'Thread',
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        authorId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'author_id'
        },
    },
    {
        tableName: 'Threads',
        timestamps: true,
    }
);

module.exports = Thread;