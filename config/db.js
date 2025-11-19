const { Sequelize } = require("sequelize");
require("dotenv").config();

if (!process.env.DATABASE_URL) {
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
    return true;
  } catch (error) {
    if (process.env.NODE_ENV === "production") {
      process.exit(1);
    }
    return false;
  }
};

const syncDatabase = async () => {
  await sequelize.sync({
    force: false,
    alter: process.env.NODE_ENV === "development",
  });

  return true;
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
