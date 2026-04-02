// ─── DRINK DATA ──────────────────────────────────────────────
const DRINKS = {
  matcha: [
    { id: 'ein', name: 'Signature Einspanner', desc: 'Matcha with pillowy cream top', emoji: '🍵', seasonal: false },
    { id: 'reg', name: 'Regular Matcha Latte', desc: 'Classic matcha with your choice of milk', emoji: '🍵', seasonal: false },
    { id: 'str', name: 'Strawberry Matcha', desc: 'Matcha layered with fresh strawberry', emoji: '🍓', seasonal: false },
    { id: 'jas', name: 'Jasmine Tea Matcha Cloud', desc: 'Jasmine milk tea with matcha cloud', emoji: '🌸', seasonal: false },
    { id: 'pan', name: 'Pandan Matcha', desc: 'Pandan infused matcha latte', emoji: '🌿', seasonal: false },
    { id: 'coc', name: 'Coconut Cloud', desc: 'Coconut water with matcha cream top', emoji: '🥥', seasonal: false },
    { id: 'map', name: 'Maple Matcha', desc: 'Matcha with pure maple syrup', emoji: '🍁', seasonal: false },
    { id: 'man', name: 'Mango Matcha', desc: 'Matcha layered with ripe mango', emoji: '🥭', seasonal: true },
    { id: 'ube', name: 'Ube Matcha', desc: 'Matcha latte with ube cold foam', emoji: '💜', seasonal: false },
  ],
  jasmine: [
    { id: 'jh', name: 'Honey Jasmine', desc: 'Jasmine green tea with wildflower honey', emoji: '🍯' },
    { id: 'jstr', name: 'Strawberry Jasmine', desc: 'Jasmine green tea with fresh strawberry', emoji: '🍓' },
    { id: 'jman', name: 'Mango Jasmine', desc: 'Jasmine green tea with fresh mango puree', emoji: '🥭' },
    { id: 'jpas', name: 'Passionfruit Jasmine', desc: 'Jasmine green tea with tangy passionfruit', emoji: '🧪' },
  ],
  other_tea: [
    { id: 'tt', name: 'Thai Tea', desc: 'Thai-spiced black tea, sweet & creamy', emoji: '🧡' },
    { id: 'tg', name: 'Thai Green Tea', desc: 'Thai green tea base, condensed milk', emoji: '🌿' },
  ]
};

const TOPPINGS = [
  { id: 'boba', label: 'Boba Pearls', icon: '⚫' },
  { id: 'lychee', label: 'Lychee Jelly', icon: '⚪' },
];

const MILK_OPTIONS = ['Oat', 'Soy', 'Whole'];
const ICE_LEVELS = ['Low', 'Regular', 'Extra'];
const SUGAR_LEVELS = ['No', 'Low', 'Regular', 'Extra'];

// ─── STATE ───────────────────────────────────────────────────
let cart = [];
let modal = { drink: null, sugar: 'Regular', toppings: [], milk: 'Oat', ice: 'Regular', qty: 1 };
let activeCategory = 'matcha';

// ─── DOM ─────────────────────────────────────────────────────
const grids = {
  matcha: document.getElementById('grid-matcha'),
  jasmine: document.getElementById('grid-jasmine'),
  other_tea: document.getElementById('grid-other-tea'),
};

const cartDrawer = document.getElementById('cart-drawer');
const cartOverlay = document.getElementById('cart-overlay');
const cartItems = document.getElementById('cart-items');
const cartCount = document.getElementById('cart-count');
const cartTotalEl = document.getElementById('cart-total-val');
const modalOverlay = document.getElementById('modal-overlay');
const sugarContainer = document.getElementById('sugar-container');
const toppingsContainer = document.getElementById('toppings-container');
const toppingsSection = document.getElementById('toppings-section');
const milkContainer = document.getElementById('milk-container');
const iceContainer = document.getElementById('ice-container');
const modalName = document.getElementById('modal-name');
const modalDesc = document.getElementById('modal-desc');
const modalIcon = document.getElementById('modal-icon');
const qtyNum = document.getElementById('qty-num');
const heroTitle = document.getElementById('hero-title');
const confirmOverlay = document.getElementById('confirm-overlay');
const toast = document.getElementById('toast');

// ─── RENDER DRINKS ───────────────────────────────────────────
const CUSTOM_IMAGES = {
  bs: './brown_sugar.png',
  ein: './matcha_einspanner.png',
  reg: './regular_matcha.png',
  str: './str_matcha.png',
  jas: './jasmine_matcha.png',
  pan: './pandan_matcha.png',
  map: './maple_matcha_transparent.png',
  jstr: './strawberry_jasmine.jpg',
  jman: './mango_jasmine.jpg',
  jpas: './passionfruit_jasmine.jpg',
  tt: './thai_tea.jpg',
  tg: './thai_green_tea.jpg',
  jh: './honey_jasmine.jpg',
  coc: './coconut_cloud.jpg',
  ube: './ube_matcha.jpg',
  man: './mango_matcha.jpg'
};


function getSVG(id, large) {
  if (CUSTOM_IMAGES[id]) {
    return `<img src="${CUSTOM_IMAGES[id]}" style="width:${large ? 100 : 72}px;height:${large ? 120 : 86}px;object-fit:contain; transform: scale(1.75); mix-blend-mode: multiply;" alt="Drink">`;
  }
  const svg = (typeof DRINK_SVGS !== 'undefined' && DRINK_SVGS[id]) || '';
  if (!svg) return `<div style="width:${large ? 100 : 72}px;height:${large ? 120 : 86}px;background:rgba(106,148,98,0.1);border-radius:12px;"></div>`;
  if (!large) {
    return svg.replace(/width="80"/, 'width="72"').replace(/height="96"/, 'height="86"');
  }
  return svg.replace(/width="80"/, 'width="100"').replace(/height="96"/, 'height="120"');
}

function renderDrinks() {
  Object.keys(DRINKS).forEach(cat => {
    const grid = grids[cat];
    if (!grid) return;
    grid.innerHTML = DRINKS[cat].map(d => `
      <div class="drink-card" data-id="${d.id}" data-cat="${cat}" tabindex="0" role="button" aria-label="Customize ${d.name}">
        <div class="card-svg">${getSVG(d.id, false)}</div>
        <div class="card-body">
          <div class="card-name">${d.name}${d.seasonal ? '<span class="tag-seasonal">Seasonal</span>' : ''}</div>
          <div class="card-desc">${d.desc}</div>
        </div>
        <div class="card-hint">Customize ✦</div>
      </div>`).join('');
    grid.querySelectorAll('.drink-card').forEach(card => {
      card.addEventListener('click', () => openModal(card.dataset.id, card.dataset.cat));
      card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') openModal(card.dataset.id, card.dataset.cat); });
    });
  });
}

// ─── TABS ────────────────────────────────────────────────────
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    activeCategory = btn.dataset.cat;
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.category-panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('panel-' + activeCategory).classList.add('active');

    // Update Hero Title
    if (activeCategory === 'matcha') {
      heroTitle.innerHTML = '<em>matcha</em> menu';
    } else {
      heroTitle.innerHTML = '<em>beyond</em> matcha';
    }
  });
});

// ─── MODAL ───────────────────────────────────────────────────
function openModal(id, cat) {
  const drink = DRINKS[cat].find(d => d.id === id);
  if (!drink) return;
  modal = { drink, cat, sugar: 'Regular', toppings: [], milk: 'Oat', ice: 'Regular', qty: 1, extraMatcha: false };

  modalName.textContent = drink.name;
  
  let extraDesc = '';
  if (['jas', 'pan'].includes(id)) {
    extraDesc = ' (automatically comes with oat milk)';
  }
  modalDesc.textContent = drink.desc + extraDesc;
  
  modalIcon.innerHTML = getSVG(drink.id, true);
  qtyNum.textContent = '1';

  renderSugar();
  renderToppings(cat);
  renderMilk();
  renderIce();
  renderExtraMatcha(cat);

  modalOverlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  modalOverlay.classList.remove('open');
  document.body.style.overflow = '';
}

document.getElementById('modal-close').addEventListener('click', closeModal);
modalOverlay.addEventListener('click', e => { if (e.target === modalOverlay) closeModal(); });

// Sugar
function renderSugar() {
  sugarContainer.innerHTML = SUGAR_LEVELS.map(s => `
    <button class="milk-opt${s === 'Regular' ? ' selected' : ''}" data-sugar="${s}">${s}</button>`).join('');
  sugarContainer.querySelectorAll('[data-sugar]').forEach(btn => {
    btn.addEventListener('click', () => {
      modal.sugar = btn.dataset.sugar;
      sugarContainer.querySelectorAll('[data-sugar]').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
    });
  });
}

// Toppings
function renderToppings(cat) {
  const isMatcha = cat === 'matcha';
  toppingsSection.style.display = isMatcha ? 'none' : '';

  if (isMatcha) return;

  toppingsContainer.innerHTML = TOPPINGS.map(t => `
    <button class="topping-chip" data-top="${t.id}" aria-pressed="false">
      <span>${t.icon}</span> ${t.label}
    </button>`).join('');
  toppingsContainer.querySelectorAll('.topping-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      const top = btn.dataset.top;
      if (modal.toppings.includes(top)) {
        modal.toppings = modal.toppings.filter(t => t !== top);
        btn.classList.remove('selected');
      } else {
        modal.toppings.push(top);
        btn.classList.add('selected');
      }
    });
  });
}

// Milk
const milkSection = document.getElementById('milk-section');

function renderMilk() {
  const isNoMilkOption = ['jstr', 'jman', 'jpas', 'jas', 'coc', 'pan', 'tt', 'tg'].includes(modal.drink.id);
  milkSection.style.display = isNoMilkOption ? 'none' : '';

  if (isNoMilkOption) return;

  milkContainer.innerHTML = MILK_OPTIONS.map(m => `
    <button class="milk-opt${m === 'Oat' ? ' selected' : ''}" data-milk="${m}">${m}</button>`).join('');
  milkContainer.querySelectorAll('.milk-opt').forEach(btn => {
    btn.addEventListener('click', () => {
      modal.milk = btn.dataset.milk;
      milkContainer.querySelectorAll('.milk-opt').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
    });
  });
}

// Ice Level
function renderIce() {
  iceContainer.innerHTML = ICE_LEVELS.map(lvl => `
    <button class="milk-opt${lvl === 'Regular' ? ' selected' : ''}" data-ice="${lvl}">${lvl}</button>`).join('');
  iceContainer.querySelectorAll('[data-ice]').forEach(btn => {
    btn.addEventListener('click', () => {
      modal.ice = btn.dataset.ice;
      iceContainer.querySelectorAll('[data-ice]').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
    });
  });
}

// Extra Matcha (matcha drinks only)
const extraMatchaSection = document.getElementById('extra-matcha-section');
const extraMatchaDivider = document.getElementById('extra-matcha-divider');
const extraMatchaBtn = document.getElementById('extra-matcha-btn');

function renderExtraMatcha(cat) {
  const isMatcha = cat === 'matcha';
  extraMatchaSection.style.display = isMatcha ? '' : 'none';
  extraMatchaDivider.style.display = isMatcha ? '' : 'none';
  // Reset toggle
  modal.extraMatcha = false;
  extraMatchaBtn.classList.remove('selected');
  extraMatchaBtn.setAttribute('aria-pressed', 'false');
}

extraMatchaBtn.addEventListener('click', () => {
  modal.extraMatcha = !modal.extraMatcha;
  extraMatchaBtn.classList.toggle('selected', modal.extraMatcha);
  extraMatchaBtn.setAttribute('aria-pressed', String(modal.extraMatcha));
});

document.getElementById('qty-minus').addEventListener('click', () => {
  if (modal.qty > 1) { modal.qty--; qtyNum.textContent = modal.qty; }
});
document.getElementById('qty-plus').addEventListener('click', () => {
  modal.qty++; qtyNum.textContent = modal.qty;
});

// Add to order
document.getElementById('add-to-order').addEventListener('click', () => {
  const { drink, cat, sugar, toppings, milk, ice, qty, extraMatcha } = modal;
  const tops = toppings.map(t => TOPPINGS.find(x => x.id === t));
  for (let i = 0; i < qty; i++) {
    cart.push({ id: Date.now() + i, drink, sugar, toppings: tops, milk, ice, extraMatcha });
  }
  closeModal();
  renderCart();
  showToast(`${drink.name} added!`);
});

// ─── CART ────────────────────────────────────────────────────
function renderCart() {
  const count = cart.length;
  cartCount.textContent = count;
  cartCount.classList.toggle('visible', count > 0);

  const orderNameSection = document.getElementById('cart-name-section');

  if (cart.length === 0) {
    cartItems.innerHTML = `<div class="cart-empty"><div class="empty-icon">🍃</div><p>Your order is empty</p></div>`;
    if (cartTotalEl) cartTotalEl.closest('.cart-total').style.display = 'none';
    if (orderNameSection) orderNameSection.style.display = 'none';
  } else {
    if (cartTotalEl) cartTotalEl.closest('.cart-total').style.display = 'flex';
    if (orderNameSection) orderNameSection.style.display = 'block';
    cartItems.innerHTML = cart.map(item => `
      <div class="cart-item" data-cart-id="${item.id}">
        <div class="cart-item-icon">${getSVG(item.drink.id, false)}</div>
        <div class="cart-item-info">
          <div class="cart-item-name">${item.drink.name}</div>
          <div class="cart-item-detail">
            Sugar: ${item.sugar} · Ice: ${item.ice} · Milk: ${item.milk}
            ${item.extraMatcha ? '<br>+ Extra Matcha (+1g)' : ''}
            ${item.toppings.length ? '<br>+ ' + item.toppings.map(t => t.label).join(', ') : ''}
          </div>
        </div>
        <button class="cart-item-remove" data-remove="${item.id}" aria-label="Remove">✕</button>
      </div>`).join('');
    cartItems.querySelectorAll('.cart-item-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        cart = cart.filter(c => c.id !== parseInt(btn.dataset.remove));
        renderCart();
      });
    });
  }
  document.getElementById('place-order-btn').disabled = cart.length === 0;
}

function openCart() {
  cartDrawer.classList.add('open');
  cartOverlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeCart() {
  cartDrawer.classList.remove('open');
  cartOverlay.classList.remove('open');
  document.body.style.overflow = '';
}

document.getElementById('cart-btn').addEventListener('click', openCart);
document.getElementById('cart-close').addEventListener('click', closeCart);
cartOverlay.addEventListener('click', closeCart);

document.getElementById('place-order-btn').addEventListener('click', () => {
  const nameInput = document.getElementById('order-name');
  const customerName = nameInput ? nameInput.value.trim() : 'Guest';

  if (!customerName) {
    showToast("Please enter your name!");
    nameInput.focus();
    return;
  }

  const orderData = [...cart];
  closeCart();
  confirmOverlay.classList.add('open');
  cart = [];
  if (nameInput) nameInput.value = ''; // Reset name
  renderCart();

  // Send email notification in the background
  sendEmailNotification(orderData, customerName);
});
document.getElementById('confirm-close').addEventListener('click', () => {
  confirmOverlay.classList.remove('open');
});

// ─── TOAST ───────────────────────────────────────────────────
let toastTimer;
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
}

// ─── INIT ────────────────────────────────────────────────────
renderDrinks();
renderCart();

// ─── EMAIL NOTIFICATIONS ─────────────────────────────────────
async function sendEmailNotification(orderItems, customerName = 'Guest') {
  if (!orderItems || orderItems.length === 0) return;

  const accessKey = '7668e711-744f-42c8-8e9c-d561620bb4c7';

  const placedAt = new Date();
  const whenStr = placedAt.toLocaleString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const total = orderItems.length;
  const bar = '─'.repeat(44);

  const orderSummary = orderItems
    .map((item, index) => {
      const n = index + 1;
      const title = item.drink.name.toUpperCase();
      const underline = '  ' + '─'.repeat(title.length);
      const lab = (label, value) => `      ${label.padEnd(11)} ·  ${value}`;
      const rows = [
        bar,
        `  DRINK ${n} OF ${total}`,
        bar,
        '',
        `  ${title}`,
        underline,
        '',
        lab('Sugar', item.sugar),
        lab('Ice', item.ice),
        lab('Milk', item.milk),
      ];
      if (item.extraMatcha) {
        rows.push(lab('Extra', '+1g matcha'));
      }
      if (item.toppings && item.toppings.length > 0) {
        rows.push(lab('Toppings', item.toppings.map((t) => t.label).join(', ')));
      }
      rows.push('');
      return rows.join('\n');
    })
    .join('\n');

  const messageBody = [
    "        🍵  NEW ORDER  ·  Vy's Matcha",
    '',
    '═'.repeat(44),
    '',
    `  For        ${customerName}`,
    `  Ordered    ${whenStr}`,
    `  Drinks     ${total}`,
    '',
    '═'.repeat(44),
    '',
    orderSummary.trimEnd(),
    '',
    bar,
    '',
  ].join('\n');

  const formData = {
    access_key: accessKey,
    subject: `🍵 Order · ${customerName} · ${total} drink${total === 1 ? '' : 's'}`,
    from_name: "Vy's Cafe Order System",
    message: messageBody,
  };

  try {
    const response = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(formData),
    });
    let result;
    try {
      result = await response.json();
    } catch {
      console.error('Order email: bad response from server', response.status);
      showToast("Order saved, but email couldn't be sent (bad response).");
      return;
    }
    if (result.success) {
      console.log('Order notification sent successfully.');
    } else {
      const detail = result.message || result.error || JSON.stringify(result);
      console.error('Email notification failed:', detail, result);
      showToast(
        "Order placed, but the email notice failed. Open the browser console (F12) for details, or check spam / Web3Forms settings."
      );
    }
  } catch (err) {
    console.error('Error sending email notification:', err);
    showToast("Order placed, but the email request failed (network or blocked).");
  }
}
