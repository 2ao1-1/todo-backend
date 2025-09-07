// اعمل ملف جديد اسمه test-connection.js
const { Sequelize } = require("sequelize");
require("dotenv").config();

// جرب الاتصال المباشر
const testConnection = async () => {
  console.log("🔍 Testing connection with:", process.env.DATABASE_URL);

  const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: "postgres",
    logging: console.log,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
  });

  try {
    await sequelize.authenticate();
    console.log("✅ Connection successful!");
  } catch (error) {
    console.error("❌ Connection failed:", error.message);

    // جرب بدون SSL
    console.log("🔄 Trying without SSL...");
    const sequelizeNoSSL = new Sequelize(process.env.DATABASE_URL, {
      dialect: "postgres",
      logging: console.log,
    });

    try {
      await sequelizeNoSSL.authenticate();
      console.log("✅ Connection successful without SSL!");
    } catch (error2) {
      console.error("❌ Still failed:", error2.message);
    }
  }
};

testConnection();
