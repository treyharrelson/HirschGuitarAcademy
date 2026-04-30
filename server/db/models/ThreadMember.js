// This table tracks which users have access to which threads, implemented in private threads
const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const ThreadMember = sequelize.define(
    'ThreadMember',
    {
        threadId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'thread_id'
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'user_id'
        }
    },
    {
        tableName: 'ThreadMembers',
        timestamps: false,
    }
);

module.exports = ThreadMember;