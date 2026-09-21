# Chalo System Design

## System objective

Build a scalable shared-mobility system where passengers discover fixed-route shuttles, see live vehicles, estimate ETA/fare, ride safely and eventually receive demand-aware route recommendations.

## Passenger flow

```text
Location
 → nearby routes/stops
 → destination
 → journey planner
 → route + fare + ETA + reliability
 → pickup
 → live tracking
 → board
 → ride
 → complete
 → feedback
```

## Driver flow

```text
Login
 → verification
 → online
 → GPS session
 → route
 → demand information
 → stop events
 → occupancy
 → trip completion
 → analytics
```

## Realtime architecture

```text
Driver device
 → location API
 → validation
 → append location event
 → Redis latest-location
 → ETA calculation
 → WebSocket broadcast
 → passenger
```

Redis key example:

```text
vehicle:{vehicleId}:location
```

TTL prevents stale vehicles being presented as active.

## Geospatial model

PostGIS:
- Point for stops/current vehicles
- LineString/MultiLineString for route geometry
- Polygon for demand zones

Use GIST indexes.

Queries:
- nearest stops
- vehicles within radius
- route intersection
- stop-to-route distance
- demand density

## Route versioning

Routes change. Use immutable versions:

```text
Route A / Version 1
A-B-C-D

Route A / Version 2
A-B-C-E-D
```

Trips reference the version used at the time. Never rewrite history.

## Trip state machine

Only valid server-side transitions are accepted. State changes are transactional and emit events.

## ETA

### V1
routing time + current speed + historical segment time + stop delay.

### V2
traffic, time/day, weather, events and dwell history.

### V3
ML prediction with confidence.

Store prediction and actual arrival.

## Occupancy

Sources:
1. driver input
2. passenger confirmation
3. future computer vision
4. future vehicle sensors

Every record has value, source, confidence and timestamp.

## Demand intelligence

Record:
- route search
- destination search
- unavailable route
- pickup selection
- request
- abandonment
- vehicle full
- boarding

Aggregate by city, zone, route, stop, 15-minute bucket and weekday.

Pipeline:

```text
events → clean → aggregate → features → forecast → heatmap → driver recommendation
```

## Smart pickup

Candidate point scoring considers:
- boarding density
- road geometry
- dwell time
- safety
- accessibility
- demand
- traffic

Workflow:

```text
algorithm proposes
 → operations reviews
 → human approves
 → route version created
 → publish
```

## Bhaya

Three layers:

```text
Conversation → typed tools → backend truth
```

Backend truth includes routes, stops, ETA, fare, trip and safety state.

The LLM cannot write SQL or mutate mobility data.

## Notifications

```text
Domain event
 → notification worker
 → preference/consent check
 → provider adapter
 → push/SMS/WhatsApp/email
```

Marketing consent is separate from transactional notifications.

## Analytics

Initial:

```text
PostgreSQL → reporting tables
```

Later:

```text
PostgreSQL → event stream → S3/data lake → warehouse → BI/ML
```

Do not deploy a full data platform before usage requires it.

## B2B

Organizations contain:
- admins
- members
- routes
- sponsorships
- reports

Use cases:
- employee shuttle
- student/campus shuttle
- corporate corridors
- sponsored shared routes

## Multicity

Never hard-code Ahmedabad into the schema. Use:
country → state → city → zone → route → stop.

Every mobility entity should have city_id.

City configuration:
- timezone
- currency
- languages
- fare rules
- operating rules
- transport modes

## Multilingual

Start with English, Gujarati and Hindi support. UI strings use translation keys. Bhaya can accept multilingual input but route/fare facts remain language-neutral.

## Feature flags

Prepare flags for:
- reliability_score
- occupancy
- smart_pickup
- demand_heatmap
- bhaya
- b2b
- multimodal
- advertising
- driver_recommendations

## Data retention

Define policies before launch. Keep raw GPS shorter than aggregated mobility data where possible. PII and driver documents require restricted access and legal/privacy review.

## Disaster recovery

- automated DB backups
- point-in-time recovery
- encrypted backups
- IaC
- health/readiness checks
- deployment rollback
- incident runbook

Later: multi-AZ, replicas and cross-region recovery.

## Scaling

### Pilot
One modular API + realtime + worker + PostgreSQL + Redis.

### Growing network
Horizontal scaling, read replicas, queues and analytics pipeline.

### Large scale
Extract Location, Trip, Mobility, Intelligence and Notification services only when measured bottlenecks justify it.

## Testing

Unit:
- fare
- ETA
- state machine
- reliability
- permissions

Integration:
- PostgreSQL/PostGIS
- Redis
- APIs
- realtime
- providers

E2E:
- passenger
- driver
- admin

Load:
- GPS bursts
- concurrent map users
- simultaneous trip state changes

## Definition of done

Every backend feature must include:
- migration/schema
- API contract
- validation
- authorization
- tests
- events/audit behaviour
- observability
- error handling
- feature flag where appropriate
- documentation
