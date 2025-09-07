const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const { testConnection, syncDatabase } = require("./config/db");
require("dotenv").config();

// Import routes
const authRoutes = require("./routes/authRoutes");
const todoRoutes = require("./routes/todoRoutes");

const app = express();

// Middleware
app.use(helmet());
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? ["https://yourdomain.com"]
        : [
            "http://localhost:3000",
            "http://localhost:3001",
            "http://localhost:5173",
          ],
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/todos", todoRoutes);

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
    database: "SQLite",
    version: "1.0.0",
  });
});

// Root
app.get("/", (req, res) => {
  res.json({
    message: "Todo Backend API with SQLite",
    version: "1.0.0",
    status: "running",
    database: "SQLite",
    docs: "/api",
  });
});

// API info
app.get("/api", (req, res) => {
  res.json({
    message: "Todo API Endpoints",
    endpoints: {
      auth: {
        register: "POST /api/auth/register",
        login: "POST /api/auth/login",
        profile: "GET /api/auth/profile",
      },
      todos: {
        getAll: "GET /api/todos",
        getById: "GET /api/todos/:todoId",
        create: "POST /api/todos",
        update: "PUT /api/todos/:todoId",
        delete: "DELETE /api/todos/:todoId",
      },
      tasks: {
        add: "POST /api/todos/:todoId/tasks",
        update: "PUT /api/todos/:todoId/tasks/:taskId",
        delete: "DELETE /api/todos/:todoId/tasks/:taskId",
      },
    },
  });
});

// Error handling
app.use((err, req, res) => {
  console.error("Error:", err.stack);

  if (err.name === "SequelizeValidationError") {
    const errors = err.errors.map((e) => ({
      field: e.path,
      message: e.message,
    }));
    return res.status(400).json({ message: "Validation Error", errors });
  }

  if (err.name === "SequelizeUniqueConstraintError") {
    return res.status(400).json({
      message: "Duplicate entry",
      field: err.errors[0]?.path || "unknown",
    });
  }

  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({ message: "Invalid token" });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({ message: "Token expired" });
  }

  res.status(err.status || 500).json({
    message: "Something went wrong!",
    error:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Internal server error",
  });
});

// 404
app.use((req, res) => {
  res.status(404).json({
    message: "Route not found",
    path: req.originalUrl,
    suggestion: "Check /api for available endpoints",
  });
});

const PORT = process.env.PORT || 5000;

const Server = async () => {
  try {
    await testConnection();
    await syncDatabase();

    const server = app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`Database: SQLite`);
      console.log(`Env: ${process.env.NODE_ENV || "development"}`);
      console.log(`Docs: http://localhost:${PORT}/api`);
    });

    server.on("error", (error) => {
      if (error.code === "EADDRINUSE") {
        console.error(`Port ${PORT} is already in use`);
        process.exit(1);
      } else {
        console.error("Server error:", error);
      }
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

// Graceful shutdown
const Shutdown = async () => {
  console.log("Shutting down gracefully...");
  try {
    await require("./config/db").sequelize.close();
    console.log("Database connection closed");
    process.exit(0);
  } catch (error) {
    console.error("Error during shutdown:", error);
    process.exit(1);
  }
};

process.on("SIGTERM", Shutdown);
process.on("SIGINT", Shutdown);
process.on("unhandledRejection", (err) => {
  console.error("Unhandled Promise Rejection:", err);
  Shutdown();
});

Server();
