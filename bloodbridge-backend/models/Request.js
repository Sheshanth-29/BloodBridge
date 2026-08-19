const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Request = sequelize.define("Request", {
  requesterType: {
    type: DataTypes.ENUM("hospital", "patient"),
    allowNull: false,
  },
  requesterId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  requesterName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  contactPhone: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  contactEmail: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  address: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  bloodGroup: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  units: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
  status: {
    type: DataTypes.ENUM("Pending", "Approved", "Declined", "Delivered"),
    allowNull: false,
    defaultValue: "Pending",
  },
  dispatchedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
});

module.exports = Request;