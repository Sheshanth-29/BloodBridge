const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const DonorAlert = sequelize.define("DonorAlert", {
  donorId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  bloodBankId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  bloodBankName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  bloodGroup: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  message: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: "Your blood is needed right now! Can you donate?",
  },
  status: {
    type: DataTypes.ENUM("pending", "accepted", "declined", "completed"),
    allowNull: false,
    defaultValue: "pending",
  },
});

module.exports = DonorAlert;
