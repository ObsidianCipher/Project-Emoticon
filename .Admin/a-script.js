/* ════════════════════════════════════════════
   a-script.js  —  Admin Panel logic
   ════════════════════════════════════════════ */

const BASE = 'http://localhost:4000/api';

const GREETING_FILES = [
  { value: 'birthday.html',              label: 'Birthday' },
  { value: 'birthday_v1.html',           label: 'Birthday v1' },
  { value: 'birthday_v2.html',           label: 'Birthday v2' },
  { value: 'birthday_celebration.html',  label: 'Birthday Celebration' },
  { value: 'birthday_iris-FINAL.html',   label: 'Birthday — Iris' },
  { value: 'fiona-birthday.html',        label: 'Birthday — Fiona' },
  { value: 'preya_birthday.html',        label: 'Birthday — Preya' },
  { value: 'anniversary.html',           label: 'Anniversary' },
  { value: 'valentine.html',             label: 'Valentine' },
  { value: 'apology.html',               label: 'Apology / I Am Sorry' },
  { value: 'friend.html',                label: 'Friendship Day' },
  { value: 'heart.html',                 label: 'Heart / I Miss You' },
];

/* ── PAGE ROUTING ── */
const pages = ['overview', 'customers', 'keys', 'orders', 'logs', 'settings'];

function setPage(page, el) {
  pages.forEach(p => {
    const c = document.getElementById('content-' + p);
    if (c) c.style.display = p === page ? 'flex' : 'none';
  });

  document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
  if (el) el.classList.add('active');

  document.getElementById('page-title').textContent =
    page.charAt(0).toUpperCase() + page.slice(1);
  document.getElementById('page-path').textContent = page;

  if (page === 'customers') loadCustomers();
  if (page === 'keys')      loadKeys();
  if (page === 'orders')    renderOrders();
  if (page === 'logs')      renderFullLog();
}

/* ── LOCAL STATE (populated from API) ── */
let customers = [];
let keysData  = [];

/* ── DEMO / FALLBACK DATA ── */
const DEMO_CUSTOMERS = [
  { id:1,  name:'Riya Mehta',    email:'riya@example.com',    created_at:'2025-05-10', status:'active' },
  { id:2,  name:'Arjun Sharma',  email:'arjun@example.com',   created_at:'2025-05-12', status:'active' },
  { id:3,  name:'Sneha Iyer',    email:'sneha@example.com',   created_at:'2025-05-14', status:'active' },
  { id:4,  name:'Karthik Raj',   email:'karthik@example.com', created_at:'2025-05-15', status:'pending' },
  { id:5,  name:'Divya Nair',    email:'divya@example.com',   created_at:'2025-05-16', status:'active' },
  { id:6,  name:'Rohan Das',     email:'rohan@example.com',   created_at:'2025-05-17', status:'active' },
  { id:7,  name:'Priya Menon',   email:'priya@example.com',   created_at:'2025-05-18', status:'pending' },
  { id:8,  name:'Aditya Kumar',  email:'aditya@example.com',  created_at:'2025-05-19', status:'active' },
  { id:9,  name:'Meera Pillai',  email:'meera@example.com',   created_at:'2025-05-20', status:'active' },
  { id:10, name:'Vikram Singh',  email:'vikram@example.com',  created_at:'2025-05-21', status:'active' },
  { id:11, name:'Ananya Bose',   email:'ananya@example.com',  created_at:'2025-05-22', status:'pending' },
  { id:12, name:'Harish Verma',  email:'harish@example.com',  created_at:'2025-05-23', status:'active' },
];

const DEMO_KEYS = [
  { key_value:'EMTCN-R1YA-M3HT-A001', name:'Riya Mehta',   issued_at:'2025-05-10', status:'active',  greeting_file:'birthday.html' },
  { key_value:'EMTCN-ARJ9-SHAR-0002', name:'Arjun Sharma', issued_at:'2025-05-12', status:'active',  greeting_file:'valentine.html' },
  { key_value:'EMTCN-SN3H-IY3R-0003', name:'Sneha Iyer',   issued_at:'2025-05-14', status:'revoked', greeting_file:'anniversary.html' },
  { key_value:'EMTCN-D1VY-NA1R-0005', name:'Divya Nair',   issued_at:'2025-05-16', status:'active',  greeting_file:'friend.html' },
  { key_value:'EMTCN-ROH4-N0DA-0006', name:'Rohan Das',    issued_at:'2025-05-17', status:'active',  greeting_file:'apology.html' },
  { key_value:'EMTCN-AD1T-KUM4-0008', name:'Aditya Kumar', issued_at:'2025-05-19', status:'active',  greeting_file:'birthday_v1.html' },
  { key_value:'EMTCN-M33R-P1LL-0009', name:'Meera Pillai', issued_at:'2025-05-20', status:'active',  greeting_file:'heart.html' },
  { key_value:'EMTCN-V1KR-S1NG-0010', name:'Vikram Singh', issued_at:'2025-05-21', status:'active',  greeting_file:'birthday_celebration.html' },
  { key_value:'EMTCN-HAR1-VRM4-0012', name:'Harish Verma', issued_at:'2025-05-23', status:'active',  greeting_file:'birthday_iris-FINAL.html' },
];

const services = ['Birthday','Love Proposal','Wedding Proposal','Valentine','Thank You',
  'I Am Sorry','Wedding Anniversary','Love Anniversary','Friendship Day',
  'I Miss You','Party Invite','Festivals','Custom Build'];
const prices = [30,40,40,30,20,30,50,40,20,30,15,30,60];

const ordersData = Array.from({ length: 31 }, (_, i) => {
  const si   = i % services.length;
  const cust = DEMO_CUSTOMERS[i % DEMO_CUSTOMERS.length];
  const d    = new Date(2025, 4, 1 + (i % 23));
  return {
    id:       i + 1,
    customer: cust.name,
    service:  services[si],
    amount:   prices[si],
    date:     d.toISOString().slice(0, 10),
    status:   i % 7 === 4 ? 'pending' : 'completed',
  };
});

const logs = [
  { time:'10:42', icon:'👤', text:'New customer <span class="hl">Harish Verma</span> registered.' },
  { time:'10:41', icon:'🔑', text:'Key <span class="hl">EMTCN-HAR1-VRM4-0012</span> issued to <span class="hl">Harish Verma</span>.' },
  { time:'09:58', icon:'📦', text:'<span class="hlg">Order #31</span> placed — Wedding Anniversary by Vikram Singh.' },
  { time:'09:30', icon:'🔑', text:'Key <span class="hl">EMTCN-V1KR-S1NG-0010</span> issued to <span class="hl">Vikram Singh</span>.' },
  { time:'09:15', icon:'👤', text:'New customer <span class="hl">Ananya Bose</span> registered.' },
  { time:'08:44', icon:'📦', text:'<span class="hlg">Order #30</span> placed — Custom Build by Meera Pillai.' },
  { time:'08:30', icon:'🚫', text:'Key <span class="hl">EMTCN-SN3H-IY3R-0003</span> <span class="hlr">revoked</span>.' },
  { time:'08:10', icon:'📦', text:'<span class="hlg">Order #29</span> placed — Birthday by Aditya Kumar.' },
  { time:'Yesterday', icon:'👤', text:'New customer <span class="hl">Meera Pillai</span> registered.' },
  { time:'Yesterday', icon:'📦', text:'<span class="hlg">Order #28</span> placed — Valentine by Divya Nair.' },
  { time:'Yesterday', icon:'🔑', text:'Key <span class="hl">EMTCN-AD1T-KUM4-0008</span> issued.' },
  { time:'2d ago',    icon:'📦', text:'<span class="hlg">Order #27</span> placed — Friendship Day by Rohan Das.' },
  { time:'2d ago',    icon:'📦', text:'<span class="hlg">Order #26</span> placed — Thank You by Priya Menon.' },
];

/* ── API LOADERS ── */
async function loadCustomers() {
  try {
    const res  = await fetch(`${BASE}/customers`);
    if (!res.ok) throw new Error();
    customers = await res.json();
    /* Normalise date field name */
    customers = customers.map(c => ({ ...c, date: (c.date || c.created_at || '').slice(0,10) }));
  } catch {
    customers = DEMO_CUSTOMERS.map(c => ({ ...c, date: c.created_at }));
  }
  renderCustomers();
}

async function loadKeys() {
  try {
    const res = await fetch(`${BASE}/keys`);
    if (!res.ok) throw new Error();
    keysData = await res.json();
  } catch {
    keysData = DEMO_KEYS;
  }
  renderKeys();
}

/* ── RENDER: CUSTOMERS ── */
function renderCustomers(filter = '') {
  const tbody = document.getElementById('customers-tbody');
  if (!tbody) return;

  const rows = customers.filter(c =>
    c.name.toLowerCase().includes(filter.toLowerCase()) ||
    c.email.toLowerCase().includes(filter.toLowerCase())
  );

  tbody.innerHTML = rows.map(c => `
    <tr>
      <td><span class="mono-cell">#${String(c.id).padStart(3,'0')}</span></td>
      <td><span class="name-cell">${c.name}</span></td>
      <td><span class="email-cell">${c.email}</span></td>
      <td><span class="date-cell">${(c.date || '').slice(0,10)}</span></td>
      <td><span class="tag tag-${c.status || 'active'}">
        <span class="status-dot dot-${c.status === 'active' ? 'green' : 'yellow'}"></span>
        ${c.status || 'active'}
      </span></td>
      <td>
        <div class="row-actions">
          <button class="row-btn" onclick="issueKeyFor(${c.id}, '${escHtml(c.name)}')">Issue Key</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function filterCustomers(v) { renderCustomers(v); }

/* ── RENDER: KEYS ── */
function renderKeys(filter = '') {
  const tbody = document.getElementById('keys-tbody');
  if (!tbody) return;

  const rows = keysData.filter(k =>
    (k.key_value || '').toLowerCase().includes(filter.toLowerCase()) ||
    (k.name      || '').toLowerCase().includes(filter.toLowerCase())
  );

  tbody.innerHTML = rows.map(k => `
    <tr>
      <td><span class="mono-cell">${k.key_value}</span></td>
      <td><span class="name-cell">${k.name}</span></td>
      <td><span class="date-cell">${(k.issued_at || '').slice(0,10)}</span></td>
      <td><span class="mono-cell" style="color:var(--muted);font-size:10px">${k.greeting_file || '—'}</span></td>
      <td><span class="tag tag-${k.status}">
        <span class="status-dot dot-${k.status === 'active' ? 'green' : 'red'}"></span>
        ${k.status}
      </span></td>
      <td>
        <div class="row-actions">
          <button class="row-btn" onclick="copyKey('${k.key_value}')">Copy</button>
          <button class="row-btn danger" onclick="revokeKeyAction('${k.key_value}')">Revoke</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function filterKeys(v) { renderKeys(v); }

/* ── RENDER: ORDERS ── */
function renderOrders() {
  const tbody = document.getElementById('orders-tbody');
  if (!tbody) return;

  tbody.innerHTML = ordersData.map(o => `
    <tr>
      <td><span class="mono-cell">#${String(o.id).padStart(3,'0')}</span></td>
      <td><span class="name-cell">${o.customer}</span></td>
      <td>${o.service}</td>
      <td style="font-family:var(--mono);color:var(--yellow)">₹${o.amount}</td>
      <td><span class="date-cell">${o.date}</span></td>
      <td><span class="tag tag-${o.status === 'completed' ? 'active' : 'pending'}">
        <span class="status-dot dot-${o.status === 'completed' ? 'green' : 'yellow'}"></span>
        ${o.status}
      </span></td>
    </tr>
  `).join('');
}

/* ── RENDER: LOGS ── */
function renderActivityLog() {
  const el = document.getElementById('activity-log');
  if (!el) return;
  el.innerHTML = logs.slice(0, 8).map(logRow).join('');
}

function renderFullLog() {
  const el = document.getElementById('full-log');
  if (!el) return;
  el.innerHTML = logs.map(logRow).join('');
}

function logRow(l) {
  return `
    <div class="log-item">
      <span class="log-time">${l.time}</span>
      <span class="log-icon">${l.icon}</span>
      <span class="log-text">${l.text}</span>
    </div>`;
}

/* ── CHART ── */
function renderChart() {
  const el = document.getElementById('chart');
  if (!el) return;

  const days   = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const orders = [3, 5, 2, 6, 8, 4, 3];
  const keys   = [1, 2, 1, 3, 2, 1, 2];
  const maxV   = Math.max(...orders, ...keys);

  el.innerHTML = days.map((d, i) => `
    <div class="bar-group">
      <div class="bar-track" style="height:56px;display:flex;flex-direction:column;justify-content:flex-end;gap:2px;background:none">
        <div class="bar-fill"      style="height:${(orders[i]/maxV*100)}%;animation-delay:${i*0.06}s"></div>
        <div class="bar-fill blue" style="height:${(keys[i]/maxV*100)}%;animation-delay:${i*0.06+0.03}s"></div>
      </div>
      <span class="bar-lbl">${d}</span>
    </div>
  `).join('');
}

/* ── MODALS ── */
function openModal(id) {
  const el = document.getElementById('modal-' + id);
  if (el) el.classList.add('open');

  /* Populate greeting file dropdowns on open */
  ['nc-file', 'ik-file'].forEach(dropId => {
    const drop = document.getElementById(dropId);
    if (drop && drop.options.length <= 1) {
      GREETING_FILES.forEach(g => {
        const opt = document.createElement('option');
        opt.value = g.value;
        opt.textContent = g.label;
        drop.appendChild(opt);
      });
    }
  });
}

function closeModal(id) {
  const el = document.getElementById('modal-' + id);
  if (el) el.classList.remove('open');
  /* Clear lookup result */
  const r = document.getElementById('lk-result');
  if (r) { r.style.display = 'none'; r.innerHTML = ''; }
}

/* ── REGISTER CUSTOMER ── */
async function registerCustomer() {
  const name         = document.getElementById('nc-name').value.trim();
  const email        = document.getElementById('nc-email').value.trim();
  const greetingFile = document.getElementById('nc-file').value;

  if (!name || !email)  { toast('⚠️', 'Name and email are required.'); return; }
  if (!greetingFile)    { toast('⚠️', 'Select a greeting file.'); return; }

  try {
    /* 1 — create customer */
    const res1 = await fetch(`${BASE}/customers`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ name, email }),
    });
    const cust = await res1.json();
    if (!res1.ok) throw new Error(cust.error);

    /* 2 — issue key with greeting file */
    const res2 = await fetch(`${BASE}/keys`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ customerId: cust.customerId, greetingFile }),
    });
    const keyData = await res2.json();
    if (!res2.ok) throw new Error(keyData.error);

    /* Success */
    closeModal('new-customer');
    clearModal('nc-name', 'nc-email', 'nc-file');
    toast('✅', `${name} registered — Key: ${keyData.key}`);
    addLog({ time: now(), icon: '👤', text: `New customer <span class="hl">${name}</span> registered.` });
    addLog({ time: now(), icon: '🔑', text: `Key <span class="hl">${keyData.key}</span> → <span class="hlg">${greetingFile}</span>` });
    customers.unshift({ id: cust.customerId, name, email, date: today(), status: 'active' });

  } catch (e) {
    /* Demo fallback when server is offline */
    const fakeKey = fakeEmtcn();
    closeModal('new-customer');
    clearModal('nc-name', 'nc-email', 'nc-file');
    toast('✅', `[Demo] ${name} → ${fakeKey}`);
    addLog({ time: now(), icon: '👤', text: `New customer <span class="hl">${name}</span> registered.` });
    addLog({ time: now(), icon: '🔑', text: `Key <span class="hl">${fakeKey}</span> → <span class="hlg">${greetingFile}</span>` });
  }
}

/* ── ISSUE KEY (standalone) ── */
async function issueKey() {
  const customerId   = document.getElementById('ik-custid').value.trim();
  const greetingFile = document.getElementById('ik-file').value;

  if (!customerId)   { toast('⚠️', 'Customer ID required.'); return; }
  if (!greetingFile) { toast('⚠️', 'Select a greeting file.'); return; }

  try {
    const res = await fetch(`${BASE}/keys`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ customerId: parseInt(customerId, 10), greetingFile }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    closeModal('issue-key');
    clearModal('ik-custid', 'ik-file');
    toast('🔑', `Key: ${data.key} → ${greetingFile}`);
    addLog({ time: now(), icon: '🔑', text: `Key <span class="hl">${data.key}</span> issued → <span class="hlg">${greetingFile}</span>` });
    keysData.unshift({ key_value: data.key, name: `Customer #${customerId}`, issued_at: today(), status: 'active', greeting_file: greetingFile });
    renderKeys();

  } catch (e) {
    /* Demo fallback */
    const fakeKey = fakeEmtcn();
    closeModal('issue-key');
    clearModal('ik-custid', 'ik-file');
    toast('🔑', `[Demo] Key: ${fakeKey} → ${greetingFile}`);
    addLog({ time: now(), icon: '🔑', text: `Key <span class="hl">${fakeKey}</span> → <span class="hlg">${greetingFile}</span>` });
    keysData.unshift({ key_value: fakeKey, name: `Customer #${customerId}`, issued_at: today(), status: 'active', greeting_file: greetingFile });
    renderKeys();
  }
}

/* Pre-fill customer ID and open issue-key modal from customer row */
function issueKeyFor(id, name) {
  const el = document.getElementById('ik-custid');
  if (el) el.value = id;
  openModal('issue-key');
}

/* ── REVOKE KEY ── */
async function revokeKeyAction(key) {
  if (!confirm(`Revoke key ${key}?`)) return;

  try {
    const res = await fetch(`${BASE}/keys/${encodeURIComponent(key)}/revoke`, { method: 'PATCH' });
    if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
  } catch (_) {
    /* Offline — update local state only */
  }

  toast('🚫', `Key ${key} revoked.`);
  addLog({ time: now(), icon: '🚫', text: `Key <span class="hl">${key}</span> <span class="hlr">revoked</span>.` });
  const k = keysData.find(k => k.key_value === key);
  if (k) k.status = 'revoked';
  renderKeys();
}

/* ── LOOKUP KEY ── */
async function lookupKey() {
  const key = document.getElementById('lk-key').value.trim().toUpperCase();
  if (!key) { toast('⚠️', 'Enter a key.'); return; }

  const r = document.getElementById('lk-result');

  try {
    const res  = await fetch(`${BASE}/lookup/${encodeURIComponent(key)}`);
    const data = await res.json();

    if (!res.ok) throw new Error(data.error);

    r.style.display = 'block';
    r.innerHTML = `
      <span style="color:var(--green)">✓ Key found</span><br>
      Name:    <span style="color:var(--text)">${data.name}</span><br>
      Email:   <span style="color:var(--blue)">${data.email}</span><br>
      File:    <span style="color:var(--yellow)">${data.greeting_file || '—'}</span><br>
      Status:  <span style="color:var(--green)">${data.status}</span><br>
      Issued:  <span style="color:var(--muted)">${(data.issued_at || '').slice(0,10)}</span>
    `;
  } catch (e) {
    /* Demo fallback */
    const found = keysData.find(k => k.key_value === key);
    r.style.display = 'block';
    r.innerHTML = found
      ? `<span style="color:var(--green)">✓ Key found</span><br>
         Customer: <span style="color:var(--text)">${found.name}</span><br>
         File: <span style="color:var(--yellow)">${found.greeting_file || '—'}</span><br>
         Status: <span style="color:var(--green)">${found.status}</span>`
      : `<span style="color:var(--red)">✗ Key not found</span><br>
         <span style="color:var(--muted)">${e.message || 'Check format: EMTCN-XXXX-XXXX-XXXX'}</span>`;
  }
}

/* ── COPY KEY ── */
function copyKey(key) {
  navigator.clipboard.writeText(key).catch(() => {});
  toast('📋', `Copied: ${key}`);
}

/* ── SERVER PING ── */
async function pingServer() {
  const dot = document.getElementById('server-dot');
  const lbl = document.getElementById('server-label');
  dot.className  = 'status-dot dot-yellow';
  lbl.textContent = 'pinging…';

  try {
    const start = Date.now();
    const res   = await fetch(`${BASE}/health`);
    if (!res.ok) throw new Error('non-200');
    const ms = Date.now() - start;
    dot.className   = 'status-dot dot-green';
    lbl.textContent = `${ms}ms`;
    toast('📡', `Server online · ${ms}ms`);
  } catch {
    dot.className   = 'status-dot dot-red';
    lbl.textContent = 'offline';
    toast('❌', 'Server unreachable — is it running?');
    setTimeout(() => {
      lbl.textContent = 'localhost:4000';
      dot.className   = 'status-dot dot-muted';
    }, 4000);
  }
}

/* ── LIVE LOG ── */
function addLog(entry) {
  logs.unshift(entry);
  renderActivityLog();
}

/* ── TOAST ── */
function toast(icon, msg) {
  const stack = document.getElementById('toasts');
  if (!stack) return;
  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = `<span class="toast-icon">${icon}</span><span>${msg}</span>`;
  stack.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

/* ── UTILITIES ── */
function rand4()     { return Math.random().toString(36).toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,4).padEnd(4,'0'); }
function fakeEmtcn() { return `EMTCN-${rand4()}-${rand4()}-${rand4()}`; }
function today()     { return new Date().toISOString().slice(0,10); }
function now() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}
function escHtml(s) { return s.replace(/'/g, "\\'"); }
function clearModal(...ids) { ids.forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; }); }

/* ── CLOSE MODAL ON OUTSIDE CLICK ── */
document.querySelectorAll('.modal-overlay').forEach(o => {
  o.addEventListener('click', e => {
    if (e.target === o) closeModal(o.id.replace('modal-', ''));
  });
});

/* ── INIT ── */
renderActivityLog();
renderChart();