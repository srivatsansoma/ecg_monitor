// State
let messageCount = 0;
let startTime = Date.now();
let recentMessages = [];
let logVisible = true;

// Elements
const statusEl = document.getElementById('status');
const statusDotEl = document.getElementById('status-dot');
const logEl = document.getElementById('log');
const dashboardEl = document.getElementById('dashboard');
const messageCountEl = document.getElementById('message-count');
const lastUpdateEl = document.getElementById('last-update');
const totalMessagesEl = document.getElementById('total-messages');
const rateEl = document.getElementById('rate');
const uptimeEl = document.getElementById('uptime');
const clearBtn = document.getElementById('clear');
const toggleLogBtn = document.getElementById('toggle-log');

// Vital signs configuration
const vitalConfigs = {
  temperature: { label: 'Temperature', unit: '°C', class: 'temperature', icon: '🌡️' },
  bodyHeat: { label: 'Body Heat', unit: '°C', class: 'temperature', icon: '🔥' },
  heartRate: { label: 'Heart Rate', unit: 'bpm', class: 'heart-rate', icon: '❤️' },
  ecg: { label: 'ECG', unit: 'mV', class: 'heart-rate', icon: '📈', decimals: 3 },
  systolicBP: { label: 'Systolic BP', unit: 'mmHg', class: 'blood-pressure', icon: '💉' },
  diastolicBP: { label: 'Diastolic BP', unit: 'mmHg', class: 'blood-pressure', icon: '💉' },
  respiratoryRate: { label: 'Respiratory Rate', unit: '/min', class: 'respiratory', icon: '💨' },
  spo2: { label: 'SpO₂', unit: '%', class: 'spo2', icon: '🫁' },
  etco2: { label: 'EtCO₂', unit: 'mmHg', class: 'respiratory', icon: '💨' },
  cardiacOutput: { label: 'Cardiac Output', unit: 'L/min', class: 'default', icon: '💓' }
};

// Connect to WebSocket
const ws = new WebSocket(`ws://${window.location.host}`);

ws.addEventListener('open', () => {
  updateStatus('Connected to AWS IoT Core', true);
});

ws.addEventListener('close', () => {
  updateStatus('Disconnected from AWS IoT Core', false);
});

ws.addEventListener('error', () => {
  updateStatus('Connection Error', false);
});

ws.addEventListener('message', (event) => {
  try {
    const message = JSON.parse(event.data);
    handleMessage(message);
  } catch (err) {
    console.error('Failed to parse message:', err);
  }
});

function updateStatus(text, connected) {
  statusEl.textContent = text;
  statusDotEl.className = connected ? 'status-dot' : 'status-dot disconnected';
}

function handleMessage(message) {
  messageCount++;
  recentMessages.push({ time: Date.now(), data: message });
  if (recentMessages.length > 60) recentMessages.shift();

  // Update stats
  updateStats();

  // Parse and update dashboard
  if (message.payload && typeof message.payload === 'object') {
    updateDashboard(message.payload, message.receivedAt);
  }

  // Add to log
  addLogEntry(message);
}

function updateDashboard(vitals, timestamp) {
  // Clear "no data" message
  if (dashboardEl.querySelector('.no-data')) {
    dashboardEl.innerHTML = '';
  }

  // Update or create cards for each vital
  Object.entries(vitals).forEach(([key, value]) => {
    if (key === 'timestamp') return; // Skip timestamp field

    const config = vitalConfigs[key];
    if (!config) {
      // Create default config for unknown vitals
      updateVitalCard(key, value, {
        label: key.replace(/([A-Z])/g, ' $1').trim(),
        unit: '',
        class: 'default',
        icon: '📊'
      }, timestamp);
    } else {
      updateVitalCard(key, value, config, timestamp);
    }
  });
}

function updateVitalCard(key, value, config, timestamp) {
  let cardEl = document.getElementById(`card-${key}`);
  
  if (!cardEl) {
    // Create new card
    cardEl = document.createElement('div');
    cardEl.id = `card-${key}`;
    cardEl.className = `vital-card ${config.class}`;
    cardEl.innerHTML = `
      <div class="vital-label">${config.icon} ${config.label}</div>
      <div class="vital-value" id="value-${key}">--</div>
      <div class="vital-unit">${config.unit}</div>
      <div class="vital-timestamp" id="time-${key}">--</div>
    `;
    dashboardEl.appendChild(cardEl);
  }

  // Update value
  const valueEl = document.getElementById(`value-${key}`);
  const timeEl = document.getElementById(`time-${key}`);
  
  const decimals = config.decimals || 1;
  const displayValue = typeof value === 'number' ? value.toFixed(decimals) : value;
  
  valueEl.textContent = displayValue;
  timeEl.textContent = `Updated ${formatTime(timestamp)}`;

  // Add flash animation
  cardEl.style.animation = 'none';
  setTimeout(() => {
    cardEl.style.animation = '';
  }, 10);
}

function addLogEntry(message) {
  const entryEl = document.createElement('div');
  entryEl.className = 'log-entry';
  
  const time = new Date(message.receivedAt).toLocaleTimeString();
  const topic = message.topic || 'unknown';
  const data = JSON.stringify(message.payload, null, 2);
  
  entryEl.innerHTML = `
    <div>
      <span class="log-entry-time">${time}</span>
      <span class="log-entry-topic">📡 ${topic}</span>
    </div>
    <div class="log-entry-data">${data}</div>
  `;
  
  logEl.insertBefore(entryEl, logEl.firstChild);
  
  // Keep only last 50 entries
  while (logEl.children.length > 50) {
    logEl.removeChild(logEl.lastChild);
  }
}

function updateStats() {
  messageCountEl.textContent = `${messageCount} messages received`;
  totalMessagesEl.textContent = messageCount;
  
  // Calculate messages per minute
  const now = Date.now();
  const oneMinuteAgo = now - 60000;
  const recentCount = recentMessages.filter(m => m.time > oneMinuteAgo).length;
  rateEl.textContent = recentCount;
  
  // Update last update time
  lastUpdateEl.textContent = `Last: ${new Date().toLocaleTimeString()}`;
  
  // Update uptime
  const uptimeSeconds = Math.floor((now - startTime) / 1000);
  uptimeEl.textContent = formatUptime(uptimeSeconds);
}

function formatTime(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleTimeString();
}

function formatUptime(seconds) {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
}

// Event listeners
clearBtn.addEventListener('click', () => {
  logEl.innerHTML = '';
  messageCount = 0;
  recentMessages = [];
  startTime = Date.now();
  updateStats();
});

toggleLogBtn.addEventListener('click', () => {
  logVisible = !logVisible;
  logEl.style.display = logVisible ? 'block' : 'none';
  toggleLogBtn.textContent = logVisible ? 'Hide Log' : 'Show Log';
});

// Update stats every second
setInterval(updateStats, 1000);
