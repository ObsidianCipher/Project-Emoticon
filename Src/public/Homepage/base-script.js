/* ════════════════════════════════════════════
   base-script.js  —  Homepage & Sign-in logic
   ════════════════════════════════════════════ */

const SERVER = 'http://localhost:4000';

/* ── CUSTOM CURSOR ── */
const cur  = document.getElementById('cur');
const ring = document.getElementById('curRing');

if (cur && ring) {
  let mx = 0, my = 0, rx = 0, ry = 0;

  document.addEventListener('mousemove', e => {
    mx = e.clientX;
    my = e.clientY;
    cur.style.left = mx - 5 + 'px';
    cur.style.top  = my - 5 + 'px';
  });

  (function animRing() {
    rx += (mx - rx - 18) * 0.14;
    ry += (my - ry - 18) * 0.14;
    ring.style.left = rx + 'px';
    ring.style.top  = ry + 'px';
    requestAnimationFrame(animRing);
  })();
}

/* ── SCROLL REVEAL ── */
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) e.target.classList.add('visible');
  });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

/* ── SMOOTH NAV SCROLL ── */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });
});

/* ── KEY INPUT TOGGLE (show / hide) ── */
function toggleKey() {
  const inp = document.getElementById('keyInput');
  if (!inp) return;
  inp.type = inp.type === 'password' ? 'text' : 'password';
}

/* ── SIGN IN ── */
async function handleSignin() {
  const inp = document.getElementById('keyInput');
  const btn = document.querySelector('.signin-btn');
  if (!inp || !btn) return;

  const key = inp.value.trim().toUpperCase();

  if (!key) {
    showBtnState(btn, '⚠️ Enter your access key.', 'warn');
    return;
  }

  /* Basic format check before hitting the server */
  const validFormat = /^EMTCN-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(key);
  if (!validFormat) {
    showBtnState(btn, '❌ Invalid key format — expected EMTCN-XXXX-XXXX-XXXX', 'error');
    return;
  }

  showBtnState(btn, '⏳ Verifying...', 'loading');

  try {
    /* Step 1 — verify key and get customer name */
    const res  = await fetch(`${SERVER}/api/lookup/${encodeURIComponent(key)}`);
    const data = await res.json();

    if (!res.ok) {
      const msg = data.error || 'Invalid key.';
      showBtnState(btn, `❌ ${msg}`, 'error');
      return;
    }

    /* Step 2 — show welcome, then navigate to greeting */
    showBtnState(btn, `✅ Welcome, ${data.name} — Opening your greeting...`, 'success');

    setTimeout(() => {
      window.location.href = `${SERVER}/serve/${encodeURIComponent(key)}`;
    }, 1200);

  } catch (err) {
    showBtnState(btn, '❌ Server unreachable — is it running?', 'error');
  }
}

/* ── BUTTON STATE HELPER ── */
function showBtnState(btn, text, type) {
  btn.textContent = text;

  const reset = () => { btn.textContent = 'Unlock Access ✦'; };

  if (type === 'error' || type === 'warn') {
    setTimeout(reset, 3000);
  }
  /* 'loading' and 'success' don't auto-reset — next action handles it */
}

/* ── ALLOW ENTER KEY ON KEY INPUT ── */
const keyInput = document.getElementById('keyInput');
if (keyInput) {
  keyInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') handleSignin();
  });
}