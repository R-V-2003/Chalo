// API Client — all data comes from the backend
import { storage } from './utils/storage.js';

// Absolute URL needed for APK/Mobile apps. Defaults to same-origin for web deployment.
const BASE = import.meta.env.VITE_API_BASE_URL || ''; 

async function request(path, options = {}) {
  try {
    const token = storage.get('auth_token');
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${BASE}${path}`, {
      ...options,
      headers
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || 'Request failed');
    }
    return res.json();
  } catch (err) {
    console.error(`API Error [${path}]:`, err.message);
    throw err;
  }
}

export const api = {
  // Routes
  getRoutes: () => request('/api/routes'),
  getRoute: (id) => request(`/api/routes/${id}`),
  createRoute: (data) => request('/api/routes', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  deleteRoute: (id) => request(`/api/routes/${id}`, { method: 'DELETE' }),

  // Drivers
  getDrivers: () => request('/api/drivers'),
  getDriverForRoute: (routeId) => request(`/api/drivers/route/${routeId}`),

  // Reviews
  getReviews: (driverId) => request(`/api/reviews/${driverId}`),
  addReview: (driverId, data) => request(`/api/reviews/${driverId}`, {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  // Stops
  getStops: (routeId) => request(`/api/stops/${routeId}`),

  // Auth & User
  register: (data) => request('/api/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data) => request('/api/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  getMe: () => request('/api/auth/me'),

  // Shuttle Specific
  setShuttleRoute: (routeId) => request('/api/auth/shuttle/route', { method: 'POST', body: JSON.stringify({ routeId }) }),
  updateOccupancy: (routeId, available, total = 4) => request(`/api/routes/${routeId}/occupancy`, {
    method: 'PATCH',
    body: JSON.stringify({ available, total })
  }),

  // Investor Analytics
  getInvestorAnalytics: () => request('/api/analytics/investor'),

  // AI Smart Navigation Chat
  chat: (message, history = [], userLocation = null) => request('/api/chat', { 
    method: 'POST', 
    body: JSON.stringify({ message, history, userLocation }) 
  }),

  // Pan-India Cities
  getCities: () => request('/api/cities'),
  getCity: (id) => request(`/api/cities/${id}`),

  // Metro (Pan-India)
  getMetroLines: (city) => request(`/api/metro/lines${city ? `?city=${encodeURIComponent(city)}` : ''}`),
  getMetroStations: (lineId, city) => {
    const params = new URLSearchParams();
    if (lineId) params.append('line', lineId);
    if (city) params.append('city', city);
    const qs = params.toString();
    return request(`/api/metro/stations${qs ? `?${qs}` : ''}`);
  },
  getMetroStation: (id) => request(`/api/metro/stations/${id}`),
  getMetroFare: (from, to) => request(`/api/metro/fare?from=${from}&to=${to}`),
  getNearbyMetro: (lat, lng, limit = 5) => request(`/api/metro/nearby?lat=${lat}&lng=${lng}&limit=${limit}`),
  getMetroRoute: (from, to) => request(`/api/metro/route?from=${from}&to=${to}`),

  // Trains (Pan-India & Suburban Locals)
  getTrains: (params = {}) => {
    const query = new URLSearchParams();
    if (params.type) query.append('type', params.type);
    if (params.city) query.append('city', params.city);
    if (params.origin) query.append('origin', params.origin);
    const qs = query.toString();
    return request(`/api/trains${qs ? `?${qs}` : ''}`);
  },
  getSuburbanTrains: (city) => request(`/api/trains/suburban${city ? `?city=${encodeURIComponent(city)}` : ''}`),
  searchTrains: (destination, from) => {
    const params = new URLSearchParams();
    if (destination) params.append('to', destination);
    if (from) params.append('from', from);
    return request(`/api/trains/search?${params.toString()}`);
  },
  getTrain: (id) => request(`/api/trains/${id}`),
  getTrainFare: (id) => request(`/api/trains/fare/${id}`),
  getNearbyRailway: (lat, lng) => request(`/api/trains/nearby?lat=${lat}&lng=${lng}`),

  // BRTS (Pan-India)
  getBrtsRoutes: (params = {}) => {
    const query = new URLSearchParams();
    if (typeof params === 'string') query.append('type', params);
    else {
      if (params.type) query.append('type', params.type);
      if (params.city) query.append('city', params.city);
    }
    const qs = query.toString();
    return request(`/api/brts/routes${qs ? `?${qs}` : ''}`);
  },
  getBrtsRoute: (id) => request(`/api/brts/routes/${id}`),
  getBrtsStops: (routeId) => request(`/api/brts/stops${routeId ? `?route=${routeId}` : ''}`),

  // State Bus Transport (All-India SRTCs)
  getGsrtcRoutes: (params = {}) => {
    const query = new URLSearchParams();
    if (params.to) query.append('to', params.to);
    if (params.type) query.append('type', params.type);
    if (params.city) query.append('city', params.city);
    if (params.state) query.append('state', params.state);
    if (params.operator) query.append('operator', params.operator);
    const qs = query.toString();
    return request(`/api/gsrtc/routes${qs ? `?${qs}` : ''}`);
  },
  getGsrtcBusStands: (city) => request(`/api/gsrtc/bus-stands${city ? `?city=${encodeURIComponent(city)}` : ''}`),
  getGsrtcOperators: () => request('/api/gsrtc/operators'),
  getGsrtcRoute: (id) => request(`/api/gsrtc/routes/${id}`),

  // Health
  health: () => request('/api/health')
};
