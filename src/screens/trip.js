// Trip Details — API-driven, Frame 2 cream/gold card
import { icons } from '../utils/icons.js';
import { router } from '../utils/router.js';
import { api } from '../api.js';
import { showToast } from '../utils/toast.js';
import { walletService } from '../services/wallet.js';
import { openWalletModal } from '../components/walletModal.js';

function getDriverAvatar(name) {
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase();
  const colors = ['#4285F4','#EA4335','#34A853','#FBBC04','#9C27B0','#FF5722'];
  const bg = colors[name.charCodeAt(0) % colors.length];
  return `data:image/svg+xml,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
      <rect width="64" height="64" rx="32" fill="${bg}"/>
      <text x="32" y="38" font-family="Inter,Arial,sans-serif" font-size="22" font-weight="700" fill="white" text-anchor="middle">${initials}</text>
    </svg>
  `)}`;
}

export function createTripScreen(params = {}) {
  const routeId = params.routeId;
  if (!routeId) { router.back(); return null; }

  const screen = document.createElement('div');
  screen.className = 'screen overlay-screen trip-screen';
  screen.id = 'trip-screen';

  screen.innerHTML = `
    <div class="overlay-backdrop"></div>
    <button class="trip-back-btn" id="trip-back">${icons.arrowLeft}</button>
    <div class="trip-card">
      <div style="text-align:center;padding:20px;">
        <div class="map-loading-spinner" style="margin:0 auto;"></div>
        <div class="map-loading-text" style="margin-top:12px;">Loading trip details...</div>
      </div>
    </div>
  `;

  // Fetch data from API
  setTimeout(async () => {
    screen.querySelector('#trip-back')?.addEventListener('click', () => router.back());

    try {
      const [route, driver] = await Promise.all([
        api.getRoute(routeId),
        api.getDriverForRoute(routeId)
      ]);

      const origin = route.stops[0];
      const dest = route.stops[route.stops.length - 1];
      const rating = Math.round(driver.rating);

      const starsHtml = [1,2,3,4,5].map(i =>
        `<span class="star ${i <= rating ? 'filled' : 'empty'}" data-rating="${i}">${icons.star}</span>`
      ).join('');

      const driverAvatarHtml = driver.profile_photo
        ? `<img src="${driver.profile_photo}" alt="Driver" style="width:100%;height:100%;object-fit:cover;" />`
        : getDriverAvatar(driver.name);

      const card = screen.querySelector('.trip-card');
      card.innerHTML = `
        <div class="trip-driver-section">
          <div class="trip-driver-photo" style="overflow:hidden;padding:0;">${driverAvatarHtml}</div>
          <div class="trip-driver-info">
            <div class="trip-driver-name">${driver.name}</div>
            <div class="trip-vehicle-number">${icons.autoRickshawSmall} ${driver.vehicle_number}</div>
          </div>
        </div>
        <div class="trip-info-section">
          <div class="trip-label-row">
            <span class="trip-label">Trip</span>
            <span class="trip-duration">:${route.duration}</span>
          </div>
          <div class="trip-route">
            <div class="trip-stop">
              <div class="trip-stop-icon origin">${icons.origin}</div>
              <div class="trip-stop-name">${origin?.name || 'Start'}</div>
            </div>
            <div class="trip-route-line"></div>
            <div class="trip-stop">
              <div class="trip-stop-icon destination">${icons.destination}</div>
              <div class="trip-stop-name">${dest?.name || 'End'}</div>
            </div>
          </div>
        </div>

        ${params.paidViaWallet ? `
          <div style="margin-bottom:14px;padding:12px 14px;background:rgba(34,161,71,0.12);border:1.5px solid #22A147;border-radius:12px;display:flex;align-items:center;gap:10px;">
            <span style="font-size:1.4rem;">⚡</span>
            <div>
              <div style="font-weight:900;font-size:0.9rem;color:#22A147;">PAID VIA CHALO WALLET (₹${params.fare || route.fare})</div>
              <div style="font-size:0.75rem;color:var(--text-sec);font-weight:600;">Zero-lag auto settlement • Board shuttle directly</div>
            </div>
          </div>
        ` : `
          <button class="btn-wallet-pay-trip" id="btn-wallet-pay-trip" style="width:100%;margin-bottom:10px;padding:14px;background:linear-gradient(135deg, #F59E0B, #D97706);color:#000;border:none;border-radius:12px;font-weight:900;font-size:0.95rem;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;box-shadow:0 4px 14px rgba(245,158,11,0.3);transition:transform 0.15s;">
            <span>⚡</span> 1-Tap Pay ₹${route.fare} (CHALO Wallet)
          </button>
        `}

        <button class="btn-request-wait" id="btn-request-wait">${params.paidViaWallet ? 'START LIVE JOURNEY' : 'REQUEST RIDE / PAY CASH'}</button>
        <div class="trip-expand-btn">${icons.chevronDown}</div>
        <div class="rating-section">
          <div class="star-rating" id="star-rating">${starsHtml}</div>
          <button class="btn-write-review" id="btn-write-review">Write a review</button>
          <div class="review-form" id="review-form">
            <textarea class="review-textarea" id="review-text" placeholder="Share your experience..." maxlength="500"></textarea>
            <button class="btn-submit-review" id="btn-submit-review">Submit</button>
          </div>
        </div>
      `;

      // 1-Tap Wallet Pay Handler
      const walletPayBtn = screen.querySelector('#btn-wallet-pay-trip');
      walletPayBtn?.addEventListener('click', () => {
        const fare = parseInt(route.fare) || 10;
        const bal = walletService.getBalance();
        if (bal < fare) {
          showToast(`⚠️ Wallet balance (₹${bal}) is low. Top up to pay ₹${fare}.`);
          openWalletModal();
          return;
        }
        const success = walletService.payShuttleFare(fare, {
          routeName: route.name,
          driverName: driver.name
        });
        if (success) {
          showToast(`⚡ ₹${fare} paid directly to ${driver.name} (Zero network lag)!`);
          router.navigate('tracking', { route, driver, paidViaWallet: true });
        }
      });

      // Request to wait
      let selectedRating = 0;
      const waitBtn = screen.querySelector('#btn-request-wait');
      waitBtn?.addEventListener('click', () => {
        if (!waitBtn.classList.contains('requested')) {
          waitBtn.classList.add('requested');
          waitBtn.textContent = 'CONNECTING...';
          setTimeout(() => {
            showToast(params.paidViaWallet ? 'Fast-pass verified with driver!' : 'Driver notified of your location!');
            router.navigate('tracking', { route, driver, paidViaWallet: params.paidViaWallet });
          }, 800);
        }
      });

      // Stars
      screen.querySelectorAll('#star-rating .star').forEach(star => {
        star.addEventListener('click', () => {
          selectedRating = parseInt(star.dataset.rating);
          screen.querySelectorAll('#star-rating .star').forEach(s => {
            const v = parseInt(s.dataset.rating);
            s.classList.toggle('filled', v <= selectedRating);
            s.classList.toggle('empty', v > selectedRating);
          });
        });
      });

      // Review
      const reviewBtn = screen.querySelector('#btn-write-review');
      const reviewForm = screen.querySelector('#review-form');
      reviewBtn?.addEventListener('click', () => {
        reviewForm.classList.toggle('visible');
        reviewBtn.textContent = reviewForm.classList.contains('visible') ? 'Cancel' : 'Write a review';
      });

      screen.querySelector('#btn-submit-review')?.addEventListener('click', async () => {
        if (selectedRating === 0) { showToast('Please select a rating'); return; }
        try {
          await api.addReview(driver.id, {
            rating: selectedRating,
            text: screen.querySelector('#review-text')?.value || '',
            user_name: 'You'
          });
          showToast('Review submitted! Thank you 🙏');
          reviewForm.classList.remove('visible');
          reviewBtn.textContent = 'Write a review';
        } catch (err) {
          showToast('Failed to submit review');
        }
      });
    } catch (err) {
      const card = screen.querySelector('.trip-card');
      card.innerHTML = '<div style="text-align:center;padding:20px;color:#EA4335;">Failed to load trip details</div>';
    }
  }, 0);

  return screen;
}
