const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const db = new Database(path.join(__dirname, '..', 'data', 'chalo.db'));

// Read BRTS_ROUTES_PATHS from brtsRoutesData.js
const code = fs.readFileSync(path.join(__dirname, '..', 'src', 'services', 'brtsRoutesData.js'), 'utf8');
const routes = eval(code.replace('export const BRTS_ROUTES_PATHS =', ''));

console.log('Found', routes.length, 'routes in brtsRoutesData.js');

const insertRoute = db.prepare(`
  INSERT INTO brts_routes (city, system_name, route_number, name, from_stop, to_stop, total_stops, fare, color, frequency_minutes, polyline)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const updateRoute = db.prepare(`
  UPDATE brts_routes 
  SET total_stops = ?, fare = ?, color = ?, polyline = ?, name = ?
  WHERE id = ?
`);

const deleteStops = db.prepare('DELETE FROM brts_stops WHERE route_id = ?');
const insertStop = db.prepare('INSERT INTO brts_stops (route_id, name, lat, lng, sort_order) VALUES (?, ?, ?, ?, ?)');

const deletePath = db.prepare('DELETE FROM brts_path_points WHERE route_id = ?');
const insertPath = db.prepare('INSERT INTO brts_path_points (route_id, lat, lng, sort_order) VALUES (?, ?, ?, ?)');

const syncAll = db.transaction(() => {
  for (const r of routes) {
    let existing = db.prepare("SELECT id FROM brts_routes WHERE route_number = ? AND city = 'Ahmedabad'").get(r.id);
    let routeId;
    const polylineJson = JSON.stringify(r.path || []);
    const fromStop = r.stops[0]?.name || '';
    const toStop = r.stops[r.stops.length - 1]?.name || '';
    const fareNum = parseInt((r.fare || '10').replace(/[^0-9]/g, '')) || 10;

    if (existing) {
      routeId = existing.id;
      updateRoute.run(r.stops.length, fareNum, r.color || '#FF6B00', polylineJson, r.name, routeId);
    } else {
      const res = insertRoute.run('Ahmedabad', 'Janmarg BRTS', r.id, r.name, fromStop, toStop, r.stops.length, fareNum, r.color || '#FF6B00', 4, polylineJson);
      routeId = res.lastInsertRowid;
    }

    // Re-insert stops
    deleteStops.run(routeId);
    r.stops.forEach((s, idx) => {
      insertStop.run(routeId, s.name, s.lat, s.lng, idx);
    });

    // Re-insert path points
    deletePath.run(routeId);
    if (r.path && r.path.length) {
      r.path.forEach((p, idx) => {
        insertPath.run(routeId, p[0], p[1], idx);
      });
    }

    console.log(`Synced ${r.id} (${r.name}): ${r.stops.length} stops, ${r.path?.length || 0} path points in DB.`);
  }
});

syncAll();
console.log('All BRTS routes successfully synced into SQLite database!');
