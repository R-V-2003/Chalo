// CHALO Cashless Wallet Modal — Preloaded 1-Tap Zero-Lag Auto Payments
import { walletService } from '../services/wallet.js';
import { showToast } from '../utils/toast.js';
import { icons } from '../utils/icons.js';

let modalInstance = null;

export function openWalletModal(onSuccess = null) {
  closeWalletModal();

  const balance = walletService.getBalance();
  const txns = walletService.getTransactions();

  const overlay = document.createElement('div');
  overlay.className = 'wallet-modal-overlay animate-fade-in';
  overlay.id = 'chalo-wallet-modal';

  overlay.innerHTML = `
    <div class="wallet-modal-sheet animate-slide-up">
      <div class="wallet-modal-handle"></div>
      
      <div class="wallet-modal-header">
        <div class="wallet-header-title-row">
          <div class="wallet-header-icon">💳</div>
          <div>
            <h3 class="wallet-title">CHALO Cashless Wallet</h3>
            <p class="wallet-subtitle">Zero Network Lag • 1-Tap Instant Driver Settlement</p>
          </div>
        </div>
        <button class="wallet-btn-close" id="btn-wallet-close" aria-label="Close">✕</button>
      </div>

      <!-- Zero-Lag Guarantee Callout -->
      <div class="wallet-callout-banner">
        <span class="callout-icon">⚡</span>
        <div class="callout-text">
          <strong>Direct Auto Settlement:</strong> Shuttle drivers receive your fare instantly without waiting for UPI network verification or bank timeouts.
        </div>
      </div>

      <!-- Main Balance Card -->
      <div class="wallet-balance-card">
        <div class="wallet-balance-top">
          <span class="wallet-balance-label">AVAILABLE BALANCE</span>
          <span class="wallet-verified-tag">✓ ACTIVE</span>
        </div>
        <div class="wallet-balance-amount" id="wallet-display-balance">₹${balance}</div>
        <div class="wallet-balance-footer">
          <span>Guaranteed fixed ₹10 / ₹8 shared shuttle fares</span>
          <span>~${Math.floor(balance / 10)} rides</span>
        </div>
      </div>

      <!-- Quick Top-Up Section -->
      <div class="wallet-topup-section">
        <div class="wallet-section-title">Add Money to Wallet</div>
        <div class="wallet-amount-chips" id="wallet-chips-container">
          <button class="wallet-chip" data-amt="50">+ ₹50</button>
          <button class="wallet-chip active" data-amt="100">+ ₹100</button>
          <button class="wallet-chip" data-amt="200">+ ₹200</button>
          <button class="wallet-chip" data-amt="500">+ ₹500</button>
        </div>

        <div class="wallet-input-row">
          <span class="wallet-input-currency">₹</span>
          <input type="number" class="wallet-custom-input" id="wallet-custom-amt" value="100" placeholder="Enter amount" min="10" max="5000" />
          <button class="wallet-btn-topup" id="btn-perform-topup">
            <span>⚡ Top-Up Now</span>
          </button>
        </div>
      </div>

      <!-- Transaction History -->
      <div class="wallet-txns-section">
        <div class="wallet-section-title">Recent Transactions</div>
        <div class="wallet-txns-list" id="wallet-txns-list">
          ${renderTransactionList(txns)}
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  modalInstance = overlay;

  // Event Listeners
  overlay.querySelector('#btn-wallet-close')?.addEventListener('click', closeWalletModal);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeWalletModal();
  });

  const customInput = overlay.querySelector('#wallet-custom-amt');
  const chips = overlay.querySelectorAll('.wallet-chip');

  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      chips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      if (customInput) customInput.value = chip.dataset.amt;
    });
  });

  overlay.querySelector('#btn-perform-topup')?.addEventListener('click', () => {
    const amt = parseFloat(customInput.value);
    if (!amt || amt < 10) {
      showToast('Please enter a valid amount (minimum ₹10)');
      return;
    }

    const btn = overlay.querySelector('#btn-perform-topup');
    btn.disabled = true;
    btn.innerHTML = '<span>Processing...</span>';

    setTimeout(() => {
      const res = walletService.topUp(amt, 'UPI Auto-Pay');
      if (res.success) {
        showToast(`₹${amt} added to CHALO Wallet successfully! ⚡`);
        overlay.querySelector('#wallet-display-balance').textContent = `₹${res.newBalance}`;
        overlay.querySelector('#wallet-txns-list').innerHTML = renderTransactionList(walletService.getTransactions());
        btn.disabled = false;
        btn.innerHTML = '<span>⚡ Top-Up Now</span>';
        if (typeof onSuccess === 'function') onSuccess(res.newBalance);
      }
    }, 450);
  });
}

function renderTransactionList(txns) {
  if (!txns || txns.length === 0) {
    return `<div class="wallet-empty-txns">No transactions yet</div>`;
  }

  return txns.map(t => `
    <div class="wallet-txn-item">
      <div class="wallet-txn-icon ${t.type}">${t.icon || (t.type === 'credit' ? '➕' : '🛺')}</div>
      <div class="wallet-txn-info">
        <div class="wallet-txn-title">${t.title}</div>
        <div class="wallet-txn-meta">${t.subtitle || ''} • ${t.time}</div>
      </div>
      <div class="wallet-txn-amt ${t.type}">
        ${t.type === 'credit' ? '+' : '-'}₹${t.amount}
      </div>
    </div>
  `).join('');
}

export function closeWalletModal() {
  if (modalInstance) {
    modalInstance.remove();
    modalInstance = null;
  }
}
