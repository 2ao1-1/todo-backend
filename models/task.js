const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const Task = sequelize.define(
  "Task",
  {
    text: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: { msg: "Task text is required" },
        len: {
          args: [2, 255],
          msg: "Task text must be between 2 and 255 characters",
        },
      },
    },
    completed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    order: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        min: { args: [0], msg: "Order cannot be negative" },
      },
    },
    todoId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    timestamps: true,
    tableName: "tasks",
  }
);

module.exports = Task;
