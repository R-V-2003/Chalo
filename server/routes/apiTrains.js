// Train API Routes
const express = require('express');
const router = express.Router();
const db = require('../db');

// Haversine distance helper
function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// GET /api/trains — all trains (optionally filtered by city, type, or origin)
router.get('/', (req, res) => {
  try {
    const { type, city, origin } = req.query;
    let query = 'SELECT * FROM trains WHERE 1=1';
    const params = [];

    if (type) {
      query += ' AND LOWER(type) = LOWER(?)';
      params.push(type);
    }
    if (city && city !== 'all') {
      query += ' AND (LOWER(from_station) LIKE LOWER(?) OR LOWER(to_station) LIKE LOWER(?))';
      params.push(`%${city}%`, `%${city}%`);
    }
    if (origin) {
      query += ' AND LOWER(from_station) LIKE LOWER(?)';
      params.push(`%${origin}%`);
    }

    query += ' ORDER BY departure_time';
    const trains = db.prepare(query).all(...params);
    res.json(trains);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/trains/suburban — local suburban train network (Mumbai, Kolkata, Chennai, Delhi)
router.get('/suburban', (req, res) => {
  try {
    const city = req.query.city;
    let locals;
    if (city && city !== 'all') {
      locals = db.prepare('SELECT * FROM suburban_trains WHERE LOWER(city) LIKE LOWER(?) ORDER BY id').all(`%${city}%`);
    } else {
      locals = db.prepare('SELECT * FROM suburban_trains ORDER BY id').all();
    }
    res.json(locals);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/trains/search?to=X — search trains by destination
router.get('/search', (req, res) => {
  try {
    const { to, from } = req.query;
    if (!to && !from) return res.status(400).json({ error: 'to or from query required' });
    
    let query = 'SELECT * FROM trains WHERE 1=1';
    const params = [];
    if (to) {
      query += ' AND (LOWER(to_station) LIKE LOWER(?) OR LOWER(name) LIKE LOWER(?))';
      params.push(`%${to}%`, `%${to}%`);
    }
    if (from) {
      query += ' AND LOWER(from_station) LIKE LOWER(?)';
      params.push(`%${from}%`);
    }
    query += ' ORDER BY departure_time';

    const trains = db.prepare(query).all(...params);
    res.json(trains);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/trains/nearby?lat=X&lng=Y — nearest railway station
router.get('/nearby', (req, res) => {
  try {
    const lat = parseFloat(req.query.lat);
    const lng = parseFloat(req.query.lng);
    if (isNaN(lat) || isNaN(lng)) return res.status(400).json({ error: 'lat and lng required' });

    const stations = db.prepare('SELECT * FROM railway_stations').all();
    
    const withDistance = stations.map(s => ({
      ...s,
      distance_km: haversine(lat, lng, s.lat, s.lng),
      distance_text: '',
      walking_minutes: 0
    }));
    
    withDistance.sort((a, b) => a.distance_km - b.distance_km);
    
    withDistance.forEach(s => {
      if (s.distance_km < 1) {
        s.distance_text = `${Math.round(s.distance_km * 1000)} m`;
      } else {
        s.distance_text = `${s.distance_km.toFixed(1)} km`;
      }
      s.walking_minutes = Math.round((s.distance_km / 5) * 60);
    });

    // Get trains from nearest station
    const nearest = withDistance[0];
    if (nearest) {
      nearest.trains = db.prepare('SELECT * FROM trains WHERE from_station LIKE ? ORDER BY departure_time LIMIT 10').all(`%${nearest.code}%`);
    }

    res.json(withDistance);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/trains/:id — single train details + schedule
router.get('/:id', (req, res) => {
  try {
    const train = db.prepare('SELECT * FROM trains WHERE id = ?').get(req.params.id);
    if (!train) return res.status(404).json({ error: 'Train not found' });
    
    train.stops = db.prepare('SELECT * FROM train_stops WHERE train_id = ? ORDER BY sort_order').all(train.id);
    
    // Build fare object
    train.fares = {};
    if (train.fare_sleeper > 0) train.fares['Sleeper'] = train.fare_sleeper;
    if (train.fare_3ac > 0) train.fares['3rd AC'] = train.fare_3ac;
    if (train.fare_2ac > 0) train.fares['2nd AC'] = train.fare_2ac;
    if (train.fare_1ac > 0) train.fares['1st AC'] = train.fare_1ac;
    if (train.fare_chair_car > 0) train.fares['Chair Car'] = train.fare_chair_car;
    if (train.fare_exec_chair > 0) train.fares['Exec Chair'] = train.fare_exec_chair;
    
    res.json(train);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/trains/fare/:id — fare for specific train
router.get('/fare/:id', (req, res) => {
  try {
    const train = db.prepare('SELECT * FROM trains WHERE id = ?').get(req.params.id);
    if (!train) return res.status(404).json({ error: 'Train not found' });
    
    const fares = {};
    if (train.fare_sleeper > 0) fares['Sleeper (SL)'] = { fare: train.fare_sleeper, type: 'Non-AC' };
    if (train.fare_3ac > 0) fares['3rd AC (3A)'] = { fare: train.fare_3ac, type: 'AC' };
    if (train.fare_2ac > 0) fares['2nd AC (2A)'] = { fare: train.fare_2ac, type: 'AC' };
    if (train.fare_1ac > 0) fares['1st AC (1A)'] = { fare: train.fare_1ac, type: 'AC' };
    if (train.fare_chair_car > 0) fares['Chair Car (CC)'] = { fare: train.fare_chair_car, type: 'AC' };
    if (train.fare_exec_chair > 0) fares['Executive Chair (EC)'] = { fare: train.fare_exec_chair, type: 'AC' };
    
    res.json({
      train_number: train.train_number,
      name: train.name,
      from: train.from_station,
      to: train.to_station,
      distance_km: train.distance_km,
      fares
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
