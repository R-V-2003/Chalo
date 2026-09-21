// CHALO Cashless Wallet Service — Zero-Lag Offline-Resilient 1-Tap Payments
import { storage } from '../utils/storage.js';
import { showToast } from '../utils/toast.js';

const WALLET_BALANCE_KEY = 'chalo_wallet_balance';
const WALLET_TXNS_KEY = 'chalo_wallet_txns';
const DEFAULT_INITIAL_BALANCE = 150;

const DEFAULT_TXNS = [
  {
    id: 'TXN-INIT-901',
    type: 'credit',
    amount: 150,
    title: 'Welcome Bonus / Initial Top-Up',
    subtitle: 'UPI Instant Load • Zero Payment Gateway Lag',
    time: '09:00 AM',
    date: 'Today',
    icon: '🎁'
  }
];

class WalletService {
  constructor() {
    this.listeners = [];
    this.init();
  }

  init() {
    if (localStorage.getItem(WALLET_BALANCE_KEY) === null) {
      localStorage.setItem(WALLET_BALANCE_KEY, String(DEFAULT_INITIAL_BALANCE));
    }
    if (localStorage.getItem(WALLET_TXNS_KEY) === null) {
      localStorage.setItem(WALLET_TXNS_KEY, JSON.stringify(DEFAULT_TXNS));
    }
  }

  getBalance() {
    const val = localStorage.getItem(WALLET_BALANCE_KEY);
    return val !== null ? parseFloat(val) : DEFAULT_INITIAL_BALANCE;
  }

  getTransactions() {
    try {
      const data = localStorage.getItem(WALLET_TXNS_KEY);
      return data ? JSON.parse(data) : DEFAULT_TXNS;
    } catch {
      return DEFAULT_TXNS;
    }
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify() {
    const bal = this.getBalance();
    const txns = this.getTransactions();
    this.listeners.forEach(fn => {
      try { fn(bal, txns); } catch (e) { console.error('Wallet listener error:', e); }
    });
  }

  topUp(amount, method = 'Google Pay / PhonePe UPI') {
    const num = Math.round(Number(amount));
    if (isNaN(num) || num <= 0) return { success: false, message: 'Invalid amount' };

    const currentBal = this.getBalance();
    const newBal = currentBal + num;
    localStorage.setItem(WALLET_BALANCE_KEY, String(newBal));

    const txn = {
      id: 'TXN-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
      type: 'credit',
      amount: num,
      title: `Wallet Top-Up (${method})`,
      subtitle: 'Instant Cashless Preload • No Network Lag',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: 'Today',
      icon: '⚡'
    };

    const txns = this.getTransactions();
    txns.unshift(txn);
    localStorage.setItem(WALLET_TXNS_KEY, JSON.stringify(txns.slice(0, 30)));

    this.notify();
    return { success: true, newBalance: newBal, txn };
  }

  payShuttleFare(amount = 10, tripInfo = {}) {
    const num = Math.round(Number(amount)) || 10;
    const currentBal = this.getBalance();

    if (currentBal < num) {
      return {
        success: false,
        message: `Insufficient wallet balance (₹${currentBal}). Please top up at least ₹${num - currentBal}.`
      };
    }

    const newBal = currentBal - num;
    localStorage.setItem(WALLET_BALANCE_KEY, String(newBal));

    const driverName = tripInfo.driverName || 'Ashok R (Auto Driver)';
    const routeName = tripInfo.routeName || 'Shared Auto Corridor';

    const txn = {
      id: 'TXN-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
      type: 'debit',
      amount: num,
      title: `Shared Shuttle Ride (${routeName})`,
      subtitle: `Direct to ${driverName} • Instant Shift Settlement`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: 'Today',
      icon: '🛺'
    };

    const txns = this.getTransactions();
    txns.unshift(txn);
    localStorage.setItem(WALLET_TXNS_KEY, JSON.stringify(txns.slice(0, 30)));

    // Record driver wallet collection in session storage so driver dashboard increments!
    try {
      const driverColl = parseFloat(sessionStorage.getItem('chalo_driver_wallet_coll') || '612');
      sessionStorage.setItem('chalo_driver_wallet_coll', String(driverColl + num));
    } catch {}

    this.notify();
    return { success: true, newBalance: newBal, txn };
  }
}

export const walletService = new WalletService();
