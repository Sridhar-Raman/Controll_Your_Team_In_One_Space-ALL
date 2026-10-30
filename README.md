# SRI.CR User Management

Role-based employee management system (MERN + Socket.io): tasks, automatic attendance, leave, end-of-day reports, team chat and analytics for Admin, Manager, Lead and Employee.

## Features

- **Role-based dashboards** for Admin, Manager, Lead and Employee
- **Task assignment** with deadlines, status tracking and a workload view
- **Automatic attendance**: the timer starts when a user logs in and stops when they log out
- **Leave management** with admin approval
- **End-of-day reports** with blockers
- **Team messenger** (company channel and private chats) in real time over Socket.io
- **Performance analytics** for managers and leads
- **Landing page and sign-up**: new accounts are requested publicly and approved by an admin before they can log in
- **Admin tools**: create users, approve or reject sign-ups, reset passwords, assign tasks

## Tech stack

React 19, Vite, Recharts, Node.js, Express 5, MongoDB (Mongoose), Socket.io, JWT, bcrypt.

## Project structure

```
clientreact/   React + Vite frontend
server/        Express API, Socket.io, Mongoose models
```

## Getting started

1. **Install dependencies** (from the project root):

   ```bash
   npm install
   cd server && npm install
   cd ../clientreact && npm install
   ```

2. **Configure the server.** Copy `server/.env.example` to `server/.env` and set `MONGO_URI` and a strong `JWT_SECRET`.

3. **Create the first admin** (optional, for a fresh database):

   ```bash
   cd server
   node seed.js
   ```

   This creates an admin account (`admin@syncnode.io` / `password123`). **Change that password after your first login.**

4. **Run the app** (from the project root):

   ```bash
   npm run dev
   ```

   - Frontend: http://localhost:5173
   - API: http://localhost:5001

## Configuration

| Variable | Where | Purpose |
|---|---|---|
| `PORT` | `server/.env` | API port (default 5001) |
| `MONGO_URI` | `server/.env` | MongoDB connection string |
| `JWT_SECRET` | `server/.env` | Secret used to sign login tokens |
| `FRONTEND_URL` | `server/.env` | Origin allowed by CORS |
| `VITE_API_URL` | `clientreact/.env` | API base URL (default `http://localhost:5001/api`) |
| `VITE_SOCKET_URL` | `clientreact/.env` | Socket.io URL (default `http://localhost:5001`) |

## Notes

- Make sure MongoDB is running before starting the server.
- Never commit `server/.env`; it is listed in `.gitignore`.
