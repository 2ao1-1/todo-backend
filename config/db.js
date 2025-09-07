const { Sequelize } = require("sequelize");
const path = require("path");
require("dotenv").config();

let sequelize;

if (process.env.NODE_ENV === "production" && process.env.VERCEL) {
  sequelize = new Sequelize({
    dialect: "sqlite",
    storage: ":memory:",
    logging: false,
    define: {
      timestamps: true,
      underscored: false,
    },
  });
} else {
  sequelize = new Sequelize({
    dialect: "sqlite",
    storage: path.join(__dirname, "..", "database", "todo.sqlite"),
    logging: process.env.NODE_ENV === "development",
    define: {
      timestamps: true,
      underscored: false,
    },
  });
}

const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log("Database connection established successfully.");

    if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
      const fs = require("fs");
      const dbDir = path.join(__dirname, "..", "database");
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }
    }
  } catch (error) {
    console.error("Unable to connect to the database:", error);
    process.exit(1);
  }
};

const syncDatabase = async () => {
  try {
    await sequelize.sync({
      force: false,
      alter: process.env.NODE_ENV === "development",
    });

    console.log("Database synchronized successfully.");
  } catch (error) {
    console.error("Database sync failed:", error.message);
    throw error;
  }
};

module.exports = { sequelize, testConnection, syncDatabase };
