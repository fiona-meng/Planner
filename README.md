# MyCalendar - Modern Calendar & Task Management App

## Live Demo
Frontend: https://mycalendar-frontend.vercel.app
Backend: https://mycalendar-backend.vercel.app

## Screenshots
[Add your application screenshots here]

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License
[MIT](https://choosealicense.com/licenses/mit/)

## Overview

MyCalendar is a modern, intuitive calendar and task management application built with React. It combines event scheduling with todo list functionality, providing users with a seamless experience for managing their time and tasks.

## Features

- **Event Management**

  - Create, edit, and delete calendar events
  - All-day event support
  - Event repetition (daily, weekly, monthly, yearly)
  - Add multiple participants to events
  - Location support with address autocomplete
  - Event description and details

- **Todo Management**

  - Create and manage todo items
  - Set due dates and descriptions
  - Mark todos as complete/incomplete
  - Automatic organization of tasks
  - Quick task creation interface

- **User Interface**

  - Clean, modern design
  - Responsive layout
  - Intuitive drag-and-drop interface
  - Different calendar views (month, week, day)
  - Side panel for quick task access

- **Authentication**
  - Email/password authentication
  - Google OAuth integration
  - Secure token-based sessions
 

## Tech Stack

### Frontend

- React 18
- React Router v6
- React Big Calendar
- Date-fns
- Axios
- Bootstrap 5
- Google OAuth

### Backend

- Node.js
- Express
- MongoDB with Mongoose
- JWT for authentication
- bcrypt for password hashing
- Google Auth Library

## API Endpoints

### Authentication

- `POST /auth/register` - Register new user
- `POST /auth/login` - User login
- `POST /auth/google` - Google OAuth login

### Events

- `GET /events` - Get all events
- `POST /events` - Create new event
- `PUT /events/:id` - Update event
- `DELETE /events/:id` - Delete event

### Todos

- `GET /todos` - Get all todos
- `POST /todos` - Create new todo
- `PUT /todos/:id` - Update todo
- `DELETE /todos/:id` - Delete todo
- `PUT /todos/:id/toggle` - Toggle todo status

## Getting Started

1. Clone the repository
2. Install dependencies for both frontend and backend:
