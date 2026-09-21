// AI-Powered Smart Navigation Chat — Groq
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../db');

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const DEFAULT_MODEL = 'qwen/qwen3.8-27b';
const FALLBACK_MODEL = 'groq/compound-mini';
const JWT_SECRET = process.env.JWT_SECRET || 'chalo-super-secret-key-2025';

// Optional auth: allows logged-in passengers/shuttles, guest users, and demo sessions
const optionalAuth = (req, res, next) => {
  const authHeader = req.header('Authorization');
  const token = authHeader?.replace('Bearer ', '');
  if (!token || token === 'demo-investor-token-chalo-2026') {
    req.user = { id: 0, name: 'Guest Passenger', role: 'passenger' };
    return next();
  }
  try {
    const verified = jwt.verify(token, JWT_SECRET);
    req.user = verified;
  } catch (err) {
    // Graceful fallback for visitors/guests
    req.user = { id: 0, name: 'Guest Passenger', role: 'passenger' };
  }
  next();
};

// ─── Known landmarks / places in Ahmedabad with approximate coords ───
const KNOWN_PLACES = [
  // Stops (these are exact)
  { name: 'Gujarat University', lat: 23.0339, lng: 72.5467, type: 'stop' },
  { name: 'Gurukul Road', lat: 23.0365, lng: 72.5395, type: 'stop' },
  { name: 'Drive-in Road', lat: 23.0465, lng: 72.5335, type: 'stop' },
  { name: 'Thaltej', lat: 23.0520, lng: 72.5080, type: 'stop' },
  { name: 'Akbarnagar', lat: 23.0400, lng: 72.5550, type: 'stop' },
  { name: 'Memnagar', lat: 23.0420, lng: 72.5480, type: 'stop' },
  { name: 'Vijay Cross Roads', lat: 23.0350, lng: 72.5350, type: 'stop' },
  { name: 'Satellite Road', lat: 23.0260, lng: 72.5140, type: 'stop' },
  { name: 'Gurukul Metro', lat: 23.0370, lng: 72.5400, type: 'stop' },
  { name: 'Anand Nagar', lat: 23.0340, lng: 72.5330, type: 'stop' },
  { name: 'Vastrapur Lake', lat: 23.0384, lng: 72.5289, type: 'stop' },
  { name: 'Vastrapur', lat: 23.0384, lng: 72.5289, type: 'stop' },
  { name: 'Paldi', lat: 23.0170, lng: 72.5650, type: 'stop' },
  { name: 'Ashram Road', lat: 23.0240, lng: 72.5590, type: 'stop' },
  { name: 'Income Tax', lat: 23.0300, lng: 72.5580, type: 'stop' },
  { name: 'Navrangpura', lat: 23.0330, lng: 72.5560, type: 'stop' },

  // Additional Ahmedabad landmarks & Transit hubs
  { name: 'IIM Ahmedabad', lat: 23.0325, lng: 72.5247, type: 'landmark' },
  { name: 'Iskcon Temple', lat: 23.0275, lng: 72.5170, type: 'landmark' },
  { name: 'Ahmedabad Railway Station', lat: 23.0225, lng: 72.5714, type: 'landmark' },
  { name: 'Sabarmati Ashram', lat: 23.0607, lng: 72.5804, type: 'landmark' },
  { name: 'Law Garden', lat: 23.0290, lng: 72.5600, type: 'landmark' },
  { name: 'CG Road', lat: 23.0275, lng: 72.5560, type: 'landmark' },
  { name: 'Panjrapole', lat: 23.0398, lng: 72.5385, type: 'landmark' },
  { name: 'SG Highway', lat: 23.0360, lng: 72.5060, type: 'landmark' },
  { name: 'Bodakdev', lat: 23.0420, lng: 72.5040, type: 'landmark' },
  { name: 'Prahlad Nagar', lat: 23.0135, lng: 72.5120, type: 'landmark' },
  { name: 'Shivranjani', lat: 23.0243, lng: 72.5313, type: 'landmark' },
  { name: 'Nehru Nagar', lat: 23.0223, lng: 72.5428, type: 'landmark' },
  { name: 'Helmet Cross Roads', lat: 23.0452, lng: 72.5419, type: 'brts' },
  { name: 'Helmet Circle BRTS', lat: 23.0452, lng: 72.5419, type: 'brts' },
  { name: 'Geeta Mandir Central Bus Station', lat: 23.0135, lng: 72.5890, type: 'bus_station' },
  { name: 'Paldi Bus Stand', lat: 23.0150, lng: 72.5650, type: 'bus_station' },
  { name: 'Jodhpur', lat: 23.0330, lng: 72.5090, type: 'landmark' },
  { name: 'Ambawadi', lat: 23.0280, lng: 72.5480, type: 'landmark' },
  { name: 'Polytechnic', lat: 23.0280, lng: 72.5510, type: 'landmark' },
  { name: 'Science City', lat: 23.0725, lng: 72.5109, type: 'landmark' },
  { name: 'Kankaria Lake', lat: 23.0064, lng: 72.5975, type: 'landmark' },
  { name: 'Maninagar', lat: 22.9996, lng: 72.5990, type: 'landmark' },
  { name: 'Vastral', lat: 23.0104, lng: 72.6389, type: 'landmark' },
  { name: 'Chandkheda', lat: 23.1092, lng: 72.5944, type: 'landmark' },
  { name: 'Gota', lat: 23.1025, lng: 72.5450, type: 'landmark' },
  { name: 'Bopal', lat: 23.0350, lng: 72.4650, type: 'landmark' },
  { name: 'South Bopal', lat: 23.0200, lng: 72.4700, type: 'landmark' },
  { name: 'Ghuma', lat: 23.0600, lng: 72.4750, type: 'landmark' },
  { name: 'Sola', lat: 23.0550, lng: 72.5350, type: 'landmark' },
  { name: 'Naranpura', lat: 23.0450, lng: 72.5560, type: 'landmark' },
  { name: 'Usmanpura', lat: 23.0430, lng: 72.5640, type: 'landmark' },
  { name: 'Stadium', lat: 23.0245, lng: 72.5650, type: 'landmark' },
  { name: 'Ellis Bridge', lat: 23.0240, lng: 72.5650, type: 'landmark' },
  { name: 'Lal Darwaja', lat: 23.0260, lng: 72.5820, type: 'landmark' },
  { name: 'Manek Chowk', lat: 23.0260, lng: 72.5850, type: 'landmark' },
  { name: 'Teen Darwaja', lat: 23.0240, lng: 72.5810, type: 'landmark' },
  { name: 'Alpha One Mall', lat: 23.0310, lng: 72.5170, type: 'landmark' },
  { name: 'Sindhu Bhavan', lat: 23.0400, lng: 72.5010, type: 'landmark' },
  { name: 'Judges Bungalow', lat: 23.0410, lng: 72.5110, type: 'landmark' },
];

// ─── Haversine distance in km ───
function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Estimate walking time (avg 5 km/h) ───
function walkingTime(distKm) {
  const mins = Math.round((distKm / 5) * 60);
  if (mins < 1) return 'less than 1 min';
  return `${mins} min`;
}

// ─── Build all routes + stops from DB ───
function getRouteData() {
  const routes = db.prepare('SELECT * FROM routes').all();
  const allStops = db.prepare('SELECT * FROM stops ORDER BY route_id, sort_order').all();
  const drivers = db.prepare(`
    SELECT d.name, d.vehicle_number, d.rating, d.total_rides, r.name as route_name
    FROM drivers d LEFT JOIN routes r ON d.route_id = r.id
  `).all();

  const routeMap = {};
  for (const r of routes) {
    routeMap[r.id] = { ...r, stops: [] };
  }
  for (const s of allStops) {
    if (routeMap[s.route_id]) {
      routeMap[s.route_id].stops.push(s);
    }
  }
  return { routes: Object.values(routeMap), drivers };
}

// ─── Find nearest stop to a given lat/lng ───
function findNearestStops(lat, lng, allStops, topN = 5) {
  return allStops
    .map(s => ({ ...s, dist: haversineKm(lat, lng, s.lat, s.lng) }))
    .sort((a, b) => a.dist - b.dist)
    .slice(0, topN);
}

// ─── Resolve a place name to coordinates ───
function resolvePlace(placeName) {
  if (!placeName) return null;
  const q = placeName.toLowerCase().trim();

  // 1. Try known places & landmarks
  const found = KNOWN_PLACES.find(p => q.includes(p.name.toLowerCase()) || p.name.toLowerCase().includes(q));
  if (found) return found;

  // 2. Try DB shuttle stops
  try {
    const stops = db.prepare('SELECT * FROM stops').all();
    const stopMatch = stops.find(s => q.includes(s.name.toLowerCase()) || s.name.toLowerCase().includes(q));
    if (stopMatch) return { name: stopMatch.name, lat: stopMatch.lat, lng: stopMatch.lng, type: 'stop' };
  } catch (e) {}

  // 3. Try Metro Stations
  try {
    const metroStations = db.prepare(`
      SELECT ms.name, ms.lat, ms.lng, ml.name as line_name, ml.color, ml.city
      FROM metro_stations ms JOIN metro_lines ml ON ms.line_id = ml.id
    `).all();
    const metroMatch = metroStations.find(s => q.includes(s.name.toLowerCase()) || s.name.toLowerCase().includes(q));
    if (metroMatch) return { name: `${metroMatch.name} Metro`, lat: metroMatch.lat, lng: metroMatch.lng, type: 'metro', line: metroMatch.line_name };
  } catch (e) {}

  // 4. Try BRTS Stops
  try {
    const brtsStops = db.prepare(`
      SELECT bs.name, bs.lat, bs.lng, br.route_number, br.name as route_name
      FROM brts_stops bs JOIN brts_routes br ON bs.route_id = br.id
    `).all();
    const brtsMatch = brtsStops.find(s => q.includes(s.name.toLowerCase()) || s.name.toLowerCase().includes(q));
    if (brtsMatch) return { name: `${brtsMatch.name} (BRTS)`, lat: brtsMatch.lat, lng: brtsMatch.lng, type: 'brts', route: brtsMatch.route_number };
  } catch (e) {}

  // 5. Try Railway Stations
  try {
    const rlyStations = db.prepare('SELECT * FROM railway_stations').all();
    const rlyMatch = rlyStations.find(s => q.includes(s.name.toLowerCase()) || s.name.toLowerCase().includes(q) || (s.code && q === s.code.toLowerCase()));
    if (rlyMatch) return { name: rlyMatch.name, lat: rlyMatch.lat, lng: rlyMatch.lng, type: 'railway' };
  } catch (e) {}

  // 6. Try GSRTC Bus Stands
  try {
    const busStands = db.prepare('SELECT * FROM gsrtc_bus_stands').all();
    const busMatch = busStands.find(s => q.includes(s.name.toLowerCase()) || s.name.toLowerCase().includes(q));
    if (busMatch) return { name: busMatch.name, lat: busMatch.lat, lng: busMatch.lng, type: 'gsrtc' };
  } catch (e) {}

  // 7. Try Intercity Cities (Vadodara, Surat, Rajkot, Gandhinagar, Mumbai, Delhi)
  try {
    const cities = db.prepare('SELECT * FROM cities').all();
    const cityMatch = cities.find(c => q.includes(c.name.toLowerCase()) || c.name.toLowerCase().includes(q));
    if (cityMatch) return { name: cityMatch.name, lat: cityMatch.lat, lng: cityMatch.lng, type: 'intercity', state: cityMatch.state };
  } catch (e) {}

  return null;
}

// ─── Core: Find best travel plan across Shuttle, Metro, BRTS & Intercity ───
function findTravelPlan(fromPlace, toPlace) {
  const { routes } = getRouteData();
  const allStops = routes.flatMap(r => r.stops.map(s => ({ ...s, routeName: r.name, routeId: r.id, fare: r.fare, color: r.color })));

  const candidates = [];

  // 1. Direct Shuttle Routes (Only if walk to pickup and walk to drop-off are both <= 1.2 km)
  const nearFromShuttles = findNearestStops(fromPlace.lat, fromPlace.lng, allStops, 6).filter(s => s.dist <= 1.2);
  const nearToShuttles = findNearestStops(toPlace.lat, toPlace.lng, allStops, 6).filter(s => s.dist <= 1.2);

  for (const fromStop of nearFromShuttles) {
    for (const toStop of nearToShuttles) {
      if (fromStop.route_id === toStop.route_id && fromStop.id !== toStop.id) {
        const walkDistFrom = haversineKm(fromPlace.lat, fromPlace.lng, fromStop.lat, fromStop.lng);
        const walkDistTo = haversineKm(toPlace.lat, toPlace.lng, toStop.lat, toStop.lng);
        const route = routes.find(r => r.id === fromStop.route_id);
        const estDuration = Math.round((walkDistFrom + walkDistTo) * 12 + 14);

        candidates.push({
          type: 'direct',
          mode: 'shuttle',
          walkToStop: { name: fromStop.name, distance: walkDistFrom.toFixed(2), walkTime: walkingTime(walkDistFrom) },
          boardRoute: route.name,
          fare: route.fare || 10,
          alightAt: { name: toStop.name, distance: walkDistTo.toFixed(2), walkTime: walkingTime(walkDistTo) },
          totalWalk: (walkDistFrom + walkDistTo).toFixed(2),
          estDuration,
          titleTag: `🛺 CHALO SHARED SHUTTLE (Direct • ₹${route.fare || 10})`
        });
      }
    }
  }

  // 2. Metro Rail Options (Fast, AC & Traffic-free)
  try {
    const metroStations = db.prepare(`
      SELECT ms.id, ms.name, ms.lat, ms.lng, ms.line_id, ml.name as line_name, ml.color
      FROM metro_stations ms JOIN metro_lines ml ON ms.line_id = ml.id
      WHERE ml.city = 'Ahmedabad'
    `).all();

    if (metroStations.length > 0) {
      const nearMetroFrom = findNearestStops(fromPlace.lat, fromPlace.lng, metroStations, 3).filter(s => s.dist <= 2.2);
      const nearMetroTo = findNearestStops(toPlace.lat, toPlace.lng, metroStations, 3).filter(s => s.dist <= 2.2);

      if (nearMetroFrom.length && nearMetroTo.length) {
        const mFrom = nearMetroFrom[0];
        const mTo = nearMetroTo[0];
        const walkDistFrom = haversineKm(fromPlace.lat, fromPlace.lng, mFrom.lat, mFrom.lng);
        const walkDistTo = haversineKm(toPlace.lat, toPlace.lng, mTo.lat, mTo.lng);

        if (mFrom.id !== mTo.id) {
          const isInterchange = mFrom.line_id !== mTo.line_id;
          const estDuration = Math.round((walkDistFrom + walkDistTo) * 12 + (isInterchange ? 18 : 12));
          candidates.push({
            type: 'metro',
            mode: 'metro',
            walkToStop: { name: `${mFrom.name} Metro Station`, distance: walkDistFrom.toFixed(2), walkTime: walkingTime(walkDistFrom) },
            boardRoute: `Ahmedabad Metro ${mFrom.line_name}`,
            fare: 15,
            alightAt: { name: `${mTo.name} Metro Station`, distance: walkDistTo.toFixed(2), walkTime: walkingTime(walkDistTo) },
            isInterchange,
            interchangeAt: isInterchange ? 'Old High Court Interchange' : null,
            totalWalk: (walkDistFrom + walkDistTo).toFixed(2),
            estDuration,
            titleTag: `🚇 AHMEDABAD METRO (${isInterchange ? 'Via Interchange • ' : ''}Fast & AC)`
          });
        }
      }
    }
  } catch (e) {}

  // 3. Janmarg BRTS Bus Corridor
  try {
    const brtsStops = db.prepare(`
      SELECT bs.id, bs.name, bs.lat, bs.lng, bs.route_id, br.route_number, br.name as route_name, br.fare
      FROM brts_stops bs JOIN brts_routes br ON bs.route_id = br.id
      WHERE br.city = 'Ahmedabad'
    `).all();

    if (brtsStops.length > 0) {
      const nearBrtsFrom = findNearestStops(fromPlace.lat, fromPlace.lng, brtsStops, 3).filter(s => s.dist <= 1.8);
      const nearBrtsTo = findNearestStops(toPlace.lat, toPlace.lng, brtsStops, 3).filter(s => s.dist <= 1.8);

      for (const bf of nearBrtsFrom) {
        for (const bt of nearBrtsTo) {
          if (bf.route_id === bt.route_id && bf.id !== bt.id) {
            const walkDistFrom = haversineKm(fromPlace.lat, fromPlace.lng, bf.lat, bf.lng);
            const walkDistTo = haversineKm(toPlace.lat, toPlace.lng, bt.lat, bt.lng);
            const estDuration = Math.round((walkDistFrom + walkDistTo) * 12 + 16);
            candidates.push({
              type: 'brts',
              mode: 'brts',
              walkToStop: { name: `${bf.name} BRTS Stop`, distance: walkDistFrom.toFixed(2), walkTime: walkingTime(walkDistFrom) },
              boardRoute: `BRTS Route ${bf.route_number} (${bf.route_name})`,
              fare: bf.fare || 10,
              alightAt: { name: `${bt.name} BRTS Stop`, distance: walkDistTo.toFixed(2), walkTime: walkingTime(walkDistTo) },
              totalWalk: (walkDistFrom + walkDistTo).toFixed(2),
              estDuration,
              titleTag: `🚌 JANMARG BRTS CORRIDOR (Route ${bf.route_number})`
            });
          }
        }
      }
    }
  } catch (e) {}

  // 4. Transfer Shuttle Routes (Only if both pickup/drop and transfer walks are tight)
  if (candidates.length < 2) {
    const nearFromLoose = findNearestStops(fromPlace.lat, fromPlace.lng, allStops, 3).filter(s => s.dist <= 0.9);
    const nearToLoose = findNearestStops(toPlace.lat, toPlace.lng, allStops, 3).filter(s => s.dist <= 0.9);

    for (const fromStop of nearFromLoose) {
      const firstRoute = routes.find(r => r.id === fromStop.route_id);
      if (!firstRoute) continue;

      for (const firstRouteStop of firstRoute.stops) {
        const transferCandidates = allStops.filter(s =>
          s.route_id !== firstRoute.id &&
          haversineKm(firstRouteStop.lat, firstRouteStop.lng, s.lat, s.lng) <= 0.5
        );

        for (const transferStop of transferCandidates) {
          const secondRoute = routes.find(r => r.id === transferStop.route_id);
          if (!secondRoute) continue;

          for (const destStop of nearToLoose) {
            if (destStop.route_id === secondRoute.id) {
              const walkDistFrom = haversineKm(fromPlace.lat, fromPlace.lng, fromStop.lat, fromStop.lng);
              const transferDist = haversineKm(firstRouteStop.lat, firstRouteStop.lng, transferStop.lat, transferStop.lng);
              const walkDistTo = haversineKm(toPlace.lat, toPlace.lng, destStop.lat, destStop.lng);
              const estDuration = Math.round((walkDistFrom + transferDist + walkDistTo) * 12 + 26);

              candidates.push({
                type: 'transfer',
                mode: 'shuttle',
                walkToStop: { name: fromStop.name, distance: walkDistFrom.toFixed(2), walkTime: walkingTime(walkDistFrom) },
                firstRoute: firstRoute.name,
                firstFare: firstRoute.fare,
                alightAt: firstRouteStop.name,
                transferWalk: { distance: transferDist.toFixed(2), walkTime: walkingTime(transferDist) },
                boardAt: transferStop.name,
                secondRoute: secondRoute.name,
                secondFare: secondRoute.fare,
                finalStop: { name: destStop.name, distance: walkDistTo.toFixed(2), walkTime: walkingTime(walkDistTo) },
                fare: firstRoute.fare + secondRoute.fare,
                totalFare: firstRoute.fare + secondRoute.fare,
                totalWalk: (walkDistFrom + transferDist + walkDistTo).toFixed(2),
                estDuration,
                titleTag: `🚐 CHALO SHUTTLE TRANSFER (${firstRoute.name} ➔ ${secondRoute.name})`
              });
            }
          }
        }
      }
    }
  }

  // De-duplicate candidates by route + alight
  const uniqueCandidates = [];
  const seenKey = new Set();
  for (const c of candidates) {
    const key = `${c.type}_${c.boardRoute}_${c.alightAt?.name || c.finalStop?.name}`;
    if (!seenKey.has(key)) {
      seenKey.add(key);
      uniqueCandidates.push(c);
    }
  }

  if (uniqueCandidates.length === 0) {
    return [];
  }

  // ── Formulate specifically categorized options: 1. Fastest/Shortest, 2. Cheapest/Budget, 3. Alternative ──
  const sortedByTime = [...uniqueCandidates].sort((a, b) => a.estDuration - b.estDuration);
  const sortedByCost = [...uniqueCandidates].sort((a, b) => a.fare - b.fare);

  const fastest = sortedByTime[0];
  let cheapest = sortedByCost[0];

  const finalPlans = [];

  if (fastest === cheapest) {
    // Single best route that is BOTH fastest and cheapest
    finalPlans.push({
      ...fastest,
      priorityCategory: 'fastest_and_cheapest',
      optionLabel: 'Option 1 — ⚡ Sabse Short & Sasta (Direct & Best Value)'
    });

    // Find alternative of different mode
    const alt1 = uniqueCandidates.find(c => c !== fastest && c.mode !== fastest.mode) || sortedByTime[1];
    if (alt1) {
      finalPlans.push({
        ...alt1,
        priorityCategory: 'alternative_mode',
        optionLabel: `Option 2 — ${alt1.mode === 'metro' ? '🚇 AC & Traffic-Free Metro' : '🚌 Janmarg BRTS Bus Corridor'}`
      });
    }

    const alt2 = uniqueCandidates.find(c => c !== fastest && c !== alt1);
    if (alt2) {
      finalPlans.push({
        ...alt2,
        priorityCategory: 'alternative_secondary',
        optionLabel: `Option 3 — 🔄 Alternative Route (${alt2.mode.toUpperCase()})`
      });
    }
  } else {
    // Option 1: Fastest / Shortest
    finalPlans.push({
      ...fastest,
      priorityCategory: 'fastest',
      optionLabel: `Option 1 — ⚡ Sabse Short & Tez (Fastest Route • ~${fastest.estDuration} min)`
    });

    // Option 2: Budget / Lowest Fare
    finalPlans.push({
      ...cheapest,
      priorityCategory: 'cheapest',
      optionLabel: `Option 2 — 💰 Sabse Sasta / Budget Option (Lowest Fare • ₹${cheapest.fare})`
    });

    // Option 3: Distinct alternative
    const alt = uniqueCandidates.find(c => c !== fastest && c !== cheapest && c.mode !== fastest.mode) ||
                uniqueCandidates.find(c => c !== fastest && c !== cheapest);
    if (alt) {
      finalPlans.push({
        ...alt,
        priorityCategory: 'alternative',
        optionLabel: `Option 3 — 🔄 Alternative Option (${alt.titleTag.split('(')[0].trim()})`
      });
    }
  }

  return finalPlans;
}

// ─── Find Intercity / Outstation Multi-Leg Travel Plans ───
function findIntercityTravelPlans(fromPlace, toPlace) {
  const plans = [];
  const targetCity = (toPlace.name || '').toLowerCase();
  const qCity = targetCity.split(' ')[0].replace(/[^a-z]/gi, '');

  // Find nearest Metro Station to user on Blue Line (connects directly to Kalupur Railway Station Metro!)
  let nearestMetroToUser = null;
  try {
    const blueLineStations = db.prepare(`
      SELECT ms.id, ms.name, ms.lat, ms.lng
      FROM metro_stations ms JOIN metro_lines ml ON ms.line_id = ml.id
      WHERE ml.name LIKE '%Blue%' OR ml.code = 'BL'
    `).all();
    if (blueLineStations.length > 0) {
      const sorted = blueLineStations.map(s => ({
        ...s,
        distKm: haversineKm(fromPlace.lat, fromPlace.lng, s.lat, s.lng)
      })).sort((a, b) => a.distKm - b.distKm);
      nearestMetroToUser = sorted[0];
    }
  } catch (e) {}

  // Look up premier and budget trains to target destination
  let matchingTrains = [];
  try {
    matchingTrains = db.prepare(`
      SELECT * FROM trains 
      WHERE to_station LIKE ? OR name LIKE ?
      ORDER BY CASE 
        WHEN type = 'Vande Bharat' THEN 1 
        WHEN type = 'Shatabdi' THEN 2 
        WHEN type = 'Rajdhani' THEN 3 
        WHEN type = 'Mail/Express' THEN 4
        ELSE 5 
      END
    `).all(`%${qCity}%`, `%${qCity}%`);
  } catch (e) {}

  // Look up buses to target destination
  let matchingBuses = [];
  try {
    matchingBuses = db.prepare(`
      SELECT * FROM state_bus_routes WHERE to_city LIKE ?
    `).all(`%${qCity}%`);
  } catch (e) {}

  // ── Plan 1: Fastest Multimodal (Metro Blue Line direct to Kalupur ➔ Vande Bharat / Shatabdi Express) ──
  const premierTrain = matchingTrains.find(t => t.type === 'Vande Bharat' || t.type === 'Shatabdi' || t.type === 'Rajdhani') || matchingTrains[0];
  if (premierTrain) {
    const metroWalkM = nearestMetroToUser ? Math.max(120, Math.round(nearestMetroToUser.distKm * 1000)) : 450;
    const metroWalkTime = walkingTime(nearestMetroToUser ? nearestMetroToUser.distKm : 0.45);
    const metroStationName = nearestMetroToUser ? `${nearestMetroToUser.name} Metro Station` : 'Commerce Six Road / Gujarat University Metro';
    const trainFare = premierTrain.fare_chair_car > 0 ? premierTrain.fare_chair_car : (premierTrain.fare_3ac || 1385);
    const totalFare = trainFare + 15;

    plans.push({
      type: 'intercity_multimodal_metro',
      title: `⚡ Sabse Tez (Fastest Route) — Metro Blue Line ➔ ${premierTrain.name}`,
      localLeg: {
        mode: 'metro',
        walkDist: metroWalkM < 1000 ? `${metroWalkM}m` : `${(metroWalkM / 1000).toFixed(1)}km`,
        walkTime: metroWalkTime,
        station: metroStationName,
        metroLine: 'Ahmedabad Metro Blue Line (Direct Underground)',
        metroDest: 'Kalupur Railway Station Metro (Platforms Exit)',
        metroFare: '₹15',
        metroDuration: '12 min'
      },
      intercityLeg: {
        mode: 'train',
        trainName: premierTrain.name,
        trainNumber: premierTrain.train_number,
        fromStation: premierTrain.from_station,
        toStation: premierTrain.to_station,
        departure: premierTrain.departure_time,
        duration: premierTrain.duration,
        fare: `₹${trainFare}`,
        type: premierTrain.type
      },
      totalFare: `₹${totalFare}`,
      totalWalk: metroWalkM < 1000 ? `${metroWalkM}m` : `${(metroWalkM / 1000).toFixed(1)}km`,
      destination: toPlace.name,
      hub: 'Kalupur Railway Station',
      score: 0.1
    });
  }

  // ── Plan 2: Budget Option (Local Metro/Bus ➔ Gujarat Mail / Superfast Sleeper Train) ──
  // Note: Local connection is via direct Metro Blue Line or AMTS bus to Kalupur (NO non-existent shuttle to Kalupur)
  const budgetTrain = matchingTrains.find(t => t.type === 'Mail/Express' || t.type === 'Superfast' || t.fare_sleeper > 0) || matchingTrains[1] || matchingTrains[0];
  if (budgetTrain) {
    const metroWalkM = nearestMetroToUser ? Math.max(120, Math.round(nearestMetroToUser.distKm * 1000)) : 450;
    const metroWalkTime = walkingTime(nearestMetroToUser ? nearestMetroToUser.distKm : 0.45);
    const metroStationName = nearestMetroToUser ? `${nearestMetroToUser.name} Metro Station` : 'Commerce Six Road / Gujarat University Metro';
    const trainFare = budgetTrain.fare_sleeper > 0 ? budgetTrain.fare_sleeper : (budgetTrain.fare_chair_car || 365);
    const totalFare = trainFare + 15;

    plans.push({
      type: 'intercity_multimodal_budget_train',
      title: `💰 Sabse Sasta / Budget Option — Metro ➔ ${budgetTrain.name} (Overnight Sleeper)`,
      localLeg: {
        mode: 'metro',
        walkDist: metroWalkM < 1000 ? `${metroWalkM}m` : `${(metroWalkM / 1000).toFixed(1)}km`,
        walkTime: metroWalkTime,
        station: metroStationName,
        metroLine: 'Ahmedabad Metro Blue Line direct to Kalupur Railway Station',
        metroDest: 'Kalupur Railway Station',
        metroFare: '₹15'
      },
      intercityLeg: {
        mode: 'train',
        trainName: budgetTrain.name,
        trainNumber: budgetTrain.train_number,
        fromStation: budgetTrain.from_station,
        toStation: budgetTrain.to_station,
        departure: budgetTrain.departure_time,
        duration: budgetTrain.duration,
        fare: `₹${trainFare} (Sleeper Class)`,
        type: budgetTrain.type
      },
      totalFare: `₹${totalFare}`,
      totalWalk: metroWalkM < 1000 ? `${metroWalkM}m` : `${(metroWalkM / 1000).toFixed(1)}km`,
      destination: toPlace.name,
      hub: 'Kalupur Railway Station',
      score: 0.2
    });
  }

  // ── Plan 3: Direct Highway Bus (CHALO Shuttle / Auto ➔ GSRTC Volvo AC Seater & Sleeper) ──
  const bus = matchingBuses.find(b => b.bus_type && b.bus_type.toLowerCase().includes('volvo')) || matchingBuses[0] || {
    operator: 'GSRTC',
    bus_type: 'Volvo AC Multi-Axle Sleeper',
    from_city: 'Geeta Mandir Central Bus Station',
    to_city: toPlace.name,
    frequency: 'Departures at 07:00, 11:00, 19:30, 21:00, 22:30',
    duration: '8h 30m',
    fare_ac: 850,
    fare: 650
  };

  const busFareSeater = bus.fare || 650;
  const busFareSleeper = bus.fare_ac || 850;
  plans.push({
    type: 'intercity_multimodal_bus',
    title: `🚍 Direct Highway Bus — GSRTC Volvo AC (Geeta Mandir / ISCON Pickup)`,
    localLeg: {
      mode: 'shuttle',
      walkDist: 'Direct / 200m',
      walkTime: '2 min',
      stop: 'ISCON Cross Road Pickup Point (SG Highway) or Geeta Mandir Central Bus Stand',
      shuttleRoute: 'Direct Boarding in West Ahmedabad or CHALO Shuttle to Geeta Mandir',
      shuttleDest: 'Geeta Mandir Central Bus Station',
      shuttleFare: '₹10'
    },
    intercityLeg: {
      mode: 'state_bus',
      operator: bus.operator || 'GSRTC',
      busType: 'Volvo AC Seater & Multi-Axle Sleeper',
      fromStation: 'Geeta Mandir Central Bus Station (ST Stand, Bay 12-14)',
      boardingPoints: 'Geeta Mandir Central Bus Station (Bay 12-14), Paldi Volvo Hub, or ISCON Cross Road GSRTC Pickup (SG Highway)',
      toStation: toPlace.name,
      timings: 'Morning (07:00, 11:00) & Overnight Sleeper (19:30, 21:00, 22:30)',
      frequency: bus.departure_time || 'Departures at 07:00, 11:00, 19:30, 21:00, 22:30 (Every 45-60 min)',
      duration: bus.duration || '8h 30m',
      fareSeater: `${busFareSeater}`,
      fareSleeper: `${busFareSleeper}`,
      fare: `₹${busFareSeater} (Seater) / ₹${busFareSleeper} (Sleeper)`
    },
    totalFare: `₹${busFareSeater} - ₹${busFareSleeper}`,
    totalWalk: '200m',
    destination: toPlace.name,
    hub: 'Geeta Mandir Central Bus Station',
    score: 0.3
  });

  return plans;
}

// ─── Build full context for the AI ───
function buildContext() {
  try {
    const { routes, drivers } = getRouteData();

    let ctx = '=== CHALO INTEGRATED TRANSIT ECOSYSTEM — AHMEDABAD & PAN-INDIA ===\n\n';

    ctx += '1. CHALO SHARED SHUTTLE CORRIDORS (Fixed ₹8 - ₹10 fare, on-demand shared auto):\n';
    for (const r of routes) {
      ctx += `📍 Shuttle Corridor: "${r.name}" | Fixed Fare: ₹${r.fare} | ${r.distance}km | ${r.duration}\n`;
      ctx += `   Stops: ` + r.stops.map(s => `${s.name}`).join(' ➔ ') + '\n';
    }

    ctx += '\n2. AHMEDABAD METRO RAIL (GMRC) — FAST, AC & TRAFFIC-FREE:\n';
    try {
      const lines = db.prepare('SELECT * FROM metro_lines WHERE city = "Ahmedabad"').all();
      lines.forEach(l => {
        const stations = db.prepare('SELECT name, is_interchange FROM metro_stations WHERE line_id = ? ORDER BY sort_order').all(l.id);
        ctx += `🚇 ${l.name} (${l.code}) [${l.from_station} ↔ ${l.to_station}]: ${l.total_stations} stations, Fares: ₹5 to ₹25, Frequency: Every ${l.frequency_minutes} min\n`;
        ctx += `   Key Stations: ` + stations.map(s => s.is_interchange ? `*${s.name} (Interchange)*` : s.name).join(' ➔ ') + '\n';
      });
      ctx += `   *Note: Old High Court is the central interchange between Blue Line and Red Line.*\n`;
    } catch (e) {}

    ctx += '\n3. AHMEDABAD JANMARG BRTS (Dedicated Signal-Free Corridors, Fares ₹10 - ₹18):\n';
    try {
      const brts = db.prepare('SELECT * FROM brts_routes WHERE city = "Ahmedabad"').all();
      brts.forEach(b => {
        const stops = db.prepare('SELECT name FROM brts_stops WHERE route_id = ? ORDER BY sort_order').all(b.id);
        ctx += `🚌 BRTS Route ${b.route_number} (${b.name}): ${b.from_stop} ↔ ${b.to_stop} (Fare: ₹${b.fare}, Every ${b.frequency_minutes} min)\n`;
        if (stops.length) {
          ctx += `   Stops: ` + stops.map(s => s.name).join(' ➔ ') + '\n';
        }
      });
    } catch (e) {}

    ctx += '\n4. LOCAL AMTS CITY BUSES:\n';
    ctx += `- Route 40/1: Lal Darwaja ↔ Bopal Gam (via Paldi, Nehrunagar, Shivranjani, Iskcon) • ₹5-₹15\n`;
    ctx += `- Route 13/1: Kalupur Railway Station ↔ Gujarat University (via Income Tax, Ashram Road) • ₹5-₹10\n`;
    ctx += `- Route 151: Vadaj Terminus ↔ Sarkhej Roza (via Usmanpura, Paldi, Vasna, APMC) • ₹5-₹15\n`;
    ctx += `- Route 83: Maninagar ↔ RTO Circle (via Geeta Mandir, Kalupur, Subhash Bridge) • ₹5-₹12\n`;

    ctx += '\n5. STATE ROAD TRANSPORT (GSRTC) — INTERCITY FROM AHMEDABAD:\n';
    ctx += `- Geeta Mandir Central Bus Station & Paldi Bus Stand:\n`;
    ctx += `  • Gandhinagar: Every 10 min, ₹30 (Express)\n`;
    ctx += `  • Vadodara: Every 15 min, ₹120 (Express) / ₹190 (Volvo AC)\n`;
    ctx += `  • Surat: Every 20 min, ₹240 (Express) / ₹380 (Volvo AC)\n`;
    ctx += `  • Rajkot: Every 20 min, ₹210 (Express) / ₹340 (Volvo AC)\n`;
    ctx += `  • Bhuj (Kutch) & Saurashtra: Daily departures from Geeta Mandir\n`;

    ctx += '\n6. INDIAN RAILWAYS (TRAINS FROM AHMEDABAD JN / KALUPUR & SABARMATI):\n';
    ctx += `- Kalupur Railway Station (ADI) connects via Metro Blue Line station.\n`;
    ctx += `- Mumbai Central: Vande Bharat (06:10 from Mumbai / 15:30 from ADI), Shatabdi (06:20), Gujarat Mail (21:40)\n`;
    ctx += `- New Delhi: Mumbai-Delhi Rajdhani Express & Superfast trains\n`;

    ctx += '\nAPP & BOOKING RULES:\n';
    ctx += '- CHALO App allows immediate booking of shared auto shuttles at guaranteed fixed ₹8-₹10 fares.\n';
    ctx += '- For long distances, recommend taking CHALO shuttle to the nearest Metro/BRTS station.\n';
    ctx += '- Operating hours: 06:00 AM to 11:00 PM.\n';

    return ctx;
  } catch (err) {
    console.error('Context build error:', err);
    return 'CHALO is a ride-hailing and public transit app in Ahmedabad, India.';
  }
}

// ─── Build travel plan context for a specific navigation query ───
function buildTravelContext(userMessage, userLocation) {
  const msg = userMessage.toLowerCase();
  let from = null, to = null;

  // Patterns
  const fromToMatch = msg.match(/from\s+(.+?)\s+to\s+(.+?)(?:\?|$|\.|\!)/i);
  if (fromToMatch) {
    from = resolvePlace(fromToMatch[1]);
    to = resolvePlace(fromToMatch[2]);
  }

  if (!from || !to) {
    const xToYMatch = msg.match(/(.+?)\s+to\s+(.+?)(?:\?|$|\.|\!)/i);
    if (xToYMatch) {
      from = from || resolvePlace(xToYMatch[1]);
      to = to || resolvePlace(xToYMatch[2]);
    }
  }

  // Hindi pattern: "X se Y kaise jaye" / "X to Y route"
  if (!from || !to) {
    const hindiMatch = msg.match(/(.+?)\s+se\s+(.+?)(?:\s+kaise|\s+jae|\s+jana|\s+route|\?|$|\.|\!)/i);
    if (hindiMatch) {
      from = from || resolvePlace(hindiMatch[1]);
      to = to || resolvePlace(hindiMatch[2]);
    }
  }

  if (!to) {
    const goToMatch = msg.match(/(?:go\s+to|reach|get\s+to|going\s+to|want\s+to\s+go\s+to|take\s+me\s+to|how\s+to\s+reach|how\s+to\s+go\s+to|want\s+to\s+reach|visit|heading\s+to|jana\s+hai|jaana\s+hai|jaaye)\s+(.+?)(?:\?|$|\.|\!)/i);
    if (goToMatch) {
      to = resolvePlace(goToMatch[1]);
    }
  }

  // Direct city mentions (e.g., "mumbai jaana hai")
  if (!to) {
    if (msg.includes('mumbai') || msg.includes('bombay')) to = { name: 'Mumbai Central (MMCT)', lat: 18.9696, lng: 72.8193, type: 'intercity' };
    else if (msg.includes('vadodara') || msg.includes('baroda')) to = { name: 'Vadodara (Central)', lat: 22.3072, lng: 73.1812, type: 'intercity' };
    else if (msg.includes('surat')) to = { name: 'Surat (Central)', lat: 21.1702, lng: 72.8311, type: 'intercity' };
    else if (msg.includes('rajkot')) to = { name: 'Rajkot (Shastri Maidan)', lat: 22.3039, lng: 70.8022, type: 'intercity' };
    else if (msg.includes('delhi')) to = { name: 'New Delhi (NDLS)', lat: 28.6431, lng: 77.2223, type: 'intercity' };
    else if (msg.includes('gandhinagar')) to = { name: 'Gandhinagar (Pathika)', lat: 23.2156, lng: 72.6369, type: 'intercity' };
  }

  // If user didn't specify origin, use actual GPS location or default in Ahmedabad (Navrangpura / Gujarat University)
  if (!from) {
    if (userLocation && userLocation.lat && userLocation.lng) {
      from = {
        name: userLocation.name || 'Your GPS Location (Ahmedabad)',
        lat: userLocation.lat,
        lng: userLocation.lng,
        type: 'user_location'
      };
    } else {
      from = {
        name: 'Your Current Location (near Gujarat University / Navrangpura)',
        lat: 23.0339,
        lng: 72.5467,
        type: 'user_location'
      };
    }
  }

  let travelInfo = '';

  if (to) {
    // Check if this is an outstation journey (Mumbai, Vadodara, Surat, etc.)
    const isOutstation = to.type === 'intercity' || /mumbai|surat|vadodara|delhi|rajkot|gandhinagar|pune|goa|jaipur/i.test(to.name);

    if (isOutstation) {
      const intercityPlans = findIntercityTravelPlans(from, to);
      travelInfo += `\n\n=== OUTSTATION MULTI-LEG NAVIGATION DETECTED ===\n`;
      travelInfo += `Commuter Location: ${from.name} (${from.lat.toFixed(4)}° N, ${from.lng.toFixed(4)}° E)\n`;
      travelInfo += `Target Destination: ${to.name}\n\n`;
      travelInfo += `CRITICAL INSTRUCTION: You MUST explain each option as an independent, coherent 2-stage journey starting directly from the commuter's actual location in Ahmedabad!\n`;
      travelInfo += `Option 1 MUST be the Fastest/Shortest route (⚡ Sabse Tez).\n`;
      travelInfo += `Option 2 MUST be the Cheapest/Budget route (💰 Sabse Sasta).\n`;
      travelInfo += `Option 3 MUST be the Direct Highway Bus route (🚍 Highway Bus).\n`;
      travelInfo += `DO NOT MIX THE OPTIONS TOGETHER! Each option must have its own separate steps and summary!\n\n`;

      intercityPlans.forEach((p, idx) => {
        travelInfo += `### Option ${idx + 1} — ${p.title}\n`;
        if (p.type === 'intercity_multimodal_metro') {
          travelInfo += `  1. Walk 🚶 ${p.localLeg.walkDist} (~${p.localLeg.walkTime}) to "${p.localLeg.station}" 📍\n`;
          travelInfo += `  2. Board 🚇 "${p.localLeg.metroLine}" direct to "${p.localLeg.metroDest}" (Fare: ${p.localLeg.metroFare}, ~${p.localLeg.metroDuration}) 💰\n`;
          travelInfo += `  3. Alight at "Kalupur Railway Station" (Underground direct station exit to railway platforms) 📍\n`;
          travelInfo += `  4. Board 🚄 "${p.intercityLeg.trainName} (#${p.intercityLeg.trainNumber})" to ${p.intercityLeg.toStation} (Fare: ${p.intercityLeg.fare} • Dep: ${p.intercityLeg.departure}, ~${p.intercityLeg.duration}) 💰\n`;
          travelInfo += `  5. Alight at "${p.intercityLeg.toStation}" 📍\n`;
          travelInfo += `  Total fare: ${p.totalFare} | Total walking: ${p.totalWalk}\n\n`;
        } else if (p.type === 'intercity_multimodal_budget_train' || p.type === 'intercity_multimodal_shuttle') {
          travelInfo += `  1. Walk 🚶 ${p.localLeg.walkDist} (~${p.localLeg.walkTime}) to "${p.localLeg.station}" 📍\n`;
          travelInfo += `  2. Board 🚇 "${p.localLeg.metroLine}" (Fare: ${p.localLeg.metroFare}) 💰\n`;
          travelInfo += `  3. Alight at "Kalupur Railway Station" 📍\n`;
          travelInfo += `  4. Board 🚂 "${p.intercityLeg.trainName} (#${p.intercityLeg.trainNumber})" to ${p.intercityLeg.toStation} (Fare: ${p.intercityLeg.fare} • Dep: ${p.intercityLeg.departure}, ~${p.intercityLeg.duration}) 💰\n`;
          travelInfo += `  5. Alight at "${p.intercityLeg.toStation}" 📍\n`;
          travelInfo += `  Total fare: ${p.totalFare} | Total walking: ${p.totalWalk}\n\n`;
        } else {
          travelInfo += `  1. Walk 🚶 ${p.localLeg.walkDist} (~${p.localLeg.walkTime}) to "${p.localLeg.stop}" 📍\n`;
          travelInfo += `  2. Board 🚐 "${p.localLeg.shuttleRoute}" direct to "${p.localLeg.shuttleDest}" (Fare: ${p.localLeg.shuttleFare}) 💰\n`;
          travelInfo += `  3. Alight at "Geeta Mandir Central Bus Station" 📍\n`;
          travelInfo += `  4. Board 🚍 "${p.intercityLeg.operator} ${p.intercityLeg.busType}" to ${p.intercityLeg.toStation} 💰\n`;
          travelInfo += `     • Kahan se milegi (Boarding Hubs in Ahmedabad): Geeta Mandir Central Bus Station (ST Stand, Bay 12-14), Paldi Volvo Hub, or ISCON Cross Road GSRTC Pickup (SG Highway)\n`;
          travelInfo += `     • Exact Bus Fares: ₹${p.intercityLeg.fareSeater} (Volvo AC Seater) | ₹${p.intercityLeg.fareSleeper} (Volvo AC Multi-Axle Sleeper) | ₹380 (Gurjarnagri Express)\n`;
          travelInfo += `     • Departure Timings: ${p.intercityLeg.timings} (~${p.intercityLeg.duration})\n`;
          travelInfo += `  5. Alight at "${p.intercityLeg.toStation}" (Borivali / Mumbai Central) 📍\n`;
          travelInfo += `  Total fare: ${p.totalFare} | Total walking: ${p.totalWalk}\n\n`;
        }
      });

      travelInfo += `Recommendation: Option 1 is fastest via Metro Blue Line and Vande Bharat Express. Option 2 is most budget-friendly with overnight sleeper train. Option 3 is convenient direct highway bus with flexible day/night timings.\n`;
      return travelInfo;
    }

    // Intra-city Route (within Ahmedabad)
    travelInfo += `\n\n=== NAVIGATION QUERY DETECTED ===\n`;
    travelInfo += `Destination: ${to.name} (${to.lat}, ${to.lng}) [Type: ${to.type || 'place'}]\n`;
    travelInfo += `Origin: ${from.name} (${from.lat}, ${from.lng}) [Type: ${from.type || 'place'}]\n`;

    const plans = findTravelPlan(from, to);
    if (plans.length > 0) {
      travelInfo += `\nBEST TRAVEL OPTIONS (Categorized as Shortest/Fastest and Budget/Cheapest):\n`;
      plans.forEach((p, i) => {
        const headerTitle = p.optionLabel || `Option ${i + 1} — ${p.titleTag || p.mode.toUpperCase()}`;
        travelInfo += `\n### ${headerTitle}\n`;

        if (p.type === 'direct') {
          travelInfo += `  1. Walk 🚶 ${p.walkToStop.distance}km (~${p.walkToStop.walkTime}) to "${p.walkToStop.name}" stop 📍\n`;
          travelInfo += `  2. Board 🚐 "${p.boardRoute}" shuttle (Fare: ₹${p.fare}) 💰\n`;
          travelInfo += `  3. Alight at "${p.alightAt.name}" stop 📍\n`;
          if (parseFloat(p.alightAt.distance) > 0.15) {
            travelInfo += `  4. Walk 🚶 ${p.alightAt.distance}km (~${p.alightAt.walkTime}) to destination 📍\n`;
          }
          travelInfo += `  Total fare: ₹${p.fare} | Total walking: ${p.totalWalk}km\n`;
        } else if (p.type === 'metro') {
          travelInfo += `  1. Walk 🚶 ${p.walkToStop.distance}km (~${p.walkToStop.walkTime}) to "${p.walkToStop.name}" 📍\n`;
          travelInfo += `  2. Board 🚇 "${p.boardRoute}" (Fare: ₹${p.fare}) 💰\n`;
          if (p.isInterchange) {
            travelInfo += `  3. Interchange at "${p.interchangeAt}" 🔄\n`;
          }
          travelInfo += `  ${p.isInterchange ? '4' : '3'}. Alight at "${p.alightAt.name}" 📍\n`;
          if (parseFloat(p.alightAt.distance) > 0.15) {
            travelInfo += `  ${p.isInterchange ? '5' : '4'}. Walk 🚶 ${p.alightAt.distance}km (~${p.alightAt.walkTime}) to destination 📍\n`;
          }
          travelInfo += `  Total fare: ₹${p.fare} | Total walking: ${p.totalWalk}km\n`;
        } else if (p.type === 'brts') {
          travelInfo += `  1. Walk 🚶 ${p.walkToStop.distance}km (~${p.walkToStop.walkTime}) to "${p.walkToStop.name}" 📍\n`;
          travelInfo += `  2. Board 🚌 "${p.boardRoute}" (Fare: ₹${p.fare}) 💰\n`;
          travelInfo += `  3. Alight at "${p.alightAt.name}" 📍\n`;
          if (parseFloat(p.alightAt.distance) > 0.15) {
            travelInfo += `  4. Walk 🚶 ${p.alightAt.distance}km (~${p.alightAt.walkTime}) to destination 📍\n`;
          }
          travelInfo += `  Total fare: ₹${p.fare} | Total walking: ${p.totalWalk}km\n`;
        } else {
          // Transfer shuttle
          travelInfo += `  1. Walk 🚶 ${p.walkToStop.distance}km (~${p.walkToStop.walkTime}) to "${p.walkToStop.name}" stop 📍\n`;
          travelInfo += `  2. Board 🚐 "${p.firstRoute}" shuttle (Fare: ₹${p.firstFare}) 💰\n`;
          travelInfo += `  3. Alight at "${p.alightAt}" stop 📍\n`;
          travelInfo += `  4. Walk 🚶 ${p.transferWalk.distance}km (~${p.transferWalk.walkTime}) to "${p.boardAt}" stop 📍\n`;
          travelInfo += `  5. Board 🚐 "${p.secondRoute}" shuttle (Fare: ₹${p.secondFare}) 💰\n`;
          travelInfo += `  6. Alight at "${p.finalStop.name}" stop 📍\n`;
          if (parseFloat(p.finalStop.distance) > 0.15) {
            travelInfo += `  7. Walk 🚶 ${p.finalStop.distance}km (~${p.finalStop.walkTime}) to destination 📍\n`;
          }
          travelInfo += `  Total fare: ₹${p.totalFare} | Total walking: ${p.totalWalk}km\n`;
        }
      });
    } else {
      travelInfo += `\nSuggest the user consider Metro, BRTS, or check nearest stops.\n`;
    }
  }

  return travelInfo;
}

// ─── System prompt ───
const SYSTEM_PROMPT = `You are Bhaya 🚐, the smart multimodal transit navigation assistant for CHALO in Ahmedabad, India.
You know everything about:
1. 🛺 CHALO Shared Auto Shuttles (Guaranteed ₹10 fixed fares, local road corridors)
2. 🚇 Ahmedabad Metro (Blue Line: Vastral Gam ↔ Thaltej Gam | Red Line: APMC ↔ Motera Stadium | Old High Court Interchange | Fares: ₹5-₹25)
3. 🚌 Janmarg BRTS (Corridors: 1D RTO-Maninagar, 2D Anjali-Naroda, 4D Iskcon-Naroda, 8D Science City-Odhav, 12D Bopal-Maninagar | Fares: ₹10-₹18)
4. 🚍 GSRTC State Bus (Geeta Mandir Central, Paldi, Ranip to Gandhinagar, Vadodara, Surat, Rajkot, Mumbai)
5. 🚂 Indian Railways (Ahmedabad Kalupur ADI & Sabarmati to Mumbai, Delhi, Vande Bharat Express)

CRITICAL RULES WHEN SUGGESTING ROUTES:
- DO NOT MIX UP OPTIONS! Each option MUST be completely separate and independent. Do not blend steps or routes between different options.
- ALWAYS categorize your suggestions clearly by commuter priority:
  * Option 1: ⚡ Sabse Short & Tez (Fastest / Shortest Route) — minimum travel time, least delays.
  * Option 2: 💰 Sabse Sasta / Budget Option (Lowest Fare Route) — minimum fare, most economical (e.g. ₹8-₹10 shuttle or sleeper train).
  * Option 3: 🔄 Alternative Route (Alternate Option) — e.g. BRTS corridor, highway bus, or transfer.
- Step formatting in each option MUST use numbered steps:
  1. Walk 🚶 [distance] (~[time]) to "[Stop/Station]" 📍
  2. Board 🚐 / 🚇 / 🚌 / 🚄 "[Route/Line Name]" (Fare: ₹[amount]) 💰
  3. Alight at "[Stop/Station]" 📍
  Total fare: ₹[amount] | Total walking: [distance]
- REALISTIC WALKING ONLY: Never tell users to walk long distances (> 1 km) to a shuttle when other transit is right nearby.
- FOR OUTSTATION/INTERCITY TRAVEL (e.g., Mumbai, Surat, Vadodara, Delhi, Rajkot):
  Users start from Ahmedabad (e.g. Navrangpura / Gujarat University area).
  Always present a complete 2-stage journey:
  Stage 1 (Local Connection): How to reach the departure station/bus terminal (Metro Blue Line direct to Kalupur Railway Station, or CHALO Shuttle to Geeta Mandir/ISCON pickup).
  Stage 2 (Intercity Travel):
    - Option 1 (Fastest): Metro Blue Line ➔ Vande Bharat Express (#20902) or Shatabdi Express.
    - Option 2 (Budget): Metro Blue Line / Local Bus ➔ Gujarat Mail (#12902) Overnight Sleeper train (Fare: ₹365).
    - Option 3 (Direct Highway Bus): CHALO Shuttle / Auto ➔ GSRTC Volvo AC Multi-Axle Sleeper (₹850) / Seater (₹650) / Gurjarnagri (₹380).
      * Always specify: Kahan se milegi (Geeta Mandir ST Stand Bay 12-14, Paldi Volvo Stand, or ISCON Cross Road SG Highway pickup point).
      * Timings: Morning (07:00, 11:00) & Overnight Sleeper (19:30, 21:00, 22:30).
- MULTILINGUAL: Warmly respond in Hindi / Hinglish (or Gujarati / English if user asks in that language).
- ALWAYS CONCLUDE WITH:
  🏆 Bhaya's Recommendation:
  State in 1-2 lines which option is best for saving time (Fastest) vs saving money (Budget/Sasta).`;

// Helper: Call Groq Chat Completions API with a specific model
async function callGroqChat(apiKey, model, messages) {
  return await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: 1500,
      temperature: 0.3
    })
  });
}

// ─── Chat endpoint ───
router.post('/', optionalAuth, async (req, res) => {
  const { message, history, userLocation } = req.body;
  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'Message is required' });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'AI service not configured. Set GROQ_API_KEY in .env.' });
  }

  const primaryModel = process.env.GROQ_MODEL || DEFAULT_MODEL;

  try {
    const baseContext = buildContext();
    const travelContext = buildTravelContext(message, userLocation);
    const fullContext = baseContext + travelContext;

    // Build message history for multi-turn conversation
    const messages = [
      {
        role: 'system',
        content: `${SYSTEM_PROMPT}\n\nCONTEXT DATA:\n${fullContext}`
      }
    ];

    // Include conversation history (up to last 6 messages) for context
    if (history && Array.isArray(history)) {
      const recentHistory = history.slice(-6);
      for (const h of recentHistory) {
        messages.push({
          role: h.isUser ? 'user' : 'assistant',
          content: h.text
        });
      }
    }

    messages.push({ role: 'user', content: message.trim() });

    let response = await callGroqChat(apiKey, primaryModel, messages);

    // If primary model failed (e.g. model unavailable or rate-limited), try fallback model
    if (!response.ok && primaryModel !== FALLBACK_MODEL) {
      console.warn(`Primary model ${primaryModel} failed with ${response.status}. Trying fallback model ${FALLBACK_MODEL}...`);
      response = await callGroqChat(apiKey, FALLBACK_MODEL, messages);
    }

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      console.error('Groq API error:', JSON.stringify(err));
      return res.status(502).json({ error: 'AI service unavailable' });
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.';

    res.json({ reply });
  } catch (err) {
    console.error('Chat error:', err.message);
    res.status(500).json({ error: 'Failed to process your message' });
  }
});

module.exports = router;
