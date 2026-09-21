// Metro API Routes
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

// GET /api/metro/lines — all metro lines (optionally filtered by city)
router.get('/lines', (req, res) => {
  try {
    const city = req.query.city;
    let lines;
    if (city && city !== 'all') {
      lines = db.prepare('SELECT * FROM metro_lines WHERE LOWER(city) LIKE LOWER(?) ORDER BY id').all(`%${city}%`);
    } else {
      lines = db.prepare('SELECT * FROM metro_lines ORDER BY id').all();
    }
    lines.forEach(line => {
      line.stations = db.prepare('SELECT * FROM metro_stations WHERE line_id = ? ORDER BY sort_order').all(line.id);
      if (line.polyline) {
        try {
          line.path = JSON.parse(line.polyline);
        } catch (e) {
          line.path = [];
        }
      } else {
        line.path = [];
      }
    });
    res.json(lines);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/metro/stations — all stations (optionally filtered by line or city)
router.get('/stations', (req, res) => {
  try {
    const { line: lineId, city } = req.query;
    let stations;
    if (lineId) {
      stations = db.prepare('SELECT ms.*, ml.name as line_name, ml.code as line_code, ml.color as line_color, ml.city, ml.system_name FROM metro_stations ms JOIN metro_lines ml ON ms.line_id = ml.id WHERE ms.line_id = ? ORDER BY ms.sort_order').all(lineId);
    } else if (city && city !== 'all') {
      stations = db.prepare('SELECT ms.*, ml.name as line_name, ml.code as line_code, ml.color as line_color, ml.city, ml.system_name FROM metro_stations ms JOIN metro_lines ml ON ms.line_id = ml.id WHERE LOWER(ml.city) LIKE LOWER(?) ORDER BY ms.line_id, ms.sort_order').all(`%${city}%`);
    } else {
      stations = db.prepare('SELECT ms.*, ml.name as line_name, ml.code as line_code, ml.color as line_color, ml.city, ml.system_name FROM metro_stations ms JOIN metro_lines ml ON ms.line_id = ml.id ORDER BY ms.line_id, ms.sort_order').all();
    }
    res.json(stations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/metro/stations/:id — single station details
router.get('/stations/:id', (req, res) => {
  try {
    const station = db.prepare('SELECT ms.*, ml.name as line_name, ml.code as line_code, ml.color as line_color FROM metro_stations ms JOIN metro_lines ml ON ms.line_id = ml.id WHERE ms.id = ?').get(req.params.id);
    if (!station) return res.status(404).json({ error: 'Station not found' });
    
    // If interchange, get the other line's details
    if (station.is_interchange && station.interchange_line_id) {
      station.interchange_line = db.prepare('SELECT * FROM metro_lines WHERE id = ?').get(station.interchange_line_id);
    }
    
    res.json(station);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/metro/fare?from=X&to=Y — fare between two stations
router.get('/fare', (req, res) => {
  try {
    const { from, to } = req.query;
    if (!from || !to) return res.status(400).json({ error: 'from and to station IDs required' });

    const fromStation = db.prepare('SELECT * FROM metro_stations WHERE id = ?').get(from);
    const toStation = db.prepare('SELECT * FROM metro_stations WHERE id = ?').get(to);
    if (!fromStation || !toStation) return res.status(404).json({ error: 'Station(s) not found' });

    // Calculate number of stations in journey
    let stationCount = 0;
    let interchange = false;
    let interchangeAt = null;

    if (fromStation.line_id === toStation.line_id) {
      // Same line — simple count
      stationCount = Math.abs(fromStation.sort_order - toStation.sort_order);
    } else {
      // Different lines — need interchange at Old High Court
      const interchangeStation = db.prepare('SELECT * FROM metro_stations WHERE line_id = ? AND is_interchange = 1').get(fromStation.line_id);
      const interchangeStation2 = db.prepare('SELECT * FROM metro_stations WHERE line_id = ? AND is_interchange = 1').get(toStation.line_id);
      
      if (interchangeStation && interchangeStation2) {
        stationCount = Math.abs(fromStation.sort_order - interchangeStation.sort_order) + 
                       Math.abs(interchangeStation2.sort_order - toStation.sort_order);
        interchange = true;
        interchangeAt = interchangeStation.name;
      }
    }

    // Distance-based fare slabs (Ahmedabad Metro)
    let fare = 5; // minimum
    if (stationCount <= 3) fare = 5;
    else if (stationCount <= 7) fare = 10;
    else if (stationCount <= 11) fare = 15;
    else if (stationCount <= 15) fare = 20;
    else fare = 25;

    const smartCardFare = Math.round(fare * 0.9 * 10) / 10;

    // Estimate time: ~2.5 min per station + 3 min interchange
    const estimatedMinutes = Math.round(stationCount * 2.5 + (interchange ? 3 : 0));

    res.json({
      from: fromStation,
      to: toStation,
      stationCount,
      fare,
      smartCardFare,
      interchange,
      interchangeAt,
      estimatedMinutes,
      dayPass: 70
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/metro/nearby?lat=X&lng=Y — nearest metro stations
router.get('/nearby', (req, res) => {
  try {
    const lat = parseFloat(req.query.lat);
    const lng = parseFloat(req.query.lng);
    const limit = parseInt(req.query.limit) || 5;
    if (isNaN(lat) || isNaN(lng)) return res.status(400).json({ error: 'lat and lng required' });

    const stations = db.prepare('SELECT ms.*, ml.name as line_name, ml.code as line_code, ml.color as line_color FROM metro_stations ms JOIN metro_lines ml ON ms.line_id = ml.id').all();
    
    const withDistance = stations.map(s => ({
      ...s,
      distance_km: haversine(lat, lng, s.lat, s.lng),
      distance_text: ''
    }));
    
    withDistance.sort((a, b) => a.distance_km - b.distance_km);
    
    // Format distance text
    withDistance.forEach(s => {
      if (s.distance_km < 1) {
        s.distance_text = `${Math.round(s.distance_km * 1000)} m`;
      } else {
        s.distance_text = `${s.distance_km.toFixed(1)} km`;
      }
      // Walking estimate: ~5 km/h
      s.walking_minutes = Math.round((s.distance_km / 5) * 60);
    });

    res.json(withDistance.slice(0, limit));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/metro/route?from=X&to=Y — route planning
router.get('/route', (req, res) => {
  try {
    const { from, to } = req.query;
    if (!from || !to) return res.status(400).json({ error: 'from and to station IDs required' });

    const fromStation = db.prepare('SELECT ms.*, ml.name as line_name, ml.code as line_code, ml.color as line_color FROM metro_stations ms JOIN metro_lines ml ON ms.line_id = ml.id WHERE ms.id = ?').get(from);
    const toStation = db.prepare('SELECT ms.*, ml.name as line_name, ml.code as line_code, ml.color as line_color FROM metro_stations ms JOIN metro_lines ml ON ms.line_id = ml.id WHERE ms.id = ?').get(to);
    if (!fromStation || !toStation) return res.status(404).json({ error: 'Station(s) not found' });

    const segments = [];
    
    if (fromStation.line_id === toStation.line_id) {
      // Same line — direct route
      const minOrder = Math.min(fromStation.sort_order, toStation.sort_order);
      const maxOrder = Math.max(fromStation.sort_order, toStation.sort_order);
      const stopsOnRoute = db.prepare('SELECT ms.*, ml.name as line_name, ml.color as line_color FROM metro_stations ms JOIN metro_lines ml ON ms.line_id = ml.id WHERE ms.line_id = ? AND ms.sort_order >= ? AND ms.sort_order <= ? ORDER BY ms.sort_order').all(fromStation.line_id, minOrder, maxOrder);
      
      if (fromStation.sort_order > toStation.sort_order) stopsOnRoute.reverse();
      
      segments.push({
        line_name: fromStation.line_name,
        line_color: fromStation.line_color,
        direction: toStation.name,
        stations: stopsOnRoute
      });
    } else {
      // Cross-line: from → interchange → to
      const interchangeOnFrom = db.prepare('SELECT ms.*, ml.name as line_name, ml.color as line_color FROM metro_stations ms JOIN metro_lines ml ON ms.line_id = ml.id WHERE ms.line_id = ? AND ms.is_interchange = 1').get(fromStation.line_id);
      const interchangeOnTo = db.prepare('SELECT ms.*, ml.name as line_name, ml.color as line_color FROM metro_stations ms JOIN metro_lines ml ON ms.line_id = ml.id WHERE ms.line_id = ? AND ms.is_interchange = 1').get(toStation.line_id);
      
      if (interchangeOnFrom && interchangeOnTo) {
        // Segment 1: from → interchange
        const min1 = Math.min(fromStation.sort_order, interchangeOnFrom.sort_order);
        const max1 = Math.max(fromStation.sort_order, interchangeOnFrom.sort_order);
        const seg1 = db.prepare('SELECT ms.*, ml.name as line_name, ml.color as line_color FROM metro_stations ms JOIN metro_lines ml ON ms.line_id = ml.id WHERE ms.line_id = ? AND ms.sort_order >= ? AND ms.sort_order <= ? ORDER BY ms.sort_order').all(fromStation.line_id, min1, max1);
        if (fromStation.sort_order > interchangeOnFrom.sort_order) seg1.reverse();
        
        segments.push({
          line_name: fromStation.line_name,
          line_color: fromStation.line_color,
          direction: interchangeOnFrom.name,
          stations: seg1
        });

        // Segment 2: interchange → to
        const min2 = Math.min(interchangeOnTo.sort_order, toStation.sort_order);
        const max2 = Math.max(interchangeOnTo.sort_order, toStation.sort_order);
        const seg2 = db.prepare('SELECT ms.*, ml.name as line_name, ml.color as line_color FROM metro_stations ms JOIN metro_lines ml ON ms.line_id = ml.id WHERE ms.line_id = ? AND ms.sort_order >= ? AND ms.sort_order <= ? ORDER BY ms.sort_order').all(toStation.line_id, min2, max2);
        if (interchangeOnTo.sort_order > toStation.sort_order) seg2.reverse();
        
        segments.push({
          line_name: toStation.line_name,
          line_color: toStation.line_color,
          direction: toStation.name,
          stations: seg2
        });
      }
    }

    // Calculate total stations and fare
    const totalStations = segments.reduce((sum, seg) => sum + seg.stations.length - 1, 0);
    let fare = 5;
    if (totalStations <= 3) fare = 5;
    else if (totalStations <= 7) fare = 10;
    else if (totalStations <= 11) fare = 15;
    else if (totalStations <= 15) fare = 20;
    else fare = 25;

    res.json({
      from: fromStation,
      to: toStation,
      segments,
      totalStations,
      fare,
      smartCardFare: Math.round(fare * 0.9 * 10) / 10,
      estimatedMinutes: Math.round(totalStations * 2.5 + (segments.length > 1 ? 3 : 0)),
      interchange: segments.length > 1
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
