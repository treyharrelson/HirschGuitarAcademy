const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const Attachment = sequelize.define(
    'Attachment',
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
        },
        postId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Posts',
                key: 'id',
            },
            field: 'post_id'
        },
        fileKey: {
            type: DataTypes.STRING,
            allowNull: false,
            field: 'file_key'
        },
        fileType: {
            type: DataTypes.STRING,
            allowNull: false,
            field: 'file_type'
        },
        fileName: {
            type: DataTypes.STRING,
            allowNull: false,
            field: 'file_name'
        },
    },
    {
        tableName: 'Attachments',
        timestamps: false,
    }
);

module.exports = Attachment;