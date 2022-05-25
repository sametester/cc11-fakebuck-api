'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // await queryInterface.addColumn('users', 'last_name', {
    //   type: Sequelize.DataTypes.STRING,
    //   allowNull: false
    // });
    await queryInterface.addColumn('users', 'email', {
      type: Sequelize.DataTypes.STRING,
      allowNull: false,
    });
    await queryInterface.addColumn('users', 'phone_number', {
      type: Sequelize.DataTypes.STRING,
      allowNull: false,
    });
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  },
};
