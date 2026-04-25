const firebaseConfig = {
  apiKey: "AIzaSyBxCCbHYMcU4dPgMWkhE73939ErOaA2Stc",
  authDomain: "controle-class-scripts.firebaseapp.com",
  databaseURL: "https://controle-class-scripts-default-rtdb.firebaseio.com",
  projectId: "controle-class-scripts",
  storageBucket: "controle-class-scripts.firebasestorage.app",
  messagingSenderId: "662596791017",
  appId: "1:662596791017:web:857fa68154bc2d17375e78"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

const END_DATE = new Date('2026-12-18T23:59:59');

const typed = { phrases: ['Class Scripts'], idx: 0, charIdx: 0, deleting: false };

function typeLoop() {
  const el = document.getElementById('typed-text');
  if (!el) return;
  const phrase = typed.phrases[typed.idx];
  if (!typed.deleting) {
    el.textContent = phrase.slice(0, ++typed.charIdx);
    if (typed.charIdx === phrase.length) { typed.deleting = true; setTimeout(typeLoop, 3500); return; }
  } else {
    el.textContent = phrase.slice(0, --typed.charIdx);
    if (typed.charIdx === 0) { typed.deleting = false; typed.idx = (typed.idx + 1) % typed.phrases.length; }
  }
  setTimeout(typeLoop, typed.deleting ? 130 : 105);
}

function countdown() {
  const now = new Date();
  const diff = END_DATE - now;
  if (diff <= 0) {
    ['cd-days','cd-hours','cd-minutes','cd-seconds'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = '00';
    });
    return;
  }
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  const pad = n => String(n).padStart(2,'0');
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = pad(v); };
  set('cd-days', d);
  set('cd-hours', h);
  set('cd-minutes', m);
  set('cd-seconds', s);
}

function showToast(msg, type = 'info') {
  const icons = { success: 'fa-circle-check', error: 'fa-circle-xmark', info: 'fa-circle-info' };
  const colors = { success: '#10b981', error: '#ef4444', info: '#6ee7b7' };
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<i class="fas ${icons[type]}" style="color:${colors[type]}"></i><span>${msg}</span>`;
  document.getElementById('toast-container').appendChild(t);
  setTimeout(() => t.remove(), 4000);
}

function renderScripts(scripts) {
  const grid = document.getElementById('scripts-grid');
  if (!grid) return;
  grid.innerHTML = '';
  if (!scripts || !Object.keys(scripts).length) {
    grid.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:40px;grid-column:1/-1">Nenhum script disponível ainda.</p>';
    return;
  }
  Object.entries(scripts).forEach(([key, s]) => {
    const rawStatus = (s.status || 'ativo').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const statusNorm = rawStatus === 'manutencao' || rawStatus === 'manutençao' || rawStatus === 'manutenção' ? 'manutencao'
      : rawStatus === 'offline' ? 'offline' : 'ativo';

    const statusMap = {
      ativo: { label: 'Ativo', cls: 'ativo' },
      offline: { label: 'Offline', cls: 'offline' },
      manutencao: { label: 'Manutenção', cls: 'manutencao' }
    };
    const st = statusMap[statusNorm];
    const isActive = statusNorm === 'ativo';
    const isMaintenance = statusNorm === 'manutencao';

    const name = s.name || s.id || key;
    const desc = s.desc || s.description || '';
    const link = s.url || s.link || '#';
    const category = s.category || '';

    let btnCls = isActive ? 'active' : isMaintenance ? 'maintenance' : 'disabled';
    let btnLabel = isActive ? `<i class="fas fa-arrow-up-right-from-square"></i> Acessar Script` : isMaintenance ? `<i class="fas fa-wrench"></i> Em manutenção` : `<i class="fas fa-times-circle"></i> Indisponível`;

    const card = document.createElement('div');
    card.className = 'script-card reveal';
    card.innerHTML = `
      <div class="script-header">
        <h3 class="script-title">${name}</h3>
        <span class="status-badge ${st.cls}"><span class="dot"></span>${st.label}</span>
      </div>
      ${category ? `<span style="font-size:11px;font-family:var(--font-mono);color:var(--accent);opacity:0.7;margin-bottom:8px;display:block">${category}</span>` : ''}
      <p class="script-desc">${desc}</p>
      ${isActive
        ? `<a href="${link}" target="_blank" class="script-btn ${btnCls}">${btnLabel}</a>`
        : `<button class="script-btn ${btnCls}" disabled>${btnLabel}</button>`
      }
    `;
    grid.appendChild(card);
    setTimeout(() => observeReveal(card), 50);
  });
}

function renderAvisos(avisos) {
  const grid = document.getElementById('avisos-grid');
  if (!grid) return;
  grid.innerHTML = '';
  if (!avisos || !Object.keys(avisos).length) {
    grid.innerHTML = '<p class="no-avisos">Nenhum aviso no momento.</p>';
    return;
  }
  const sorted = Object.entries(avisos).sort((a, b) => (b[1].timestamp || 0) - (a[1].timestamp || 0));
  sorted.forEach(([key, av]) => {
    const date = av.timestamp ? new Date(av.timestamp).toLocaleDateString('pt-BR') : '';
    const card = document.createElement('div');
    card.className = 'aviso-card reveal';
    card.innerHTML = `
      <div class="aviso-meta">
        <span class="aviso-author"><i class="fas fa-bell" style="margin-right:5px"></i>${av.author || 'Admin'}</span>
        <span class="aviso-date">${date}</span>
      </div>
      <p class="aviso-text">${av.text || ''}</p>
    `;
    grid.appendChild(card);
    setTimeout(() => observeReveal(card), 50);
  });
}

let teamsData = {};
let activeTeamKey = null;

function renderTeams(teams) {
  teamsData = teams || {};
  const tabsEl = document.getElementById('teams-tabs');
  const panelEl = document.getElementById('teams-panel');
  if (!tabsEl || !panelEl) return;

  tabsEl.innerHTML = '';
  panelEl.innerHTML = '';

  const keys = Object.keys(teamsData);

  if (!keys.length) {
    panelEl.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:40px;">Nenhuma equipe cadastrada ainda.</p>';
    return;
  }

  // Ordena por campo "order" se existir
  const sorted = keys.sort((a, b) => {
    const oa = teamsData[a].order ?? 999;
    const ob = teamsData[b].order ?? 999;
    return oa - ob;
  });

  sorted.forEach((key, idx) => {
    const team = teamsData[key];
    const isFirst = idx === 0;

    
    const tab = document.createElement('button');
    tab.className = 'team-tab' + (isFirst ? ' active' : '');
    tab.dataset.key = key;
    tab.innerHTML = `
      ${team.icon ? `<img src="${team.icon}" class="team-tab-logo" alt="" onerror="this.style.display='none'">` : ''}
      <span>${team.name || 'Equipe'}</span>
      ${team.link ? `<a href="${team.link}" target="_blank" class="team-tab-link" onclick="event.stopPropagation()" title="Acessar servidor"><i class="fas fa-arrow-up-right-from-square"></i></a>` : ''}
      <span class="team-tab-count">${team.members ? Object.keys(team.members).length : 0}</span>
    `;
    tab.addEventListener('click', () => switchTeamTab(key));
    tabsEl.appendChild(tab);

    
    const panel = document.createElement('div');
    panel.className = 'team-panel' + (isFirst ? ' active' : '');
    panel.dataset.key = key;
    panel.innerHTML = buildTeamPanel(team);
    panelEl.appendChild(panel);

    if (isFirst) activeTeamKey = key;
  });

  
  setTimeout(() => {
    panelEl.querySelectorAll('.reveal').forEach(el => observeReveal(el));
    initCardGlowIn(panelEl);
  }, 60);
}

function switchTeamTab(key) {
  if (activeTeamKey === key) return;
  activeTeamKey = key;

  document.querySelectorAll('.team-tab').forEach(t => t.classList.toggle('active', t.dataset.key === key));

  const panels = document.querySelectorAll('.team-panel');
  panels.forEach(p => {
    if (p.dataset.key === key) {
      p.classList.add('active');
      
      p.style.animation = 'none';
      p.offsetHeight; 
      p.style.animation = '';
      setTimeout(() => {
        p.querySelectorAll('.reveal').forEach(el => observeReveal(el));
        initCardGlowIn(p);
      }, 60);
    } else {
      p.classList.remove('active');
    }
  });
}

function buildTeamPanel(team) {
  const members = team.members ? Object.values(team.members) : [];
  if (!members.length) {
    return '<p style="color:var(--text-muted);text-align:center;padding:30px;grid-column:1/-1">Nenhum membro nesta equipe.</p>';
  }
  const cards = members.map(m => `
    <div class="founder-card reveal">
      ${m.avatar ? `<img src="${m.avatar}" alt="${m.name || ''}" class="founder-avatar" onerror="this.style.display='none'">` : ''}
      <p class="founder-name">${m.name || ''}</p>
      <p class="founder-role">${m.role || 'Membro'}</p>
    </div>
  `).join('');
  return `<div class="founders-grid">${cards}</div>`;
}

function renderFounders(founders) {
  
  if (Object.keys(teamsData).length) return;

  const grid = document.getElementById('founders-grid');
  if (!grid) return;
  grid.innerHTML = '';
  if (!founders || !Object.keys(founders).length) return;
  Object.values(founders).forEach(f => {
    const card = document.createElement('div');
    card.className = 'founder-card reveal';
    card.innerHTML = `
      ${f.avatar ? `<img src="${f.avatar}" alt="${f.name}" class="founder-avatar" onerror="this.style.display='none'">` : ''}
      <p class="founder-name">${f.name || ''}</p>
      <p class="founder-role">${f.role || 'Fundador'}</p>
    `;
    grid.appendChild(card);
    setTimeout(() => observeReveal(card), 50);
  });
}

let alertShown = false;
function checkAlertBanner() {
  db.ref('avisoGlobal').on('value', snap => {
    const data = snap.val();
    if (data && data.active && data.text && !alertShown) {
      alertShown = true;
      document.getElementById('alert-text').textContent = data.text;
      document.getElementById('alert-banner').classList.remove('hidden');
    } else if (!data || !data.active) {
      document.getElementById('alert-banner').classList.add('hidden');
      alertShown = false;
    }
  });
}

function observeReveal(el) {
  if (el.classList.contains('visible')) return;
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } });
  }, { threshold: 0.1 });
  obs.observe(el);
}

function initReveal() {
  document.querySelectorAll('.reveal').forEach((el, i) => {
    el.style.transitionDelay = `${i * 0.06}s`;
    observeReveal(el);
  });
}

function initHamburger() {
  const btn = document.getElementById('hamburger');
  const nav = document.getElementById('mobile-nav');
  if (!btn || !nav) return;
  btn.addEventListener('click', () => {
    btn.classList.toggle('open');
    nav.classList.toggle('open');
  });
  nav.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      btn.classList.remove('open');
      nav.classList.remove('open');
    });
  });
}

function initModal() {
  document.getElementById('modal-close')?.addEventListener('click', closeModal);
  document.getElementById('modal-backdrop')?.addEventListener('click', e => {
    if (e.target === document.getElementById('modal-backdrop')) closeModal();
  });
}

function closeModal() {
  document.getElementById('modal-backdrop')?.classList.add('hidden');
}

function initAlertClose() {
  document.getElementById('alert-close')?.addEventListener('click', () => {
    document.getElementById('alert-banner').classList.add('hidden');
  });
}

function checkMaintenance() {
  db.ref('maintenance').on('value', snap => {
    const data = snap.val();
    const isOn = data && data.active;
    const msg = data?.message || 'O site está passando por manutenção. Voltamos em breve!';
    document.getElementById('maintenance-msg').textContent = msg;
    document.getElementById('maintenance-screen').classList.toggle('hidden', !isOn);
    document.getElementById('app').classList.toggle('hidden', !!isOn);
  });
}

async function init() {
  await new Promise(r => setTimeout(r, 1800));
  document.getElementById('preloader')?.classList.add('done');

  typeLoop();
  countdown();
  setInterval(countdown, 1000);
  initHamburger();
  initModal();
  initAlertClose();

  db.ref('scripts').on('value', snap => renderScripts(snap.val()));
  db.ref('gabaritos').on('value', snap => { window.gabaritoData = snap.val() || {}; renderGabaritos(snap.val()); });
  db.ref('avisos').on('value', snap => renderAvisos(snap.val()));
  db.ref('teams').on('value', snap => {
    const teams = snap.val();
    if (teams && Object.keys(teams).length) {
      renderTeams(teams);
    } else {
      
      db.ref('founders').once('value', s => renderFounders(s.val()));
    }
  });
  checkAlertBanner();

  setTimeout(initReveal, 200);
  initCardGlow();
  initLanyard();
}

function initCardGlowIn(container) {
  const update = e => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width * 100).toFixed(1) + '%';
    const y = ((e.clientY - rect.top) / rect.height * 100).toFixed(1) + '%';
    card.style.setProperty('--mouse-x', x);
    card.style.setProperty('--mouse-y', y);
  };
  container.querySelectorAll('.script-card, .aviso-card, .founder-card, .gabarito-card').forEach(card => {
    if (card.dataset.glowBound) return;
    card.dataset.glowBound = '1';
    card.addEventListener('mousemove', update);
  });
}

function initCardGlow() {
  const update = e => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width * 100).toFixed(1) + '%';
    const y = ((e.clientY - rect.top) / rect.height * 100).toFixed(1) + '%';
    card.style.setProperty('--mouse-x', x);
    card.style.setProperty('--mouse-y', y);
  };

  const attach = () => {
    document.querySelectorAll('.script-card, .aviso-card, .founder-card, .gabarito-card').forEach(card => {
      if (card.dataset.glowBound) return;
      card.dataset.glowBound = '1';
      card.addEventListener('mousemove', update);
    });
  };

  attach();
  const obs = new MutationObserver(attach);
  obs.observe(document.body, { childList: true, subtree: true });
}

function applyTheme(theme) {
  document.body.classList.remove('halloween');
  clearHalloween();
  if (theme === 'halloween') {
    document.body.classList.add('halloween');
    buildHalloween();
  }
}

let lightningTimer = null;

function clearHalloween() {
  const deco = document.getElementById('halloween-deco');
  if (deco) deco.innerHTML = '';
  const existing = document.querySelectorAll('.hw-fog,.hw-fog-2,.hw-moon,.hw-web,.hw-pumpkin,.hw-lightning,.hw-eye,.hw-spark');
  existing.forEach(el => el.remove());
  if (lightningTimer) { clearInterval(lightningTimer); lightningTimer = null; }
}

function mkEl(tag, cls, styles = {}) {
  const el = document.createElement(tag);
  if (cls) el.className = cls;
  Object.assign(el.style, styles);
  return el;
}

function buildHalloween() {
  const deco = document.getElementById('halloween-deco');
  if (!deco) return;

  document.body.appendChild(mkEl('div', 'hw-fog'));
  document.body.appendChild(mkEl('div', 'hw-fog-2'));
  document.body.appendChild(mkEl('div', 'hw-moon'));

  const webSVG = `<svg viewBox="0 0 140 140" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g stroke="rgba(200,160,255,0.7)" stroke-width="0.7">
      <line x1="0" y1="0" x2="140" y2="140"/><line x1="0" y1="0" x2="100" y2="140"/>
      <line x1="0" y1="0" x2="50" y2="140"/><line x1="0" y1="0" x2="0" y2="140"/>
      <line x1="0" y1="0" x2="140" y2="80"/><line x1="0" y1="0" x2="140" y2="30"/>
      <line x1="0" y1="0" x2="60" y2="0"/><line x1="0" y1="0" x2="140" y2="10"/>
    </g>
    <g stroke="rgba(200,160,255,0.5)" stroke-width="0.6" fill="none">
      <path d="M0,0 Q30,30 60,0 Q90,30 120,0 Q140,20 140,40"/>
      <path d="M0,0 Q25,55 50,25 Q80,60 110,30 Q130,50 140,80"/>
      <path d="M0,0 Q20,80 40,50 Q65,90 90,60 Q115,85 140,110"/>
      <path d="M0,0 Q15,100 35,75 Q55,110 80,85 Q105,115 130,95 Q138,120 140,140"/>
    </g>
    <circle cx="3" cy="3" r="3" fill="rgba(180,100,255,0.6)"/>
  </svg>`;

  const wTL = mkEl('div', 'hw-web hw-web-tl');
  wTL.innerHTML = webSVG;
  document.body.appendChild(wTL);
  const wTR = mkEl('div', 'hw-web hw-web-tr');
  wTR.innerHTML = webSVG;
  document.body.appendChild(wTR);

  const batSVG = `<svg viewBox="0 0 48 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M24 8 C22 4 14 2 8 6 C4 8 0 6 0 6 C4 10 6 12 10 12 C12 12 14 11 15 10 L24 16 L33 10 C34 11 36 12 38 12 C42 12 44 10 48 6 C48 6 44 8 40 6 C34 2 26 4 24 8Z" fill="rgba(80,0,120,0.85)"/>
    <ellipse cx="24" cy="14" rx="4" ry="5" fill="rgba(60,0,100,0.9)"/>
    <circle cx="22" cy="12" r="1" fill="rgba(255,80,0,0.9)"/>
    <circle cx="26" cy="12" r="1" fill="rgba(255,80,0,0.9)"/>
  </svg>`;

  const batData = [
    { top:'8%', dur:16, delay:0, size:36 }, { top:'15%', dur:22, delay:5, size:28 },
    { top:'5%', dur:19, delay:9, size:44 }, { top:'22%', dur:25, delay:2, size:24 },
    { top:'12%', dur:18, delay:13, size:32 }, { top:'30%', dur:28, delay:7, size:20 },
    { top:'3%', dur:14, delay:11, size:40 }, { top:'18%', dur:20, delay:17, size:26 },
  ];
  batData.forEach(b => {
    const bat = mkEl('div', 'hw-bat');
    bat.innerHTML = batSVG;
    bat.style.top = b.top;
    bat.style.width = b.size + 'px';
    bat.style.height = (b.size * 0.5) + 'px';
    bat.style.animationDuration = b.dur + 's';
    bat.style.animationDelay = b.delay + 's';
    deco.appendChild(bat);
  });

  [{ left:'5%', size:'2rem', delay:'0s', dur:'3s' }, { left:'15%', size:'2.8rem', delay:'1s', dur:'4s' },
   { left:'82%', size:'2.2rem', delay:'0.5s', dur:'3.5s' }, { left:'92%', size:'3rem', delay:'1.5s', dur:'5s' }]
  .forEach(p => {
    const el = mkEl('div', 'hw-pumpkin');
    el.textContent = '🎃';
    el.style.left = p.left; el.style.fontSize = p.size;
    el.style.animationDelay = p.delay; el.style.animationDuration = p.dur;
    document.body.appendChild(el);
  });

  [{ top:'35%', left:'3%', dur:'3.5s' }, { top:'55%', left:'94%', dur:'4s' }, { top:'70%', left:'8%', dur:'3s' }]
  .forEach(e => {
    const el = mkEl('div', 'hw-eye');
    el.style.top = e.top; el.style.left = e.left; el.style.animationDuration = e.dur;
    document.body.appendChild(el);
  });

  const lightning = mkEl('div', 'hw-lightning');
  document.body.appendChild(lightning);
  lightningTimer = setInterval(() => {
    if (Math.random() > 0.7) {
      lightning.classList.add('flash');
      setTimeout(() => lightning.classList.remove('flash'), 200);
    }
  }, 4000 + Math.random() * 8000);

  for (let i = 0; i < 18; i++) {
    const spark = mkEl('div', 'hw-spark');
    spark.style.left = (Math.random() * 100) + 'vw';
    spark.style.bottom = (Math.random() * 20) + 'vh';
    spark.style.setProperty('--spark-x', (Math.random() * 40 - 20) + 'px');
    spark.style.setProperty('--spark-x2', (Math.random() * 40 - 20) + 'px');
    const colors = ['#ff6a00','#ee0979','#9b00ff','#ff3300','#ffa500'];
    spark.style.background = colors[Math.floor(Math.random() * colors.length)];
    spark.style.animationDuration = (3 + Math.random() * 5) + 's';
    spark.style.animationDelay = (Math.random() * 8) + 's';
    spark.style.width = (2 + Math.random() * 3) + 'px';
    spark.style.height = spark.style.width;
    document.body.appendChild(spark);
  }
}

function checkTheme() {
  db.ref('theme').on('value', snap => {
    const data = snap.val();
    applyTheme(data && data.active ? data.name : 'default');
  });
}


const DISCORD_ID = '730899087825829888';

function initLanyard() {
  const dot = document.getElementById('ds-dot');
  const text = document.getElementById('ds-text');
  const activity = document.getElementById('discord-activity');
  if (!dot || !text) return;

  const STATUS_MAP = {
    online: { label: 'Online', color: '#23d18b' },
    idle: { label: 'Ausente', color: '#f0b429' },
    dnd: { label: 'Não perturbe', color: '#ef4444' },
    offline: { label: 'Offline', color: '#6b7280' },
  };

  function getImageUrl(a) {
    const assets = a.assets;
    if (!assets || !assets.large_image) return null;
    const img = assets.large_image;
    if (img.startsWith('mp:external/')) return 'https://media.discordapp.net/' + img.replace('mp:external/', '');
    if (img.startsWith('spotify:')) return 'https://i.scdn.co/image/' + img.replace('spotify:', '');
    return `https://cdn.discordapp.com/app-assets/${a.application_id}/${img}.png`;
  }

  function getSmallUrl(a) {
    const assets = a.assets;
    if (!assets || !assets.small_image) return null;
    const img = assets.small_image;
    if (img.startsWith('mp:external/')) return 'https://media.discordapp.net/' + img.replace('mp:external/', '');
    return `https://cdn.discordapp.com/app-assets/${a.application_id}/${img}.png`;
  }

  function applyStatus(data) {
    const s = STATUS_MAP[data.discord_status] || STATUS_MAP.offline;
    dot.style.background = s.color;
    dot.style.boxShadow = `0 0 6px ${s.color}`;
    text.textContent = s.label;

    if (!activity) return;

    const spotify = data.spotify;
    if (spotify) {
      const albumArt = spotify.album_art_url || '';
      const song = spotify.song || '';
      const artist = spotify.artist || '';
      activity.classList.remove('hidden');
      activity.innerHTML = `
        <div class="discord-activity-inner spotify">
          <div class="discord-activity-art-wrap">
            ${albumArt ? `<img src="${albumArt}" class="discord-activity-img" alt="album" onerror="this.style.display='none'">` : ''}
            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/Spotify_logo_without_text.svg/168px-Spotify_logo_without_text.svg.png" class="discord-activity-app-icon spotify-icon" alt="Spotify">
          </div>
          <div class="discord-activity-info">
            <span class="discord-activity-app-label"><i class="fas fa-music"></i> Spotify</span>
            <span class="discord-activity-name">${song}</span>
            <span class="discord-activity-detail">${artist}</span>
          </div>
        </div>`;
      return;
    }

    const acts = (data.activities || []).filter(a => a.type !== 4 && a.name !== 'Spotify');
    if (acts.length) {
      const a = acts[0];
      const name = a.name || '';
      const detail = a.details || '';
      const state = a.state || '';
      const imgUrl = getImageUrl(a);
      const smallUrl = getSmallUrl(a);
      activity.classList.remove('hidden');
      activity.innerHTML = `
        <div class="discord-activity-inner">
          <div class="discord-activity-art-wrap">
            ${imgUrl ? `<img src="${imgUrl}" class="discord-activity-img" alt="${name}" onerror="this.style.display='none'">` : ''}
            ${smallUrl ? `<img src="${smallUrl}" class="discord-activity-app-icon" alt="${name}" onerror="this.style.display='none'">` : ''}
          </div>
          <div class="discord-activity-info">
            <span class="discord-activity-app-label"><i class="fas fa-gamepad"></i> ${name}</span>
            ${detail ? `<span class="discord-activity-name">${detail}</span>` : ''}
            ${state ? `<span class="discord-activity-detail">${state}</span>` : ''}
          </div>
        </div>`;
    } else {
      activity.classList.add('hidden');
      activity.innerHTML = '';
    }
  }

  function connectWS() {
    const ws = new WebSocket('wss://api.lanyard.rest/socket');
    let heartbeat;

    ws.onmessage = e => {
      const msg = JSON.parse(e.data);
      if (msg.op === 1) {
        heartbeat = setInterval(() => ws.send(JSON.stringify({ op: 3 })), msg.d.heartbeat_interval);
        ws.send(JSON.stringify({ op: 2, d: { subscribe_to_id: DISCORD_ID } }));
      }
      if ((msg.op === 0 && (msg.t === 'INIT_STATE' || msg.t === 'PRESENCE_UPDATE')) || msg.op === 1) {
        if (msg.d && msg.d[DISCORD_ID]) applyStatus(msg.d[DISCORD_ID]);
        else if (msg.d && msg.d.discord_status) applyStatus(msg.d);
      }
    };

    ws.onclose = () => {
      clearInterval(heartbeat);
      setTimeout(connectWS, 5000);
    };

    ws.onerror = () => ws.close();
  }

  connectWS();
}

function renderGabaritos(gabaritos) {
  const grid = document.getElementById('gabaritos-grid');
  const filtersEl = document.getElementById('gabaritos-filters');
  if (!grid) return;
  grid.innerHTML = '';

  if (!gabaritos || !Object.keys(gabaritos).length) {
    grid.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:40px;grid-column:1/-1">Nenhum gabarito disponível ainda.</p>';
    if (filtersEl) filtersEl.innerHTML = '';
    return;
  }

  const entries = Object.entries(gabaritos).sort((a, b) => (b[1].timestamp || 0) - (a[1].timestamp || 0));

  const materias = [...new Set(entries.map(([,g]) => g.materia).filter(Boolean))];
  let activeFilter = 'all';

  function renderFilter() {
    if (!filtersEl) return;
    filtersEl.innerHTML = `
      <button class="gab-filter-btn ${activeFilter === 'all' ? 'active' : ''}" data-materia="all">Todos</button>
      ${materias.map(m => `<button class="gab-filter-btn ${activeFilter === m ? 'active' : ''}" data-materia="${m}">${m}</button>`).join('')}
    `;
    filtersEl.querySelectorAll('.gab-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        activeFilter = btn.dataset.materia;
        renderFilter();
        renderCards();
      });
    });
  }

  function renderCards() {
    grid.innerHTML = '';
    const filtered = activeFilter === 'all' ? entries : entries.filter(([,g]) => g.materia === activeFilter);
    if (!filtered.length) {
      grid.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:40px;grid-column:1/-1">Nenhum gabarito nesta matéria.</p>';
      return;
    }
    filtered.forEach(([key, g]) => {
      const date = g.timestamp ? new Date(g.timestamp).toLocaleDateString('pt-BR') : '';
      const card = document.createElement('div');
      card.className = 'gabarito-card reveal';
      card.innerHTML = `
        ${g.imagem ? `<div class="gabarito-img-wrap"><img src="${g.imagem}" alt="${g.titulo || ''}" class="gabarito-img" loading="lazy" onerror="this.parentElement.style.display='none'"></div>` : ''}
        <div class="gabarito-body">
          <div class="gabarito-meta">
            ${g.materia ? `<span class="gabarito-tag"><i class="fas fa-book"></i> ${g.materia}</span>` : ''}
            ${date ? `<span class="gabarito-date"><i class="fas fa-calendar"></i> ${date}</span>` : ''}
          </div>
          <h3 class="gabarito-title">${g.titulo || 'Sem título'}</h3>
          ${g.descricao ? `<p class="gabarito-desc">${g.descricao}</p>` : ''}
          <div class="gabarito-actions">
            ${g.link ? `<a href="${g.link}" target="_blank" class="gabarito-btn"><i class="fas fa-arrow-up-right-from-square"></i> Acessar</a>` : ''}
            ${g.imagem ? `<button class="gabarito-btn ghost" onclick="openGabaritoModal('${key}')"><i class="fas fa-eye"></i> Ver imagem</button>` : ''}
          </div>
        </div>
      `;
      grid.appendChild(card);
      setTimeout(() => observeReveal(card), 50);
    });
    initCardGlowIn(grid);
  }

  renderFilter();
  renderCards();
}

window.gabaritoData = {};

window.openGabaritoModal = function(key) {
  const g = window.gabaritoData[key];
  if (!g || !g.imagem) return;
  const content = document.getElementById('modal-content');
  const box = document.getElementById('modal-box');
  if (!content || !box) return;
  content.innerHTML = `
    <p class="modal-title">${g.titulo || 'Gabarito'}</p>
    <img src="${g.imagem}" alt="${g.titulo || ''}" style="width:100%;border-radius:8px;margin-bottom:14px">
    ${g.link ? `<a href="${g.link}" target="_blank" class="modal-link"><i class="fas fa-arrow-up-right-from-square"></i> Acessar link</a>` : ''}
  `;
  document.getElementById('modal-backdrop').classList.remove('hidden');
};

checkMaintenance();
checkTheme();
window.addEventListener('DOMContentLoaded', init);