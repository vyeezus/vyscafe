(function () {
  const MENU_STORAGE_KEY = 'vy_cafe_menu_config';
  const SESSION_UNLOCK = 'vy_cafe_admin_unlocked';

  const CAT_LABELS = {
    matcha: 'Matcha',
    jasmine: 'Jasmine green tea',
    other_tea: 'Specialty tea',
  };

  /** @type {{ hidden: Set<string>, additions: Record<string, object[]>, adminPin: string }} */
  let state = {
    hidden: new Set(),
    additions: { matcha: [], jasmine: [], other_tea: [] },
    adminPin: '',
  };

  let remoteConfig = {};

  function esc(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  function normalizeConfig(raw) {
    const a = raw && raw.additions ? raw.additions : {};
    return {
      hidden: Array.isArray(raw && raw.hidden) ? [...raw.hidden] : [],
      additions: {
        matcha: Array.isArray(a.matcha) ? JSON.parse(JSON.stringify(a.matcha)) : [],
        jasmine: Array.isArray(a.jasmine) ? JSON.parse(JSON.stringify(a.jasmine)) : [],
        other_tea: Array.isArray(a.other_tea) ? JSON.parse(JSON.stringify(a.other_tea)) : [],
      },
      adminPin: typeof raw?.adminPin === 'string' ? raw.adminPin : '',
    };
  }

  function toExportObject() {
    const pinVal = document.getElementById('export-admin-pin').value.trim();
    const clearPin = document.getElementById('clear-admin-pin').checked;
    const o = {
      hidden: [...state.hidden].sort(),
      additions: {
        matcha: state.additions.matcha.map(stripForExport),
        jasmine: state.additions.jasmine.map(stripForExport),
        other_tea: state.additions.other_tea.map(stripForExport),
      },
    };
    if (!clearPin) {
      if (pinVal) o.adminPin = pinVal;
      else if (state.adminPin) o.adminPin = state.adminPin;
    }
    return o;
  }

  function stripForExport(d) {
    const { id, name, desc, emoji, seasonal, popular, hideMilk, oatMilkNote } = d;
    const x = { id, name, desc, emoji: emoji || '🍵' };
    if (seasonal) x.seasonal = true;
    if (popular) x.popular = true;
    if (hideMilk) x.hideMilk = true;
    if (oatMilkNote) x.oatMilkNote = true;
    return x;
  }

  function setStatus(msg) {
    const el = document.getElementById('admin-status');
    if (el) el.textContent = msg || '';
  }

  function applyStateFromConfig(cfg) {
    const n = normalizeConfig(cfg);
    state.hidden = new Set(n.hidden);
    state.additions = n.additions;
    state.adminPin = n.adminPin;
    document.getElementById('export-admin-pin').value = '';
    document.getElementById('clear-admin-pin').checked = false;
  }

  function renderBaseList() {
    const base = window.BASE_DRINKS;
    if (!base) {
      document.getElementById('admin-base-list').innerHTML = '<p>Missing drinks-data.js</p>';
      return;
    }
    const host = document.getElementById('admin-base-list');
    host.innerHTML = '';
    for (const cat of Object.keys(base)) {
      const block = document.createElement('div');
      block.className = 'admin-cat-block';
      block.innerHTML = `<div class="admin-cat-title">${esc(CAT_LABELS[cat] || cat)}</div>`;
      for (const d of base[cat]) {
        const onMenu = !state.hidden.has(d.id);
        const row = document.createElement('label');
        row.className = 'admin-row';
        row.innerHTML = `
          <input type="checkbox" data-base-id="${esc(d.id)}" ${onMenu ? 'checked' : ''}>
          <div>
            <div><strong>${esc(d.name)}</strong> <span style="opacity:0.7">${esc(d.emoji || '')}</span></div>
            <div class="admin-row-meta">${esc(d.desc)} · id <code>${esc(d.id)}</code></div>
          </div>`;
        const cb = row.querySelector('input');
        cb.addEventListener('change', () => {
          if (cb.checked) state.hidden.delete(d.id);
          else state.hidden.add(d.id);
          setStatus('');
        });
        block.appendChild(row);
      }
      host.appendChild(block);
    }
  }

  function renderAdditions() {
    const host = document.getElementById('admin-additions-list');
    host.innerHTML = '';
    let any = false;
    for (const cat of ['matcha', 'jasmine', 'other_tea']) {
      const list = state.additions[cat] || [];
      for (const d of list) {
        any = true;
        const row = document.createElement('div');
        row.className = 'admin-custom-row';
        row.innerHTML = `
          <div>
            <strong>${esc(d.name)}</strong> <span style="opacity:0.7">${esc(d.emoji || '')}</span>
            <div class="admin-row-meta">${esc(CAT_LABELS[cat])} · ${esc(d.desc)}</div>
          </div>
          <button type="button" data-remove-cat="${esc(cat)}" data-remove-id="${esc(d.id)}">Remove</button>`;
        row.querySelector('button').addEventListener('click', () => {
          state.additions[cat] = state.additions[cat].filter((x) => x.id !== d.id);
          renderAdditions();
          setStatus('Removed from list (download or apply to save).');
        });
        host.appendChild(row);
      }
    }
    if (!any) {
      host.innerHTML = '<p class="admin-hint">No custom drinks yet.</p>';
    }
  }

  function showPanel() {
    document.getElementById('admin-lock').hidden = true;
    document.getElementById('admin-panel').hidden = false;
    renderBaseList();
    renderAdditions();
  }

  function tryUnlock() {
    const input = document.getElementById('admin-pin-input');
    const msg = document.getElementById('admin-pin-msg');
    const pin = input.value.trim();
    if (pin === state.adminPin) {
      sessionStorage.setItem(SESSION_UNLOCK, '1');
      msg.textContent = '';
      showPanel();
    } else {
      msg.textContent = 'Incorrect PIN.';
    }
  }

  async function boot() {
    const base = window.BASE_DRINKS;
    if (!base) {
      setStatus('Load error: BASE_DRINKS not found.');
      return;
    }

    try {
      const res = await fetch(`menu-config.json?_=${Date.now()}`, { cache: 'no-store' });
      if (res.ok) remoteConfig = await res.json();
      else remoteConfig = {};
    } catch {
      remoteConfig = {};
    }

    applyStateFromConfig(remoteConfig);

    if (state.adminPin && sessionStorage.getItem(SESSION_UNLOCK) !== '1') {
      document.getElementById('admin-lock').hidden = false;
      document.getElementById('admin-panel').hidden = true;
      document.getElementById('admin-pin-submit').addEventListener('click', tryUnlock);
      document.getElementById('admin-pin-input').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') tryUnlock();
      });
      return;
    }

    showPanel();
  }

  document.getElementById('admin-add-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const cat = fd.get('cat');
    const id = `c_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
    const drink = {
      id,
      name: String(fd.get('name') || '').trim(),
      desc: String(fd.get('desc') || '').trim(),
      emoji: String(fd.get('emoji') || '🍵').trim() || '🍵',
      seasonal: fd.get('seasonal') === 'on',
      popular: fd.get('popular') === 'on',
      hideMilk: fd.get('hideMilk') === 'on',
      oatMilkNote: fd.get('oatMilkNote') === 'on',
    };
    if (!drink.name || !drink.desc) return;
    state.additions[cat].push(drink);
    e.target.reset();
    renderAdditions();
    setStatus('Added (remember to download or apply to browser).');
  });

  document.getElementById('btn-download').addEventListener('click', () => {
    const exportObj = toExportObject();
    const blob = new Blob([JSON.stringify(exportObj, null, 2) + '\n'], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'menu-config.json';
    a.click();
    URL.revokeObjectURL(a.href);
    state.adminPin = exportObj.adminPin || '';
    setStatus('Download started.');
  });

  document.getElementById('btn-local').addEventListener('click', () => {
    const exportObj = toExportObject();
    localStorage.setItem(MENU_STORAGE_KEY, JSON.stringify(exportObj));
    state.adminPin = exportObj.adminPin || '';
    setStatus('Saved to this browser. Reload the menu page to preview.');
  });

  document.getElementById('btn-load-file').addEventListener('change', (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        applyStateFromConfig(parsed);
        renderBaseList();
        renderAdditions();
        setStatus('Loaded file into editor.');
      } catch {
        setStatus('Could not parse JSON.');
      }
      e.target.value = '';
    };
    reader.readAsText(f);
  });

  boot();
})();
