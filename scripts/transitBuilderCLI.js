#!/usr/bin/env node
/**
 * Transit Route Builder & Database Sync CLI
 * Automates stop searching, road polyline snapping, file generation, and SQLite database storage.
 * 
 * Usage:
 *   node scripts/transitBuilderCLI.js --status
 *   node scripts/transitBuilderCLI.js --sync
 *   node scripts/transitBuilderCLI.js --mode brts --route "4D" --name "BRTS 4D" --stops "Iskcon, Ramdev Nagar, Star Bazaar, Shivranjani"
 */

const fs = require('fs');
const path = require('path');

const API_BASE = 'http://localhost:5000/api';

async function getStatus() {
  console.log('🔍 Fetching Transit Database Status...');
  try {
    const res = await fetch(`${API_BASE}/admin/routes-summary`);
    const data = await res.json();
    console.log('\n=== Janmarg BRTS Routes in Database ===');
    console.table(data.brts.map(r => ({
      ID: r.id,
      Route: r.route_number,
      Name: r.name,
      Stops: `${r.actual_stops}/${r.total_stops}`,
      PathPoints: r.path_points_count,
      City: r.city
    })));

    console.log('\n=== Local Shuttles in Database ===');
    console.table(data.shuttles.map(s => ({
      ID: s.id,
      Name: s.name,
      Fare: `₹${s.fare}`,
      Stops: s.actual_stops,
      PathPoints: s.path_points_count
    })));
  } catch (err) {
    console.error('Error connecting to backend API:', err.message);
  }
}

async function syncToFile() {
  console.log('🔄 Re-syncing database routes to src/services/brtsRoutesData.js...');
  try {
    const res = await fetch(`${API_BASE}/brts/routes?city=Ahmedabad`);
    const routes = await res.json();
    
    const formattedRoutes = routes.map(r => ({
      id: r.route_number,
      name: r.name,
      color: r.color || '#FF6B00',
      number: r.route_number,
      fare: `₹${r.fare || 10}`,
      freq: `Every ${r.frequency_minutes || 4} mins`,
      stops: r.stops,
      path: r.path
    }));

    const targetPath = path.join(__dirname, '..', 'src', 'services', 'brtsRoutesData.js');
    const content = `// Janmarg BRTS Corridors — Road-Snapped Geometry (Auto-Engineered from SQLite DB)\nexport const BRTS_ROUTES_PATHS = ${JSON.stringify(formattedRoutes, null, 2)};\n`;
    fs.writeFileSync(targetPath, content, 'utf8');

    console.log(`✅ Successfully synced ${formattedRoutes.length} routes to ${targetPath}`);
  } catch (err) {
    console.error('Sync Error:', err.message);
  }
}

async function saveRouteToDb(routeData) {
  console.log(`💾 Saving Route '${routeData.name}' to Database and Syncing Files...`);
  try {
    const res = await fetch(`${API_BASE}/admin/save-route`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(routeData)
    });
    const result = await res.json();
    if (result.success) {
      console.log(`✅ ${result.message}`);
      console.log(`   Route ID: ${result.routeId} | Stops: ${result.totalStops} | Path Points: ${result.totalPathPoints}`);
    } else {
      console.error('❌ Server returned error:', result.error);
    }
  } catch (err) {
    console.error('Save Error:', err.message);
  }
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes('--status') || args.length === 0) {
    await getStatus();
  } else if (args.includes('--sync')) {
    await syncToFile();
  } else {
    console.log('Transit Route Builder CLI');
    console.log('Commands:');
    console.log('  --status   View current routes and path counts in SQLite DB');
    console.log('  --sync     Sync DB routes directly into src/services/brtsRoutesData.js');
  }
}

main();
