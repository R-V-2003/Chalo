// CHALO v2 — Main Entry Point
import './style.css';
import { router } from './utils/router.js';
import { createSplashScreen } from './screens/splash.js';
import { createLocationScreen } from './screens/location.js';
import { createMapScreen } from './screens/map.js';
import { createTripScreen } from './screens/trip.js';
import { createTrackingScreen } from './screens/tracking.js';
import { createAddRouteScreen } from './screens/addRoute.js';
import { createAuthScreen } from './screens/auth.js';
import { createShuttleDashboardScreen } from './screens/shuttleDashboard.js';
import {
  createProfileScreen,
  createSettingsScreen,
  createSupportScreen,
  createFAQsScreen,
  createSetRouteScreen
} from './screens/secondary.js';
import { createTransitScreen } from './screens/transit.js';
import { createChatWidget } from './components/chatWidget.js';
import { initInvestorBar } from './components/investorBar.js';

// Register screens
router.register('login', () => createAuthScreen(true));
router.register('register', () => createAuthScreen(false));
router.register('shuttle-dashboard', () => createShuttleDashboardScreen());
router.register('splash', () => createSplashScreen());
router.register('location', () => createLocationScreen());
router.register('map', (params) => createMapScreen(params));
router.register('trip', (params) => createTripScreen(params));
router.register('tracking', (params) => createTrackingScreen(params));
router.register('add-route', () => createAddRouteScreen());
router.register('transit', () => createTransitScreen());
router.register('profile', () => createProfileScreen());
router.register('settings', () => createSettingsScreen());
router.register('support', () => createSupportScreen());
router.register('faqs', () => createFAQsScreen());
router.register('set-route', () => createSetRouteScreen());

// Start
document.addEventListener('DOMContentLoaded', () => {
  initInvestorBar();
  router.navigate('splash');
  createChatWidget();
});

// PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}
