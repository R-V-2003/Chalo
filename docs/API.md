# Chalo API Specification (Phase 1)

This document details the HTTP REST API endpoints exposed by the **Chalo** backend at `/api/v1`.

---

## 1. Request/Response Standards

- **Base URL**: `http://localhost:3000/api/v1`
- **Transport**: HTTPS JSON.
- **Headers**:
  - `Content-Type: application/json`
  - `X-Request-ID: <UUID>` (Automatically set on responses if not provided)
  - `Authorization: Bearer <JWT_Token>` (Required for protected endpoints)

### Success Payload Format
```json
{
  "data": { ... },
  "meta": {
    "requestId": "d290f1ee-6c54-4b01-90e6-d701748f0851"
  }
}
```

### Error Payload Format
```json
{
  "error": {
    "code": "BAD_REQUEST",
    "message": "Invalid request parameter.",
    "details": { ... }
  },
  "meta": {
    "requestId": "d290f1ee-6c54-4b01-90e6-d701748f0851"
  }
}
```

---

## 2. Authentication & Identity

### Request OTP
Trigger a 6-digit verification code to be sent to a user phone.
- **URL**: `POST /auth/request-otp`
- **Payload**:
  ```json
  {
    "phone": "+919999999999"
  }
  ```
- **Response**:
  ```json
  {
    "data": {
      "success": true,
      "message": "OTP sent successfully. Valid for 5 minutes."
    }
  }
  ```

### Verify OTP
Verify the code and log in. Creates a new user profile if this is the first login.
- **URL**: `POST /auth/verify-otp`
- **Payload**:
  ```json
  {
    "phone": "+919999999999",
    "code": "123456",
    "role": "passenger"
  }
  ```
- **Response**:
  ```json
  {
    "data": {
      "accessToken": "eyJhbGciOi...",
      "refreshToken": "eyJhbGciOi...",
      "user": {
        "id": "u-1234",
        "phone": "+919999999999",
        "role": "passenger",
        "profile": { "firstName": "", "lastName": "" }
      }
    }
  }
  ```

### Refresh Token
Obtain a new access token using a refresh token.
- **URL**: `POST /auth/refresh`
- **Payload**:
  ```json
  {
    "refreshToken": "eyJhbGciOi..."
  }
  ```

---

## 3. Mobility Network

### Get Nearby Routes
Find transit routes traversing stops close to a latitude/longitude point.
- **URL**: `GET /routes/nearby?lat=23.0612&lng=72.5782&radius=2000`
- **Response**:
  ```json
  {
    "data": [
      {
        "routeId": "r-101",
        "name": "RTO to Kalupur Transit",
        "routeCode": "R-101",
        "cityId": "c-1234"
      }
    ]
  }
  ```

### Get Route stops
Get sequenced stops for a route version.
- **URL**: `GET /routes/:routeId/stops`
- **Response**:
  ```json
  {
    "data": [
      {
        "sequenceNumber": 1,
        "distanceFromStart": 0,
        "stopName": "RTO Circle",
        "lat": 23.0612,
        "lng": 72.5782
      }
    ]
  }
  ```

### Plan Journey
Plan a trip route from an origin point to a destination point. Estimates fares and durations.
- **URL**: `POST /journeys/plan`
- **Payload**:
  ```json
  {
    "originLat": 23.0612,
    "originLng": 72.5782,
    "destinationLat": 23.0285,
    "destinationLng": 72.5947,
    "preferences": {
      "maxWalkingLimit": 2000
    }
  }
  ```

---

## 4. Drivers & Vehicles

### Onboard Driver
Set license details. Restricted to authenticated users with `driver` role.
- **URL**: `POST /drivers/onboarding`
- **Headers**: `Authorization: Bearer <driver_token>`
- **Payload**:
  ```json
  {
    "licenseNumber": "GJ01-2026-0001234"
  }
  ```

### Upload Compliance Documents
Upload driver license or Aadhar images for review.
- **URL**: `POST /drivers/documents`
- **Payload**:
  ```json
  {
    "type": "aadhar",
    "url": "https://chalo-docs.s3.amazonaws.com/aadhar.jpg"
  }
  ```

### Register Vehicle
Add a new transit shuttle. Restricted to operations admins.
- **URL**: `POST /vehicles`
- **Payload**:
  ```json
  {
    "plateNumber": "GJ01-XX-9999",
    "make": "Piaggio",
    "model": "Ape Auto DX",
    "capacity": 6
  }
  ```

### Assign Driver to Vehicle
- **URL**: `POST /vehicles/:vehicleId/assign-driver`
- **Payload**:
  ```json
  {
    "driverId": "d-1234"
  }
  ```

---

## 5. Fare Engine

### Estimate Fare
Estimate the fare between two stops on a route.
- **URL**: `POST /fare/estimate`
- **Payload**:
  ```json
  {
    "routeId": "r-101",
    "pickupStopId": "s-a",
    "dropStopId": "s-b"
  }
  ```
- **Response**:
  ```json
  {
    "data": {
      "stopsPassed": 2,
      "fare": {
        "amount": 14.0,
        "currency": "INR",
        "breakdown": {
          "baseFare": 10.0,
          "perStopFare": 2.0
        }
      }
    }
  }
  ```
