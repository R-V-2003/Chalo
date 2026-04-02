// Map Screen — API-driven, Frame 2 exact UI
import { icons } from '../utils/icons.js';
import { router } from '../utils/router.js';
import { locationService } from '../services/location.js';
import { api } from '../api.js';
import { createDrawer, openDrawer } from '../components/drawer.js';

let map = null;
let userMarker = null;
let routeLayers = [];
let autoMarkers = [];
let selectedRouteId = null;
let routesData = [];
let miniMapInstances = [];

function clearMiniMaps() {
  miniMapInstances.forEach(m => {
    if (m && m.remove) m.remove();
  });
  miniMapInstances = [];
}


export function createMapScreen(params = {}) {
  const screen = document.createElement('div');
  screen.className = 'screen map-screen';
  screen.id = 'map-screen';

  screen.innerHTML = `
    <div id="map-container"></div>
    <div class="map-header">
      <button class="btn-profile" id="btn-open-drawer" aria-label="Open menu">
        <div class="btn-profile-circle" style="padding:0;overflow:hidden;">${icons.user}</div>
        <span class="btn-profile-label">View profile</span>
      </button>
      <button class="btn-locate" id="btn-recenter" aria-label="Re-center">
        ${icons.crosshair}
      </button>
    </div>
    <div class="bottom-sheet" id="bottom-sheet">
      <div class="bottom-sheet-handle" id="sheet-toggle">${icons.chevronDown}</div>
      <div class="bottom-sheet-content" id="routes-list">
        <div class="map-loading-text" style="text-align:center;padding:20px;">Loading routes...</div>
      </div>
    </div>
    <div class="map-loading" id="map-loading">
      <div class="map-loading-spinner"></div>
      <div class="map-loading-text">Loading map...</div>
    </div>
  `;

  setTimeout(() => initMap(screen, params), 100);
  return screen;
}

async function initMap(screen, params) {
  const mapEl = screen.querySelector('#map-container');
  const loadingEl = screen.querySelector('#map-loading');
  if (!mapEl || typeof L === 'undefined') return;

  const pos = locationService.getPosition();
  map = L.map(mapEl, { zoomControl: false, attributionControl: true })
    .setView([pos.lat, pos.lng], 14);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19, attribution: '© OpenStreetMap'
  }).addTo(map);

  addUserMarker(pos.lat, pos.lng);
  locationService.onUpdate(p => updateUserMarker(p.lat, p.lng));

  // Fetch routes from backend
  try {
    routesData = await api.getRoutes();
    drawRoutes(routesData);
    renderStopsList(screen, routesData);
  } catch (err) {
    console.error('Failed to fetch routes:', err);
    const list = screen.querySelector('#routes-list');
    if (list) list.innerHTML = '<div class="map-loading-text" style="text-align:center;padding:20px;color:#EA4335;">Failed to load routes. Check server.</div>';
  }

  if (loadingEl) {
    loadingEl.style.opacity = '0';
    setTimeout(() => loadingEl.remove(), 300);
  }

  // Events
  screen.querySelector('#btn-open-drawer')?.addEventListener('click', openDrawer);
  screen.querySelector('#btn-recenter')?.addEventListener('click', () => {
    const p = locationService.getPosition();
    map.flyTo([p.lat, p.lng], 14, { duration: 0.8 });
  });

  const sheetToggle = screen.querySelector('#sheet-toggle');
  const bottomSheet = screen.querySelector('#bottom-sheet');
  if (sheetToggle && bottomSheet) {
    sheetToggle.addEventListener('click', () => {
      const isCollapsed = bottomSheet.classList.toggle('collapsed');
      sheetToggle.innerHTML = isCollapsed ? icons.chevronUp : icons.chevronDown;
    });
  }

  // Ensure drawer exists
  if (!document.querySelector('.drawer')) {
    const { overlay, drawer } = createDrawer();
    document.body.appendChild(overlay);
    document.body.appendChild(drawer);
  }

  startAutoAnimation();
}

function addUserMarker(lat, lng) {
  const el = L.divIcon({
    className: '',
    html: '<div class="user-marker"><div class="user-marker-pulse"></div><div class="user-marker-dot"></div></div>',
    iconSize: [40, 40], iconAnchor: [20, 20],
  });
  userMarker = L.marker([lat, lng], { icon: el, zIndexOffset: 1000 }).addTo(map);
}

function updateUserMarker(lat, lng) {
  if (userMarker) userMarker.setLatLng([lat, lng]);
}

function drawRoutes(routes, requestedDriverId = null) {
  // Clear old
  routeLayers.forEach(l => map.removeLayer(l));
  autoMarkers.forEach(({ marker }) => map.removeLayer(marker));
  routeLayers = [];
  autoMarkers = [];

  routes.forEach(route => {
    if (!route.path || route.path.length < 2) return;

    // Polyline
    const polyline = L.polyline(route.path, {
      color: route.color, weight: 4, opacity: 0.8, smoothFactor: 1
    }).addTo(map);
    routeLayers.push(polyline);

    // Destination pin
    const lastStop = route.stops[route.stops.length - 1];
    if (lastStop) {
      const destIcon = L.divIcon({
        className: 'dest-marker', html: icons.destPin,
        iconSize: [24, 32], iconAnchor: [12, 32],
      });
      const dm = L.marker([lastStop.lat, lastStop.lng], { icon: destIcon }).addTo(map);
      routeLayers.push(dm);
    }

    if (requestedDriverId) {
      const autoIcon = L.divIcon({
        className: 'auto-marker tracking-pulse', html: icons.autoRickshawSmall,
        iconSize: [50, 50], iconAnchor: [25, 25],
      });
      const marker = L.marker(route.path[0], { icon: autoIcon, zIndexOffset: 1000 }).addTo(map);
      autoMarkers.push({ marker, pos: { lat: route.path[0][0], lng: route.path[0][1] }, path: null });
    } else {
      // 2 Fake Animated Shuttles per route
      const mid = Math.floor(route.path.length / 2);
      const start = 0;
      const positions = [
        { idx: start, p: route.path[start] },
        { idx: mid, p: route.path[mid] }
      ];

      positions.forEach((posInfo) => {
        if (!posInfo.p) return;
        const autoIcon = L.divIcon({
          className: 'auto-marker active-shuttle', html: icons.autoRickshawSmall,
          iconSize: [36, 36], iconAnchor: [18, 18],
        });
        const marker = L.marker(posInfo.p, { icon: autoIcon, zIndexOffset: 500, interactive: true }).addTo(map);
        
        // Tap map icon to directly book this shuttle!
        marker.on('click', () => {
          router.navigate('trip', { routeId: route.id });
        });

        autoMarkers.push({ 
          marker, 
          path: route.path,
          pathIndex: posInfo.idx
        });
      });
    }
  });
}

// Frame 2 style: show stops from first route, with route cards
function renderStopsList(screen, routes) {
  const list = screen.querySelector('#routes-list');
  const sheet = screen.querySelector('.bottom-sheet');
  if (!list || routes.length === 0) return;
  
  if (sheet) sheet.classList.add('passenger-sheet');
  
  clearMiniMaps();
  list.innerHTML = '';
  drawRoutes(routesData); // Restore full map if previously isolated

  // Route summary cards first
  routes.forEach(route => {
    const card = document.createElement('div');
    card.className = 'route-summary-card';
    card.innerHTML = `
      <div class="mini-map-container" id="mini-map-list-${route.id}"></div>
      <div class="route-summary-title">${route.name}</div>
      <div class="route-summary-fare">₹${route.fare}</div>
      <div class="route-summary-arrow">${icons.chevronRight}</div>
    `;
    card.addEventListener('click', () => {
      if (selectedRouteId === route.id) {
        router.navigate('trip', { routeId: route.id });
      } else {
        selectedRouteId = route.id;
        showExpandedRoute(screen, route, routes);
      }
    });
    list.appendChild(card);

    if (route.path && route.path.length > 1) {
      setTimeout(() => {
        const miniEl = document.getElementById(`mini-map-list-${route.id}`);
        if (!miniEl) return;
        
        const mini = L.map(miniEl, {
          zoomControl: false, dragging: false, touchZoom: false, scrollWheelZoom: false, doubleClickZoom: false, attributionControl: false, boxZoom: false, keyboard: false
        });
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mini);
        const polyline = L.polyline(route.path, { color: route.color || '#4285F4', weight: 4 }).addTo(mini);
        mini.fitBounds(polyline.getBounds(), { padding: [15, 15] });
        miniMapInstances.push(mini);
      }, 50);
    }
  });
}

function showExpandedRoute(screen, route, allRoutes) {
  const list = screen.querySelector('#routes-list');
  const sheet = screen.querySelector('.bottom-sheet');
  if (!list) return;
  
  if (sheet) sheet.classList.add('passenger-sheet');
  clearMiniMaps();
  list.innerHTML = '';

  // Isolate Main Map
  drawRoutes([route]);
  if (map && route.path && route.path.length > 1) {
    map.flyToBounds(L.latLngBounds(route.path), { padding: [60, 60], duration: 0.8 });
  }

  // Generate 2-3 fictional live shuttles
  const mockShuttles = route.stops.slice(0, 3).map((stop, i) => {
    return {
      location: stop.name,
      capacity: Math.max(1, 4 - i),
      distance: (i === 0) ? '800 m' : `${1 + i * 0.5} Km`
    };
  });

  const card = document.createElement('div');
  card.className = 'route-expanded';
  card.innerHTML = `
    <button class="route-back-btn" id="btn-back-routes">
      ${icons.arrowLeft} <span>All Routes</span>
    </button>
    <div class="mini-map-container" id="mini-map-expanded-${route.id}"></div>
    <div class="route-expanded-header">
      <div class="route-summary-title">${route.name}</div>
      <div class="route-summary-fare">₹${route.fare}</div>
    </div>
  `;
  list.appendChild(card);

  card.querySelector('#btn-back-routes')?.addEventListener('click', (e) => {
    e.stopPropagation();
    selectedRouteId = null;
    renderStopsList(screen, allRoutes);
    
    // Zoom back out to fit all routes
    if (map && allRoutes.length > 0) {
      const bounds = L.latLngBounds();
      allRoutes.forEach(r => { if(r.path) r.path.forEach(p => bounds.extend(p)); });
      if (bounds.isValid()) map.flyToBounds(bounds, { padding: [50, 50], duration: 0.8 });
    }
  });

  const shuttlesList = document.createElement('div');
  shuttlesList.className = 'shuttle-list';
  shuttlesList.innerHTML = mockShuttles.map(shuttle => `
    <div class="shuttle-list-item">
      <div class="shuttle-list-icon">
        ${icons.autoRickshawSmall}
      </div>
      <div class="shuttle-list-info">
        <div class="shuttle-list-name">${shuttle.location}</div>
        <div class="shuttle-list-meta">
          ${icons.users}
          <span>${shuttle.capacity}</span>
        </div>
        <div class="shuttle-list-dist">${shuttle.distance}</div>
      </div>
      <div class="chevron-icon">${icons.chevronRight}</div>
    </div>
  `).join('');

  shuttlesList.querySelectorAll('.shuttle-list-item').forEach(el => {
    el.addEventListener('click', () => router.navigate('trip', { routeId: route.id }));
  });
  list.appendChild(shuttlesList);

  // Initialize the specific route mini-map
  if (route.path && route.path.length > 1) {
    setTimeout(() => {
      const miniEl = document.getElementById(`mini-map-expanded-${route.id}`);
      if (!miniEl) return;
      const mini = L.map(miniEl, {
        zoomControl: false, dragging: false, touchZoom: false, scrollWheelZoom: false, doubleClickZoom: false, attributionControl: false, boxZoom: false, keyboard: false
      });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mini);
      const polyline = L.polyline(route.path, { color: route.color || '#4285F4', weight: 4 }).addTo(mini);
      mini.fitBounds(polyline.getBounds(), { padding: [15, 15] });
      miniMapInstances.push(mini);
    }, 50);
  }

  // View all routes button
  const allBtn = document.createElement('div');
  allBtn.className = 'view-all-btn';
  allBtn.innerHTML = `View all routes`;
  allBtn.addEventListener('click', () => {
    selectedRouteId = null;
    renderStopsList(screen, allRoutes);
    const p = locationService.getPosition();
    if (map) map.flyTo([p.lat, p.lng], 14, { duration: 0.8 });
  });
  list.appendChild(allBtn);
}

let animationFrameId = null;
let lastTime = 0;

function startAutoAnimation() {
  if (animationFrameId) cancelAnimationFrame(animationFrameId);

  function animate(time) {
    if (!lastTime) lastTime = time;
    const delta = time - lastTime;
    lastTime = time;

    autoMarkers.forEach(item => {
      if (!item.path || item.path.length < 2) return;
      
      const p1 = item.path[Math.floor(item.pathIndex)];
      const p2 = item.path[Math.ceil(item.pathIndex) % item.path.length];
      
      if (p1 && p2 && p1 !== p2) {
        const factor = item.pathIndex - Math.floor(item.pathIndex);
        const lat = p1[0] + (p2[0] - p1[0]) * factor;
        const lng = p1[1] + (p2[1] - p1[1]) * factor;
        item.marker.setLatLng([lat, lng]);
      } else {
        item.marker.setLatLng(p1);
      }
      
      item.pathIndex += 0.0001 * (delta || 16); 
      if (item.pathIndex >= item.path.length) {
        item.pathIndex = 0;
      }
    });

    animationFrameId = requestAnimationFrame(animate);
  }
  
  animationFrameId = requestAnimationFrame(animate);
}

export function getMap() { return map; }
