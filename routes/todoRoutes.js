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

// @route   GET /api/todos
// @route   POST /api/todos
// @access  Private
router
  .route("/")
  .get(protect, getTodos)
  .post(protect, upload.single("image"), createTodo);

// @route   GET /api/todos/:todoId
// @route   PUT /api/todos/:todoId
// @route   DELETE /api/todos/:todoId
// @access  Private
router
  .route("/:todoId")
  .get(protect, getTodoById)
  .put(protect, upload.single("image"), updateTodo)
  .delete(protect, deleteTodo);

// @route   POST /api/todos/:todoId/tasks
// @access  Private
router.post("/:todoId/tasks", protect, addTask);

// @route   PUT /api/todos/:todoId/tasks/:taskId
// @route   DELETE /api/todos/:todoId/tasks/:taskId
// @access  Private
router
  .route("/:todoId/tasks/:taskId")
  .put(protect, updateTask)
  .delete(protect, deleteTask);

module.exports = router;
