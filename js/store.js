/* ============================================================
   دار الأُمراء — DAR AL-UMARA  |  js/store.js
   طبقة الحالة والتخزين المحلي: السلة، المفضلة، الطلبات، الحساب،
   النقاط، الكوبونات، التقييمات، العناوين، البحث، التوصيات.
   تعتمد على data.js فقط. تُطلق أحداثًا عبر Store.on() واجهةً موحّدة.
   ============================================================ */
(function () {
  'use strict';

  /* ---------- التخزين الآمن (مع بديل في الذاكرة عند حجب localStorage) ---------- */
  const LS = (function () {
    try {
      const k = '__umara_probe__';
      window.localStorage.setItem(k, '1');
      window.localStorage.removeItem(k);
      return window.localStorage;
    } catch (e) {
      const mem = {};
      return {
        getItem: k => (k in mem ? mem[k] : null),
        setItem: (k, v) => { mem[k] = String(v); },
        removeItem: k => { delete mem[k]; }
      };
    }
  })();

  const KEYS = {
    cart: 'umara_cart', cartExtras: 'umara_cart_extras', wish: 'umara_wishlist',
    notify: 'umara_notify', orders: 'umara_orders', orderStatus: 'umara_order_status',
    reviews: 'umara_reviews', account: 'umara_account', recent: 'umara_recent',
    points: 'umara_points', personalCoupons: 'umara_personal_coupons',
    coupons: 'umara_coupons', products: 'umara_products', settings: 'umara_settings',
    offers: 'umara_offer_start', addresses: 'umara_addresses', prefs: 'umara_prefs',
    newsletter: 'umara_newsletter', invited: 'umara_invited'
  };

  const SANITY_PROJECT_ID = 'xvmhw7dr';
  const SANITY_DATASET = 'production';
  const SANITY_API_VERSION = '2025-02-19';
  const SANITY_PRODUCTS_QUERY = `*[_type == "product"] | order(_createdAt desc) {
    _id, _createdAt, legacyId, name, nameEn, "slug": slug.current,
    brand->{legacyId, name, nameEn, "slug": slug.current, accentColor},
    shortDescription, description, fragranceNotes, concentration, strength,
    longevity, sillage, price, oldPrice, currency, sizes, stock, saleEndsAt,
    "mainImage": mainImage{alt, "url": asset->url},
    "gallery": gallery[]{alt, "url": asset->url},
    "categories": categories[]->{legacyId, "slug": slug.current},
    gender, families, occasions, seasons, badges, isNew, bestsellerRank,
    "recommended": recommended[]->{legacyId, _id},
    "coPurchase": coPurchase[]->{legacyId, _id}
  }`;

  const listeners = {};
  function on(evt, fn) { (listeners[evt] = listeners[evt] || []).push(fn); }
  function emit(evt, data) {
    (listeners[evt] || []).forEach(fn => { try { fn(data); } catch (e) { console.error('[store]', evt, e); } });
  }
  function read(key, fallback) {
    try { const v = LS.getItem(key); return v ? JSON.parse(v) : (fallback === undefined ? null : fallback); }
    catch (e) { return fallback === undefined ? null : fallback; }
  }
  function write(key, val) {
    try { LS.setItem(key, JSON.stringify(val)); }
    catch (e) { console.warn('[store] تعذّر الحفظ محليًا:', key, e); return false; }
    return true;
  }

  /* ---------- أدوات عامة ---------- */
  const AR_DIAC = /[\u064B-\u0652\u0640\u0670]/g;
  function norm(s) {
    return String(s == null ? '' : s).toLowerCase()
      .replace(AR_DIAC, '')
      .replace(/[أإآٱ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي')
      .replace(/\s+/g, ' ').trim();
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => (
      { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    ));
  }
  function fmt(n) {
    const d = STORE_CONFIG.currency.decimals;
    const s = Number(n || 0).toFixed(d);
    const parts = s.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
  }
  function price(n) { return fmt(n) + ' ' + STORE_CONFIG.currency.symbol; }
  function uid(prefix) {
    return (prefix || '') + Date.now().toString(36).toUpperCase() +
      Math.floor(Math.random() * 46656).toString(36).toUpperCase().padStart(3, '0');
  }
  function debounce(fn, ms) {
    let t; return function () { const a = arguments, c = this; clearTimeout(t); t = setTimeout(() => fn.apply(c, a), ms); };
  }
  function addDays(dateStr, n) {
    const d = new Date(dateStr + 'T12:00:00'); d.setDate(d.getDate() + n);
    return d.toISOString().slice(0, 10);
  }
  function today() { return new Date().toISOString().slice(0, 10); }

  function downscaleImage(file, maxSide, quality) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => {
        const img = new Image();
        img.onload = () => {
          const scale = Math.min(1, (maxSide || 640) / Math.max(img.width, img.height));
          const c = document.createElement('canvas');
          c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale);
          c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
          resolve(c.toDataURL('image/jpeg', quality || 0.72));
        };
        img.onerror = reject; img.src = e.target.result;
      };
      reader.onerror = reject; reader.readAsDataURL(file);
    });
  }

  /* ---------- المنتجات ---------- */
  let catalogue = PRODUCTS.slice();
  let catalogueStatus = 'loading';
  let catalogueError = null;
  let catalogueReady = Promise.resolve(catalogue);

  function products() {
    return catalogue;
  }
  function saveProducts(list) { catalogue = list; emit('products', list); }
  function legacyRefId(ref) { return ref && (ref.legacyId || ref._id) || null; }
  function portableTextText(blocks) {
    return (blocks || []).map(block => (block.children || []).map(child => child.text || '').join('')).filter(Boolean).join('\n');
  }
  function mapSanityProduct(doc) {
    const legacy = PRODUCTS.find(p => p.id === doc.legacyId);
    const brand = doc.brand;
    const brandId = brand ? (brand.legacyId || brand.slug || brand._id) : (legacy && legacy.brand) || 'unknown';
    if (brand && brandId) {
      BRANDS[brandId] = {
        ar: brand.name || '',
        en: brand.nameEn || '',
        accent: brand.accentColor || '#CBAA6C',
        desc: ''
      };
    }
    const description = portableTextText(doc.description);
    const categories = (doc.categories || []).map(category => category && (category.legacyId || category.slug)).filter(Boolean);
    const images = [];
    if (doc.mainImage && doc.mainImage.url) images.push({ url: doc.mainImage.url + '?w=1000&auto=format', alt: doc.mainImage.alt || doc.name || '' });
    (doc.gallery || []).forEach(image => {
      if (image && image.url) images.push({ url: image.url + '?w=1000&auto=format', alt: image.alt || doc.name || '' });
    });
    const saleHours = doc.saleEndsAt ? Math.max(0, Math.ceil((Date.parse(doc.saleEndsAt) - Date.now()) / 3600000)) : null;
    return Object.assign({}, legacy || {}, {
      id: doc.legacyId || doc._id,
      slug: doc.slug || (legacy && legacy.slug) || doc._id,
      name_ar: doc.name || '',
      name_en: doc.nameEn || '',
      brand: brandId,
      price: Number(doc.price) || 0,
      oldPrice: typeof doc.oldPrice === 'number' ? doc.oldPrice : null,
      currency: doc.currency || 'KWD',
      badges: Array.isArray(doc.badges) ? doc.badges : [],
      rating: legacy ? legacy.rating : 0,
      reviewsCount: legacy ? legacy.reviewsCount : 0,
      tags: {
        families: Array.isArray(doc.families) ? doc.families : [],
        gender: Array.isArray(doc.gender) ? doc.gender : [],
        occasions: Array.isArray(doc.occasions) ? doc.occasions : [],
        seasons: Array.isArray(doc.seasons) ? doc.seasons : [],
        strength: typeof doc.strength === 'number' ? doc.strength : (legacy && legacy.tags.strength) || 3
      },
      notes: {
        top: (doc.fragranceNotes && doc.fragranceNotes.top) || [],
        middle: (doc.fragranceNotes && doc.fragranceNotes.middle) || [],
        base: (doc.fragranceNotes && doc.fragranceNotes.base) || []
      },
      concentration: doc.concentration || 'EDP',
      sizes: Array.isArray(doc.sizes) ? doc.sizes : [],
      stock: typeof doc.stock === 'number' ? doc.stock : 0,
      images: images.length ? images : (legacy && legacy.images) || [{ art: 'bottle' }],
      recommended: (doc.recommended || []).map(legacyRefId).filter(Boolean),
      coPurchase: (doc.coPurchase || []).map(legacyRefId).filter(Boolean),
      categories: categories,
      longevity: typeof doc.longevity === 'number' ? doc.longevity : (legacy && legacy.longevity) || 0,
      sillage: typeof doc.sillage === 'number' ? doc.sillage : (legacy && legacy.sillage) || 0,
      isNew: Boolean(doc.isNew),
      bestsellerRank: typeof doc.bestsellerRank === 'number' ? doc.bestsellerRank : null,
      saleHours: saleHours,
      short_ar: doc.shortDescription || description,
      description_ar: description,
      createdAt: doc._createdAt ? doc._createdAt.slice(0, 10) : ''
    });
  }
  function showCatalogMessage(message, type) {
    console[type === 'error' ? 'error' : 'warn']('[Sanity] ' + message);
    if (window.UI && typeof window.UI.toast === 'function') window.UI.toast(message, type || 'info', 6000);
  }
  function loadSanityProducts() {
    if (typeof fetch !== 'function') {
      catalogueStatus = 'loaded';
      return Promise.resolve(catalogue);
    }
    const endpoint = 'https://' + SANITY_PROJECT_ID + '.apicdn.sanity.io/v' + SANITY_API_VERSION +
      '/data/query/' + encodeURIComponent(SANITY_DATASET) + '?query=' + encodeURIComponent(SANITY_PRODUCTS_QUERY);
    return fetch(endpoint, { headers: { Accept: 'application/json' } })
      .then(response => {
        if (!response.ok) throw new Error('HTTP ' + response.status);
        return response.json();
      })
      .then(payload => {
        if (!payload || !Array.isArray(payload.result)) throw new Error('صيغة استجابة Sanity غير صحيحة');
        catalogue = payload.result.map(mapSanityProduct);
        catalogueStatus = 'loaded';
        catalogueError = null;
        emit('products', catalogue);
        if (!catalogue.length) showCatalogMessage('لا توجد منتجات منشورة في Sanity حتى الآن.', 'info');
        return catalogue;
      })
      .catch(error => {
        catalogueStatus = 'error';
        catalogueError = error;
        showCatalogMessage('تعذّر تحميل المنتجات من Sanity. يُعرض الكتالوج التجريبي مؤقتًا؛ تحقق من اتصال الموقع وإعدادات CORS في Sanity.', 'error');
        return catalogue;
      });
  }
  function byId(id) { return products().find(p => p.id === id) || null; }
  function bySlug(slug) { return products().find(p => p.slug === slug) || null; }
  function sizeOf(p, ml) { if (!p || !p.sizes || !p.sizes.length) return null; return p.sizes.find(s => s.ml === ml) || p.sizes[0]; }
  function sizeLabel(s) { if (!s) return ''; return s.label || (s.ml + ' مل'); }
  function discountPct(p) { if (!p || !p.oldPrice || p.oldPrice <= p.price) return 0; return Math.round((1 - p.price / p.oldPrice) * 100); }

  /* ---------- الإعدادات (قابلة للتعديل من لوحة التحكم) ---------- */
  function settings() {
    const o = read(KEYS.settings, {}) || {};
    return {
      freeShippingThreshold: o.freeShippingThreshold != null ? o.freeShippingThreshold : STORE_CONFIG.freeShippingThreshold,
      whatsapp: o.whatsapp || STORE_CONFIG.whatsapp,
      standardFee: o.standardFee != null ? o.standardFee : STORE_CONFIG.shippingMethods[0].fee,
      expressFee: o.expressFee != null ? o.expressFee : STORE_CONFIG.shippingMethods[1].fee,
      packagingFee: o.packagingFee != null ? o.packagingFee : STORE_CONFIG.packaging.fee
    };
  }
  function saveSettings(o) { write(KEYS.settings, o); emit('settings', o); }

  /* ---------- السلة ---------- */
  function cart() { return read(KEYS.cart, []); }
  function saveCart(c) { write(KEYS.cart, c); emit('cart', c); }
  /* أقصى كمية قابلة للإضافة = المخزون المتاح (مع سقف 99). منتج بلا حقل stock
     يُعامل كمخزون غير محدود في النسخة التجريبية. */
  function maxAddQty(pid) {
    const p = byId(pid);
    const stock = p && typeof p.stock === 'number' ? p.stock : 99;
    return Math.max(0, Math.min(99, stock));
  }
  function addToCart(pid, size, qty) {
    qty = qty || 1;
    const cap = maxAddQty(pid);
    if (cap <= 0) return itemCount();           /* نفد المخزون — لا تُضف */
    const c = cart();
    const item = c.find(x => x.pid === pid && x.size === size);
    if (item) item.qty = Math.min(cap, item.qty + qty);
    else c.push({ pid: pid, size: size, qty: Math.min(cap, qty) });
    saveCart(c);
    return itemCount();
  }
  function setQty(pid, size, qty) {
    const cap = maxAddQty(pid);
    saveCart(cart().map(x => (x.pid === pid && x.size === size)
      ? { pid: x.pid, size: x.size, qty: Math.max(1, Math.min(cap, qty || 1)) } : x));
  }
  function removeFromCart(pid, size) { saveCart(cart().filter(x => !(x.pid === pid && x.size === size))); }
  function clearCart() { saveCart([]); }
  function itemCount() { return cart().reduce((n, x) => n + x.qty, 0); }
  function cartExtras() { return read(KEYS.cartExtras, { packaging: false, gift: '' }); }
  function setCartExtras(o) { write(KEYS.cartExtras, Object.assign(cartExtras(), o)); emit('cartExtras'); }

  /* ---------- الكوبونات ---------- */
  function coupons() { const c = read(KEYS.coupons, null); return (c && c.length) ? c : COUPONS; }
  function saveCoupons(list) { write(KEYS.coupons, list); emit('coupons', list); }
  function personalCoupons() { return read(KEYS.personalCoupons, []); }
  function findCoupon(code) {
    const q = String(code || '').trim().toUpperCase();
    if (!q) return null;
    return coupons().concat(personalCoupons()).find(c => String(c.code).toUpperCase() === q && c.active !== false) || null;
  }
  function validateCoupon(code, subtotal, phone) {
    const c = findCoupon(code);
    if (!c) return { ok: false, msg: 'كود الخصم غير صحيح أو منتهي الصلاحية' };
    if (subtotal < (c.min || 0)) return { ok: false, msg: 'الحد الأدنى لتفعيل الكود ' + price(c.min) };
    if (c.firstOrder) {
      const prev = allOrders().filter(o => o.phone === phone && o.status !== 'cancelled');
      if (prev.length) return { ok: false, msg: 'هذا الكود مخصص للعميل الجديد فقط' };
    }
    return { ok: true, coupon: c };
  }
  function couponAmount(c, subtotal) {
    if (!c) return { discount: 0, freeShip: false };
    if (c.type === 'percent') return { discount: subtotal * c.value / 100, freeShip: false };
    if (c.type === 'fixed') return { discount: Math.min(c.value, subtotal), freeShip: false };
    if (c.type === 'shipping') return { discount: 0, freeShip: true };
    return { discount: 0, freeShip: false };
  }

  /* ---------- الحسابات ---------- */
  function totals(opts) {
    opts = opts || {};
    const s = settings();
    const items = cart().map(x => {
      const p = byId(x.pid); const so = sizeOf(p, x.size);
      return p && so ? { pid: x.pid, size: x.size, qty: x.qty, product: p, sizeObj: so, line: so.price * x.qty } : null;
    }).filter(Boolean);
    const subtotal = items.reduce((n, x) => n + x.line, 0);
    const coupon = opts.coupon ? findCoupon(opts.coupon) : null;
    const cm = couponAmount(coupon, subtotal);
    let shipping = 0;
    if (opts.shippingMethod) {
      shipping = opts.shippingMethod === 'express' ? s.expressFee : s.standardFee;
      if (opts.shippingMethod !== 'express' && subtotal - cm.discount >= s.freeShippingThreshold) shipping = 0;
      if (cm.freeShip) shipping = 0;
    }
    const packaging = opts.packaging ? s.packagingFee : 0;
    const discount = cm.discount;
    const total = Math.max(0, subtotal - discount + shipping + packaging);
    return {
      items: items, subtotal: subtotal, discount: discount, coupon: coupon,
      shipping: shipping, packaging: packaging, total: total,
      freeShipApplied: opts.shippingMethod ? shipping === 0 : false,
      remainingForFree: Math.max(0, s.freeShippingThreshold - (subtotal - discount))
    };
  }

  /* ---------- المفضلة ---------- */
  function wishlist() { return read(KEYS.wish, []); }
  function inWish(pid) { return wishlist().some(w => w.pid === pid); }
  function toggleWish(pid) {
    let w = wishlist(); const i = w.find(x => x.pid === pid); let added;
    if (i) { w = w.filter(x => x.pid !== pid); added = false; }
    else { const p = byId(pid); w.push({ pid: pid, at: today(), priceAt: p ? p.price : 0 }); added = true; }
    write(KEYS.wish, w); emit('wish', w);
    return added;
  }
  function removeWish(pid) { write(KEYS.wish, wishlist().filter(w => w.pid !== pid)); emit('wish'); }
  function wishMove(pid, size, qty) {
    const p = byId(pid); if (!p) return;
    addToCart(pid, size || p.sizes[0].ml, qty || 1);
    removeWish(pid);
  }
  function wishPriceDrop(w) {
    const p = byId(w.pid); if (!p || !w.priceAt) return false;
    return p.price < w.priceAt;
  }

  /* ---------- إشعارات التوفر ---------- */
  function notifyList() { return read(KEYS.notify, []); }
  function toggleNotify(pid) {
    let l = notifyList(); const has = l.includes(pid);
    l = has ? l.filter(x => x !== pid) : l.concat(pid);
    write(KEYS.notify, l); emit('notify', l);
    return !has;
  }
  function isNotified(pid) { return notifyList().includes(pid); }

  /* ---------- الطلبات ---------- */
  function userOrders() { return read(KEYS.orders, []); }
  function orderStatusOverride() { return read(KEYS.orderStatus, {}); }
  function allOrders() {
    const o = orderStatusOverride();
    return userOrders().concat(SEED_ORDERS)
      .map(x => o[x.id] ? Object.assign({}, x, { status: o[x.id] }) : x)
      .sort((a, b) => String(b.date).localeCompare(String(a.date)));
  }
  function ordersFor(phone) { return allOrders().filter(x => x.phone === phone); }
  function orderById(id) { return allOrders().find(x => x.id === id) || null; }
  function placeOrder(order) {
    const list = userOrders();
    const nums = allOrders().map(o => parseInt(String(o.id).replace(/\D/g, ''), 10)).filter(n => !isNaN(n));
    const next = (nums.length ? Math.max.apply(null, nums) : 100254) + 1;
    order.id = 'ORD-' + next;
    order.date = today();
    order.status = 'new';
    list.push(order);
    write(KEYS.orders, list);
    emit('orders', list);
    return order.id;
  }
  function setOrderStatus(id, st) {
    const seed = SEED_ORDERS.some(o => o.id === id);
    if (seed) {
      const o = orderStatusOverride(); o[id] = st; write(KEYS.orderStatus, o);
    } else {
      write(KEYS.orders, userOrders().map(x => x.id === id ? Object.assign({}, x, { status: st }) : x));
    }
    emit('orders'); emit('orderStatus', { id: id, status: st });
  }
  function orderTimeline(o) {
    if (o.status === 'cancelled' || o.status === 'returned') {
      return [
        { ar: 'تم استلام الطلب', date: o.date, done: true },
        { ar: DICT.statuses[o.status], date: addDays(o.date, 2), done: true, final: true }
      ];
    }
    const seq = [
      { st: 'new', ar: 'تم استلام الطلب' },
      { st: 'processing', ar: 'قيد التجهيز والتحضير' },
      { st: 'shipped', ar: 'في الطريق إليك' },
      { st: 'delivered', ar: 'تم التسليم بنجاح' }
    ];
    const idx = Math.max(0, seq.findIndex(x => x.st === o.status));
    return seq.map((x, i) => ({ ar: x.ar, date: addDays(o.date, i), done: i <= idx, current: i === idx }));
  }
  function orderPoints(o) { return Math.floor((o.total || 0) * STORE_CONFIG.loyalty.perKwd); }

  /* ---------- التقييمات ---------- */
  function userReviews() { return read(KEYS.reviews, {}); }
  function reviewsFor(pid) {
    const usr = userReviews()[pid] || [];
    const seed = SEED_REVIEWS[pid] || [];
    return usr.concat(seed);
  }
  function statsFor(p) {
    const list = reviewsFor(p.id);
    const sum = list.reduce((s, r) => s + (r.rating || 0), 0);
    const baseC = p.reviewsCount || 0;
    const combined = baseC + list.length ? ((p.rating || 4.5) * baseC + sum) / (baseC + list.length) : 0;
    const dist = [0, 0, 0, 0, 0];
    list.forEach(r => { dist[5 - Math.round(r.rating)] = (dist[5 - Math.round(r.rating)] || 0) + 1; });
    const rec = list.length ? Math.round(list.filter(r => r.recommend !== false).length / list.length * 100) : 96;
    return {
      rating: Math.round(combined * 10) / 10, count: baseC + list.length,
      list: list, dist: dist, recommendPct: rec,
      longevityAvg: list.length ? Math.round(list.reduce((s, r) => s + (r.longevity || 4), 0) / list.length * 10) / 10 : null,
      sillageAvg: list.length ? Math.round(list.reduce((s, r) => s + (r.sillage || 4), 0) / list.length * 10) / 10 : null
    };
  }
  function addReview(pid, rev) {
    const all = userReviews();
    (all[pid] = all[pid] || []).unshift(Object.assign({ uid: uid('rv'), date: today(), helpful: 0, verified: true }, rev));
    write(KEYS.reviews, all);
    emit('reviews', { pid: pid });
  }
  function markHelpful(pid, uid) {
    const all = userReviews(); const list = all[pid] || [];
    const r = list.find(x => x.uid === uid); if (r) { r.helpful = (r.helpful || 0) + 1; write(KEYS.reviews, all); emit('reviews', { pid: pid }); }
  }

  /* ---------- الحساب ---------- */
  function account() { return read(KEYS.account, null); }
  function ledger() { return read(KEYS.points, []); }
  function pointsBalance() { return ledger().reduce((s, e) => s + e.pts, 0); }
  function addPoints(reason, pts) {
    const l = ledger(); l.unshift({ d: today(), reason: reason, pts: pts });
    write(KEYS.points, l); emit('points');
  }
  function seedLedgerFor(phone) {
    if (phone === '0955500001') {
      const entries = [
        { d: '2026-02-01', reason: 'مكافأة الانضمام لنادي العطور', pts: STORE_CONFIG.loyalty.signup }
      ];
      SEED_ORDERS.filter(o => o.phone === phone && ['delivered', 'shipped', 'processing'].includes(o.status))
        .forEach(o => entries.push({ d: o.date, reason: 'شراء — الطلب ' + o.id, pts: Math.floor((o.total || 0) * STORE_CONFIG.loyalty.perKwd) }));
      entries.push({ d: '2026-09-12', reason: 'كتابة تقييم', pts: STORE_CONFIG.loyalty.review });
      write(KEYS.points, entries.sort((a, b) => b.d.localeCompare(a.d)));
    } else {
      write(KEYS.points, [{ d: today(), reason: 'مكافأة الانضمام لنادي العطور', pts: STORE_CONFIG.loyalty.signup }]);
    }
  }
  function login(phone, name, email) {
    const cur = account();
    if (cur && cur.phone === phone) return cur;
    const acc = { phone: phone, name: name || (phone === '0955500001' ? 'عبدالله العتيبي' : 'عميل دار الأُمراء'), email: email || '', joined: today() };
    write(KEYS.account, acc);
    seedLedgerFor(phone);
    emit('account', acc);
    return acc;
  }
  function logout() { write(KEYS.account, null); emit('account', null); }
  function updateAccount(patch) {
    const acc = account(); if (!acc) return null;
    const next = Object.assign(acc, patch); write(KEYS.account, next); emit('account', next); return next;
  }
  function redeemReward(rw) {
    if (!account()) return { ok: false, msg: 'سجّل الدخول أولًا لاستبدال النقاط' };
    if (pointsBalance() < rw.pts) return { ok: false, msg: 'رصيد النقاط غير كافٍ بعد' };
    addPoints('استبدال: ' + rw.ar, -rw.pts);
    if (rw.type === 'coupon') {
      const code = 'UMARA-' + rw.id.toUpperCase() + '-' + Math.random().toString(36).slice(2, 6).toUpperCase();
      const list = personalCoupons();
      list.push(Object.assign({ code: code, desc: rw.ar, active: true, source: 'loyalty' }, rw.coupon));
      write(KEYS.personalCoupons, list);
      return { ok: true, code: code, msg: 'تم إنشاء كوبونك الشخصي: ' + code };
    }
    return { ok: true, msg: 'سيُرفق مع طلبك القادم تلقائيًا' };
  }
  function referralLink() {
    const acc = account();
    return 'https://umara.example/?ref=' + (acc ? acc.phone : 'GUEST') + '&from=loyalty';
  }
  function claimInviteBonus() {
    if (read(KEYS.invited, false)) return { ok: false, msg: 'تم احتساب مكافأة الدعوة مسبقًا' };
    write(KEYS.invited, true);
    addPoints('دعوة صديق', STORE_CONFIG.loyalty.invite);
    return { ok: true, msg: 'تمت إضافة ' + STORE_CONFIG.loyalty.invite + ' نقطة لرصيدك' };
  }

  /* ---------- العناوين ---------- */
  function addresses() { return read(KEYS.addresses, []); }
  function saveAddress(addr) {
    let list = addresses();
    if (addr.id) list = list.map(a => a.id === addr.id ? addr : a);
    else { addr.id = uid('ad'); list.push(addr); }
    if (addr.default) list = list.map(a => Object.assign({}, a, { default: a.id === addr.id }));
    write(KEYS.addresses, list); emit('addresses', list);
    return addr;
  }
  function removeAddress(id) { write(KEYS.addresses, addresses().filter(a => a.id !== id)); emit('addresses'); }
  function defaultAddress() { return addresses().find(a => a.default) || addresses()[0] || null; }

  /* ---------- شوهد مؤخرًا ---------- */
  function recentlyViewed() { return read(KEYS.recent, []); }
  function pushRecent(pid) {
    let l = recentlyViewed().filter(x => x !== pid);
    l.unshift(pid); l = l.slice(0, 8);
    write(KEYS.recent, l); emit('recent', l);
  }

  /* ---------- تفضيلات العطر (نتائج المطابق) ---------- */
  function prefs() { return read(KEYS.prefs, null); }
  function savePrefs(p) { write(KEYS.prefs, p); emit('prefs'); }

  /* ---------- النشرة البريدية ---------- */
  function subscribe(email) {
    const list = read(KEYS.newsletter, []); list.push({ email: esc(email), at: today() });
    write(KEYS.newsletter, list);
  }

  /* ---------- عرض محدود (عدّاد تنازلي ثابت) ---------- */
  function offerEnds(p) {
    if (!p || !p.saleHours) return null;
    const store = read(KEYS.offers, {});
    if (!store[p.id]) { store[p.id] = Date.now(); write(KEYS.offers, store); }
    return store[p.id] + p.saleHours * 3600 * 1000;
  }

  /* ---------- التوصيات ---------- */
  function notesArr(p) { return (p.notes.top || []).concat(p.notes.middle || [], p.notes.base || []); }
  function similarTo(pid, n) {
    const p = byId(pid); if (!p) return [];
    const myNotes = notesArr(p);
    return products().filter(q => q.id !== pid).map(q => {
      let s = q.tags.families.filter(f => p.tags.families.includes(f)).length * 3;
      s += notesArr(q).filter(x => myNotes.includes(x)).length * 2;
      if (q.brand === p.brand) s += 1;
      if (q.tags.gender.some(g => p.tags.gender.includes(g))) s += 1;
      return { q: q, s: s };
    }).sort((a, b) => b.s - a.s || b.q.rating - a.q.rating).slice(0, n || 4).map(x => x.q);
  }
  function alsoBought(pid, n) {
    const p = byId(pid); if (!p) return [];
    return (p.coPurchase || []).map(byId).filter(Boolean).slice(0, n || 3);
  }
  function forYou(n) {
    n = n || 4;
    const pool = recentlyViewed().map(byId).filter(Boolean).slice(0, 5)
      .concat(wishlist().map(w => byId(w.pid)).filter(Boolean));
    const fam = {};
    pool.forEach(p => p.tags.families.forEach(f => { fam[f] = (fam[f] || 0) + 1; }));
    const acc = account();
    const bought = new Set(allOrders().filter(o => acc && o.phone === acc.phone)
      .reduce((a, o) => a.concat(o.items.map(i => i.pid)), []));
    const scored = products().filter(p => p.stock > 0 && !bought.has(p.id)).map(p => {
      let s = 0;
      p.tags.families.forEach(f => { s += (fam[f] || 0) * 2; });
      s += (p.rating - 4) * 2;
      if (p.badges.includes('bestseller')) s += 1;
      return { p: p, s: s };
    }).sort((a, b) => b.s - a.s);
    const out = scored.slice(0, n).map(x => x.p);
    if (out.length < n) {
      products().filter(p => p.stock > 0 && out.indexOf(p) === -1).slice(0, n - out.length).forEach(p => out.push(p));
    }
    return out;
  }

  /* ---------- البحث الذكي ---------- */
  function search(raw, limit) {
    limit = limit || 8;
    const q = norm(raw);
    const res = { query: String(raw || '').trim(), products: [], brands: [], notes: [] };
    if (!q) return res;
    const scored = products().map(p => {
      let s = 0;
      if (norm(p.name_ar).includes(q)) s += 10;
      if (norm(p.name_en).includes(q)) s += 8;
      const b = BRANDS[p.brand];
      if (b && (norm(b.ar).includes(q) || norm(b.en).includes(q))) s += 6;
      if (norm(p.short_ar || '').includes(q)) s += 3;
      if (notesArr(p).some(k => norm((NOTES_DICT[k] || {}).ar || '').includes(q))) s += 5;
      if (p.tags.families.some(f => norm(DICT.families[f] || '').includes(q))) s += 4;
      if (p.tags.gender.some(g => norm(DICT.genders[g] || '').includes(q))) s += 3;
      if (norm(DICT.concentrations[p.concentration] || '').includes(q)) s += 2;
      return { p: p, s: s };
    }).filter(x => x.s > 0).sort((a, b) => b.s - a.s || b.p.rating - a.p.rating);
    res.products = scored.slice(0, limit).map(x => x.p);
    res.brands = Object.keys(BRANDS).filter(id => norm(BRANDS[id].ar).includes(q) || norm(BRANDS[id].en).includes(q))
      .slice(0, 3).map(id => Object.assign({ id: id }, BRANDS[id]));
    res.notes = Object.keys(NOTES_DICT).filter(k => norm(NOTES_DICT[k].ar).includes(q))
      .slice(0, 4).map(k => Object.assign({ key: k }, NOTES_DICT[k]));
    return res;
  }

  /* ---------- إعادة التعيين (لوحة التحكم) ---------- */
  function resetAll() {
    Object.keys(KEYS).forEach(k => LS.removeItem(KEYS[k]));
    catalogue = PRODUCTS.slice();
    catalogueStatus = 'loading';
    catalogueReady = loadSanityProducts();
    emit('cart'); emit('wish'); emit('points'); emit('orders'); emit('account');
  }

  window.Store = {
    on: on, emit: emit,
    esc: esc, fmt: fmt, price: price, uid: uid, debounce: debounce, norm: norm,
    downscaleImage: downscaleImage, addDays: addDays, today: today,
    products: products, saveProducts: saveProducts, byId: byId, bySlug: bySlug,
    ready: function () { return catalogueReady; },
    onReady: function (fn) {
      const run = function () { catalogueReady.then(fn); };
      if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run, { once: true });
      else run();
    },
    catalogStatus: function () { return { status: catalogueStatus, error: catalogueError }; },
    sizeOf: sizeOf, sizeLabel: sizeLabel, discountPct: discountPct, notesArr: notesArr,
    settings: settings, saveSettings: saveSettings,
    cart: cart, addToCart: addToCart, setQty: setQty, removeFromCart: removeFromCart,
    clearCart: clearCart, itemCount: itemCount, cartExtras: cartExtras, setCartExtras: setCartExtras,
    coupons: coupons, saveCoupons: saveCoupons, findCoupon: findCoupon,
    validateCoupon: validateCoupon, couponAmount: couponAmount, personalCoupons: personalCoupons, totals: totals,
    wishlist: wishlist, inWish: inWish, toggleWish: toggleWish, removeWish: removeWish,
    wishMove: wishMove, wishPriceDrop: wishPriceDrop,
    notifyList: notifyList, toggleNotify: toggleNotify, isNotified: isNotified,
    userOrders: userOrders, allOrders: allOrders, ordersFor: ordersFor, orderById: orderById,
    placeOrder: placeOrder, setOrderStatus: setOrderStatus, orderTimeline: orderTimeline, orderPoints: orderPoints,
    reviewsFor: reviewsFor, statsFor: statsFor, addReview: addReview, markHelpful: markHelpful,
    account: account, login: login, logout: logout, updateAccount: updateAccount,
    ledger: ledger, pointsBalance: pointsBalance, addPoints: addPoints, redeemReward: redeemReward,
    referralLink: referralLink, claimInviteBonus: claimInviteBonus,
    addresses: addresses, saveAddress: saveAddress, removeAddress: removeAddress, defaultAddress: defaultAddress,
    recentlyViewed: recentlyViewed, pushRecent: pushRecent, prefs: prefs, savePrefs: savePrefs,
    subscribe: subscribe, offerEnds: offerEnds,
    similarTo: similarTo, alsoBought: alsoBought, forYou: forYou,
    search: search, resetAll: resetAll
  };

  catalogueReady = loadSanityProducts();
})();
