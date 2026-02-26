const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../db');
const Course = require('./Course');

const Module = sequelize.define(
    'Module',
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
        order: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        courseId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'course_id'
        },
    },
    {
        tableName: 'Modules',
        timestamps: true,
    }
);

module.exports = Module;
