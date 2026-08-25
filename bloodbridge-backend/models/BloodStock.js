const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const BloodStock = sequelize.define("BloodStock", {
  bloodBankId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  bloodGroup: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  units: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  expiryDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
});

module.exports = BloodStock;
