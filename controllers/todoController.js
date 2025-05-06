const { Todo, Task } = require("../models");
const { cloudinary } = require("../config/cloudinary");

// @desc    Create new todo
// @route   POST /api/todos
// @access  Private
const createTodo = async (req, res) => {
  try {
    const { title, icon, tasks = [] } = req.body;
    const userId = req.user.id;

    // Get next sequential ID for this user
    const userSequentialId = await Todo.getNextUserSequentialId(userId);

    // Prepare todo data
    const todoData = {
      title,
      icon: icon || "",
      userId,
      userSequentialId,
    };

    // Add image if uploaded
    if (req.file && req.file.path && req.file.filename) {
      todoData.image = req.file.path;
      todoData.imagePublicId = req.file.filename;
    }

    // Create the todo
    const todo = await Todo.create(todoData);

    // Create tasks if provided
    if (tasks && tasks.length > 0) {
      const parsedTasks = typeof tasks === "string" ? JSON.parse(tasks) : tasks;

      const taskPromises = parsedTasks.map((taskItem, index) => {
        return Task.create({
          text: taskItem.text,
          completed: taskItem.completed || false,
          order: taskItem.order !== undefined ? taskItem.order : index,
          todoId: todo.id,
        });
      });
      await Promise.all(taskPromises);
    }

    // Calculate completion status
    await todo.reload({ include: [{ model: Task, as: "tasks" }] });
    const todoObj = todo.toJSON();

    todoObj.completionPercentage = await todo.getCompletionPercentage();

    res.status(201).json(todoObj);
  } catch (error) {
    console.error("Error in createTodo:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all todos
// @route   GET /api/todos
// @access  Private
const getTodos = async (req, res) => {
  try {
    const todos = await Todo.findAll({
      where: { userId: req.user.id },
      include: ["tasks"],
      order: [
        ["userSequentialId", "DESC"],
        [{ model: Task, as: "tasks" }, "order", "ASC"],
      ],
    });

    // Add completion percentage
    const todosWithCompletion = await Promise.all(
      todos.map(async (todo) => {
        const todoObj = todo.toJSON();
        todoObj.completionPercentage = await todo.getCompletionPercentage();
        return todoObj;
      })
    );

    res.json(todosWithCompletion);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get todo by id
// @route   GET /api/todos/:id
// @access  Private
const getTodoById = async (req, res) => {
  try {
    const todo = await Todo.findByPk(req.params.id, {
      include: ["tasks"],
    });

    if (!todo) {
      return res.status(404).json({ message: "Todo not found" });
    }

    if (todo.userId !== req.user.id) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const todoObj = todo.toJSON();
    todoObj.completionPercentage = await todo.getCompletionPercentage();

    res.json(todoObj);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update todo
// @route   PUT /api/todos/:id
// @access  Private
const updateTodo = async (req, res) => {
  try {
    const { todoId } = req.params;
    const userId = req.user.id;

    const todo = await Todo.findOne({ where: { id: todoId, userId } });

    if (!todo) {
      return res
        .status(404)
        .json({ message: "Todo not found or user not authorized" });
    }

    const { title, icon, completed } = req.body;
    const updatedData = {};

    if (title !== undefined) updatedData.title = title;
    if (icon !== undefined) updatedData.icon = icon;
    if (completed !== undefined) updatedData.completed = completed;

    // Handle image update
    if (req.file && req.file.path && req.file.filename) {
      // New image uploaded, delete old one if exists
      if (todo.imagePublicId) {
        try {
          await cloudinary.uploader.destroy(todo.imagePublicId);
        } catch (cloudinaryError) {
          console.error(
            "Cloudinary: Failed to delete old image during update -",
            cloudinaryError.message
          );
          // Continue with update, but log the error
        }
      }
      updatedData.imageUrl = req.file.path;
      updatedData.imagePublicId = req.file.filename;
    } else if (req.body.imageUrl === "" || req.body.imageUrl === null) {
      // Image removal requested (e.g., client sends empty imageUrl)
      if (todo.imagePublicId) {
        try {
          await cloudinary.uploader.destroy(todo.imagePublicId);
          updatedData.imagePublicId = null;
        } catch (cloudinaryError) {
          console.error(
            "Cloudinary: Failed to delete image during removal -",
            cloudinaryError.message
          );
          // Continue, but log the error
        }
      }
      updatedData.imageUrl = null;
    }

    await todo.update(updatedData);

    await todo.reload({ include: [{ model: Task, as: "tasks" }] });
    const todoObj = todo.toJSON();

    todoObj.completionPercentage = await todo.getCompletionPercentage();

    res.json(todoObj);
  } catch (error) {
    console.error("Error in updateTodo:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete todo
// @route   DELETE /api/todos/:id
// @access  Private
const deleteTodo = async (req, res) => {
  try {
    const { todoId } = req.params;
    const userId = req.user.id;

    const todo = await Todo.findOne({ where: { id: todoId, userId } });

    if (!todo) {
      return res
        .status(404)
        .json({ message: "Todo not found or user not authorized" });
    }

    // If the todo has an image, delete it from Cloudinary
    if (todo.imagePublicId) {
      try {
        await cloudinary.uploader.destroy(todo.imagePublicId);
      } catch (cloudinaryError) {
        console.error(
          "Cloudinary: Failed to delete image during todo deletion -",
          cloudinaryError.message
        );
      }
    }

    await Task.destroy({ where: { todoId: todo.id } });
    await todo.destroy();

    res.json({ message: "Todo and associated tasks removed" });
  } catch (error) {
    console.error("Error in deleteTodo:", error);
    res
      .status(500)
      .json({ message: "Failed to delete todo", error: error.message });
  }
};

// @desc    Add new task
// @route   POST /api/todos/:id/tasks
// @access  Private
const addTask = async (req, res) => {
  try {
    const { text, completed = false } = req.body;

    const todo = await Todo.findByPk(req.params.id, {
      include: ["tasks"],
    });

    if (!todo) {
      return res.status(404).json({ message: "Todo not found" });
    }

    if (todo.userId !== req.user.id) {
      return res.status(401).json({ message: "Not authorized" });
    }

    // Get the last order number
    const tasks = await todo.getTasks();
    const order =
      tasks.length > 0 ? Math.max(...tasks.map((t) => t.order)) + 1 : 0;

    // Add new task
    await Task.create({
      text,
      completed,
      order,
      todoId: todo.id,
    });

    await todo.reload({ include: ["tasks"] });

    // Check if all tasks are completed to update todo's completed status
    const allTasks = await todo.getTasks();
    const allCompleted =
      allTasks.length > 0 && allTasks.every((t) => t.completed);

    if (todo.completed !== allCompleted) {
      todo.completed = allCompleted;
      await todo.save();
    }

    const todoObj = todo.toJSON();
    todoObj.completionPercentage = await todo.getCompletionPercentage();

    res.status(201).json(todoObj);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update task
// @route   PUT /api/todos/:id/tasks/:taskId
// @access  Private
const updateTask = async (req, res) => {
  try {
    const { todoId, taskId } = req.params;
    const userId = req.user.id;

    // Verify user owns the parent Todo
    const todo = await Todo.findOne({ where: { id: todoId, userId } });
    if (!todo) {
      return res
        .status(404)
        .json({ message: "Todo not found or user not authorized" });
    }

    const task = await Task.findOne({
      where: { id: taskId, todoId: todo.id }, // Ensure task belongs to the specified todo
    });

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const { text, completed, order } = req.body;

    if (text !== undefined) task.text = text;
    if (completed !== undefined) task.completed = completed;
    if (order !== undefined) task.order = order; // Update task order

    await task.save();
    res.json(task);
  } catch (error) {
    console.error("Error in updateTask:", error);
    res
      .status(500)
      .json({ message: "Failed to update task", error: error.message });
  }
};

// @desc    Delete task
// @route   DELETE /api/todos/:id/tasks/:taskId
// @access  Private
const deleteTask = async (req, res) => {
  try {
    const todo = await Todo.findByPk(req.params.id, {
      include: ["tasks"],
    });

    if (!todo) {
      return res.status(404).json({ message: "Todo not found" });
    }

    if (todo.userId !== req.user.id) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const task = await Task.findOne({
      where: {
        id: req.params.taskId,
        todoId: todo.id,
      },
    });

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    await task.destroy();

    // Check if all tasks are completed to update todo's completed status
    const allTasks = await todo.getTasks();
    const allCompleted =
      allTasks.length > 0 && allTasks.every((t) => t.completed);

    if (todo.completed !== allCompleted) {
      todo.completed = allCompleted;
      await todo.save();
    }

    await todo.reload({ include: ["tasks"] });

    const todoObj = todo.toJSON();
    todoObj.completionPercentage = await todo.getCompletionPercentage();

    res.json(todoObj);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createTodo,
  getTodos,
  getTodoById,
  updateTodo,
  deleteTodo,
  addTask,
  updateTask,
  deleteTask,
};
