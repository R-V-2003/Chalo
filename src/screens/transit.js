// Pan-India Transit Hub — Metros, Suburban Locals, National Trains, BRTS & State Road Transport Corporations (SRTC)
import { icons } from '../utils/icons.js';
import { router } from '../utils/router.js';
import { api } from '../api.js';
import { locationService } from '../services/location.js';
import { showToast } from '../utils/toast.js';

let transitMap = null;
let metroMarkers = [];
let selectedCity = 'Ahmedabad';
let allCities = [];

export function createTransitScreen() {
  const screen = document.createElement('div');
  screen.className = 'screen transit-screen';
  screen.id = 'transit-screen';

  screen.innerHTML = `
    <div class="transit-header">
      <button class="transit-back-btn" id="transit-back" aria-label="Go Back">${icons.arrowLeft}</button>
      <h1 class="transit-title">🇮🇳 India Transit Hub</h1>
      <div class="transit-subtitle">Metro • Suburban Locals • Trains • BRTS • State Bus</div>
    </div>

    <!-- City Selector Bar -->
    <div class="transit-city-bar">
      <div class="transit-city-label">Select City / Region:</div>
      <div class="transit-city-scroll" id="transit-city-scroll">
        <button class="city-chip active" data-city="Ahmedabad">📍 Ahmedabad</button>
        <button class="city-chip" data-city="Delhi NCR">🚇 Delhi NCR</button>
        <button class="city-chip" data-city="Mumbai">🚆 Mumbai</button>
        <button class="city-chip" data-city="Bengaluru">🟣 Bengaluru</button>
        <button class="city-chip" data-city="Kolkata">🌊 Kolkata</button>
        <button class="city-chip" data-city="Hyderabad">🔴 Hyderabad</button>
        <button class="city-chip" data-city="Pune">🟣 Pune</button>
        <button class="city-chip" data-city="Chennai">🔵 Chennai</button>
        <button class="city-chip" data-city="Jaipur">🏰 Jaipur</button>
        <button class="city-chip" data-city="Lucknow">🕌 Lucknow</button>
        <button class="city-chip" data-city="All India">🇮🇳 All India</button>
      </div>
    </div>

    <!-- Mode Tabs -->
    <div class="transit-tabs" id="transit-tabs">
      <button class="transit-tab active" data-tab="metro">🚇 Metro</button>
      <button class="transit-tab" data-tab="trains">🚂 Trains & Locals</button>
      <button class="transit-tab" data-tab="brts">🚌 BRTS</button>
      <button class="transit-tab" data-tab="gsrtc">🚍 State Bus (SRTC)</button>
      <button class="transit-tab" data-tab="nearby">📍 Nearby</button>
    </div>

    <div class="transit-content" id="transit-content">
      <div class="transit-loading">
        <div class="map-loading-spinner"></div>
        <div class="map-loading-text">Loading transit network...</div>
      </div>
    </div>
  `;

  setTimeout(() => initTransit(screen), 100);
  return screen;
}

async function initTransit(screen) {
  screen.querySelector('#transit-back')?.addEventListener('click', () => router.back());
  
  // Load cities list
  try {
    allCities = await api.getCities();
  } catch (e) {
    allCities = [];
  }

  // City chips switching
  screen.querySelectorAll('.city-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      screen.querySelectorAll('.city-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      selectedCity = chip.dataset.city;
      
      // Reload currently active tab
      const activeTab = screen.querySelector('.transit-tab.active')?.dataset.tab || 'metro';
      loadActiveTab(screen, activeTab);
    });
  });

  // Tab switching
  screen.querySelectorAll('.transit-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      screen.querySelectorAll('.transit-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const tabName = tab.dataset.tab;
      loadActiveTab(screen, tabName);
    });
  });

  // Load default tab
  await loadMetroTab(screen);
}

function loadActiveTab(screen, tabName) {
  if (tabName === 'metro') loadMetroTab(screen);
  else if (tabName === 'trains') loadTrainsTab(screen);
  else if (tabName === 'brts') loadBrtsTab(screen);
  else if (tabName === 'gsrtc') loadGsrtcTab(screen);
  else if (tabName === 'nearby') loadNearbyTab(screen);
}

// ── 1. METRO TAB ──
async function loadMetroTab(screen) {
  const content = screen.querySelector('#transit-content');
  content.innerHTML = `
    <div class="transit-loading">
      <div class="map-loading-spinner"></div>
      <div class="map-loading-text">Loading ${selectedCity} Metro lines...</div>
    </div>
  `;

  try {
    const cityParam = selectedCity === 'All India' ? null : selectedCity;
    const lines = await api.getMetroLines(cityParam);
    
    if (!lines || lines.length === 0) {
      content.innerHTML = `
        <div class="transit-empty-state">
          <div style="font-size:40px;margin-bottom:12px;">🚇</div>
          <div style="font-size:16px;font-weight:700;color:white;">No active metro in ${selectedCity}</div>
          <div style="font-size:13px;color:rgba(255,255,255,0.5);margin-top:6px;max-width:280px;margin-left:auto;margin-right:auto;">
            ${selectedCity} has BRTS and State Bus services available in the other tabs above.
          </div>
        </div>
      `;
      return;
    }

    content.innerHTML = `
      <div class="transit-metro-section">
        <div class="transit-map-container" id="transit-metro-map"></div>
        
        <div class="transit-section-header">
          <span>🚇 ${selectedCity} Metro Lines (${lines.length})</span>
        </div>

        <div class="metro-lines-list" id="metro-lines-list"></div>

        <div class="metro-fare-calc" id="metro-fare-calc">
          <div class="fare-calc-title">🎫 ${selectedCity} Metro Fare Calculator</div>
          <div class="fare-calc-row">
            <div class="fare-calc-field">
              <label>From Station</label>
              <select id="fare-from" class="fare-select"><option value="">Select Origin</option></select>
            </div>
            <div class="fare-calc-swap" id="fare-swap" title="Swap Stations">⇄</div>
            <div class="fare-calc-field">
              <label>To Station</label>
              <select id="fare-to" class="fare-select"><option value="">Select Destination</option></select>
            </div>
          </div>
          <button class="fare-calc-btn" id="fare-calc-btn">Calculate Fare & Travel Time</button>
          <div class="fare-result" id="fare-result"></div>
        </div>
      </div>
    `;

    const linesList = content.querySelector('#metro-lines-list');
    const fareFrom = content.querySelector('#fare-from');
    const fareTo = content.querySelector('#fare-to');

    lines.forEach(line => {
      const card = document.createElement('div');
      card.className = 'metro-line-card';
      card.innerHTML = `
        <div class="metro-line-header" style="border-left: 4px solid ${line.color}">
          <div class="metro-line-badge" style="background:${line.color}">${line.code}</div>
          <div class="metro-line-info">
            <div class="metro-line-name">${line.name}</div>
            <div class="metro-line-route">${line.from_station} ➔ ${line.to_station}</div>
            <div class="metro-line-meta">
              <span>🏛️ ${line.system_name || line.city + ' Metro'}</span>
              <span>📍 ${line.total_stations} stations</span>
              <span>📏 ${line.total_distance_km} km</span>
              <span>⏱️ Every ${line.frequency_minutes} min</span>
            </div>
          </div>
          <div class="metro-line-expand">${icons.chevronDown}</div>
        </div>
        <div class="metro-stations-list collapsed" id="stations-${line.id}">
          ${(line.stations || []).map((s) => `
            <div class="metro-station-item ${s.is_interchange ? 'interchange' : ''}">
              <div class="metro-station-dot" style="background:${line.color}">
                ${s.is_interchange ? '⬡' : '●'}
              </div>
              <div class="metro-station-connector" style="background:${line.color}"></div>
              <div class="metro-station-info">
                <span class="metro-station-name">${s.name}</span>
                ${s.is_interchange ? '<span class="metro-interchange-badge">🔄 Interchange</span>' : ''}
                <span class="metro-station-zone">${s.zone || ''}</span>
              </div>
            </div>
          `).join('')}
        </div>
      `;
      
      card.querySelector('.metro-line-header').addEventListener('click', () => {
        const stationsList = card.querySelector(`.metro-stations-list`);
        const isCollapsed = stationsList.classList.toggle('collapsed');
        card.querySelector('.metro-line-expand').innerHTML = isCollapsed ? icons.chevronDown : icons.chevronUp;
      });
      
      linesList.appendChild(card);

      // Populate fare selects
      (line.stations || []).forEach(s => {
        const opt1 = new Option(`${s.name} (${line.code})`, s.id);
        const opt2 = new Option(`${s.name} (${line.code})`, s.id);
        fareFrom.add(opt1);
        fareTo.add(opt2);
      });
    });

    // Fare calculator
    content.querySelector('#fare-swap')?.addEventListener('click', () => {
      const temp = fareFrom.value;
      fareFrom.value = fareTo.value;
      fareTo.value = temp;
    });

    content.querySelector('#fare-calc-btn')?.addEventListener('click', async () => {
      const from = fareFrom.value;
      const to = fareTo.value;
      if (!from || !to) { showToast('Please select both origin and destination stations'); return; }
      if (from === to) { showToast('Origin and destination cannot be the same'); return; }

      const resultDiv = content.querySelector('#fare-result');
      resultDiv.innerHTML = '<div class="fare-loading">Calculating journey details...</div>';

      try {
        const fare = await api.getMetroFare(from, to);
        resultDiv.innerHTML = `
          <div class="fare-result-card">
            <div class="fare-route-info">
              <span class="fare-from">${fare.from.name}</span>
              <span class="fare-arrow">➔</span>
              <span class="fare-to">${fare.to.name}</span>
            </div>
            <div class="fare-details">
              <div class="fare-detail-item">
                <span class="fare-label">Single Token</span>
                <span class="fare-value fare-price">₹${fare.fare}</span>
              </div>
              <div class="fare-detail-item">
                <span class="fare-label">Smart Card (10% Off)</span>
                <span class="fare-value fare-discount">₹${fare.smartCardFare}</span>
              </div>
              <div class="fare-detail-item">
                <span class="fare-label">Total Stations</span>
                <span class="fare-value">${fare.stationCount}</span>
              </div>
              <div class="fare-detail-item">
                <span class="fare-label">Estimated Travel</span>
                <span class="fare-value">~${fare.estimatedMinutes} min</span>
              </div>
              ${fare.interchange ? `
                <div class="fare-detail-item fare-interchange">
                  <span class="fare-label">🔄 Line Interchange Required At</span>
                  <span class="fare-value">${fare.interchangeAt} (Platform Transfer)</span>
                </div>
              ` : ''}
            </div>
            <div class="fare-day-pass">💳 Tourist / Day Pass Available • Unlimited Travel</div>
          </div>
        `;
      } catch (err) {
        resultDiv.innerHTML = '<div class="fare-error">Failed to calculate fare</div>';
      }
    });

    // Initialize mini map
    initMetroMap(content, lines);

  } catch (err) {
    content.innerHTML = `<div class="transit-error">Failed to load metro data: ${err.message}</div>`;
  }
}

function initMetroMap(container, lines) {
  const mapEl = container.querySelector('#transit-metro-map');
  if (!mapEl || typeof L === 'undefined') return;

  if (transitMap) { transitMap.remove(); transitMap = null; }
  metroMarkers = [];

  transitMap = L.map(mapEl, { 
    zoomControl: false, 
    attributionControl: false,
    scrollWheelZoom: true
  }).setView([23.03, 72.57], 12);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18
  }).addTo(transitMap);

  const bounds = L.latLngBounds();

  lines.forEach(line => {
    if (!line.stations || line.stations.length < 2) return;
    
    const latlngs = line.stations.map(s => [s.lat, s.lng]);
    
    L.polyline(latlngs, { 
      color: line.color, 
      weight: 5, 
      opacity: 0.9, 
      dashArray: line.code.includes('BL') ? null : '8 6'
    }).addTo(transitMap);

    line.stations.forEach(s => {
      bounds.extend([s.lat, s.lng]);
      const size = s.is_interchange ? 14 : 10;
      const markerIcon = L.divIcon({
        className: 'metro-map-marker',
        html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${line.color};border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.4);${s.is_interchange ? 'width:16px;height:16px;background:white;border:3px solid ' + line.color : ''}"></div>`,
        iconSize: [size + 4, size + 4],
        iconAnchor: [(size + 4) / 2, (size + 4) / 2]
      });
      
      const marker = L.marker([s.lat, s.lng], { icon: markerIcon }).addTo(transitMap);
      marker.bindPopup(`
        <div style="font-family:Outfit,sans-serif;text-align:center;">
          <strong style="color:${line.color}">${s.name}</strong><br/>
          <small>${line.name} (${line.city})</small>
          ${s.is_interchange ? '<br/><span style="color:#FF6B00;font-weight:600;">🔄 Interchange Station</span>' : ''}
        </div>
      `);
      metroMarkers.push(marker);
    });
  });

  if (bounds.isValid()) {
    transitMap.fitBounds(bounds, { padding: [30, 30] });
  }

  setTimeout(() => transitMap && transitMap.invalidateSize(), 200);
}

// ── 2. TRAINS & SUBURBAN LOCALS TAB ──
async function loadTrainsTab(screen) {
  const content = screen.querySelector('#transit-content');
  content.innerHTML = `
    <div class="transit-loading">
      <div class="map-loading-spinner"></div>
      <div class="map-loading-text">Loading trains and suburban locals...</div>
    </div>
  `;

  try {
    const cityParam = selectedCity === 'All India' ? null : selectedCity;
    const [trains, suburban] = await Promise.all([
      api.getTrains({ city: cityParam }),
      api.getSuburbanTrains(cityParam)
    ]);
    
    content.innerHTML = `
      <div class="trains-section">
        <div class="trains-search-bar">
          <div class="trains-search-icon">${icons.search}</div>
          <input type="text" class="trains-search-input" id="train-search" placeholder="Search destination (Mumbai, Delhi, Varanasi, Chennai, Goa...)">
        </div>
        
        <div class="trains-filter-row" id="train-filters">
          <button class="train-filter active" data-type="">All Trains (${trains.length})</button>
          <button class="train-filter" data-type="Vande Bharat">⚡ Vande Bharat</button>
          <button class="train-filter" data-type="Rajdhani">👑 Rajdhani</button>
          <button class="train-filter" data-type="Shatabdi">🚅 Shatabdi</button>
          <button class="train-filter" data-type="Superfast">Superfast</button>
          <button class="train-filter" data-type="Express">Express</button>
        </div>

        ${suburban && suburban.length > 0 ? `
          <div class="suburban-section">
            <div class="transit-section-header">
              <span>🚆 Local & Suburban Railway (${selectedCity})</span>
            </div>
            <div class="suburban-list">
              ${suburban.map(st => `
                <div class="suburban-card">
                  <div class="suburban-header">
                    <span class="suburban-tag">${st.system}</span>
                    <span class="suburban-fare">${st.fare}</span>
                  </div>
                  <div class="suburban-name">${st.name}</div>
                  <div class="suburban-route">🛣️ ${st.route}</div>
                  <div class="suburban-meta">
                    <span>⏱️ Frequency: <strong>${st.freq}</strong></span>
                    <span>🕒 Operating: <strong>${st.timing}</strong></span>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <div class="transit-section-header">
          <span>🚂 National Trains (${selectedCity})</span>
        </div>

        <div class="trains-list" id="trains-list"></div>
      </div>
    `;

    const trainsList = content.querySelector('#trains-list');

    function renderTrains(list) {
      trainsList.innerHTML = '';
      if (list.length === 0) {
        trainsList.innerHTML = '<div class="transit-empty">No trains matching search criteria</div>';
        return;
      }
      
      list.forEach(train => {
        const card = document.createElement('div');
        card.className = 'train-card';
        
        const typeColors = {
          'Shatabdi': '#0066CC',
          'Vande Bharat': '#FF6B00',
          'Rajdhani': '#CC0000',
          'Duronto': '#9C27B0',
          'Superfast': '#34A853',
          'Express': '#666',
          'Mail/Express': '#795548'
        };
        const typeColor = typeColors[train.type] || '#666';
        
        const fares = [];
        if (train.fare_chair_car > 0) fares.push(`CC ₹${train.fare_chair_car}`);
        if (train.fare_exec_chair > 0) fares.push(`EC ₹${train.fare_exec_chair}`);
        if (train.fare_sleeper > 0) fares.push(`SL ₹${train.fare_sleeper}`);
        if (train.fare_3ac > 0) fares.push(`3A ₹${train.fare_3ac}`);
        if (train.fare_2ac > 0) fares.push(`2A ₹${train.fare_2ac}`);
        if (train.fare_1ac > 0) fares.push(`1A ₹${train.fare_1ac}`);
        
        card.innerHTML = `
          <div class="train-card-header">
            <div class="train-number-badge" style="background:${typeColor}">${train.train_number}</div>
            <div class="train-name-col">
              <div class="train-name">${train.name}</div>
              <div class="train-type" style="color:${typeColor}">${train.type}</div>
            </div>
          </div>
          <div class="train-schedule-row">
            <div class="train-time-block">
              <div class="train-time">${train.departure_time}</div>
              <div class="train-station-code">${train.from_station.split('(')[0].trim()}</div>
            </div>
            <div class="train-duration-block">
              <div class="train-duration-line"></div>
              <div class="train-duration-text">${train.duration}</div>
              <div class="train-duration-line"></div>
            </div>
            <div class="train-time-block">
              <div class="train-time">${train.arrival_time}</div>
              <div class="train-station-code">${train.to_station.split('(')[0].trim()}</div>
            </div>
          </div>
          <div class="train-info-row">
            <span class="train-runs">📅 ${train.runs_on}</span>
            <span class="train-platform">🏢 Platform ${train.platform || '1'}</span>
            <span class="train-distance">📏 ${train.distance_km} km</span>
          </div>
          <div class="train-fares-row">
            ${fares.map(f => `<span class="train-fare-pill">${f}</span>`).join('')}
          </div>
        `;
        
        card.addEventListener('click', () => showTrainDetail(screen, train));
        trainsList.appendChild(card);
      });
    }

    renderTrains(trains);

    content.querySelector('#train-search')?.addEventListener('input', async (e) => {
      const query = e.target.value.trim();
      if (query.length >= 2) {
        try {
          const results = await api.searchTrains(query);
          renderTrains(results);
        } catch { renderTrains([]); }
      } else {
        renderTrains(trains);
      }
    });

    content.querySelectorAll('#train-filters .train-filter').forEach(btn => {
      btn.addEventListener('click', () => {
        content.querySelectorAll('#train-filters .train-filter').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const type = btn.dataset.type;
        if (type) {
          renderTrains(trains.filter(t => t.type === type));
        } else {
          renderTrains(trains);
        }
      });
    });

  } catch (err) {
    content.innerHTML = `<div class="transit-error">Failed to load train data: ${err.message}</div>`;
  }
}

function showTrainDetail(screen, train) {
  const content = screen.querySelector('#transit-content');
  
  const fares = [];
  if (train.fare_sleeper > 0) fares.push({ cls: 'Sleeper (SL)', fare: train.fare_sleeper, type: 'Non-AC' });
  if (train.fare_3ac > 0) fares.push({ cls: '3rd AC (3A)', fare: train.fare_3ac, type: 'AC' });
  if (train.fare_2ac > 0) fares.push({ cls: '2nd AC (2A)', fare: train.fare_2ac, type: 'AC' });
  if (train.fare_1ac > 0) fares.push({ cls: '1st AC (1A)', fare: train.fare_1ac, type: 'AC' });
  if (train.fare_chair_car > 0) fares.push({ cls: 'Chair Car (CC)', fare: train.fare_chair_car, type: 'AC' });
  if (train.fare_exec_chair > 0) fares.push({ cls: 'Exec Chair (EC)', fare: train.fare_exec_chair, type: 'AC' });

  const typeColors = {
    'Shatabdi': '#0066CC', 'Vande Bharat': '#FF6B00', 'Rajdhani': '#CC0000',
    'Duronto': '#9C27B0', 'Superfast': '#34A853', 'Express': '#666', 'Mail/Express': '#795548'
  };

  content.innerHTML = `
    <div class="train-detail">
      <button class="train-detail-back" id="train-detail-back">${icons.arrowLeft} Back to Trains List</button>
      <div class="train-detail-card">
        <div class="train-detail-header" style="border-top:4px solid ${typeColors[train.type] || '#666'}">
          <div class="train-detail-badge" style="background:${typeColors[train.type] || '#666'}">${train.train_number}</div>
          <div>
            <div class="train-detail-name">${train.name}</div>
            <div class="train-detail-type" style="color:${typeColors[train.type] || '#666'}">${train.type}</div>
          </div>
        </div>
        <div class="train-detail-route">
          <div class="train-detail-endpoint">
            <div class="train-detail-time-big">${train.departure_time}</div>
            <div class="train-detail-station">${train.from_station}</div>
          </div>
          <div class="train-detail-middle">
            <div class="train-detail-duration">${train.duration}</div>
            <div class="train-detail-line-graphic">
              <div class="tdl-dot"></div>
              <div class="tdl-line"></div>
              <div class="tdl-dot end"></div>
            </div>
            <div class="train-detail-dist">${train.distance_km} km</div>
          </div>
          <div class="train-detail-endpoint">
            <div class="train-detail-time-big">${train.arrival_time}</div>
            <div class="train-detail-station">${train.to_station}</div>
          </div>
        </div>
        <div class="train-detail-meta">
          <div class="train-meta-item">📅 Runs: ${train.runs_on}</div>
          <div class="train-meta-item">🏢 Departs Platform: ${train.platform || '1'}</div>
        </div>
      </div>
      <div class="train-fares-card">
        <div class="train-fares-title">💰 Confirmed IRCTC Fare Slabs</div>
        <div class="train-fares-grid">
          ${fares.map(f => `
            <div class="train-fare-item">
              <div class="train-fare-class">${f.cls}</div>
              <div class="train-fare-amount">₹${f.fare}</div>
              <div class="train-fare-type ${f.type === 'AC' ? 'ac' : 'nonac'}">${f.type}</div>
            </div>
          `).join('')}
        </div>
      </div>
      <div class="train-connect-card">
        <div class="train-connect-title">🚇 Integrated City Metro Connection</div>
        <div class="train-connect-text">
          Direct metro connectivity is available at terminal stations (e.g. <strong>Kalupur / Sabarmati</strong> in Ahmedabad, <strong>New Delhi</strong> on Airport/Yellow line, <strong>Howrah</strong> underwater metro, <strong>Majestic</strong> in Bengaluru).
        </div>
      </div>
    </div>
  `;

  content.querySelector('#train-detail-back')?.addEventListener('click', () => loadTrainsTab(screen));
}

// ── 3. BRTS TAB ──
async function loadBrtsTab(screen) {
  const content = screen.querySelector('#transit-content');
  content.innerHTML = `
    <div class="transit-loading">
      <div class="map-loading-spinner"></div>
      <div class="map-loading-text">Loading BRTS networks for ${selectedCity}...</div>
    </div>
  `;

  try {
    const cityParam = selectedCity === 'All India' ? null : selectedCity;
    const routes = await api.getBrtsRoutes({ city: cityParam });

    if (!routes || routes.length === 0) {
      content.innerHTML = `
        <div class="transit-empty-state">
          <div style="font-size:40px;margin-bottom:12px;">🚌</div>
          <div style="font-size:16px;font-weight:700;color:white;">No dedicated BRTS corridor in ${selectedCity}</div>
          <div style="font-size:13px;color:rgba(255,255,255,0.5);margin-top:6px;max-width:300px;margin-left:auto;margin-right:auto;">
            Try selecting <strong>Ahmedabad (Janmarg)</strong>, <strong>Pune (Rainbow)</strong>, <strong>Surat (Sitilink)</strong>, or <strong>Indore (iBus)</strong> to view their high-speed BRTS corridors.
          </div>
        </div>
      `;
      return;
    }

    content.innerHTML = `
      <div class="brts-section">
        <div class="trains-search-bar">
          <div class="trains-search-icon">${icons.search}</div>
          <input type="text" class="trains-search-input" id="brts-search" placeholder="Search BRTS corridors (Janmarg, Rainbow, Sitilink, iBus...)">
        </div>
        <div class="transit-section-header">
          <span>🚌 Active BRTS Corridors in ${selectedCity} (${routes.length})</span>
        </div>
        <div class="brts-routes-list" id="brts-routes-list"></div>
      </div>
    `;

    const routesList = content.querySelector('#brts-routes-list');

    function renderBrts(list) {
      routesList.innerHTML = '';
      if (list.length === 0) {
        routesList.innerHTML = '<div class="transit-empty">No BRTS routes matching query</div>';
        return;
      }

      list.forEach(r => {
        const card = document.createElement('div');
        card.className = 'brts-card';
        card.innerHTML = `
          <div class="brts-card-header">
            <div class="brts-route-badge" style="background:${r.color || '#FF6B00'}">${r.route_number}</div>
            <div style="flex:1;">
              <div class="brts-route-name">${r.name}</div>
              <div class="brts-route-sub">${r.system_name || 'BRTS'} • ${r.from_stop} ➔ ${r.to_stop}</div>
            </div>
            <div class="brts-fare-badge">₹${r.fare}</div>
          </div>
          <div class="brts-card-meta">
            <span>📍 ${r.total_stops} Dedicated Stations</span>
            <span>📏 ${r.distance_km} km Corridor</span>
            <span>⏱️ Every ${r.frequency_minutes} min</span>
            <span>🕒 ${r.operating_hours}</span>
          </div>
        `;
        routesList.appendChild(card);
      });
    }

    renderBrts(routes);

    content.querySelector('#brts-search')?.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().trim();
      if (!q) { renderBrts(routes); return; }
      const filtered = routes.filter(r => 
        r.name.toLowerCase().includes(q) || 
        r.from_stop.toLowerCase().includes(q) || 
        r.to_stop.toLowerCase().includes(q) ||
        r.route_number.toLowerCase().includes(q)
      );
      renderBrts(filtered);
    });

  } catch (err) {
    content.innerHTML = `<div class="transit-error">Failed to load BRTS data: ${err.message}</div>`;
  }
}

// ── 4. STATE BUS TAB (All-India SRTCs) ──
async function loadGsrtcTab(screen) {
  const content = screen.querySelector('#transit-content');
  content.innerHTML = `
    <div class="transit-loading">
      <div class="map-loading-spinner"></div>
      <div class="map-loading-text">Loading State Transport Corporation buses...</div>
    </div>
  `;

  try {
    const cityParam = selectedCity === 'All India' ? null : selectedCity;
    const [routes, operators] = await Promise.all([
      api.getGsrtcRoutes({ city: cityParam }),
      api.getGsrtcOperators()
    ]);

    content.innerHTML = `
      <div class="gsrtc-section">
        <div class="trains-search-bar">
          <div class="trains-search-icon">${icons.search}</div>
          <input type="text" class="trains-search-input" id="gsrtc-search" placeholder="Search intercity buses (Mumbai, Pune, Bengaluru, Mysuru, Delhi, Agra, Vadodara...)">
        </div>
        
        <div class="trains-filter-row" id="operator-filters">
          <button class="train-filter active" data-op="">All SRTCs (${routes.length})</button>
          <button class="train-filter" data-op="GSRTC">GSRTC (Gujarat)</button>
          <button class="train-filter" data-op="MSRTC">MSRTC Shivneri (Maharashtra)</button>
          <button class="train-filter" data-op="KSRTC">KSRTC Airavat (Karnataka)</button>
          <button class="train-filter" data-op="UPSRTC">UPSRTC (Uttar Pradesh)</button>
          <button class="train-filter" data-op="RSRTC">RSRTC (Rajasthan)</button>
          <button class="train-filter" data-op="SETC">SETC (Tamil Nadu)</button>
        </div>

        <div class="transit-section-header">
          <span>🚍 Intercity Express & Volvo Buses (${selectedCity})</span>
        </div>

        <div class="trains-list" id="gsrtc-list"></div>
      </div>
    `;

    const listEl = content.querySelector('#gsrtc-list');

    function renderGsrtc(list) {
      listEl.innerHTML = '';
      if (list.length === 0) {
        listEl.innerHTML = '<div class="transit-empty">No state buses found for this search</div>';
        return;
      }

      list.forEach(b => {
        const card = document.createElement('div');
        card.className = 'train-card';
        
        const opColor = {
          'MSRTC': '#D32F2F',
          'KSRTC': '#C2185B',
          'GSRTC': '#2E7D32',
          'UPSRTC': '#1565C0',
          'RSRTC': '#E65100',
          'SETC': '#6A1B9A',
          'TSRTC': '#00838F'
        }[b.operator] || '#2E7D32';

        card.innerHTML = `
          <div class="train-card-header">
            <div class="train-number-badge" style="background:${opColor}">${b.operator}</div>
            <div class="train-name-col">
              <div class="train-name">${b.from_city} ➔ ${b.to_city}</div>
              <div class="train-type" style="color:#81C784">${b.bus_type} • ${b.state}</div>
            </div>
          </div>
          <div class="train-schedule-row">
            <div class="train-time-block">
              <div class="train-time" style="font-size:14px;">${b.departure_time}</div>
              <div class="train-station-code">${b.from_city}</div>
            </div>
            <div class="train-duration-block">
              <div class="train-duration-line"></div>
              <div class="train-duration-text">${b.duration || b.arrival_time}</div>
              <div class="train-duration-line"></div>
            </div>
            <div class="train-time-block">
              <div class="train-time" style="font-size:14px;">${b.arrival_time}</div>
              <div class="train-station-code">${b.to_city}</div>
            </div>
          </div>
          <div class="train-info-row">
            <span>🔄 ${b.frequency}</span>
            <span>🛣️ Via: ${b.via || 'Direct Highway'}</span>
          </div>
          <div class="train-fares-row">
            <span class="train-fare-pill" style="background:rgba(46,125,50,0.2);color:#81C784;font-weight:700;">Regular ₹${b.fare}</span>
            ${b.fare_ac > 0 ? `<span class="train-fare-pill" style="background:rgba(33,150,243,0.2);color:#64B5F6;font-weight:700;">AC / Volvo ₹${b.fare_ac}</span>` : ''}
          </div>
        `;
        listEl.appendChild(card);
      });
    }

    renderGsrtc(routes);

    // Search
    content.querySelector('#gsrtc-search')?.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().trim();
      if (!q) { renderGsrtc(routes); return; }
      const filtered = routes.filter(r => 
        r.to_city.toLowerCase().includes(q) || 
        r.from_city.toLowerCase().includes(q) ||
        r.operator.toLowerCase().includes(q) ||
        (r.via && r.via.toLowerCase().includes(q))
      );
      renderGsrtc(filtered);
    });

    // Operator filter
    content.querySelectorAll('#operator-filters .train-filter').forEach(btn => {
      btn.addEventListener('click', () => {
        content.querySelectorAll('#operator-filters .train-filter').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const op = btn.dataset.op;
        if (op) {
          renderGsrtc(routes.filter(r => r.operator.toUpperCase().includes(op)));
        } else {
          renderGsrtc(routes);
        }
      });
    });

  } catch (err) {
    content.innerHTML = `<div class="transit-error">Failed to load state bus data: ${err.message}</div>`;
  }
}

// ── 5. NEARBY STATIONS TAB ──
async function loadNearbyTab(screen) {
  const content = screen.querySelector('#transit-content');
  content.innerHTML = `
    <div class="transit-loading">
      <div class="map-loading-spinner"></div>
      <div class="map-loading-text">Locating nearest transit hubs from your GPS...</div>
    </div>
  `;

  try {
    const pos = locationService.getPosition();
    const [nearbyMetro, nearbyRailway] = await Promise.all([
      api.getNearbyMetro(pos.lat, pos.lng, 6),
      api.getNearbyRailway(pos.lat, pos.lng)
    ]);

    content.innerHTML = `
      <div class="nearby-section">
        <div class="nearby-group">
          <div class="nearby-group-title">🚇 Nearest Metro Stations</div>
          <div class="nearby-list" id="nearby-metro-list"></div>
        </div>
        <div class="nearby-group">
          <div class="nearby-group-title">🚂 Nearest Railway Stations</div>
          <div class="nearby-list" id="nearby-railway-list"></div>
        </div>
      </div>
    `;

    const metroList = content.querySelector('#nearby-metro-list');
    nearbyMetro.forEach(s => {
      const card = document.createElement('div');
      card.className = 'nearby-card';
      card.innerHTML = `
        <div class="nearby-card-icon" style="background:${s.line_color || '#0066CC'}">
          <span style="color:white;font-size:12px;font-weight:700;">${s.line_code || 'M'}</span>
        </div>
        <div class="nearby-card-info">
          <div class="nearby-card-name">${s.name}</div>
          <div class="nearby-card-line">${s.line_name || 'Metro Line'} • ${s.city || 'India'}</div>
        </div>
        <div class="nearby-card-dist">
          <div class="nearby-dist-value">${s.distance_text}</div>
          <div class="nearby-dist-walk">🚶 ~${s.walking_minutes} min walk</div>
        </div>
      `;
      metroList.appendChild(card);
    });

    const railList = content.querySelector('#nearby-railway-list');
    nearbyRailway.forEach(s => {
      const card = document.createElement('div');
      card.className = 'nearby-card';
      card.innerHTML = `
        <div class="nearby-card-icon" style="background:#795548">
          <span style="color:white;font-size:11px;font-weight:700;">${s.code}</span>
        </div>
        <div class="nearby-card-info">
          <div class="nearby-card-name">${s.name}</div>
          <div class="nearby-card-line">${s.city}, ${s.state}</div>
        </div>
        <div class="nearby-card-dist">
          <div class="nearby-dist-value">${s.distance_text}</div>
          <div class="nearby-dist-walk">🚶 ~${s.walking_minutes} min walk</div>
        </div>
      `;
      railList.appendChild(card);
    });

  } catch (err) {
    content.innerHTML = `<div class="transit-error">Failed to find nearby stations: ${err.message}</div>`;
  }
}
