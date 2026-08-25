const { Sequelize } = require("sequelize");
require("dotenv").config();

// Aiven Cloud (and most managed DB providers) require SSL.
// DB_SSL=true  → enable SSL (used on Render / production)
// DB_SSL=false → no SSL   (used locally with a plain MySQL install)
const useSSL = process.env.DB_SSL === "true";

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10),
    dialect: process.env.DB_DIALECT,
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    // Required for Aiven Cloud MySQL — connections without SSL are rejected
    ...(useSSL && {
      dialectOptions: {
        ssl: {
          rejectUnauthorized: true,  // Aiven uses a trusted CA — keep this true
        },
        connectTimeout: 60000,       // extra time for Render cold-starts
      },
    }),
  }
);

module.exports = sequelize;