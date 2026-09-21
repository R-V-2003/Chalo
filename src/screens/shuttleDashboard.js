// Shuttle Dashboard — Interactive Map Portal for Drivers (Frame 2 Match)
import { icons } from '../utils/icons.js';
import { router } from '../utils/router.js';
import { locationService } from '../services/location.js';
import { api } from '../api.js';
import { storage } from '../utils/storage.js';
import { showToast } from '../utils/toast.js';
import { openDrawer, createDrawer } from '../components/drawer.js';
import { walletService } from '../services/wallet.js';

let driverMap = null;
let driverPosMarker = null;
let mapLayers = [];

export function createShuttleDashboardScreen() {
  const user = storage.get('user');
  if (!user || user.role !== 'shuttle') {
    router.navigate('login');
    return document.createElement('div');
  }

  const screen = document.createElement('div');
  screen.className = 'screen map-screen shuttle-dashboard-screen';
  screen.id = 'shuttle-dashboard';

  const avatarHtml = user.profile_photo 
    ? `<img src="${user.profile_photo}" alt="Driver" style="width:100%;height:100%;object-fit:cover;" />`
    : icons.driverPhoto;

  screen.innerHTML = `
    <div id="shuttle-map-container" style="width:100%;height:100%;z-index:1;"></div>
    
    <div class="map-header">
      <button class="btn-profile" id="driver-drawer-btn" aria-label="Menu" style="flex-direction:row;align-items:center;">
        <div class="btn-profile-circle" style="padding:0;overflow:hidden;display:flex;">${avatarHtml}</div>
        <div style="margin-left:8px;background:white;padding:4px 8px;border-radius:12px;box-shadow:var(--shadow-md);">
          <div style="font-weight:700;font-size:0.9rem;">${user.name.split(' ')[0]}</div>
          <div style="font-size:0.7rem;color:var(--text-sec);font-weight:600;">DRIVER</div>
        </div>
      </button>
      <div style="display:flex;gap:8px;">
        <button class="btn-locate" id="driver-recenter" aria-label="Re-center">${icons.crosshair}</button>
        <button class="btn-locate" id="btn-logout" aria-label="Logout" style="background:#ea4335;">
          <svg style="width:18px;height:18px;color:white;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        </button>
      </div>
    </div>

    <div class="bottom-sheet driver-sheet" id="driver-bottom-sheet">
      <div class="bottom-sheet-handle" id="driver-sheet-toggle">${icons.chevronDown}</div>
      <div class="bottom-sheet-content" id="driver-routes-content">
        <div style="text-align:center;padding:20px;"><div class="map-loading-spinner" style="margin:0 auto;"></div></div>
      </div>
    </div>
  `;

  setTimeout(() => initDriverMap(screen, user), 100);
  return screen;
}

async function initDriverMap(screen, user) {
  const mapEl = screen.querySelector('#shuttle-map-container');
  if (!mapEl || typeof L === 'undefined') return;

  const pos = locationService.getPosition();
  driverMap = L.map(mapEl, { zoomControl: false, attributionControl: false }).setView([pos.lat, pos.lng], 14);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(driverMap);

  // Add the driver's own glowing position dot
  const el = L.divIcon({
    className: '',
    html: '<div class="user-marker"><div class="user-marker-pulse"></div><div class="user-marker-dot" style="background:var(--green-dark);"></div></div>',
    iconSize: [40, 40], iconAnchor: [20, 20],
  });
  driverPosMarker = L.marker([pos.lat, pos.lng], { icon: el, zIndexOffset: 1000 }).addTo(driverMap);
  locationService.onUpdate(p => {
    if (driverPosMarker) driverPosMarker.setLatLng([p.lat, p.lng]);
  });

  // Events
  screen.querySelector('#driver-drawer-btn')?.addEventListener('click', () => {
    openDrawer();
  });

  screen.querySelector('#driver-recenter')?.addEventListener('click', () => {
    const p = locationService.getPosition();
    driverMap.flyTo([p.lat, p.lng], 14, { duration: 0.8 });
  });

  screen.querySelector('#btn-logout')?.addEventListener('click', () => {
    storage.remove('auth_token');
    storage.remove('user');
    window.dispatchEvent(new Event('chalo-auth-change'));
    router.navigate('splash');
  });

  // Ensure drawer exists
  if (!document.querySelector('.drawer')) {
    const { overlay, drawer } = createDrawer();
    document.body.appendChild(overlay);
    document.body.appendChild(drawer);
  }

  const sheet = screen.querySelector('#driver-bottom-sheet');
  const toggle = screen.querySelector('#driver-sheet-toggle');
  toggle?.addEventListener('click', () => {
    const isCollapsed = sheet.classList.toggle('collapsed');
    toggle.innerHTML = isCollapsed ? icons.chevronUp : icons.chevronDown;
  });

  await loadDashboardState(screen, user);
}

async function loadDashboardState(screen, user) {
  const content = screen.querySelector('#driver-routes-content');
  clearMapLayers();

  try {
    // Refresh user context precisely
    const freshUser = await api.getMe();
    storage.set('user', freshUser);
    Object.assign(user, freshUser);

    if (user.active_route_id) {
      const activeRoute = await api.getRoute(user.active_route_id);
      drawActiveRouteOnMap(activeRoute);
      renderActiveTripSheet(content, activeRoute, screen);
    } else {
      const allRoutes = await api.getRoutes();
      drawPreviewPathsOnMap(allRoutes);
      renderOfflineRouteSelection(content, allRoutes, screen);
    }
  } catch (err) {
    console.error('Driver dashboard error:', err);
    content.innerHTML = '<div style="color:red;padding:20px;text-align:center;font-weight:700;">Connection Error</div>';
  }
}

function clearMapLayers() {
  mapLayers.forEach(l => {
    if (driverMap) driverMap.removeLayer(l);
  });
  mapLayers = [];
}

function drawPreviewPathsOnMap(routes) {
  routes.forEach(route => {
    if (!route.path || route.path.length < 2) return;
    const polyline = L.polyline(route.path, {
      color: route.color || '#4285F4', weight: 3, opacity: 0.4, dashArray: '5 5'
    }).addTo(driverMap);
    mapLayers.push(polyline);
  });
}

function drawActiveRouteOnMap(route) {
  if (!route.path || route.path.length < 2) return;

  // Embolden the primary driven line
  const polyline = L.polyline(route.path, {
    color: '#22A147', weight: 6, opacity: 0.9, smoothFactor: 1
  }).addTo(driverMap);
  mapLayers.push(polyline);

  // Demand Heatmap Hotspots
  const demandHotspots = [
    { name: 'Gujarat University', lat: 23.0339, lng: 72.5467, count: 6, intensity: 0.8 },
    { name: 'Drive-in Road Corner', lat: 23.0465, lng: 72.5335, count: 8, intensity: 0.9 },
    { name: 'Vastrapur Lake Circle', lat: 23.0310, lng: 72.5230, count: 5, intensity: 0.7 }
  ];

  demandHotspots.forEach(spot => {
    const heatCircle = L.circle([spot.lat, spot.lng], {
      color: '#EA4335',
      fillColor: '#FF5722',
      fillOpacity: 0.25,
      radius: 260
    }).addTo(driverMap);
    mapLayers.push(heatCircle);

    const heatMarker = L.divIcon({
      className: '',
      html: `
        <div class="driver-heat-chip">
          <span>🔥</span> <strong>${spot.count} Waiting</strong>
        </div>
      `,
      iconSize: [110, 30], iconAnchor: [55, 35]
    });
    const hm = L.marker([spot.lat, spot.lng], { icon: heatMarker, zIndexOffset: 2500 }).addTo(driverMap);
    mapLayers.push(hm);
  });

  // Mark all stops with actual pins
  route.stops.forEach((stop, i) => {
    const stopIcon = L.divIcon({
      className: '',
      html: `<div style="width:24px;height:24px;background:white;border:3px solid var(--green-dark);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800;box-shadow:0 3px 6px rgba(0,0,0,0.2);">${i+1}</div>`,
      iconSize: [24,24], iconAnchor: [12,12]
    });
    const stopMarker = L.marker([stop.lat, stop.lng], { icon: stopIcon }).addTo(driverMap);
    mapLayers.push(stopMarker);
  });

  // Recenter map exactly onto this journey
  driverMap.flyToBounds(polyline.getBounds(), { padding: [40, 40], duration: 1.2 });

  // SPAWN MOCKED ACTIVE PASSENGERS ON THIS ROUTE!
  spawnMockPassengers(route.path);
}

function spawnMockPassengers(pathCoordinates) {
  if (!pathCoordinates || pathCoordinates.length < 5) return;
  const numPassengers = Math.floor(Math.random() * 3) + 2;

  for (let i = 0; i < numPassengers; i++) {
    const randomIdx = Math.floor(Math.random() * (pathCoordinates.length - 2)) + 1;
    let [lat, lng] = pathCoordinates[randomIdx];
    lat += (Math.random() - 0.5) * 0.0004;
    lng += (Math.random() - 0.5) * 0.0004;

    const passengerIcon = L.divIcon({
      className: '',
      html: `
        <div style="width:40px;height:40px;background:var(--white);border-radius:50%;box-shadow:var(--shadow-md);border:2px solid var(--yellow-cta);overflow:hidden;animation: bounce 2s infinite ease-in-out;">
          ${icons.illustrationPassenger}
        </div>
      `,
      iconSize: [40, 40], iconAnchor: [20, 40]
    });
    
    const pm = L.marker([lat, lng], { icon: passengerIcon, zIndexOffset: 2000 }).addTo(driverMap);
    mapLayers.push(pm);
  }

  if (!document.getElementById('passenger-bounce-style')) {
    const style = document.createElement('style');
    style.id = 'passenger-bounce-style';
    style.innerHTML = `@keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); }}`;
    document.head.appendChild(style);
  }
}

function renderOfflineRouteSelection(container, routes, screen) {
  const walletColl = parseInt(sessionStorage.getItem('chalo_driver_wallet_coll') || '0', 10);
  const totalShift = 612 + walletColl;

  container.innerHTML = `
    <div style="margin-bottom:20px;padding:8px 8px 0;">
      <div class="driver-heat-banner">
        <span>🔥 LIVE DEMAND HEATMAP</span>
        <strong>34 Commuters currently waiting across Ahmedabad corridors</strong>
      </div>
      <h2 style="font-size:1.6rem;font-weight:900;color:var(--text);letter-spacing:-0.5px;margin-top:12px;">Ready to drive?</h2>
      <p style="color:var(--text-sec);font-size:0.95rem;margin-top:4px;font-weight:500;">Select a corridor to start matching with high-demand passenger clusters.</p>
    </div>

    <div style="display:flex;gap:8px;margin-bottom:12px;background:var(--bg);padding:12px;border-radius:14px;">
      <div style="flex:1;text-align:center;">
        <div style="font-size:0.75rem;color:var(--text-sec);font-weight:700;">TODAY'S SHIFT</div>
        <div style="font-size:1.2rem;font-weight:900;color:var(--green-dark);">₹${totalShift}</div>
      </div>
      <div style="width:1px;background:var(--border);"></div>
      <div style="flex:1;text-align:center;">
        <div style="font-size:0.75rem;color:var(--text-sec);font-weight:700;">TRIPS DONE</div>
        <div style="font-size:1.2rem;font-weight:900;color:var(--text);">${18 + Math.floor(walletColl / 10)} Rides</div>
      </div>
      <div style="width:1px;background:var(--border);"></div>
      <div style="flex:1;text-align:center;">
        <div style="font-size:0.75rem;color:var(--text-sec);font-weight:700;">DIRECT WALLET</div>
        <div style="font-size:1.2rem;font-weight:900;color:#F59E0B;">₹${walletColl}</div>
      </div>
    </div>

    ${walletColl > 0 ? `
      <div style="margin-bottom:14px;background:rgba(251,191,36,0.12);border:1.5px solid rgba(251,191,36,0.4);border-radius:12px;padding:10px 14px;display:flex;align-items:center;justify-content:space-between;">
        <div style="display:flex;align-items:center;gap:8px;">
          <span style="font-size:1.2rem;">⚡</span>
          <div>
            <div style="font-weight:800;font-size:0.85rem;color:var(--text);">Direct CHALO Wallet Settlement</div>
            <div style="font-size:0.75rem;color:var(--text-sec);">Instant auto bank credit • 0% fee • 0 network lag</div>
          </div>
        </div>
        <div style="font-weight:900;font-size:1.1rem;color:#F59E0B;">+₹${walletColl}</div>
      </div>
    ` : ''}

    <div style="font-size:0.8rem;font-weight:800;color:var(--text);text-transform:uppercase;margin-bottom:12px;padding:0 8px;letter-spacing:1px;opacity:0.7;">Active Corridors</div>
    <div style="display:flex;flex-direction:column;gap:12px;padding-bottom:16px;">
      ${routes.map(r => `
        <div class="stop-card" style="border:none;background:var(--white);box-shadow:var(--shadow-sm);border-left:6px solid ${r.color||'var(--yellow)'};padding:16px;">
          <div class="stop-card-info">
            <div style="font-weight:800;font-size:1.1rem;color:var(--text);line-height:1.2;margin-bottom:4px;">${r.name}</div>
            <div style="display:flex;gap:14px;font-size:0.85rem;color:var(--text-sec);font-weight:600;">
              <span>${r.stop_count} Stops</span>
              <span>₹${r.fare} Fare</span>
              <span style="color:var(--green-dark);">⭐ 94% Demand</span>
            </div>
          </div>
          <button class="start-route-btn" data-id="${r.id}" style="background:var(--green-dark);color:white;padding:12px 24px;border-radius:16px;font-weight:800;font-size:0.95rem;box-shadow:var(--shadow-sm);transition:transform 150ms;">
            START
          </button>
        </div>
      `).join('')}
    </div>
  `;

  container.querySelectorAll('.start-route-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const routeId = parseInt(btn.dataset.id);
      btn.style.transform = 'scale(0.95)';
      btn.textContent = '...';
      try {
        await api.setShuttleRoute(routeId);
        showToast('You are now active online! 🛺');
        loadDashboardState(screen, storage.get('user'));
      } catch (err) {
        showToast('Failed to assign route');
        btn.textContent = 'START';
        btn.style.transform = 'scale(1)';
      }
    });
  });
}

function renderActiveTripSheet(container, route, screen) {
  let currentSeats = 2;
  const walletColl = parseInt(sessionStorage.getItem('chalo_driver_wallet_coll') || '0', 10);

  container.innerHTML = `
    <div style="background:var(--white);border-radius:var(--r-lg);padding:20px;box-shadow:var(--shadow-md);display:flex;flex-direction:column;gap:16px;">
      
      <div style="display:flex;justify-content:space-between;align-items:flex-start;">
        <div>
          <div style="display:inline-block;padding:4px 10px;background:rgba(34,161,71,0.1);color:var(--green-dark);border-radius:8px;font-weight:900;font-size:0.75rem;letter-spacing:1px;margin-bottom:8px;text-transform:uppercase;">
            ● ON-DUTY ACTIVE
          </div>
          <div style="font-size:1.3rem;font-weight:900;color:var(--text);line-height:1.2;">${route.name}</div>
        </div>
        <div style="text-align:right;background:var(--bg);padding:8px 12px;border-radius:var(--r-md);border:1px solid var(--border);">
          <div style="font-size:0.7rem;font-weight:800;color:var(--text-sec);text-transform:uppercase;">Fare</div>
          <div style="font-weight:900;font-size:1.4rem;color:var(--green-darker);">₹${route.fare}</div>
        </div>
      </div>

      <!-- Direct Wallet Passenger Credit Alert -->
      <div style="background:rgba(251,191,36,0.1);border:1.5px solid rgba(251,191,36,0.3);border-radius:12px;padding:10px 14px;display:flex;align-items:center;justify-content:space-between;">
        <div style="display:flex;align-items:center;gap:8px;">
          <span style="font-size:1.2rem;">⚡</span>
          <div>
            <div style="font-weight:800;font-size:0.85rem;color:var(--text);">Direct Wallet Fast-Pass Active</div>
            <div style="font-size:0.72rem;color:var(--text-sec);">Zero UPI lag • Instant driver shift credits</div>
          </div>
        </div>
        <div style="font-weight:900;font-size:1.1rem;color:#F59E0B;">+₹${walletColl}</div>
      </div>

      <!-- Live Seat Occupancy Adjuster -->
      <div class="driver-seat-box">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
          <span style="font-size:0.8rem;font-weight:800;color:var(--text);text-transform:uppercase;">Available Seats</span>
          <span id="driver-seat-label" style="font-weight:800;color:var(--green-dark);font-size:0.9rem;">🟢 2 Seats Free</span>
        </div>
        <div class="seat-selector-row">
          ${[0, 1, 2, 3, 4].map(s => `
            <button class="seat-select-btn ${s === 2 ? 'active' : ''}" data-seats="${s}">
              ${s === 0 ? 'Full' : `${s} Free`}
            </button>
          `).join('')}
        </div>
      </div>

      <!-- AI Demand Alert -->
      <div class="ai-demand-alert">
        <span class="ai-alert-icon">⚡</span>
        <div>
          <strong>AI Corridor Tip:</strong> 3 passengers waiting near Drive-in Road corner. Expected ₹30 extra revenue on this trip.
        </div>
      </div>

      <button id="end-trip-btn" style="width:100%;padding:16px;background:#EA4335;color:white;font-weight:900;font-size:1rem;border-radius:var(--r-xl);box-shadow:0 6px 20px rgba(234,67,53,0.25);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:10px;">
        <svg style="width:20px;height:20px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/></svg>
        END TRIP / GO OFFLINE
      </button>
    </div>
  `;

  // Seat Selector Click
  container.querySelectorAll('.seat-select-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      container.querySelectorAll('.seat-select-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const seats = parseInt(btn.dataset.seats);
      const label = container.querySelector('#driver-seat-label');
      if (label) {
        label.textContent = seats === 0 ? '🔴 Auto Full' : `🟢 ${seats} Seats Free`;
      }
      try {
        await api.updateOccupancy(route.id, seats, 4);
        showToast(`Seat capacity updated: ${seats === 0 ? 'Full' : `${seats} Available`}`);
      } catch (err) {
        showToast('Updated seat status');
      }
    });
  });

  document.getElementById('end-trip-btn')?.addEventListener('click', async (e) => {
    e.target.textContent = 'ENDING...';
    try {
      await api.setShuttleRoute(null);
      showToast('You are safely offline.');
      loadDashboardState(screen, storage.get('user'));
    } catch (err) {
      showToast('Failed to end trip');
      e.target.textContent = 'END TRIP / GO OFFLINE';
    }
  });
}
