(function () {
  /** Change if you fork the repo */
  const GITHUB_EDIT_MENU_CONFIG =
    'https://github.com/vyeezus/vyscafe/edit/main/menu-config.json';

  const CAT_LABELS = {
    matcha: 'Matcha',
    jasmine: 'Jasmine green tea',
    other_tea: 'Specialty tea',
  };

  /** @type {Set<string>} */
  let hidden = new Set();

  function esc(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  function exportJson() {
    return JSON.stringify({ hidden: [...hidden].sort() }, null, 2) + '\n';
  }

  function setStatus(msg) {
    const el = document.getElementById('admin-status');
    if (el) el.textContent = msg || '';
  }

  function renderList() {
    const base = window.BASE_DRINKS;
    const host = document.getElementById('admin-base-list');
    if (!base || !host) return;
    host.innerHTML = '';
    for (const cat of Object.keys(base)) {
      const block = document.createElement('div');
      block.className = 'admin-cat-block';
      block.innerHTML = `<div class="admin-cat-title">${esc(CAT_LABELS[cat] || cat)}</div>`;
      for (const d of base[cat]) {
        const onMenu = !hidden.has(d.id);
        const row = document.createElement('label');
        row.className = 'admin-row';
        row.innerHTML = `
          <input type="checkbox" ${onMenu ? 'checked' : ''}>
          <div>
            <div><strong>${esc(d.name)}</strong> <span style="opacity:0.7">${esc(d.emoji || '')}</span></div>
            <div class="admin-row-meta">${esc(d.desc)} · <code>${esc(d.id)}</code></div>
          </div>`;
        const cb = row.querySelector('input');
        cb.addEventListener('change', () => {
          if (cb.checked) hidden.delete(d.id);
          else hidden.add(d.id);
          setStatus('');
        });
        block.appendChild(row);
      }
      host.appendChild(block);
    }
  }

  async function boot() {
    const link = document.getElementById('github-edit-link');
    if (link) link.href = GITHUB_EDIT_MENU_CONFIG;

    try {
      const res = await fetch(`menu-config.json?_=${Date.now()}`, { cache: 'no-store' });
      if (res.ok) {
        const j = await res.json();
        hidden = new Set(Array.isArray(j.hidden) ? j.hidden : []);
      }
    } catch (_) {}

    renderList();

    document.getElementById('btn-copy').addEventListener('click', async () => {
      const text = exportJson();
      try {
        await navigator.clipboard.writeText(text);
        setStatus('Copied. Open the GitHub link, replace the file contents, commit.');
      } catch {
        setStatus('Copy failed — use Download instead.');
      }
    });

    document.getElementById('btn-download').addEventListener('click', () => {
      const blob = new Blob([exportJson()], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'menu-config.json';
      a.click();
      URL.revokeObjectURL(a.href);
      setStatus('Downloaded. Upload to repo or paste into GitHub editor.');
    });
  }

  boot();
})();
