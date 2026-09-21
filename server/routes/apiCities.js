// Pan-India Cities & Transit Overview API
const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/cities — list all supported cities with transit capability badges
router.get('/', (req, res) => {
  try {
    const cities = db.prepare('SELECT * FROM cities ORDER BY name').all();
    
    // Attach line/route counts for each city
    cities.forEach(c => {
      c.metro_lines_count = db.prepare('SELECT COUNT(*) as cnt FROM metro_lines WHERE LOWER(city) LIKE LOWER(?)').get(`%${c.name}%`)?.cnt || 0;
      c.brts_routes_count = db.prepare('SELECT COUNT(*) as cnt FROM brts_routes WHERE LOWER(city) LIKE LOWER(?)').get(`%${c.name}%`)?.cnt || 0;
      c.suburban_count = db.prepare('SELECT COUNT(*) as cnt FROM suburban_trains WHERE LOWER(city) LIKE LOWER(?)').get(`%${c.name}%`)?.cnt || 0;
      c.state_buses_count = db.prepare('SELECT COUNT(*) as cnt FROM state_bus_routes WHERE LOWER(from_city) LIKE LOWER(?) OR LOWER(state) LIKE LOWER(?)').get(`%${c.name}%`, `%${c.state}%`)?.cnt || 0;
    });

    res.json(cities);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/cities/:id — single city details with full transit summary
router.get('/:id', (req, res) => {
  try {
    const city = db.prepare('SELECT * FROM cities WHERE id = ? OR LOWER(name) = LOWER(?)').get(req.params.id, req.params.id);
    if (!city) return res.status(404).json({ error: 'City not found' });
    
    city.metro_lines = db.prepare('SELECT * FROM metro_lines WHERE LOWER(city) LIKE LOWER(?)').all(`%${city.name}%`);
    city.brts_routes = db.prepare('SELECT * FROM brts_routes WHERE LOWER(city) LIKE LOWER(?)').all(`%${city.name}%`);
    city.suburban_trains = db.prepare('SELECT * FROM suburban_trains WHERE LOWER(city) LIKE LOWER(?)').all(`%${city.name}%`);
    city.state_buses = db.prepare('SELECT * FROM state_bus_routes WHERE LOWER(from_city) LIKE LOWER(?) OR LOWER(state) LIKE LOWER(?)').all(`%${city.name}%`, `%${city.state}%`);

    res.json(city);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
