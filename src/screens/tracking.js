// Tracking Screen — Dedicated isolated map + driver details
import { icons } from '../utils/icons.js';
import { router } from '../utils/router.js';
import { locationService } from '../services/location.js';
import { api } from '../api.js';
import { showToast } from '../utils/toast.js';

import { openSafetyModal } from '../components/safetyModal.js';
import { openReviewModal } from '../components/reviewModal.js';

let trackingMap = null;
let trackingAnimId = null;

function cleanup() {
  if (trackingAnimId) cancelAnimationFrame(trackingAnimId);
  trackingAnimId = null;
  if (trackingMap) { trackingMap.remove(); trackingMap = null; }
}

export function createTrackingScreen(params = {}) {
  const { route, driver } = params;
  if (!route || !driver) { router.back(); return null; }

  // Cleanup any previous tracking map
  cleanup();

  const origin = route.stops?.[0];
  const dest = route.stops?.[route.stops.length - 1];
  const co2 = route.co2SavedKg || (route.distance * 0.18).toFixed(1);

  const screen = document.createElement('div');
  screen.className = 'screen map-screen';
  screen.id = 'tracking-screen';

  screen.innerHTML = `
    <div id="tracking-map-container"></div>
    <div class="map-header">
      <button class="btn-profile tracking-back-btn" id="tracking-back" aria-label="Go back">
        <div class="btn-profile-circle" style="padding:0;overflow:hidden;display:flex;align-items:center;justify-content:center;">
          ${icons.arrowLeft}
        </div>
      </button>
      <div style="display:flex;gap:8px;">
        <button class="btn-locate" id="btn-safety-shield" title="Safety Shield & SOS" style="background:#22A147;color:white;font-weight:700;">
          🛡️
        </button>
        <button class="btn-locate" id="tracking-recenter" aria-label="Re-center">
          ${icons.crosshair}
        </button>
      </div>
    </div>
    <div class="bottom-sheet passenger-sheet" id="tracking-sheet">
      <div class="bottom-sheet-handle" id="tracking-sheet-toggle">${icons.chevronDown}</div>
      <div class="bottom-sheet-content" id="tracking-details">
        <div class="tracking-card">
          
          <!-- State Progression Header -->
          <div class="tracking-state-timeline">
            <div class="timeline-step active" id="step-enroute">
              <span class="timeline-dot"></span>
              <span class="timeline-text">En Route</span>
            </div>
            <div class="timeline-line"></div>
            <div class="timeline-step" id="step-arriving">
              <span class="timeline-dot"></span>
              <span class="timeline-text">Arriving</span>
            </div>
            <div class="timeline-line"></div>
            <div class="timeline-step" id="step-boarding">
              <span class="timeline-dot"></span>
              <span class="timeline-text">Board</span>
            </div>
            <div class="timeline-line"></div>
            <div class="timeline-step" id="step-completed">
              <span class="timeline-dot"></span>
              <span class="timeline-text">Destination</span>
            </div>
          </div>

          <div class="tracking-status-badge" id="tracking-status-pill">
            <span class="tracking-status-dot"></span>
            <span id="tracking-status-text">DRIVER EN ROUTE (~3 mins away)</span>
          </div>

          <div class="tracking-driver-row">
            <div class="tracking-driver-avatar">${icons.driverPhoto}</div>
            <div class="tracking-driver-info">
              <div class="tracking-driver-name">${driver.name} <span class="verified-badge" title="Chalo Verified Driver">✓ Verified</span></div>
              <div class="tracking-vehicle-tag">${icons.autoRickshawSmall} ${driver.vehicle_number} • ⭐ ${driver.rating || 4.8}</div>
            </div>
            <button class="btn-call-driver" id="btn-call-driver" title="Call Driver">📞</button>
          </div>

          <div class="tracking-route-strip">
            <div class="tracking-route-stop">
              <div class="tracking-route-dot origin"></div>
              <div class="tracking-route-label">${origin?.name || 'Start'}</div>
            </div>
            <div class="tracking-route-connector"></div>
            <div class="tracking-route-stop">
              <div class="tracking-route-dot dest"></div>
              <div class="tracking-route-label">${dest?.name || 'End'}</div>
            </div>
          </div>

          <div class="tracking-info-grid">
            <div class="tracking-info-item">
              <div class="tracking-info-value">${route.duration || '~15 min'}</div>
              <div class="tracking-info-label">Trip Time</div>
            </div>
            <div class="tracking-info-item">
              <div class="tracking-info-value">₹${route.fare}</div>
              <div class="tracking-info-label">Fixed Fare</div>
            </div>
            <div class="tracking-info-item">
              <div class="tracking-info-value">🌱 ${co2}kg</div>
              <div class="tracking-info-label">CO₂ Saved</div>
            </div>
          </div>

          <!-- Quick Safety & Sharing Actions -->
          <div class="tracking-safety-action-row">
            <button class="btn-safety-pill-action" id="btn-open-sos">
              <span>🆘</span> Emergency SOS
            </button>
            <button class="btn-safety-pill-action" id="btn-open-share">
              <span>📤</span> Share Live Ride
            </button>
          </div>

          <div class="tracking-cta-row">
            <button class="tracking-cancel-btn" id="btn-cancel-tracking">CANCEL</button>
            <button class="btn-demo-complete-trip" id="btn-complete-trip">COMPLETE TRIP (DEMO)</button>
          </div>
        </div>
      </div>
    </div>
  `;

  setTimeout(() => initTrackingMap(screen, route, driver), 100);
  return screen;
}

function initTrackingMap(screen, route, driver) {
  const mapEl = screen.querySelector('#tracking-map-container');
  if (!mapEl || typeof L === 'undefined') return;

  const pos = locationService.getPosition();
  trackingMap = L.map(mapEl, { zoomControl: false, attributionControl: false })
    .setView([pos.lat, pos.lng], 14);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19
  }).addTo(trackingMap);

  // User marker
  const userIcon = L.divIcon({
    className: '',
    html: '<div class="user-marker"><div class="user-marker-pulse"></div><div class="user-marker-dot"></div></div>',
    iconSize: [40, 40], iconAnchor: [20, 20],
  });
  L.marker([pos.lat, pos.lng], { icon: userIcon, zIndexOffset: 1000 }).addTo(trackingMap);

  // Draw ONLY this route
  // Normalize path points: they can be [lat,lng] arrays OR {lat,lng} objects
  const getLat = (p) => Array.isArray(p) ? p[0] : p.lat;
  const getLng = (p) => Array.isArray(p) ? p[1] : p.lng;

  if (route.path && route.path.length >= 2) {
    // Normalize path to [lat, lng] arrays for Leaflet
    const normPath = route.path.map(p => [getLat(p), getLng(p)]);

    const polyline = L.polyline(normPath, {
      color: route.color || '#4285F4', weight: 5, opacity: 0.9, smoothFactor: 1
    }).addTo(trackingMap);

    // Origin marker
    const originIcon = L.divIcon({
      className: '', 
      html: `<div style="width:16px;height:16px;background:#666;border:3px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>`,
      iconSize: [16, 16], iconAnchor: [8, 8],
    });
    L.marker(normPath[0], { icon: originIcon }).addTo(trackingMap);

    // Destination marker
    const destIcon = L.divIcon({
      className: 'dest-marker', html: icons.destPin,
      iconSize: [24, 32], iconAnchor: [12, 32],
    });
    if (route.stops?.length) {
      const last = route.stops[route.stops.length - 1];
      L.marker([last.lat, last.lng], { icon: destIcon }).addTo(trackingMap);
    }

    // THE assigned shuttle — spawns at a realistic mid-route position
    const startOffset = Math.floor(normPath.length * 0.3);
    const shuttleIcon = L.divIcon({
      className: 'auto-marker',
      html: `<div class="tracking-pulse-inner">${icons.autoRickshawSmall}</div>`,
      iconSize: [50, 50], iconAnchor: [25, 25],
    });
    const shuttleMarker = L.marker(normPath[startOffset], { icon: shuttleIcon, zIndexOffset: 1500 }).addTo(trackingMap);

    // Animate the shuttle forward along the remaining path (towards destination)
    let pathIndex = startOffset;
    let lastTime = 0;
    function animateShuttle(time) {
      if (!lastTime) lastTime = time;
      const delta = time - lastTime;
      lastTime = time;

      const floorIdx = Math.floor(pathIndex);
      const ceilIdx = Math.min(floorIdx + 1, normPath.length - 1);
      const p1 = normPath[floorIdx];
      const p2 = normPath[ceilIdx];

      if (p1 && p2) {
        const factor = pathIndex - floorIdx;
        const lat = p1[0] + (p2[0] - p1[0]) * factor;
        const lng = p1[1] + (p2[1] - p1[1]) * factor;
        shuttleMarker.setLatLng([lat, lng]);
      }

      // Move forward slowly; stop at the end of the route (no looping)
      pathIndex += 0.0006 * (delta || 16);
      if (pathIndex >= normPath.length - 1) {
        pathIndex = normPath.length - 1;
        shuttleMarker.setLatLng(normPath[normPath.length - 1]);
        return;
      }

      trackingAnimId = requestAnimationFrame(animateShuttle);
    }
    trackingAnimId = requestAnimationFrame(animateShuttle);

    // Fit map to show the entire route (large bottom padding for sheet)
    trackingMap.fitBounds(polyline.getBounds(), { padding: [80, 60] });
    
    // Force Leaflet to recalculate after DOM is ready
    setTimeout(() => trackingMap.invalidateSize(), 200);
  }

  // Sheet toggle — start collapsed so the route & shuttle are visible
  const sheetToggle = screen.querySelector('#tracking-sheet-toggle');
  const sheet = screen.querySelector('#tracking-sheet');
  if (sheetToggle && sheet) {
    sheet.classList.add('collapsed');
    sheetToggle.innerHTML = icons.chevronUp;
    sheetToggle.addEventListener('click', () => {
      const isCollapsed = sheet.classList.toggle('collapsed');
      sheetToggle.innerHTML = isCollapsed ? icons.chevronUp : icons.chevronDown;
    });
  }

  // Back button
  screen.querySelector('#tracking-back')?.addEventListener('click', () => {
    cleanup();
    router.back();
  });

  // Recenter button
  screen.querySelector('#tracking-recenter')?.addEventListener('click', () => {
    const p = locationService.getPosition();
    trackingMap.flyTo([p.lat, p.lng], 14, { duration: 0.8 });
  });

  // Safety Shield Modal
  const openSafety = () => openSafetyModal({ driver, route });
  screen.querySelector('#btn-safety-shield')?.addEventListener('click', openSafety);
  screen.querySelector('#btn-open-sos')?.addEventListener('click', openSafety);
  screen.querySelector('#btn-open-share')?.addEventListener('click', openSafety);

  // Call Driver Simulation
  screen.querySelector('#btn-call-driver')?.addEventListener('click', () => {
    alert(`📞 Calling ${driver.name} (+91 98765 43210)...\nConnecting secure in-app masked call.`);
  });

  // State Timeline simulation
  const statusPill = screen.querySelector('#tracking-status-text');
  const stepArriving = screen.querySelector('#step-arriving');
  const stepBoarding = screen.querySelector('#step-boarding');
  const stepCompleted = screen.querySelector('#step-completed');

  setTimeout(() => {
    if (statusPill) statusPill.textContent = 'SHUTTLE ARRIVING AT PICKUP (~1 min)';
    if (stepArriving) stepArriving.classList.add('active');
  }, 5000);

  setTimeout(() => {
    if (statusPill) statusPill.textContent = 'BOARD SHUTTLE • Auto at Stop';
    if (stepBoarding) stepBoarding.classList.add('active');
  }, 12000);

  // Complete Trip (Demo trigger for Investor Showcase)
  screen.querySelector('#btn-complete-trip')?.addEventListener('click', () => {
    cleanup();
    if (stepCompleted) stepCompleted.classList.add('active');
    openReviewModal(driver, route, () => {
      router.navigate('map');
    });
  });

  // Cancel request
  screen.querySelector('#btn-cancel-tracking')?.addEventListener('click', () => {
    cleanup();
    showToast('Request cancelled');
    router.navigate('map');
  });
}
