const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../db');

const ThreadBan = sequelize.define(
    'ThreadBan',
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false
        },
        threadId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'thread_id'
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'user_id'
        },
        bannedById: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'banned_by_id'
        }
    },
    {
        tableName: 'ThreadBans',
        timestamps: true,
    }
);

module.exports = ThreadBan;
