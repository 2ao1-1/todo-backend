const { Sequelize } = require("sequelize");
require("dotenv").config();

// Use DATABASE_URL from Neon
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: "postgres",
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
  logging: process.env.NODE_ENV === "development",
  define: {
    timestamps: true,
    underscored: false,
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});

const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log("PostgreSQL connection established successfully");
  } catch (error) {
    console.error("Unable to connect to database:", error.message);
    process.exit(1);
  }
};

const syncDatabase = async () => {
  try {
    await sequelize.sync({
      force: false,
      alter: process.env.NODE_ENV === "development",
    });
    console.log("Database sync completed");
  } catch (error) {
    console.error("Database sync failed:", error.message);
    throw error;
  }
};

module.exports = { sequelize, testConnection, syncDatabase };
