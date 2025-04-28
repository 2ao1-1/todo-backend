# Todo App Backend (Node.js + Express + SQLite)

A robust RESTful API backend for a feature-rich Todo application, built with **Node.js**, **Express**, and **Sequelize** (SQLite). This backend provides complete task management functionality with user authentication.

## 🚀 Features

- **JWT Authentication**

  - User registration and login
  - Secure password hashing with bcrypt
  - Protected routes with middleware

- **Todo Management**

  - Create, read, update, delete todos
  - Assign icons to todos
  - Track todo completion status

- **Task Functionality**

  - Nested tasks within todos
  - Task ordering
  - Task completion tracking
  - Todo completion percentage calculation

- **Database**
  - SQLite with Sequelize ORM
  - Data seeding utilities
  - Efficient data relationships

## 📋 API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login a user
- `GET /api/auth/profile` - Get user profile (protected)

### Todos

- `GET /api/todos` - Get all todos for logged in user
- `GET /api/todos/:id` - Get a specific todo
- `POST /api/todos` - Create a new todo
- `PUT /api/todos/:id` - Update a todo
- `DELETE /api/todos/:id` - Delete a todo

### Tasks

- `POST /api/todos/:id/tasks` - Add a task to a todo
- `PUT /api/todos/:id/tasks/:taskId` - Update a task
- `DELETE /api/todos/:id/tasks/:taskId` - Delete a task

## 🛠️ Tech Stack

- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **Sequelize** - ORM for database operations
- **SQLite** - Embedded database
- **JWT + bcryptjs** - Authentication
- **dotenv** - Environment configuration
- **cors** - Cross-origin resource sharing

## 📁 Project Structure

```
backend/
├── config/
│   └── db.js              # Database configuration
├── controllers/
│   ├── authController.js  # Authentication handlers
│   └── todoController.js  # Todo and task handlers
├── middleware/
│   └── authMiddleware.js  # JWT authentication middleware
├── models/
│   ├── index.js           # Model relationships
│   ├── user.js            # User model
│   ├── todo.js            # Todo model
│   └── task.js            # Task model
├── routes/
│   ├── authRoutes.js      # Authentication routes
│   └── todoRoutes.js      # Todo and task routes
├── seeder.js              # Database seeder
├── .env                   # Environment variables
├── package.json           # Project dependencies
└── server.js              # Entry point
```

## 🏁 Getting Started

### Prerequisites

- Node.js (v14+)
- npm or yarn

### Installation

1. Clone the repository

   ```bash
   git clone https://github.com/2ao1-1/todo-backend.git
   cd todo-backend
   ```

2. Install dependencies

   ```bash
   npm install
   ```

3. Create .env file in the root directory
   ```
   NODE_ENV=development
   PORT=5000
   JWT_SECRET=your_jwt_secret_key
   ```

### Running the Application

Start the server:

```bash
npm run start
```

Run with nodemon (development):

```bash
npm run server
```

### Database Management

Seed the database with initial data:

```bash
npm run data:import
```

Reset the database:

```bash
npm run data:destroy
```

## 🔐 Default Users

The seeder creates the following users:

| Name           | Email                      | Password     |
| -------------- | -------------------------- | ------------ |
| John Doe       | john.doe@example.com       | password123  |
| Smith John     | smith.john@example.com     | passBlueBus  |
| Carolina Adams | carolina.adams@example.com | passGreenBus |
| Emila Smith    | emila.smith@example.com    | 12111990     |

## 📚 License

This project is licensed under the ISC License.
