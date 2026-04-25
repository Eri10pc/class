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

window.gabaritoData = {};

function observeReveal(el) {
  if (el.classList.contains('visible')) return;
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } });
  }, { threshold: 0.08 });
  obs.observe(el);
}

function initReveal() {
  document.querySelectorAll('.reveal').forEach(el => observeReveal(el));
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

window.openGabaritoModal = function(key) {
  const g = window.gabaritoData[key];
  if (!g || !g.imagem) return;
  const content = document.getElementById('modal-content');
  if (!content) return;
  content.innerHTML = `
    <p class="modal-title">${g.titulo || 'Gabarito'}</p>
    <img src="${g.imagem}" alt="${g.titulo || ''}" style="width:100%;border-radius:8px;margin-bottom:14px">
    ${g.link ? `<a href="${g.link}" target="_blank" class="modal-link"><i class="fas fa-arrow-up-right-from-square"></i> Acessar link</a>` : ''}
  `;
  document.getElementById('modal-backdrop').classList.remove('hidden');
};

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
    document.querySelectorAll('.gabarito-card').forEach(card => {
      if (card.dataset.glowBound) return;
      card.dataset.glowBound = '1';
      card.addEventListener('mousemove', update);
    });
  };
  attach();
  new MutationObserver(attach).observe(document.body, { childList: true, subtree: true });
}

function renderGabaritos(gabaritos) {
  const grid = document.getElementById('gabaritos-grid');
  const filtersEl = document.getElementById('gabaritos-filters');
  if (!grid) return;
  grid.innerHTML = '';

  if (!gabaritos || !Object.keys(gabaritos).length) {
    grid.innerHTML = '<p class="gab-empty"><i class="fas fa-file-alt"></i><span>Nenhum gabarito disponível ainda.</span></p>';
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
      grid.innerHTML = '<p class="gab-empty"><i class="fas fa-search"></i><span>Nenhum gabarito nesta matéria.</span></p>';
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
    initCardGlow();
  }

  renderFilter();
  renderCards();
}

function applyTheme(theme) {
  document.body.classList.remove('halloween');
  if (theme === 'halloween') document.body.classList.add('halloween');
}

window.addEventListener('DOMContentLoaded', () => {
  initHamburger();
  initModal();
  initReveal();
  initCardGlow();

  db.ref('gabaritos').on('value', snap => {
    window.gabaritoData = snap.val() || {};
    renderGabaritos(snap.val());
  });

  db.ref('theme').on('value', snap => {
    const data = snap.val();
    applyTheme(data && data.active ? data.name : 'default');
  });
});