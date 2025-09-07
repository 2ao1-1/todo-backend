const { sequelize, testConnection } = require("./config/db");
const { User, Todo, Task } = require("./models");

const sampleData = [
  {
    name: "John Doe",
    email: "john.doe@example.com",
    password: "password123",
    todos: [
      {
        title: "Complete Project Setup",
        icon: "⚙️",
        tasks: [
          { text: "Install dependencies", completed: true },
          { text: "Setup database", completed: true },
          { text: "Create API endpoints", completed: false },
          { text: "Test authentication", completed: false },
        ],
      },
      {
        title: "Learn React Hooks",
        icon: "⚛️",
        tasks: [
          { text: "Study useState hook", completed: true },
          { text: "Practice useEffect hook", completed: false },
          { text: "Build a small project", completed: false },
        ],
      },
    ],
  },
  {
    name: "Smith John",
    email: "smith.john@example.com",
    password: "passBlueBus",
    todos: [
      {
        title: "Daily Workout",
        icon: "💪",
        tasks: [
          { text: "20 minutes cardio", completed: false },
          { text: "Strength training", completed: false },
          { text: "Cool down stretches", completed: false },
        ],
      },
    ],
  },
  {
    name: "Carolina Adams",
    email: "carolina.adams@example.com",
    password: "passGreenBus",
    todos: [
      {
        title: "Weekend Plans",
        icon: "🎉",
        tasks: [
          { text: "Visit the museum", completed: false },
          { text: "Have lunch with friends", completed: false },
          { text: "Watch a movie", completed: false },
        ],
      },
      {
        title: "Study Goals",
        icon: "📚",
        tasks: [
          { text: "Read 2 chapters", completed: true },
          { text: "Complete assignments", completed: false },
          { text: "Review notes", completed: false },
        ],
      },
    ],
  },
  {
    name: "Emila Smith",
    email: "emila.smith@example.com",
    password: "12111990",
    todos: [
      {
        title: "Home Organization",
        icon: "🏠",
        tasks: [
          { text: "Clean living room", completed: true },
          { text: "Organize kitchen", completed: false },
          { text: "Declutter bedroom", completed: false },
        ],
      },
    ],
  },
];

const importData = async () => {
  try {
    console.log("🔄 Starting data import...");

    await testConnection();

    await sequelize.sync({ force: true });
    console.log("Database tables created/reset");

    for (const userData of sampleData) {
      const { todos, ...userInfo } = userData;

      const user = await User.create(userInfo);
      console.log(`Created user: ${user.name}`);

      if (todos && todos.length > 0) {
        for (let i = 0; i < todos.length; i++) {
          const todoData = todos[i];
          const { tasks, ...todoInfo } = todoData;

          const userSequentialId = await Todo.getNextUserSequentialId(user.id);

          const todo = await Todo.create({
            ...todoInfo,
            userId: user.id,
            userSequentialId,
          });

          console.log(`Created todo: ${todo.title}`);

          if (tasks && tasks.length > 0) {
            for (let j = 0; j < tasks.length; j++) {
              const taskData = tasks[j];
              await Task.create({
                ...taskData,
                todoId: todo.id,
                order: j,
              });
            }
            console.log(`Created ${tasks.length} tasks for "${todo.title}"`);
          }
        }
      }
    }

    console.log("\n Sample data imported successfully!");
    console.log("\n Summary:");
    console.log(`Users: ${sampleData.length}`);
    console.log(
      `Todos: ${sampleData.reduce((acc, user) => acc + (user.todos?.length || 0), 0)}`
    );
    console.log(
      `Tasks: ${sampleData.reduce(
        (acc, user) =>
          acc +
          (user.todos?.reduce(
            (todoAcc, todo) => todoAcc + (todo.tasks?.length || 0),
            0
          ) || 0),
        0
      )}`
    );

    process.exit(0);
  } catch (error) {
    console.error(`Error importing data: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  }
};

const destroyData = async () => {
  try {
    console.log("Starting data destruction...");

    await testConnection();

    await Task.destroy({ where: {} });
    await Todo.destroy({ where: {} });
    await User.destroy({ where: {} });

    console.log("All data destroyed successfully!");
    process.exit(0);
  } catch (error) {
    console.error(`Error destroying data: ${error.message}`);
    process.exit(1);
  }
};

const showData = async () => {
  try {
    console.log("Current database contents:");

    await testConnection();

    const users = await User.findAll({
      include: [
        {
          model: Todo,
          as: "todos",
          include: [
            {
              model: Task,
              as: "tasks",
            },
          ],
        },
      ],
    });

    console.log("\n Database Summary:");
    console.log(`Total Users: ${users.length}`);

    users.forEach((user) => {
      console.log(`\n ${user.name} (${user.email})`);
      if (user.todos && user.todos.length > 0) {
        user.todos.forEach((todo) => {
          console.log(`${todo.title} (${todo.tasks?.length || 0} tasks)`);
          if (todo.tasks && todo.tasks.length > 0) {
            todo.tasks.forEach((task) => {
              console.log(`${task.completed ? "done" : "wait"} ${task.text}`);
            });
          }
        });
      } else {
        console.log("No todos yet");
      }
    });

    process.exit(0);
  } catch (error) {
    console.error(`Error showing data: ${error.message}`);
    process.exit(1);
  }
};

const command = process.argv[2];

switch (command) {
  case "-d":
  case "--destroy":
    destroyData();
    break;
  case "-s":
  case "--show":
    showData();
    break;
  case "-i":
  case "--import":
  default:
    importData();
    break;
}
