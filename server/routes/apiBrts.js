// BRTS (Janmarg) API Routes
const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/brts/routes — all BRTS routes with stops and pixel-perfect paths
router.get('/routes', (req, res) => {
  try {
    const { type, city } = req.query;
    let routes;
    if (city && city !== 'all' && type) {
      routes = db.prepare('SELECT * FROM brts_routes WHERE LOWER(city) LIKE LOWER(?) AND LOWER(type) = LOWER(?) ORDER BY route_number').all(`%${city}%`, type);
    } else if (city && city !== 'all') {
      routes = db.prepare('SELECT * FROM brts_routes WHERE LOWER(city) LIKE LOWER(?) ORDER BY route_number').all(`%${city}%`);
    } else if (type) {
      routes = db.prepare('SELECT * FROM brts_routes WHERE LOWER(type) = LOWER(?) ORDER BY route_number').all(type);
    } else {
      routes = db.prepare('SELECT * FROM brts_routes ORDER BY route_number').all();
    }

    const stopsStmt = db.prepare('SELECT name, lat, lng, sort_order FROM brts_stops WHERE route_id = ? ORDER BY sort_order');
    const pathStmt = db.prepare('SELECT lat, lng FROM brts_path_points WHERE route_id = ? ORDER BY sort_order');

    routes.forEach(r => {
      r.stops = stopsStmt.all(r.id);
      if (r.polyline) {
        try {
          r.path = JSON.parse(r.polyline);
        } catch (e) {
          r.path = [];
        }
      }
      if (!r.path || !r.path.length) {
        r.path = pathStmt.all(r.id).map(p => [p.lat, p.lng]);
      }
    });

    res.json(routes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/brts/routes/:id — single route with stops and path
router.get('/routes/:id', (req, res) => {
  try {
    const route = db.prepare('SELECT * FROM brts_routes WHERE id = ?').get(req.params.id);
    if (!route) return res.status(404).json({ error: 'Route not found' });
    route.stops = db.prepare('SELECT name, lat, lng, sort_order FROM brts_stops WHERE route_id = ? ORDER BY sort_order').all(route.id);
    if (route.polyline) {
      try {
        route.path = JSON.parse(route.polyline);
      } catch (e) {
        route.path = [];
      }
    }
    if (!route.path || !route.path.length) {
      route.path = db.prepare('SELECT lat, lng FROM brts_path_points WHERE route_id = ? ORDER BY sort_order').all(route.id).map(p => [p.lat, p.lng]);
    }
    res.json(route);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/brts/stops?route=X — stops for a route
router.get('/stops', (req, res) => {
  try {
    const routeId = req.query.route;
    let stops;
    if (routeId) {
      stops = db.prepare('SELECT bs.*, br.route_number, br.name as route_name, br.color FROM brts_stops bs JOIN brts_routes br ON bs.route_id = br.id WHERE bs.route_id = ? ORDER BY bs.sort_order').all(routeId);
    } else {
      stops = db.prepare('SELECT bs.*, br.route_number, br.name as route_name, br.color FROM brts_stops bs JOIN brts_routes br ON bs.route_id = br.id ORDER BY br.route_number, bs.sort_order').all();
    }
    res.json(stops);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
