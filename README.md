# Campus Rides Service

Backend service for campus ride-sharing application built with Node.js, Express, and MongoDB.

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- MongoDB Atlas account (or local MongoDB instance)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. Update `.env` with your configuration:
   - MongoDB connection string
   - JWT secret
   - Email credentials (for notifications)
   - College domain

### Running the Application

**Development mode:**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The server will start on `http://localhost:3000` (or the PORT specified in `.env`).

### Health Check

Visit `http://localhost:3000/health` to verify the server is running.

## 📁 Project Structure

```
src/
├── config/          # Configuration files (database, etc.)
├── controllers/     # Request handlers
├── models/          # MongoDB schemas
├── routes/          # API route definitions
├── middlewares/     # Custom middleware (auth, validation, etc.)
├── services/        # Business logic and external services
├── utils/           # Utility functions
└── app.js           # Express app entry point
```

## 🔗 API Documentation

See `Roadmap.md` for detailed API endpoints and implementation phases.

## 📋 Features

See `Features.md` for a complete list of features and their implementation status.

## 🛠️ Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB (via Mongoose)
- **Authentication:** JWT
- **Email:** Nodemailer

## 📝 License

ISC

