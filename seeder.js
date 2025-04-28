const bcrypt = require("bcryptjs");
const { sequelize, User, Todo, Task } = require("./models");

// initial data
const users = [
  {
    name: "John Doe",
    email: "john.doe@example.com",
    password: "password123",
    todos: [],
  },
  {
    name: "Smith John",
    email: "smith.john@example.com",
    password: "passBlueBus",
    todos: [],
  },
  {
    name: "Carolina Adams",
    email: "carolina.adams@example.com",
    password: "passGreenBus",
    todos: [],
  },
  {
    name: "Emila Smith",
    email: "emila.smith@example.com",
    password: "12111990",
    todos: [],
  },
];

// import data
const importData = async () => {
  try {
    await sequelize.sync({ force: true });

    // create users with their todos and tasks
    for (const userData of users) {
      const { todos, ...userInfo } = userData;

      // Create user
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userInfo.password, salt);
      const user = await User.create({
        ...userInfo,
        password: hashedPassword,
      });

      // Create todos for user
      let todoId = 1;
      for (const todoData of todos || []) {
        const { tasks, ...todoInfo } = todoData;

        // Create todo with sequential ID
        const todo = await Todo.create({
          ...todoInfo,
          userId: user.id,
          userSequentialId: todoId++,
        });

        // Create tasks for todo
        if (tasks && tasks.length > 0) {
          await Task.bulkCreate(
            tasks.map((task, index) => ({
              ...task,
              todoId: todo.id,
              order: index,
            }))
          );
        }
      }
    }

    console.log("Sample data created successfully.");
    process.exit();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

// destroy data
const destroyData = async () => {
  try {
    await sequelize.sync({ force: true });
    console.log("All data destroyed successfully.");
    process.exit();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

// import or destroy data based on argument passed
if (process.argv[2] === "-d") {
  destroyData();
} else {
  importData();
}
