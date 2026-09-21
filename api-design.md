# Chalo API Design

## Standards

Base path:

```text
/api/v1
```

Transport: HTTPS JSON + WebSocket.

Headers:
- Authorization: Bearer token
- Content-Type: application/json
- X-Request-ID
- Idempotency-Key for critical commands

Success:

```json
{"data": {}, "meta": {"requestId": "uuid"}}
```

Error:

```json
{"error": {"code": "ROUTE_NOT_FOUND", "message": "No active route was found.", "details": {}}, "meta": {"requestId": "uuid"}}
```

Use cursor pagination.

## Authentication

```text
POST /auth/request-otp
POST /auth/verify-otp
POST /auth/refresh
POST /auth/logout
GET  /me
```

## Passenger and mobility

```text
GET  /routes/nearby
GET  /routes/:routeId
GET  /routes/:routeId/stops
GET  /stops/nearby
GET  /stops/:stopId
GET  /stops/:stopId/shuttles
POST /journeys/plan
GET  /shuttles/nearby
GET  /shuttles/:vehicleId
GET  /shuttles/:vehicleId/location
```

`POST /journeys/plan` accepts origin, destination, departure time and preferences such as fastest/cheapest/walking limit.

A journey option should contain route, pickup stop, drop stop, fare, ETA, walking distance and reliability score.

## Driver

```text
POST  /drivers/onboarding
GET   /drivers/me
POST  /drivers/documents
POST  /drivers/verification/submit
PATCH /drivers/status
POST  /drivers/location
GET   /drivers/me/current-trip
GET   /drivers/me/demand-zones
GET   /drivers/me/position-recommendation
```

Location payload:

```json
{
  "lat": 23.03,
  "lng": 72.51,
  "accuracy": 8,
  "speed": 21,
  "heading": 180,
  "timestamp": "2026-08-13T06:30:00Z"
}
```

## Vehicles

```text
POST  /vehicles
GET   /vehicles/:vehicleId
POST  /vehicles/:vehicleId/documents
POST  /vehicles/:vehicleId/assign-driver
PATCH /vehicles/:vehicleId/status
```

## Trips

```text
POST /trips
GET  /trips/:tripId
POST /trips/:tripId/start
POST /trips/:tripId/board
POST /trips/:tripId/complete
POST /trips/:tripId/cancel
GET  /users/me/trips
GET  /trips/:tripId/live
```

All state changes are validated by a server-side state machine and are transactional.

## Fare

```text
GET  /routes/:routeId/fare
POST /fare/estimate
```

Fare response should contain fare, currency, rule/version and breakdown.

Never trust a client-calculated fare.

## Realtime

WebSocket:

```text
/ws/trips/:tripId
```

Events:
- vehicle.location
- vehicle.arrived
- vehicle.departed
- trip.status
- trip.eta_updated

Authorise subscriptions.

## Reliability

```text
GET /routes/:routeId/reliability
GET /stops/:stopId/reliability
```

Return score plus sample size and supporting metrics.

## Occupancy

```text
POST /trips/:tripId/occupancy
GET  /shuttles/:vehicleId/occupancy
```

Occupancy must include source and confidence.

## Feedback

```text
POST /trips/:tripId/feedback
```

Structured tags:
safe_driving, driver_behaviour, correct_fare, cleanliness, overcrowding, route_followed, waiting, other.

## Safety

```text
POST /trips/:tripId/share
POST /trips/:tripId/sos
POST /trips/:tripId/report
GET  /incidents/:incidentId
```

All safety actions are audited.

## Bhaya

```text
POST /bhaya/chat
```

The AI layer may call typed tools:

```text
searchRoutes
findNearbyStops
getNextShuttles
getETA
getFare
planJourney
getTripStatus
reportIssue
```

The model must never invent fare, ETA, route, driver identity, vehicle identity or safety status.

## Demand

```text
POST /demand/events
GET  /demand/heatmap
GET  /demand/zones/:zoneId
GET  /demand/forecast
GET  /drivers/me/position-recommendation
```

## Smart pickup

```text
GET  /pickup-points/recommended
GET  /stops/:stopId/boarding-pattern
POST /pickup-points/proposals
POST /pickup-points/:id/approve
POST /pickup-points/:id/reject
```

AI never publishes a new stop autonomously.

## Admin

```text
GET   /admin/drivers
POST  /admin/drivers/:id/verify
POST  /admin/drivers/:id/suspend
GET   /admin/routes
POST  /admin/routes
POST  /admin/routes/:id/publish
POST  /admin/routes/:id/archive
GET   /admin/incidents
PATCH /admin/incidents/:id
GET   /admin/analytics/overview
GET   /admin/analytics/routes/:id
```

All admin endpoints use RBAC and audit logging.

## B2B

```text
POST /organizations
POST /organizations/:id/members
POST /organizations/:id/routes
GET  /organizations/:id/analytics
POST /organizations/:id/sponsorships
GET  /organizations/:id/mobility-report
```

## Notifications

Internal events should drive:
- push
- SMS
- WhatsApp
- email

Examples: shuttle approaching, disruption, trip updates, safety alerts.

## API contract rules

Use OpenAPI/Swagger. Breaking changes require `/v2`. Do not silently change fare structures, trip state names, route identifiers or location semantics.

Every endpoint needs validation, auth/RBAC tests, invalid-input tests and integration coverage. Critical commands need idempotency/concurrency tests.
