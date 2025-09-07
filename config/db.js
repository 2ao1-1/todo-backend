const { Sequelize } = require("sequelize");
const path = require("path");
require("dotenv").config();

const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: path.join(__dirname, "..", "database", "todo.sqlite"),
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

    const fs = require("fs");
    const dbDir = path.join(__dirname, "..", "database");
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
  } catch (error) {
    process.exit(1);
  }
};

const syncDatabase = async () => {
  try {
    await sequelize.sync({
      force: false,
      alter: process.env.NODE_ENV === "development",
    });
  } catch (error) {
    console.error("Database sync failed:", error.message);
    throw error;
  }
};

module.exports = { sequelize, testConnection, syncDatabase };
