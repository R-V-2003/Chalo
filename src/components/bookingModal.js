// Multimodal Transit Booking & Deep-Link Modal (Metro, BRTS, GSRTC, Railways)
// All bookings redirect to official portals — no in-app ticket generation

let bookingModalInstance = null;

export function openBookingModal(options = {}) {
  closeBookingModal();

  const mode = options.mode || 'metro'; // 'metro', 'brts', 'gsrtc', 'train'
  const title = options.title || 'Official Transit Booking';
  const destination = options.destination || 'Selected Destination';
  const fare = options.fare || '₹15';

  const overlay = document.createElement('div');
  overlay.className = 'booking-modal-overlay animate-fade-in';
  overlay.id = 'transit-booking-modal';

  let modeContent = '';

  if (mode === 'metro') {
    modeContent = `
      <div class="booking-mode-header metro">
        <div class="booking-mode-icon">🚇</div>
        <div>
          <h4>Ahmedabad Metro (GMRC)</h4>
          <p>Blue Line & Red Line Official Ticketing</p>
        </div>
      </div>

      <div class="booking-choice-cards">
        <div class="booking-choice-card highlight">
          <div class="booking-choice-badge">🏢 OFFICIAL GMRC</div>
          <div class="booking-choice-title">Gujarat Metro Rail Corporation</div>
          <div class="booking-choice-desc">Book your metro QR ticket, check fares and schedules on the official GMRC portal or app.</div>
          <div class="booking-btn-row">
            <a href="https://www.gujaratmetrorail.com/passenger-information/fare-calculator/" target="_blank" rel="noopener noreferrer" class="btn-booking-primary" style="text-align:center;text-decoration:none;">
              🌐 GMRC Official Website ↗
            </a>
            <a href="https://play.google.com/store/apps/details?id=com.gmrc.passengerapp" target="_blank" rel="noopener noreferrer" class="btn-booking-secondary">
              📱 GMRC App (Play Store) ↗
            </a>
          </div>
        </div>
      </div>
    `;
  } else if (mode === 'brts') {
    modeContent = `
      <div class="booking-mode-header brts">
        <div class="booking-mode-icon">🚌</div>
        <div>
          <h4>Janmarg BRTS (Ahmedabad Smart City)</h4>
          <p>Dedicated Median Bus Corridor Passes</p>
        </div>
      </div>

      <div class="booking-choice-cards">
        <div class="booking-choice-card highlight">
          <div class="booking-choice-badge">🏢 OFFICIAL JANMARG</div>
          <div class="booking-choice-title">Janmarg Official & Partner Portals</div>
          <div class="booking-choice-desc">Book passes and route tickets on Ahmedabad Janmarg portal or Paytm Transit.</div>
          <div class="booking-btn-row">
            <a href="https://ahmedabadjanmarg.co.in/" target="_blank" rel="noopener noreferrer" class="btn-booking-primary" style="background:#FF6B00;text-align:center;text-decoration:none;">
              🌐 Janmarg Official Portal ↗
            </a>
            <a href="https://paytm.com/transit/metro/ahmedabad" target="_blank" rel="noopener noreferrer" class="btn-booking-secondary">
              📱 Paytm BRTS QR Pass ↗
            </a>
          </div>
        </div>
      </div>
    `;
  } else if (mode === 'gsrtc' || mode === 'state_bus') {
    const destParam = encodeURIComponent(destination || 'MUMBAI');
    modeContent = `
      <div class="booking-mode-header gsrtc">
        <div class="booking-mode-icon">🚍</div>
        <div>
          <h4>GSRTC State Bus Reservation</h4>
          <p>Volvo AC, Sleeper & Gurjarnagri Intercity Buses</p>
        </div>
      </div>

      <div class="booking-choice-cards">
        <div class="booking-choice-card highlight">
          <div class="booking-choice-badge">🏢 OFFICIAL GSRTC</div>
          <div class="booking-choice-title">GSRTC Official Reservation Portal</div>
          <div class="booking-choice-desc">Pre-filled origin: <strong>Ahmedabad (Geeta Mandir Central / Paldi)</strong> ➔ <strong>${destination}</strong></div>
          <div class="booking-choice-price">Volvo AC: ₹650 / Sleeper: ₹850</div>
          <div class="booking-btn-row">
            <a href="https://gsrtc.in/GSRTCOnline/" target="_blank" rel="noopener noreferrer" class="btn-booking-primary" style="background:#2E7D32;text-align:center;text-decoration:none;">
              🚍 Open GSRTC Booking Portal (gsrtc.in) ↗
            </a>
            <a href="https://play.google.com/store/apps/details?id=com.gsrtc.official" target="_blank" rel="noopener noreferrer" class="btn-booking-secondary">
              📱 GSRTC Official Android App ↗
            </a>
          </div>
        </div>
      </div>
    `;
  } else {
    // Train (IRCTC)
    modeContent = `
      <div class="booking-mode-header train">
        <div class="booking-mode-icon">🚆</div>
        <div>
          <h4>Indian Railways (IRCTC) Ticketing</h4>
          <p>Ahmedabad Kalupur (ADI) ↔ ${destination}</p>
        </div>
      </div>

      <div class="booking-choice-cards">
        <div class="booking-choice-card highlight">
          <div class="booking-choice-badge">🇮🇳 IRCTC DIRECT</div>
          <div class="booking-choice-title">Book via IRCTC Official or ConfirmTkt</div>
          <div class="booking-choice-desc">Direct booking for Vande Bharat (#20902), Shatabdi (#12010), and Gujarat Mail (#12902).</div>
          <div class="booking-btn-row">
            <a href="https://www.irctc.co.in/nget/train-search" target="_blank" rel="noopener noreferrer" class="btn-booking-primary" style="background:#6A1B9A;text-align:center;text-decoration:none;">
              🚄 IRCTC Official e-Ticketing ↗
            </a>
            <a href="https://www.confirmtkt.com/" target="_blank" rel="noopener noreferrer" class="btn-booking-secondary">
              📱 ConfirmTkt Booking ↗
            </a>
          </div>
        </div>
      </div>
    `;
  }

  overlay.innerHTML = `
    <div class="booking-modal-sheet animate-slide-up">
      <div class="booking-modal-handle"></div>
      <div class="booking-modal-header">
        <div class="booking-header-title">${title}</div>
        <button class="booking-btn-close" id="btn-booking-close" aria-label="Close">✕</button>
      </div>

      <div class="booking-modal-body" id="booking-modal-dynamic">
        ${modeContent}
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  bookingModalInstance = overlay;

  overlay.querySelector('#btn-booking-close')?.addEventListener('click', closeBookingModal);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeBookingModal();
  });

  // No in-app ticket generation — all booking redirects to official portals
}


export function closeBookingModal() {
  if (bookingModalInstance) {
    bookingModalInstance.remove();
    bookingModalInstance = null;
  }
}
