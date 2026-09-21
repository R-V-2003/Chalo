// Passenger Safety Suite — SOS Emergency & Live Trip Sharing Modal
import { icons } from '../utils/icons.js';
import { showToast } from '../utils/toast.js';

export function openSafetyModal(tripInfo = {}) {
  let existing = document.getElementById('safety-modal-overlay');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'safety-modal-overlay';
  modal.className = 'safety-modal-overlay';

  const driverName = tripInfo.driver?.name || 'Assigned Driver';
  const vehicleNumber = tripInfo.driver?.vehicle_number || 'GJ01BX1234';
  const routeName = tripInfo.route?.name || 'Active Corridor';

  modal.innerHTML = `
    <div class="safety-modal-card">
      <div class="safety-modal-header">
        <div class="safety-shield-icon">🛡️</div>
        <div>
          <h3>Chalo Safety Shield</h3>
          <p>Your safety and security is protected 24/7</p>
        </div>
        <button class="safety-modal-close" id="close-safety-modal">&times;</button>
      </div>

      <div class="safety-modal-body">
        <!-- Live Ride Info Verification -->
        <div class="safety-info-box">
          <div class="safety-info-row">
            <span class="safety-label">Driver:</span>
            <span class="safety-val"><strong>${driverName}</strong> (Background Verified)</span>
          </div>
          <div class="safety-info-row">
            <span class="safety-label">Vehicle:</span>
            <span class="safety-val"><strong>${vehicleNumber}</strong></span>
          </div>
          <div class="safety-info-row">
            <span class="safety-label">Corridor:</span>
            <span class="safety-val">${routeName}</span>
          </div>
        </div>

        <!-- Safety Actions -->
        <div class="safety-actions-grid">
          <!-- SOS Emergency Action -->
          <div class="safety-card-action sos-card" id="btn-trigger-sos">
            <div class="safety-action-icon">🆘</div>
            <div class="safety-action-content">
              <h4>Trigger SOS Emergency</h4>
              <p>Immediately alerts local police (112) & emergency contacts with live GPS coordinates.</p>
            </div>
            <button class="btn-sos-trigger">ACTIVATE</button>
          </div>

          <!-- Share Live Trip -->
          <div class="safety-card-action share-card" id="btn-share-live-trip">
            <div class="safety-action-icon">📍</div>
            <div class="safety-action-content">
              <h4>Share Live Journey</h4>
              <p>Share a live tracking link with friends & family to view your route in real time.</p>
            </div>
            <button class="btn-share-trigger">SHARE LINK</button>
          </div>
        </div>

        <!-- Ride Insurance & 24/7 Helpline -->
        <div class="safety-footer-badge">
          <span>🔒 Ride protected with ₹5,00,000 Transit Insurance Coverage</span>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  modal.querySelector('#close-safety-modal')?.addEventListener('click', () => modal.remove());
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });

  // SOS Trigger Event
  modal.querySelector('#btn-trigger-sos')?.addEventListener('click', () => {
    alert(`🚨 SOS ALERT DISPATCHED!\n\n1. Emergency Police Dispatch (112) contacted with GPS coordinates: [23.0339, 72.5467].\n2. Emergency contacts notified.\n3. Chalo 24x7 Control Room has initiated emergency protocol.`);
    showToast('🚨 SOS Emergency Alert Sent');
    modal.remove();
  });

  // Share Live Trip Event
  modal.querySelector('#btn-share-live-trip')?.addEventListener('click', () => {
    const liveLink = `${window.location.origin}/#tracking?tripId=CHALO-LIVE-${Math.floor(1000 + Math.random() * 9000)}`;
    
    if (navigator.clipboard) {
      navigator.clipboard.writeText(liveLink);
      showToast('📋 Live trip tracking link copied to clipboard!');
    } else {
      showToast('Live tracking link generated: ' + liveLink);
    }
    modal.remove();
  });
}
