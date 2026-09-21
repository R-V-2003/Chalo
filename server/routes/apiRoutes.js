// Routes API
const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/routes - list all routes
router.get('/', (req, res) => {
  const routes = db.prepare(`
    SELECT r.*, 
      (SELECT COUNT(*) FROM stops WHERE route_id = r.id) as stop_count,
      (SELECT SUM(passengers) FROM stops WHERE route_id = r.id) as total_passengers
    FROM routes r
    ORDER BY r.created_at DESC
  `).all();

  // Attach stops and path to each route
  const stopsStmt = db.prepare('SELECT * FROM stops WHERE route_id = ? ORDER BY sort_order');
  const pathStmt = db.prepare('SELECT lat, lng FROM path_points WHERE route_id = ? ORDER BY sort_order');

  // In-memory / dynamic occupancy & reliability state
  const occupancyMap = global.occupancyMap || (global.occupancyMap = {
    1: { available: 2, total: 4 },
    2: { available: 3, total: 4 },
    3: { available: 1, total: 4 },
    4: { available: 4, total: 4 },
  });

  const reliabilityMap = {
    1: { score: 94, onTimeRate: 92, avgWaitMin: 3.2, frequency: 'Every 5 mins', status: 'High Frequency' },
    2: { score: 88, onTimeRate: 86, avgWaitMin: 4.5, frequency: 'Every 8 mins', status: 'Moderate' },
    3: { score: 96, onTimeRate: 95, avgWaitMin: 2.8, frequency: 'Every 4 mins', status: 'High Frequency' },
    4: { score: 91, onTimeRate: 89, avgWaitMin: 4.0, frequency: 'Every 6 mins', status: 'High Frequency' },
  };

  const result = routes.map(route => {
    const occ = occupancyMap[route.id] || { available: 2, total: 4 };
    const rel = reliabilityMap[route.id] || { score: 90, onTimeRate: 88, avgWaitMin: 4.0, frequency: 'Every 6 mins', status: 'Normal' };
    return {
      ...route,
      stops: stopsStmt.all(route.id),
      path: pathStmt.all(route.id).map(p => [p.lat, p.lng]),
      occupancy: occ,
      reliability: rel,
      smartPickupHint: route.stops && route.stops.length > 0 ? `Walk ~120m to ${route.stops[0].name} to save ₹5 and 4 mins` : null,
      co2SavedKg: (route.distance * 0.18).toFixed(2) // 180g CO2 saved per passenger-km vs private taxi
    };
  });

  res.json(result);
});

// PATCH /api/routes/:id/occupancy - update route seat occupancy (Driver feature)
router.patch('/:id/occupancy', (req, res) => {
  const routeId = parseInt(req.params.id);
  const { available, total } = req.body;
  const occupancyMap = global.occupancyMap || (global.occupancyMap = {});
  occupancyMap[routeId] = {
    available: available !== undefined ? Math.max(0, Math.min(available, total || 4)) : 2,
    total: total || 4
  };
  res.json({ success: true, routeId, occupancy: occupancyMap[routeId] });
});

// GET /api/routes/:id - single route with full data
router.get('/:id', (req, res) => {
  const route = db.prepare('SELECT * FROM routes WHERE id = ?').get(req.params.id);
  if (!route) return res.status(404).json({ error: 'Route not found' });

  const occupancyMap = global.occupancyMap || {};
  const occ = occupancyMap[route.id] || { available: 2, total: 4 };
  const reliabilityMap = {
    1: { score: 94, onTimeRate: 92, avgWaitMin: 3.2, frequency: 'Every 5 mins' },
    2: { score: 88, onTimeRate: 86, avgWaitMin: 4.5, frequency: 'Every 8 mins' },
    3: { score: 96, onTimeRate: 95, avgWaitMin: 2.8, frequency: 'Every 4 mins' },
    4: { score: 91, onTimeRate: 89, avgWaitMin: 4.0, frequency: 'Every 6 mins' },
  };

  route.stops = db.prepare('SELECT * FROM stops WHERE route_id = ? ORDER BY sort_order').all(route.id);
  route.path = db.prepare('SELECT lat, lng FROM path_points WHERE route_id = ? ORDER BY sort_order')
    .all(route.id).map(p => [p.lat, p.lng]);
  route.occupancy = occ;
  route.reliability = reliabilityMap[route.id] || { score: 90, onTimeRate: 88, avgWaitMin: 4.0, frequency: 'Every 6 mins' };
  route.co2SavedKg = (route.distance * 0.18).toFixed(2);

  res.json(route);
});

// POST /api/routes - create new route
router.post('/', (req, res) => {
  const { name, fare, distance, duration, color, stops, path } = req.body;

  if (!name || !stops || stops.length < 2) {
    return res.status(400).json({ error: 'Name and at least 2 stops required' });
  }

  const routeFare = fare || 10;
  const routeDistance = distance || 0;
  const routeDuration = duration || '10 min';
  const routeColor = color || '#4285F4';

  const insertRoute = db.prepare('INSERT INTO routes (name, fare, distance, duration, color) VALUES (?, ?, ?, ?, ?)');
  const insertStop = db.prepare('INSERT INTO stops (route_id, name, lat, lng, passengers, distance_label, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)');
  const insertPath = db.prepare('INSERT INTO path_points (route_id, lat, lng, sort_order) VALUES (?, ?, ?, ?)');

  const create = db.transaction(() => {
    const result = insertRoute.run(name, routeFare, routeDistance, routeDuration, routeColor);
    const routeId = result.lastInsertRowid;

    stops.forEach((stop, i) => {
      insertStop.run(routeId, stop.name, stop.lat, stop.lng, stop.passengers || 0, stop.distance_label || '0 m', i);
    });

    if (path && path.length > 0) {
      path.forEach(([lat, lng], i) => {
        insertPath.run(routeId, lat, lng, i);
      });
    } else {
      // Auto-generate path from stops
      stops.forEach((stop, i) => {
        insertPath.run(routeId, stop.lat, stop.lng, i);
      });
    }

    return routeId;
  });

  try {
    const routeId = create();
    const newRoute = db.prepare('SELECT * FROM routes WHERE id = ?').get(routeId);
    newRoute.stops = db.prepare('SELECT * FROM stops WHERE route_id = ? ORDER BY sort_order').all(routeId);
    newRoute.path = db.prepare('SELECT lat, lng FROM path_points WHERE route_id = ? ORDER BY sort_order')
      .all(routeId).map(p => [p.lat, p.lng]);
    res.status(201).json(newRoute);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/routes/:id
router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM routes WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Route not found' });
  res.json({ success: true });
});

module.exports = router;
