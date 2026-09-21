# Chalo Backend Architecture

## Purpose

Chalo is a digital operating layer for Ahmedabad's informal shared fixed-route auto-rickshaw/shuttle ecosystem. The backend must support today's MVP while being structurally ready for reliability scoring, occupancy, demand prediction, smart pickup points, driver positioning, B2B mobility, advertising, multimodal transport and multi-city expansion.

## Architecture principles

1. Start as a modular monolith, not premature microservices.
2. PostgreSQL + PostGIS is the source of truth.
3. Redis is ephemeral state/cache/queue support, never historical truth.
4. GPS ingestion is separated from normal CRUD APIs.
5. WebSockets provide live vehicle/trip updates.
6. Long-running work uses background jobs.
7. AI accesses typed backend tools, never the database directly.
8. Important domain changes emit typed events and are auditable.
9. Route history is versioned instead of overwritten.
10. Location/PII data has explicit retention and access policies.
11. APIs are versioned from day one.
12. External vendors are hidden behind provider interfaces.
13. Critical commands are idempotent.
14. Future-ready does not mean deploying every future service now.

## High-level topology

```text
Passenger App ─┐
Driver App ────┼── HTTPS/WSS ── Load Balancer ── Chalo API
Admin Web ─────┘                              ├─ Identity
                                               ├─ Mobility Network
                                               ├─ Drivers/Vehicles
                                               ├─ Trips/Fares
                                               ├─ Location/ETA
                                               ├─ Safety/Feedback
                                               ├─ Demand/Intelligence
                                               ├─ B2B
                                               └─ Bhaya AI
                                                     │
                         ┌───────────────────────────┴─────────────┐
                         │                                         │
                  PostgreSQL + PostGIS                           Redis
                         │                                         │
                    Analytics/ETL                         Realtime + Jobs
```

## Modules

### Identity
users, profiles, roles, sessions, OTP, devices, permissions, notification preferences.

Roles:
- passenger
- driver
- operations_admin
- support_agent
- fleet_manager
- institution_admin
- advertiser
- super_admin

### Driver and vehicle
drivers, driver documents, verification, vehicles, vehicle documents, assignments, status history.

### Mobility network
cities, zones, routes, route_versions, route geometries, stops, route_stops, operating windows, fare rules.

### Location
location sessions, raw vehicle/driver/trip location events, latest location state.

Raw GPS events are append-only. Current location is cached in Redis.

### Trips
trip lifecycle, passenger association, state history, trip events, fare snapshot.

State machine:

```text
REQUESTED → MATCHED → DRIVER_APPROACHING → ARRIVED → BOARDING
→ IN_PROGRESS → COMPLETED
```

Terminal states: CANCELLED, FAILED, EXPIRED.

### Reliability
ETA predictions, actual arrival times, route reliability snapshots, stop reliability snapshots.

Metrics:
- average/P50/P90 wait
- ETA error
- on-time rate
- frequency
- cancellation/completion rate
- complaint rate
- GPS freshness

### Occupancy
occupancy events and snapshots. Every value includes source, confidence and timestamp.

### Demand intelligence
demand events, aggregates, zones, forecasts and driver-position recommendations.

Capture successful AND unsuccessful demand:
route search, destination search, unavailable route, pickup selection, request, abandonment, vehicle full, boarding.

### Smart pickup
candidate pickup points, review workflow, published pickup-point versions.

AI/algorithms can propose. Operations must approve.

### Safety and feedback
trip sharing, SOS, incidents, incident events, structured feedback and feedback tags.

### Bhaya
conversation, messages, tool calls, usage logs.

Bhaya tools:
search_routes, nearby_stops, next_shuttles, get_eta, get_fare, plan_journey, trip_status, report_issue.

### B2B
organizations, members, organization routes, sponsorships and reports.

### Advertising
advertisers, campaigns, placements and campaign events.

### Platform
notifications, audit logs, feature flags.

## Data rules

Use UUID/ULID IDs, foreign keys, unique constraints, check constraints and deliberate indexes. All mutable tables have created_at/updated_at. Event/history tables are append-only where practical.

Use PostGIS:
- Point: stops, vehicles, GPS
- LineString/MultiLineString: routes
- Polygon: demand zones

Spatial indexes should use GIST.

Never mutate historical route geometry. Create a new route_version.

## Realtime GPS flow

```text
Driver GPS
 → validate
 → persist event
 → update Redis latest-location
 → calculate/update ETA
 → broadcast WebSocket event
 → passenger map
```

Recommended active GPS interval: 3–5 seconds while moving, configurable after battery/network testing.

Location freshness:
- fresh: <15 sec
- aging: 15–60 sec
- stale: 1–3 min
- unavailable: >3 min

Do not show stale data as live.

## ETA engine

Initial deterministic model:
route travel time + current speed + historical segment time + stop/dwell adjustment.

Future features:
traffic, time-of-day, weekday, weather, events, boarding dwell and ML.

Every prediction must be stored with actual arrival so prediction error becomes training data.

## Reliability engine

Do not expose a public reliability score when sample size is too small. Store:
score, sample size, on-time rate, wait distribution, ETA error and completion/cancellation metrics.

## Event model

Examples:

```text
USER_REGISTERED
DRIVER_VERIFIED
VEHICLE_VERIFIED
ROUTE_PUBLISHED
DRIVER_ONLINE
DRIVER_OFFLINE
LOCATION_RECEIVED
TRIP_REQUESTED
TRIP_STARTED
TRIP_COMPLETED
TRIP_CANCELLED
STOP_ARRIVAL_RECORDED
FARE_CALCULATED
INCIDENT_REPORTED
FEEDBACK_SUBMITTED
DEMAND_EVENT_RECORDED
```

Use an internal event bus initially. Move to SQS/SNS/EventBridge/Kafka only when scale requires it.

## Security

- TLS
- JWT + refresh-token strategy
- OTP authentication
- RBAC
- admin MFA
- validation
- rate limiting
- audit logs
- encrypted secrets
- least-privilege IAM
- private document storage
- signed URLs
- location access controls
- PII minimisation

Never log OTPs, access tokens or private driver documents.

## Repository

```text
chalo-backend/
├── apps/
│   ├── api/
│   ├── realtime/
│   ├── worker/
│   └── admin/
├── packages/
│   ├── database/
│   ├── contracts/
│   ├── auth/
│   ├── events/
│   ├── maps/
│   ├── ai/
│   ├── notifications/
│   └── observability/
├── migrations/
├── seeds/
├── tests/
├── infra/
├── docs/
└── .github/workflows/
```

## Deployment stages

### Development
One modular API + realtime + worker, RDS PostgreSQL/PostGIS, Redis.

### Staging
Production-like containers and managed services.

### Production
Horizontal API/realtime scaling, worker scaling, automated backups, monitoring and rollback.

Extract services only when load/team boundaries justify it.
