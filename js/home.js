/* ============================================================
   دار الأُمراء — DAR AL-UMARA  |  js/home.js
   الصفحة الرئيسية: التصنيفات، الأكثر مبيعًا، وصل حديثًا،
   العروض بعدّاداتها، المجموعات، الهدايا، الآراء، والتوصيات.
   ============================================================ */
(function () {
  'use strict';
  const esc = Store.esc, price = Store.price;
  const qs = UI.qs;

  /* ---------- التصنيفات ---------- */
  function renderCats() {
    const wrap = qs('#homeCats'); if (!wrap) return;
    const all = Store.products();
    wrap.innerHTML = CATEGORIES.map(c => {
      const n = all.filter(p => (p.categories || []).indexOf(c.id) > -1).length;
      return '<a class="catcard reveal" href="shop.html?category=' + c.id + '">' +
        '<span class="cat-arrow"><svg class="ic ic-sm"><use href="#i-arrow-left"/></svg></span>' +
        Art.category(c) +
        '<div class="catcard-body"><span class="catcard-name">' + esc(c.ar) + '</span>' +
        (n ? '<span class="catcard-count">' + n + ' عطرًا</span>' : '') + '</div></a>';
    }).join('');
    wrap.removeAttribute('aria-busy');
  }

  /* ---------- الأكثر مبيعًا ---------- */
  function renderBest() {
    const rail = qs('#railBest'); if (!rail) return;
    rail.innerHTML = Store.products()
      .filter(p => p.bestsellerRank)
      .sort((a, b) => a.bestsellerRank - b.bestsellerRank)
      .slice(0, 10).map(p => UI.productCard(p)).join('');
  }

  /* ---------- وصل حديثًا ---------- */
  function renderNew() {
    const rail = qs('#railNew'); if (!rail) return;
    rail.innerHTML = Store.products()
      .filter(p => p.isNew)
      .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')))
      .slice(0, 10).map(p => UI.productCard(p)).join('');
  }

  /* ---------- العروض الحصرية ---------- */
  function offerCard(p) {
    const off = Store.discountPct(p);
    return '<article class="offer-card reveal">' +
      '<a class="of-media" href="product.html?id=' + p.id + '" aria-label="' + esc(p.name_ar) + '">' +
        Art.product(p, { compact: true }) +
        '<span class="badge badge-limited"><svg class="ic ic-xs"><use href="#i-flame"/></svg> عرض محدود</span>' +
        (off ? '<span class="of-off">-' + off + '%</span>' : '') +
      '</a>' +
      '<div class="of-body">' +
        '<span class="pcard-brand">' + esc((BRANDS[p.brand] || {}).ar || '') + '</span>' +
        '<h3 class="of-name"><a href="product.html?id=' + p.id + '">' + esc(p.name_ar) + '</a></h3>' +
        UI.priceBlock(p) +
        '<div class="of-timer"><span class="of-timer-lab"><svg class="ic ic-xs"><use href="#i-clock"/></svg> ينتهي خلال</span>' +
        '<div class="cd-row" data-countdown="' + p.id + '" aria-live="off"></div></div>' +
        '<a class="btn btn-gold btn-block" href="product.html?id=' + p.id + '"><svg class="ic ic-xs"><use href="#i-cart"/></svg> التقط العرض</a>' +
      '</div></article>';
  }
  function renderOffers() {
    const grid = qs('#offerGrid'); if (!grid) return;
    const list = Store.products()
      .filter(p => p.oldPrice && p.oldPrice > p.price && p.saleHours && p.stock > 0)
      .sort((a, b) => Store.discountPct(b) - Store.discountPct(a))
      .slice(0, 3);
    if (!list.length) { const sec = qs('#offers'); if (sec) sec.hidden = true; return; }
    grid.innerHTML = list.map(offerCard).join('');
  }

  /* ---------- المجموعات الحصرية ---------- */
  function renderCollections() {
    const rail = qs('#railColl'); if (!rail) return;
    rail.innerHTML = COLLECTIONS.map(c => {
      const n = (c.products || []).length;
      return '<a class="ccard reveal" href="shop.html?collection=' + c.id + '">' +
        '<span class="badge badge-exclusive">حصري</span>' +
        Art.collection(c) +
        '<div class="ccard-body"><h3>' + esc(c.ar) + '</h3><p>' + esc(c.desc) + '</p>' +
        '<div class="ccard-meta"><span><svg class="ic"><use href="#i-layers"/></svg> ' + n + ' عطور</span>' +
        '<span class="ccard-go">اكتشف المجموعة <svg class="ic ic-xs"><use href="#i-chevron-left"/></svg></span></div></div></a>';
    }).join('');
  }

  /* ---------- قسم الهدايا ---------- */
  function renderOccasions() {
    const rail = qs('#occRail'); if (!rail) return;
    rail.innerHTML = GIFT_OCCASIONS.map(o =>
      '<a class="ocard reveal" href="gifts.html?occasion=' + o.id + '">' + Art.occasion(o) +
      '<b>' + esc(o.ar) + '</b><small>' + esc(o.desc) + '</small></a>').join('');
  }

  /* ---------- آراء العملاء ---------- */
  function renderTestimonials() {
    const grid = qs('#tstGrid'); if (!grid) return;
    const picks = [];
    Object.keys(SEED_REVIEWS).forEach(pid => {
      SEED_REVIEWS[pid].forEach(r => picks.push(Object.assign({ pid: pid }, r)));
    });
    const top = picks.sort((a, b) => (b.helpful || 0) - (a.helpful || 0)).slice(0, 3);
    grid.innerHTML = top.map(r => {
      const p = Store.byId(r.pid);
      return '<figure class="tst-card reveal">' +
        '<svg class="ic t-q" aria-hidden="true"><use href="#i-star8"/></svg>' +
        '<blockquote>' + esc(r.text) + '</blockquote>' +
        '<div class="t-stars">' + UI.stars(r.rating) + '</div>' +
        '<figcaption><b>' + esc(r.name) + '</b>' +
        (p ? '<span>عن «<a href="product.html?id=' + p.id + '">' + esc(p.name_ar) + '</a>»</span>' : '') +
        '</figcaption></figure>';
    }).join('');
  }

  /* ---------- قد يعجبك أيضًا (مخصّص) ---------- */
  function renderForYou() {
    const rail = qs('#railForyou'); if (!rail) return;
    const list = Store.forYou(8);
    if (!list.length) return;
    rail.innerHTML = list.map(p => UI.productCard(p)).join('');
    const sec = qs('#forYouSec'); if (sec) sec.hidden = false;
  }

  /* ---------- شوهد مؤخرًا ---------- */
  function renderRecent() {
    const rail = qs('#railRecent'); if (!rail) return;
    const list = Store.recentlyViewed().map(Store.byId).filter(Boolean);
    if (!list.length) return;
    rail.innerHTML = list.map(p => UI.productCard(p, { compact: true })).join('');
    const sec = qs('#recentSec'); if (sec) sec.hidden = false;
  }

  /* ---------- بانر الواجهة (يحرره المدير من لوحة التحكم) ---------- */
  function applyBanner() {
    let b = null;
    try { b = JSON.parse(localStorage.getItem('umara_banners') || 'null'); } catch (e) { b = null; }
    if (!b) return;
    const t = qs('#heroTitle'), s = qs('#heroSub');
    if (t && (b.title || b.gold)) {
      t.innerHTML = esc(b.title || 'عطرك...') + ' <span class="gold-text">' + esc(b.gold || 'هويتك التي لا تُنسى') + '</span>';
    }
    if (s && b.sub) s.textContent = b.sub;
  }

  function render() {
    applyBanner();
    renderCats();
    renderBest();
    renderNew();
    renderOffers();
    renderCollections();
    renderOccasions();
    renderTestimonials();
    renderForYou();
    renderRecent();
    UI.bindReveal();
    UI.syncWishBtns();
    UI.rails();
  }

  Store.onReady(render);
})();
