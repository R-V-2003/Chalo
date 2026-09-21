# Chalo Passenger App User Flow

## 1. Main Flow

```text
SPLASH
  ↓
LOCATION PERMISSION
  ↓
HOME / MAP
  ↓
NEARBY ROUTES
  ↓
ROUTE DETAIL
  ↓
REQUEST TO WAIT
  ↓
LIVE TRIP
  ↓
TRIP COMPLETE
  ↓
REVIEW
```

---

## 2. Splash

### User sees
- Chalo logo
- yellow → lime/green gradient

### Logic
- restore session
- restore last known location if available
- load feature flags
- prepare map

Then route to permission or home.

---

## 3. Location Permission

Primary CTA:

`USE MY LOCATION`

Secondary:

`SKIP FOR NOW`

### If granted

```text
→ Home
```

### If denied

```text
→ Home with manual location mode
```

Do not repeatedly show the native permission dialog without explaining why.

---

## 4. Home

### Goal

Answer:

> “What shared shuttles can I take from here?”

Show:

- current location
- nearby routes
- route cards
- fare
- pickup distance
- ETA when available

Primary interaction:

Tap route card.

---

## 5. Route Selection

Example:

```text
Akbarnagar → Satellite Road
₹10
```

The user sees:

- route map
- route line
- stops
- nearest pickup
- next shuttle
- ETA
- fare
- reliability

Then:

`REQUEST TO WAIT`

The wording intentionally matches the prototype.

---

## 6. Request to Wait

When selected:

```text
request sent
 ↓
driver/service acknowledges
 ↓
live trip begins
```

If the product eventually does not require a driver acceptance workflow, the backend can transition directly to a waiting/tracking state.

Do not hard-code this assumption in the UI architecture.

---

## 7. Live Trip

Show:

- live map
- vehicle marker
- route line
- driver name
- driver image
- vehicle registration
- ETA
- origin
- destination
- current status

Primary status examples:

```text
15 min away
Arriving at pickup
Board now
Trip in progress
```

---

## 8. Safety

Accessible during an active trip:

```text
Share trip
SOS
Report issue
```

These should remain visually secondary to navigation but easy to reach.

---

## 9. Trip Completion

When backend marks:

`COMPLETED`

show:

```text
Trip completed
★★★★★
Write a review
```

Optional structured feedback follows.

---

## 10. Error Flows

### No route

```text
No shared shuttle found
Try a nearby pickup point
```

### No live shuttle

```text
Route available
No shuttle is currently live
```

### GPS stale

```text
Location updated 2 min ago
Live position may be delayed
```

### Network failure

```text
You're offline
Showing saved route information
```

### API failure

```text
Something went wrong
Try again
```

---

## 11. Future Flow: Occupancy

```text
Route
 ↓
Next shuttle
 ↓
ETA
 ↓
Occupancy
 ├─ Seats available
 ├─ Filling up
 └─ Likely full
```

Only show occupancy confidence when backend supplies it.

---

## 12. Future Flow: Smart Pickup

```text
Destination
 ↓
Route
 ↓
Recommended pickup
 ↓
Why?
"Faster boarding at this stop"
 ↓
Navigate to pickup
```

---

## 13. Future Flow: Bhaya

Entry points:

- home
- route screen
- trip screen

Examples:

```text
"GU se Thaltej ka shuttle?"
"Agla shuttle kitne minute mein hai?"
"₹10 wala route kaunsa hai?"
"Main kis stop par wait karun?"
```

Bhaya should respond using verified backend tools.

---

## 14. Future Flow: Multimodal

```text
Origin
 ↓
Destination
 ↓
Shared auto
 + bus
 + metro
 + walking
 ↓
best journey
```

This must remain an extension of the existing route-first architecture, not a replacement of it.

---

## 15. Navigation Rules

Back button:

- live trip → confirm before leaving
- route detail → home
- review → trip history/home

Never allow accidental navigation to destroy an active trip state.

---

## 16. Empty State Philosophy

Every empty state should explain:

1. what happened
2. why it matters
3. what the user can do next

Bad:

`No data`

Good:

`No shared shuttle is live nearby. Try the next pickup point.`

---

## 17. UX Principle

The app should reduce uncertainty at every step:

```text
Where am I?
 ↓
Where can I go?
 ↓
Where is my pickup?
 ↓
Where is my shuttle?
 ↓
When will it arrive?
 ↓
How much will it cost?
 ↓
Can I trust the ride?
```
