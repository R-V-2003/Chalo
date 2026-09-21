# Chalo Technology Stack

## Recommended stack

### Mobile
- React Native
- Expo
- TypeScript

Passenger and driver apps can share a monorepo and common packages.

### Admin
- Next.js
- React
- TypeScript
- Tailwind CSS

### Backend
- Node.js
- TypeScript
- NestJS

NestJS is preferred for clear module boundaries, dependency injection and long-term maintainability.

### Database
- PostgreSQL
- PostGIS
- Prisma initially
- Raw SQL/PostGIS for performance-critical geospatial queries

### Cache and state
- Redis
- BullMQ initially for jobs

### Realtime
- WebSockets
- Socket.IO

### Maps
Choose one primary provider:
- Mapbox, or
- Google Maps Platform

Wrap it in a `MapsProvider` interface so the vendor can be replaced.

### AI
Use an internal provider abstraction:

```text
AIProvider
 ├─ OpenAI
 ├─ Groq
 └─ future providers
```

AI uses typed tools for live mobility facts.

### Cloud
AWS:
- ECS/Fargate
- Application Load Balancer
- RDS PostgreSQL
- ElastiCache Redis
- S3
- CloudFront
- Route 53
- Secrets Manager
- CloudWatch
- IAM

Later if needed:
- SQS
- SNS
- EventBridge
- Athena/Glue
- Redshift
- OpenSearch

### Infrastructure
Terraform.

### CI/CD
GitHub Actions.

Pipeline:

```text
PR → lint → typecheck → unit → integration → build → security scan
→ staging → smoke test → production approval → deploy
```

### Monitoring
- Sentry
- CloudWatch

Track API latency, errors, GPS ingestion, stale GPS, realtime connections, ETA error, trip conversion and queue latency.

### Security
- JWT
- refresh-token rotation
- OTP
- RBAC
- admin MFA
- rate limiting
- Helmet/security headers
- TLS
- AWS Secrets Manager
- least-privilege IAM
- private S3 buckets
- signed URLs

### Storage
S3 for driver/vehicle documents and incident attachments. Keep buckets private.

### OTP
Use a provider abstraction. Potential vendors include MSG91, Twilio or AWS SNS, subject to India launch/compliance requirements.

### Payments
Not mandatory for MVP if shared fares remain offline.

Later:
- Razorpay
- Stripe where appropriate

Payment must be verified server-to-server.

### Analytics
Pilot:
- PostgreSQL reporting tables
- Metabase or equivalent

Scale:
PostgreSQL → S3 → Glue/Athena → warehouse → BI/ML.

### ML
Later:
- Python
- pandas
- scikit-learn
- XGBoost
- MLflow/SageMaker only when model operations justify it

Potential models:
- ETA prediction
- demand forecast
- occupancy prediction
- reliability
- driver positioning

## Monorepo

```text
chalo/
├── apps/
│   ├── passenger/
│   ├── driver/
│   ├── admin/
│   ├── api/
│   ├── realtime/
│   └── worker/
├── packages/
│   ├── ui/
│   ├── types/
│   ├── database/
│   ├── auth/
│   ├── maps/
│   ├── ai/
│   ├── events/
│   └── config/
├── infra/
│   └── terraform/
├── docs/
└── .github/
```

## Environments

- local
- development
- staging
- production

Never share production credentials with local development.

## Engineering rule

Do not add Kubernetes, Kafka, service mesh, dedicated ML infrastructure, a warehouse or OpenSearch merely because they sound scalable. The first goal is a reliable modular system. Extract services and add infrastructure when measured workload requires it.
