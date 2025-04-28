const { Sequelize } = require("sequelize");
const path = require("path");

// Initialize Sequelize with SQLite locally or PostgreSQL on Render
const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: path.join(__dirname, "../database.sqlite"),
  logging: false,
});

// Test database connection
const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("Connection to database has been established successfully.");
    return sequelize;
  } catch (error) {
    console.error("Unable to connect to the database:", error);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };
