const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const { testConnection, syncDatabase } = require("./config/db");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const todoRoutes = require("./routes/todoRoutes");

const app = express();

const validateEnvVars = () => {
  const required = ["JWT_SECRET", "DATABASE_URL"];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    if (process.env.NODE_ENV === "production") {
      process.exit(1);
    }
  }
};

validateEnvVars();

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "http://localhost:4200",
  "http://127.0.0.1:5173",
  "https://todo-list.2ao1.space",
  "https://www.todo-list.2ao1.space",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, origin || true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
      "Origin",
    ],
  })
);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
  })
);

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/todos", todoRoutes);

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "production",
    database: "PostgreSQL",
    version: "1.0.0",
  });
});

app.get("/", (req, res) => {
  res.json({
    message: "Todo Backend API with PostgreSQL",
    version: "1.0.0",
    status: "running",
    database: "PostgreSQL",
    docs: "/api",
  });
});

app.get("/api", (req, res) => {
  res.json({
    message: "Todo API Endpoints",
    database: "PostgreSQL",
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

// Error handlers
app.use((err, req, res, _next) => {
  if (err.message === "Not allowed by CORS") {
    return res.status(403).json({
      message: "CORS policy: Origin not allowed",
      origin: req.headers.origin,
    });
  }

  if (err.name === "SequelizeValidationError") {
    const errors = err.errors.map((e) => ({
      field: e.path,
      message: e.message,
    }));
    return res.status(400).json({
      message: "Validation Error",
      errors,
    });
  }

  if (err.name === "SequelizeUniqueConstraintError") {
    return res.status(400).json({
      message: "Duplicate entry",
      field: err.errors[0]?.path || "unknown",
    });
  }

  if (err.name === "SequelizeConnectionError") {
    return res.status(500).json({
      message: "Database connection failed",
      error:
        process.env.NODE_ENV === "development"
          ? err.message
          : "Database unavailable",
    });
  }

  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({ message: "Invalid token" });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({ message: "Token expired" });
  }

  console.error("Error:", err);
  res.status(err.status || 500).json({
    message: "Something went wrong!",
    error:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Internal server error",
  });
});

app.use((req, res) => {
  res.status(404).json({
    message: "Route not found",
    path: req.originalUrl,
    suggestion: "Check /api for available endpoints",
  });
});

// Database initialization
let isInitialized = false;
let initializationPromise = null;

const initializeDatabase = async () => {
  if (initializationPromise) {
    return initializationPromise;
  }

  if (isInitialized) {
    return Promise.resolve();
  }

  initializationPromise = (async () => {
    try {
      console.log("Connecting to database...");
      await testConnection();
      console.log("Database connected successfully");

      console.log("Syncing database...");
      await syncDatabase();
      console.log("Database synced successfully");

      isInitialized = true;
    } catch (error) {
      console.error("Database initialization error:", error);
      initializationPromise = null;
      throw error;
    }
  })();

  return initializationPromise;
};

// Vercel serverless handler
const handler = async (req, res) => {
  try {
    await initializeDatabase();
    return app(req, res);
  } catch (error) {
    console.error("Handler error:", error);
    return res.status(500).json({
      message: "Database initialization failed",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

// Local development server
if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;

  const startServer = async () => {
    try {
      await initializeDatabase();

      const server = app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
        console.log(`API docs at http://localhost:${PORT}/api`);
      });

      server.on("error", (error) => {
        if (error.code === "EADDRINUSE") {
          console.error(`Port ${PORT} is already in use`);
          process.exit(1);
        }
      });
    } catch (error) {
      console.error("Failed to start server:", error);
      process.exit(1);
    }
  };

  startServer();
}

// Graceful shutdown
const shutdown = async () => {
  try {
    console.log("Shutting down gracefully...");
    const { sequelize } = require("./config/db");
    await sequelize.close();
    console.log("Database connection closed");
    process.exit(0);
  } catch (error) {
    console.error("Error during shutdown:", error);
    process.exit(1);
  }
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
process.on("unhandledRejection", (err) => {
  console.error("Unhandled rejection:", err);
  shutdown();
});

module.exports = handler;
