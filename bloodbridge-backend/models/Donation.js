const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Donation = sequelize.define("Donation", {
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
    units: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
    },
    donationDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
    },
    couponCode: {
        type: DataTypes.STRING,
        allowNull: true,
    },
});

module.exports = Donation;