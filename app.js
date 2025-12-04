// ========= utils =========
const $  = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

const CART_KEY   = 'minhea_cart_v1';
const GIFT_KEY   = 'minhea_giftwrap_v1';
const GIFT_PRICE = 3.50;

let cart     = [];
let giftWrap = false; // estado del envoltorio

// ========= estado =========
function loadCart() {
  try {
    cart = JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch {
    cart = [];
  }

  try {
    giftWrap = JSON.parse(localStorage.getItem(GIFT_KEY)) || false;
  } catch {
    giftWrap = false;
  }
}

function saveCart() {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function saveGift() {
  localStorage.setItem(GIFT_KEY, JSON.stringify(giftWrap));
}

function money(n) {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR'
  }).format(n);
}

function count() {
  return cart.reduce((a, i) => a + (i.qty || 0), 0);
}

function subtotal() {
  return cart.reduce((a, i) => a + (i.qty || 1) * (i.price || 0), 0);
}

// ========= UI comunes =========
function updateBadge() {
  $$('.cart-count').forEach(el => (el.textContent = count()));
}

// solo se ejecuta en carrito.html (si existe .cart-list)
function renderCartPage() {
  const wrap = $('.cart-list');
  if (!wrap) return; // no estamos en la página del carrito

  // lista vacía
  wrap.innerHTML = cart.length
    ? ''
    : `
      <div class="empty">
        Tu carrito está vacío.
        <a href="minhea.html" class="empty-link">Descubrir piezas</a>
      </div>
    `;

  // pintar productos
  cart.forEach((it, idx) => {
    const row = document.createElement('article');
    row.className = 'cart-row';

    row.innerHTML = `
      <img src="${it.img || ''}" alt="">
      <div class="item-info">
        <h3>${it.name}</h3>
        <div class="muted">${money(it.price || 0)}</div>
        <div class="qty">
          <button class="qbtn" aria-label="menos">−</button>
          <span>${it.qty}</span>
          <button class="qbtn" aria-label="más">+</button>
        </div>
      </div>
      <div class="item-actions">
        <strong>${money((it.qty || 1) * (it.price || 0))}</strong>
        <button class="trash" title="Eliminar" aria-label="Eliminar">borrar</button>
      </div>
    `;

    const [minus, plus] = row.querySelectorAll('.qty .qbtn');
    const qtySpan       = row.querySelector('.qty span');
    const remove        = row.querySelector('.trash');

    minus.onclick = () => {
      cart[idx].qty = Math.max(1, (cart[idx].qty || 1) - 1);
      saveCart();
      refresh();
    };

    plus.onclick = () => {
      cart[idx].qty = (cart[idx].qty || 1) + 1;
      saveCart();
      refresh();
    };

    remove.onclick = () => {
      cart.splice(idx, 1);
      saveCart();
      refresh();
    };

    // por si algún día quieres actualizar solo la cantidad sin refrescar todo:
    // qtySpan.textContent = cart[idx].qty;

    wrap.appendChild(row);
  });

  // resumen + envoltorio
  const base   = subtotal();
  const envio  = base > 0 ? 0 : 0;        // si metes reglas de envío, las cambias aquí
  const extra  = giftWrap ? GIFT_PRICE : 0;
  const total  = base + envio + extra;

  const ss = $('.sum-sub');
  const se = $('.sum-env');
  const st = $('.sum-tot');

  if (ss) ss.textContent = money(base);
  if (se) se.textContent = money(envio);
  if (st) st.textContent = money(total);

  // checkbox "Añadir envoltorio de regalo" (primer .gift-line input)
  const giftChk = ($$('.gift-line input')[0] || null);

  if (giftChk) {
    // sincronizar estado guardado
    giftChk.checked = !!giftWrap;

    giftChk.onchange = () => {
      giftWrap = giftChk.checked;
      saveGift();

      const baseNow  = subtotal();
      const envioNow = baseNow > 0 ? 0 : 0;
      const extraNow = giftWrap ? GIFT_PRICE : 0;
      const newTotal = baseNow + envioNow + extraNow;

      if (st) st.textContent = money(newTotal);
    };
  }
}

// ========= refresco global =========
function refresh() {
  updateBadge();
  renderCartPage();
}

// ========= añadir desde tarjetas (todas las páginas) =========
function bindAddButtons() {
  document.addEventListener('click', e => {
    const btn  = e.target.closest('.add');
    if (!btn) return;

    const card = btn.closest('.product');
    if (!card) return;

    // datos del producto
    const priceNum = Number(
      (card.dataset.price || '')
        .toString()
        .replace(/[^\d.,]/g, '')
        .replace(',', '.')
    );

    const item = {
      id:    card.dataset.id   || Math.random().toString(36).slice(2),
      name:  card.dataset.name || 'Producto',
      price: isNaN(priceNum) ? 0 : priceNum,
      img:   card.dataset.img  || ''
    };

    // guardar en carrito (si ya existe, solo sube qty)
    const found = cart.find(i => i.id === item.id);
    if (found) {
      found.qty = (found.qty || 1) + 1;
    } else {
      cart.push({ ...item, qty: 1 });
    }

    saveCart();
    refresh();
  });
}

// ========= init =========
loadCart();
document.addEventListener('DOMContentLoaded', () => {
  refresh();
  bindAddButtons();
});
