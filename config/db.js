const { Sequelize } = require("sequelize");
require("dotenv").config();

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not defined in .env file");
  process.exit(1);
}

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: "postgres",

  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },

  logging: process.env.NODE_ENV === "development" ? console.log : false,

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
    return true;
  } catch (error) {
    console.error("Unable to connect to database:", error.message);

    if (process.env.NODE_ENV === "production") {
      process.exit(1);
    }
    return false;
  }
};

const syncDatabase = async () => {
  try {
    await sequelize.sync({
      force: false,
      alter: process.env.NODE_ENV === "development",
    });
    console.log("Database schema synchronized");

    if (process.env.NODE_ENV === "development") {
      console.log("Development mode: Schema auto-updated");
    }

    return true;
  } catch (error) {
    console.error("Database sync failed:", error.message);
    throw error;
  }
};

const closeConnection = async () => {
  try {
    await sequelize.close();
    console.log("Database connection closed");
  } catch (error) {
    console.error("Error closing connection:", error.message);
  }
};

module.exports = {
  sequelize,
  testConnection,
  syncDatabase,
  closeConnection,
};
