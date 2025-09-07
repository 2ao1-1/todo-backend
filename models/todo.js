const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const Todo = sequelize.define(
  "Todo",
  {
    userSequentialId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: { msg: "Title is required" },
        len: {
          args: [3, 100],
          msg: "Title must be between 3 and 100 characters",
        },
      },
    },
    icon: {
      type: DataTypes.STRING,
      defaultValue: "",
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    completed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    imageUrl: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isUrl: {
          msg: "Image URL must be valid",
        },
      },
    },
    imagePublicId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    timestamps: true,
    tableName: "todos",
  }
);

Todo.getNextUserSequentialId = async function (userId) {
  const maxId = await this.max("userSequentialId", { where: { userId } });
  return (maxId || 0) + 1;
};

Todo.prototype.getCompletionPercentage = async function () {
  const tasks = await this.getTasks();

  if (!tasks || tasks.length === 0) return 0;

  const completedTasks = tasks.filter((task) => task.completed).length;
  return Math.round((completedTasks / tasks.length) * 100);
};

module.exports = Todo;
