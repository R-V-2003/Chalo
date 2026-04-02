// SQLite Database Setup + Seed Data
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DATA_DIR = path.join(__dirname, '..', 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(path.join(DATA_DIR, 'chalo.db'));

// Enable WAL mode for better perf
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'passenger',
    profile_photo TEXT DEFAULT '',
    active_route_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (active_route_id) REFERENCES routes(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS routes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    fare INTEGER NOT NULL DEFAULT 10,
    distance REAL NOT NULL DEFAULT 0,
    duration TEXT NOT NULL DEFAULT '10 min',
    color TEXT NOT NULL DEFAULT '#4285F4',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS stops (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    route_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    lat REAL NOT NULL,
    lng REAL NOT NULL,
    passengers INTEGER NOT NULL DEFAULT 0,
    distance_label TEXT NOT NULL DEFAULT '0 m',
    sort_order INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS path_points (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    route_id INTEGER NOT NULL,
    lat REAL NOT NULL,
    lng REAL NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS drivers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    vehicle_number TEXT NOT NULL,
    rating REAL NOT NULL DEFAULT 4.0,
    total_rides INTEGER NOT NULL DEFAULT 0,
    profile_photo TEXT DEFAULT '',
    route_id INTEGER,
    FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    driver_id INTEGER NOT NULL,
    rating INTEGER NOT NULL,
    text TEXT DEFAULT '',
    user_name TEXT DEFAULT 'Anonymous',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE CASCADE
  );
`);

// Seed data if tables are empty
  // Force re-seed for this update by checking if we have the new route resolution
  const hasHighRes = db.prepare('SELECT COUNT(*) as c FROM path_points').get().c > 100;
  if (hasHighRes) return;

  console.log('Clearing old data and seeding database with high-resolution Ahmedabad routes...');
  db.exec('DELETE FROM path_points; DELETE FROM stops; DELETE FROM drivers; DELETE FROM routes;');

  const insertRoute = db.prepare('INSERT INTO routes (name, fare, distance, duration, color) VALUES (?, ?, ?, ?, ?)');
  const insertStop = db.prepare('INSERT INTO stops (route_id, name, lat, lng, passengers, distance_label, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)');
  const insertPath = db.prepare('INSERT INTO path_points (route_id, lat, lng, sort_order) VALUES (?, ?, ?, ?, ?)');
  const insertDriver = db.prepare('INSERT INTO drivers (name, vehicle_number, rating, total_rides, profile_photo, route_id) VALUES (?, ?, ?, ?, ?, ?)');
  const insertUser = db.prepare('INSERT INTO users (name, phone, password_hash, role, profile_photo) VALUES (?, ?, ?, ?, ?)');

  const seedRoutes = [
    {
      name: 'Gujarat University to Thaltej', fare: 10, distance: 5.2, duration: '15 min', color: '#4285F4',
      stops: [
        { name: 'Gujarat University', lat: 23.0339, lng: 72.5467, passengers: 3, distance_label: '200 m' },
        { name: 'Gurukul Road', lat: 23.0365, lng: 72.5395, passengers: 1, distance_label: '1.2 km' },
        { name: 'Drive-in Road', lat: 23.0465, lng: 72.5335, passengers: 2, distance_label: '2.5 km' },
        { name: 'Thaltej', lat: 23.0520, lng: 72.5080, passengers: 0, distance_label: '5.2 km' },
      ],
      path: [
        [23.0339, 72.5467], [23.0345, 72.5450], [23.0350, 72.5435], [23.0355, 72.5420], [23.0360, 72.5410], [23.0365, 72.5400],
        [23.0365, 72.5395], [23.0380, 72.5385], [23.0400, 72.5370], [23.0425, 72.5355], [23.0440, 72.5350], [23.0455, 72.5345],
        [23.0465, 72.5335], [23.0475, 72.5315], [23.0490, 72.5270], [23.0500, 72.5220], [23.0510, 72.5150], [23.0515, 72.5110],
        [23.0520, 72.5080]
      ],
      driver: { name: 'Ashok R', vehicleNumber: 'GJ01BX1234', rating: 4.2, totalRides: 1580, profilePhoto: 'https://randomuser.me/api/portraits/men/60.jpg' }
    },
    {
      name: 'Akbarnagar to Satellite Road', fare: 10, distance: 4.8, duration: '12 min', color: '#EA4335',
      stops: [
        { name: 'Akbarnagar', lat: 23.0400, lng: 72.5550, passengers: 2, distance_label: '400 m' },
        { name: 'Memnagar', lat: 23.0420, lng: 72.5480, passengers: 4, distance_label: '1.0 km' },
        { name: 'Vijay Cross Roads', lat: 23.0350, lng: 72.5350, passengers: 1, distance_label: '2.8 km' },
        { name: 'Satellite Road', lat: 23.0260, lng: 72.5140, passengers: 0, distance_label: '4.8 km' },
      ],
      path: [
        [23.0400, 72.5550], [23.0410, 72.5535], [23.0415, 72.5510], [23.0418, 72.5495], [23.0420, 72.5480], [23.0415, 72.5460],
        [23.0400, 72.5420], [23.0385, 72.5395], [23.0370, 72.5380], [23.0360, 72.5365], [23.0350, 72.5350], [23.0335, 72.5320],
        [23.0320, 72.5280], [23.0305, 72.5240], [23.0290, 72.5200], [23.0275, 72.5170], [23.0260, 72.5140]
      ],
      driver: { name: 'Ramesh Patel', vehicleNumber: 'GJ01CK5678', rating: 4.5, totalRides: 2340, profilePhoto: 'https://randomuser.me/api/portraits/men/43.jpg' }
    },
    {
      name: 'Gurukul Metro to Vastrapur', fare: 8, distance: 3.5, duration: '10 min', color: '#34A853',
      stops: [
        { name: 'Gurukul Metro', lat: 23.0370, lng: 72.5400, passengers: 2, distance_label: '800 m' },
        { name: 'Anand Nagar', lat: 23.0340, lng: 72.5330, passengers: 1, distance_label: '1.5 km' },
        { name: 'Vastrapur Lake', lat: 23.0310, lng: 72.5230, passengers: 1, distance_label: '3.0 km' },
        { name: 'Vastrapur', lat: 23.0290, lng: 72.5180, passengers: 0, distance_label: '3.5 km' },
      ],
      path: [
        [23.0370, 72.5400], [23.0362, 72.5385], [23.0355, 72.5370], [23.0348, 72.5350], [23.0340, 72.5330], [23.0335, 72.5310],
        [23.0330, 72.5290], [23.0320, 72.5260], [23.0310, 72.5230], [23.0300, 72.5205], [23.0290, 72.5180]
      ],
      driver: { name: 'Suresh Kumar', vehicleNumber: 'GJ01DL9012', rating: 3.8, totalRides: 890, profilePhoto: 'https://randomuser.me/api/portraits/men/75.jpg' }
    },
    {
      name: 'Paldi to Navrangpura', fare: 12, distance: 4.0, duration: '14 min', color: '#FBBC04',
      stops: [
        { name: 'Paldi', lat: 23.0170, lng: 72.5650, passengers: 3, distance_label: '600 m' },
        { name: 'Income Tax', lat: 23.0220, lng: 72.5620, passengers: 2, distance_label: '1.2 km' },
        { name: 'CG Road', lat: 23.0280, lng: 72.5580, passengers: 1, distance_label: '2.8 km' },
        { name: 'Navrangpura', lat: 23.0330, lng: 72.5560, passengers: 0, distance_label: '4.0 km' },
      ],
      path: [
        [23.0170, 72.5650], [23.0182, 72.5642], [23.0195, 72.5635], [23.0210, 72.5628], [23.0220, 72.5620], [23.0235, 72.5610],
        [23.0250, 72.5600], [23.0265, 72.5590], [23.0280, 72.5580], [23.0292, 72.5575], [23.0305, 72.5570], [23.0318, 72.5565],
        [23.0330, 72.5560]
      ],
      driver: { name: 'Vikram Singh', vehicleNumber: 'GJ01AM3456', rating: 4.7, totalRides: 3200, profilePhoto: 'https://randomuser.me/api/portraits/men/70.jpg' }
    },
    {
      name: 'Ashram Road to SG Highway', fare: 15, distance: 7.5, duration: '20 min', color: '#9C27B0',
      stops: [
        { name: 'Ashram Road', lat: 23.0250, lng: 72.5700, passengers: 4, distance_label: '300 m' },
        { name: 'Stadium', lat: 23.0300, lng: 72.5620, passengers: 2, distance_label: '1.5 km' },
        { name: 'Gujarat University', lat: 23.0339, lng: 72.5562, passengers: 3, distance_label: '3.0 km' },
        { name: 'Bodakdev', lat: 23.0380, lng: 72.5100, passengers: 1, distance_label: '5.5 km' },
        { name: 'SG Highway', lat: 23.0370, lng: 72.4980, passengers: 0, distance_label: '7.5 km' },
      ],
      path: [
        [23.0250, 72.5700], [23.0260, 72.5680], [23.0270, 72.5660], [23.0285, 72.5640], [23.0300, 72.5620], [23.0310, 72.5605],
        [23.0320, 72.5590], [23.0330, 72.5576], [23.0339, 72.5562], [23.0345, 72.5506], [23.0350, 72.5450], [23.0355, 72.5375],
        [23.0360, 72.5300], [23.0370, 72.5200], [23.0380, 72.5100], [23.0375, 72.5040], [23.0370, 72.4980]
      ],
      driver: { name: 'Mehul Shah', vehicleNumber: 'GJ01BN7890', rating: 4.0, totalRides: 1120, profilePhoto: 'https://randomuser.me/api/portraits/men/33.jpg' }
    },
    {
      name: 'Maninagar to Kalupur Station', fare: 10, distance: 5.0, duration: '18 min', color: '#FF5722',
      stops: [
        { name: 'Maninagar', lat: 23.0050, lng: 72.6100, passengers: 5, distance_label: '500 m' },
        { name: 'Kankaria', lat: 23.0080, lng: 72.6020, passengers: 2, distance_label: '1.5 km' },
        { name: 'Jamalpur', lat: 23.0150, lng: 72.5900, passengers: 3, distance_label: '3.0 km' },
        { name: 'Kalupur Station', lat: 23.0230, lng: 72.5830, passengers: 0, distance_label: '5.0 km' },
      ],
      path: [
        [23.0050, 72.6100], [23.0058, 72.6080], [23.0065, 72.6060], [23.0072, 72.6040], [23.0080, 72.6020], [23.0095, 72.5990],
        [23.0110, 72.5960], [23.0130, 72.5930], [23.0150, 72.5900], [23.0170, 72.5880], [23.0190, 72.5860], [23.0210, 72.5845],
        [23.0230, 72.5830]
      ],
      driver: { name: 'Prakash Joshi', vehicleNumber: 'GJ01CP2345', rating: 4.3, totalRides: 1760, profilePhoto: 'https://randomuser.me/api/portraits/men/50.jpg' }
    }
  ];

  const seedAll = db.transaction(() => {
    for (const route of seedRoutes) {
      const result = insertRoute.run(route.name, route.fare, route.distance, route.duration, route.color);
      const routeId = result.lastInsertRowid;

      route.stops.forEach((stop, i) => {
        insertStop.run(routeId, stop.name, stop.lat, stop.lng, stop.passengers, stop.distance_label, i);
      });

      route.path.forEach(([lat, lng], i) => {
        insertPath.run(routeId, lat, lng, i);
      });

      insertDriver.run(route.driver.name, route.driver.vehicleNumber, route.driver.rating, route.driver.totalRides, route.driver.profilePhoto, routeId);
    }
    
    // Seed Demo Users
    insertUser.run('Rahul Passenger', '9876543210', '$2a$10$wT/t.tOfx.O2e/d5r3R/P.Q5x2Y0yH9wI/7lB8PxyfS2jG5.gMzXm', 'passenger', 'https://randomuser.me/api/portraits/men/55.jpg');
    insertUser.run('Ashok Shuttle', '9998887776', '$2a$10$wT/t.tOfx.O2e/d5r3R/P.Q5x2Y0yH9wI/7lB8PxyfS2jG5.gMzXm', 'shuttle', 'https://randomuser.me/api/portraits/men/60.jpg');
  });

  seedAll();
  console.log('Database seeded with', seedRoutes.length, 'routes');
}

seedIfEmpty();

module.exports = db;
