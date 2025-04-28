const { sequelize } = require("../config/db");
const User = require("./user");
const Todo = require("./todo");
const Task = require("./task");

// model relationships
User.hasMany(Todo, { foreignKey: "userId", as: "todos" });
Todo.belongsTo(User, { foreignKey: "userId" });

Todo.hasMany(Task, { foreignKey: "todoId", as: "tasks" });
Task.belongsTo(Todo, { foreignKey: "todoId" });

module.exports = {
  sequelize,
  User,
  Todo,
  Task,
};
