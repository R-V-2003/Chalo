# Chalo Frontend Architecture

## 1. Purpose

This document defines the frontend architecture for the Chalo shared-auto/shuttle application.

The implementation must follow the supplied prototype image as the primary visual reference:

- bright yellow top/status/header treatment
- lime/yellow-green accent gradient
- warm off-white/cream content surfaces
- white map canvas
- large rounded cards
- soft shadows
- bold, readable typography
- simple route-first information hierarchy
- minimal visual clutter
- mobile-first interaction

Reference prototype repository:

`https://github.com/R-V-2003/Chalo`

Reference design image:

`Chalo prototype / UI reference supplied by the product owner`

The GitHub repository must be inspected by the AI developer before replacing or restructuring existing screens. Preserve useful existing components and logic where they fit the architecture.

---

## 2. Product Principle

The passenger should understand the answer to three questions immediately:

1. Where can I go?
2. Where is my shuttle?
3. How long do I need to wait?

The primary product loop is:

```text
Open
  ↓
Location
  ↓
Nearby routes
  ↓
Select route
  ↓
See shuttle + ETA
  ↓
Request / wait
  ↓
Track trip
  ↓
Ride
  ↓
Review
```

Do not make the application feel like a generic taxi-booking app.

Chalo is a shared fixed-route mobility product.

---

## 3. Recommended Frontend Stack

### Passenger app

- React Native
- Expo
- TypeScript
- Expo Router
- TanStack Query
- Zustand
- React Native Maps or Mapbox SDK depending on map provider
- Native geolocation/background-location APIs
- WebSocket/Socket.IO client
- React Hook Form
- Zod
- Reanimated
- Gesture Handler
- FlashList where long lists require it

### Shared

- TypeScript
- ESLint
- Prettier
- Jest
- React Native Testing Library
- Playwright where web/admin testing is relevant

### Admin

- Next.js
- TypeScript
- Tailwind CSS
- TanStack Query
- Recharts or equivalent analytics library

---

## 4. Frontend Architecture

Use a feature-oriented architecture.

```text
src/
├── app/
│   ├── _layout.tsx
│   ├── index.tsx
│   ├── onboarding/
│   ├── home/
│   ├── route/
│   ├── trip/
│   ├── profile/
│   └── review/
├── features/
│   ├── auth/
│   ├── location/
│   ├── routes/
│   ├── shuttles/
│   ├── journeys/
│   ├── trips/
│   ├── fares/
│   ├── reliability/
│   ├── occupancy/
│   ├── safety/
│   ├── feedback/
│   └── bhaya/
├── components/
│   ├── ui/
│   ├── map/
│   ├── route-card/
│   ├── shuttle-card/
│   ├── trip-card/
│   └── bottom-sheet/
├── services/
│   ├── api/
│   ├── websocket/
│   ├── location/
│   └── notifications/
├── store/
├── hooks/
├── lib/
├── theme/
└── types/
```

Do not put all screens in one folder.

---

## 5. State Management

### TanStack Query

Use for server state:

- routes
- stops
- shuttle data
- fares
- trips
- reliability
- profile
- feedback

### Zustand

Use for local/app state:

- onboarding completion
- selected route
- map UI state
- active trip UI state
- bottom-sheet state
- location permission state
- theme/preferences
- Bhaya conversation UI

Do not duplicate server data into Zustand unless there is a clear reason.

---

## 6. Realtime Architecture

REST loads the initial state.

WebSocket updates the live state.

Example:

```text
GET /routes/:id
        ↓
initial route
        ↓
WebSocket subscription
        ↓
vehicle.location
vehicle.arrived
vehicle.departed
trip.eta_updated
trip.status
```

TanStack Query cache should be updated from realtime events where practical.

Do not refetch the entire map every few seconds.

---

## 7. Location Permission Flow

Initial screen:

```text
Splash
 ↓
Enable your location
 ├─ Use my location
 └─ Skip for now
```

If permission is denied:

- explain why location is useful
- allow manual location selection
- never trap the user in a permission loop

Location must be treated as a product feature, not a technical error.

---

## 8. Navigation

Recommended root flow:

```text
Splash
 ↓
Location permission
 ↓
Home / Route Discovery
 ↓
Route detail
 ↓
Trip request
 ↓
Live trip
 ↓
Review
```

Profile/settings can be opened independently.

Use deep links for:

- shared trip
- route
- stop
- support
- notifications

---

## 9. Offline Behaviour

At minimum cache:

- recent routes
- favourite stops
- last known route geometry
- basic fare information where legally/product-wise safe
- user profile basics

If network is unavailable:

```text
Offline
 ↓
show cached route
 ↓
show "last updated"
 ↓
disable live ETA claims
```

Never show cached vehicle position as current live position.

---

## 10. Performance

Maps are performance-sensitive.

Rules:

- avoid rendering unnecessary markers
- cluster vehicles when zoomed out
- throttle location-driven UI updates
- animate vehicle movement instead of replacing marker abruptly
- memoize route cards
- paginate long lists
- lazy-load heavy screens
- keep images compressed
- avoid unnecessary global state updates

---

## 11. Accessibility

Minimum:

- readable contrast
- touch targets >= 44x44 pt
- accessible labels
- screen-reader labels
- not relying only on color
- clear status text
- large ETA/fare values
- support for system font scaling

The UI must remain usable for users who are not comfortable with complex apps.

---

## 12. Error States

Every major screen needs:

- loading
- empty
- offline
- permission denied
- API error
- stale realtime
- retry

Example:

```text
No shuttle nearby
Try another pickup point
```

Do not show raw API errors to users.

---

## 13. Feature Flags

Frontend flags:

```text
bhaya
occupancy
reliability
smart_pickup
trip_sharing
safety
multimodal
b2b
```

The UI must not expose unfinished backend features merely because their API exists.

---

## 14. Frontend/Backend Contract

The frontend consumes `/api/v1`.

Use generated or shared TypeScript types from OpenAPI where practical.

Never duplicate:

- fare calculation
- ETA calculation
- trip state rules
- driver identity logic

in the frontend.

Frontend displays backend truth.

---

## 15. Security

- never store secrets in the mobile bundle
- never store backend private keys
- use secure token storage
- validate deep-link inputs
- sanitize user-generated text
- never trust client fare values
- never trust client trip completion
- do not expose raw driver documents
- log only non-sensitive analytics

---

## 16. Analytics Events

Track product behaviour:

```text
app_opened
location_permission_granted
location_permission_denied
route_search_started
route_selected
stop_selected
shuttle_viewed
trip_requested
trip_cancelled
trip_started
trip_completed
feedback_submitted
bhaya_opened
bhaya_query_submitted
offline_mode_entered
```

Do not collect sensitive location history merely for analytics if the product does not need it.

---

## 17. Definition of Done

A screen is complete only when:

- reference design is matched
- responsive layout works
- loading state exists
- empty state exists
- error state exists
- offline state is handled
- accessibility labels exist
- API integration exists
- analytics events are defined
- tests exist
- no hard-coded secrets exist
- design tokens are used
