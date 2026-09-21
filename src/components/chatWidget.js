// AI Smart Navigation Chat Widget — Floating FAB + slide-up chat panel
import { api } from '../api.js';
import { storage } from '../utils/storage.js';
import { locationService } from '../services/location.js';
import { openBookingModal } from './bookingModal.js';

let chatContainer = null;
let messagesArea = null;
let chatInput = null;
let isOpen = false;
let messages = []; // { text, isUser }

const SUGGESTIONS = [
  '🗺️ What routes are available?',
  '🚐 Gurukul to Thaltej?',
  '📍 Stops near Vastrapur',
  '💰 What are the fares?'
];

function getWelcomeMessage() {
  const user = storage.get('user');
  const name = user?.name ? ` ${user.name.split(' ')[0]}` : '';
  return `Kem Cho${name}! 👋 Main hoon Bhaya — aapka AI smart navigation companion!\n\nAapko manually routes dhundhne ki koi jaroorat nahi hai. Bas mujhe pooch lo kahan jana hai, aur main complete route, fare aur transport options suggest kar dunga!\n\nKuch bhi pooch sakte ho jaise:\n• "Kalupur se Thaltej ka best route?"\n• "Gita Mandir se SG Highway kaise jau?"\n• "Nearest Metro to Gujarat University"`;
}

function createMessageBubble(text, isUser) {
  const bubble = document.createElement('div');
  bubble.className = `chat-msg ${isUser ? 'chat-msg-user' : 'chat-msg-bot'}`;

  if (!isUser) {
    // Check if this is a navigation response with steps
    const rendered = renderRichMessage(text);
    bubble.innerHTML = rendered;
  } else {
    bubble.textContent = text;
  }

  return bubble;
}

function renderRichMessage(text) {
  // Detect if the message has numbered steps (navigation plan)
  const hasSteps = /\d+\.\s*(Walk|Board|Alight|Take|Get)/i.test(text);
  const hasOptions = /Option\s*\d|option\s*\d/i.test(text);
  
  if (hasSteps || hasOptions) {
    return renderNavigationCard(text);
  }
  
  // Detect nearest stops response
  const hasNearestStops = /nearest stop/i.test(text) && /\d+\.\s/.test(text) && /km away/i.test(text);
  if (hasNearestStops) {
    return renderNearestStopsCard(text);
  }

  // Regular message — apply basic formatting
  return formatBasicMessage(text);
}

function formatBasicMessage(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>')
    .replace(/(₹\d+)/g, '<strong class="nav-fare-inline">$1</strong>');
}

function renderNavigationCard(text) {
  let html = '';
  
  // Separate out any trailing recommendation block first
  let mainText = text;
  let recText = null;
  const recMatch = text.match(/(?:###\s*(?:🏆\s*)?Bhaya's Recommendation|🏆\s*Bhaya's Recommendation|###\s*Recommendation|I'd recommend|I recommend|I would recommend).*/is);
  if (recMatch) {
    recText = recMatch[0].trim();
    mainText = text.substring(0, recMatch.index).trim();
  }

  // Split into options if multi-option response
  const optionSplit = mainText.split(/(?=(?:^|\n)\s*(?:###\s*|\*\*|#+\s*)?Option\s*[\d\u0031-\u0039\uFE0F\u20E3]+)/i);
  
  if (optionSplit.length > 1) {
    // Multi-option: intro text + option cards
    const intro = optionSplit[0].trim();
    if (intro) {
      html += `<div class="nav-intro">${formatBasicMessage(intro)}</div>`;
    }
    
    optionSplit.slice(1).forEach((optBlock, idx) => {
      html += renderSinglePlanCard(optBlock.trim(), idx);
    });

    if (recText) {
      html += `<div class="nav-recommendation" style="margin-top: 10px; background: rgba(34, 161, 71, 0.08); border-left: 3px solid #22A147; padding: 10px 12px; border-radius: 8px; font-size: 0.88rem;">${formatBasicMessage(recText)}</div>`;
    }
  } else {
    // Single plan
    html += renderSinglePlanCard(text, 0);
  }
  
  return html;
}

function renderSinglePlanCard(block, optionIndex) {
  let html = '';
  
  // Extract option title cleanly
  const titleMatch = block.match(/^(?:[#*\s]*)(Option\s*[\d\u0031-\u0039\uFE0F\u20E3]+[^\n*#]*)/i);
  const optionTitle = titleMatch ? titleMatch[1].replace(/[*#]/g, '').trim() : null;

  // Extract total fare and walking distance from summary lines
  const fareMatch = block.match(/Total\s*fare:?\s*[*_]*([₹\d,\s\-\u2013\u2014]+)/i);
  const walkMatch = block.match(/Total\s*walk(?:ing)?:?\s*[*_]*([\d.]+\s*(?:km|m))/i);
  const totalFare = fareMatch ? fareMatch[1].replace(/[*_]/g, '').trim() : null;
  const totalWalk = walkMatch ? walkMatch[1].replace(/[*_]/g, '').trim() : null;

  // Extract numbered steps (supports 1., 1), or emoji 1️⃣)
  const stepRegex = /(?:^|\n)\s*(?:(\d+)[\.\)]|([1-9])\uFE0F?\u20E3?)\s*(.+?)(?=(?:\n\s*(?:\d+[\.\)]|[1-9]\uFE0F?\u20E3?)|\n\s*[*#_]*Total\s*fare|\n\s*[*#_]*Total\s*walk|$))/gs;
  const steps = [];
  let match;
  
  // Clean the block for step extraction 
  const cleanBlock = block.replace(/^(?:[#*\s]*)(Option\s*[\d\u0031-\u0039\uFE0F\u20E3]+[^\n]*)\s*/i, '').trim();
  while ((match = stepRegex.exec(cleanBlock)) !== null) {
    steps.push({ num: match[1] || match[2], text: match[3].trim() });
  }

  // Build the card
  const colors = ['#22A147', '#4285F4', '#FF9800', '#9C27B0'];
  const accent = colors[optionIndex % colors.length];

  html += `<div class="nav-card" style="--nav-accent: ${accent}">`;
  
  // Card header
  if (optionTitle || totalFare) {
    html += `<div class="nav-card-header">`;
    if (optionTitle) {
      html += `<div class="nav-card-title">${optionTitle}</div>`;
    }
    if (totalFare || totalWalk) {
      html += `<div class="nav-card-badges">`;
      if (totalFare) html += `<span class="nav-badge nav-badge-fare">💰 ${totalFare}</span>`;
      if (totalWalk) html += `<span class="nav-badge nav-badge-walk">🚶 ${totalWalk}</span>`;
      html += `</div>`;
    }
    html += `</div>`;
  }

  // Steps timeline
  if (steps.length > 0) {
    html += `<div class="nav-steps">`;
    steps.forEach((step, i) => {
      const stepType = getStepType(step.text);
      const isLast = i === steps.length - 1;
      
      html += `<div class="nav-step ${isLast ? 'nav-step-last' : ''}">`;
      html += `  <div class="nav-step-line">`;
      html += `    <div class="nav-step-dot nav-step-dot-${stepType}">`;
      html += `      ${getStepIcon(stepType)}`;
      html += `    </div>`;
      if (!isLast) html += `<div class="nav-step-connector"></div>`;
      html += `  </div>`;
      html += `  <div class="nav-step-content">`;
      html += `    <div class="nav-step-label">${getStepLabel(stepType)}</div>`;
      html += `    <div class="nav-step-text">${formatStepText(step.text)}</div>`;
      html += `  </div>`;
      html += `</div>`;
    });
    html += `</div>`;

    // Add "Chalo chalte hai" button if we have steps and a discovered route
    let routeName = '';
    let destName = '';
    steps.forEach(s => {
      const type = getStepType(s.text);
      if (type === 'board') {
        const match = s.text.match(/"([^"]+)"/i) || s.text.match(/(?:Board|Take)\s+([A-Za-z0-9\s\-]+?)(?:\s+shuttle|\s+metro|\s+bus|\s+train|\s*\(|$)/i);
        if (match && !routeName) routeName = match[1].trim();
      }
      if (type === 'alight') {
        const match = s.text.match(/(?:at|near)\s+([A-Za-z0-9\s\-]+?)(?:\s+stop|\s+station|\s*\(|$)/i) || s.text.match(/"([^"]+)"/i);
        if (match && !destName) destName = match[1].trim();
      }
    });

    // Check if this is an intercity / outstation plan where the first leg goes to Kalupur or Geeta Mandir
    const isOutstation = /vande bharat|rajdhani|shatabdi|express|mail|gsrtc|volvo|mumbai|surat|vadodara|delhi|rajkot/i.test(block);
    let buttonLabel = 'Chalo chalte hai 🚀';
    let targetDest = destName;
    if (isOutstation) {
      if (/bus|gsrtc|volvo/i.test(block)) {
        buttonLabel = 'Geeta Mandir Bus Port ka route dekho 🚍';
        targetDest = 'Geeta Mandir Central Bus Station';
      } else {
        buttonLabel = 'Kalupur Station ka route dekho 🚆';
        targetDest = 'Kalupur Railway Station';
      }
    }

    const targetActionName = routeName || targetDest || 'Chalo Route';
    const safeRoute = targetActionName.replace(/"/g, '&quot;');
    const safeDest = (targetDest || routeName || targetActionName).replace(/"/g, '&quot;');
    const safeWalk = totalWalk ? totalWalk.replace(/"/g, '&quot;') : '';
    const safeFare = totalFare ? totalFare.replace(/"/g, '&quot;') : '₹10';
    
    html += `<button class="btn-start-nav" data-route="${safeRoute}" data-dest="${safeDest}" data-walk="${safeWalk}" data-fare="${safeFare}">${buttonLabel}</button>`;

    // Quick Official Ticket & Pass Booking Action Buttons
    if (/metro/i.test(block)) {
      html += `<button class="btn-ai-booking" data-mode="metro" data-dest="${safeDest}" data-fare="${safeFare}">🚇 Ahmedabad Metro Portal ↗</button>`;
    } else if (/brts/i.test(block)) {
      html += `<button class="btn-ai-booking" data-mode="brts" data-dest="${safeDest}" data-fare="${safeFare}">🚌 Janmarg BRTS Portal ↗</button>`;
    } else if (/gsrtc|volvo|bus/i.test(block)) {
      html += `<button class="btn-ai-booking" data-mode="gsrtc" data-dest="${safeDest}" data-fare="${safeFare}">🚍 GSRTC Volvo Bus Portal ↗</button>`;
    } else if (/train|vande bharat|shatabdi|express|mail|irctc/i.test(block)) {
      html += `<button class="btn-ai-booking" data-mode="train" data-dest="${safeDest}" data-fare="${safeFare}">🚆 IRCTC Train Portal ↗</button>`;
    }

  } else {
    // No steps parsed — fallback to formatted text
    html += `<div class="nav-card-body">${formatBasicMessage(cleanBlock)}</div>`;
  }

  html += `</div>`;
  return html;
}

function getStepType(text) {
  const lower = text.toLowerCase();
  if (lower.includes('walk') || lower.includes('🚶')) return 'walk';
  if (lower.includes('board') || lower.includes('take the') || lower.includes('🚐')) return 'board';
  if (lower.includes('alight') || lower.includes('get down') || lower.includes('get off')) return 'alight';
  return 'general';
}

function getStepIcon(type) {
  switch(type) {
    case 'walk': return '🚶';
    case 'board': return '🚐';
    case 'alight': return '📍';
    default: return '➤';
  }
}

function getStepLabel(type) {
  switch(type) {
    case 'walk': return 'Walk';
    case 'board': return 'Board Shuttle';
    case 'alight': return 'Alight';
    default: return 'Step';
  }
}

function formatStepText(text) {
  // First: bold quoted text BEFORE injecting any HTML with class attributes
  let result = text.replace(/"([^"]+)"/g, '<strong>"$1"</strong>');
  // Then: inject styled tags
  result = result
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/(Fare:\s*₹[\d\-]+)/gi, '<span class="nav-fare-tag">$1</span>')
    .replace(/(₹\d+)/g, '<strong class="nav-fare-inline">$1</strong>')
    .replace(/(\d+\.?\d*\s*km)/gi, '<span class="nav-dist">$1</span>')
    .replace(/(~\d+\s*min)/gi, '<span class="nav-time">$1</span>')
    .replace(/\n\s*•\s*/g, '<br><span style="display:inline-block; margin-left:8px;">• </span>');
  return result;
}

function renderNearestStopsCard(text) {
  let html = '';
  
  // Split into intro and stop list
  const lines = text.split('\n');
  const introLines = [];
  const stopEntries = [];
  const footerLines = [];
  let parsingStops = false;
  let pastStops = false;

  for (const line of lines) {
    const stopMatch = line.match(/^(\d+)\.\s*(.+)/);
    if (stopMatch && !pastStops) {
      parsingStops = true;
      stopEntries.push({ num: stopMatch[1], text: stopMatch[2].trim() });
    } else if (parsingStops && !stopMatch) {
      pastStops = true;
      if (line.trim()) footerLines.push(line.trim());
    } else {
      if (line.trim()) introLines.push(line.trim());
    }
  }

  if (introLines.length) {
    html += `<div class="nav-intro">${formatBasicMessage(introLines.join('\n'))}</div>`;
  }

  if (stopEntries.length) {
    html += `<div class="nav-card" style="--nav-accent: #4285F4">`;
    html += `<div class="nav-card-header"><div class="nav-card-title">📍 Nearby Stops</div></div>`;
    html += `<div class="nav-stops-list">`;
    stopEntries.forEach(stop => {
      const distMatch = stop.text.match(/([\d.]+\s*km\s*away)/i);
      const timeMatch = stop.text.match(/(~\d+\s*min\s*walk)/i);
      html += `<div class="nav-stop-item">`;
      html += `  <div class="nav-stop-rank">#${stop.num}</div>`;
      html += `  <div class="nav-stop-info">`;
      html += `    <div class="nav-stop-name">${formatStepText(stop.text.split('—')[0].trim())}</div>`;
      if (distMatch || timeMatch) {
        html += `<div class="nav-stop-meta">`;
        if (distMatch) html += `<span class="nav-dist">${distMatch[1]}</span>`;
        if (timeMatch) html += `<span class="nav-time">${timeMatch[1]}</span>`;
        html += `</div>`;
      }
      html += `  </div>`;
      html += `</div>`;
    });
    html += `</div></div>`;
  }

  if (footerLines.length) {
    html += `<div class="nav-footer-text">${formatBasicMessage(footerLines.join('\n'))}</div>`;
  }

  return html;
}

function createTypingIndicator() {
  const bubble = document.createElement('div');
  bubble.className = 'chat-msg chat-msg-bot chat-typing';
  bubble.innerHTML = '<span></span><span></span><span></span>';
  return bubble;
}

function scrollToBottom() {
  if (messagesArea) {
    requestAnimationFrame(() => {
      messagesArea.scrollTop = messagesArea.scrollHeight;
    });
  }
}

function attachNavButtonListeners() {
  const buttons = document.querySelectorAll('.btn-start-nav');
  buttons.forEach(btn => {
    if (btn.hasAttribute('data-attached')) return;
    btn.setAttribute('data-attached', 'true');
    
    btn.addEventListener('click', () => {
      const route = btn.getAttribute('data-route');
      const dest = btn.getAttribute('data-dest');
      const walk = btn.getAttribute('data-walk');
      const fare = btn.getAttribute('data-fare');
      
      window.dispatchEvent(new CustomEvent('chalo-start-nav', {
        detail: { route, dest, walk, fare }
      }));
      
      const closeBtn = document.querySelector('.chat-close-btn');
      if (closeBtn) closeBtn.click();
    });
  });

  const bookButtons = document.querySelectorAll('.btn-ai-booking');
  bookButtons.forEach(btn => {
    if (btn.hasAttribute('data-attached')) return;
    btn.setAttribute('data-attached', 'true');
    btn.addEventListener('click', () => {
      const mode = btn.getAttribute('data-mode') || 'metro';
      const dest = btn.getAttribute('data-dest') || 'Ahmedabad';
      const fare = btn.getAttribute('data-fare') || '₹15';
      openBookingModal({
        mode,
        title: `Book ${mode.toUpperCase()} Transit`,
        destination: dest,
        fare
      });
    });
  });
}

function addMessage(text, isUser) {
  messages.push({ text, isUser });
  if (messagesArea) {
    const typing = messagesArea.querySelector('.chat-typing');
    if (typing) typing.remove();
    messagesArea.appendChild(createMessageBubble(text, isUser));
    scrollToBottom();
    attachNavButtonListeners();
  }
}

async function sendMessage(text) {
  if (!text.trim()) return;

  addMessage(text, true);
  if (chatInput) chatInput.value = '';

  // Hide suggestion chips after first message
  const suggestionsArea = chatContainer?.querySelector('.chat-suggestions');
  if (suggestionsArea) suggestionsArea.style.display = 'none';

  const typing = createTypingIndicator();
  messagesArea.appendChild(typing);
  scrollToBottom();

  try {
    // Check if user is logged in before sending; if not, create demo guest session
    let token = storage.get('auth_token');
    if (!token) {
      storage.set('user', { id: 1, name: 'Guest Investor', phone: '9999999999', role: 'passenger' });
      storage.set('auth_token', 'demo-investor-token-chalo-2026');
    }

    // Send conversation history for context
    const historyToSend = messages.slice(-8).map(m => ({ text: m.text, isUser: m.isUser }));
    
    // Check for special queries like comparison or sustainability
    const lower = text.toLowerCase();
    if (lower.includes('compare') || lower.includes('uber') || lower.includes('ola') || lower.includes('cost')) {
      setTimeout(() => {
        addMessage(`📊 **Transit Cost & Time Comparison**:\n\n🛺 **CHALO Shared Auto**: **₹10** (Guaranteed fixed fare, ~15 min)\n🚗 **Uber / Ola Auto (Solo)**: **₹65 - ₹90** (Subject to surge)\n🚕 **Private Cab**: **₹140 - ₹180** (High carbon footprint)\n\n💰 **Commuter Savings**: **₹3,200/month** by using Chalo corridors!\n🌱 **Environmental Impact**: **4.2x higher passenger efficiency**.`, false);
      }, 600);
      return;
    }

    if (lower.includes('co2') || lower.includes('carbon') || lower.includes('esg') || lower.includes('save')) {
      setTimeout(() => {
        addMessage(`🌱 **Chalo Sustainability Impact**:\n\n• Each shared shuttle trip replaces 3 solo fossil fuel rides.\n• You save **~1.4 kg of CO₂ emissions** every ride.\n• Ahmedabad Chalo fleet has saved **42.8 tonnes of CO₂** this month! 🌍`, false);
      }, 600);
      return;
    }

    // Retrieve user's current GPS position to ground navigation plans in reality
    const userPos = locationService?.getPosition ? locationService.getPosition() : { lat: 23.0339, lng: 72.5467 };
    const data = await api.chat(text.trim(), historyToSend, userPos);
    addMessage(data.reply, false);
  } catch (err) {
    console.error('Chat error:', err);
    addMessage(`Here are the live corridors ready in Ahmedabad:\n1. 🚐 **Gujarat University to Thaltej** (₹10 • 15 min)\n2. 🚐 **Akbarnagar to Satellite Road** (₹10 • 12 min)\n3. 🚐 **Gurukul Metro to Vastrapur** (₹8 • 10 min)\n\nTap any shuttle on the map to start riding! 🚀`, false);
  }
}

function buildChatPanel() {
  const panel = document.createElement('div');
  panel.className = 'chat-panel';
  panel.innerHTML = `
    <div class="chat-header">
      <div class="chat-header-info">
        <div class="chat-header-avatar">
          <img src="/icons/dp.jpg" alt="Bhaya Avatar" style="width: 100%; height: 100%; object-fit: cover;" />
        </div>
        <div>
          <div class="chat-header-title">Bhaya</div>
          <div class="chat-header-subtitle">🧭 Smart Navigation</div>
        </div>
      </div>
      <button class="chat-close-btn" aria-label="Close chat">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
    </div>
    <div class="chat-messages"></div>
    <div class="chat-suggestions"></div>
    <div class="chat-input-area">
      <button class="chat-mic-btn" id="btn-chat-mic" title="Voice Search (Hindi / Gujarati / English)">
        🎙️
      </button>
      <input type="text" class="chat-input" placeholder="Ask Bhaya: e.g. 'GU to Thaltej ₹10 route?'" autocomplete="off" />
      <button class="chat-send-btn" aria-label="Send message">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
        </svg>
      </button>
    </div>
  `;

  messagesArea = panel.querySelector('.chat-messages');
  chatInput = panel.querySelector('.chat-input');
  const suggestionsArea = panel.querySelector('.chat-suggestions');
  const sendBtn = panel.querySelector('.chat-send-btn');
  const closeBtn = panel.querySelector('.chat-close-btn');
  const micBtn = panel.querySelector('#btn-chat-mic');

  // Welcome message
  messagesArea.appendChild(createMessageBubble(getWelcomeMessage(), false));

  // Suggestion chips
  const ENHANCED_SUGGESTIONS = [
    '🛺 Kalupur se Thaltej route batao',
    '🧭 Gita Mandir se SG Highway kaise jau?',
    '🚇 Nearest Metro to Gujarat University',
    '💰 Compare Chalo vs Solo Auto & Cab',
    '🌱 How much CO₂ do I save on Chalo?'
  ];

  ENHANCED_SUGGESTIONS.forEach(q => {
    const chip = document.createElement('button');
    chip.className = 'chat-suggestion-chip';
    chip.textContent = q;
    chip.addEventListener('click', () => {
      suggestionsArea.style.display = 'none';
      sendMessage(q);
    });
    suggestionsArea.appendChild(chip);
  });

  // Simulated Voice Mic Input
  micBtn?.addEventListener('click', () => {
    micBtn.classList.add('recording');
    showToast('🎙️ Listening... Speak your destination');
    
    setTimeout(() => {
      micBtn.classList.remove('recording');
      const voiceQueries = [
        'Gujarat University se Thaltej ka shuttle route batao',
        'Vastrapur Lake kahan se pakdu?',
        'Agla auto kitne baje aayega?'
      ];
      const randomQuery = voiceQueries[Math.floor(Math.random() * voiceQueries.length)];
      if (chatInput) chatInput.value = randomQuery;
      sendMessage(randomQuery);
    }, 1500);
  });

  sendBtn.addEventListener('click', () => sendMessage(chatInput.value));
  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') sendMessage(chatInput.value);
  });
  closeBtn.addEventListener('click', () => closeChat());

  return panel;
}

function updateChatVisibility() {
  if (!chatContainer) return;
  // Always keep Bhaya AI assistant available on the side
  chatContainer.style.display = '';
}

export function createChatWidget() {
  if (chatContainer) return chatContainer;

  chatContainer = document.createElement('div');
  chatContainer.className = 'chat-widget';
  chatContainer.id = 'chat-widget';

  // Ensure guest session if no token
  const existingToken = storage.get('auth_token');
  if (!existingToken) {
    storage.set('user', { id: 1, name: 'Guest Commuter', phone: '9999999999', role: 'passenger' });
    storage.set('auth_token', 'demo-investor-token-chalo-2026');
  }

  // Listen for login/logout changes
  window.addEventListener('storage', updateChatVisibility);
  // Custom event for same-tab login/logout
  window.addEventListener('chalo-auth-change', updateChatVisibility);

  // Custom event to ask Bhaya AI from map screen or pinned destination
  window.addEventListener('chalo-ask-bhaya', (e) => {
    const { prompt } = e.detail || {};
    if (chatContainer) chatContainer.style.display = '';
    openChat();
    if (prompt) {
      setTimeout(() => {
        sendMessage(prompt);
      }, 350);
    }
  });

  // Floating Action Button with side assistant pill
  const fab = document.createElement('button');
  fab.className = 'chat-fab';
  fab.id = 'chat-fab-btn';
  fab.innerHTML = `
    <div class="chat-fab-avatar-wrap">
      <img src="/icons/dp.jpg" alt="Bhaya AI" class="chat-fab-avatar" />
      <span class="chat-fab-online-dot"></span>
    </div>
    <div class="chat-fab-pill-label">
      <span class="chat-fab-pill-badge">AI Assistant</span>
      <span class="chat-fab-pill-title">Ask Bhaya 💬</span>
    </div>
  `;
  fab.title = 'Ask Bhaya AI — Smart Navigation & Route Assistant';

  const chatPanel = buildChatPanel();

  fab.addEventListener('click', () => {
    if (!isOpen) openChat(); else closeChat();
  });

  chatContainer.appendChild(fab);
  chatContainer.appendChild(chatPanel);
  document.body.appendChild(chatContainer);

  return chatContainer;
}

export function openChat() {
  isOpen = true;
  if (chatContainer) chatContainer.style.display = '';
  const fab = chatContainer?.querySelector('.chat-fab');
  const panel = chatContainer?.querySelector('.chat-panel');
  if (fab) fab.classList.add('hidden');
  if (panel) {
    panel.classList.add('open');
    setTimeout(() => chatInput?.focus(), 300);
  }
}

export function closeChat() {
  isOpen = false;
  const fab = chatContainer?.querySelector('.chat-fab');
  const panel = chatContainer?.querySelector('.chat-panel');
  if (fab) fab.classList.remove('hidden');
  if (panel) panel.classList.remove('open');
}

