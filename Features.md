# 📋 Features & Progress Tracker

This document tracks all features and their implementation status across the campus-rides-service backend.

---

## 🔐 Authentication & Authorization

### User Registration

- [x] POST `/api/auth/register` - Register new user
- [ ] POST `/api/auth/register` - File upload support (Multer integration)
  - Student ID document upload
  - Driver license upload (optional for passengers)
- [ ] Document storage integration (storage bucket - AWS S3/Google Cloud Storage)
- [x] College domain email validation
- [x] Password hashing with bcrypt
- [x] Email verification flow
- [x] Prevent duplicate email registration
- [ ] Store document URLs (studentIDUrl, licenseUrl) in User model

### User Login

- [x] POST `/api/auth/login` - User login
- [x] JWT token generation
- [x] Token expiration handling
- [x] Invalid credentials handling

### Email Verification

- [x] POST `/api/auth/verify-email` - Verify email address
- [x] Email verification token generation
- [x] Nodemailer integration for sending verification emails

### Middleware

- [x] JWT authentication middleware
- [x] Role-based access control (driver/passenger)
- [x] Admin role protection
- [ ] verifyDriver middleware - Check isDriverVerified flag before allowing ride creation

---

## 👤 User Management

### User Model

- [x] User schema with required fields (name, email, department, year, role, password)
- [ ] User schema with firstName and lastName (replace single name field)
- [ ] studentIdNumber field (required, unique identifier)
- [ ] profileImage field (storage bucket URL)
- [ ] isDriverVerified field (Boolean, default: false)
- [ ] documents object (studentIDUrl, licenseUrl)
- [ ] vehicleInfo object at User level (model, color, plateNumber)
- [ ] fcmToken field (for Firebase Cloud Messaging)
- [x] Email uniqueness constraint
- [x] Password hashing on save
- [x] User role enum (driver/passenger)

### User APIs

- [ ] GET `/api/user/profile` - Get current user profile with vehicle info
- [ ] PUT `/api/user/update` - Update firstName, lastName, or vehicleInfo
- [ ] GET `/api/users/:id` - Get user by ID (public info only)

---

## 🚗 Ride Management

### Ride Model

- [x] Ride schema (driverId, pickup, destination, time, availableSeats, price)
- [ ] Enhanced Ride schema with geolocation:
  - startLocation object (address, lat, lng) - replaces pickup string
  - destination object (address, lat, lng) - replaces destination string
- [ ] vehicleInfo object (model, color, plateNumber) - copied from User on creation
- [ ] totalSeats field (Number, required)
- [ ] occupiedSeats array (Array of User ObjectIds)
- [ ] pendingRequests array (Array of User ObjectIds)
- [ ] departureTime field (Date - renamed from time)
- [ ] notes field (String)
- [ ] routePolyline field (String - for smart path matching)
- [ ] Enhanced status enum: ['scheduled', 'active', 'completed', 'cancelled']
- [ ] Virtual field: remainingSeats (calculated: totalSeats - occupiedSeats.length)
- [x] Reference to User model
- [x] Timestamps (createdAt, updatedAt)
- [x] Ride status tracking

### Ride APIs

- [x] POST `/api/rides` - Create new ride (driver only)
- [ ] POST `/api/rides` - Enhanced create with vehicleInfo and geolocation
  - Copy vehicleInfo from User to Ride
  - Validate geolocation coordinates
- [x] GET `/api/rides` - List all available rides (with filters)
- [ ] GET `/api/rides/search` - Smart search with polyline matching
  - Takes rider's current location (lat, lng)
  - Finds rides "on-the-way" using routePolyline
  - Uses geometry library to check if rider is within ~500m of driver's path
- [x] GET `/api/rides/:id` - Get ride details
- [x] PUT `/api/rides/:id` - Update ride (owner only)
- [x] DELETE `/api/rides/:id` - Delete ride (owner only)
- [x] GET `/api/rides/my` - Get current user's rides
- [ ] POST `/api/rides/:id/request` - Request to join ride (adds to pendingRequests)
- [ ] PATCH `/api/rides/:id/accept` - Driver accepts rider
  - Moves user from pendingRequests to occupiedSeats
  - Auto-updates remaining seats
  - Sets status to 'full' if all seats taken
- [ ] PATCH `/api/rides/:id/status` - Update ride status (scheduled/active/completed/cancelled)

### Ride Logic

- [x] Prevent duplicate ride creation
- [ ] Require verified driver (isDriverVerified: true) for ride creation
- [ ] Copy vehicleInfo from User to Ride on creation
- [ ] Validate geolocation coordinates (lat, lng)
- [x] Validate available seats > 0
- [ ] Validate totalSeats > occupiedSeats.length
- [x] Time validation (future dates only)
- [ ] Validate departureTime is in future
- [x] Location validation
- [ ] Smart path matching logic (polyline-based route matching)
- [ ] Prevent overbooking (check remainingSeats before accepting requests)
- [ ] Prevent duplicate requests (same passenger, same ride)
- [ ] Prevent driver from requesting their own ride
- [x] Prevent deleting rides with accepted bookings
- [x] Prevent reducing seats below accepted bookings count
- [ ] Auto-disable chat when ride status is 'completed'

---

## 🎫 Booking Management

### Booking Model

- [x] Booking schema (rideId, passengerId, status)
- [x] Reference to Ride and User models
- [x] Booking status enum (pending/accepted/rejected)
- [x] Timestamps

### Booking APIs

- [ ] POST `/api/bookings` - Create booking request
- [ ] GET `/api/bookings/my` - Get user's bookings (as passenger)
- [ ] GET `/api/bookings/rides/:rideId` - Get bookings for a ride (driver only)
- [ ] PUT `/api/bookings/:id/status` - Update booking status (driver only)
- [ ] DELETE `/api/bookings/:id` - Cancel booking (passenger only)

### Booking Logic

- [ ] Prevent overbooking (check available seats / remainingSeats)
- [ ] Auto-reduce available seats on accept
- [ ] Auto-increase available seats on reject/cancel
- [ ] Prevent duplicate bookings (same passenger, same ride)
- [ ] Prevent driver from booking their own ride
- [ ] Validate booking status transitions

### Alternative: Ride-based Request/Accept System

- [ ] pendingRequests array in Ride model
- [ ] occupiedSeats array in Ride model
- [ ] Request/accept workflow via Ride endpoints
- [ ] Note: Decision needed on whether to use Booking model or Ride arrays approach (or hybrid)

---

## 🔔 Notifications

### Email Notifications

- [ ] Booking request notification (to driver)
- [ ] Booking accepted notification (to passenger)
- [ ] Booking rejected notification (to passenger)
- [ ] Ride cancellation notification (to passengers)
- [x] Email verification email

### Push Notifications (FCM)

- [ ] Firebase Cloud Messaging (FCM) integration
- [ ] fcmToken field in User model
- [ ] Push notification service
- [ ] Push notification for booking request received (to driver)
- [ ] Push notification for booking accepted/rejected (to passenger)
- [ ] Push notification for ride status changes
- [ ] Push notification for driver location updates (optional)
- [ ] Service Worker setup guidance for Angular frontend

### Real-Time (Socket.IO)

- [ ] Socket.IO integration
- [ ] join_room event - User joins room named after rideId
- [ ] send_message event - Real-time messaging
  - Backend checks: Ride.status !== 'completed'
  - Saves to Chat collection
  - Broadcasts to room
- [ ] update_location event - Driver sends GPS location every 10 seconds
- [ ] location_changed event - Riders receive real-time location updates
- [ ] ride_update event - Broadcasts ride status changes (triggers FCM push)
- [ ] Live booking updates
- [ ] Live ride updates

---

## 👨‍💼 Admin Features

### Admin APIs

- [ ] GET `/api/admin/users` - List all users (admin only)
- [ ] PUT `/api/admin/block/:id` - Block/unblock user (admin only)
- [ ] GET `/api/admin/rides` - List all rides (admin only)
- [ ] DELETE `/api/admin/rides/:id` - Delete any ride (admin only)
- [ ] GET `/api/admin/bookings` - List all bookings (admin only)
- [ ] GET `/api/admin/pending` - List all students with pending driver verification (admin only)
- [ ] PATCH `/api/admin/verify/:id` - Admin approves student, sets isDriverVerified: true

### Admin Logic

- [ ] Admin role assignment
- [ ] User blocking/unblocking
- [ ] Platform moderation
- [ ] Driver verification management
- [ ] Review uploaded documents (studentID, license)
- [ ] Secure document storage and access control

---

## 💬 Chat System

### Chat Model

- [ ] Chat schema (rideId, senderId, senderName, message, messageType, readBy, timestamp)
- [ ] Reference to Ride and User models
- [ ] Index on rideId for performance
- [ ] Denormalized senderName for performance

### Chat APIs

- [ ] GET `/api/chat/:rideId` - Fetch message history for a specific ride

### Chat Logic

- [ ] Temporary chat system tied to each ride
- [ ] Disable chat when ride status is 'completed'
- [ ] Real-time messaging via Socket.IO
- [ ] Read receipts tracking (readBy array)
- [ ] System messages support (messageType: 'system')

---

## 🛡️ Security & Infrastructure

### Security

- [x] CORS configuration for `campus-rides-web`
- [x] Environment variables for secrets
- [x] JWT secret management
- [x] Password strength validation
- [ ] Rate limiting (optional)
- [x] Input validation and sanitization
- [ ] File upload security (Multer configuration)
- [ ] Secure document storage (storage bucket with access control)
- [ ] File type validation (images only for documents)

### Database

- [x] MongoDB Atlas connection
- [x] Connection error handling
- [x] Database indexes for performance
  - [ ] Index on rideId in Chat model
  - [ ] Index on routePolyline for smart search (if applicable)
- [x] Data validation at schema level
- [ ] Virtual fields (remainingSeats in Ride model)

### Error Handling

- [x] Global error handler middleware
- [x] Consistent error response format
- [x] 404 handler
- [x] Validation error formatting

### API Standards

- [ ] Consistent response structure: `{ success, data, message }`
- [ ] Proper HTTP status codes
- [ ] Request validation
- [ ] API documentation (optional)

---

## 🚀 Deployment

### Production Setup

- [ ] Environment configuration
- [ ] Render deployment configuration
- [ ] Production database connection
- [ ] Base URL: `https://campus-rides-service.onrender.com`
- [ ] Health check endpoint

---

## 📊 Progress Summary

- **Total Features**: ~100+
- **Completed**: ~12
- **In Progress**: 0
- **Pending**: ~88+

Note: Feature count updated to reflect comprehensive feature list including all enhancements from gap analysis.

---

## 📝 Notes

- Update this file as features are implemented
- Mark items as `[x]` when completed
- Add new features as they are discovered during development
