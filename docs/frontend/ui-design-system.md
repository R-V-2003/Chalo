# Chalo UI Design System

## 1. Design Direction

The supplied prototype is the source of truth for the initial visual language.

The design should feel:

- energetic
- local
- practical
- friendly
- modern
- highly readable
- map-first
- affordable rather than luxury

Avoid copying the visual language of Uber/Rapido.

---

## 2. Core Visual Palette

The reference image strongly uses yellow and lime-green.

Use these as starting tokens, not scattered hard-coded values.

```ts
export const colors = {
  primaryYellow: "#F4EA00",
  lime: "#A8D900",
  green: "#6FBF00",
  cream: "#FFF8E8",
  surface: "#FFFDF5",
  white: "#FFFFFF",
  text: "#151515",
  mutedText: "#777777",
  border: "#E7E1CF",
  mapRoad: "#E8E8E8",
  danger: "#D64545",
  success: "#48A868",
  black: "#111111",
};
```

The exact final tokens should be calibrated against the supplied prototype during implementation.

Do not introduce a large unrelated palette.

---

## 3. Gradient

Primary brand gradient:

```text
yellow → lime → green
```

Use it for:

- primary CTA
- selected route states
- important active elements
- splash background
- highlighted cards

Do not use gradients everywhere.

---

## 4. Surfaces

Primary card:

```text
background: cream
border radius: 22–28
shadow: soft
```

Map:

```text
background: map provider
cards overlay map
```

Use cards to create a clear separation between geographic information and action information.

---

## 5. Typography

Use a clean system sans-serif.

Hierarchy:

```text
Display: 28–34
H1: 24–28
H2: 18–22
Body: 14–16
Secondary: 12–13
Caption: 10–12
```

Important mobility information should be visually dominant:

- fare
- ETA
- route name
- pickup stop
- destination

---

## 6. Radius

Recommended:

```text
small: 10
medium: 14
large: 20
card: 24
pill: 999
```

The prototype uses strongly rounded cards. Preserve that character.

---

## 7. Shadows

Use soft shadows rather than heavy borders.

Example:

```text
shadowOpacity: 0.10
shadowRadius: 12
shadowOffset: { width: 0, height: 5 }
```

Do not make every component float.

---

## 8. Buttons

Primary CTA:

- yellow/lime/green gradient
- black text
- rounded pill
- strong contrast
- minimum 48px height

Example labels:

```text
USE MY LOCATION
REQUEST TO WAIT
VIEW ROUTE
TRACK SHUTTLE
```

Avoid excessive uppercase text except for major CTA labels matching the prototype.

---

## 9. Splash Screen

Reference:

- vertical yellow-to-green gradient
- centered Chalo icon
- rounded icon container
- subtle shadow
- white/cream surrounding app background

Keep the splash visually simple.

---

## 10. Location Permission Screen

Reference structure:

```text
Map background
       ↓
centered permission card
       ↓
location icon
       ↓
Enable your location
       ↓
short explanation
       ↓
USE MY LOCATION
       ↓
Skip for now
```

The map should remain visible behind the modal to establish context.

---

## 11. Home / Route Discovery

The prototype uses:

- full-screen map
- yellow top strip
- route cards over the map
- route name
- fare
- visual mini-map/route preview

Primary hierarchy:

```text
Map
 ↓
nearby route card
 ↓
route name
 ↓
fare
 ↓
pickup/drop information
```

Do not put a huge search box over the map unless user research shows it is needed.

---

## 12. Route Cards

A route card should contain:

```text
route name
fare
mini route preview
distance/ETA
nearest pickup
arrow
```

Example:

```text
Akbarnagar to Satellite Road
₹10

Gujarat University
~3 min
800 m
```

The card must be tappable as one large target.

---

## 13. Route Detail

Map remains primary.

Bottom sheet:

```text
Route title
Fare
Next shuttle
ETA
Pickup stop
Drop area
Reliability
REQUEST TO WAIT
```

Future:

```text
Occupancy
Smart pickup recommendation
Route reliability
```

---

## 14. Live Trip Screen

Reference prototype shows:

- map
- route polyline
- vehicle movement
- large cream trip card
- driver image
- driver name
- vehicle registration
- trip ETA
- origin
- destination
- CTA
- rating/review

Preserve this information hierarchy.

Recommended future version:

```text
Driver
Vehicle
ETA
Pickup
Destination
Live status
Safety
```

---

## 15. Review Screen

Prototype:

```text
★★★★★
Write a review
```

Expand later to structured tags:

```text
Safe driving
Correct fare
Clean vehicle
Good behaviour
Route followed
Waiting time
```

Keep the rating action fast.

---

## 16. Map Rules

Map should never visually overpower the action card.

Use:

- route polyline
- vehicle marker
- pickup marker
- destination marker
- selected stop marker

Avoid:

- excessive POI markers
- unnecessary map controls
- cluttered labels

---

## 17. Iconography

Use one icon family consistently.

Preferred style:

- simple
- rounded
- filled/outline hybrid
- high readability at small sizes

Do not mix random icon libraries without a wrapper.

---

## 18. Motion

Animations should communicate state.

Use:

- vehicle marker movement
- bottom-sheet transitions
- card entrance
- route selection
- ETA update
- success confirmation

Avoid decorative animation during active navigation.

---

## 19. Component Inventory

Build reusable:

```text
ChaloLogo
MapContainer
RouteCard
RouteMiniMap
StopCard
ShuttleCard
DriverCard
TripCard
EtaBadge
FareBadge
ReliabilityBadge
PrimaryButton
SecondaryButton
LocationPermissionCard
BottomSheet
StatusPill
RatingInput
EmptyState
ErrorState
OfflineBanner
BhayaButton
```

---

## 20. Theme Rules

Do not create dark mode first.

The first product should match the supplied light prototype.

If dark mode is introduced later, design it as a separate tested theme rather than automatically inverting colours.
