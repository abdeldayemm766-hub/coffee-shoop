(() => {
  'use strict';
  document.documentElement.classList.add('js');

  const IMG = id => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=700&q=80`;
  const PRODUCTS = [
    { id: 1, name: 'Signature Espresso', price: 3.00, cat: 'coffee', img: IMG('1510707577719-ae7c14805e3a'), desc: 'A rich, syrupy double shot with notes of dark chocolate and toasted hazelnut.' },
    { id: 2, name: 'Caramel Latte', price: 4.50, cat: 'coffee', img: IMG('1461023058943-07fcbe16d735'), desc: 'Smooth espresso, steamed milk and house-made caramel.' },
    { id: 3, name: 'Iced Spanish Latte', price: 5.00, cat: 'iced', img: IMG('1517701604599-bb29b565090c'), desc: 'Espresso over ice with sweetened condensed milk for a creamy finish.' },
    { id: 4, name: 'Vanilla Cold Brew', price: 4.75, cat: 'iced', img: IMG('1461023058943-07fcbe16d735'), desc: 'Slow-steeped for 18 hours, lightly sweetened with real vanilla.' },
    { id: 5, name: 'Classic Cappuccino', price: 4.00, cat: 'coffee', img: IMG('1572442388796-11668a67e53d'), desc: 'Equal parts espresso, steamed milk and velvety foam.' },
    { id: 6, name: 'Mocha Delight', price: 4.50, cat: 'coffee', img: IMG('1578314675249-a6910f80cc4e'), desc: 'Espresso blended with dark cocoa and steamed milk.' }
  ];
  const FALLBACK = 'data:image/svg+xml;utf8,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><rect width="400" height="300" fill="#eadfcc"/><path d="M140 110h110v70a40 40 0 01-40 40h-30a40 40 0 01-40-40zM250 130h20a20 20 0 010 40h-20" fill="none" stroke="#b9772f" stroke-width="10"/></svg>');

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const money = n => '$' + n.toFixed(2);
  const KEY = 'brewbean-cart';

  /* ---------- Cart state ---------- */
  let cart = [];
  try { cart = JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { cart = []; }
  cart = cart.filter(i => PRODUCTS.some(p => p.id === i.id) && i.qty > 0);
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(cart)); } catch (e) { /* storage unavailable */ } };
  const find = id => PRODUCTS.find(p => p.id === id);

  function changeQty(id, delta) {
    const item = cart.find(i => i.id === id);
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) cart = cart.filter(i => i.id !== id);
    update();
  }

  function addToCart(id) {
    const item = cart.find(i => i.id === id);
    item ? item.qty++ : cart.push({ id, qty: 1 });
    update();
    toast(`${find(id).name} added to cart`);
  }

  function update() {
    save();
    const count = cart.reduce((n, i) => n + i.qty, 0);
    const total = cart.reduce((n, i) => n + i.qty * find(i.id).price, 0);
    $('#cartCount').textContent = count;
    $('#cartOpen').setAttribute('aria-label', `Open cart, ${count} item${count === 1 ? '' : 's'}`);
    $('#subtotal').textContent = money(total);
    $('#checkout').disabled = !count;
    $('#checkoutMsg').textContent = '';
    $('#cartItems').innerHTML = count ? cart.map(i => {
      const p = find(i.id);
      return `<div class="line"><img src="${p.img}" alt="${p.name}">
        <div><b>${p.name}</b><small>${money(p.price)} each</small>
        <div class="qty"><button data-act="dec" data-id="${p.id}" aria-label="Decrease ${p.name} quantity">−</button>
        <span aria-live="polite">${i.qty}</span>
        <button data-act="inc" data-id="${p.id}" aria-label="Increase ${p.name} quantity">+</button></div></div>
        <div><b>${money(p.price * i.qty)}</b><br><button class="rm" data-act="rm" data-id="${p.id}" aria-label="Remove ${p.name}">Remove</button></div></div>`;
    }).join('') : `<div class="empty"><h3>Your cart is empty</h3><p>Add a drink from the menu to get started.</p><a href="#menu" class="btn btn-solid" data-close>Browse the menu</a></div>`;
  }

  /* ---------- Drawer ---------- */
  const drawer = $('#drawer'), overlay = $('#overlay');
  let lastFocus;
  function openCart() {
    lastFocus = document.activeElement;
    drawer.classList.add('open'); drawer.setAttribute('aria-hidden', 'false');
    overlay.hidden = false; $('#cartClose').focus();
  }
  function closeCart() {
    drawer.classList.remove('open'); drawer.setAttribute('aria-hidden', 'true');
    overlay.hidden = true; lastFocus && lastFocus.focus();
  }
  $('#cartOpen').onclick = openCart;
  $('#cartClose').onclick = closeCart;
  overlay.onclick = closeCart;
  $('#checkout').onclick = () => {
    $('#checkoutMsg').textContent = 'Checkout is a demo placeholder. No payment is taken and no order is placed.';
  };
  $('#cartItems').addEventListener('click', e => {
    if (e.target.closest('[data-close]')) return closeCart();
    const b = e.target.closest('button[data-act]');
    if (!b) return;
    const id = +b.dataset.id;
    if (b.dataset.act === 'inc') changeQty(id, 1);
    else if (b.dataset.act === 'dec') changeQty(id, -1);
    else changeQty(id, -Infinity);
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { if (drawer.classList.contains('open')) closeCart(); closeNav(); }
    if (e.key === 'Tab' && drawer.classList.contains('open')) { // keep focus inside drawer
      const f = $$('button:not([disabled]),a[href]', drawer);
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  /* ---------- Toast ---------- */
  let tt;
  function toast(msg) {
    const t = $('#toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(tt); tt = setTimeout(() => t.classList.remove('show'), 1800);
  }

  /* ---------- Menu ---------- */
  function renderMenu(filter = 'all') {
    $('#menuGrid').innerHTML = PRODUCTS.filter(p => filter === 'all' || p.cat === filter).map(p => `
      <article class="card product">
        <div class="ph"><img src="${p.img}" alt="${p.name}" loading="lazy"></div>
        <div class="body"><h3>${p.name}</h3><p>${p.desc}</p>
        <div class="buy"><span class="price">${money(p.price)}</span>
        <button class="btn btn-solid add" data-add="${p.id}" aria-label="Add ${p.name} to cart">Add to Cart</button></div></div>
      </article>`).join('');
  }
  $('.filters').addEventListener('click', e => {
    const c = e.target.closest('.chip'); if (!c) return;
    $$('.chip').forEach(x => { x.classList.toggle('active', x === c); x.setAttribute('aria-pressed', x === c); });
    renderMenu(c.dataset.filter);
  });
  $('#menuGrid').addEventListener('click', e => {
    const b = e.target.closest('[data-add]'); if (!b) return;
    addToCart(+b.dataset.add);
    b.textContent = 'Added ✓'; b.classList.add('done');
    setTimeout(() => { b.textContent = 'Add to Cart'; b.classList.remove('done'); }, 1200);
  });

  /* ---------- Nav ---------- */
  const nav = $('#nav'), burger = $('#burger'), menuNav = $('#menuNav');
  const onScroll = () => nav.classList.toggle('scrolled', scrollY > 40);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  function closeNav() { menuNav.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); }
  burger.onclick = () => burger.setAttribute('aria-expanded', menuNav.classList.toggle('open'));
  $$('a[href^="#"]', menuNav).forEach(a => a.addEventListener('click', closeNav));

  const links = $$('nav#menuNav a');
  const spy = new IntersectionObserver(es => es.forEach(en => {
    if (en.isIntersecting) links.forEach(l => l.classList.toggle('on', l.getAttribute('href') === '#' + en.target.id));
  }), { rootMargin: '-45% 0px -50% 0px' });
  ['home', 'menu', 'about', 'gallery', 'contact'].forEach(id => spy.observe($('#' + id)));

  /* ---------- Scroll reveal ---------- */
  const io = new IntersectionObserver(es => es.forEach(en => {
    if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
  }), { threshold: .12 });
  const observeReveals = () => $$('.reveal:not(.in)').forEach(el => io.observe(el));

  /* ---------- Contact form ---------- */
  const form = $('#contactForm');
  const rules = {
    name: v => v.trim().length >= 2 ? '' : 'Enter your name (at least 2 characters).',
    email: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? '' : 'Enter a valid email, like name@example.com.',
    message: v => v.trim().length >= 10 ? '' : 'Write a message of at least 10 characters.'
  };
  function check(f) {
    const msg = rules[f.name](f.value);
    $('#' + f.name + 'Err').textContent = msg;
    f.setAttribute('aria-invalid', !!msg);
    f.setAttribute('aria-describedby', f.name + 'Err');
    return !msg;
  }
  Object.keys(rules).forEach(n => form[n].addEventListener('blur', () => check(form[n])));
  form.addEventListener('submit', e => {
    e.preventDefault();
    const status = $('#formStatus');
    const bad = Object.keys(rules).filter(n => !check(form[n]));
    status.classList.remove('ok');
    if (bad.length) { status.textContent = 'Please fix the highlighted fields.'; form[bad[0]].focus(); return; }
    status.classList.add('ok');
    status.textContent = 'Your message looks good. This demo site has no server, so nothing was sent.';
    form.reset();
  });

  /* ---------- Image fallback ---------- */
  document.addEventListener('error', e => {
    const t = e.target;
    if (t.tagName === 'IMG' && t.src !== FALLBACK) t.src = FALLBACK;
  }, true);

  /* ---------- Init ---------- */
  $('#year').textContent = new Date().getFullYear();
  renderMenu(); update(); observeReveals();
})();
