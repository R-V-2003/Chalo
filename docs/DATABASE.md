# Chalo Database Schema Specification

This document details the PostgreSQL + PostGIS database schema layout for **Chalo** (Phase 1).

---

## 1. Schema Diagram Overview

```text
  +------------------+         +--------------------+         +-----------------+
  |      users       | <------ |   user_profiles    |         |    countries    |
  |  - id (UUID, PK) |         |  - id (UUID, PK)   |         |  - id (UUID, PK)|
  |  - phone (UQ)    |         |  - user_id (FK, UQ)|         +--------+--------+
  |  - role          |         +--------------------+                  |
  +--------+---------+                                                 v
           |                                                  +--------+--------+
           |                                                  |     states      |
           v                                                  |  - id (UUID, PK)|
  +--------+---------+                                        +--------+--------+
  |     drivers      | <------ +--------------------+                  |
  |  - id (UUID, PK) |         |  driver_documents  |                  v
  |  - user_id (UQ)  |         |  - id (UUID, PK)   |         +--------+--------+
  +--------+---------+         +--------------------+         |     cities      |
           |                                                  |  - id (UUID, PK)|
           v                                                  |  - center (Geog)|
  +--------+---------+                                        +----+---+--------+
  |   assignments    |                                             |   |
  |  - id (UUID, PK) |                                             |   |
  |  - driver_id (FK)|                                             |   |
  |  - vehicle_id(FK)|                                 +-----------+   |
  +--------+---------+                                 |               |
           ^                                           v               v
  +--------+---------+                            +----+----+     +----+----+
  |     vehicles     |                            | routes  |     |  stops  |
  |  - id (UUID, PK) |                            +----+----+     +----+----+
  +------------------+                                 |               |
                                                       v               |
                                                  +----+----+          |
                                                  | versions| <--------+
                                                  +---------+
```

---

## 2. Spatial PostGIS Specifications

All coordinates and locations are represented using the `geography` type with SRID `4326` (WGS 84 latitude/longitude). This avoids Euclidean distance distortion at the latitude of Ahmedabad.

1. **Stops Location**:
   - Column: `stops.location geography(Point, 4326)`
   - Spatial Index: `GIST(location)`
2. **Route Path**:
   - Column: `route_versions.path geography(LineString, 4326)`
   - Spatial Index: `GIST(path)`
3. **Zone Boundaries**:
   - Column: `zones.boundary geography(Polygon, 4326)`
   - Spatial Index: `GIST(boundary)`

---

## 3. Data Tables Description

### User & Identity
- `users`: Core login identifiers. Restricts duplicate phones via unique constraints.
- `user_profiles`: Extensible passenger/driver details.
- `user_sessions`: JWT refresh tokens mapped to user agents.
- `otps`: Unverified 6-digit hashes with short TTL checks.

### Mobility Network
- `countries` / `states` / `cities` / `zones`: Geopolitical structure. `city_id` is assigned across routes and stops for clean indexing.
- `routes`: Base routing header.
- `route_versions`: Immutable versions of route path coordinates. Enables route modifications without breaking historical trip telemetry.
- `stops`: Point locations where vehicles dwell.
- `route_stops`: Sequence bindings linking stops to versions. Checks sequence ordering constraints (`sequence_number` starts at 1 and increases monotonically).
- `operating_windows`: Route schedule frequency.

### Fleet & Compliance
- `drivers`: Driver verification profile.
- `driver_documents`: Private Aadhar/License files. Access is restricted.
- `vehicles`: Public transit capacity configuration.
- `vehicle_documents`: Permitting/insurance details.
- `driver_vehicle_assignments`: Maps a driver to a vehicle. Ensures only 1 active driver per vehicle and 1 active vehicle per driver at any point in time.

### Fare Matrix
- `fare_rules`: Defines distance-step base pricing policies.

---

## 4. Performance Tuning & Indexing

- **Primary Keys**: All tables use `UUID` keys generated via `gen_random_uuid()` to prevent database sequence scanning.
- **Indexes**:
  - Unique index on `users(phone)`.
  - Non-unique foreign key indexes on all child tables to prevent join tables scanning.
  - Spatial `GIST` indexes on geometries.
