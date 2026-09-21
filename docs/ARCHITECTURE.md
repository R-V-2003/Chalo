# Chalo Backend Architecture

This document describes the design and topology of the **Chalo** shared transit digital operating system.

---

## 1. High-Level Topology

Chalo is structured as a **modular monolith** to keep operational overhead minimal during early pilot stages, while maintaining strict domain separations to enable clean service extraction (microservices) as load scales.

```text
Passenger App ─┐
Driver App ────┼── HTTPS/WSS ── Load Balancer ── Chalo API
Admin Web ─────┘                              ├─ Identity/Auth Module
                                               ├─ Mobility Network Module
                                               ├─ Drivers/Vehicles Module
                                               ├─ Trips/Fares Module
                                               ├─ Location & ETA Engine (Future)
                                               ├─ Safety & Feedback Module (Future)
                                               └─ Bhaya AI Layer (Future)
                                                     │
                                           PostgreSQL + PostGIS (Source of Truth)
                                           Redis (Cache, Sessions, Queues)
```

---

## 2. Directory Structure & Monorepo

The system utilizes a monorepo structure managed by `pnpm` workspaces:

```text
chalo/
├── apps/
│   └── api/                # NestJS API endpoints (/api/v1)
├── packages/
│   └── database/           # Shared database package with Prisma + PostGIS raw SQL migrations
├── docs/
│   ├── ARCHITECTURE.md     # Architecture specifications (this file)
│   ├── DATABASE.md         # Database schema designs
│   └── API.md              # OpenAPI API documentation
```

---

## 3. Module Boundaries (Phase 1)

1. **Identity & Auth Module**: Contains user registration, OTP generation/verification, JWT access and refresh token management, and Role-Based Access Control (RBAC).
2. **Mobility Network Module**: Manages geopolitical hierarchy (countries, states, cities, zones), stops with PostGIS geospatial point columns, and routes with immutable path geometries (LineStrings).
3. **Drivers & Vehicles Module**: Handles driver license onboarding, vehicle capacity registration, and assignments binding drivers to shuttle vehicles.
4. **Fare Engine Module**: Computes travel rates on route versioning policies based on stop count differences.

---

## 4. Key Design Decisions (ADRs)

- **Why a Monorepo?** Allows shared packages (like types, database ORM) to compile directly into apps without publishing to npm, ensuring faster developer iteration.
- **Why NestJS?** NestJS provides strict TypeScript boundaries, structural dependency injection (DI), and module encapsulations out of the box, preventing the modular monolith from becoming a "spaghetti" codebase.
- **Why PostGIS?** Geospatial routing, radius stop queries, and zone mapping are complex to run on normal databases. PostgreSQL + PostGIS exposes optimized indices (GIST) and robust spatial methods (e.g. `ST_DWithin`, `ST_Distance`).
- **Why Route Versioning?** Routes are dynamic and change often. To maintain historical trip accuracy, route paths and stops are stored as immutable `route_versions`. Trips reference the specific route version active when the trip was started.
