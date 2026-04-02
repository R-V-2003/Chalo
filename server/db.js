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
  const hasHighRes = db.prepare('SELECT COUNT(*) as c FROM path_points').get().c > 300;
  if (hasHighRes) return;

  console.log('Clearing old data and seeding database with ultra-high-resolution Ahmedabad routes...');
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
        [23.0339,72.5467],[23.0338,72.5460],[23.0337,72.5452],[23.0337,72.5446],[23.0339,72.5438],[23.0342,72.5432],[23.0346,72.5428],[23.0351,72.5425],[23.0357,72.5420],[23.0363,72.5415],[23.0367,72.5410],[23.0369,72.5405],[23.0369,72.5400],[23.0368,72.5397],[23.0365,72.5395],[23.0368,72.5392],[23.0372,72.5389],[23.0377,72.5386],[23.0382,72.5383],[23.0388,72.5380],[23.0394,72.5376],[23.0398,72.5374],[23.0402,72.5372],[23.0407,72.5370],[23.0413,72.5367],[23.0418,72.5365],[23.0423,72.5362],[23.0428,72.5360],[23.0433,72.5358],[23.0438,72.5356],[23.0442,72.5354],[23.0447,72.5352],[23.0451,72.5350],[23.0454,72.5348],[23.0457,72.5346],[23.0461,72.5342],[23.0465,72.5335],[23.0468,72.5328],[23.0470,72.5322],[23.0472,72.5316],[23.0474,72.5310],[23.0476,72.5304],[23.0478,72.5298],[23.0480,72.5292],[23.0482,72.5286],[23.0484,72.5280],[23.0486,72.5275],[23.0488,72.5270],[23.0490,72.5264],[23.0492,72.5258],[23.0494,72.5252],[23.0496,72.5246],[23.0498,72.5240],[23.0500,72.5234],[23.0502,72.5228],[23.0504,72.5222],[23.0505,72.5216],[23.0507,72.5210],[23.0508,72.5204],[23.0509,72.5198],[23.0510,72.5192],[23.0510,72.5186],[23.0510,72.5180],[23.0510,72.5174],[23.0510,72.5168],[23.0510,72.5162],[23.0510,72.5156],[23.0510,72.5150],[23.0510,72.5144],[23.0510,72.5138],[23.0510,72.5132],[23.0511,72.5126],[23.0512,72.5120],[23.0513,72.5114],[23.0514,72.5108],[23.0515,72.5102],[23.0516,72.5096],[23.0517,72.5090],[23.0518,72.5085],[23.0520,72.5080]
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
        [23.0400,72.5550],[23.0402,72.5546],[23.0405,72.5542],[23.0408,72.5539],[23.0411,72.5532],[23.0414,72.5522],[23.0416,72.5512],[23.0418,72.5502],[23.0420,72.5492],[23.0420,72.5482],[23.0420,72.5480],[23.0420,72.5475],[23.0419,72.5470],[23.0418,72.5465],[23.0417,72.5460],[23.0415,72.5450],[23.0413,72.5445],[23.0410,72.5440],[23.0407,72.5435],[23.0404,72.5430],[23.0400,72.5420],[23.0396,72.5410],[23.0392,72.5405],[23.0388,72.5400],[23.0384,72.5395],[23.0380,72.5390],[23.0376,72.5385],[23.0372,72.5382],[23.0368,72.5379],[23.0364,72.5375],[23.0360,72.5370],[23.0356,72.5365],[23.0353,72.5360],[23.0350,72.5355],[23.0347,72.5350],[23.0345,72.5345],[23.0343,72.5340],[23.0340,72.5332],[23.0336,72.5322],[23.0332,72.5312],[23.0328,72.5302],[23.0324,72.5292],[23.0320,72.5282],[23.0316,72.5272],[23.0312,72.5262],[23.0308,72.5252],[23.0304,72.5242],[23.0300,72.5232],[23.0296,72.5222],[23.0292,72.5212],[23.0288,72.5202],[23.0284,72.5192],[23.0280,72.5182],[23.0276,72.5172],[23.0272,72.5162],[23.0268,72.5152],[23.0264,72.5142],[23.0260,72.5140]
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
        [23.0370,72.5400],[23.0368,72.5396],[23.0366,72.5392],[23.0364,72.5388],[23.0362,72.5384],[23.0360,72.5380],[23.0358,72.5376],[23.0356,72.5372],[23.0354,72.5368],[23.0352,72.5364],[23.0350,72.5360],[23.0348,72.5356],[23.0346,72.5352],[23.0344,72.5348],[23.0342,72.5344],[23.0340,72.5340],[23.0338,72.5336],[23.0336,72.5332],[23.0334,72.5328],[23.0332,72.5324],[23.0330,72.5320],[23.0328,72.5316],[23.0326,72.5312],[23.0324,72.5308],[23.0322,72.5304],[23.0320,72.5300],[23.0318,72.5296],[23.0316,72.5292],[23.0314,72.5288],[23.0312,72.5284],[23.0310,72.5280],[23.0308,72.5276],[23.0306,72.5272],[23.0304,72.5268],[23.0302,72.5264],[23.0300,72.5260],[23.0298,72.5256],[23.0296,72.5252],[23.0294,72.5248],[23.0292,72.5244],[23.0290,72.5240]
      ],
      driver: { name: 'Suresh Kumar', vehicleNumber: 'GJ01DL9012', rating: 3.8, totalRides: 890, profilePhoto: 'https://randomuser.me/api/portraits/men/75.jpg' }
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
