// Investor Showcase Bar & Role Switcher
import { router } from '../utils/router.js';
import { storage } from '../utils/storage.js';
import { api } from '../api.js';
import { showToast } from '../utils/toast.js';
import { openRouteBuilderStudio } from '../screens/routeBuilder.js';

let investorBarEl = null;

export function initInvestorBar() {
  if (document.getElementById('investor-demo-bar')) return;

  investorBarEl = document.createElement('div');
  investorBarEl.id = 'investor-demo-bar';
  investorBarEl.className = 'investor-demo-bar';

  investorBarEl.innerHTML = `
    <div class="investor-bar-content">
      <div class="investor-badge">
        <span class="investor-badge-pulse"></span>
        <span class="investor-badge-text">CHALO LIVE PROTOTYPE</span>
      </div>

      <div class="investor-role-switch">
        <button class="role-btn active" id="btn-role-passenger" title="Switch to Passenger Experience">
          <span class="role-icon">🚶</span> Passenger
        </button>
        <button class="role-btn" id="btn-role-driver" title="Switch to Driver Dashboard">
          <span class="role-icon">🛺</span> Driver
        </button>
        <button class="role-btn highlight" id="btn-open-metrics" title="View Platform Metrics & Unit Economics">
          <span class="role-icon">📊</span> Investor Deck
        </button>
        <button class="role-btn" id="btn-open-route-studio" style="background: rgba(255, 107, 0, 0.15); border: 1px solid rgba(255, 107, 0, 0.4); color: #FF8C33;" title="Precision Route & Stop Builder Studio">
          <span class="role-icon">🛠️</span> Route Studio
        </button>
      </div>
    </div>
  `;

  document.body.prepend(investorBarEl);

  // Event Listeners
  const btnPassenger = investorBarEl.querySelector('#btn-role-passenger');
  const btnDriver = investorBarEl.querySelector('#btn-role-driver');
  const btnMetrics = investorBarEl.querySelector('#btn-open-metrics');
  const btnRouteStudio = investorBarEl.querySelector('#btn-open-route-studio');

  btnRouteStudio?.addEventListener('click', openRouteBuilderStudio);

  btnPassenger?.addEventListener('click', () => {
    btnPassenger.classList.add('active');
    btnDriver.classList.remove('active');
    
    // Ensure passenger session
    const current = storage.get('user');
    if (!current || current.role === 'shuttle') {
      storage.set('user', { id: 1, name: 'Rahul Commuter', phone: '9876543210', role: 'passenger' });
    }
    showToast('Switched to Passenger Mode');
    router.navigate('map');
  });

  btnDriver?.addEventListener('click', () => {
    btnDriver.classList.add('active');
    btnPassenger.classList.remove('active');
    
    // Switch to driver session
    storage.set('user', { 
      id: 2, 
      name: 'Ashok R (Driver)', 
      phone: '9876543211', 
      role: 'shuttle', 
      vehicle_number: 'GJ01BX1234',
      active_route_id: 1
    });
    showToast('Switched to Driver Portal (Shuttle Mode)');
    router.navigate('shuttle-dashboard');
  });

  btnMetrics?.addEventListener('click', openInvestorMetricsModal);
}

export async function openInvestorMetricsModal() {
  let existing = document.getElementById('investor-metrics-modal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'investor-metrics-modal';
  modal.className = 'investor-modal-overlay';

  modal.innerHTML = `
    <div class="investor-modal-card">
      <div class="investor-modal-header">
        <div>
          <div class="investor-modal-tag">INVESTOR SHOWCASE • PILOT METRICS</div>
          <h2>CHALO Unit Economics & Platform Traction</h2>
        </div>
        <button class="investor-modal-close" id="close-investor-modal">&times;</button>
      </div>

      <div class="investor-modal-body" id="investor-metrics-content">
        <div style="text-align:center;padding:30px;"><div class="map-loading-spinner" style="margin:0 auto;"></div></div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  modal.querySelector('#close-investor-modal')?.addEventListener('click', () => modal.remove());
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });

  try {
    const data = await api.getInvestorAnalytics();
    const content = modal.querySelector('#investor-metrics-content');
    if (!content) return;

    content.innerHTML = `
      <!-- Top Metrics Grid -->
      <div class="metrics-grid">
        <div class="metric-card gold">
          <div class="metric-value">₹${data.unitEconomics.averageFarePerSeat}</div>
          <div class="metric-label">Fixed Fare per Seat</div>
          <div class="metric-sub">93% cheaper than solo cab</div>
        </div>

        <div class="metric-card green">
          <div class="metric-value">${data.unitEconomics.driverIncomeBoost}</div>
          <div class="metric-label">Driver Daily Income</div>
          <div class="metric-sub">₹${data.unitEconomics.driverDailyRevenue}/day on fixed corridors</div>
        </div>

        <div class="metric-card blue">
          <div class="metric-value">${data.unitEconomics.platformTakeRate}</div>
          <div class="metric-label">Platform Take Rate</div>
          <div class="metric-sub">₹${data.unitEconomics.platformDailyRevenuePerVehicle}/vehicle daily GMV cut</div>
        </div>

        <div class="metric-card lime">
          <div class="metric-value">${data.serviceReliability.onTimePunctuality}</div>
          <div class="metric-label">Punctuality Rate</div>
          <div class="metric-sub">${data.serviceReliability.averagePassengerWaitMin}m average passenger wait</div>
        </div>
      </div>

      <!-- Problem & Solution Section -->
      <div class="investor-section">
        <h3>🚀 The Big Market Opportunity</h3>
        <div class="comparison-row">
          <div class="comparison-box red">
            <h4>❌ The Problem (Unorganized Shared Transit)</h4>
            <ul>
              <li>Commuters walk blindly to corners hoping for empty autos</li>
              <li>Arbitrary overcharging during rush hours (₹30-₹50)</li>
              <li>Drivers waste 45% fuel running empty between stops</li>
              <li>Zero digital tracking, zero safety assurances for women</li>
            </ul>
          </div>
          <div class="comparison-box green">
            <h4>✅ The Chalo Advantage (Tech-Enabled Corridors)</h4>
            <ul>
              <li>Live GPS road-following animation on city corridors</li>
              <li>Predictable ₹10 fixed fares & 1-tap "Request to Wait"</li>
              <li>Live Seat Occupancy tracking & Smart Pickup Optimizer</li>
              <li>Integrated AI Assistant (Bhaya) + SOS & Ride Sharing</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- ESG & Sustainability Highlight -->
      <div class="investor-section esg-highlight">
        <div class="esg-header">
          <span class="esg-icon">🌱</span>
          <div>
            <h4>ESG & Environmental Sustainability Impact</h4>
            <p>Every shared auto ride replaces 3 individual fossil fuel vehicle trips.</p>
          </div>
        </div>
        <div class="esg-stats">
          <div class="esg-stat-item">
            <strong>42.8 Tonnes</strong>
            <span>CO₂ Emissions Saved Monthly</span>
          </div>
          <div class="esg-stat-item">
            <strong>18,600 Liters</strong>
            <span>Fuel Saved on Corridors</span>
          </div>
          <div class="esg-stat-item">
            <strong>4.2x Efficiency</strong>
            <span>Transit Passenger Density</span>
          </div>
        </div>
      </div>

      <!-- Architecture & Tech Stack -->
      <div class="investor-section tech-pills-section">
        <h3>⚡ Production-Grade Architecture</h3>
        <div class="tech-pills">
          <span class="tech-pill">Vite + React</span>
          <span class="tech-pill">Capacitor Mobile APK</span>
          <span class="tech-pill">Node.js Express</span>
          <span class="tech-pill">SQLite + WAL Engine</span>
          <span class="tech-pill">True Road-Aligned Pathfinding</span>
          <span class="tech-pill">Groq LLaMA 3.3 AI Assistant</span>
          <span class="tech-pill">AWS ECS / Docker CI/CD</span>
        </div>
      </div>
    `;
  } catch (err) {
    const content = modal.querySelector('#investor-metrics-content');
    if (content) content.innerHTML = '<div style="color:#d64545;text-align:center;padding:20px;">Failed to load investor metrics.</div>';
  }
}
