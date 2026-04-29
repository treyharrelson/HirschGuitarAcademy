const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../db');

const Progress = sequelize.define('Progress', {
    userId: {
        type: DataTypes.INTEGER,
        field: 'user_id'
    },
    courseId: {
        type: DataTypes.INTEGER,
        field: 'course_id'
    },
    lectureId: {
        type: DataTypes.INTEGER,
        field: 'lecture_id'
    }
}, {
    tableName: 'Progress',
    timestamps: true,
});

module.exports = Progress;