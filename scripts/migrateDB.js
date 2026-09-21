const Database = require('better-sqlite3');
const path = require('path');
const db = new Database(path.join(__dirname, '..', 'data', 'chalo.db'));

try {
  const cols = db.prepare('PRAGMA table_info(brts_routes)').all().map(c => c.name);
  if (!cols.includes('polyline')) {
    db.exec("ALTER TABLE brts_routes ADD COLUMN polyline TEXT DEFAULT ''");
    console.log('Added polyline column to brts_routes');
  }
} catch (e) {
  console.log('Column check:', e.message);
}

db.exec(`
  CREATE TABLE IF NOT EXISTS brts_path_points (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    route_id INTEGER NOT NULL,
    lat REAL NOT NULL,
    lng REAL NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (route_id) REFERENCES brts_routes(id) ON DELETE CASCADE
  );
`);
console.log('brts_path_points table verified successfully');
