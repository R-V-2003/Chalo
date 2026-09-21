// Pan-India State Road Transport Corporations (SRTC) API Routes
const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/gsrtc/routes — all state bus routes with search by state/operator/city/destination
router.get('/routes', (req, res) => {
  try {
    const { to, type, state, operator, city } = req.query;
    let query = 'SELECT * FROM state_bus_routes WHERE 1=1';
    const params = [];

    if (operator && operator !== 'all') {
      query += ' AND LOWER(operator) = LOWER(?)';
      params.push(operator);
    }
    if (state && state !== 'all') {
      query += ' AND LOWER(state) LIKE LOWER(?)';
      params.push(`%${state}%`);
    }
    if (city && city !== 'all') {
      query += ' AND (LOWER(from_city) LIKE LOWER(?) OR LOWER(to_city) LIKE LOWER(?))';
      params.push(`%${city}%`, `%${city}%`);
    }
    if (to) {
      query += ' AND (LOWER(to_city) LIKE LOWER(?) OR LOWER(via) LIKE LOWER(?))';
      params.push(`%${to}%`, `%${to}%`);
    }
    if (type) {
      query += ' AND LOWER(bus_type) LIKE LOWER(?)';
      params.push(`%${type}%`);
    }

    query += ' ORDER BY departure_time';
    let routes = db.prepare(query).all(...params);
    
    // Fallback to gsrtc_routes if empty and looking for Ahmedabad
    if (routes.length === 0 && (!city || city.toLowerCase().includes('ahmedabad'))) {
      routes = db.prepare('SELECT * FROM gsrtc_routes ORDER BY departure_time').all();
    }

    res.json(routes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/gsrtc/bus-stands — list of bus stands
router.get('/bus-stands', (req, res) => {
  try {
    const city = req.query.city;
    let stands;
    if (city) {
      stands = db.prepare('SELECT * FROM gsrtc_bus_stands WHERE LOWER(city) LIKE LOWER(?) ORDER BY id').all(`%${city}%`);
    } else {
      stands = db.prepare('SELECT * FROM gsrtc_bus_stands ORDER BY id').all();
    }
    res.json(stands);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/gsrtc/operators — list of state transport operators
router.get('/operators', (req, res) => {
  try {
    const operators = db.prepare('SELECT DISTINCT operator, state FROM state_bus_routes ORDER BY operator').all();
    res.json(operators);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/gsrtc/routes/:id — single route details
router.get('/routes/:id', (req, res) => {
  try {
    let route = db.prepare('SELECT * FROM state_bus_routes WHERE id = ?').get(req.params.id);
    if (!route) {
      route = db.prepare('SELECT * FROM gsrtc_routes WHERE id = ?').get(req.params.id);
    }
    if (!route) return res.status(404).json({ error: 'Route not found' });
    res.json(route);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
