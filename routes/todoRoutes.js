const express = require("express");
const {
  getTodos,
  getTodoById,
  createTodo,
  updateTodo,
  deleteTodo,
  addTask,
  updateTask,
  deleteTask,
} = require("../controllers/todoController");
const { protect } = require("../middleware/authMiddleware");
const { upload } = require("../config/cloudinary");

const router = express.Router();

// Todo routes
router
  .route("/")
  .get(protect, getTodos)
  .post(protect, upload.single("image"), createTodo);

router
  .route("/:id")
  .get(protect, getTodoById)
  .put(protect, upload.single("image"), updateTodo)
  .delete(protect, deleteTodo);

// Task routes
router.route("/:id/tasks").post(protect, addTask);

router
  .route("/:id/tasks/:taskId")
  .put(protect, updateTask)
  .delete(protect, deleteTask);

module.exports = router;
