// Side Drawer — Frame 2 exact + Add Route + Logout
import { icons } from '../utils/icons.js';
import { router } from '../utils/router.js';
import { storage } from '../utils/storage.js';
import { showToast } from '../utils/toast.js';
import { walletService } from '../services/wallet.js';
import { openWalletModal } from './walletModal.js';

let drawerEl = null;
let overlayEl = null;

function getAvatar(name) {
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase();
  return `data:image/svg+xml,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
      <rect width="64" height="64" rx="32" fill="#EA4335"/>
      <text x="32" y="38" font-family="Inter,Arial,sans-serif" font-size="22" font-weight="700" fill="white" text-anchor="middle">${initials}</text>
    </svg>
  `)}`;
}

export function createDrawer() {
  overlayEl = document.createElement('div');
  overlayEl.className = 'drawer-overlay';
  overlayEl.id = 'drawer-overlay';

  drawerEl = document.createElement('div');
  drawerEl.className = 'drawer';
  drawerEl.id = 'drawer';

  const user = storage.get('user') || { name: 'Guest User', phone: 'Login to set profile' };
  const avatarHtml = user.profile_photo 
    ? `<img src="${user.profile_photo}" alt="Profile" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />`
    : `<img src="${getAvatar(user.name)}" alt="Avatar" style="width:100%;height:100%;" />`;

  drawerEl.innerHTML = `
    <div class="drawer-profile">
      <div class="drawer-avatar">
        ${avatarHtml}
      </div>
      <div class="drawer-user-info">
        <div class="drawer-name">${user.name}</div>
        <div class="drawer-email">${user.phone}</div>
      </div>
    </div>
    <div class="drawer-divider"></div>
    <nav class="drawer-menu">
      <div class="drawer-menu-item" data-page="profile">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        <span>Profile</span>
      </div>
      <div class="drawer-menu-item" id="drawer-wallet-btn" style="background:rgba(251,191,36,0.1);border-radius:10px;">
        <svg viewBox="0 0 24 24" fill="none" stroke="#FBBF24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
        <span style="font-weight:700;color:#FBBF24;">CHALO Wallet (<span id="drawer-wallet-amount">₹${walletService.getBalance()}</span>)</span>
      </div>
      <div class="drawer-menu-item" data-page="set-route">${icons.route}<span>Set Route</span></div>
      <div class="drawer-menu-item" data-page="transit">
        <svg viewBox="0 0 24 24" fill="currentColor" style="color:#22A147;"><path d="M12 2C8 2 4 3.5 4 7v7c0 2.21 1.79 4 4 4l-2 2v1h1l2-2h6l2 2h1v-1l-2-2c2.21 0 4-1.79 4-4V7c0-3.5-4-5-8-5zM7.5 17c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm3.5-6H6V7h5v4zm2 0V7h5v4h-5zm3.5 6c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg>
        <span style="font-weight:700;color:white;">Transit Hub (Metro & Trains)</span>
      </div>
      <div class="drawer-menu-item" data-page="add-route">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        <span>Add Route</span>
      </div>
      <div class="drawer-menu-item" data-page="settings">${icons.settings}<span>Settings</span></div>
      <div class="drawer-menu-item" data-page="support">${icons.support}<span>Support</span></div>
      <div class="drawer-menu-item" data-page="faqs">${icons.faq}<span>FAQs</span></div>
      <div class="drawer-divider" style="margin:8px 0;"></div>
      <div class="drawer-menu-item drawer-logout-btn" id="drawer-logout">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:#EA4335;"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        <span style="color:#EA4335;font-weight:700;">Logout</span>
      </div>
    </nav>
    <div class="drawer-footer">
      <div class="drawer-footer-item">
        <div>
          <div class="drawer-footer-label">Region</div>
          <div class="drawer-footer-value">Ahmedabad, India</div>
        </div>
        <div class="drawer-footer-arrow">${icons.chevronRight}</div>
      </div>
      <div class="drawer-footer-item">
        <div>
          <div class="drawer-footer-label">Currency</div>
          <div class="drawer-footer-value">₹ (Rupees)</div>
        </div>
        <div class="drawer-footer-arrow">${icons.chevronRight}</div>
      </div>
    </div>
  `;

  overlayEl.addEventListener('click', closeDrawer);

  drawerEl.querySelectorAll('.drawer-menu-item[data-page]').forEach(item => {
    item.addEventListener('click', () => {
      const page = item.dataset.page;
      closeDrawer();
      setTimeout(() => router.navigate(page), 300);
    });
  });

  // Wallet item handler
  drawerEl.querySelector('#drawer-wallet-btn')?.addEventListener('click', () => {
    closeDrawer();
    setTimeout(() => openWalletModal(), 250);
  });

  walletService.subscribe((bal) => {
    const el = drawerEl?.querySelector('#drawer-wallet-amount');
    if (el) el.textContent = `₹${bal}`;
  });

  // Logout handler
  drawerEl.querySelector('#drawer-logout')?.addEventListener('click', () => {
    closeDrawer();
    setTimeout(() => {
      storage.remove('auth_token');
      storage.remove('user');
      storage.remove('favorite_routes');
      window.dispatchEvent(new Event('chalo-auth-change'));
      showToast('Logged out successfully');
      router.navigate('login');
    }, 300);
  });

  return { overlay: overlayEl, drawer: drawerEl };
}

export function openDrawer() {
  if (overlayEl) overlayEl.classList.add('open');
  if (drawerEl) drawerEl.classList.add('open');
}

export function closeDrawer() {
  if (overlayEl) overlayEl.classList.remove('open');
  if (drawerEl) drawerEl.classList.remove('open');
}
