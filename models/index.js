const { sequelize } = require("../config/db");
const User = require("./user");
const Todo = require("./todo");
const Task = require("./task");

User.hasMany(Todo, {
  foreignKey: "userId",
  as: "todos",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});
Todo.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

Todo.hasMany(Task, {
  foreignKey: "todoId",
  as: "tasks",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});
Task.belongsTo(Todo, {
  foreignKey: "todoId",
  as: "todo",
});

module.exports = {
  sequelize,
  User,
  Todo,
  Task,
};
