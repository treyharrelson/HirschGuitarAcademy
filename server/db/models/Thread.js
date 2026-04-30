const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../db');

const Thread = sequelize.define(
    'Thread',
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
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
        visibility: {
            type: DataTypes.ENUM('public', 'global', 'private'),
            allowNull: false,
            defaultValue: 'public',
        },
        parentThreadId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: 'parent_thread_id',
            references: { model: 'Threads', key: 'id' },
            onDelete: 'SET NULL'
        }
    },
    {
        tableName: 'Threads',
        timestamps: true,
    }
);

module.exports = Thread;