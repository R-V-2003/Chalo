// Map Screen — Multimodal Live Navigation & Comparison (Auto, Metro, BRTS, Trains, State Bus)
import { icons } from '../utils/icons.js';
import { router } from '../utils/router.js';
import { locationService } from '../services/location.js';
import { api } from '../api.js';
import { createDrawer, openDrawer } from '../components/drawer.js';
import { BRTS_ROUTES_PATHS } from '../services/brtsRoutesData.js';
let liveBrtsRoutes = BRTS_ROUTES_PATHS;
let liveMetroLines = [];

async function loadDynamicBrtsRoutes() {
  try {
    const res = await fetch('/api/brts/routes?city=Ahmedabad');
    if (res.ok) {
      const data = await res.json();
      if (data && data.length) {
        liveBrtsRoutes = data.map(r => ({
          id: r.route_number,
          name: r.name,
          color: r.color || '#FF6B00',
          number: r.route_number,
          fare: `₹${r.fare || 10}`,
          freq: `Every ${r.frequency_minutes || 4} mins`,
          stops: r.stops,
          path: r.path
        }));
      }
    }
  } catch (e) {
    // Graceful fallback to static dataset
  }
}

async function loadDynamicMetroLines() {
  try {
    const res = await fetch('/api/metro/lines?city=Ahmedabad');
    if (res.ok) {
      const data = await res.json();
      if (data && data.length) {
        liveMetroLines = data;
      }
    }
  } catch (e) {
    // Graceful fallback to static METRO_BLUE_PATH & METRO_RED_PATH
  }
}
import { walletService } from '../services/wallet.js';
import { openWalletModal } from '../components/walletModal.js';
import { openBookingModal } from '../components/bookingModal.js';
import { showToast } from '../utils/toast.js';

let map = null;
let userMarker = null;
let routeLayers = [];
let autoMarkers = [];
let multimodalActiveLayer = null;
let multimodalMarkers = [];
let selectedRouteId = null;
let routesData = [];
let miniMapInstances = [];
let pinnedDestMarker = null;
let isPinModeActive = false;
let currentPinnedLocation = null;
let activeMapMode = 'shuttle'; // 'shuttle' (high-priority default) or 'discover'
let discoverActiveFilter = 'all'; // 'all', 'metro', 'brts', 'train', 'state_bus'
let discoverLayers = {
  metro: [],
  brts: [],
  shuttle: [],
  train: [],
  state_bus: []
};
let inspectorSelectedStop = null;

let isGoogleMapEngine = false;
let transitLayer = null;

// Custom HTML Marker Overlay for Google Maps (identical look and feel to Leaflet DivIcon)
class GoogleHtmlOverlay {
  constructor(latLng, htmlContent, options = {}) {
    this.lat = Array.isArray(latLng) ? latLng[0] : (latLng.lat || (typeof latLng.lat === 'function' ? latLng.lat() : 0));
    this.lng = Array.isArray(latLng) ? latLng[1] : (latLng.lng || (typeof latLng.lng === 'function' ? latLng.lng() : 0));
    this.htmlContent = htmlContent;
    this.options = options;
    this.div = null;
    this.overlayView = null;
    this._init();
  }

  _init() {
    if (typeof google === 'undefined' || !google.maps || !google.maps.OverlayView) return;
    const self = this;
    const OverlayClass = function() {};
    OverlayClass.prototype = new google.maps.OverlayView();

    OverlayClass.prototype.onAdd = function() {
      const div = document.createElement('div');
      div.style.position = 'absolute';
      div.style.cursor = self.options.interactive !== false ? 'pointer' : 'default';
      if (self.options.className) div.className = self.options.className;
      if (self.options.zIndex) div.style.zIndex = self.options.zIndex;
      div.innerHTML = self.htmlContent;

      if (self.options.onClick) {
        div.addEventListener('click', (e) => {
          e.stopPropagation();
          self.options.onClick(e);
        });
      }
      self.div = div;
      const panes = this.getPanes();
      if (panes && panes.overlayMouseTarget) {
        panes.overlayMouseTarget.appendChild(div);
      }
    };

    OverlayClass.prototype.draw = function() {
      const projection = this.getProjection();
      if (!projection || !self.div) return;
      const latLng = new google.maps.LatLng(self.lat, self.lng);
      const point = projection.fromLatLngToDivPixel(latLng);
      if (point) {
        const anchorX = self.options.anchorX || 0;
        const anchorY = self.options.anchorY || 0;
        self.div.style.left = (point.x - anchorX) + 'px';
        self.div.style.top = (point.y - anchorY) + 'px';
      }
    };

    OverlayClass.prototype.onRemove = function() {
      if (self.div && self.div.parentNode) {
        self.div.parentNode.removeChild(self.div);
        self.div = null;
      }
    };

    this.overlayView = new OverlayClass();
  }

  addTo(mapInstance) {
    if (this.overlayView) {
      this.overlayView.setMap(mapInstance);
    }
    return this;
  }

  remove() {
    if (this.overlayView) {
      this.overlayView.setMap(null);
    }
    if (this.div && this.div.parentNode) {
      this.div.parentNode.removeChild(this.div);
      this.div = null;
    }
  }

  setLatLng(coords) {
    this.lat = Array.isArray(coords) ? coords[0] : (coords.lat || (typeof coords.lat === 'function' ? coords.lat() : 0));
    this.lng = Array.isArray(coords) ? coords[1] : (coords.lng || (typeof coords.lng === 'function' ? coords.lng() : 0));
    if (this.overlayView) {
      const projection = this.overlayView.getProjection();
      if (projection && this.div) {
        const latLng = new google.maps.LatLng(this.lat, this.lng);
        const point = projection.fromLatLngToDivPixel(latLng);
        if (point) {
          const anchorX = this.options.anchorX || 0;
          const anchorY = this.options.anchorY || 0;
          this.div.style.left = (point.x - anchorX) + 'px';
          this.div.style.top = (point.y - anchorY) + 'px';
        }
      }
    }
  }
}

// Universal map helper functions
function panMap(lat, lng, zoom = 14) {
  if (!map) return;
  if (isGoogleMapEngine) {
    map.panTo({ lat, lng });
    if (zoom) map.setZoom(zoom);
  } else {
    map.flyTo([lat, lng], zoom, { duration: 0.8 });
  }
}

function getMapCenter() {
  if (!map) return { lat: 23.0339, lng: 72.5467 };
  if (isGoogleMapEngine) {
    const c = map.getCenter();
    return { lat: c.lat(), lng: c.lng() };
  }
  const c = map.getCenter();
  return { lat: c.lat, lng: c.lng };
}

function fitMapBounds(coordsList, padding = 50) {
  if (!map || !coordsList || !coordsList.length) return;
  if (isGoogleMapEngine) {
    const bounds = new google.maps.LatLngBounds();
    coordsList.forEach(c => {
      const lat = Array.isArray(c) ? c[0] : (c.lat || 0);
      const lng = Array.isArray(c) ? c[1] : (c.lng || 0);
      bounds.extend({ lat, lng });
    });
    map.fitBounds(bounds, padding);
  } else {
    const bounds = L.latLngBounds();
    coordsList.forEach(c => bounds.extend(c));
    if (bounds.isValid()) map.flyToBounds(bounds, { padding: [padding, padding], duration: 0.8 });
  }
}

function addPolylineLayer(pathCoords, options = {}) {
  if (!map) return null;
  if (isGoogleMapEngine) {
    const polyline = new google.maps.Polyline({
      path: pathCoords.map(p => ({ lat: p[0], lng: p[1] })),
      strokeColor: options.color || '#4285F4',
      strokeWeight: options.weight || 5,
      strokeOpacity: options.opacity || 0.85,
      zIndex: options.zIndex || 100,
      map: map
    });
    if (options.onClick) {
      polyline.addListener('click', options.onClick);
    }
    return {
      remove: () => polyline.setMap(null),
      _raw: polyline
    };
  } else {
    const polyline = L.polyline(pathCoords, options).addTo(map);
    if (options.onClick) {
      polyline.on('click', options.onClick);
    }
    return {
      remove: () => map.removeLayer(polyline),
      _raw: polyline
    };
  }
}

function addCustomMarkerLayer(coords, html, options = {}) {
  if (!map) return null;
  const lat = Array.isArray(coords) ? coords[0] : (coords.lat || 0);
  const lng = Array.isArray(coords) ? coords[1] : (coords.lng || 0);

  if (isGoogleMapEngine) {
    const overlay = new GoogleHtmlOverlay({ lat, lng }, html, options);
    overlay.addTo(map);
    return overlay;
  } else {
    const icon = L.divIcon({
      className: options.className || '',
      html: html,
      iconSize: [options.width || 36, options.height || 36],
      iconAnchor: [options.anchorX || 18, options.anchorY || 18]
    });
    const marker = L.marker([lat, lng], {
      icon,
      zIndexOffset: options.zIndex || 500,
      interactive: options.interactive !== false
    }).addTo(map);

    if (options.onClick) {
      marker.on('click', options.onClick);
    }

    return {
      remove: () => map.removeLayer(marker),
      setLatLng: (c) => marker.setLatLng(Array.isArray(c) ? c : [c.lat, c.lng]),
      _raw: marker
    };
  }
}

function removeMapLayer(item) {
  if (!item) return;
  if (typeof item.remove === 'function') {
    item.remove();
  } else if (map && typeof map.removeLayer === 'function') {
    map.removeLayer(item);
  } else if (typeof item.setMap === 'function') {
    item.setMap(null);
  }
}

const GOOGLE_MAPS_API_KEY = 'AIzaSyCWYwtkcqExRJEvRUOliaLUDqMjGmSSfgs';

function waitForGoogleMaps(timeout = 5000) {
  return new Promise((resolve) => {
    if (typeof google !== 'undefined' && typeof google.maps !== 'undefined' && google.maps.Map) {
      return resolve(true);
    }
    const start = Date.now();
    const interval = setInterval(() => {
      if (typeof google !== 'undefined' && typeof google.maps !== 'undefined' && google.maps.Map) {
        clearInterval(interval);
        return resolve(true);
      }
      if (Date.now() - start > timeout) {
        clearInterval(interval);
        return resolve(false);
      }
    }, 50);
  });
}

function ensureGoogleMapsScript() {
  if (typeof google !== 'undefined' && typeof google.maps !== 'undefined' && google.maps.Map) {
    return Promise.resolve(true);
  }
  let script = document.querySelector('script[src*="maps.googleapis.com"]');
  if (!script) {
    script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places,geometry`;
    script.async = true;
    document.head.appendChild(script);
  }
  return waitForGoogleMaps(5000);
}

// Ahmedabad Metro Line Paths (Exact track & viaduct-snapped coordinates)
const METRO_BLUE_PATH = [
  // Thaltej Gam to Thaltej (along Drive-In Road)
  [23.0519, 72.5056],
  [23.0505, 72.5110],
  [23.0497, 72.5162], // Thaltej
  // SG Highway Flyover intersection
  [23.0489, 72.5205],
  [23.0481, 72.5244], // Doordarshan Kendra
  [23.0470, 72.5298], // Himalaya Mall
  [23.0458, 72.5350], // Gurukul Road
  // Turn south-east toward Helmet & Gujarat University
  [23.0453, 72.5390],
  [23.0447, 72.5436], // Gujarat University
  [23.0430, 72.5480], // University Road
  [23.0408, 72.5531], // Commerce Six Road
  // Navrangpura Road
  [23.0404, 72.5575],
  [23.0400, 72.5617], // SP Stadium
  [23.0385, 72.5655], // Junction to Ashram Road
  [23.0373, 72.5670], // Old High Court (Interchange)
  // Sabarmati River Crossing (Dedicated Metro Rail Bridge)
  [23.0378, 72.5710],
  [23.0384, 72.5765],
  // Underground transition at Shahpur
  [23.0392, 72.5811], // Shahpur (Underground)
  // Relief Road Corridor through Walled City
  [23.0345, 72.5840],
  [23.0286, 72.5869], // Gheekanta (Underground)
  [23.0268, 72.5930], // Relief Road
  [23.0258, 72.5990], // Kalupur Darwaja
  [23.0251, 72.6031], // Kalupur Railway Station Metro (Underground Hub)
  // Curve south under tracks towards Kankaria East
  [23.0200, 72.6038],
  [23.0153, 72.6044], // Kankaria East
  // Eastward elevated viaduct toward Apparel Park depot
  [23.0125, 72.6105],
  [23.0106, 72.6181], // Apparel Park
  // East along Amraiwadi road
  [23.0090, 72.6235],
  [23.0078, 72.6286], // Amraiwadi
  [23.0056, 72.6356], // Rabari Colony (NH8 / Express Highway)
  [23.0045, 72.6415],
  [23.0036, 72.6475], // Vastral
  [23.0020, 72.6525],
  [23.0003, 72.6578], // Nirant Cross Road
  [22.9985, 72.6630],
  [22.9972, 72.6678]  // Vastral Gam Terminal
];

const METRO_RED_PATH = [
  // South Terminal: APMC Vasna
  [22.9978, 72.5372], // APMC
  [22.9995, 72.5390], // Jivraj Park
  [23.0015, 72.5415],
  [23.0030, 72.5448], // Rajiv Nagar
  [23.0050, 72.5490],
  [23.0075, 72.5535], // Shreyas
  [23.0070, 72.5585],
  [23.0060, 72.5650], // Paldi (Paldi Cross Road)
  // North along Ashram Road corridor
  [23.0150, 72.5670], // VS Hospital / Ellisbridge
  [23.0245, 72.5685], // Gandhigram
  [23.0310, 72.5678], // Navrangpura / Riverfront link
  [23.0373, 72.5670], // Old High Court (Interchange)
  [23.0415, 72.5660], // Income Tax / Ashram Road
  [23.0460, 72.5650], // Usmanpura
  [23.0510, 72.5652],
  [23.0560, 72.5654], // Vijay Nagar
  [23.0620, 72.5656],
  [23.0678, 72.5658], // Vadaj
  // Curve towards Ranip GSRTC Bus Port
  [23.0678, 72.5742], // Ranip
  [23.0688, 72.5810],
  [23.0697, 72.5878], // Sabarmati Railway Station Metro (SBI / Bullet train hub)
  [23.0780, 72.5900], // AEC
  [23.0856, 72.5922], // Sabarmati
  [23.0910, 72.5965],
  [23.0967, 72.6008]  // Motera Stadium (Narendra Modi Stadium)
];

// Note: BRTS_ROUTES_PATHS is imported with 4,200+ road-snapped coordinates from ../services/brtsRoutesData.js

// Comprehensive Pan-Ahmedabad & Regional Multimodal Transit Dataset (Verified Pinpoint Coordinates)
const AHMEDABAD_TRANSIT_PLACES = [
  // ── Metro Stations (Blue Line - Vastral Gam to Thaltej Gam) ──
  { name: 'Thaltej Gam Metro', lat: 23.0519, lng: 72.5056, type: 'metro', mode: 'metro', subtitle: 'Ahmedabad Metro • Blue Line Terminal', icon: '🚇', color: '#0066CC' },
  { name: 'Thaltej Metro Station', lat: 23.0497, lng: 72.5162, type: 'metro', mode: 'metro', subtitle: 'Ahmedabad Metro • Blue Line (SG Highway)', icon: '🚇', color: '#0066CC' },
  { name: 'Doordarshan Kendra Metro', lat: 23.0481, lng: 72.5244, type: 'metro', mode: 'metro', subtitle: 'Ahmedabad Metro • Blue Line (Drive-In Road)', icon: '🚇', color: '#0066CC' },
  { name: 'Gurukul Road Metro', lat: 23.0458, lng: 72.5350, type: 'metro', mode: 'metro', subtitle: 'Ahmedabad Metro • Blue Line (Memnagar/Gurukul)', icon: '🚇', color: '#0066CC' },
  { name: 'Gujarat University Metro', lat: 23.0447, lng: 72.5436, type: 'metro', mode: 'metro', subtitle: 'Ahmedabad Metro • Blue Line (Commerce/GU)', icon: '🚇', color: '#0066CC' },
  { name: 'Commerce Six Road Metro', lat: 23.0408, lng: 72.5531, type: 'metro', mode: 'metro', subtitle: 'Ahmedabad Metro • Blue Line (Navrangpura)', icon: '🚇', color: '#0066CC' },
  { name: 'SP Stadium Metro', lat: 23.0400, lng: 72.5617, type: 'metro', mode: 'metro', subtitle: 'Ahmedabad Metro • Blue Line (Sardar Patel Stadium)', icon: '🚇', color: '#0066CC' },
  { name: 'Old High Court Interchange Metro', lat: 23.0373, lng: 72.5670, type: 'metro', mode: 'metro', subtitle: 'Interchange Station: Blue & Red Lines • Ashram Road', icon: '🚇', color: '#0066CC' },
  { name: 'Shahpur Metro Station', lat: 23.0392, lng: 72.5811, type: 'metro', mode: 'metro', subtitle: 'Ahmedabad Metro • Underground Blue Line', icon: '🚇', color: '#0066CC' },
  { name: 'Gheekanta Metro Station', lat: 23.0286, lng: 72.5869, type: 'metro', mode: 'metro', subtitle: 'Ahmedabad Metro • Underground Old City', icon: '🚇', color: '#0066CC' },
  { name: 'Kalupur Railway Station Metro', lat: 23.0251, lng: 72.6031, type: 'metro', mode: 'metro', subtitle: 'Ahmedabad Junction ADI & Bullet Train HSR Hub', icon: '🚇', color: '#0066CC' },
  { name: 'Kankaria East Metro', lat: 23.0153, lng: 72.6044, type: 'metro', mode: 'metro', subtitle: 'Ahmedabad Metro • Gate to Kankaria Lake', icon: '🚇', color: '#0066CC' },
  { name: 'Apparel Park Metro', lat: 23.0106, lng: 72.6181, type: 'metro', mode: 'metro', subtitle: 'Ahmedabad Metro • Blue Line Depot', icon: '🚇', color: '#0066CC' },
  { name: 'Amraiwadi Metro Station', lat: 23.0078, lng: 72.6286, type: 'metro', mode: 'metro', subtitle: 'Ahmedabad Metro • Blue Line East', icon: '🚇', color: '#0066CC' },
  { name: 'Rabari Colony Metro', lat: 23.0056, lng: 72.6356, type: 'metro', mode: 'metro', subtitle: 'Ahmedabad Metro • Blue Line (Expressway Link)', icon: '🚇', color: '#0066CC' },
  { name: 'Vastral Metro Station', lat: 23.0036, lng: 72.6475, type: 'metro', mode: 'metro', subtitle: 'Ahmedabad Metro • Blue Line', icon: '🚇', color: '#0066CC' },
  { name: 'Nirant Cross Road Metro', lat: 23.0003, lng: 72.6578, type: 'metro', mode: 'metro', subtitle: 'Ahmedabad Metro • Blue Line', icon: '🚇', color: '#0066CC' },
  { name: 'Vastral Gam Metro Terminal', lat: 22.9972, lng: 72.6678, type: 'metro', mode: 'metro', subtitle: 'Ahmedabad Metro • Blue Line East Terminal', icon: '🚇', color: '#0066CC' },

  // ── Metro Stations (Red Line - APMC to Motera Stadium) ──
  { name: 'Motera Stadium Metro', lat: 23.0967, lng: 72.6008, type: 'metro', mode: 'metro', subtitle: 'Narendra Modi Cricket Stadium • Red Line Terminal', icon: '🚇', color: '#CC0000' },
  { name: 'Sabarmati Metro Station', lat: 23.0856, lng: 72.5922, type: 'metro', mode: 'metro', subtitle: 'Ahmedabad Metro • Red Line (D-Cabin)', icon: '🚇', color: '#CC0000' },
  { name: 'AEC Metro Station', lat: 23.0780, lng: 72.5900, type: 'metro', mode: 'metro', subtitle: 'Ahmedabad Metro • Red Line (Naranpura/Sabarmati)', icon: '🚇', color: '#CC0000' },
  { name: 'Sabarmati Railway Station Metro', lat: 23.0697, lng: 72.5878, type: 'metro', mode: 'metro', subtitle: 'Sabarmati Junction Railway / HSR Bullet Train Hub', icon: '🚇', color: '#CC0000' },
  { name: 'Ranip Metro Station', lat: 23.0678, lng: 72.5742, type: 'metro', mode: 'metro', subtitle: 'Direct skywalk to Ranip GSRTC Central Bus Port', icon: '🚇', color: '#CC0000' },
  { name: 'Vadaj Metro Station', lat: 23.0678, lng: 72.5658, type: 'metro', mode: 'metro', subtitle: 'Ahmedabad Metro • Red Line Terminus', icon: '🚇', color: '#CC0000' },
  { name: 'Vijay Nagar Metro', lat: 23.0560, lng: 72.5654, type: 'metro', mode: 'metro', subtitle: 'Ahmedabad Metro • Red Line', icon: '🚇', color: '#CC0000' },
  { name: 'Usmanpura Metro Station', lat: 23.0460, lng: 72.5650, type: 'metro', mode: 'metro', subtitle: 'Ahmedabad Metro • Red Line (Ashram Road)', icon: '🚇', color: '#CC0000' },
  { name: 'Gandhigram Metro Station', lat: 23.0245, lng: 72.5685, type: 'metro', mode: 'metro', subtitle: 'Ahmedabad Metro • Near Ellisbridge & VS Hospital', icon: '🚇', color: '#CC0000' },
  { name: 'Paldi Metro Station', lat: 23.0060, lng: 72.5650, type: 'metro', mode: 'metro', subtitle: 'Ahmedabad Metro • Red Line (Paldi Cross Road)', icon: '🚇', color: '#CC0000' },
  { name: 'Shreyas Metro Station', lat: 23.0075, lng: 72.5535, type: 'metro', mode: 'metro', subtitle: 'Ahmedabad Metro • Red Line (Ambawadi)', icon: '🚇', color: '#CC0000' },
  { name: 'Rajiv Nagar Metro', lat: 23.0030, lng: 72.5448, type: 'metro', mode: 'metro', subtitle: 'Ahmedabad Metro • Red Line', icon: '🚇', color: '#CC0000' },
  { name: 'Jivraj Park Metro', lat: 22.9995, lng: 72.5390, type: 'metro', mode: 'metro', subtitle: 'Ahmedabad Metro • Red Line (Vejalpur)', icon: '🚇', color: '#CC0000' },
  { name: 'APMC Metro Station', lat: 22.9978, lng: 72.5372, type: 'metro', mode: 'metro', subtitle: 'Ahmedabad Metro • Red Line South Terminal (Vasna)', icon: '🚇', color: '#CC0000' },

  // ── Janmarg BRTS Corridors & Major Stops (Exact OpenStreetMap & Median Verified) ──
  { name: 'Iskcon Cross Road BRTS', lat: 23.0272, lng: 72.5085, type: 'brts', mode: 'brts', subtitle: 'Janmarg BRTS Corridors 4D & 12D • SG Highway', icon: '🚌', color: '#FF6B00' },
  { name: 'Ramdev Nagar BRTS', lat: 23.0271, lng: 72.5185, type: 'brts', mode: 'brts', subtitle: 'Janmarg BRTS Corridors 4D & 12D • Satellite Road Median', icon: '🚌', color: '#FF6B00' },
  { name: 'Star Bazaar BRTS', lat: 23.0270, lng: 72.5242, type: 'brts', mode: 'brts', subtitle: 'Janmarg BRTS Corridors 4D & 12D • Satellite Road Median (Star Bazaar)', icon: '🚌', color: '#FF6B00' },
  { name: 'Shivranjani BRTS Stop', lat: 23.0244, lng: 72.5302, type: 'brts', mode: 'brts', subtitle: 'Janmarg BRTS 132ft Ring Road Junction (1D, 4D, 8D, 12D)', icon: '🚌', color: '#FF6B00' },
  { name: 'Jhansi Ki Rani BRTS', lat: 23.0230, lng: 72.5370, type: 'brts', mode: 'brts', subtitle: 'Janmarg BRTS Corridor 1D • 132ft Ring Road', icon: '🚌', color: '#FF6B00' },
  { name: 'Himmatlal Park BRTS', lat: 23.0298, lng: 72.5324, type: 'brts', mode: 'brts', subtitle: 'Janmarg BRTS Corridors 1D & 8D • 132ft Ring Road', icon: '🚌', color: '#FF6B00' },
  { name: 'Nehrunagar BRTS Stop', lat: 23.0223, lng: 72.5428, type: 'brts', mode: 'brts', subtitle: 'Janmarg BRTS Circle • Satellite Road / 132ft Ring Road', icon: '🚌', color: '#FF6B00' },
  { name: 'Manekbaug BRTS', lat: 23.0160, lng: 72.5475, type: 'brts', mode: 'brts', subtitle: 'Janmarg BRTS Corridor 1D • Ambawadi Link', icon: '🚌', color: '#FF6B00' },
  { name: 'Dharnidhar BRTS', lat: 23.0100, lng: 72.5510, type: 'brts', mode: 'brts', subtitle: 'Janmarg BRTS Corridor 1D • Dharnidhar Derasar', icon: '🚌', color: '#FF6B00' },
  { name: 'Anjali Cross Road BRTS', lat: 23.0037, lng: 72.5539, type: 'brts', mode: 'brts', subtitle: 'Janmarg BRTS Southern Terminal Hub (Vasna)', icon: '🚌', color: '#FF6B00' },
  { name: 'Chandranagar BRTS', lat: 23.0030, lng: 72.5680, type: 'brts', mode: 'brts', subtitle: 'Janmarg BRTS Corridors 1D & 2D • Ambedkar Bridge', icon: '🚌', color: '#FF6B00' },
  { name: 'Danilimda BRTS Stop', lat: 23.0015, lng: 72.5830, type: 'brts', mode: 'brts', subtitle: 'Janmarg BRTS Corridors 1D & 2D • Calico Mills', icon: '🚌', color: '#FF6B00' },
  { name: 'Maninagar BRTS Terminus', lat: 22.9972, lng: 72.6064, type: 'brts', mode: 'brts', subtitle: 'Janmarg BRTS South Terminal • Maninagar Railway Stn', icon: '🚌', color: '#FF6B00' },
  { name: 'RTO Circle BRTS Terminus', lat: 23.0665, lng: 72.5839, type: 'brts', mode: 'brts', subtitle: 'Janmarg BRTS North Terminal • Subhash Bridge', icon: '🚌', color: '#FF6B00' },
  { name: 'Ranip Cross Road BRTS', lat: 23.0670, lng: 72.5730, type: 'brts', mode: 'brts', subtitle: 'Janmarg BRTS Corridor 1D • Ranip Junction', icon: '🚌', color: '#FF6B00' },
  { name: 'Akhbarnagar BRTS Stop', lat: 23.0674, lng: 72.5626, type: 'brts', mode: 'brts', subtitle: 'Janmarg BRTS Corridor 1D • Akhbarnagar Circle', icon: '🚌', color: '#FF6B00' },
  { name: 'Pragatinagar BRTS', lat: 23.0570, lng: 72.5520, type: 'brts', mode: 'brts', subtitle: 'Janmarg BRTS Corridor 1D • 132ft Ring Road', icon: '🚌', color: '#FF6B00' },
  { name: 'Shastri Nagar BRTS', lat: 23.0520, lng: 72.5460, type: 'brts', mode: 'brts', subtitle: 'Janmarg BRTS Corridor 1D • Naranpura Link', icon: '🚌', color: '#FF6B00' },
  { name: 'Nava Vadaj BRTS Stop', lat: 23.0576, lng: 72.5704, type: 'brts', mode: 'brts', subtitle: 'Janmarg BRTS Nava Vadaj Main Terminal', icon: '🚌', color: '#FF6B00' },
  { name: 'Helmet Cross Road BRTS', lat: 23.0452, lng: 72.5419, type: 'brts', mode: 'brts', subtitle: 'Janmarg BRTS • 132ft Ring Road x Drive-In Rd (Memnagar)', icon: '🚌', color: '#FF6B00' },
  { name: 'Memnagar BRTS Stop', lat: 23.0452, lng: 72.5419, type: 'brts', mode: 'brts', subtitle: 'Janmarg BRTS Corridors 1D & 8D • Helmet Circle', icon: '🚌', color: '#FF6B00' },
  { name: 'Panjrapole BRTS Stop', lat: 23.0398, lng: 72.5385, type: 'brts', mode: 'brts', subtitle: 'Janmarg BRTS Corridor 1D & 8D • University Road', icon: '🚌', color: '#FF6B00' },
  { name: 'Science City BRTS Terminus', lat: 23.0779, lng: 72.4948, type: 'brts', mode: 'brts', subtitle: 'Janmarg BRTS Corridor 8D Terminal • Science City', icon: '🚌', color: '#FF6B00' },
  { name: 'Sola Bhagwat BRTS', lat: 23.0652, lng: 72.5293, type: 'brts', mode: 'brts', subtitle: 'Janmarg BRTS Corridor 8D • SG Highway', icon: '🚌', color: '#FF6B00' },
  { name: 'Sola Bridge BRTS', lat: 23.0560, lng: 72.5340, type: 'brts', mode: 'brts', subtitle: 'Janmarg BRTS Corridor 8D • SG Highway Link', icon: '🚌', color: '#FF6B00' },
  { name: 'Gulab Tower BRTS', lat: 23.0490, lng: 72.5370, type: 'brts', mode: 'brts', subtitle: 'Janmarg BRTS Corridor 8D • Thaltej/Memnagar', icon: '🚌', color: '#FF6B00' },
  { name: 'Bopal Gam BRTS', lat: 23.0265, lng: 72.4822, type: 'brts', mode: 'brts', subtitle: 'Janmarg BRTS Corridor 12D Terminal • SP Ring Road', icon: '🚌', color: '#FF6B00' },
  { name: 'Ambli Gam BRTS', lat: 23.0280, lng: 72.4950, type: 'brts', mode: 'brts', subtitle: 'Janmarg BRTS Corridor 12D • Iskcon Link', icon: '🚌', color: '#FF6B00' },
  { name: 'Naroda Gam BRTS', lat: 23.0771, lng: 72.6558, type: 'brts', mode: 'brts', subtitle: 'Janmarg BRTS Corridors 2D & 4D • East Ahmedabad', icon: '🚌', color: '#FF6B00' },
  { name: 'Odhav Ring Road BRTS', lat: 23.0259, lng: 72.6725, type: 'brts', mode: 'brts', subtitle: 'Janmarg BRTS Corridor 8D Terminal • SP Ring Road', icon: '🚌', color: '#FF6B00' },
  { name: 'Soni ni Chali BRTS', lat: 23.0120, lng: 72.6320, type: 'brts', mode: 'brts', subtitle: 'Janmarg BRTS Corridor 8D • Expressway Junction', icon: '🚌', color: '#FF6B00' },
  { name: 'Kankaria Lake BRTS', lat: 23.0032, lng: 72.5990, type: 'brts', mode: 'brts', subtitle: 'Janmarg BRTS Corridors 1D, 2D, 12D • Gate 1', icon: '🚌', color: '#FF6B00' },
  { name: 'Raipur Darwaja BRTS', lat: 23.0180, lng: 72.5950, type: 'brts', mode: 'brts', subtitle: 'Janmarg BRTS Corridor 2D • Walled City Gate', icon: '🚌', color: '#FF6B00' },
  { name: 'Sarangpur Darwaja BRTS', lat: 23.0210, lng: 72.5990, type: 'brts', mode: 'brts', subtitle: 'Janmarg BRTS Corridor 2D • Near Old City Market', icon: '🚌', color: '#FF6B00' },
  { name: 'Geeta Mandir BRTS Stop', lat: 23.0135, lng: 72.5890, type: 'brts', mode: 'brts', subtitle: 'Janmarg BRTS Corridors 2D & 4D • ST Stand Gate', icon: '🚌', color: '#FF6B00' },
  { name: 'Kalupur Railway Station BRTS', lat: 23.0251, lng: 72.6031, type: 'brts', mode: 'brts', subtitle: 'Janmarg BRTS Corridors 2D & 4D • ADI Railway Junction', icon: '🚌', color: '#FF6B00' },

  // ── Indian Railway Stations ──
  { name: 'Ahmedabad Kalupur Junction', lat: 23.0251, lng: 72.6031, type: 'railway', mode: 'train', subtitle: 'Main Central Railway Station (ADI) • Vande Bharat & Rajdhani', icon: '🚆', color: '#6A1B9A' },
  { name: 'Sabarmati Junction Railway Stn', lat: 23.0697, lng: 72.5878, type: 'railway', mode: 'train', subtitle: 'Major North Junction (SBI) • Delhi / Rajasthan Lines', icon: '🚆', color: '#6A1B9A' },
  { name: 'Maninagar Railway Station', lat: 22.9996, lng: 72.5990, type: 'railway', mode: 'train', subtitle: 'South Ahmedabad Hub (MAN) • Mumbai Express Stoppages', icon: '🚆', color: '#6A1B9A' },
  { name: 'Gandhinagar Capital Station', lat: 23.2320, lng: 72.6390, type: 'railway', mode: 'train', subtitle: 'Capital 5-Star Hotel Station (GNC) • Vande Bharat Terminal', icon: '🚆', color: '#6A1B9A' },
  { name: 'Chandlodiya Railway Station', lat: 23.0780, lng: 72.5370, type: 'railway', mode: 'train', subtitle: 'West Ahmedabad Station (CLDY)', icon: '🚆', color: '#6A1B9A' },
  { name: 'Asarva Railway Station', lat: 23.0450, lng: 72.6020, type: 'railway', mode: 'train', subtitle: 'Broad Gauge Udaipur / North Gujarat Line (ASV)', icon: '🚆', color: '#6A1B9A' },

  // ── GSRTC Bus Stands & Bus Ports ──
  { name: 'Geeta Mandir Central Bus Station', lat: 23.0135, lng: 72.5890, type: 'state_bus', mode: 'state_bus', subtitle: 'GSRTC Main State Bus Depot • AC Volvo & Express', icon: '🚍', color: '#2E7D32' },
  { name: 'Paldi Central Bus Stand', lat: 23.0160, lng: 72.5645, type: 'state_bus', mode: 'state_bus', subtitle: 'GSRTC Saurashtra & Mumbai Volvo Terminal', icon: '🚍', color: '#2E7D32' },
  { name: 'Ranip Bus Port (Modern Terminal)', lat: 23.0610, lng: 72.5620, type: 'state_bus', mode: 'state_bus', subtitle: 'Modern Airport-style GSRTC Terminal • North Gujarat', icon: '🚍', color: '#2E7D32' },
  { name: 'ISCON Cross Road GSRTC Pick-up', lat: 23.0280, lng: 72.5075, type: 'state_bus', mode: 'state_bus', subtitle: 'Highway Volvo Pick-up Point • Rajkot & Saurashtra', icon: '🚍', color: '#2E7D32' },
  { name: 'C.T.M. Cross Road Express Bus Stand', lat: 22.9960, lng: 72.6320, type: 'state_bus', mode: 'state_bus', subtitle: 'Express Highway Pick-up • Vadodara & Surat Expressways', icon: '🚍', color: '#2E7D32' },
  { name: 'Subhash Bridge Depot', lat: 23.0645, lng: 72.5800, type: 'state_bus', mode: 'state_bus', subtitle: 'GSRTC Subhash Bridge Bus Depot', icon: '🚍', color: '#2E7D32' },

  // ── Key Ahmedabad Landmarks & Commercial Hubs ──
  { name: 'Vastrapur Lake', lat: 23.0384, lng: 72.5289, type: 'landmark', mode: 'auto', subtitle: 'Vastrapur Open Theatre & Amphitheatre', icon: '📍', color: '#EA4335' },
  { name: 'IIM Ahmedabad (Vastrapur)', lat: 23.0325, lng: 72.5310, type: 'landmark', mode: 'auto', subtitle: 'Indian Institute of Management • Heritage & New Campus', icon: '📍', color: '#EA4335' },
  { name: 'Alpha One / Ahmedabad One Mall', lat: 23.0400, lng: 72.5310, type: 'landmark', mode: 'auto', subtitle: 'Vastrapur Shopping & Entertainment Mall', icon: '📍', color: '#EA4335' },
  { name: 'Law Garden (Navrangpura)', lat: 23.0250, lng: 72.5590, type: 'landmark', mode: 'auto', subtitle: 'Night Market, Handicrafts & Food Street', icon: '📍', color: '#EA4335' },
  { name: 'Science City Ahmedabad', lat: 23.0750, lng: 72.5110, type: 'landmark', mode: 'auto', subtitle: 'Aquatic Gallery, Robotics & IMAX Theatre', icon: '📍', color: '#EA4335' },
  { name: 'Sabarmati Riverfront', lat: 23.0350, lng: 72.5710, type: 'landmark', mode: 'auto', subtitle: 'Riverfront Promenade, Flower Park & Atal Bridge', icon: '📍', color: '#EA4335' },
  { name: 'Kankaria Lake Front', lat: 23.0064, lng: 72.5975, type: 'landmark', mode: 'auto', subtitle: 'Lake Zoo, Balvatika, Toy Train & Naginawadi', icon: '📍', color: '#EA4335' },
  { name: 'Narendra Modi Stadium (Motera)', lat: 23.0967, lng: 72.6008, type: 'landmark', mode: 'auto', subtitle: 'World’s Largest Cricket Stadium • Motera', icon: '📍', color: '#EA4335' },
  { name: 'Sindhu Bhavan Road (SBR)', lat: 23.0440, lng: 72.5020, type: 'landmark', mode: 'auto', subtitle: 'Premium Lifestyle, Cafes & Business Hub', icon: '📍', color: '#EA4335' },
  { name: 'SG Highway (Sarkhej-Gandhinagar)', lat: 23.0380, lng: 72.5120, type: 'landmark', mode: 'auto', subtitle: 'Primary IT & Corporate Commercial Corridor', icon: '📍', color: '#EA4335' },
  { name: 'Sardar Vallabhbhai Patel Airport (AMD)', lat: 23.0772, lng: 72.6347, type: 'landmark', mode: 'auto', subtitle: 'International & Domestic Terminals T1 / T2', icon: '✈️', color: '#EA4335' },
  { name: 'GIFT City (Gandhinagar)', lat: 23.1610, lng: 72.6840, type: 'landmark', mode: 'auto', subtitle: 'Gujarat International Finance Tec-City', icon: '🏢', color: '#EA4335' },

  // ── Outstation / Intercity Regional Hubs ──
  { name: 'Vadodara (Baroda)', lat: 22.3072, lng: 73.1812, type: 'city', mode: 'state_bus', subtitle: 'Expressway Bus (1h 45m) & Vande Bharat Trains', icon: '🌆', color: '#00897B' },
  { name: 'Gandhinagar Pathika', lat: 23.2156, lng: 72.6369, type: 'city', mode: 'state_bus', subtitle: 'State Capital • GSRTC Bus Every 10 min', icon: '🌆', color: '#00897B' },
  { name: 'Surat Central', lat: 21.1702, lng: 72.8311, type: 'city', mode: 'state_bus', subtitle: 'Diamond City • Express Trains & GSRTC Sleeper', icon: '🌆', color: '#00897B' },
  { name: 'Rajkot (Shastri Maidan)', lat: 22.3039, lng: 70.8022, type: 'city', mode: 'state_bus', subtitle: 'Saurashtra Hub • GSRTC Volvo & Intercity Trains', icon: '🌆', color: '#00897B' },
  { name: 'Bhavnagar (ST Stand)', lat: 21.7645, lng: 72.1519, type: 'city', mode: 'state_bus', subtitle: 'GSRTC Express Buses (Every 30m)', icon: '🌆', color: '#00897B' },
  { name: 'Bhuj (Kutch)', lat: 23.2420, lng: 69.6669, type: 'city', mode: 'state_bus', subtitle: 'GSRTC Volvo AC Sleeper & Kutch Express', icon: '🌆', color: '#00897B' },
  { name: 'Somnath / Veraval', lat: 20.9010, lng: 70.4010, type: 'city', mode: 'state_bus', subtitle: 'Sleeper AC Express & Somnath Superfast', icon: '🌆', color: '#00897B' },
  { name: 'Mumbai Central (MMCT)', lat: 18.9696, lng: 72.8193, type: 'city', mode: 'train', subtitle: 'Vande Bharat (6h 15m) & Mumbai Rajdhani Express', icon: '🌆', color: '#6A1B9A' },
  { name: 'New Delhi (NDLS)', lat: 28.6431, lng: 77.2223, type: 'city', mode: 'train', subtitle: 'Swarna Jayanti Rajdhani & Ashram Express', icon: '🌆', color: '#6A1B9A' }
];

// Distance & Geography Helpers
function calcDistanceKm(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return 0;
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function formatDistBadge(distKm) {
  if (distKm == null || isNaN(distKm)) return 'Distance unavailable';
  if (distKm < 1) {
    const meters = Math.max(50, Math.round(distKm * 1000));
    const walkMin = Math.max(1, Math.round(meters / 75));
    return `📍 ${meters}m away • ~${walkMin}m walk`;
  } else if (distKm < 45) {
    const driveMin = Math.max(3, Math.round(distKm * 2.3));
    return `📍 ${distKm.toFixed(1)} km away • ~${driveMin} min`;
  } else {
    const driveHours = (distKm / 65).toFixed(1);
    return `📍 ${Math.round(distKm)} km away • ~${driveHours}h`;
  }
}

function findNearestLandmark(lat, lng) {
  let nearest = null;
  let minDist = Infinity;
  for (const place of AHMEDABAD_TRANSIT_PLACES) {
    const d = calcDistanceKm(lat, lng, place.lat, place.lng);
    if (d < minDist) {
      minDist = d;
      nearest = place;
    }
  }
  return { place: nearest, distKm: minDist };
}

function highlightMatch(text, query) {
  if (!query) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  return text.replace(regex, '<span class="suggest-highlight">$1</span>');
}

function escapeHtml(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function clearMiniMaps() {
  miniMapInstances.forEach(m => {
    if (m && m.remove) m.remove();
  });
  miniMapInstances = [];
}

function clearMultimodalLayers() {
  if (multimodalActiveLayer) {
    removeMapLayer(multimodalActiveLayer);
    multimodalActiveLayer = null;
  }
  multimodalMarkers.forEach(m => removeMapLayer(m));
  multimodalMarkers = [];
}

function clearPinnedDest(screen) {
  if (pinnedDestMarker) {
    removeMapLayer(pinnedDestMarker);
    pinnedDestMarker = null;
  }
  currentPinnedLocation = null;
  const card = screen?.querySelector('#pinned-dest-card') || document.getElementById('pinned-dest-card');
  if (card) card.style.display = 'none';
  const pinBtn = screen?.querySelector('#btn-pin-dest') || document.getElementById('btn-pin-dest');
  if (pinBtn) pinBtn.classList.remove('active');
  isPinModeActive = false;
}

function setPinnedDestination(screen, lat, lng, customName = null) {
  if (!map) return;
  const userPos = locationService.getPosition();
  const distKm = calcDistanceKm(userPos.lat, userPos.lng, lat, lng);
  const nearest = findNearestLandmark(lat, lng);

  let destName = customName;
  if (!destName) {
    if (nearest.place && nearest.distKm < 0.25) {
      destName = nearest.place.name;
    } else if (nearest.place && nearest.distKm < 1.2) {
      destName = `Near ${nearest.place.name} (~${Math.round(nearest.distKm * 1000)}m)`;
    } else {
      destName = `Pinned Location (${lat.toFixed(4)}°, ${lng.toFixed(4)}°)`;
    }
  }

  currentPinnedLocation = {
    lat,
    lng,
    name: destName,
    distKm,
    nearestPlace: nearest.place
  };

  const pinHtml = `
    <div class="custom-pin-wrapper">
      <div class="custom-pin-pulse"></div>
      <div class="custom-pin-head">📍</div>
      <div class="custom-pin-point"></div>
    </div>
  `;

  if (!pinnedDestMarker) {
    pinnedDestMarker = addCustomMarkerLayer([lat, lng], pinHtml, {
      className: 'custom-pinned-marker',
      anchorX: 19,
      anchorY: 46,
      width: 38,
      height: 48,
      zIndex: 1500,
      interactive: true
    });
  } else {
    pinnedDestMarker.setLatLng([lat, lng]);
  }

  // Update floating pinned card
  const card = screen.querySelector('#pinned-dest-card') || document.getElementById('pinned-dest-card');
  const nameEl = screen.querySelector('#pinned-dest-name') || document.getElementById('pinned-dest-name');
  const coordsEl = screen.querySelector('#pinned-dest-coords') || document.getElementById('pinned-dest-coords');
  const distEl = screen.querySelector('#pinned-dest-dist') || document.getElementById('pinned-dest-dist');
  const pinBtn = screen.querySelector('#btn-pin-dest') || document.getElementById('btn-pin-dest');

  if (nameEl) nameEl.textContent = destName;
  if (coordsEl) {
    coordsEl.textContent = `${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E ${nearest.place ? `• ${nearest.place.subtitle || nearest.place.name}` : ''}`;
  }
  if (distEl) {
    distEl.innerHTML = `<strong>${formatDistBadge(distKm)}</strong> from your GPS location`;
  }
  if (card) {
    card.style.display = 'flex';
    card.classList.remove('animate-pop');
    void card.offsetWidth;
    card.classList.add('animate-pop');
  }
  if (pinBtn) pinBtn.classList.add('active');
  isPinModeActive = true;
}


function clearDiscoverLayers() {
  Object.keys(discoverLayers).forEach(key => {
    discoverLayers[key].forEach(layer => removeMapLayer(layer));
    discoverLayers[key] = [];
  });
  hideStopInspector();
}

function hideStopInspector() {
  inspectorSelectedStop = null;
  const card = document.getElementById('transit-inspector-card');
  if (card) card.style.display = 'none';
}

function showStopInspector(screen, stopInfo) {
  inspectorSelectedStop = stopInfo;
  const card = screen.querySelector('#transit-inspector-card') || document.getElementById('transit-inspector-card');
  if (!card) return;

  const badgeEl = card.querySelector('#insp-mode-badge');
  const nameEl = card.querySelector('#insp-name');
  const fareEl = card.querySelector('#insp-fare');
  const subEl = card.querySelector('#insp-sub');
  const distEl = card.querySelector('#insp-dist');
  const freqEl = card.querySelector('#insp-freq');

  const userPos = locationService.getPosition();
  const distKm = calcDistanceKm(userPos.lat, userPos.lng, stopInfo.lat, stopInfo.lng);

  if (badgeEl) {
    badgeEl.textContent = `${stopInfo.icon || '📍'} ${stopInfo.type?.toUpperCase() || 'TRANSIT'}`;
    badgeEl.style.background = `${stopInfo.color || '#22A147'}22`;
    badgeEl.style.borderColor = stopInfo.color || '#22A147';
    badgeEl.style.color = stopInfo.color || '#22A147';
  }
  if (nameEl) nameEl.textContent = stopInfo.name;
  if (fareEl) fareEl.textContent = stopInfo.fare || (stopInfo.type === 'metro' ? '₹15' : stopInfo.type === 'brts' ? '₹12' : '₹10');
  if (subEl) subEl.textContent = stopInfo.subtitle || `${stopInfo.type} stop in Ahmedabad`;
  if (distEl) distEl.textContent = formatDistBadge(distKm);
  if (freqEl) freqEl.textContent = `⏱️ ${stopInfo.freq || (stopInfo.type === 'metro' ? 'Every 7 mins' : 'Every 5 mins')}`;

  const bookBtn = card.querySelector('#btn-insp-book');
  if (bookBtn) {
    if (stopInfo.type === 'metro') {
      bookBtn.style.display = 'block';
      bookBtn.textContent = '🚇 Book on GMRC ↗';
      bookBtn.style.background = 'linear-gradient(135deg, #0066CC, #004499)';
      bookBtn.style.color = '#fff';
    } else if (stopInfo.type === 'brts') {
      bookBtn.style.display = 'block';
      bookBtn.textContent = '🚌 Book on Janmarg ↗';
      bookBtn.style.background = 'linear-gradient(135deg, #FF6B00, #CC5500)';
      bookBtn.style.color = '#fff';
    } else if (stopInfo.type === 'shuttle') {
      bookBtn.style.display = 'block';
      bookBtn.textContent = '⚡ 1-Tap Pay Wallet';
      bookBtn.style.background = 'linear-gradient(135deg, #F59E0B, #D97706)';
      bookBtn.style.color = '#000';
    } else if (stopInfo.type === 'bus' || stopInfo.type === 'state_bus') {
      bookBtn.style.display = 'block';
      bookBtn.textContent = '🚍 Book GSRTC';
      bookBtn.style.background = 'linear-gradient(135deg, #2E7D32, #1B5E20)';
      bookBtn.style.color = '#fff';
    } else if (stopInfo.type === 'train') {
      bookBtn.style.display = 'block';
      bookBtn.textContent = '🚆 Book IRCTC';
      bookBtn.style.background = 'linear-gradient(135deg, #6A1B9A, #4A148C)';
      bookBtn.style.color = '#fff';
    } else {
      bookBtn.style.display = 'none';
    }
  }

  card.style.display = 'flex';
  card.classList.remove('animate-pop');
  void card.offsetWidth;
  card.classList.add('animate-pop');
}

function renderDiscoverMode(screen, activeFilter = 'all') {
  if (!map) return;
  clearDiscoverLayers();
  clearMultimodalLayers();
  clearPinnedDest(screen);

  // Stop auto rickshaw animation & hide shuttles in discover mode
  autoMarkers.forEach(({ marker }) => removeMapLayer(marker));
  routeLayers.forEach(l => removeMapLayer(l));

  // Turn on Google Maps native TransitLayer (Metro, BRTS, Railway, Bus Stations)
  if (isGoogleMapEngine && transitLayer) {
    transitLayer.setMap(map);
  }

  // Draw high-contrast dedicated transit corridor lines (Metro & Janmarg BRTS)
  if (activeFilter === 'all' || activeFilter === 'metro') {
    if (liveMetroLines && liveMetroLines.length > 0) {
      liveMetroLines.forEach(line => {
        if (!line.path || line.path.length < 2) return;
        const poly = addPolylineLayer(line.path, {
          color: line.color || '#0066CC',
          weight: 6,
          opacity: 0.95,
          zIndex: 130,
          onClick: () => {
            showStopInspector(screen, {
              name: line.name,
              type: 'metro',
              subtitle: `${line.system_name || 'Ahmedabad Metro'} • ${line.from_station} to ${line.to_station}`,
              fare: '₹15',
              freq: `Every ${line.frequency_minutes || 7} mins`,
              lat: line.stations && line.stations[0] ? line.stations[0].lat : 23.0519,
              lng: line.stations && line.stations[0] ? line.stations[0].lng : 72.5056,
              icon: '🚇',
              color: line.color || '#0066CC'
            });
          }
        });
        if (poly) discoverLayers.metro.push(poly);
      });
    } else {
      const blueLine = addPolylineLayer(METRO_BLUE_PATH, {
        color: '#0066CC', weight: 6, opacity: 0.9, zIndex: 120
      });
      if (blueLine) discoverLayers.metro.push(blueLine);

      const redLine = addPolylineLayer(METRO_RED_PATH, {
        color: '#CC0000', weight: 6, opacity: 0.9, zIndex: 120
      });
      if (redLine) discoverLayers.metro.push(redLine);
    }
  }

  if (activeFilter === 'all' || activeFilter === 'brts') {
    liveBrtsRoutes.forEach(brts => {
      const pl = addPolylineLayer(brts.path, {
        color: brts.color || '#FF6B00', weight: 6, opacity: 0.9, zIndex: 150,
        onClick: () => {
          showStopInspector(screen, {
            name: brts.name,
            type: 'brts',
            subtitle: `Corridor ${brts.id} • ${brts.stops.length} Stops • ${brts.freq || 'Every 4-5 mins'}`,
            fare: brts.fare || '₹10',
            freq: brts.freq || 'Every 4 mins',
            lat: brts.stops[0].lat,
            lng: brts.stops[0].lng,
            icon: '🚌',
            color: '#FF6B00'
          });
        }
      });
      if (pl) discoverLayers.brts.push(pl);
    });
  }

  // Interactive Transit Station Markers (clickable to inspect, see schedule, and book tickets)
  if (activeFilter === 'all' || activeFilter === 'metro') {
    AHMEDABAD_TRANSIT_PLACES.filter(p => p.type === 'metro').forEach(station => {
      const m = addCustomMarkerLayer([station.lat, station.lng], `<div class="disc-marker-inner" style="background:#0066CC;">🚇</div>`, {
        className: 'disc-marker metro-marker',
        anchorX: 13,
        anchorY: 13,
        width: 26,
        height: 26,
        zIndex: 700,
        onClick: () => showStopInspector(screen, station)
      });
      if (m) discoverLayers.metro.push(m);
    });
  }

  if (activeFilter === 'all' || activeFilter === 'brts') {
    AHMEDABAD_TRANSIT_PLACES.filter(p => p.type === 'brts').forEach(stop => {
      const m = addCustomMarkerLayer([stop.lat, stop.lng], `<div class="disc-marker-inner" style="background:#FF6B00;">🚌</div>`, {
        className: 'disc-marker brts-marker',
        anchorX: 12,
        anchorY: 12,
        width: 24,
        height: 24,
        zIndex: 650,
        onClick: () => showStopInspector(screen, stop)
      });
      if (m) discoverLayers.brts.push(m);
    });
  }

  if (activeFilter === 'all' || activeFilter === 'train') {
    AHMEDABAD_TRANSIT_PLACES.filter(p => p.type === 'railway').forEach(stn => {
      const m = addCustomMarkerLayer([stn.lat, stn.lng], `<div class="disc-marker-inner" style="background:#6A1B9A;">🚆</div>`, {
        className: 'disc-marker railway-marker',
        anchorX: 14,
        anchorY: 14,
        width: 28,
        height: 28,
        zIndex: 800,
        onClick: () => showStopInspector(screen, stn)
      });
      if (m) discoverLayers.train.push(m);
    });
  }

  if (activeFilter === 'all' || activeFilter === 'state_bus') {
    AHMEDABAD_TRANSIT_PLACES.filter(p => p.type === 'state_bus').forEach(stand => {
      const m = addCustomMarkerLayer([stand.lat, stand.lng], `<div class="disc-marker-inner" style="background:#2E7D32;">🚍</div>`, {
        className: 'disc-marker bus-stand-marker',
        anchorX: 13,
        anchorY: 13,
        width: 26,
        height: 26,
        zIndex: 750,
        onClick: () => showStopInspector(screen, stand)
      });
      if (m) discoverLayers.state_bus.push(m);
    });
  }

  renderDiscoverBottomSheet(screen, activeFilter);
}

function renderDiscoverBottomSheet(screen, activeFilter) {
  const list = screen.querySelector('#routes-list');
  if (!list) return;

  clearMiniMaps();
  list.innerHTML = '';

  const header = document.createElement('div');
  header.className = 'discover-sheet-header';
  
  let title = '🌐 Ahmedabad Public Transit Network';
  let sub = 'Explore Metro, BRTS, Railways & State Buses. Tap any station or line to inspect.';
  
  if (activeFilter === 'metro') {
    title = '🚇 Ahmedabad Metro (Blue & Red Lines)';
    sub = 'Frequent metro trains every 7-8 min • Traffic-free AC transit.';
  } else if (activeFilter === 'brts') {
    title = '🚌 Janmarg BRTS Dedicated Corridors';
    sub = '9 Janmarg Corridors • 116 Median Stations • Fares from ₹5.';
  } else if (activeFilter === 'train') {
    title = '🚆 Indian Railways (Kalupur & Sabarmati)';
    sub = 'Vande Bharat, Superfast, Mail/Express hubs.';
  } else if (activeFilter === 'state_bus') {
    title = '🚍 GSRTC State Bus Ports';
    sub = 'Geeta Mandir Central, Ranip Bus Port & Highway Pickups.';
  }

  header.innerHTML = `
    <div class="discover-sheet-title">${title}</div>
    <div class="discover-sheet-sub">${sub}</div>
  `;
  list.appendChild(header);

  if (activeFilter === 'metro' || activeFilter === 'all') {
    if (liveMetroLines && liveMetroLines.length > 0) {
      const metroSec = document.createElement('div');
      metroSec.className = 'discover-corridors-section';
      metroSec.innerHTML = `<div style="font-size: 13px; font-weight: 700; color: #0066CC; margin: 10px 12px 6px; text-transform: uppercase; letter-spacing: 0.5px;">🚇 Ahmedabad Metro Rail Lines</div>`;

      liveMetroLines.forEach(mLine => {
        const card = document.createElement('div');
        card.className = 'discover-transit-card brts-corridor-highlight-card';
        card.style.borderLeft = `4px solid ${mLine.color || '#0066CC'}`;
        card.innerHTML = `
          <div class="disc-card-icon" style="background:${mLine.color || '#0066CC'};">🚇</div>
          <div class="disc-card-content">
            <div class="disc-card-name">${mLine.name}</div>
            <div class="disc-card-sub">${mLine.stations ? mLine.stations.length : mLine.total_stations} Stations • Every ${mLine.frequency_minutes || 7} mins • ₹15</div>
          </div>
          <div class="disc-card-dist">
            <span class="dest-dist-pill" style="background: rgba(0,102,204,0.15); color: ${mLine.color || '#0066CC'}; font-weight: 700;">${mLine.code}</span>
          </div>
        `;
        card.addEventListener('click', () => {
          if (mLine.path && mLine.path.length > 0) {
            fitMapBounds(mLine.path, 50);
          }
          showStopInspector(screen, {
            name: mLine.name,
            type: 'metro',
            subtitle: `${mLine.system_name || 'Ahmedabad Metro'} • ${mLine.from_station} to ${mLine.to_station}`,
            fare: '₹15',
            freq: `Every ${mLine.frequency_minutes || 7} mins`,
            lat: mLine.stations && mLine.stations[0] ? mLine.stations[0].lat : 23.0519,
            lng: mLine.stations && mLine.stations[0] ? mLine.stations[0].lng : 72.5056,
            icon: '🚇',
            color: mLine.color || '#0066CC'
          });
        });
        metroSec.appendChild(card);
      });
      list.appendChild(metroSec);
    }
  }

  if (activeFilter === 'brts' || activeFilter === 'all') {
    const corridorSection = document.createElement('div');
    corridorSection.className = 'discover-corridors-section';
    corridorSection.innerHTML = `<div style="font-size: 13px; font-weight: 700; color: #FF6B00; margin: 10px 12px 6px; text-transform: uppercase; letter-spacing: 0.5px;">⚡ Janmarg BRTS Corridors</div>`;
    
    liveBrtsRoutes.forEach(corridor => {
      const card = document.createElement('div');
      card.className = 'discover-transit-card brts-corridor-highlight-card';
      card.style.borderLeft = `4px solid ${corridor.color || '#FF6B00'}`;
      card.innerHTML = `
        <div class="disc-card-icon" style="background:${corridor.color || '#FF6B00'};">🚌</div>
        <div class="disc-card-content">
          <div class="disc-card-name">${corridor.name}</div>
          <div class="disc-card-sub">${corridor.stops.length} Stops • ${corridor.freq || 'Every 4 mins'} • ${corridor.fare || '₹10'}</div>
        </div>
        <div class="disc-card-dist">
          <span class="dest-dist-pill" style="background: rgba(255,107,0,0.15); color: #FF6B00; font-weight: 700;">Corridor ${corridor.id}</span>
        </div>
      `;
      card.addEventListener('click', () => {
        fitMapBounds(corridor.path, 50);
        showStopInspector(screen, {
          name: corridor.name,
          type: 'brts',
          subtitle: `Dedicated BRTS Road Corridor ${corridor.id} (${corridor.stops.length} Median Stations)`,
          fare: corridor.fare || '₹10',
          freq: corridor.freq || 'Every 4 mins',
          lat: corridor.stops[0].lat,
          lng: corridor.stops[0].lng,
          icon: '🚌',
          color: '#FF6B00'
        });
      });
      corridorSection.appendChild(card);
    });
    list.appendChild(corridorSection);

    if (activeFilter === 'brts') {
      const stopsHeader = document.createElement('div');
      stopsHeader.innerHTML = `<div style="font-size: 13px; font-weight: 700; color: var(--text-secondary, #666); margin: 14px 12px 6px; text-transform: uppercase; letter-spacing: 0.5px;">📍 Individual BRTS Median Stations</div>`;
      list.appendChild(stopsHeader);
    }
  }

  let placesToShow = [];
  if (activeFilter === 'all') {
    placesToShow = AHMEDABAD_TRANSIT_PLACES.slice(0, 10);
  } else {
    placesToShow = AHMEDABAD_TRANSIT_PLACES.filter(p => p.type === activeFilter);
  }

  const userPos = locationService.getPosition();

  placesToShow.forEach(p => {
    const distKm = calcDistanceKm(userPos.lat, userPos.lng, p.lat, p.lng);
    const card = document.createElement('div');
    card.className = 'discover-transit-card';
    card.innerHTML = `
      <div class="disc-card-icon" style="background:${p.color || '#22A147'};">
        ${p.icon || '📍'}
      </div>
      <div class="disc-card-content">
        <div class="disc-card-name">${p.name}</div>
        <div class="disc-card-sub">${p.subtitle || p.type}</div>
      </div>
      <div class="disc-card-dist">
        <span class="dest-dist-pill">${formatDistBadge(distKm)}</span>
      </div>
    `;

    card.addEventListener('click', () => {
      panMap(p.lat, p.lng, 15);
      showStopInspector(screen, p);
    });

    list.appendChild(card);
  });
}

function setAppMode(screen, mode) {
  activeMapMode = mode;
  const shuttleBtn = screen.querySelector('#btn-mode-shuttle');
  const discoverBtn = screen.querySelector('#btn-mode-discover');
  const filterBar = screen.querySelector('#discover-filter-bar');
  const quickChips = screen.querySelector('#map-quick-chips');
  const searchInput = screen.querySelector('#dest-search-input');
  const inspectorCard = screen.querySelector('#transit-inspector-card');

  if (mode === 'shuttle') {
    shuttleBtn?.classList.add('active');
    discoverBtn?.classList.remove('active');
    if (filterBar) filterBar.style.display = 'none';
    if (quickChips) quickChips.style.display = 'flex';
    if (inspectorCard) inspectorCard.style.display = 'none';
    if (searchInput) searchInput.placeholder = 'Search shuttle stop (e.g. Thaltej, Gurukul)...';

    // Disable Google TransitLayer in Shuttle Mode to keep clean map for Shuttles
    if (isGoogleMapEngine && transitLayer) {
      transitLayer.setMap(null);
    }

    clearDiscoverLayers();
    clearMultimodalLayers();
    clearPinnedDest(screen);
    drawRoutes(routesData);
    renderStopsList(screen, routesData);
    startAutoAnimation();

    const p = locationService.getPosition();
    panMap(p.lat, p.lng, 14);
  } else {
    // Discover Mode (All transit routes on map by default, Shuttles HIDDEN)
    discoverBtn?.classList.add('active');
    shuttleBtn?.classList.remove('active');
    if (filterBar) filterBar.style.display = 'flex';
    if (quickChips) quickChips.style.display = 'none';
    if (searchInput) searchInput.placeholder = 'Search or pin Metro, BRTS, Station, Landmark...';

    renderDiscoverMode(screen, discoverActiveFilter);
    const p = locationService.getPosition();
    panMap(p.lat, p.lng, 13);
  }
}

export function createMapScreen(params = {}) {
  const screen = document.createElement('div');
  screen.className = 'screen map-screen';
  screen.id = 'map-screen';

  screen.innerHTML = `
    <div id="map-container"></div>
    
    <!-- Top Header with Menu, Mode Switcher & Recenter -->
    <div class="map-header">
      <button class="btn-profile" id="btn-open-drawer" aria-label="Open menu">
        <div class="btn-profile-circle" style="padding:0;overflow:hidden;">${icons.user}</div>
        <span class="btn-profile-label">Menu</span>
      </button>

      <!-- Primary Mode Switcher: Shuttle (Priority Default) vs Discover (City Transit Explorer) -->
      <div class="map-mode-switcher" id="map-mode-switcher">
        <button class="mode-switch-btn active" id="btn-mode-shuttle" data-mode="shuttle" title="Direct ₹10 Shared Shuttles">
          <span class="mode-icon">🛺</span>
          <span class="mode-text">Shuttles</span>
        </button>
        <button class="mode-switch-btn" id="btn-mode-discover" data-mode="discover" title="Explore Metro, BRTS & City Transit">
          <span class="mode-icon">🧭</span>
          <span class="mode-text">Discover</span>
        </button>
      </div>

      <!-- Cashless Pre-loaded Wallet -->
      <button class="btn-wallet-badge" id="btn-open-wallet" title="CHALO Cashless Wallet (Zero network lag)">
        <span class="wallet-badge-icon">💳</span>
        <span class="wallet-amount" id="header-wallet-amount">₹150</span>
      </button>

      <div class="map-engine-badge" id="map-engine-badge" style="font-size:0.7rem;font-weight:700;padding:6px 10px;border-radius:20px;background:rgba(255,255,255,0.92);color:#1A73E8;display:flex;align-items:center;gap:4px;box-shadow:0 2px 8px rgba(0,0,0,0.15);pointer-events:auto;border:1px solid rgba(26,115,232,0.2);">
        <span>🗺️ Google Maps</span>
      </div>

      <button class="btn-locate" id="btn-recenter" aria-label="Re-center">
        ${icons.crosshair}
      </button>
    </div>

    <!-- Multimodal Destination Search Bar -->
    <div class="map-search-box" id="map-search-box">
      <div class="map-search-input-wrapper">
        <span class="map-search-icon">${icons.search}</span>
        <input type="text" class="map-search-input" id="dest-search-input" placeholder="Search shuttle stop (e.g. Thaltej, Gurukul)..." autocomplete="off" />
        <button class="map-search-clear" id="dest-search-clear" style="display:none;" title="Clear search">✕</button>
        <button class="btn-pin-toggle" id="btn-pin-dest" title="Pin destination on map">
          <span class="pin-icon">📍</span>
          <span class="pin-label">Pin Map</span>
        </button>
      </div>

      <!-- Real-time Autocomplete Suggestions Dropdown with Live Distance -->
      <div class="dest-autocomplete-dropdown" id="dest-autocomplete-dropdown" style="display:none;"></div>
      
      <!-- Discover Mode Interactive Transit Filter Bar (Active in Discover mode) -->
      <div class="discover-filter-bar" id="discover-filter-bar" style="display:none;">
        <button class="disc-filter-chip active" data-filter="all">🌐 All Transit</button>
        <button class="disc-filter-chip" data-filter="metro">🚇 Metro</button>
        <button class="disc-filter-chip" data-filter="brts">🚌 BRTS</button>
        <button class="disc-filter-chip" data-filter="train">🚆 Railways</button>
        <button class="disc-filter-chip" data-filter="state_bus">🚍 State Bus</button>
      </div>

      <!-- Quick Destination Chips (Active in Shuttle mode) -->
      <div class="map-quick-chips" id="map-quick-chips">
        <button class="dest-chip" data-dest="Thaltej">🛺 Thaltej (₹10)</button>
        <button class="dest-chip" data-dest="Gurukul">🛺 Gurukul (₹8)</button>
        <button class="dest-chip" data-dest="Vastrapur">🛺 Vastrapur (₹10)</button>
        <button class="dest-chip" data-dest="Gujarat University">🛺 GU Campus (₹10)</button>
        <button class="dest-chip" data-dest="Navrangpura">🛺 Navrangpura (₹10)</button>
        <button class="dest-chip" data-dest="Satellite Road">🛺 Satellite (₹10)</button>
      </div>
    </div>

    <!-- Floating Pinned Destination Card with Live Distance & Instant Actions -->
    <div class="pinned-dest-card" id="pinned-dest-card" style="display:none;">
      <div class="pinned-card-header">
        <div class="pinned-card-title-row">
          <div class="pinned-card-badge">📍 Pinned Destination</div>
          <button class="pinned-card-close" id="btn-pin-close" title="Clear pin">✕</button>
        </div>
        <div class="pinned-card-name" id="pinned-dest-name">Selected Location</div>
        <div class="pinned-card-coords" id="pinned-dest-coords">23.0339° N, 72.5562° E</div>
      </div>
      <div class="pinned-card-dist-bar">
        <span class="pinned-dist-icon">🚶/🚗</span>
        <span class="pinned-dist-text" id="pinned-dest-dist">Calculating distance from you...</span>
      </div>
      <div class="pinned-card-actions">
        <button class="pinned-btn-compare" id="btn-pin-compare">
          ⚡ Compare Routes
        </button>
        <button class="pinned-btn-bhaya" id="btn-pin-bhaya">
          🤖 Ask Bhaya AI
        </button>
      </div>
    </div>

    <!-- Discover Transit Stop Inspector Card (When tapping a station or route line) -->
    <div class="transit-inspector-card" id="transit-inspector-card" style="display:none;">
      <div class="inspector-card-header">
        <div class="inspector-mode-badge" id="insp-mode-badge">🚇 METRO</div>
        <button class="inspector-close-btn" id="btn-insp-close" title="Close">✕</button>
      </div>
      <div class="inspector-title-row">
        <div class="inspector-name" id="insp-name">Station Name</div>
        <div class="inspector-fare" id="insp-fare">₹15</div>
      </div>
      <div class="inspector-sub" id="insp-sub">Corridor details</div>
      <div class="inspector-meta-row">
        <span class="inspector-dist" id="insp-dist">🚶 280m walk</span>
        <span class="inspector-freq" id="insp-freq">⏱️ Every 7 mins</span>
      </div>
      <div class="inspector-actions">
        <button class="inspector-btn-book" id="btn-insp-book" style="display:none;background:linear-gradient(135deg, #F59E0B, #D97706);color:#000;font-weight:800;border:none;border-radius:10px;padding:8px 12px;font-size:0.85rem;cursor:pointer;">
          🎫 Book Pass / Ticket
        </button>
        <button class="inspector-btn-bhaya" id="btn-insp-bhaya">
          🤖 Ask Bhaya
        </button>
      </div>
    </div>

    <!-- Bottom Sheet with Route Options & Comparison -->
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
  if (!mapEl) return;

  // Await Google Maps API to finish loading
  const isGoogleAvailable = await ensureGoogleMapsScript();
  isGoogleMapEngine = isGoogleAvailable;
  console.log('[CHALO Map Engine] Active Map Engine:', isGoogleMapEngine ? 'Google Maps' : 'Leaflet');

  // Load dynamic pixel-perfect routes directly from SQLite DB
  await Promise.all([loadDynamicBrtsRoutes(), loadDynamicMetroLines()]);

  const badgeEl = screen.querySelector('#map-engine-badge');
  if (badgeEl) {
    badgeEl.innerHTML = isGoogleMapEngine ? '<span>🗺️ Google Maps</span>' : '<span>🗺️ OpenStreetMap</span>';
    badgeEl.style.color = isGoogleMapEngine ? '#1A73E8' : '#22A147';
  }

  const pos = locationService.getPosition();

  if (isGoogleMapEngine) {
    map = new google.maps.Map(mapEl, {
      center: { lat: pos.lat, lng: pos.lng },
      zoom: 14,
      disableDefaultUI: true,
      zoomControl: false,
      mapTypeControl: false,
      scaleControl: false,
      streetViewControl: false,
      rotateControl: false,
      fullscreenControl: false
    });
    transitLayer = new google.maps.TransitLayer();

    map.addListener('click', (e) => {
      setPinnedDestination(screen, e.latLng.lat(), e.latLng.lng());
    });
  } else if (typeof L !== 'undefined') {
    map = L.map(mapEl, { zoomControl: false, attributionControl: true })
      .setView([pos.lat, pos.lng], 14);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19, attribution: '© OpenStreetMap'
    }).addTo(map);

    map.on('click', (e) => {
      setPinnedDestination(screen, e.latlng.lat, e.latlng.lng);
    });
  } else {
    return;
  }

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
  screen.querySelector('#btn-open-transit')?.addEventListener('click', () => router.navigate('transit'));
  screen.querySelector('#btn-recenter')?.addEventListener('click', () => {
    const p = locationService.getPosition();
    panMap(p.lat, p.lng, 14);
  });

  // Cashless Pre-loaded Wallet Handler
  screen.querySelector('#btn-open-wallet')?.addEventListener('click', () => {
    openWalletModal();
  });

  const updateWalletBadge = (bal) => {
    const el = screen.querySelector('#header-wallet-amount');
    if (el) el.textContent = `₹${bal}`;
  };
  updateWalletBadge(walletService.getBalance());
  walletService.subscribe(updateWalletBadge);

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

  // Pin Toggle Button in Search Bar
  const pinBtn = screen.querySelector('#btn-pin-dest');
  pinBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!isPinModeActive) {
      const center = getMapCenter();
      setPinnedDestination(screen, center.lat, center.lng);
    } else {
      clearPinnedDest(screen);
    }
  });

  // Floating Pinned Card Actions
  screen.querySelector('#btn-pin-close')?.addEventListener('click', (e) => {
    e.stopPropagation();
    clearPinnedDest(screen);
  });

  screen.querySelector('#btn-pin-compare')?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (currentPinnedLocation) {
      const destName = currentPinnedLocation.name;
      if (searchInput) searchInput.value = destName;
      if (searchClear) searchClear.style.display = 'block';
      handleMultimodalSearch(screen, destName);
    }
  });

  screen.querySelector('#btn-pin-bhaya')?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (currentPinnedLocation) {
      window.dispatchEvent(new CustomEvent('chalo-ask-bhaya', {
        detail: {
          prompt: `How do I reach ${currentPinnedLocation.name} from my current location? Please suggest the best route, fare, and transport options.`
        }
      }));
    }
  });

  // Initialize Autocomplete System
  setupAutocomplete(screen);

  // Destination Search Events
  const searchInput = screen.querySelector('#dest-search-input');
  const searchClear = screen.querySelector('#dest-search-clear');

  searchInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const val = searchInput.value.trim();
      if (val) {
        const dropdown = screen.querySelector('#dest-autocomplete-dropdown');
        if (dropdown) dropdown.style.display = 'none';
        handleMultimodalSearch(screen, val);
      }
    }
  });

  searchClear?.addEventListener('click', () => {
    searchInput.value = '';
    searchClear.style.display = 'none';
    const dropdown = screen.querySelector('#dest-autocomplete-dropdown');
    if (dropdown) dropdown.style.display = 'none';
    clearMultimodalLayers();
    clearPinnedDest(screen);
    renderStopsList(screen, routesData);
  });

  // Quick Chips
  screen.querySelectorAll('.dest-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const dest = chip.dataset.dest;
      if (searchInput) {
        searchInput.value = dest;
        if (searchClear) searchClear.style.display = 'block';
      }
      const dropdown = screen.querySelector('#dest-autocomplete-dropdown');
      if (dropdown) dropdown.style.display = 'none';

      const match = AHMEDABAD_TRANSIT_PLACES.find(p => p.name.toLowerCase().includes(dest.toLowerCase()));
      if (match) {
        setPinnedDestination(screen, match.lat, match.lng, match.name);
        panMap(match.lat, match.lng, 15);
      }
      handleMultimodalSearch(screen, dest);
    });
  });


  // Mode Switcher Events (Shuttles Priority Default vs Discover Network)
  screen.querySelector('#btn-mode-shuttle')?.addEventListener('click', (e) => {
    e.stopPropagation();
    setAppMode(screen, 'shuttle');
  });

  screen.querySelector('#btn-mode-discover')?.addEventListener('click', (e) => {
    e.stopPropagation();
    setAppMode(screen, 'discover');
  });

  // Discover Filter Bar Chips (All, Metro, BRTS, Railways, State Bus)
  screen.querySelectorAll('.disc-filter-chip').forEach(chip => {
    chip.addEventListener('click', (e) => {
      e.stopPropagation();
      screen.querySelectorAll('.disc-filter-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      discoverActiveFilter = chip.dataset.filter || 'all';
      renderDiscoverMode(screen, discoverActiveFilter);
    });
  });

  // Transit Stop Inspector Card Actions
  screen.querySelector('#btn-insp-close')?.addEventListener('click', (e) => {
    e.stopPropagation();
    hideStopInspector();
  });

  screen.querySelector('#btn-insp-book')?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!inspectorSelectedStop) return;
    if (inspectorSelectedStop.type === 'shuttle') {
      const bal = walletService.getBalance();
      if (bal < 10) {
        showToast(`⚠️ Wallet balance (₹${bal}) is low. Top up to pay ₹10.`);
        openWalletModal();
        return;
      }
      walletService.payShuttleFare(10, {
        routeName: inspectorSelectedStop.name,
        driverName: 'Ashok R'
      });
      showToast('⚡ ₹10 paid directly to Shuttle Driver! Boarding pass active.');
    } else {
      openBookingModal({
        mode: inspectorSelectedStop.type === 'bus' ? 'gsrtc' : inspectorSelectedStop.type,
        title: `Book ${inspectorSelectedStop.name}`,
        destination: inspectorSelectedStop.name,
        fare: inspectorSelectedStop.fare || '₹15'
      });
    }
  });

  screen.querySelector('#btn-insp-bhaya')?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (inspectorSelectedStop) {
      window.dispatchEvent(new CustomEvent('chalo-ask-bhaya', {
        detail: {
          prompt: `How do I reach ${inspectorSelectedStop.name} (${inspectorSelectedStop.subtitle || inspectorSelectedStop.type})? Please suggest the best route options, fares, and steps.`
        }
      }));
    }
  });

  // Handle navigation requests from Chat / Bhaya AI
  window.addEventListener('chalo-start-nav', (e) => {
    const { route, dest, walk, fare } = e.detail || {};
    let matchedRoute = null;
    if (route && routesData.length) {
      matchedRoute = routesData.find(r => 
        r.name.toLowerCase().includes(route.toLowerCase()) || 
        route.toLowerCase().includes(r.name.toLowerCase())
      );
    }
    if (matchedRoute) {
      if (activeMapMode !== 'shuttle') {
        setAppMode(screen, 'shuttle');
      }
      if (bottomSheet && bottomSheet.classList.contains('collapsed')) {
        bottomSheet.classList.remove('collapsed');
        if (sheetToggle) sheetToggle.innerHTML = icons.chevronDown;
      }
      selectedRouteId = matchedRoute.id;
      showExpandedRoute(screen, matchedRoute, routesData);
      if (walk) {
        showNavToast(`Walk ${walk}`, `Fare: ${fare || '₹10'}`);
      }
    } else {
      const targetQuery = dest || route;
      if (targetQuery) {
        if (searchInput) searchInput.value = targetQuery;
        if (searchClear) searchClear.style.display = 'block';

        const match = AHMEDABAD_TRANSIT_PLACES.find(p => 
          p.name.toLowerCase().includes(targetQuery.toLowerCase()) || 
          targetQuery.toLowerCase().includes(p.name.toLowerCase())
        );

        if (match) {
          setPinnedDestination(screen, match.lat, match.lng, match.name);
          panMap(match.lat, match.lng, 15);
        }
        handleMultimodalSearch(screen, targetQuery);
        showNavToast(`Routing to ${targetQuery}`, `Estimated fare: ${fare || '₹10-15'}`);
      }
    }
  });

  startAutoAnimation();
}

function setupAutocomplete(screen) {
  const searchInput = screen.querySelector('#dest-search-input');
  const dropdown = screen.querySelector('#dest-autocomplete-dropdown');
  const searchClear = screen.querySelector('#dest-search-clear');
  if (!searchInput || !dropdown) return;

  function renderSuggestions(query) {
    const q = (query || '').trim().toLowerCase();
    if (!q) {
      dropdown.style.display = 'none';
      dropdown.innerHTML = '';
      return;
    }

    const userPos = locationService.getPosition();
    const allPlaces = [...AHMEDABAD_TRANSIT_PLACES];

    // Merge shuttle stops dynamically
    if (routesData && routesData.length) {
      routesData.forEach(r => {
        if (r.stops) {
          r.stops.forEach(s => {
            if (!allPlaces.some(p => p.name.toLowerCase() === s.name.toLowerCase())) {
              allPlaces.push({
                name: s.name,
                lat: s.lat,
                lng: s.lng,
                type: 'shuttle',
                mode: 'auto',
                subtitle: `CHALO Shared Auto Stop • ${r.name}`,
                icon: '🛺',
                color: '#22A147'
              });
            }
          });
        }
      });
    }

    // Filter matches
    const matches = allPlaces.filter(p => {
      const nameMatch = p.name.toLowerCase().includes(q);
      const subMatch = p.subtitle ? p.subtitle.toLowerCase().includes(q) : false;
      const typeMatch = p.type.toLowerCase().includes(q);
      return nameMatch || subMatch || typeMatch;
    });

    if (matches.length === 0) {
      dropdown.innerHTML = `
        <div class="dest-suggest-empty">
          <div class="dest-suggest-empty-text">🔍 No exact transit stops found for "${escapeHtml(query)}"</div>
          <button class="btn-suggest-pin" id="btn-suggest-pin-map">
            📍 Pin destination on map to find routes
          </button>
        </div>
      `;
      dropdown.style.display = 'block';
      dropdown.querySelector('#btn-suggest-pin-map')?.addEventListener('click', () => {
        dropdown.style.display = 'none';
        const center = getMapCenter();
        setPinnedDestination(screen, center.lat, center.lng, query);
        panMap(center.lat, center.lng, 15);
      });
      return;
    }

    // Calculate distance and sort by exact prefix match then proximity
    matches.forEach(m => {
      m.distKm = calcDistanceKm(userPos.lat, userPos.lng, m.lat, m.lng);
      m.isExact = m.name.toLowerCase().startsWith(q);
    });

    matches.sort((a, b) => {
      if (a.isExact && !b.isExact) return -1;
      if (!a.isExact && b.isExact) return 1;
      return a.distKm - b.distKm;
    });

    const topMatches = matches.slice(0, 7);

    dropdown.innerHTML = topMatches.map((m, idx) => `
      <div class="dest-suggest-item" data-idx="${idx}">
        <div class="dest-suggest-icon" style="background:${m.color || '#22A147'};">
          <span>${m.icon || '📍'}</span>
        </div>
        <div class="dest-suggest-body">
          <div class="dest-suggest-name">${highlightMatch(m.name, q)}</div>
          <div class="dest-suggest-sub">${m.subtitle || m.type}</div>
        </div>
        <div class="dest-suggest-dist">
          <span class="dest-dist-pill">${formatDistBadge(m.distKm)}</span>
        </div>
      </div>
    `).join('');

    dropdown.style.display = 'block';

    dropdown.querySelectorAll('.dest-suggest-item').forEach(itemEl => {
      itemEl.addEventListener('click', () => {
        const idx = parseInt(itemEl.dataset.idx);
        const selected = topMatches[idx];
        if (!selected) return;

        searchInput.value = selected.name;
        if (searchClear) searchClear.style.display = 'block';
        dropdown.style.display = 'none';

        setPinnedDestination(screen, selected.lat, selected.lng, selected.name);
        panMap(selected.lat, selected.lng, 15);

        handleMultimodalSearch(screen, selected.name);
      });
    });
  }

  let debounceTimer = null;
  searchInput.addEventListener('input', (e) => {
    const val = e.target.value.trim();
    if (val.length > 0) {
      if (searchClear) searchClear.style.display = 'block';
    } else {
      if (searchClear) searchClear.style.display = 'none';
      dropdown.style.display = 'none';
      clearMultimodalLayers();
      clearPinnedDest(screen);
      renderStopsList(screen, routesData);
      return;
    }
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      renderSuggestions(val);
    }, 120);
  });

  searchInput.addEventListener('focus', () => {
    if (searchInput.value.trim().length > 0) {
      renderSuggestions(searchInput.value);
    }
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('#map-search-box')) {
      dropdown.style.display = 'none';
    }
  });

  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      dropdown.style.display = 'none';
    }
  });
}

// ── MULTIMODAL ROUTE COMPARISON ENGINE ──
async function handleMultimodalSearch(screen, destination) {
  const list = screen.querySelector('#routes-list');
  const bottomSheet = screen.querySelector('#bottom-sheet');
  const sheetToggle = screen.querySelector('#sheet-toggle');
  
  if (bottomSheet && bottomSheet.classList.contains('collapsed')) {
    bottomSheet.classList.remove('collapsed');
    if (sheetToggle) sheetToggle.innerHTML = icons.chevronDown;
  }

  list.innerHTML = `
    <div class="multimodal-loading">
      <div class="map-loading-spinner"></div>
      <div class="map-loading-text">Comparing Auto, Metro, BRTS, Train & Bus routes to "${destination}"...</div>
    </div>
  `;

  const q = destination.toLowerCase().trim();
  const userPos = locationService.getPosition();

  // 1. Gather all options concurrently
  const [metroLines, brtsRoutes, trains, stateBuses] = await Promise.all([
    api.getMetroLines().catch(() => []),
    api.getBrtsRoutes().catch(() => []),
    api.getTrains().catch(() => []),
    api.getGsrtcRoutes({ to: destination }).catch(() => [])
  ]);

  const options = [];

  // Option A: Shared Auto Shuttle (CHALO)
  const autoMatch = routesData.find(r => 
    r.name.toLowerCase().includes(q) || 
    r.stops.some(s => s.name.toLowerCase().includes(q))
  ) || routesData[0]; // fallback to best available shuttle

  if (autoMatch) {
    options.push({
      id: 'auto-' + autoMatch.id,
      mode: 'auto',
      title: 'CHALO Shared Auto',
      subtitle: autoMatch.name,
      fare: '₹' + autoMatch.fare,
      time: autoMatch.duration || '12-15 min',
      walk: '🚶 180m walk',
      badge: '⚡ Direct Shuttle',
      badgeClass: 'badge-direct',
      icon: '🛺',
      color: '#22A147',
      path: autoMatch.path,
      stops: autoMatch.stops,
      routeId: autoMatch.id,
      itinerary: [
        `Walk 180m (~2 min) to nearest boarding stop`,
        `Board Shared Auto Shuttle (${autoMatch.name}) • Fare: ₹${autoMatch.fare}`,
        `Alight directly at ${destination} destination stop`
      ]
    });
  }

  // Option B: Metro Rail
  let matchedMetroStation = null;
  let matchedMetroLine = null;

  for (const line of metroLines) {
    if (line.stations) {
      const found = line.stations.find(s => s.name.toLowerCase().includes(q));
      if (found) {
        matchedMetroStation = found;
        matchedMetroLine = line;
        break;
      }
    }
  }

  if (!matchedMetroLine && metroLines.length > 0) {
    matchedMetroLine = metroLines[0];
    matchedMetroStation = matchedMetroLine.stations ? matchedMetroLine.stations[matchedMetroLine.stations.length - 1] : null;
  }

  if (matchedMetroLine && matchedMetroStation) {
    const isRedLine = (matchedMetroLine.code === 'RED' || (matchedMetroLine.name && matchedMetroLine.name.toLowerCase().includes('red')) || (matchedMetroLine.name && matchedMetroLine.name.toLowerCase().includes('north')));
    const metroPath = isRedLine ? METRO_RED_PATH : METRO_BLUE_PATH;
    options.push({
      id: 'metro-' + matchedMetroLine.id,
      mode: 'metro',
      title: `${matchedMetroLine.name} (${matchedMetroLine.code})`,
      subtitle: `To ${matchedMetroStation.name} Metro Station`,
      fare: '₹15',
      time: '~14 min',
      walk: '🚶 240m walk',
      badge: '🚀 Fastest • No Traffic',
      badgeClass: 'badge-fastest',
      icon: '🚇',
      color: matchedMetroLine.color || '#0066CC',
      path: metroPath,
      stations: matchedMetroLine.stations,
      itinerary: [
        `Walk 240m to nearest Metro station gate`,
        `Board ${matchedMetroLine.name} train (Runs every ${matchedMetroLine.frequency_minutes || 7} min)`,
        `Alight at ${matchedMetroStation.name} • Walking distance to ${destination}`
      ]
    });
  }

  // Option C: BRTS / Janmarg Dedicated Bus (Street-snapped Road Medians)
  const matchedBrts = brtsRoutes.find(r => 
    r.name.toLowerCase().includes(q) || 
    r.from_stop.toLowerCase().includes(q) || 
    r.to_stop.toLowerCase().includes(q)
  ) || (brtsRoutes.length > 0 ? brtsRoutes[0] : null);

  if (matchedBrts) {
    const matchedPathObj = BRTS_ROUTES_PATHS.find(bp => 
      bp.id === matchedBrts.id || (bp.name && bp.name.toLowerCase().includes(matchedBrts.route_number.toLowerCase()))
    ) || BRTS_ROUTES_PATHS[0];

    options.push({
      id: 'brts-' + matchedBrts.id,
      mode: 'brts',
      title: `BRTS ${matchedBrts.route_number}`,
      subtitle: `${matchedBrts.from_stop} ➔ ${matchedBrts.to_stop}`,
      fare: '₹' + matchedBrts.fare,
      time: '~18 min',
      walk: '🚶 350m walk',
      badge: '🛣️ Dedicated Lane (Road Snapped)',
      badgeClass: 'badge-dedicated',
      icon: '🚌',
      color: '#FF6B00',
      path: matchedPathObj ? matchedPathObj.path : null,
      itinerary: [
        `Walk 350m to nearest BRTS bus station`,
        `Board ${matchedBrts.route_number} (${matchedBrts.name})`,
        `Direct ride on dedicated BRTS road median corridor`
      ]
    });
  }

  // Option D: Indian Railways Train (if outstation or railway hub)
  const matchedTrain = trains.find(t => 
    t.to_station.toLowerCase().includes(q) || 
    t.from_station.toLowerCase().includes(q) ||
    t.name.toLowerCase().includes(q)
  );

  if (matchedTrain || q.includes('station') || q.includes('railway') || q.includes('kalupur') || q.includes('mumbai') || q.includes('delhi')) {
    const t = matchedTrain || trains[0];
    if (t) {
      options.push({
        id: 'train-' + t.id,
        mode: 'train',
        title: `${t.name} (${t.train_number})`,
        subtitle: `${t.from_station} ➔ ${t.to_station}`,
        fare: t.fare_chair_car > 0 ? `₹${t.fare_chair_car} CC` : (t.fare_sleeper > 0 ? `₹${t.fare_sleeper} SL` : '₹140'),
        time: t.duration || '6h 15m',
        walk: 'Departs Plat ' + (t.platform || '1'),
        badge: '🚅 Intercity Superfast',
        badgeClass: 'badge-train',
        icon: '🚂',
        color: '#6A1B9A',
        train: t,
        path: [
          [userPos.lat, userPos.lng],
          [23.0447, 72.5436],
          [23.0408, 72.5531],
          [23.0373, 72.5670],
          [23.0392, 72.5811],
          [23.0286, 72.5869],
          [23.0251, 72.6031]
        ],
        itinerary: [
          `Take Metro Blue Line / Shuttle to Kalupur Railway Station`,
          `Enter Platform ${t.platform || '1'} for Train #${t.train_number}`,
          `Departs ${t.departure_time} • Arrives ${t.arrival_time} (${t.duration})`
        ]
      });
    }
  }

  // Option E: State Bus (GSRTC/MSRTC)
  if (stateBuses.length > 0 || q.includes('bus') || q.includes('geeta mandir') || q.includes('vadodara') || q.includes('surat') || q.includes('rajkot')) {
    const b = stateBuses[0] || {
      operator: 'GSRTC',
      from_city: 'Ahmedabad (Geeta Mandir)',
      to_city: destination,
      bus_type: 'Volvo AC',
      fare: 180,
      departure_time: 'Every 30 min'
    };

    options.push({
      id: 'bus-' + (b.id || 'state'),
      mode: 'state_bus',
      title: `${b.operator || 'GSRTC'} ${b.bus_type || 'Express'}`,
      subtitle: `${b.from_city} ➔ ${b.to_city}`,
      fare: `₹${b.fare || 180}`,
      time: b.duration || '~2h 00m',
      walk: 'Geeta Mandir Central Depot',
      badge: '🚍 AC Volvo Express',
      badgeClass: 'badge-bus',
      icon: '🚍',
      color: '#2E7D32',
      path: [
        [userPos.lat, userPos.lng],
        [23.0245, 72.5300],
        [23.0195, 72.5420],
        [23.0070, 72.5620],
        [23.0135, 72.5890]
      ],
      itinerary: [
        `Take CHALO Shuttle to Geeta Mandir Bus Stand`,
        `Board ${b.operator} ${b.bus_type} from Platform Bay`,
        `Frequent departures: ${b.departure_time}`
      ]
    });
  }

  // Render Options UI
  renderMultimodalDeck(screen, destination, options);
}

function renderMultimodalDeck(screen, destination, options) {
  const list = screen.querySelector('#routes-list');
  clearMiniMaps();
  clearMultimodalLayers();

  list.innerHTML = `
    <div class="multimodal-deck-header">
      <div>
        <div class="multimodal-deck-title">Options to <strong>${destination}</strong></div>
        <div class="multimodal-deck-sub">Compare fare, travel time & select your route</div>
      </div>
      <button class="multimodal-back-all" id="btn-back-all-routes">${icons.arrowLeft} All Routes</button>
    </div>

    <!-- Mode Filter Tabs -->
    <div class="multimodal-filter-row">
      <button class="mm-filter active" data-mode="all">All Modes (${options.length})</button>
      <button class="mm-filter" data-mode="auto">🛺 Auto</button>
      <button class="mm-filter" data-mode="metro">🚇 Metro</button>
      <button class="mm-filter" data-mode="brts">🚌 BRTS</button>
      <button class="mm-filter" data-mode="train">🚂 Train</button>
      <button class="mm-filter" data-mode="state_bus">🚍 State Bus</button>
    </div>

    <div class="multimodal-cards-list" id="mm-cards-list"></div>
  `;

  list.querySelector('#btn-back-all-routes')?.addEventListener('click', () => {
    clearMultimodalLayers();
    renderStopsList(screen, routesData);
    const searchInput = screen.querySelector('#dest-search-input');
    const searchClear = screen.querySelector('#dest-search-clear');
    if (searchInput) searchInput.value = '';
    if (searchClear) searchClear.style.display = 'none';
  });

  const cardsContainer = list.querySelector('#mm-cards-list');

  function renderCards(filteredList) {
    cardsContainer.innerHTML = '';
    
    filteredList.forEach((opt, idx) => {
      const card = document.createElement('div');
      card.className = `multimodal-option-card ${idx === 0 ? 'active' : ''}`;
      card.id = `mm-card-${opt.id}`;
      
      card.innerHTML = `
        <div class="mm-card-top">
          <div class="mm-card-mode-badge" style="background:${opt.color};">
            <span class="mm-mode-icon">${opt.icon}</span>
          </div>
          <div class="mm-card-info">
            <div class="mm-card-title-row">
              <span class="mm-card-title">${opt.title}</span>
              <span class="mm-card-fare">${opt.fare}</span>
            </div>
            <div class="mm-card-subtitle">${opt.subtitle}</div>
            <div class="mm-card-meta">
              <span>⏱️ ${opt.time}</span>
              <span>${opt.walk}</span>
              <span class="mm-highlight-badge ${opt.badgeClass}">${opt.badge}</span>
            </div>
          </div>
        </div>

        <div class="mm-card-itinerary ${idx === 0 ? 'expanded' : ''}" id="itinerary-${opt.id}">
          <div class="itinerary-title">Itinerary Steps:</div>
          <div class="itinerary-steps">
            ${opt.itinerary.map((step, i) => `
              <div class="itinerary-step">
                <span class="itinerary-dot" style="background:${opt.color}">${i + 1}</span>
                <span class="itinerary-text">${step}</span>
              </div>
            `).join('')}
          </div>
          <div class="mm-action-row">
            ${opt.mode === 'auto' ? `
              <button class="mm-action-btn" id="btn-action-${opt.id}" style="background:linear-gradient(135deg, #22A147, #34A853);flex:1;">
                Book Shuttle (${opt.fare})
              </button>
              <button class="mm-action-btn mm-btn-wallet" id="btn-wallet-${opt.id}" style="background:linear-gradient(135deg, #F59E0B, #D97706);color:#000;font-weight:900;flex:1.2;">
                ⚡ 1-Tap Pay (${opt.fare})
              </button>
            ` : `
              <button class="mm-action-btn mm-btn-book" id="btn-book-${opt.id}" style="background:linear-gradient(135deg, ${opt.color}, #111827);flex:1.2;">
                🎫 Book Pass / Ticket (${opt.fare})
              </button>
              <button class="mm-action-btn" id="btn-action-${opt.id}" style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);flex:1;">
                Timetable Details
              </button>
            `}
          </div>
        </div>
      `;

      card.addEventListener('click', (e) => {
        // Don't toggle if clicking the action button directly
        if (e.target.closest('.mm-action-btn')) return;

        cardsContainer.querySelectorAll('.multimodal-option-card').forEach(c => c.classList.remove('active'));
        cardsContainer.querySelectorAll('.mm-card-itinerary').forEach(it => it.classList.remove('expanded'));
        
        card.classList.add('active');
        const itin = card.querySelector('.mm-card-itinerary');
        if (itin) itin.classList.add('expanded');

        // Draw this specific option's route on the map!
        highlightOptionOnMap(opt);
      });

      // Action button handler
      card.querySelector(`#btn-action-${opt.id}`)?.addEventListener('click', (e) => {
        e.stopPropagation();
        if (opt.mode === 'auto' && opt.routeId) {
          router.navigate('trip', { routeId: opt.routeId });
        } else {
          router.navigate('transit');
        }
      });

      // 1-Tap Instant Payment from Pre-loaded CHALO Wallet (Zero Network Lag)
      card.querySelector(`#btn-wallet-${opt.id}`)?.addEventListener('click', (e) => {
        e.stopPropagation();
        const fareNum = parseInt(opt.fare.replace(/[^0-9]/g, '')) || 10;
        const bal = walletService.getBalance();
        if (bal < fareNum) {
          showToast(`⚠️ Wallet balance (₹${bal}) is low. Please top up to pay ₹${fareNum}.`);
          openWalletModal();
          return;
        }

        const success = walletService.payShuttleFare(fareNum, {
          routeName: opt.subtitle,
          driverName: 'Ashok R'
        });

        if (success) {
          showToast(`⚡ ₹${fareNum} paid directly to Shuttle Driver! Zero network lag.`);
          router.navigate('trip', { routeId: opt.routeId, paidViaWallet: true, fare: fareNum });
        }
      });

      // Book Official Ticket / Pass modal for non-auto modes (Metro, BRTS, GSRTC, Train)
      card.querySelector(`#btn-book-${opt.id}`)?.addEventListener('click', (e) => {
        e.stopPropagation();
        openBookingModal({
          mode: opt.mode,
          title: `Book ${opt.title}`,
          destination: destination,
          fare: opt.fare
        });
      });

      cardsContainer.appendChild(card);
    });

    // Highlight the first option by default
    if (filteredList.length > 0) {
      highlightOptionOnMap(filteredList[0]);
    }
  }

  renderCards(options);

  // Filter tabs
  list.querySelectorAll('.mm-filter').forEach(btn => {
    btn.addEventListener('click', () => {
      list.querySelectorAll('.mm-filter').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const mode = btn.dataset.mode;
      if (mode === 'all') {
        renderCards(options);
      } else {
        renderCards(options.filter(o => o.mode === mode));
      }
    });
  });
}

function highlightOptionOnMap(option) {
  if (!map) return;
  clearMultimodalLayers();

  if (option.path && option.path.length > 1) {
    // Polyline
    multimodalActiveLayer = addPolylineLayer(option.path, {
      color: option.color || '#4285F4',
      weight: 6,
      opacity: 0.9
    });

    // Destination Pin
    const endPoint = option.path[option.path.length - 1];
    const pinHtml = `<div style="background:${option.color};width:24px;height:24px;border-radius:50%;border:3px solid white;box-shadow:0 3px 10px rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;color:white;font-size:12px;">${option.icon}</div>`;
    const dm = addCustomMarkerLayer(endPoint, pinHtml, {
      className: 'dest-marker',
      anchorX: 12,
      anchorY: 12,
      width: 24,
      height: 24
    });
    if (dm) multimodalMarkers.push(dm);

    // Fit map to show full path
    fitMapBounds(option.path, 60);
  } else {
    // If no exact polyline, center on destination or user
    const pos = locationService.getPosition();
    panMap(pos.lat, pos.lng, 14);
  }
}

function showNavToast(title, text) {
  let toast = document.getElementById('nav-walk-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'nav-walk-toast';
    toast.className = 'nav-walk-toast';
    toast.innerHTML = `
      <div class="nav-walk-toast-icon">🚶</div>
      <div class="nav-walk-toast-content">
        <div class="nav-walk-toast-title"></div>
        <div class="nav-walk-toast-text"></div>
      </div>
    `;
    const mapScreen = document.getElementById('map-screen');
    if (mapScreen) mapScreen.appendChild(toast);
  }
  
  toast.querySelector('.nav-walk-toast-title').textContent = title;
  toast.querySelector('.nav-walk-toast-text').textContent = text;
  
  toast.classList.remove('show');
  void toast.offsetWidth; // force reflow
  toast.classList.add('show');
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, 5000);
}

function addUserMarker(lat, lng) {
  const html = '<div class="user-marker"><div class="user-marker-pulse"></div><div class="user-marker-dot"></div></div>';
  userMarker = addCustomMarkerLayer([lat, lng], html, {
    anchorX: 20,
    anchorY: 20,
    width: 40,
    height: 40,
    zIndex: 1000,
    interactive: false
  });
}

function updateUserMarker(lat, lng) {
  if (userMarker && userMarker.setLatLng) {
    userMarker.setLatLng([lat, lng]);
  }
}

function drawRoutes(routes, requestedDriverId = null) {
  routeLayers.forEach(l => removeMapLayer(l));
  autoMarkers.forEach(({ marker }) => removeMapLayer(marker));
  routeLayers = [];
  autoMarkers = [];

  routes.forEach(route => {
    if (!route.path || route.path.length < 2) return;

    const polyline = addPolylineLayer(route.path, {
      color: route.color || '#4285F4',
      weight: 4,
      opacity: 0.85
    });
    if (polyline) routeLayers.push(polyline);

    const lastStop = route.stops && route.stops.length ? route.stops[route.stops.length - 1] : null;
    if (lastStop) {
      const dm = addCustomMarkerLayer([lastStop.lat, lastStop.lng], icons.destPin, {
        className: 'dest-marker',
        anchorX: 12,
        anchorY: 32,
        width: 24,
        height: 32
      });
      if (dm) routeLayers.push(dm);
    }

    if (requestedDriverId) {
      const marker = addCustomMarkerLayer(route.path[0], icons.autoRickshawSmall, {
        className: 'auto-marker tracking-pulse',
        anchorX: 25,
        anchorY: 25,
        width: 50,
        height: 50,
        zIndex: 1000
      });
      if (marker) autoMarkers.push({ marker, pos: { lat: route.path[0][0], lng: route.path[0][1] }, path: null });
    } else {
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

function renderStopsList(screen, routes) {
  const list = screen.querySelector('#routes-list');
  const sheet = screen.querySelector('.bottom-sheet');
  if (!list || routes.length === 0) return;
  
  if (sheet) sheet.classList.add('passenger-sheet');
  clearMiniMaps();
  clearMultimodalLayers();
  list.innerHTML = '';
  drawRoutes(routesData);

  routes.forEach(route => {
    const card = document.createElement('div');
    card.className = 'route-summary-card upgraded-card';

    const occ = route.occupancy || { available: 2, total: 4 };
    const occClass = occ.available > 1 ? 'seat-avail-green' : occ.available === 1 ? 'seat-avail-yellow' : 'seat-avail-red';
    const occText = occ.available > 0 ? `${occ.available}/${occ.total} Seats Free` : 'Full • Next in 4m';
    const relScore = route.reliability?.score || 92;
    const co2 = route.co2SavedKg || (route.distance * 0.18).toFixed(1);

    card.innerHTML = `
      <div class="mini-map-container" id="mini-map-list-${route.id}"></div>
      
      <div class="route-card-main-content">
        <div class="route-card-top-row">
          <div class="route-summary-title">${route.name}</div>
          <div class="route-summary-fare">₹${route.fare}</div>
        </div>

        <div class="route-card-pills-row">
          <span class="route-pill reliability-pill" title="Historic Punctuality Score">
            ⭐ ${relScore}% Reliable
          </span>
          <span class="route-pill ${occClass}">
            🛺 ${occText}
          </span>
          <span class="route-pill esg-pill" title="CO2 saved vs private solo vehicle">
            🌱 ${co2}kg CO₂ saved
          </span>
        </div>

        ${route.smartPickupHint ? `
          <div class="smart-pickup-hint">
            <span class="smart-pickup-icon">🚶</span>
            <span class="smart-pickup-text">${route.smartPickupHint}</span>
          </div>
        ` : ''}
      </div>

      <div class="route-summary-arrow">${icons.chevronRight}</div>
    `;
    card.addEventListener('click', () => {
      selectedRouteId = route.id;
      showExpandedRoute(screen, route, routes);
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

  drawRoutes([route]);
  if (map && route.path && route.path.length > 1) {
    fitMapBounds(route.path, 60);
  }

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
    if (map && allRoutes.length > 0) {
      const allCoords = [];
      allRoutes.forEach(r => { if(r.path) r.path.forEach(p => allCoords.push(p)); });
      if (allCoords.length) fitMapBounds(allCoords, 50);
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

  const allBtn = document.createElement('div');
  allBtn.className = 'view-all-btn';
  allBtn.innerHTML = `View all routes`;
  allBtn.addEventListener('click', () => {
    selectedRouteId = null;
    renderStopsList(screen, allRoutes);
    const p = locationService.getPosition();
    panMap(p.lat, p.lng, 14);
  });
  list.appendChild(allBtn);
}

// Animation Helpers
function getDistance(p1, p2) {
  if (!p1 || !p2) return 0;
  const R = 6371e3;
  const φ1 = p1[0] * Math.PI / 180;
  const φ2 = p2[0] * Math.PI / 180;
  const Δφ = (p2[0] - p1[0]) * Math.PI / 180;
  const Δλ = (p2[1] - p1[1]) * Math.PI / 180;
  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function getPathMetadata(path) {
  let totalDist = 0;
  const segDists = [];
  for (let i = 0; i < path.length - 1; i++) {
    const d = getDistance(path[i], path[i+1]);
    segDists.push(d);
    totalDist += d;
  }
  return { totalDist, segDists };
}

function getPointAtDistance(path, segDists, targetDist) {
  let accumulated = 0;
  for (let i = 0; i < segDists.length; i++) {
    if (accumulated + segDists[i] >= targetDist) {
      const segFraction = segDists[i] === 0 ? 0 : (targetDist - accumulated) / segDists[i];
      const p1 = path[i];
      const p2 = path[i+1];
      const lat = p1[0] + (p2[0] - p1[0]) * segFraction;
      const lng = p1[1] + (p2[1] - p1[1]) * segFraction;
      return [lat, lng];
    }
    accumulated += segDists[i];
  }
  return path[path.length - 1];
}

let animFrameId = null;
function startAutoAnimation() {
  if (animFrameId) cancelAnimationFrame(animFrameId);

  const speed = 8.5; // m/s (~30 km/h)
  const metaCache = new Map();

  autoMarkers.forEach(auto => {
    if (auto.path && auto.path.length > 1 && !metaCache.has(auto.path)) {
      metaCache.set(auto.path, getPathMetadata(auto.path));
    }
    if (auto.path && metaCache.has(auto.path)) {
      const meta = metaCache.get(auto.path);
      let dist = 0;
      for (let i = 0; i < Math.min(auto.pathIndex || 0, meta.segDists.length); i++) {
        dist += meta.segDists[i];
      }
      auto.currentDist = dist;
    }
  });

  let lastTime = performance.now();

  function animate(now) {
    const dt = (now - lastTime) / 1000;
    lastTime = now;

    autoMarkers.forEach(auto => {
      if (!auto.path || !metaCache.has(auto.path)) return;
      const meta = metaCache.get(auto.path);
      if (meta.totalDist === 0) return;

      auto.currentDist = (auto.currentDist + speed * dt) % meta.totalDist;
      const pos = getPointAtDistance(auto.path, meta.segDists, auto.currentDist);
      auto.marker.setLatLng(pos);
    });

    animFrameId = requestAnimationFrame(animate);
  }

  animFrameId = requestAnimationFrame(animate);
}
