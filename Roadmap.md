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
  - multer (file uploads)
  - socket.io (real-time features)
  - firebase-admin (FCM push notifications)

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

  - firstName, lastName
  - email (college domain only)
  - studentIdNumber (unique, required)
  - department
  - year
  - role (driver/passenger)
  - password (hashed)
  - profileImage (storage bucket URL)
  - isDriverVerified (Boolean, default: false)
  - documents: { studentIDUrl, licenseUrl }
  - vehicleInfo: { model, color, plateNumber }
  - fcmToken (for push notifications)

- Ride

  - driverId
  - startLocation: { address, lat, lng }
  - destination: { address, lat, lng }
  - vehicleInfo: { model, color, plateNumber } (copied from User)
  - totalSeats
  - occupiedSeats (Array of User ObjectIds)
  - pendingRequests (Array of User ObjectIds)
  - departureTime (Date)
  - notes (String)
  - routePolyline (String - for smart path matching)
  - status (scheduled/active/completed/cancelled)
  - price (optional)

- Booking

  - rideId
  - passengerId
  - status (pending/accepted/rejected)

- Chat

  - rideId (indexed)
  - senderId, senderName
  - message
  - messageType (text/system)
  - readBy (Array of User ObjectIds)
  - timestamp

---

## Phase 3 — Authentication APIs

**Goal:** Secure access for students only.

**Endpoints:**

- `POST /api/auth/register` (with file uploads via Multer)
- `POST /api/auth/login`
- `POST /api/auth/verify-email`

**Rules:**

- Allow only college domain emails
- File upload support for student ID and driver license
- Generate JWT on login
- Protect routes using auth middleware
- Store uploaded documents in storage bucket (studentIDUrl, licenseUrl)

---

## Phase 2.5 — Driver Verification System

**Goal:** Admin verification workflow for driver licenses.

**Endpoints:**

- `GET /api/admin/pending` - List all students with pending verification (admin only)
- `PATCH /api/admin/verify/:id` - Admin approves student, sets `isDriverVerified: true`

**Middleware:**

- `verifyDriver` - Check if user's `isDriverVerified` flag is true (required for creating rides)

**Logic:**

- Only verified drivers can create rides
- Admin reviews uploaded documents
- Storage bucket integration for secure document access

---

## Phase 4 — Ride Management APIs

**Goal:** Allow students to create and manage rides.

**Endpoints:**

- `POST /api/rides` (requires verified driver)
- `GET /api/rides` - List all available rides (with filters)
- `GET /api/rides/:id` - Get ride details
- `PUT /api/rides/:id` - Update ride (owner only)
- `DELETE /api/rides/:id` - Delete ride (owner only)
- `GET /api/rides/my` - Get current user's rides

**Logic:**

- Only authenticated and verified drivers can create rides
- Copy vehicleInfo from User to Ride on creation
- Only ride owner can update/delete
- Validate geolocation coordinates (lat, lng)
- Validate departureTime is in future

---

## Phase 4.5 — Enhanced Ride Operations

**Goal:** Smart ride search and seat management.

**Endpoints:**

- `GET /api/rides/search` - Smart search with polyline matching
  - Takes rider's current location (lat, lng)
  - Finds rides "on-the-way" using routePolyline
  - Uses geometry library to check if rider is within ~500m of driver's path
- `POST /api/rides/:id/request` - Request to join ride (adds to pendingRequests)
- `PATCH /api/rides/:id/accept` - Driver accepts rider
  - Moves user from pendingRequests to occupiedSeats
  - Auto-updates remaining seats
  - Sets status to 'full' if all seats taken
- `PATCH /api/rides/:id/status` - Update ride status (scheduled/active/completed/cancelled)
  - Disables chat when status is 'completed'

**Logic:**

- Smart path matching using polyline calculations
- Prevent overbooking (check remainingSeats)
- Prevent duplicate requests (same passenger, same ride)
- Prevent driver from requesting their own ride

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

## Phase 6 — Real-Time Features (Socket.IO)

**Goal:** Live updates and real-time communication.

**Socket.IO Events:**

- `join_room` (Emit) - User joins room named after rideId
- `send_message` (Emit/Listen) - Real-time messaging
  - Backend checks: Ride.status !== 'completed'
  - Saves to Chat collection
  - Broadcasts to room
- `update_location` (Emit) - Driver sends GPS location every 10 seconds
- `location_changed` (Listen) - Riders receive real-time location updates
- `ride_update` (Listen) - Broadcasts ride status changes
  - Triggers FCM push notification

**Logic:**

- Room-based communication per ride
- Prevent messaging when ride is completed
- Real-time GPS tracking for drivers

---

## Phase 6.5 — Push Notifications (FCM)

**Goal:** Mobile push notifications for ride events.

**Features:**

- Firebase Cloud Messaging (FCM) integration
- `fcmToken` stored in User model
- Push notifications for:
  - Booking request received (to driver)
  - Booking accepted/rejected (to passenger)
  - Ride status changes
  - Driver location updates (optional)
- Service Worker setup guidance for Angular frontend

---

## Phase 7 — Chat System

**Goal:** Temporary chat for each ride.

**Endpoints:**

- `GET /api/chat/:rideId` - Fetch message history for a specific ride

**Logic:**

- Chat is temporary and tied to ride
- Disabled when ride status is 'completed'
- Denormalized senderName for performance
- Read receipts tracking (readBy array)

---

## Phase 7.5 — Email Notifications

**Goal:** Email notifications for important events.

- Booking request notification (to driver)
- Booking accepted notification (to passenger)
- Booking rejected notification (to passenger)
- Ride cancellation notification (to passengers)
- Email verification email

---

## Phase 8 — Admin APIs

**Goal:** Platform moderation and management.

**Endpoints:**

- `GET /api/admin/users` - List all users (admin only)
- `PUT /api/admin/block/:id` - Block/unblock user (admin only)
- `GET /api/admin/rides` - List all rides (admin only)
- `DELETE /api/admin/rides/:id` - Delete any ride (admin only)
- `GET /api/admin/bookings` - List all bookings (admin only)
- `GET /api/admin/pending` - List pending driver verifications (admin only)
- `PATCH /api/admin/verify/:id` - Verify driver (admin only)

**Logic:**

- Admin role assignment
- User blocking/unblocking
- Platform moderation
- Driver verification management

---

## Phase 9 — User Profile APIs

**Goal:** User profile management.

**Endpoints:**

- `GET /api/user/profile` - Get current user profile with vehicle info
- `PUT /api/user/update` - Update firstName, lastName, or vehicleInfo

**Logic:**

- Return user details including vehicleInfo
- Allow updating profile information
- Validate vehicleInfo on update

---

## Phase 10 — Security & Deployment

**Goal:** Production readiness.

**Tasks:**

- Enable CORS for `campus-rides-web`
- Use env vars for secrets
- File storage setup (AWS S3, Google Cloud Storage, or similar)
- Rate limiting (optional)
- Health check endpoint
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
