'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Create the Badges table
    await queryInterface.createTable('Badges', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      name: { type: Sequelize.STRING, allowNull: false },
      image_url: { type: Sequelize.STRING, allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });

    // 2. Add completion_badge_id to Courses
    await queryInterface.addColumn('Courses', 'completion_badge_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'Badges', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });

    // 3. Add active_badge_id to Users
    await queryInterface.addColumn('Users', 'active_badge_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'Badges', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });

    // 4. Create the User_Badges Join Table
    await queryInterface.createTable('User_Badges', {
      user_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        references: { model: 'Users', key: 'id' },
        onDelete: 'CASCADE',
      },
      badge_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        references: { model: 'Badges', key: 'id' },
        onDelete: 'CASCADE',
      },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
  },

  async down(queryInterface, Sequelize) {
    // Drop in reverse order to respect foreign key constraints
    await queryInterface.dropTable('User_Badges');
    await queryInterface.removeColumn('Users', 'active_badge_id');
    await queryInterface.removeColumn('Courses', 'completion_badge_id');
    await queryInterface.dropTable('Badges');
  }
};