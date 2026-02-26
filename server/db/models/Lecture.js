const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../db');
const Module = require('./Module');

const Lecture = sequelize.define(
    'Lecture',
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
        content: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        moduleId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'module_id'
        },
    },
    {
        tableName: 'Lectures',
        timestamps: true,
    }
);

module.exports = Lecture;
