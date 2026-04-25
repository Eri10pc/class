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
const auth = firebase.auth();

let currentTab = 'scripts';

function toast(msg, type = 'success') {
  const icons = { success: 'fa-circle-check', error: 'fa-circle-xmark' };
  const colors = { success: '#10b981', error: '#ef4444' };
  const el = document.createElement('div');
  el.className = `toast-admin ${type}`;
  el.innerHTML = `<i class="fas ${icons[type]}" style="color:${colors[type]}"></i><span>${msg}</span>`;
  document.getElementById('toast-admin').appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

function openModal(title, bodyHTML) {
  document.getElementById('admin-modal-title').textContent = title;
  document.getElementById('admin-modal-body').innerHTML = bodyHTML;
  document.getElementById('admin-modal-backdrop').classList.remove('hidden');
}
function closeModal() {
  document.getElementById('admin-modal-backdrop').classList.add('hidden');
}

function statusBadge(status) {
  const map = { ativo: 'Ativo', offline: 'Offline', manutencao: 'Manutenção' };
  return `<span class="item-status ${status}">${map[status] || status}</span>`;
}
function normStatus(s) {
  const r = (s.status || 'ativo').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return r.includes('manu') ? 'manutencao' : r === 'offline' ? 'offline' : 'ativo';
}

function renderScriptsList(scripts) {
  const container = document.getElementById('scripts-list');
  if (!container) return;
  if (!scripts || !Object.keys(scripts).length) {
    container.innerHTML = `<div class="empty-state"><i class="fas fa-code"></i>Nenhum script cadastrado.</div>`;
    return;
  }
  container.innerHTML = Object.entries(scripts).map(([key, s]) => {
    const ns = normStatus(s);
    const nome = s.name || s.id || key;
    const link = s.url || s.link || 'Sem link';
    return `
    <div class="admin-item">
      <div class="admin-item-info">
        <div class="admin-item-name">${nome}</div>
        <div class="admin-item-sub">${link}</div>
      </div>
      ${statusBadge(ns)}
      <div class="admin-item-actions">
        <button class="btn-icon" onclick="editScript('${key}')" title="Editar"><i class="fas fa-pen"></i></button>
        <button class="btn-icon danger" onclick="deleteItem('scripts','${key}')" title="Deletar"><i class="fas fa-trash"></i></button>
      </div>
    </div>`;
  }).join('');
}

function scriptFormHTML(data = {}) {
  return `
    <div class="form-group"><label>Nome do Script</label>
      <input type="text" id="f-name" placeholder="Ex: Khan Academy Auto" value="${data.name || data.id || ''}" /></div>
    <div class="form-group"><label>Categoria</label>
      <input type="text" id="f-category" placeholder="Ex: Programação, Inglês..." value="${data.category || ''}" /></div>
    <div class="form-group"><label>Descrição</label>
      <textarea id="f-desc" rows="3" placeholder="Descrição breve do script">${data.desc || data.description || ''}</textarea></div>
    <div class="form-group"><label>URL do Script</label>
      <input type="url" id="f-link" placeholder="https://..." value="${data.url || data.link || ''}" /></div>
    <div class="form-group"><label>Status</label>
      <select id="f-status">
        <option value="ativo" ${(!data.status || data.status.toLowerCase() === 'ativo') ? 'selected' : ''}>Ativo</option>
        <option value="offline" ${data.status && data.status.toLowerCase() === 'offline' ? 'selected' : ''}>Offline</option>
        <option value="manutencao" ${data.status && data.status.toLowerCase().includes('manu') ? 'selected' : ''}>Manutenção</option>
      </select></div>
    <button class="btn-save" id="f-submit" style="width:100%;justify-content:center"><i class="fas fa-save"></i> Salvar</button>`;
}

window.editScript = function(key) {
  db.ref('scripts/' + key).once('value', function(snap) {
    const data = snap.val() || {};
    openModal('Editar Script', scriptFormHTML(data));
    document.getElementById('f-submit').addEventListener('click', async function() {
      const nameVal = document.getElementById('f-name').value.trim();
      if (!nameVal) { toast('Nome obrigatório', 'error'); return; }
      await db.ref('scripts/' + key).update({
        name: nameVal,
        desc: document.getElementById('f-desc').value.trim(),
        url: document.getElementById('f-link').value.trim(),
        status: document.getElementById('f-status').value,
        category: document.getElementById('f-category').value.trim()
      });
      toast('Script atualizado!'); closeModal();
    });
  });
};

function renderAvisosList(avisos) {
  const container = document.getElementById('avisos-list');
  if (!container) return;
  if (!avisos || !Object.keys(avisos).length) {
    container.innerHTML = `<div class="empty-state"><i class="fas fa-bell"></i>Nenhum aviso cadastrado.</div>`;
    return;
  }
  const sorted = Object.entries(avisos).sort((a,b) => (b[1].timestamp||0) - (a[1].timestamp||0));
  container.innerHTML = sorted.map(([key, av]) => `
    <div class="admin-item">
      <div class="admin-item-info">
        <div class="admin-item-name">${av.text ? av.text.substring(0,60) + (av.text.length > 60 ? '…' : '') : 'Aviso'}</div>
        <div class="admin-item-sub">por ${av.author || 'Admin'} — ${av.timestamp ? new Date(av.timestamp).toLocaleDateString('pt-BR') : ''}</div>
      </div>
      <div class="admin-item-actions">
        <button class="btn-icon" onclick="editAviso('${key}')" title="Editar"><i class="fas fa-pen"></i></button>
        <button class="btn-icon danger" onclick="deleteItem('avisos','${key}')" title="Deletar"><i class="fas fa-trash"></i></button>
      </div>
    </div>`).join('');
}

function avisoFormHTML(data = {}) {
  return `
    <div class="form-group"><label>Texto do Aviso</label>
      <textarea id="f-text" rows="4" placeholder="Digite o aviso aqui...">${data.text || ''}</textarea></div>
    <div class="form-group"><label>Autor</label>
      <input type="text" id="f-author" placeholder="Nome do autor" value="${data.author || 'Admin'}" /></div>
    <button class="btn-save" id="f-submit" style="width:100%;justify-content:center"><i class="fas fa-save"></i> Salvar</button>`;
}

window.editAviso = function(key) {
  db.ref(`avisos/${key}`).once('value', snap => {
    const data = snap.val() || {};
    openModal('Editar Aviso', avisoFormHTML(data));
    document.getElementById('f-submit').addEventListener('click', async () => {
      const text = document.getElementById('f-text').value.trim();
      const author = document.getElementById('f-author').value.trim();
      if (!text) { toast('Texto obrigatório', 'error'); return; }
      await db.ref(`avisos/${key}`).update({ text, author });
      toast('Aviso atualizado!'); closeModal();
    });
  });
};

let teamsCache = {};

function renderTeamsList(teams) {
  teamsCache = teams || {};
  const container = document.getElementById('teams-list');
  if (!container) return;

  if (!teams || !Object.keys(teams).length) {
    container.innerHTML = `<div class="empty-state"><i class="fas fa-users"></i>Nenhuma equipe cadastrada.<br><small style="margin-top:8px;display:block;opacity:.6">Clique em "+ Nova Equipe" para começar.</small></div>`;
    return;
  }

  const sorted = Object.entries(teams).sort((a, b) => (a[1].order ?? 999) - (b[1].order ?? 999));

  container.innerHTML = sorted.map(([teamKey, team]) => {
    const memberCount = team.members ? Object.keys(team.members).length : 0;
    const memberPreviews = team.members
      ? Object.values(team.members).slice(0, 4).map(m =>
          m.avatar
            ? `<img src="${m.avatar}" title="${m.name}" style="width:28px;height:28px;border-radius:50%;object-fit:cover;border:2px solid var(--surface-3);margin-left:-6px;" onerror="this.style.display='none'">`
            : `<div style="width:28px;height:28px;border-radius:50%;background:var(--surface-3);border:2px solid var(--surface-2);margin-left:-6px;display:flex;align-items:center;justify-content:center;font-size:11px;color:var(--text-muted)">${(m.name||'?')[0].toUpperCase()}</div>`
        ).join('')
      : '';

    return `
    <div class="team-admin-card">
      <div class="team-admin-header">
        <div class="team-admin-info">
          ${team.icon
            ? `<img src="${team.icon}" alt="${team.name}" class="team-admin-logo" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
            : ''}
          <div class="team-admin-logo-placeholder" style="display:${team.icon ? 'none' : 'flex'}"><i class="fas fa-users"></i></div>
          <div>
            <div class="team-admin-name">${team.name || 'Equipe sem nome'}</div>
            <div class="team-admin-meta">${memberCount} membro${memberCount !== 1 ? 's' : ''} · ordem ${team.order ?? '—'}</div>
          </div>
        </div>
        <div class="team-admin-actions">
          <button class="btn-icon" onclick="editTeam('${teamKey}')" title="Editar equipe"><i class="fas fa-pen"></i></button>
          <button class="btn-icon" onclick="addMember('${teamKey}')" title="Adicionar membro"><i class="fas fa-user-plus"></i></button>
          <button class="btn-icon danger" onclick="deleteItem('teams','${teamKey}')" title="Deletar equipe"><i class="fas fa-trash"></i></button>
        </div>
      </div>
      ${memberCount > 0 ? `
      <div class="team-members-list">
        ${Object.entries(team.members || {}).map(([mKey, m]) => `
          <div class="team-member-row">
            ${m.avatar
              ? `<img src="${m.avatar}" alt="${m.name}" class="team-member-avatar" onerror="this.style.background='var(--surface-3)';this.src=''">`
              : `<div class="team-member-avatar-placeholder">${(m.name||'?')[0].toUpperCase()}</div>`}
            <div class="team-member-info">
              <span class="team-member-name">${m.name || '—'}</span>
              <span class="team-member-role">${m.role || 'Membro'}</span>
            </div>
            <div class="team-member-actions">
              <button class="btn-icon sm" onclick="editMember('${teamKey}','${mKey}')" title="Editar"><i class="fas fa-pen"></i></button>
              <button class="btn-icon sm danger" onclick="deleteMember('${teamKey}','${mKey}')" title="Remover"><i class="fas fa-times"></i></button>
            </div>
          </div>`).join('')}
      </div>` : ''}
    </div>`;
  }).join('');
}

function teamFormHTML(data = {}) {
  return `
    <div class="form-group"><label>Nome da Equipe / Servidor</label>
      <input type="text" id="f-tname" placeholder="Ex: ClassScripts, Sala do Futuro..." value="${data.name || ''}" /></div>
    <div class="form-group"><label>Logo do Servidor (URL da imagem)</label>
      <input type="url" id="f-ticon" placeholder="https://cdn.discordapp.com/icons/..." value="${data.icon || ''}" />
      <p style="font-size:11px;color:var(--text-muted);margin-top:6px">Cole o link direto da imagem (Discord CDN, Imgur, etc.)</p></div>
    <div id="team-logo-preview-wrap" style="text-align:center;margin-bottom:16px;display:${data.icon ? 'block' : 'none'}">
      <img id="team-logo-preview" src="${data.icon || ''}" style="width:56px;height:56px;border-radius:12px;object-fit:cover;border:2px solid var(--border)" onerror="this.style.display='none'">
    </div>
    <div class="form-group"><label>Link do Servidor (Discord, site, etc.)</label>
      <input type="url" id="f-tlink" placeholder="https://discord.gg/..." value="${data.link || ''}" /></div>
    <div class="form-group"><label>Ordem das abas (número)</label>
      <input type="number" id="f-torder" placeholder="1" value="${data.order ?? ''}" min="1" /></div>
    <button class="btn-save" id="f-submit" style="width:100%;justify-content:center"><i class="fas fa-save"></i> Salvar Equipe</button>`;
}

function memberFormHTML(data = {}) {
  return `
    <div class="form-group"><label>Nome</label>
      <input type="text" id="f-mname" placeholder="Nome do membro" value="${data.name || ''}" /></div>
    <div class="form-group"><label>Cargo / Papel</label>
      <input type="text" id="f-mrole" placeholder="Ex: Fundador, Desenvolvedor..." value="${data.role || ''}" /></div>
    <div class="form-group"><label>URL do Avatar</label>
      <input type="url" id="f-mavatar" placeholder="https://..." value="${data.avatar || ''}" />
      <p style="font-size:11px;color:var(--text-muted);margin-top:6px">Use links diretos de imagem (Discord CDN, Imgur, etc.)</p></div>
    <div id="avatar-preview-wrap" style="text-align:center;margin-bottom:16px;display:${data.avatar ? 'block' : 'none'}">
      <img id="avatar-preview" src="${data.avatar || ''}" style="width:64px;height:64px;border-radius:50%;object-fit:cover;border:2px solid var(--border)" onerror="this.style.display='none'">
    </div>
    <button class="btn-save" id="f-submit" style="width:100%;justify-content:center"><i class="fas fa-save"></i> Salvar Membro</button>`;
}

window.editTeam = function(key) {
  const data = teamsCache[key] || {};
  openModal('Editar Equipe', teamFormHTML(data));
  setupLogoPreview();
  document.getElementById('f-submit').addEventListener('click', async () => {
    const name = document.getElementById('f-tname').value.trim();
    if (!name) { toast('Nome obrigatório', 'error'); return; }
    await db.ref(`teams/${key}`).update({
      name,
      icon: document.getElementById('f-ticon').value.trim(),
      link: document.getElementById('f-tlink').value.trim(),
      order: parseInt(document.getElementById('f-torder').value) || 1
    });
    toast('Equipe atualizada!'); closeModal();
  });
};

window.addMember = function(teamKey) {
  openModal('Novo Membro', memberFormHTML());
  setupAvatarPreview();
  document.getElementById('f-submit').addEventListener('click', async () => {
    const name = document.getElementById('f-mname').value.trim();
    if (!name) { toast('Nome obrigatório', 'error'); return; }
    const ref = db.ref(`teams/${teamKey}/members`).push();
    await ref.set({
      name,
      role: document.getElementById('f-mrole').value.trim(),
      avatar: document.getElementById('f-mavatar').value.trim()
    });
    toast('Membro adicionado!'); closeModal();
  });
};

window.editMember = function(teamKey, memberKey) {
  db.ref(`teams/${teamKey}/members/${memberKey}`).once('value', snap => {
    const data = snap.val() || {};
    openModal('Editar Membro', memberFormHTML(data));
    setupAvatarPreview();
    document.getElementById('f-submit').addEventListener('click', async () => {
      const name = document.getElementById('f-mname').value.trim();
      if (!name) { toast('Nome obrigatório', 'error'); return; }
      await db.ref(`teams/${teamKey}/members/${memberKey}`).update({
        name,
        role: document.getElementById('f-mrole').value.trim(),
        avatar: document.getElementById('f-mavatar').value.trim()
      });
      toast('Membro atualizado!'); closeModal();
    });
  });
};

window.deleteMember = function(teamKey, memberKey) {
  if (!confirm('Remover este membro da equipe?')) return;
  db.ref(`teams/${teamKey}/members/${memberKey}`).remove()
    .then(() => toast('Membro removido!'))
    .catch(() => toast('Erro ao remover', 'error'));
};

function setupLogoPreview() {
  const input = document.getElementById('f-ticon');
  const wrap = document.getElementById('team-logo-preview-wrap');
  const img = document.getElementById('team-logo-preview');
  if (!input || !wrap || !img) return;
  input.addEventListener('input', () => {
    const url = input.value.trim();
    if (url) {
      img.src = url;
      img.style.display = 'block';
      wrap.style.display = 'block';
    } else {
      wrap.style.display = 'none';
    }
  });
}

function setupAvatarPreview() {
  const input = document.getElementById('f-mavatar');
  const wrap = document.getElementById('avatar-preview-wrap');
  const img = document.getElementById('avatar-preview');
  if (!input || !wrap || !img) return;
  input.addEventListener('input', () => {
    const url = input.value.trim();
    if (url) {
      img.src = url;
      img.style.display = 'block';
      wrap.style.display = 'block';
    } else {
      wrap.style.display = 'none';
    }
  });
}

window.deleteItem = function(collection, key) {
  if (!confirm('Tem certeza que deseja deletar este item?')) return;
  db.ref(`${collection}/${key}`).remove()
    .then(() => toast('Item deletado!'))
    .catch(() => toast('Erro ao deletar', 'error'));
};

function initTabs() {
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(`tab-${tab}`)?.classList.add('active');
      document.getElementById('topbar-title').textContent = btn.querySelector('span').textContent;
      currentTab = tab;
      if (window.innerWidth <= 768) document.getElementById('sidebar').classList.remove('open');
    });
  });
}

function initAddButtons() {
  
  document.getElementById('add-script-btn')?.addEventListener('click', () => {
    openModal('Novo Script', scriptFormHTML());
    document.getElementById('f-submit').addEventListener('click', async () => {
      const payload = { name: document.getElementById('f-name').value.trim(), desc: document.getElementById('f-desc').value.trim(), url: document.getElementById('f-link').value.trim(), status: document.getElementById('f-status').value, category: document.getElementById('f-category').value.trim() };
      if (!payload.name) { toast('Nome obrigatório', 'error'); return; }
      await db.ref('scripts').push().set(payload);
      toast('Script criado!'); closeModal();
    });
  });

  
  document.getElementById('add-aviso-btn')?.addEventListener('click', () => {
    openModal('Novo Aviso', avisoFormHTML());
    document.getElementById('f-submit').addEventListener('click', async () => {
      const text = document.getElementById('f-text').value.trim();
      const author = document.getElementById('f-author').value.trim();
      if (!text) { toast('Texto obrigatório', 'error'); return; }
      await db.ref('avisos').push().set({ text, author, timestamp: Date.now() });
      toast('Aviso criado!'); closeModal();
    });
  });

  
  document.getElementById('add-team-btn')?.addEventListener('click', () => {
    openModal('Nova Equipe', teamFormHTML());
  setupLogoPreview();
    document.getElementById('f-submit').addEventListener('click', async () => {
      const name = document.getElementById('f-tname').value.trim();
      if (!name) { toast('Nome obrigatório', 'error'); return; }
      await db.ref('teams').push().set({
        name,
        icon: document.getElementById('f-ticon').value.trim() || '',
        link: document.getElementById('f-tlink').value.trim(),
        order: parseInt(document.getElementById('f-torder').value) || 99,
        members: {}
      });
      toast('Equipe criada!'); closeModal();
    });
  });
}

function initAlerta() {
  db.ref('avisoGlobal').once('value', snap => {
    const data = snap.val() || {};
    const inp = document.getElementById('alerta-text');
    const chk = document.getElementById('alerta-active');
    if (inp) inp.value = data.text || '';
    if (chk) chk.checked = !!data.active;
  });
  document.getElementById('save-alerta-btn')?.addEventListener('click', async () => {
    const text = document.getElementById('alerta-text').value.trim();
    const active = document.getElementById('alerta-active').checked;
    await db.ref('avisoGlobal').set({ text, active });
    toast('Alerta atualizado!');
  });
}

function initMaintenance() {
  const indicator = document.getElementById('maint-indicator');
  const statusText = document.getElementById('maint-status-text');
  db.ref('maintenance').on('value', snap => {
    const data = snap.val() || {};
    const isOn = !!data.active;
    const chk = document.getElementById('maint-active');
    const msgEl = document.getElementById('maint-message');
    if (chk) chk.checked = isOn;
    if (msgEl) msgEl.value = data.message || '';
    if (indicator) {
      indicator.className = `maintenance-status-indicator ${isOn ? 'on' : 'off'}`;
      statusText.textContent = isOn ? 'Manutenção ATIVA — site inacessível para visitantes' : 'Site online e acessível';
    }
  });
  document.getElementById('save-maint-btn')?.addEventListener('click', async () => {
    const active = document.getElementById('maint-active').checked;
    const message = document.getElementById('maint-message').value.trim();
    if (active && !confirm('Ativar manutenção irá bloquear o acesso de todos os usuários. Continuar?')) return;
    await db.ref('maintenance').set({ active, message });
    toast(active ? 'Manutenção ativada!' : 'Manutenção desativada!', active ? 'error' : 'success');
  });
}

function updateTemaUI(current) {
  const nameEl = document.getElementById('tema-current-name');
  if (nameEl) nameEl.textContent = current === 'halloween' ? '🎃 Halloween' : 'Padrão (Roxo)';
  document.querySelectorAll('.tema-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.tema === current));
}

function initTema() {
  db.ref('theme').on('value', snap => {
    const data = snap.val();
    const current = (data && data.active && data.name) ? data.name : 'default';
    updateTemaUI(current);
  });
  document.querySelectorAll('.tema-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const tema = btn.dataset.tema;
      await db.ref('theme').set({ name: tema, active: tema !== 'default' });
      updateTemaUI(tema);
      toast(tema === 'halloween' ? '🎃 Tema Halloween ativado!' : 'Tema padrão ativado!');
    });
  });
}

function initListeners() {
  db.ref('scripts').on('value', snap => renderScriptsList(snap.val()));
  db.ref('avisos').on('value', snap => renderAvisosList(snap.val()));
  db.ref('teams').on('value', snap => renderTeamsList(snap.val()));
}

function initSidebarToggle() {
  const toggle = document.getElementById('sidebar-toggle');
  const sidebar = document.getElementById('sidebar');
  toggle?.addEventListener('click', () => sidebar?.classList.toggle('open'));
  document.addEventListener('click', e => {
    if (window.innerWidth <= 768 && sidebar?.classList.contains('open')) {
      if (!sidebar.contains(e.target) && e.target !== toggle) sidebar.classList.remove('open');
    }
  });
}

function initLogin() {
  document.getElementById('login-btn')?.addEventListener('click', async () => {
    const email = document.getElementById('login-email').value.trim();
    const pass = document.getElementById('login-password').value;
    const errEl = document.getElementById('login-error');
    errEl.classList.add('hidden');
    try {
      await auth.signInWithEmailAndPassword(email, pass);
    } catch (e) {
      errEl.textContent = 'E-mail ou senha incorretos.';
      errEl.classList.remove('hidden');
    }
  });
  document.getElementById('login-password')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('login-btn')?.click();
  });
  document.getElementById('logout-btn')?.addEventListener('click', () => auth.signOut());
}

document.getElementById('admin-modal-close')?.addEventListener('click', closeModal);
document.getElementById('admin-modal-backdrop')?.addEventListener('click', e => {
  if (e.target === document.getElementById('admin-modal-backdrop')) closeModal();
});

auth.onAuthStateChanged(user => {
  if (user) {
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('admin-app').classList.remove('hidden');
    document.getElementById('admin-email').textContent = user.email;
    initTabs();
    initAddButtons();
    initAlerta();
    initMaintenance();
    initListeners();
    initSidebarToggle();
    initTema();
  } else {
    document.getElementById('login-screen').classList.remove('hidden');
    document.getElementById('admin-app').classList.add('hidden');
  }
});

initLogin();