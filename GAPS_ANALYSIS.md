# 📊 Gap Analysis: campusRider.docx vs Features.md & Roadmap.md

This document identifies features and requirements from `campusRider.docx` that are **missing** from `Features.md` and `Roadmap.md`.

---

## 🚨 CRITICAL MISSING FEATURES

### 1. User Model Enhancements

**Missing from current User model:**
- [ ] `firstName` and `lastName` (currently only has `name`)
- [ ] `profileImage` (with storage bucket support)
- [ ] `studentIdNumber` (required, unique identifier)
- [ ] `isDriverVerified` (Boolean flag for admin verification)
- [ ] `documents` object with:
  - `studentIDUrl` (required - proof for admin)
  - `licenseUrl` (required for drivers)
- [ ] `vehicleInfo` at User level:
  - `model` (e.g., "Honda Activa", "Toyota Glanza")
  - `color`
  - `plateNumber`
- [ ] `fcmToken` (for Firebase Cloud Messaging push notifications)

**Current state:** User model only has: name, email, department, year, role, password, isEmailVerified, isBlocked, isAdmin

---

### 2. Ride Model Enhancements

**Missing from current Ride model:**
- [ ] `startLocation` object (instead of string `pickup`):
  - `address` (String)
  - `lat` (Number)
  - `lng` (Number)
- [ ] `destination` object (instead of string):
  - `address` (String)
  - `lat` (Number)
  - `lng` (Number)
- [ ] `vehicleInfo` object (copied from User):
  - `model` (String, required)
  - `color` (String)
  - `plateNumber` (String, required)
- [ ] `totalSeats` (Number, required)
- [ ] `occupiedSeats` (Array of User ObjectIds)
- [ ] `pendingRequests` (Array of User ObjectIds) - different from Booking approach
- [ ] `departureTime` (Date - renamed from `time`)
- [ ] `notes` (String) - e.g., "Wait near the main gate library"
- [ ] `routePolyline` (String) - for smart path matching
- [ ] `status` enum: `['scheduled', 'active', 'completed', 'cancelled']` (currently: `['active', 'completed', 'cancelled']`)
- [ ] Virtual field: `remainingSeats` (calculated: totalSeats - occupiedSeats.length)

**Current state:** Ride model has: driverId, pickup (string), destination (string), time, availableSeats, price, status

---

### 3. Chat Model (COMPLETELY MISSING)

**New model needed:**
- [ ] `Chat` schema with:
  - `rideId` (ObjectId, ref: 'Ride', indexed)
  - `senderId` (ObjectId, ref: 'User')
  - `senderName` (String) - denormalized for performance
  - `message` (String, required)
  - `messageType` (enum: ['text', 'system'])
  - `readBy` (Array of User ObjectIds)
  - `timestamp` (Date, default: Date.now)

**Purpose:** Temporary chat system for each ride (disabled when ride status is 'completed')

---

### 4. Driver Verification System (COMPLETELY MISSING)

**Missing features:**
- [ ] File upload support in registration (Multer integration)
  - Student ID document upload
  - Driver license upload
- [ ] `verifyDriver` middleware to check `isDriverVerified` flag
- [ ] Admin endpoints:
  - `GET /api/admin/pending` - List all students with pending verification
  - `PATCH /api/admin/verify/:id` - Admin approves student, sets `isDriverVerified: true`
- [ ] Document storage (studentIDUrl, licenseUrl) - storage bucket integration

**Current state:** No driver verification system exists

---

### 5. Enhanced Ride Management APIs

**Missing endpoints:**
- [ ] `POST /api/rides/create` - Enhanced create with vehicleInfo and geolocation
- [ ] `GET /api/rides/search` - **Smart search** with polyline matching (finds rides "on-the-way")
  - Takes rider's current location (lat, lng)
  - Uses routePolyline to find rides within ~500 meters of path
  - Requires geometry library (e.g., google.maps.geometry.poly)
- [ ] `POST /api/rides/:id/request` - Request to join ride (adds to pendingRequests array)
- [ ] `PATCH /api/rides/:id/accept` - Driver accepts rider
  - Moves user from pendingRequests to occupiedSeats
  - Auto-updates seat count
  - Sets status to 'full' if all seats taken
- [ ] `PATCH /api/rides/:id/status` - Update ride status (active, completed, cancelled)
  - Disables chat when status is 'completed'

**Current state:** Has basic CRUD, but missing smart search, request/accept flow, and status management

---

### 6. User Profile APIs

**Missing endpoints:**
- [ ] `GET /api/user/profile` - Get current user profile with vehicle info
- [ ] `PUT /api/user/update` - Update firstName, lastName, or vehicleInfo

**Note:** Current Features.md has `/api/users/profile` but docx shows `/api/user/profile` (singular)

---

### 7. Chat API (COMPLETELY MISSING)

**Missing endpoint:**
- [ ] `GET /api/chat/:rideId` - Fetch message history for a specific ride

**Purpose:** For viewing past chat messages (chat is temporary and tied to ride)

---

### 8. Socket.IO Real-Time Features (COMPLETELY MISSING)

**Missing Socket.IO events:**
- [ ] `join_room` (Emit) - User joins room named after rideId
- [ ] `send_message` (Emit/Listen) - Real-time messaging
  - Backend checks: Ride.status !== 'completed'
  - Saves to Chat collection
  - Broadcasts to room
- [ ] `update_location` (Emit) - Driver sends GPS location every 10 seconds
- [ ] `location_changed` (Listen) - Riders receive real-time location updates
- [ ] `ride_update` (Listen) - Triggers FCM push notification when:
  - Rider is accepted
  - Ride starts
  - Other ride status changes

**Current state:** Roadmap mentions Socket.IO as "optional" in Phase 6, but docx shows it as core feature

---

### 9. Push Notifications (FCM) (COMPLETELY MISSING)

**Missing features:**
- [ ] Firebase Cloud Messaging (FCM) integration
- [ ] `fcmToken` field in User model
- [ ] Push notification service
- [ ] Service Worker setup guidance (for Angular frontend)

**Current state:** Only email notifications are planned

---

### 10. Smart Path Matching (COMPLETELY MISSING)

**Missing logic:**
- [ ] Polyline-based route matching
- [ ] Geometry calculations to find rides "on-the-way"
- [ ] Distance calculation (~500 meters radius)
- [ ] Integration with Google Maps Geometry library or similar

**Purpose:** Instead of exact source/destination matching, find rides where the rider's location is near the driver's route

---

### 11. Booking System Difference

**Important note:** The docx file uses a different approach than the current Booking model:

**Docx approach:**
- `pendingRequests` array in Ride model
- `occupiedSeats` array in Ride model
- Direct ride request/accept flow via Ride endpoints

**Current approach:**
- Separate Booking model
- Booking status: pending/accepted/rejected
- Booking-based workflow

**Decision needed:** Which approach should be used? Or both?

---

### 12. File Upload & Storage (COMPLETELY MISSING)

**Missing:**
- [ ] Multer middleware for file uploads
- [ ] Storage bucket integration (e.g., AWS S3, Google Cloud Storage)
- [ ] File upload in registration endpoint
- [ ] Secure document storage and access control

---

## 📋 SUMMARY OF MISSING ITEMS

### High Priority (Core Features):
1. ✅ Driver verification system with file uploads
2. ✅ Enhanced User model (firstName, lastName, studentIdNumber, documents, vehicleInfo, fcmToken)
3. ✅ Enhanced Ride model (geolocation, vehicleInfo, seat management, polyline, status enum)
4. ✅ Smart path matching for ride search
5. ✅ Ride request/accept workflow (pendingRequests, occupiedSeats)
6. ✅ User profile APIs
7. ✅ Socket.IO real-time features (chat, location tracking)
8. ✅ Chat model and API
9. ✅ FCM push notifications

### Medium Priority:
10. ✅ Admin verification endpoints (pending, verify)
11. ✅ Enhanced ride status management
12. ✅ File storage integration

### Architecture Decisions Needed:
- Booking model vs Ride arrays approach (pendingRequests/occupiedSeats)
- Storage solution (AWS S3, Google Cloud Storage, etc.)
- Geometry library for path matching

---

## 🔄 RECOMMENDATIONS

1. **Update Features.md** to include all missing features from this analysis
2. **Update Roadmap.md** to add:
   - Phase 2.5: Driver Verification System
   - Phase 4.5: Smart Path Matching
   - Phase 6: Real-Time Features (make Socket.IO required, not optional)
   - Phase 6.5: Push Notifications (FCM)
   - Phase 7: Chat System
3. **Decide on Booking approach:** Use Booking model or Ride arrays? Or hybrid?
4. **Add dependencies** to package.json:
   - `multer` (file uploads)
   - `socket.io` (real-time)
   - `firebase-admin` (FCM push notifications)
   - `@googlemaps/google-maps-services-js` or geometry library (path matching)

---

## ✅ ALREADY COVERED

These features from docx are already in Features.md/Roadmap.md:
- ✅ Basic authentication (register, login, verify-email)
- ✅ JWT authentication
- ✅ Basic ride CRUD operations
- ✅ Booking model (though approach differs)
- ✅ Admin role support
- ✅ Email notifications (planned)
- ✅ Database setup (MongoDB Atlas)
- ✅ Error handling
- ✅ CORS configuration

