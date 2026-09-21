// Admin & Automation Route Builder API
const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const db = require('../db');

// POST /api/admin/save-route — Save precision engineered route to DB and sync files
router.post('/save-route', (req, res) => {
  try {
    const {
      mode = 'brts',
      routeId,
      routeNumber,
      name,
      color = '#FF6B00',
      fare = 10,
      city = 'Ahmedabad',
      stops = [],
      path: pathCoords = []
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Route name is required' });
    }
    if (!stops.length) {
      return res.status(400).json({ error: 'At least one stop is required' });
    }

    const polylineJson = JSON.stringify(pathCoords);
    const fromStop = stops[0]?.name || '';
    const toStop = stops[stops.length - 1]?.name || '';
    let savedRouteId = routeId;

    if (mode === 'brts') {
      const saveBrtsTransaction = db.transaction(() => {
        let existing = null;
        if (routeId) {
          existing = db.prepare('SELECT id FROM brts_routes WHERE id = ?').get(routeId);
        }
        if (!existing && routeNumber) {
          existing = db.prepare('SELECT id FROM brts_routes WHERE route_number = ? AND city = ?').get(routeNumber, city);
        }

        if (existing) {
          savedRouteId = existing.id;
          db.prepare(`
            UPDATE brts_routes 
            SET name = ?, route_number = ?, from_stop = ?, to_stop = ?, total_stops = ?, fare = ?, color = ?, polyline = ?
            WHERE id = ?
          `).run(name, routeNumber || existing.route_number || 'BRTS', fromStop, toStop, stops.length, fare, color, polylineJson, savedRouteId);
        } else {
          const insertRes = db.prepare(`
            INSERT INTO brts_routes (city, system_name, route_number, name, from_stop, to_stop, total_stops, fare, color, frequency_minutes, polyline)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(city, 'Janmarg BRTS', routeNumber || 'BRTS', name, fromStop, toStop, stops.length, fare, color, 5, polylineJson);
          savedRouteId = insertRes.lastInsertRowid;
        }

        // Sync stops
        db.prepare('DELETE FROM brts_stops WHERE route_id = ?').run(savedRouteId);
        const insertStop = db.prepare('INSERT INTO brts_stops (route_id, name, lat, lng, sort_order) VALUES (?, ?, ?, ?, ?)');
        stops.forEach((s, i) => {
          insertStop.run(savedRouteId, s.name, s.lat, s.lng, i);
        });

        // Sync path points
        db.prepare('DELETE FROM brts_path_points WHERE route_id = ?').run(savedRouteId);
        const insertPath = db.prepare('INSERT INTO brts_path_points (route_id, lat, lng, sort_order) VALUES (?, ?, ?, ?)');
        pathCoords.forEach((p, i) => {
          insertPath.run(savedRouteId, p[0], p[1], i);
        });
      });

      saveBrtsTransaction();

      // Automatically re-generate src/services/brtsRoutesData.js
      syncBrtsRoutesDataFile();
    } else if (mode === 'shuttle') {
      const saveShuttleTransaction = db.transaction(() => {
        let existing = routeId ? db.prepare('SELECT id FROM routes WHERE id = ?').get(routeId) : null;
        if (existing) {
          savedRouteId = existing.id;
          db.prepare('UPDATE routes SET name = ?, fare = ?, color = ? WHERE id = ?').run(name, fare, color, savedRouteId);
        } else {
          const res = db.prepare('INSERT INTO routes (name, fare, distance, duration, color) VALUES (?, ?, ?, ?, ?)')
            .run(name, fare, 5.0, '15 min', color);
          savedRouteId = res.lastInsertRowid;
        }

        db.prepare('DELETE FROM stops WHERE route_id = ?').run(savedRouteId);
        const insertStop = db.prepare('INSERT INTO stops (route_id, name, lat, lng, passengers, distance_label, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)');
        stops.forEach((s, i) => {
          insertStop.run(savedRouteId, s.name, s.lat, s.lng, s.passengers || 0, s.distance_label || `${(i * 1.2).toFixed(1)} km`, i);
        });

        db.prepare('DELETE FROM path_points WHERE route_id = ?').run(savedRouteId);
        const insertPath = db.prepare('INSERT INTO path_points (route_id, lat, lng, sort_order) VALUES (?, ?, ?, ?)');
        pathCoords.forEach((p, i) => {
          insertPath.run(savedRouteId, p[0], p[1], i);
        });
      });

      saveShuttleTransaction();
    }

    res.json({
      success: true,
      message: `Route '${name}' successfully saved to SQLite database and file synced.`,
      routeId: savedRouteId,
      mode,
      totalStops: stops.length,
      totalPathPoints: pathCoords.length
    });
  } catch (err) {
    console.error('Save Route Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/routes-summary — View summary of all routes in DB
router.get('/routes-summary', (req, res) => {
  try {
    const brts = db.prepare(`
      SELECT r.id, r.route_number, r.name, r.city, r.total_stops, 
             COUNT(DISTINCT s.id) as actual_stops, 
             COUNT(DISTINCT p.id) as path_points_count
      FROM brts_routes r
      LEFT JOIN brts_stops s ON r.id = s.route_id
      LEFT JOIN brts_path_points p ON r.id = p.route_id
      GROUP BY r.id
      ORDER BY r.route_number
    `).all();

    const shuttles = db.prepare(`
      SELECT r.id, r.name, r.fare, 
             COUNT(DISTINCT s.id) as actual_stops, 
             COUNT(DISTINCT p.id) as path_points_count
      FROM routes r
      LEFT JOIN stops s ON r.id = s.route_id
      LEFT JOIN path_points p ON r.id = p.route_id
      GROUP BY r.id
    `).all();

    res.json({ brts, shuttles });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function syncBrtsRoutesDataFile() {
  try {
    const routes = db.prepare('SELECT * FROM brts_routes WHERE city = ? ORDER BY route_number').all('Ahmedabad');
    const stopsStmt = db.prepare('SELECT name, lat, lng FROM brts_stops WHERE route_id = ? ORDER BY sort_order');
    const pathStmt = db.prepare('SELECT lat, lng FROM brts_path_points WHERE route_id = ? ORDER BY sort_order');

    const formattedRoutes = routes.map(r => {
      const stops = stopsStmt.all(r.id);
      let pathCoords = [];
      if (r.polyline) {
        try { pathCoords = JSON.parse(r.polyline); } catch (e) {}
      }
      if (!pathCoords || !pathCoords.length) {
        pathCoords = pathStmt.all(r.id).map(p => [p.lat, p.lng]);
      }

      return {
        id: r.route_number,
        name: r.name,
        color: r.color || '#FF6B00',
        number: r.route_number,
        fare: `₹${r.fare || 10}`,
        freq: `Every ${r.frequency_minutes || 4} mins`,
        stops,
        path: pathCoords
      };
    });

    const targetPath = path.join(__dirname, '..', '..', 'src', 'services', 'brtsRoutesData.js');
    const content = `// Janmarg BRTS Corridors — Road-Snapped Geometry (Auto-Engineered from SQLite DB)\nexport const BRTS_ROUTES_PATHS = ${JSON.stringify(formattedRoutes, null, 2)};\n`;
    fs.writeFileSync(targetPath, content, 'utf8');

    // Also write to data/routes/brts_routes.json
    const jsonDir = path.join(__dirname, '..', '..', 'data', 'routes');
    if (!fs.existsSync(jsonDir)) fs.mkdirSync(jsonDir, { recursive: true });
    fs.writeFileSync(path.join(jsonDir, 'brts_routes.json'), JSON.stringify(formattedRoutes, null, 2), 'utf8');

    console.log(`[AutoSync] brtsRoutesData.js updated with ${formattedRoutes.length} routes from DB.`);
  } catch (e) {
    console.error('Error syncing brtsRoutesData.js file:', e.message);
  }
}

module.exports = router;
