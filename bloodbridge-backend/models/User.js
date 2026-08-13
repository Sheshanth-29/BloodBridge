const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const User = sequelize.define("User", {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM("donor", "hospital", "bloodbank"),
    allowNull: false,
  },

  // Donor-specific fields (null for hospital/bloodbank)
  bloodGroup: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  city: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM("available", "unavailable"),
    allowNull: true,
    defaultValue: "available",
  },
  lastDonationDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  nextEligibleDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },

  // Hospital / Blood bank specific fields (null for donor)
  orgName: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  address: {
    type: DataTypes.STRING,
    allowNull: true,
  },
});

module.exports = User;