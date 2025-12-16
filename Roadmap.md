The roadmap **explicitly defines how `campus-rides-web` and `campus-rides-service` interact via APIs**.

---

# 🧭 OVERALL ARCHITECTURE (Context for Cursor)

```
campus-rides-web (Angular)
   └── calls REST APIs
       ↓
campus-rides-service (Node + Express)
   └── connects to MongoDB Atlas
```

- Communication via **REST APIs (JSON)**
- Auth via **JWT**
- API base URL stored in Angular environment files

---

# 📁 ROADMAP — `campus-rides-service` (Backend)

## Phase 1 — Project Setup

**Goal:** Create a production-ready Express API.

**Tasks:**

- Initialize Node.js project
- Install dependencies:

  - express
  - mongoose
  - jsonwebtoken
  - bcrypt
  - cors
  - dotenv
  - nodemailer

- Setup folder structure:

  ```
  src/
   ├── config/
   ├── controllers/
   ├── models/
   ├── routes/
   ├── middlewares/
   ├── services/
   ├── utils/
   └── app.js
  ```

---

## Phase 2 — Database & Models

**Goal:** Define MongoDB schemas.

**Models to create:**

- User

  - name
  - email (college domain only)
  - department
  - year
  - role (driver/passenger)
  - password (hashed)

- Ride

  - driverId
  - pickup
  - destination
  - time
  - availableSeats
  - price (optional)

- Booking

  - rideId
  - passengerId
  - status (pending/accepted/rejected)

---

## Phase 3 — Authentication APIs

**Goal:** Secure access for students only.

**Endpoints:**

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/verify-email`

**Rules:**

- Allow only college domain emails
- Generate JWT on login
- Protect routes using auth middleware

---

## Phase 4 — Ride Management APIs

**Goal:** Allow students to create and manage rides.

**Endpoints:**

- `POST /api/rides`
- `GET /api/rides`
- `GET /api/rides/:id`
- `PUT /api/rides/:id`
- `DELETE /api/rides/:id`

**Logic:**

- Only authenticated users
- Only ride owner can update/delete

---

## Phase 5 — Booking APIs

**Goal:** Seat booking workflow.

**Endpoints:**

- `POST /api/bookings`
- `GET /api/bookings/my`
- `PUT /api/bookings/:id/status`

**Rules:**

- Reduce available seats on accept
- Prevent overbooking

---

## Phase 6 — Notifications & (Optional) Real-Time

**Goal:** Inform users of actions.

- Basic: email notifications
- Advanced: Socket.IO for live updates

---

## Phase 7 — Admin APIs

**Goal:** Platform moderation.

**Endpoints:**

- `GET /api/admin/users`
- `PUT /api/admin/block/:id`
- `GET /api/admin/rides`

---

## Phase 8 — Security & Deployment

**Goal:** Production readiness.

- Enable CORS for `campus-rides-web`
- Use env vars for secrets
- Deploy to Render
- Expose base URL:

  ```
  https://campus-rides-service.onrender.com
  ```

---

# 🔗 CONTRACT BETWEEN WEB & SERVICE (VERY IMPORTANT)

### API Contract Rules:

- JSON only
- JWT in `Authorization: Bearer <token>`
- Consistent response structure:

```json
{
  "success": true,
  "data": {},
  "message": ""
}
```
