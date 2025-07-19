# Upcycle

Upcycle is a web application for buying and selling upcycled products. The project consists of a React frontend and a Node.js/Express backend that connects to MongoDB. Authentication, product management and payment flows are provided.

## Project structure

- `frontend/` – React application
- `backend/`  – Express API server

## Requirements

- Node.js 18 or later
- npm

## Setup

### Backend

1. `cd backend`
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file based on `.env` or the following variables:
   ```env
   PORT=5001
   MONGO_URI=<your Mongo connection string>
   JWT_SECRET=<jwt secret>
   EMAIL_USER=<smtp user>
   EMAIL_PASS=<smtp password>
   FRONTEND_URL=http://localhost:3000
   ```
4. Start the server:
   ```bash
   node server.js
   ```

### Frontend

1. `cd frontend`
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm start
   ```

## Running tests

- **Backend** – from the `backend` directory run:
  ```bash
  npm test
  ```
- **Frontend** – from the `frontend` directory run:
  ```bash
  npm test
  ```