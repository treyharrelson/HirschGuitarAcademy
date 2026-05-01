'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('TempUsers', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      firstName: {
        type: Sequelize.STRING,
        field: 'first_name',
      },
      lastName: {
        type: Sequelize.STRING,
        field: 'last_name',
      },
      userName: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: false,
        field: 'user_name'
      },
      email: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: false,
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      role: {
        type: Sequelize.ENUM('student', 'moderator', 'instructor', 'admin'),
        defaultValue: 'student',
        allowNull: false,
      },
      name: {
        type: Sequelize.VIRTUAL,
        get() {
          const first = this.getDataValue('firstName');
          const last = this.getDataValue('lastName');
          if (first || last) {
            return `${first || ''} ${last || ''}`.trim();
          }
          return this.getDataValue('userName');
        }
      },
      token: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      emailConfirmed: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
        field: 'email_confirmed',
      },
      adminConfirmed: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
        field: 'admin_confirmed',
      }
    });

    
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Badges');
  }
};
