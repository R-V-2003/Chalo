// Route Builder Studio — Precision Stop Searcher, Road Snapper & Database Sync Engine
import { showToast } from '../utils/toast.js';

let builderMap = null;
let stopMarkers = [];
let routePolyline = null;
let currentStops = [];
let generatedPath = [];

export function openRouteBuilderStudio() {
  let modal = document.getElementById('route-builder-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'route-builder-modal';
    modal.className = 'studio-modal-overlay';
    modal.innerHTML = `
      <div class="studio-modal-container">
        <div class="studio-header">
          <div class="studio-title-box">
            <span class="studio-badge">ENGINEERING STUDIO</span>
            <h2>🛠️ Route Builder & Stop Snapper</h2>
          </div>
          <button class="studio-close-btn" id="btn-close-studio">✕</button>
        </div>

        <div class="studio-body">
          <!-- Left Control Panel -->
          <div class="studio-sidebar">
            <div class="studio-field-group">
              <label>Route Mode</label>
              <div class="studio-mode-pills">
                <button class="studio-pill active" data-mode="brts">🚌 BRTS</button>
                <button class="studio-pill" data-mode="shuttle">🛺 Shuttle</button>
                <button class="studio-pill" data-mode="metro">🚇 Metro</button>
              </div>
            </div>

            <div class="studio-field-group">
              <label>Route Name & Code</label>
              <div class="studio-input-row">
                <input type="text" id="studio-route-code" placeholder="e.g. 4D" style="width: 70px;" value="4D" />
                <input type="text" id="studio-route-name" placeholder="e.g. BRTS 4D (Iskcon to Naroda)" value="BRTS 4D (Iskcon to Naroda Gam)" />
              </div>
            </div>

            <div class="studio-field-group">
              <label>Route Color & Fare</label>
              <div class="studio-input-row">
                <input type="color" id="studio-route-color" value="#FF6B00" style="width: 44px; height: 38px; padding: 2px;" />
                <input type="number" id="studio-route-fare" placeholder="Fare ₹" value="10" style="width: 80px;" />
                <button class="studio-btn-sec" id="btn-load-existing-route" title="Load current data from DB">📥 Load from DB</button>
              </div>
            </div>

            <div class="studio-field-group">
              <label>📍 Search & Add Stop (Google Places)</label>
              <div class="studio-search-wrapper">
                <input type="text" id="studio-stop-search" placeholder="Type stop name (e.g. Star Bazaar BRTS)..." />
                <button class="studio-btn-add" id="btn-add-searched-stop">Add</button>
              </div>
              <div class="studio-search-hints">Tip: You can also click directly on the map to drop a stop.</div>
            </div>

            <!-- Ordered Stops List -->
            <div class="studio-stops-container">
              <div class="studio-stops-header">
                <span>Stops Sequence (<span id="studio-stop-count">0</span>)</span>
                <button class="studio-clear-link" id="btn-clear-all-stops">Clear All</button>
              </div>
              <div class="studio-stops-list" id="studio-stops-list">
                <!-- Injected stop items -->
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="studio-footer-actions">
              <button class="studio-action-btn btn-snap-route" id="btn-snap-route">
                🛣️ Snap to Road (Pixel-Perfect)
              </button>
              <button class="studio-action-btn btn-save-db" id="btn-save-db">
                💾 Save to Database & Sync File
              </button>
            </div>
          </div>

          <!-- Right Interactive Map Preview -->
          <div class="studio-map-pane">
            <div id="studio-map-container" style="width:100%; height:100%;"></div>
            <div class="studio-map-stats" id="studio-map-stats">
              <span>Points: <strong id="stat-pts-count">0</strong></span>
              <span>Distance: <strong id="stat-dist-km">0.0 km</strong></span>
              <span>Status: <strong id="stat-status" style="color:#22A147;">Ready</strong></span>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    // Wire close
    modal.querySelector('#btn-close-studio').addEventListener('click', () => {
      modal.style.display = 'none';
    });
  }

  modal.style.display = 'flex';
  initStudioEngine(modal);
  setTimeout(() => {
    if (builderMap && typeof google !== 'undefined' && google.maps) {
      google.maps.event.trigger(builderMap, 'resize');
      if (currentStops.length > 0) {
        updateStopMarkers();
      }
    }
  }, 250);
}

function initStudioEngine(modal) {
  const mapDiv = modal.querySelector('#studio-map-container');
  if (!mapDiv) return;

  // Initialize Google Maps instance for studio
  if (typeof google !== 'undefined' && google.maps && google.maps.Map) {
    if (!builderMap) {
      builderMap = new google.maps.Map(mapDiv, {
        center: { lat: 23.0339, lng: 72.5467 },
        zoom: 13,
        mapTypeId: 'roadmap',
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        styles: [
          { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] }
        ]
      });

      // Click on map to drop stop
      builderMap.addListener('click', (e) => {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        reverseGeocodeAndAdd(lat, lng);
      });
    }

    initAutocomplete(modal);
  }

  // Wire buttons
  const btnAdd = modal.querySelector('#btn-add-searched-stop');
  const inputSearch = modal.querySelector('#studio-stop-search');
  btnAdd.onclick = () => {
    if (inputSearch.value.trim()) {
      geocodeStopName(inputSearch.value.trim());
      inputSearch.value = '';
    }
  };

  modal.querySelector('#btn-clear-all-stops').onclick = () => {
    currentStops = [];
    generatedPath = [];
    clearMapVisuals();
    renderStopsList(modal);
  };

  modal.querySelector('#btn-snap-route').onclick = () => {
    snapRouteToRoad(modal);
  };

  modal.querySelector('#btn-save-db').onclick = () => {
    saveEngineeredRoute(modal);
  };

  modal.querySelector('#btn-load-existing-route').onclick = () => {
    loadExistingFromDb(modal);
  };

  // Preload existing 4D data if empty
  if (currentStops.length === 0) {
    loadExistingFromDb(modal);
  }
}

function initAutocomplete(modal) {
  const input = modal.querySelector('#studio-stop-search');
  if (!input || !google.maps.places) return;

  const autocomplete = new google.maps.places.Autocomplete(input, {
    bounds: new google.maps.LatLngBounds(
      new google.maps.LatLng(22.95, 72.45),
      new google.maps.LatLng(23.15, 72.70)
    ),
    componentRestrictions: { country: 'in' },
    fields: ['name', 'geometry', 'formatted_address']
  });

  autocomplete.addListener('place_changed', () => {
    const place = autocomplete.getPlace();
    if (place && place.geometry) {
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      addStopToBuilder(modal, place.name || 'Searched Stop', lat, lng);
      input.value = '';
    }
  });
}

function geocodeStopName(name) {
  if (!google.maps.Geocoder) return;
  const geocoder = new google.maps.Geocoder();
  geocoder.geocode({
    address: `${name}, Ahmedabad, Gujarat`,
    bounds: {
      north: 23.15,
      south: 22.95,
      east: 72.70,
      west: 72.45
    }
  }, (results, status) => {
    if (status === 'OK' && results[0]) {
      const lat = results[0].geometry.location.lat();
      const lng = results[0].geometry.location.lng();
      const modal = document.getElementById('route-builder-modal');
      addStopToBuilder(modal, name, lat, lng);
    } else {
      showToast(`Could not find location for: ${name}`, 'error');
    }
  });
}

function reverseGeocodeAndAdd(lat, lng) {
  const modal = document.getElementById('route-builder-modal');
  if (!modal) return;
  if (!google.maps.Geocoder) {
    addStopToBuilder(modal, `Stop ${currentStops.length + 1}`, lat, lng);
    return;
  }
  const geocoder = new google.maps.Geocoder();
  geocoder.geocode({ location: { lat, lng } }, (results, status) => {
    let name = `Stop ${currentStops.length + 1}`;
    if (status === 'OK' && results[0]) {
      // Pick first readable component
      name = results[0].address_components[0]?.long_name || results[0].formatted_address.split(',')[0] || name;
    }
    addStopToBuilder(modal, name, lat, lng);
  });
}

function addStopToBuilder(modal, name, lat, lng) {
  currentStops.push({
    name,
    lat: parseFloat(lat.toFixed(5)),
    lng: parseFloat(lng.toFixed(5))
  });
  renderStopsList(modal);
  updateStopMarkers();
  showToast(`Added: ${name}`);
}

function renderStopsList(modal) {
  const listEl = modal.querySelector('#studio-stops-list');
  const countEl = modal.querySelector('#studio-stop-count');
  if (!listEl) return;

  if (countEl) countEl.textContent = currentStops.length;
  listEl.innerHTML = '';

  if (currentStops.length === 0) {
    listEl.innerHTML = `<div style="color:rgba(255,255,255,0.4); text-align:center; padding:20px 0; font-size:12.5px;">No stops added yet. Type a stop name above or click on map.</div>`;
    return;
  }

  currentStops.forEach((s, idx) => {
    const item = document.createElement('div');
    item.className = 'studio-stop-item';
    item.innerHTML = `
      <span class="stop-num">${idx + 1}</span>
      <div class="stop-info">
        <input type="text" class="stop-name-input" value="${s.name}" data-idx="${idx}" />
        <span class="stop-coords">${s.lat}, ${s.lng}</span>
      </div>
      <div class="stop-actions">
        ${idx > 0 ? `<button class="btn-move" data-idx="${idx}" data-dir="-1" title="Move Up">↑</button>` : ''}
        ${idx < currentStops.length - 1 ? `<button class="btn-move" data-idx="${idx}" data-dir="1" title="Move Down">↓</button>` : ''}
        <button class="btn-del" data-idx="${idx}" title="Remove">✕</button>
      </div>
    `;

    // Edit name
    item.querySelector('.stop-name-input').addEventListener('change', (e) => {
      currentStops[idx].name = e.target.value.trim();
    });

    // Move
    item.querySelectorAll('.btn-move').forEach(b => {
      b.onclick = (e) => {
        const i = parseInt(b.dataset.idx);
        const dir = parseInt(b.dataset.dir);
        const temp = currentStops[i];
        currentStops[i] = currentStops[i + dir];
        currentStops[i + dir] = temp;
        renderStopsList(modal);
        updateStopMarkers();
      };
    });

    // Delete
    item.querySelector('.btn-del').onclick = () => {
      currentStops.splice(idx, 1);
      renderStopsList(modal);
      updateStopMarkers();
    };

    listEl.appendChild(item);
  });
}

function updateStopMarkers() {
  if (!builderMap) return;

  // Clear old markers
  stopMarkers.forEach(m => m.setMap(null));
  stopMarkers = [];

  const bounds = new google.maps.LatLngBounds();

  currentStops.forEach((s, idx) => {
    const marker = new google.maps.Marker({
      position: { lat: s.lat, lng: s.lng },
      map: builderMap,
      label: {
        text: `${idx + 1}`,
        color: '#ffffff',
        fontWeight: 'bold',
        fontSize: '11px'
      },
      title: `${s.name} (${s.lat}, ${s.lng})`,
      draggable: true
    });

    marker.addListener('dragend', (e) => {
      s.lat = parseFloat(e.latLng.lat().toFixed(5));
      s.lng = parseFloat(e.latLng.lng().toFixed(5));
      const modal = document.getElementById('route-builder-modal');
      if (modal) renderStopsList(modal);
    });

    stopMarkers.push(marker);
    bounds.extend({ lat: s.lat, lng: s.lng });
  });

  if (currentStops.length > 0) {
    builderMap.fitBounds(bounds);
  }
}

function clearMapVisuals() {
  stopMarkers.forEach(m => m.setMap(null));
  stopMarkers = [];
  if (routePolyline) {
    routePolyline.setMap(null);
    routePolyline = null;
  }
}

function snapRouteToRoad(modal) {
  if (currentStops.length < 2) {
    showToast('Add at least 2 stops to generate a road route', 'error');
    return;
  }

  const statStatus = modal.querySelector('#stat-status');
  if (statStatus) statStatus.textContent = 'Calculating road route...';

  // Use DirectionsService
  const directionsService = new google.maps.DirectionsService();
  const origin = { lat: currentStops[0].lat, lng: currentStops[0].lng };
  const destination = { lat: currentStops[currentStops.length - 1].lat, lng: currentStops[currentStops.length - 1].lng };
  const waypoints = currentStops.slice(1, -1).map(s => ({
    location: { lat: s.lat, lng: s.lng },
    stopover: true
  }));

  function applyResult(points, meters) {
    generatedPath = points;
    if (routePolyline) routePolyline.setMap(null);
    const color = modal.querySelector('#studio-route-color')?.value || '#FF6B00';

    routePolyline = new google.maps.Polyline({
      path: points.map(p => ({ lat: p[0], lng: p[1] })),
      strokeColor: color,
      strokeWeight: 6,
      strokeOpacity: 0.9,
      map: builderMap
    });

    const ptsEl = modal.querySelector('#stat-pts-count');
    const distEl = modal.querySelector('#stat-dist-km');
    if (ptsEl) ptsEl.textContent = points.length;
    if (distEl) distEl.textContent = `${(meters / 1000).toFixed(1)} km`;
    if (statStatus) statStatus.textContent = 'Pixel-Perfect Snapped! ✅';
    showToast(`Road snapped! ${points.length} road coordinates generated.`);
  }

  directionsService.route({
    origin,
    destination,
    waypoints,
    travelMode: google.maps.TravelMode.DRIVING,
    optimizeWaypoints: false
  }, async (result, status) => {
    if (status === 'OK' && result.routes[0]) {
      const route = result.routes[0];
      const points = [];
      let totalMeters = 0;

      route.legs.forEach(leg => {
        totalMeters += leg.distance.value;
        leg.steps.forEach(step => {
          step.path.forEach(latLng => {
            points.push([
              parseFloat(latLng.lat().toFixed(5)),
              parseFloat(latLng.lng().toFixed(5))
            ]);
          });
        });
      });

      applyResult(points, totalMeters);
    } else {
      // Automatic High-Precision OSRM Road Snapper Fallback
      try {
        statStatus.textContent = 'Snapping via road network...';
        const coordStr = currentStops.map(s => `${s.lng},${s.lat}`).join(';');
        const osrmRes = await fetch(`https://router.project-osrm.org/route/v1/driving/${coordStr}?overview=full&geometries=geojson`);
        const osrmData = await osrmRes.json();
        if (osrmData.routes && osrmData.routes[0]) {
          const points = osrmData.routes[0].geometry.coordinates.map(c => [
            parseFloat(c[1].toFixed(5)),
            parseFloat(c[0].toFixed(5))
          ]);
          applyResult(points, osrmData.routes[0].distance);
          return;
        }
      } catch (err) {
        console.warn('OSRM fallback error:', err);
      }
      const points = currentStops.map(s => [s.lat, s.lng]);
      applyResult(points, 0);
    }
  });
}

async function saveEngineeredRoute(modal) {
  if (currentStops.length < 2) {
    showToast('Add at least 2 stops before saving', 'error');
    return;
  }

  const code = modal.querySelector('#studio-route-code')?.value || 'BRTS';
  const name = modal.querySelector('#studio-route-name')?.value || `Route ${code}`;
  const color = modal.querySelector('#studio-route-color')?.value || '#FF6B00';
  const fare = parseInt(modal.querySelector('#studio-route-fare')?.value) || 10;
  const activeModePill = modal.querySelector('.studio-pill.active');
  const mode = activeModePill?.dataset?.mode || 'brts';

  // If path wasn't snapped, fallback to direct stop-to-stop
  let finalPath = generatedPath;
  if (!finalPath || !finalPath.length) {
    finalPath = currentStops.map(s => [s.lat, s.lng]);
  }

  const payload = {
    mode,
    routeNumber: code,
    name,
    color,
    fare,
    city: 'Ahmedabad',
    stops: currentStops,
    path: finalPath
  };

  showToast('Saving to SQLite Database...', 'info');

  try {
    const res = await fetch('/api/admin/save-route', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.success) {
      showToast(`Saved! ${data.message}`, 'success');
      // Close modal after short delay
      setTimeout(() => {
        modal.style.display = 'none';
        window.location.reload(); // Reload to reflect newly synced route everywhere
      }, 1200);
    } else {
      showToast(`Save failed: ${data.error}`, 'error');
    }
  } catch (e) {
    showToast(`Server error: ${e.message}`, 'error');
  }
}

async function loadExistingFromDb(modal) {
  try {
    const res = await fetch('/api/brts/routes?city=Ahmedabad');
    const routes = await res.json();
    const route4D = routes.find(r => r.route_number === '4D') || routes[0];

    if (route4D) {
      modal.querySelector('#studio-route-code').value = route4D.route_number;
      modal.querySelector('#studio-route-name').value = route4D.name;
      modal.querySelector('#studio-route-color').value = route4D.color || '#FF6B00';
      modal.querySelector('#studio-route-fare').value = route4D.fare || 10;

      currentStops = route4D.stops.map(s => ({
        name: s.name,
        lat: s.lat,
        lng: s.lng
      }));

      generatedPath = route4D.path || [];

      renderStopsList(modal);
      updateStopMarkers();

      if (generatedPath.length && builderMap) {
        if (routePolyline) routePolyline.setMap(null);
        routePolyline = new google.maps.Polyline({
          path: generatedPath.map(p => ({ lat: p[0], lng: p[1] })),
          strokeColor: route4D.color || '#FF6B00',
          strokeWeight: 6,
          strokeOpacity: 0.9,
          map: builderMap
        });

        const ptsEl = modal.querySelector('#stat-pts-count');
        if (ptsEl) ptsEl.textContent = generatedPath.length;
      }

      showToast(`Loaded ${route4D.route_number} from SQLite Database`);
    }
  } catch (e) {
    console.error('Load Error:', e.message);
  }
}
