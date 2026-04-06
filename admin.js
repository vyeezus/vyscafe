(function () {
  const CAT_LABELS = {
    matcha: 'Matcha',
    jasmine: 'Jasmine green tea',
    other_tea: 'Specialty tea',
  };

  /** @type {Set<string>} */
  let hidden = new Set();
  let saveTimer = null;

  function esc(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  function setAuthMsg(msg) {
    const el = document.getElementById('admin-auth-msg');
    if (el) el.textContent = msg || '';
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
          scheduleSave();
        });
        block.appendChild(row);
      }
      host.appendChild(block);
    }
  }

  function scheduleSave() {
    if (!window.VY_FIREBASE_ACTIVE || typeof firebase === 'undefined') {
      setStatus('Configure Firebase to save.');
      return;
    }
    const u = firebase.auth().currentUser;
    if (!u) {
      setStatus('Sign in to save.');
      return;
    }
    clearTimeout(saveTimer);
    saveTimer = setTimeout(pushHidden, 450);
  }

  async function pushHidden() {
    const u = firebase.auth().currentUser;
    if (!u) return;
    setStatus('Saving…');
    try {
      await firebase
        .firestore()
        .collection('config')
        .doc('menu')
        .set(
          {
            hidden: [...hidden].sort(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
      setStatus('Saved. Live site updates in a few seconds.');
    } catch (e) {
      setStatus('Save failed: ' + (e && e.message ? e.message : String(e)));
    }
  }

  async function loadHiddenFromFirestore() {
    const snap = await firebase.firestore().collection('config').doc('menu').get();
    const list = snap.exists ? snap.data().hidden || [] : [];
    hidden = new Set(Array.isArray(list) ? list : []);
    renderList();
  }

  function showPanel(user) {
    document.getElementById('admin-auth').hidden = true;
    document.getElementById('admin-panel').hidden = false;
    document.getElementById('admin-user-email').textContent = user.email || '';
  }

  function showAuth() {
    document.getElementById('admin-auth').hidden = false;
    document.getElementById('admin-panel').hidden = true;
  }

  document.getElementById('admin-login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!window.VY_FIREBASE_ACTIVE) {
      setAuthMsg('Add your Firebase config to firebase-config.js first.');
      return;
    }
    const fd = new FormData(e.target);
    const email = String(fd.get('email') || '').trim();
    const password = String(fd.get('password') || '');
    setAuthMsg('Signing in…');
    try {
      await firebase.auth().signInWithEmailAndPassword(email, password);
      setAuthMsg('');
    } catch (err) {
      setAuthMsg(err.message || 'Sign-in failed');
    }
  });

  document.getElementById('admin-sign-out').addEventListener('click', () => {
    firebase.auth().signOut();
  });

  function boot() {
    const firebaseOff = document.getElementById('admin-firebase-off');
    if (!window.VY_FIREBASE_ACTIVE) {
      if (firebaseOff) firebaseOff.hidden = false;
      document.getElementById('admin-auth').hidden = true;
      document.getElementById('admin-panel').hidden = true;
      return;
    }
    if (firebaseOff) firebaseOff.hidden = true;

    firebase.auth().onAuthStateChanged(async (user) => {
      if (user) {
        try {
          await loadHiddenFromFirestore();
          showPanel(user);
        } catch (err) {
          setAuthMsg('Could not load menu: ' + (err.message || String(err)));
          showAuth();
        }
      } else {
        showAuth();
        setAuthMsg('');
      }
    });
  }

  boot();
})();
