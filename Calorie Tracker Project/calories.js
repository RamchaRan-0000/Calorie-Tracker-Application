let goal   = 2000;
let eaten  = 0;
let burned = 0;

const MET = {
  running: 8, cycling: 6, walking: 3.5,
  swimming: 7, gym: 5, hiit: 9, yoga: 2.5, cricket: 5
};

let intakeChart = null;
let burnChart   = null;
let compareChart = null;

/* =============================================
   HELPERS
============================================= */

// Returns today's date as a consistent string key  e.g. "19/04/2025"
function todayKey() {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

// Returns a friendly display version e.g. "Sunday, 19 April 2025"
function friendlyDate(key) {
  if (!key) return '';
  // key is dd/mm/yyyy
  const parts = key.split('/');
  if (parts.length !== 3) return key;
  const d = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
  if (isNaN(d)) return key;
  return d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

// Get all history from localStorage — always returns array
function getHistory() {
  try {
    const raw = localStorage.getItem('nt_history');
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

// Push one entry and save
function pushHistory(entry) {
  const all = getHistory();
  all.push(entry);
  localStorage.setItem('nt_history', JSON.stringify(all));
}

function saveData() {
  localStorage.setItem('nt_goal',   String(goal));
  localStorage.setItem('nt_eaten',  String(eaten));
  localStorage.setItem('nt_burned', String(burned));
}

function loadData() {
  goal   = parseFloat(localStorage.getItem('nt_goal'))   || 2000;
  eaten  = parseFloat(localStorage.getItem('nt_eaten'))  || 0;
  burned = parseFloat(localStorage.getItem('nt_burned')) || 0;
  if (isNaN(goal)   || goal   <= 0) goal   = 2000;
  if (isNaN(eaten)  || eaten  <  0) eaten  = 0;
  if (isNaN(burned) || burned <  0) burned = 0;
}

function toast(msg, type = 'ok') {
  const box = document.getElementById('toastBox');
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.textContent = (type === 'ok' ? '✅ ' : '❌ ') + msg;
  box.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

/* =============================================
   LANDING / AUTH NAV
============================================= */
function scrollTo(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth' });
}

function showAuth(type) {
  document.getElementById('landingPage').classList.add('hidden');
  document.getElementById('authPage').classList.remove('hidden');
  document.getElementById('signupBox').classList.toggle('hidden', type !== 'signup');
  document.getElementById('loginBox').classList.toggle('hidden', type !== 'login');
  document.getElementById('onboardBox').classList.add('hidden');
}

function backToLanding() {
  document.getElementById('authPage').classList.add('hidden');
  document.getElementById('landingPage').classList.remove('hidden');
}

/* =============================================
   REGISTER
============================================= */
function registerUser() {
  const name  = document.getElementById('regName').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const pass  = document.getElementById('regPass').value.trim();
  if (!name)  { toast('Please enter your name', 'err'); return; }
  if (!email) { toast('Please enter your email', 'err'); return; }
  if (pass.length < 6) { toast('Password must be at least 6 characters', 'err'); return; }
  localStorage.setItem('nt_name',  name);
  localStorage.setItem('nt_email', email);
  localStorage.setItem('nt_pass',  pass);
  toast('Account created! Please login.');
  showAuth('login');
}

/* =============================================
   LOGIN
============================================= */
function loginUser() {
  const email = document.getElementById('loginEmail').value.trim();
  const pass  = document.getElementById('loginPass').value.trim();
  const savedEmail = localStorage.getItem('nt_email');
  const savedPass  = localStorage.getItem('nt_pass');
  if (email === savedEmail && pass === savedPass) {
    const onboarded = localStorage.getItem('nt_onboarded');
    if (!onboarded) {
      showOnboarding();
    } else {
      enterApp();
    }
  } else {
    toast('Incorrect email or password', 'err');
  }
}

/* =============================================
   ONBOARDING
============================================= */
function showOnboarding() {
  document.getElementById('signupBox').classList.add('hidden');
  document.getElementById('loginBox').classList.add('hidden');
  document.getElementById('onboardBox').classList.remove('hidden');
}

function calcGoal() {
  const w   = parseFloat(document.getElementById('obWeight').value);
  const h   = parseFloat(document.getElementById('obHeight').value);
  const age = parseFloat(document.getElementById('obAge').value);
  const g   = document.getElementById('obGender').value;
  const act = parseFloat(document.getElementById('obActivity').value);
  if (!w || !h || !age) return;
  // Mifflin-St Jeor BMR
  let bmr = (g === 'male')
    ? (10 * w + 6.25 * h - 5 * age + 5)
    : (10 * w + 6.25 * h - 5 * age - 161);
  const tdee = Math.round(bmr * act);
  document.getElementById('goalPreviewNum').textContent = tdee;
  document.getElementById('goalPreviewBox').classList.remove('hidden');
  // Auto-fill goal input if user hasn't manually set one
  const goalInp = document.getElementById('obGoal');
  if (!goalInp.dataset.touched) goalInp.value = tdee;
}

// Mark as touched so auto-fill doesn't overwrite user's manual entry
document.addEventListener('DOMContentLoaded', () => {
  const gi = document.getElementById('obGoal');
  if (gi) gi.addEventListener('input', () => { gi.dataset.touched = '1'; });
});

function completeOnboarding() {
  const w = document.getElementById('obWeight').value;
  const h = document.getElementById('obHeight').value;
  const a = document.getElementById('obAge').value;
  if (!w || !h || !a) { toast('Please fill in weight, height and age', 'err'); return; }
  let g = parseInt(document.getElementById('obGoal').value);
  if (!g || g <= 0) {
    // Fall back to suggested
    const suggested = parseInt(document.getElementById('goalPreviewNum').textContent);
    g = suggested > 0 ? suggested : 2000;
  }
  goal = g;
  localStorage.setItem('nt_weight', w);
  localStorage.setItem('nt_onboarded', '1');
  saveData();
  toast('Profile saved! Welcome to NutriTrack 🎉');
  enterApp();
}

/* =============================================
   ENTER APP
============================================= */
function enterApp() {
  document.getElementById('authPage').classList.add('hidden');
  document.getElementById('appPage').classList.remove('hidden');
  const name = localStorage.getItem('nt_name') || 'User';
  const first = name.split(' ')[0];
  document.getElementById('userFirstName').textContent = first;
  document.getElementById('userInitial').textContent   = first[0].toUpperCase();
  document.getElementById('todayLabel').textContent    = friendlyDate(todayKey());
  loadData();
  updateUI();
  renderTodayLogs();
}

function logout() {
  location.reload();
}

/* =============================================
   NAVIGATION
============================================= */
function showSection(id) {
  ['trackerPage', 'burnerPage', 'progressPage', 'historyPage'].forEach(p => {
    document.getElementById(p).classList.add('hidden');
  });
  document.getElementById(id).classList.remove('hidden');

  // Update desktop tabs
  ['tracker', 'burner', 'progress', 'history'].forEach(k => {
    const dt = document.getElementById('tab-' + k);
    const mt = document.getElementById('mob-' + k);
    if (dt) dt.classList.remove('active');
    if (mt) mt.classList.remove('active');
  });
  const key = id.replace('Page', '');
  const dt = document.getElementById('tab-' + key);
  const mt = document.getElementById('mob-' + key);
  if (dt) dt.classList.add('active');
  if (mt) mt.classList.add('active');

  if (id === 'progressPage') { updateProgressUI(); renderCharts(); }
  if (id === 'historyPage')  { renderHistory(); }
  if (id === 'trackerPage')  { updateUI(); renderTodayLogs(); }
  if (id === 'burnerPage')   { renderTodayLogs(); }
}

/* =============================================
   SET GOAL
============================================= */
function setGoal() {
  const g = parseInt(document.getElementById('goalInput').value);
  if (!g || g <= 0) { toast('Please enter a valid goal', 'err'); return; }
  goal = g;
  saveData();
  updateUI();
  updateProgressUI();
  toast('Daily goal updated to ' + g + ' kcal');
}

/* =============================================
   ADD FOOD
============================================= */
function addFood() {
  const foodSel  = document.getElementById('foodSelect');
  const ddName   = foodSel.options[foodSel.selectedIndex].text;
  const ddCal    = parseInt(foodSel.value);
  const cusName  = document.getElementById('foodName').value.trim();
  const cusCal   = parseInt(document.getElementById('foodCal').value);
  const qty      = parseInt(document.getElementById('foodQty').value);
  const meal     = document.getElementById('mealType').value;

  let name, cal;
  if (cusName && !isNaN(cusCal) && cusCal > 0) {
    name = cusName; cal = cusCal;
  } else {
    name = ddName; cal = ddCal;
  }
  if (!qty || qty <= 0) { toast('Please enter a valid quantity', 'err'); return; }

  const totalCal = cal * qty;
  eaten += totalCal;

  pushHistory({
    type: 'food',
    meal,
    name,
    qty,
    cal: totalCal,
    date: todayKey()
  });

  // Clear custom inputs
  document.getElementById('foodName').value = '';
  document.getElementById('foodCal').value  = '';
  document.getElementById('foodQty').value  = '1';

  saveData();
  updateUI();
  renderTodayLogs();
  toast(`${name} × ${qty} — ${totalCal} kcal logged`);
}

/* =============================================
   ADD EXERCISE
============================================= */
function addExercise() {
  const type     = document.getElementById('exType').value;
  const duration = parseFloat(document.getElementById('exDuration').value);
  const weight   = parseFloat(document.getElementById('exWeight').value);
  if (!duration || duration <= 0) { toast('Please enter a valid duration', 'err'); return; }
  if (!weight   || weight   <= 0) { toast('Please enter your weight', 'err'); return; }

  const cal = Math.round((MET[type] * weight * duration) / 60);
  burned += cal;

  pushHistory({
    type: 'exercise',
    name: type,
    duration,
    cal,
    date: todayKey()
  });

  document.getElementById('exDuration').value = '';
  document.getElementById('burnPreview').classList.add('hidden');

  saveData();
  updateUI();
  renderTodayLogs();
  toast(`${capitalize(type)} ${duration} min — ${cal} kcal burned`);
}

// Live burn preview
function previewBurn() {
  const type = document.getElementById('exType').value;
  const dur  = parseFloat(document.getElementById('exDuration').value);
  const w    = parseFloat(document.getElementById('exWeight').value);
  const box  = document.getElementById('burnPreview');
  if (type && dur > 0 && w > 0) {
    const cal = Math.round((MET[type] * w * dur) / 60);
    document.getElementById('burnPreviewNum').textContent = cal + ' kcal';
    box.classList.remove('hidden');
  } else {
    box.classList.add('hidden');
  }
}

/* =============================================
   UPDATE UI
============================================= */
function updateUI() {
  if (!goal || goal <= 0) goal = 2000;
  if (eaten  < 0) eaten  = 0;
  if (burned < 0) burned = 0;

  const remaining = goal - eaten + burned;
  const pct = Math.min(100, Math.max(0, (eaten / goal) * 100));

  setText('sc-goal',    Math.round(goal));
  setText('sc-eaten',   Math.round(eaten));
  setText('sc-burned',  Math.round(burned));
  setText('sc-remain',  Math.round(remaining));

  const fill = document.getElementById('progFill');
  const pctEl = document.getElementById('progPct');
  if (fill)  fill.style.width = pct + '%';
  if (pctEl) pctEl.textContent = Math.round(pct) + '%';
}

function updateProgressUI() {
  if (!goal || goal <= 0) goal = 2000;
  const net = eaten - burned;
  setText('pg-goal',   Math.round(goal));
  setText('pg-eaten',  Math.round(eaten));
  setText('pg-burned', Math.round(burned));
  setText('pg-net',    Math.round(net));
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

/* =============================================
   RENDER TODAY'S LOGS
============================================= */
function renderTodayLogs() {
  const today   = todayKey();
  const history = getHistory();
  const todayItems = history.filter(i => i.date === today);
  const foods = todayItems.filter(i => i.type === 'food');
  const exs   = todayItems.filter(i => i.type === 'exercise');

  // Food log
  const fl = document.getElementById('todayFoodLog');
  if (fl) {
    if (foods.length === 0) {
      fl.innerHTML = '<div class="empty-msg">No meals logged yet today 🍽️</div>';
    } else {
      fl.innerHTML = foods.map(f =>
        `<div class="log-item food-item">
          <div>
            <div class="li-name">${escHtml(f.name)}</div>
            <div class="li-meta">${escHtml(f.meal)} · ×${f.qty}</div>
          </div>
          <div class="li-cal-food">+${f.cal} kcal</div>
        </div>`
      ).join('');
    }
  }

  // Exercise log
  const el = document.getElementById('todayExLog');
  if (el) {
    if (exs.length === 0) {
      el.innerHTML = '<div class="empty-msg">No workouts logged yet today 🏃</div>';
    } else {
      el.innerHTML = exs.map(e =>
        `<div class="log-item ex-item">
          <div>
            <div class="li-name">${capitalize(escHtml(e.name))}</div>
            <div class="li-meta">${e.duration} min</div>
          </div>
          <div class="li-cal-ex">-${e.cal} kcal</div>
        </div>`
      ).join('');
    }
  }
}

/* =============================================
   HISTORY PAGE  — properly grouped by date
============================================= */
function renderHistory() {
  const container = document.getElementById('historyContent');
  if (!container) return;

  const history = getHistory();

  if (history.length === 0) {
    container.innerHTML = '<div class="history-empty">No history yet — start logging meals and workouts! 🌱</div>';
    return;
  }

  // Build a map: date -> [items]
  const grouped = {};
  history.forEach(item => {
    const d = item.date || 'Unknown';
    if (!grouped[d]) grouped[d] = [];
    grouped[d].push(item);
  });

  // Sort dates newest first
  // dates are dd/mm/yyyy, convert to yyyy-mm-dd for sorting
  const sortedDates = Object.keys(grouped).sort((a, b) => {
    const toSortable = (s) => {
      const p = s.split('/');
      return p.length === 3 ? `${p[2]}-${p[1]}-${p[0]}` : s;
    };
    return toSortable(b).localeCompare(toSortable(a));
  });

  let html = '';
  sortedDates.forEach(date => {
    const items  = grouped[date];
    const totalEaten  = items.filter(i => i.type === 'food').reduce((s, i) => s + (i.cal || 0), 0);
    const totalBurned = items.filter(i => i.type === 'exercise').reduce((s, i) => s + (i.cal || 0), 0);

    const isToday = (date === todayKey());
    const label   = isToday ? `Today — ${friendlyDate(date)}` : friendlyDate(date);

    html += `
      <div class="history-day">
        <div class="history-day-header">
          <div class="history-day-date">${escHtml(label)}</div>
          <div class="history-day-summary">
            <span class="hs-eaten">🍽️ ${totalEaten} kcal eaten</span>
            <span class="hs-burned">🔥 ${totalBurned} kcal burned</span>
          </div>
        </div>
    `;

    items.forEach(item => {
      if (item.type === 'food') {
        html += `
          <div class="history-item">
            <div class="hi-icon">🍽️</div>
            <div>
              <div class="hi-name">${escHtml(item.name)}</div>
              <div class="hi-meta">${escHtml(item.meal)} · ×${item.qty}</div>
            </div>
            <div class="hi-cal food">+${item.cal} kcal</div>
          </div>`;
      } else {
        html += `
          <div class="history-item">
            <div class="hi-icon">🏃</div>
            <div>
              <div class="hi-name">${capitalize(escHtml(item.name))}</div>
              <div class="hi-meta">${item.duration} min</div>
            </div>
            <div class="hi-cal ex">-${item.cal} kcal</div>
          </div>`;
      }
    });

    html += `</div>`; // .history-day
  });

  container.innerHTML = html;
}

/* =============================================
   CHARTS
============================================= */
function getLast7DayKeys() {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    days.push(`${dd}/${mm}/${yyyy}`);
  }
  return days;
}

function renderCharts() {
  updateProgressUI();

  const days    = getLast7DayKeys();
  const history = getHistory();

  const intakeData = days.map(d =>
    history.filter(i => i.date === d && i.type === 'food').reduce((s, i) => s + i.cal, 0)
  );
  const burnData = days.map(d =>
    history.filter(i => i.date === d && i.type === 'exercise').reduce((s, i) => s + i.cal, 0)
  );

  // Short label: "19/04"
  const labels = days.map(d => d.slice(0, 5));

  const gridColor  = 'rgba(0,0,0,0.06)';
  const tickColor  = '#6b7a6b';
  const fontFamily = "'Lato', sans-serif";

  const baseOpts = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { color: gridColor }, ticks: { color: tickColor, font: { family: fontFamily, size: 12 } } },
      y: { grid: { color: gridColor }, ticks: { color: tickColor, font: { family: fontFamily, size: 12 } }, beginAtZero: true }
    }
  };

  if (intakeChart) intakeChart.destroy();
  intakeChart = new Chart(document.getElementById('intakeChart'), {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'kcal eaten',
        data: intakeData,
        backgroundColor: 'rgba(245,158,11,0.7)',
        borderRadius: 7,
        borderSkipped: false
      }]
    },
    options: baseOpts
  });

  if (burnChart) burnChart.destroy();
  burnChart = new Chart(document.getElementById('burnChart'), {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'kcal burned',
        data: burnData,
        backgroundColor: 'rgba(59,130,246,0.7)',
        borderRadius: 7,
        borderSkipped: false
      }]
    },
    options: baseOpts
  });

  if (compareChart) compareChart.destroy();
  compareChart = new Chart(document.getElementById('compareChart'), {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Eaten',
          data: intakeData,
          borderColor: '#f59e0b',
          backgroundColor: 'rgba(245,158,11,0.08)',
          tension: 0.4, fill: true,
          pointBackgroundColor: '#f59e0b', pointRadius: 4
        },
        {
          label: 'Burned',
          data: burnData,
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59,130,246,0.06)',
          tension: 0.4, fill: true,
          pointBackgroundColor: '#3b82f6', pointRadius: 4
        },
        {
          label: 'Goal',
          data: days.map(() => goal),
          borderColor: 'rgba(61,153,112,0.5)',
          borderDash: [6, 4], tension: 0, pointRadius: 0,
          fill: false
        }
      ]
    },
    options: {
      ...baseOpts,
      plugins: {
        legend: {
          display: true,
          labels: { color: tickColor, font: { family: fontFamily, size: 12 }, boxWidth: 14, padding: 16 }
        }
      }
    }
  });
}

/* =============================================
   CLEAR ALL
============================================= */
function clearAll() {
  if (!confirm('This will delete all your meal and exercise history. Are you sure?')) return;
  localStorage.removeItem('nt_history');
  eaten  = 0;
  burned = 0;
  saveData();
  updateUI();
  renderTodayLogs();
  renderHistory();
  toast('All history cleared.');
}

/* =============================================
   UTILS
============================================= */
function capitalize(str) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
}

function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}