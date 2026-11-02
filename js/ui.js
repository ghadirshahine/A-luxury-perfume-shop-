/* ============================================================
   دار الأُمراء — DAR AL-UMARA  |  js/ui.js
   طبقة الواجهة المشتركة: الهيدر والفوتر والتنقل السفلي، درج السلة،
   البحث الذكي، العرض السريع، الإشعارات المنبثقة، والحركات العامة.
   تُنشئ عناصر الواجهة ديناميكيًا لضمان اتساق كل الصفحات.
   ============================================================ */
(function () {
  'use strict';
  const esc = Store.esc, price = Store.price;

  const BADGE_AR = { bestseller: 'الأكثر مبيعًا', new: 'جديد', limited: 'إصدار محدود', exclusive: 'حصري', gift: 'طقم هدايا' };
  const NAV_FAMILIES = [['oud', 'عطور العود'], ['oriental', 'العطور الشرقية'], ['woody', 'العطور الخشبية'], ['floral', 'العطور الزهرية'], ['musk', 'المسك'], ['spicy', 'التوابل'], ['citrus', 'الحمضية'], ['sweet', 'الحلوة'], ['fresh', 'المنعشة']];

  /* ================= أدوات ================= */
  function el(html) { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; }
  function qs(s, r) { return (r || document).querySelector(s); }
  function qsa(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function param(name) { return new URLSearchParams(location.search).get(name) || ''; }
  function stars(rating, cls) {
    const pct = Math.max(0, Math.min(100, (Number(rating) || 0) / 5 * 100));
    return '<span class="stars ' + (cls || '') + '" role="img" aria-label="التقييم ' + esc(rating) + ' من 5">' +
      '<span class="stars-bg" aria-hidden="true">' + new Array(5).fill('<svg class="ic"><use href="#i-star"/></svg>').join('') + '</span>' +
      '<span class="stars-fg" style="width:' + pct + '%" aria-hidden="true">' + new Array(5).fill('<svg class="ic"><use href="#i-star"/></svg>').join('') + '</span></span>';
  }
  function priceBlock(p, size) {
    const so = Store.sizeOf(p, size);
    const now = so ? so.price : p.price;
    const old = p.oldPrice && p.oldPrice > now ? p.oldPrice : 0;
    const off = old ? Math.round((1 - now / old) * 100) : 0;
    return '<div class="price-block"><span class="price-now">' + price(now) + '</span>' +
      (old ? '<s class="price-old">' + price(old) + '</s><span class="price-off">-' + off + '%</span>' : '') +
      '</div>';
  }
  function badges(p) {
    let out = '';
    (p.badges || []).forEach(b => { if (BADGE_AR[b]) out += '<span class="badge badge-' + b + '">' + BADGE_AR[b] + '</span>'; });
    if (p.stock === 0) out += '<span class="badge badge-oos">نفدت الكمية</span>';
    else if (p.stock <= 5) out += '<span class="badge badge-low">آخر ' + p.stock + ' قطع</span>';
    return '<div class="badges">' + out + '</div>';
  }
  function productCard(p, opts) {
    opts = opts || {};
    const href = 'product.html?id=' + p.id;
    return '<article class="pcard reveal" data-pid="' + p.id + '">' +
      '<div class="pcard-media"><a href="' + href + '" aria-label="' + esc(p.name_ar) + ' — ' + esc((BRANDS[p.brand] || {}).ar) + '" class="pcard-art">' + Art.product(p, { compact: opts.compact }) + '</a>' +
        badges(p) +
        '<div class="pcard-float">' +
          '<button class="icon-btn round" data-wish="' + p.id + '" aria-pressed="false" aria-label="أضف إلى المفضلة"><svg class="ic"><use href="#i-heart"/></svg></button>' +
          '<button class="icon-btn round" data-quickview="' + p.id + '" aria-label="عرض سريع"><svg class="ic"><use href="#i-eye"/></svg></button>' +
        '</div>' +
      '</div>' +
      '<div class="pcard-body">' +
        '<span class="pcard-brand">' + esc((BRANDS[p.brand] || {}).ar || '') + '</span>' +
        '<h3 class="pcard-name"><a href="' + href + '">' + esc(p.name_ar) + '</a></h3>' +
        '<div class="pcard-sub">' + esc(p.short_ar) + '</div>' +
        '<div class="pcard-rating">' + stars(p.rating) + '<span class="rating-count">(' + p.reviewsCount + ')</span></div>' +
        priceBlock(p) +
        (p.stock === 0
          ? '<button class="btn btn-outline btn-sm btn-block" data-notify="' + p.id + '"><svg class="ic ic-xs"><use href="#i-bell"/></svg> أبلغني عند التوفّر</button>'
          : '<button class="btn btn-gold btn-sm btn-block" data-add="' + p.id + '"><svg class="ic ic-xs"><use href="#i-cart"/></svg> أضف إلى السلة</button>') +
      '</div></article>';
  }
  function skeletonCard() {
    return '<div class="pcard sk"><div class="sk-box sk-media"></div><div class="pcard-body"><div class="sk-line w40"></div><div class="sk-line w80"></div><div class="sk-line w60"></div><div class="sk-box sk-btn"></div></div></div>';
  }
  function skeletonCards(n) { return new Array(n || 4).fill(skeletonCard()).join(''); }

  /* ================= الإشعارات ================= */
  let toastWrap;
  function toast(msg, type, ms) {
    if (!toastWrap) toastWrap = qs('#toasts');
    if (!toastWrap) return;
    const icons = { success: 'check-circle', error: 'x-circle', info: 'info' };
    /* كل الرسائل نصوص عربية — تُهرَّب دفاعيًا قبل innerHTML (قاعدة المشروع) */
    const t = el('<div class="toast toast-' + (type || 'success') + '" role="status">' +
      '<svg class="ic"><use href="#i-' + (icons[type] || 'check-circle') + '"/></svg><p>' + esc(msg) + '</p>' +
      '<button class="toast-x" aria-label="إغلاق التنبيه"><svg class="ic ic-xs"><use href="#i-close"/></svg></button></div>');
    toastWrap.appendChild(t);
    while (toastWrap.children.length > 3) toastWrap.removeChild(toastWrap.firstElementChild);
    requestAnimationFrame(() => t.classList.add('in'));
    const kill = () => { t.classList.remove('in'); setTimeout(() => t.remove(), 260); };
    t.querySelector('.toast-x').addEventListener('click', kill);
    setTimeout(kill, ms || 3600);
  }

  /* ================= الطبقات (Drawers / Modals) ================= */
  let overlay, lastFocus;
  const OPEN = { current: null };
  function openPanel(id) {
    const panel = qs('#' + id);
    if (!panel) return;
    closePanel();
    lastFocus = document.activeElement;
    OPEN.current = panel;
    panel.hidden = false;
    if (overlay) overlay.hidden = false;
    document.body.classList.add('no-scroll');
    requestAnimationFrame(() => panel.classList.add('open'));
    const f = panel.querySelector('input,button,a[href]');
    if (f) setTimeout(() => f.focus(), 60);
    panel._trap = trap(panel);
  }
  function closePanel() {
    const panel = OPEN.current; if (!panel) return;
    if (panel._trap) panel._trap();
    panel.classList.remove('open');
    setTimeout(() => { panel.hidden = true; }, 260);
    if (overlay) overlay.hidden = true;
    document.body.classList.remove('no-scroll');
    OPEN.current = null;
    if (lastFocus) { try { lastFocus.focus(); } catch (e) { } }
  }
  function trap(container) {
    function onKey(e) {
      if (e.key !== 'Tab') return;
      const f = qsa('a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])', container)
        .filter(x => x.offsetParent !== null);
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
    container.addEventListener('keydown', onKey);
    return function () { container.removeEventListener('keydown', onKey); };
  }

  /* ================= الهيدر ================= */
  function header(active) {
    const famLinks = NAV_FAMILIES.map(f => '<a href="shop.html?family=' + f[0] + '">' + f[1] + '</a>').join('');
    const colLinks = COLLECTIONS.map(c => '<a href="shop.html?collection=' + c.id + '">' + c.ar + '</a>').join('');
    return '' +
      '<a class="skip-link" href="#main">تخطَّ إلى المحتوى الرئيسي</a>' +
      '<div class="announce" id="announceBar"><p><svg class="ic ic-xs"><use href="#i-truck"/></svg> شحن مجاني للطلبات فوق ' + Store.settings().freeShippingThreshold + ' د.ك — واستخدم كود <b>UMARA10</b> لخصم إضافي 10%</p>' +
        '<button class="announce-x" data-announce-close aria-label="إغلاق الشريط"><svg class="ic ic-xs"><use href="#i-close"/></svg></button></div>' +
      '<header class="site-header" id="siteHeader"><div class="container header-inner">' +
        '<button class="icon-btn nav-toggle" data-open="mobileMenu" aria-label="فتح القائمة" aria-haspopup="dialog"><svg class="ic"><use href="#i-menu"/></svg></button>' +
        '<a class="brand" href="index.html" aria-label="دار الأُمراء — الصفحة الرئيسية">' + Art.monogram(40) +
          '<span class="brand-text"><span class="brand-ar">دار الأُمراء</span><span class="brand-en">DAR AL-UMARA</span></span></a>' +
        '<nav class="main-nav" aria-label="التنقل الرئيسي"><ul>' +
          '<li><a href="index.html"' + (active === 'home' ? ' class="active" aria-current="page"' : '') + '>الرئيسية</a></li>' +
          '<li><a href="shop.html"' + (active === 'shop' ? ' class="active" aria-current="page"' : '') + '>المتجر</a></li>' +
          '<li class="has-drop"><button type="button" class="drop-btn" aria-expanded="false" aria-haspopup="true">العطور <svg class="ic ic-xs"><use href="#i-chevron-down"/></svg></button>' +
            '<div class="dropdown patterned" role="menu">' + famLinks + '<a class="drop-all" href="shop.html">تصفّح كل العطور</a></div></li>' +
          '<li class="has-drop"><button type="button" class="drop-btn" aria-expanded="false" aria-haspopup="true">المجموعات <svg class="ic ic-xs"><use href="#i-chevron-down"/></svg></button>' +
            '<div class="dropdown patterned" role="menu">' + colLinks + '</div></li>' +
          '<li><a href="shop.html?filter=bestseller">الأكثر مبيعًا</a></li>' +
          '<li><a href="shop.html?filter=new">وصل حديثًا</a></li>' +
          '<li><a href="gifts.html"' + (active === 'gifts' ? ' class="active" aria-current="page"' : '') + '>الهدايا</a></li>' +
          '<li><a href="finder.html" class="nav-finder' + (active === 'finder' ? ' active" aria-current="page' : '') + '"><svg class="ic ic-xs"><use href="#i-sparkles"/></svg> اكتشف عطرك</a></li>' +
        '</ul></nav>' +
        '<div class="header-actions">' +
          '<button class="icon-btn" data-open="searchOverlay" aria-label="البحث"><svg class="ic"><use href="#i-search"/></svg></button>' +
          '<a class="icon-btn" href="wishlist.html" aria-label="المفضلة"><svg class="ic"><use href="#i-heart"/></svg><span class="count" data-count="wish" hidden>0</span></a>' +
          '<a class="icon-btn" href="account.html" aria-label="حسابي"><svg class="ic"><use href="#i-user"/></svg></a>' +
          '<button class="icon-btn" data-open="cartDrawer" aria-label="سلة التسوق"><svg class="ic"><use href="#i-cart"/></svg><span class="count" data-count="cart" hidden>0</span></button>' +
          '<button class="lang-switch" data-lang-switch title="تغيير اللغة">العربية <i>|</i> English</button>' +
        '</div>' +
      '</div></header>';
  }

  /* ================= الفوتر ================= */
  function footer() {
    const y = new Date().getFullYear();
    return '<footer class="site-footer patterned">' +
      '<div class="container"><div class="footer-news">' +
        '<div><h3>انضم إلى قائمة دار الأُمراء</h3><p>اشترك للحصول على أحدث الإصدارات والعروض الحصرية قبل الجميع.</p></div>' +
        '<form class="newsletter" data-newsletter novalidate><label class="sr-only" for="nlEmail">البريد الإلكتروني</label>' +
        '<input id="nlEmail" type="email" name="email" placeholder="بريدك الإلكتروني" autocomplete="email" required>' +
        '<button class="btn btn-gold" type="submit">اشترك الآن</button></form>' +
      '</div>' +
      '<div class="footer-grid">' +
        '<div class="f-col f-col-brand">' + Art.monogram(44) + '<h4>دار الأُمراء</h4>' +
          '<p>دار عطور شامية فاخرة تقدم نخبة من العطور الشرقية والعالمية، مختارة بعناية لتمنحك حضورًا استثنائيًا.</p>' +
          '<div class="f-social">' +
          '<a href="#" aria-label="إنستغرام" data-social><svg class="ic"><use href="#i-instagram"/></svg></a>' +
          '<a href="#" aria-label="إكس" data-social><svg class="ic"><use href="#i-x-social"/></svg></a>' +
          '<a href="#" aria-label="تيك توك" data-social><svg class="ic"><use href="#i-tiktok"/></svg></a>' +
          '<a href="' + waLink('السلام عليكم، أرغب بالاستفسار عن عطور دار الأُمراء.') + '" target="_blank" rel="noopener" aria-label="واتساب"><svg class="ic"><use href="#i-whatsapp"/></svg></a>' +
          '</div></div>' +
        '<nav class="f-col" aria-label="روابط المتجر"><h4>المتجر</h4>' +
          '<a href="shop.html">كل العطور</a><a href="shop.html?filter=bestseller">الأكثر مبيعًا</a><a href="shop.html?filter=new">وصل حديثًا</a><a href="gifts.html">الهدايا</a><a href="finder.html">اكتشف عطرك المثالي</a></nav>' +
        '<nav class="f-col" aria-label="حسابي"><h4>حسابي</h4>' +
          '<a href="account.html">حسابي</a><a href="account.html#orders">طلباتي وتتبع الشحن</a><a href="wishlist.html">المفضلة</a><a href="account.html#points">نادي العطور</a><a href="cart.html">سلة التسوق</a></nav>' +
        '<div class="f-col"><h4>تواصل معنا</h4>' +
          '<p class="f-line"><svg class="ic ic-xs"><use href="#i-phone"/></svg> <bdi dir="ltr">+963 936 305 204</bdi></p>' +
          '<p class="f-line"><svg class="ic ic-xs"><use href="#i-mail"/></svg> <bdi dir="ltr">care@dar-alumara.com</bdi></p>' +
          '<p class="f-line"><svg class="ic ic-xs"><use href="#i-map-pin"/></svg> دمشق — شارع الحمرا</p>' +
          '<p class="f-line"><svg class="ic ic-xs"><use href="#i-clock"/></svg> يوميًا 10 صباحًا — 10 مساءً</p>' +
        '</div>' +
      '</div>' +
      '<div class="footer-bottom">' +
        '<p>© ' + y + ' دار الأُمراء — جميع الحقوق محفوظة. الأسعار تشمل ضريبة القيمة المضافة حيث تُطبق.</p>' +
        '<div class="pay-marks" aria-label="طرق الدفع المتاحة"><span>شام برس</span><span>VISA</span><span>Mastercard</span><span>Apple Pay</span><span>PayPal</span><span>الدفع عند الاستلام</span></div>' +
      '</div></div></footer>';
  }

  /* ================= التنقل السفلي (الجوال) ================= */
  function bottomNav(active) {
    const item = (id, href, icon, label, match) =>
      '<a href="' + href + '" class="' + (active === match ? 'on' : '') + '"' + (active === match ? ' aria-current="page"' : '') + '><svg class="ic"><use href="#i-' + icon + '"/></svg><span>' + label + '</span></a>';
    return '<nav class="bottom-nav" aria-label="التنقل السريع">' +
      item('b1', 'index.html', 'grid', 'الرئيسية', 'home') +
      item('b2', 'shop.html', 'layers', 'المتجر', 'shop') +
      '<button type="button" data-open="searchOverlay" aria-label="البحث"><svg class="ic"><use href="#i-search"/></svg><span>البحث</span></button>' +
      item('b4', 'wishlist.html', 'heart', 'المفضلة', 'wishlist') +
      item('b5', 'account.html', 'user', 'حسابي', 'account') +
      '</nav>';
  }

  /* ================= درج السلة ================= */
  function drawerShell() {
    return '' +
      '<div class="overlay" id="overlay" data-close hidden></div>' +
      '<aside class="drawer cart-drawer" id="cartDrawer" role="dialog" aria-modal="true" aria-label="سلة التسوق" hidden>' +
        '<header class="drawer-head"><h2>سلة التسوق <span class="muted" id="cartDrawerCount"></span></h2>' +
        '<button class="icon-btn" data-close aria-label="إغلاق السلة"><svg class="ic"><use href="#i-close"/></svg></button></header>' +
        '<div class="ship-progress" id="shipProgress"></div>' +
        '<div class="drawer-body" id="cartLines"></div>' +
        '<footer class="drawer-foot" id="cartFoot"></footer>' +
      '</aside>' +
      '<aside class="drawer mobile-menu patterned" id="mobileMenu" role="dialog" aria-modal="true" aria-label="قائمة التنقل" hidden>' +
        '<header class="drawer-head"><h2>القائمة</h2><button class="icon-btn" data-close aria-label="إغلاق القائمة"><svg class="ic"><use href="#i-close"/></svg></button></header>' +
        '<div class="drawer-body">' +
          '<a class="mm-link" href="index.html">الرئيسية</a><a class="mm-link" href="shop.html">المتجر</a>' +
          '<details class="mm-group"><summary>العطور</summary>' + NAV_FAMILIES.map(f => '<a href="shop.html?family=' + f[0] + '">' + f[1] + '</a>').join('') + '</details>' +
          '<details class="mm-group"><summary>المجموعات</summary>' + COLLECTIONS.map(c => '<a href="shop.html?collection=' + c.id + '">' + c.ar + '</a>').join('') + '</details>' +
          '<a class="mm-link" href="shop.html?filter=bestseller">الأكثر مبيعًا</a><a class="mm-link" href="shop.html?filter=new">وصل حديثًا</a>' +
          '<a class="mm-link" href="gifts.html">الهدايا</a><a class="mm-link mm-gold" href="finder.html">اكتشف عطرك المثالي</a>' +
          '<hr><a class="mm-link" href="account.html">حسابي</a><a class="mm-link" href="account.html#orders">تتبع الطلب</a><a class="mm-link" href="wishlist.html">المفضلة</a>' +
          '<button class="lang-switch mm-lang" data-lang-switch>العربية <i>|</i> English</button>' +
        '</div></aside>' +
      '<section class="search-overlay" id="searchOverlay" role="dialog" aria-modal="true" aria-label="البحث في المتجر" hidden>' +
        '<div class="search-panel">' +
        '<div class="search-box"><svg class="ic"><use href="#i-search"/></svg>' +
        '<input id="searchInput" type="search" placeholder="ابحث عن عطر..." aria-label="ابحث عن عطر أو علامة أو مكون" autocomplete="off">' +
        '<button class="icon-btn" data-close aria-label="إغلاق البحث"><svg class="ic"><use href="#i-close"/></svg></button></div>' +
        '<div class="search-results" id="searchResults" aria-live="polite"></div>' +
        '</div></section>' +
      '<div class="modal" id="quickView" role="dialog" aria-modal="true" aria-labelledby="qvName" hidden>' +
        '<div class="modal-panel qv-panel" id="quickViewBody"></div></div>' +
      '<div class="toasts" id="toasts" aria-live="polite"></div>' +
      '<a class="wa-fab" id="waFab" href="#" target="_blank" rel="noopener" aria-label="تواصل معنا عبر واتساب"><svg class="ic"><use href="#i-whatsapp"/></svg><span class="wa-tip">تواصل واتساب</span></a>' +
      '<button class="to-top" id="toTop" aria-label="العودة للأعلى" hidden><svg class="ic"><use href="#i-arrow-up"/></svg></button>';
  }

  function waLink(msg) {
    return 'https://wa.me/' + Store.settings().whatsapp + '?text=' + encodeURIComponent(msg);
  }

  /* ================= عرض السلة ================= */
  function renderCart() {
    const lines = qs('#cartLines'), foot = qs('#cartFoot'), prog = qs('#shipProgress'), cnt = qs('#cartDrawerCount');
    if (!lines) return;
    const t = Store.totals();
    if (cnt) cnt.textContent = t.items.length ? '(' + Store.itemCount() + ')' : '';
    if (!t.items.length) {
      lines.innerHTML = '<div class="cart-empty"><svg class="ic"><use href="#i-cart"/></svg>' +
        '<h3>سلتك فارغة حاليًا</h3><p>اكتشف عطورنا الفاخرة وابدأ رحلتك العطرية.</p>' +
        '<a class="btn btn-gold" href="shop.html">اكتشف العطور</a></div>';
      if (foot) foot.innerHTML = '';
      if (prog) prog.innerHTML = '';
      return;
    }
    lines.innerHTML = t.items.map(x => {
      const p = x.product, so = x.sizeObj;
      return '<div class="cart-line" data-pid="' + p.id + '" data-size="' + x.size + '">' +
        '<a class="cl-art" href="product.html?id=' + p.id + '" aria-hidden="true" tabindex="-1">' + Art.product(p, { compact: true }) + '</a>' +
        '<div class="cl-info"><a class="cl-name" href="product.html?id=' + p.id + '">' + esc(p.name_ar) + '</a>' +
          '<span class="cl-meta">' + esc(Store.sizeLabel(so)) + ' · ' + esc(DICT.concentrations[p.concentration] || '') + '</span>' +
          '<div class="qty" role="group" aria-label="الكمية"><button type="button" data-cart-minus aria-label="إنقاص الكمية"><svg class="ic ic-xs"><use href="#i-minus"/></svg></button>' +
          '<output aria-live="polite">' + x.qty + '</output>' +
          '<button type="button" data-cart-plus aria-label="زيادة الكمية"><svg class="ic ic-xs"><use href="#i-plus"/></svg></button></div></div>' +
        '<div class="cl-side"><span class="cl-price">' + price(x.line) + '</span>' +
          '<button class="cl-link" data-move-wish title="نقل إلى المفضلة">للمفضلة</button>' +
          '<button class="cl-link danger" data-remove title="حذف من السلة">حذف</button></div>' +
        '</div>';
    }).join('');
    if (foot) foot.innerHTML =
      '<div class="df-row"><span>المجموع الفرعي</span><b>' + price(t.subtotal) + '</b></div>' +
      '<p class="df-note">الخصومات والشحن تُحسب في صفحة الدفع — ' + (t.remainingForFree > 0 ? 'متبقٍ ' + price(t.remainingForFree) + ' للشحن المجاني' : 'تأهلت للشحن المجاني') + '</p>' +
      '<div class="df-actions"><a class="btn btn-outline" href="cart.html">عرض السلة</a>' +
      '<a class="btn btn-gold" href="checkout.html">إتمام الشراء <svg class="ic ic-xs"><use href="#i-chevron-left"/></svg></a></div>';
    if (prog) {
      const th = Store.settings().freeShippingThreshold;
      const pct = Math.min(100, Math.round(t.subtotal / th * 100));
      prog.innerHTML = t.subtotal >= th
        ? '<div class="ship-msg ok"><svg class="ic ic-xs"><use href="#i-check"/></svg> تهانينا! حصلت على شحن مجاني</div><div class="ship-bar"><i style="width:100%"></i></div>'
        : '<div class="ship-msg">أضف <b>' + price(th - t.subtotal) + '</b> للحصول على شحن مجاني</div><div class="ship-bar"><i style="width:' + pct + '%"></i></div>';
    }
  }

  /* ================= البحث الذكي ================= */
  function renderSearch(res) {
    const wrap = qs('#searchResults'); if (!wrap) return;
    const trending = ['عود', 'مسك', 'ورد', 'فانيلا', 'بخور', 'عنبر'];
    if (!res || !res.query) {
      wrap.innerHTML = '<div class="sr-block"><h4>الأكثر بحثًا</h4><div class="chips">' +
        trending.map(t => '<button class="chip" data-sug="' + t + '">' + t + '</button>').join('') + '</div></div>' +
        '<div class="sr-block"><h4>تصفح سريع</h4><div class="chips">' +
        '<a class="chip" href="shop.html?category=men">عطور رجالية</a><a class="chip" href="shop.html?category=women">عطور نسائية</a>' +
        '<a class="chip" href="shop.html?category=oud">عطور العود</a><a class="chip" href="gifts.html">الهدايا</a></div></div>';
      return;
    }
    if (!res.products.length && !res.brands.length && !res.notes.length) {
      wrap.innerHTML = '<div class="sr-empty"><svg class="ic"><use href="#i-search"/></svg><p>لا توجد نتائج عن «' + esc(res.query) + '»</p>' +
        '<a class="btn btn-outline btn-sm" href="shop.html">تصفّح كل العطور</a></div>';
      return;
    }
    let html = '';
    if (res.products.length) {
      html += '<div class="sr-block"><h4>العطور <a class="sr-all" href="shop.html?q=' + encodeURIComponent(res.query) + '">عرض الكل</a></h4>' +
        res.products.slice(0, 5).map(p => '<a class="sr-row" href="product.html?id=' + p.id + '">' +
          '<span class="sr-art">' + Art.product(p, { compact: true }) + '</span>' +
          '<span class="sr-info"><b>' + esc(p.name_ar) + '</b><i>' + esc((BRANDS[p.brand] || {}).ar || '') + '</i></span>' +
          '<span class="sr-price">' + price(Store.sizeOf(p).price) + '</span></a>').join('') + '</div>';
    }
    if (res.brands.length) {
      html += '<div class="sr-block"><h4>العلامات</h4>' + res.brands.map(b =>
        '<a class="sr-row slim" href="shop.html?brand=' + b.id + '"><span class="sr-info"><b>' + esc(b.ar) + '</b><i>' + esc(b.en) + '</i></span></a>').join('') + '</div>';
    }
    if (res.notes.length) {
      html += '<div class="sr-block"><h4>المكوّنات</h4>' + res.notes.map(n =>
        '<a class="sr-row slim" href="shop.html?note=' + n.key + '"><span class="sr-info"><b>' + esc(n.ar) + '</b><i>' + esc(n.desc) + '</i></span></a>').join('') + '</div>';
    }
    wrap.innerHTML = html;
  }

  /* ================= العرض السريع ================= */
  function quickView(pid) {
    const p = Store.byId(pid); if (!p) return;
    const body = qs('#quickViewBody'); const modal = qs('#quickView');
    const so = p.sizes[0];
    const st = Store.statsFor(p);
    body.innerHTML = '<button class="icon-btn modal-x" data-close aria-label="إغلاق العرض السريع"><svg class="ic"><use href="#i-close"/></svg></button>' +
      '<div class="qv-grid"><div class="qv-media">' + Art.product(p) + '</div>' +
      '<div class="qv-info"><span class="qv-brand">' + esc((BRANDS[p.brand] || {}).ar || '') + '</span>' +
      '<h3 id="qvName">' + esc(p.name_ar) + '</h3>' +
      '<div class="qv-rating">' + stars(st.rating) + '<span class="rating-count">' + st.count + ' تقييمًا</span></div>' +
      priceBlock(p, so.ml) +
      '<p class="qv-desc">' + esc(p.description_ar) + '</p>' +
      '<div class="qv-field"><span class="qv-label">الحجم</span><div class="chips" role="radiogroup" aria-label="اختر الحجم">' +
      p.sizes.map((s, i) => '<button class="chip' + (i === 0 ? ' on' : '') + '" role="radio" aria-checked="' + (i === 0) + '" data-qv-size="' + s.ml + '" data-qv-price="' + s.price + '">' + esc(Store.sizeLabel(s)) + '</button>').join('') + '</div></div>' +
      '<div class="qv-field"><span class="qv-label">الكمية</span><div class="qty"><button type="button" data-qv-minus aria-label="إنقاص"><svg class="ic ic-xs"><use href="#i-minus"/></svg></button><output id="qvQty">1</output><button type="button" data-qv-plus aria-label="زيادة"><svg class="ic ic-xs"><use href="#i-plus"/></svg></button></div></div>' +
      '<div class="qv-actions"><button class="btn btn-gold" id="qvAdd" data-pid="' + p.id + '"><svg class="ic ic-xs"><use href="#i-cart"/></svg> ' + (p.stock === 0 ? 'أبلغني عند التوفّر' : 'أضف إلى السلة') + '</button>' +
      '<button class="icon-btn round" data-wish="' + p.id + '" aria-pressed="false" aria-label="أضف إلى المفضلة"><svg class="ic"><use href="#i-heart"/></svg></button>' +
      '<a class="qv-full" href="product.html?id=' + p.id + '">عرض التفاصيل الكاملة</a></div>' +
      (p.stock > 0 ? '<p class="qv-stock ok"><svg class="ic ic-xs"><use href="#i-check"/></svg> متوفر — جاهز للشحن خلال 24 ساعة</p>' : '<p class="qv-stock out">نفدت الكمية مؤقتًا</p>') +
      '</div></div>';
    body._pid = p.id; body._size = so.ml; body._qty = 1;
    openPanel('quickView');
  }

  /* ================= المزامنة العامة ================= */
  function syncCounts() {
    const c = Store.itemCount(), w = Store.wishlist().length;
    qsa('[data-count="cart"]').forEach(x => { x.textContent = c > 99 ? '99+' : c; x.hidden = c === 0; });
    qsa('[data-count="wish"]').forEach(x => { x.textContent = w > 99 ? '99+' : w; x.hidden = w === 0; });
  }
  function syncWishBtns() {
    qsa('[data-wish]').forEach(b => {
      const on = Store.inWish(b.dataset.wish);
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      const use = b.querySelector('use');
      if (use) use.setAttribute('href', on ? '#i-heart-fill' : '#i-heart');
    });
    qsa('[data-notify]').forEach(b => {
      const on = Store.isNotified(b.dataset.notify);
      b.classList.toggle('on', on);
      if (b.classList.contains('btn')) b.innerHTML = '<svg class="ic ic-xs"><use href="#i-bell"/></svg> ' + (on ? 'سنُعلمك عند التوفّر' : 'أبلغني عند التوفّر');
    });
  }

  /* ================= المشاركة ================= */
  async function share(data) {
    const url = data.url || location.href;
    try {
      if (navigator.share) { await navigator.share({ title: data.title, text: data.text, url: url }); return; }
      await navigator.clipboard.writeText(url);
      toast('تم نسخ الرابط — شاركه مع من تحب', 'success');
    } catch (e) { if (e && e.name !== 'AbortError') toast('تعذّر النسخ — انسخ الرابط من شريط العنوان', 'info'); }
  }

  /* ================= العدّادات التنازلية ================= */
  function tickCountdowns() {
    qsa('[data-countdown]').forEach(node => {
      const p = Store.byId(node.dataset.countdown);
      const end = p ? Store.offerEnds(p) : (node.dataset.ends ? new Date(node.dataset.ends).getTime() : null);
      if (!end) { node.hidden = true; return; }
      const diff = end - Date.now();
      if (diff <= 0) { node.innerHTML = '<span class="cd-done">انتهى العرض</span>'; return; }
      const d = Math.floor(diff / 86400000), h = Math.floor(diff % 86400000 / 3600000),
        m = Math.floor(diff % 3600000 / 60000), s = Math.floor(diff % 60000 / 1000);
      const pad = n => String(n).padStart(2, '0');
      node.innerHTML = '<span class="cd-cell"><b>' + pad(d) + '</b><i>يوم</i></span><span class="cd-cell"><b>' + pad(h) + '</b><i>ساعة</i></span>' +
        '<span class="cd-cell"><b>' + pad(m) + '</b><i>دقيقة</i></span><span class="cd-cell"><b>' + pad(s) + '</b><i>ثانية</i></span>';
    });
  }

  /* ================= المسارات الأفقية (RTL-aware) ================= */
  function rtlNeg(el) {
    if (el._rtlNeg !== undefined) return el._rtlNeg;
    const prev = el.scrollLeft; el.scrollLeft = -1;
    el._rtlNeg = el.scrollLeft < 0; el.scrollLeft = prev;
    return el._rtlNeg;
  }
  function updateRailBtn(rail, prev, next) {
    const max = Math.max(0, rail.scrollWidth - rail.clientWidth);
    const pos = Math.abs(rail.scrollLeft);
    if (prev) prev.disabled = pos <= 6;
    if (next) next.disabled = pos >= max - 6;
    if (max < 30) { if (prev) prev.disabled = true; if (next) next.disabled = true; }
  }
  function rails(root) {
    qsa('.rail', root || document).forEach(rail => {
      if (!rail.id) return;
      const prev = qs('[data-rail="' + rail.id + '"][data-dir="prev"]');
      const next = qs('[data-rail="' + rail.id + '"][data-dir="next"]');
      if (rail._wired) { updateRailBtn(rail, prev, next); return; }
      rail._wired = true;
      let raf = null;
      rail.addEventListener('scroll', () => {
        if (!raf) raf = requestAnimationFrame(() => { raf = null; updateRailBtn(rail, prev, next); });
      }, { passive: true });
      [[prev, -1], [next, 1]].forEach(pair => {
        const btn = pair[0], dir = pair[1];
        if (!btn || btn._wired) return; btn._wired = true;
        btn.addEventListener('click', () => {
          const step = Math.round(rail.clientWidth * 0.85);
          const delta = dir * step * (rtlNeg(rail) ? -1 : 1);
          rail.scrollBy({ left: delta, behavior: 'smooth' });
        });
      });
      updateRailBtn(rail, prev, next);
    });
  }

  /* ================= الحركات ================= */
  function bindReveal(root) {
    const els = qsa('.reveal:not(.in)', root || document);
    if (!('IntersectionObserver' in window)) { els.forEach(e => e.classList.add('in')); return; }
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
    els.forEach(e => io.observe(e));
  }
  function bindParallax() {
    const items = qsa('[data-parallax]'); if (!items.length) return;
    let raf = null;
    function update() {
      raf = null;
      const sy = window.scrollY;
      items.forEach(node => {
        const depth = Number(node.dataset.parallax) || 0.15;
        node.style.transform = 'translateY(' + (sy * depth).toFixed(1) + 'px)';
      });
    }
    window.addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(update); }, { passive: true });
    update();
  }

  /* ================= العدّاد التنازلي للسلة: أزرار عامة ================= */
  function wireGlobal() {
    document.addEventListener('click', function (e) {
      const t = e.target;
      const openBtn = t.closest('[data-open]');
      if (openBtn) { e.preventDefault(); openPanel(openBtn.dataset.open); return; }
      if (t.closest('[data-close]')) { e.preventDefault(); closePanel(); return; }
      if (t.closest('[data-announce-close]')) { const b = qs('#announceBar'); if (b) { b.style.display = 'none'; Store.emit('announce'); } return; }

      /* المفضلة */
      const wishBtn = t.closest('[data-wish]');
      if (wishBtn) {
        e.preventDefault();
        const added = Store.toggleWish(wishBtn.dataset.wish);
        const p = Store.byId(wishBtn.dataset.wish);
        toast(added ? 'أُضيف «' + esc(p ? p.name_ar : '') + '» إلى المفضلة' : 'أُزيل من المفضلة', added ? 'success' : 'info', 2400);
        return;
      }
      /* إضافة للسلة */
      const addBtn = t.closest('[data-add]');
      if (addBtn) {
        e.preventDefault();
        const p = Store.byId(addBtn.dataset.add); if (!p) return;
        if (p.stock === 0) return;
        const size = Number(addBtn.dataset.size) || p.sizes[0].ml;
        const qty = Number(addBtn.dataset.qty) || 1;
        Store.addToCart(p.id, size, qty);
        toast('أُضيف «' + esc(p.name_ar) + '» إلى سلتك', 'success');
        openPanel('cartDrawer');
        return;
      }
      /* أبلغني عند التوفّر */
      const notifyBtn = t.closest('[data-notify]');
      if (notifyBtn) {
        e.preventDefault();
        const added = Store.toggleNotify(notifyBtn.dataset.notify);
        const p = Store.byId(notifyBtn.dataset.notify);
        toast(added ? 'سنُعلمك فور توفر «' + esc(p ? p.name_ar : '') + '» عبر واتساب والبريد' : 'أُلغي إشعار التوفر', added ? 'success' : 'info');
        return;
      }
      /* عرض سريع */
      const qv = t.closest('[data-quickview]');
      if (qv) { e.preventDefault(); quickView(qv.dataset.quickview); return; }
      /* مشاركة */
      const sh = t.closest('[data-share]');
      if (sh) { e.preventDefault(); share({ title: sh.dataset.share || document.title, text: sh.dataset.shareText || '', url: location.href }); return; }
      /* روابط اجتماعية تجريبية */
      const so = t.closest('[data-social]');
      if (so) { e.preventDefault(); toast('صفحاتنا على وسائل التواصل قريبًا', 'info'); return; }
      /* مبدّل اللغة */
      if (t.closest('[data-lang-switch]')) { toast('النسخة الإنجليزية قادمة قريبًا — اضبط الاتجاه LTR تلقائيًا', 'info'); return; }

      /* عمليات السلة داخل الدرج */
      const line = t.closest('.cart-line');
      if (line) {
        const pid = line.dataset.pid, size = Number(line.dataset.size);
        const item = Store.cart().find(x => x.pid === pid && x.size === size);
        if (t.closest('[data-cart-plus]')) { Store.setQty(pid, size, (item ? item.qty : 1) + 1); return; }
        if (t.closest('[data-cart-minus]')) { Store.setQty(pid, size, (item ? item.qty : 1) - 1); return; }
        if (t.closest('[data-remove]')) { Store.removeFromCart(pid, size); toast('أُزيل المنتج من السلة', 'info'); return; }
        if (t.closest('[data-move-wish]')) { Store.wishMove(pid, size, item ? item.qty : 1); toast('نُقل المنتج إلى المفضلة', 'success'); return; }
      }

      /* أزرار العرض السريع */
      const qvBody = qs('#quickViewBody');
      if (qvBody && qvBody.contains(t)) {
        const sizeBtn = t.closest('[data-qv-size]');
        if (sizeBtn) {
          qsa('[data-qv-size]', qvBody).forEach(b => { b.classList.remove('on'); b.setAttribute('aria-checked', 'false'); });
          sizeBtn.classList.add('on'); sizeBtn.setAttribute('aria-checked', 'true');
          qvBody._size = Number(sizeBtn.dataset.qvSize); return;
        }
        if (t.closest('[data-qv-plus]')) { qvBody._qty = Math.min(99, qvBody._qty + 1); qs('#qvQty', qvBody).textContent = qvBody._qty; return; }
        if (t.closest('[data-qv-minus]')) { qvBody._qty = Math.max(1, qvBody._qty - 1); qs('#qvQty', qvBody).textContent = qvBody._qty; return; }
      }
      const qvAdd = t.closest('#qvAdd');
      if (qvAdd) {
        const p = Store.byId(qvAdd.dataset.pid);
        if (p && p.stock === 0) { Store.toggleNotify(p.id); toast('سنُعلمك عند توفر «' + esc(p.name_ar) + '»', 'success'); }
        else if (p) { Store.addToCart(p.id, qs('#quickViewBody')._size, qs('#quickViewBody')._qty || 1); toast('أُضيف «' + esc(p.name_ar) + '» إلى سلتك', 'success'); }
        closePanel(); openPanel('cartDrawer'); return;
      }
      /* اقتراحات البحث */
      const sug = t.closest('[data-sug]');
      if (sug) { const inp = qs('#searchInput'); inp.value = sug.dataset.sug; renderSearch(Store.search(sug.dataset.sug)); inp.focus(); return; }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        if (OPEN.current) { closePanel(); return; }
        /* إغلاق أي قائمة منسدلة مفتوحة في الهيدر قبل أي شيء آخر */
        const openLi = qs('.has-drop.open');
        if (openLi) { closeDrop(openLi, openLi.querySelector('.drop-btn')); return; }
      }
      if (e.key === '/' && !OPEN.current && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) {
        e.preventDefault(); openPanel('searchOverlay');
      }
    });

    /* قوائم الهيدر المنسدلة — تُفتح مباشرة أسفل زر التفعيل (المحاذاة CSS)،
       ولا تُفتح أكثر من قائمة واحدة، مع إبقاء aria-expanded متزامنًا دائمًا */
    function closeDrop(li, btn) {
      if (!li) return;
      li.classList.remove('open');
      if (btn) { btn.setAttribute('aria-expanded', 'false'); btn.dataset.clickedOpen = 'false'; }
    }
    function closeAllDrops(exceptLi) {
      qsa('.has-drop.open').forEach(x => { if (x !== exceptLi) closeDrop(x, x.querySelector('.drop-btn')); });
    }
    qsa('.has-drop').forEach(li => {
      const btn = li.querySelector('.drop-btn');
      if (!btn) return;
      btn.dataset.clickedOpen = 'false';
      btn.addEventListener('click', () => {
        const wasClickedOpen = li.classList.contains('open') && btn.dataset.clickedOpen === 'true';
        closeAllDrops(li);
        if (wasClickedOpen) { closeDrop(li, btn); return; }
        li.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
        btn.dataset.clickedOpen = 'true';
      });
      li.addEventListener('mouseenter', () => {
        if (window.innerWidth > 1024) { closeAllDrops(li); li.classList.add('open'); btn.setAttribute('aria-expanded', 'true'); }
      });
      li.addEventListener('mouseleave', () => {
        if (window.innerWidth > 1024 && btn.dataset.clickedOpen !== 'true') { closeDrop(li, btn); }
      });
    });
    document.addEventListener('click', e => {
      if (!e.target.closest('.has-drop')) closeAllDrops(null);
    });

    /* البحث */
    const inp = qs('#searchInput');
    if (inp) {
      inp.addEventListener('input', Store.debounce(() => renderSearch(inp.value.trim() ? Store.search(inp.value) : null), 170));
      inp.addEventListener('keydown', e => {
        if (e.key === 'Enter' && inp.value.trim()) location.href = 'shop.html?q=' + encodeURIComponent(inp.value.trim());
      });
    }

    /* النشرة البريدية */
    qsa('form[data-newsletter]').forEach(f => {
      f.addEventListener('submit', e => {
        e.preventDefault();
        const email = f.querySelector('input[type="email"]').value.trim();
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { toast('يرجى إدخال بريد إلكتروني صحيح', 'error'); return; }
        Store.subscribe(email);
        f.reset();
        toast('أهلًا بك في قائمة دار الأُمراء — تفقد بريدك قريبًا', 'success');
      });
    });

    /* زر العودة للأعلى + حالة الهيدر */
    const top = qs('#toTop'), headerEl = qs('#siteHeader');
    window.addEventListener('scroll', () => {
      if (top) top.hidden = window.scrollY < 620;
      if (headerEl) headerEl.classList.toggle('scrolled', window.scrollY > 30);
    }, { passive: true });
    if (top) top.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

    /* حالة الإشعارات الشريطية */
    if (Store.itemCount()) syncCounts();
  }

  /* ================= التهيئة ================= */
  function inject() {
    const active = document.body.dataset.page || '';
    const chromeOff = document.body.dataset.chrome === 'off';
    document.body.insertAdjacentHTML('afterbegin', Art.iconSprite());
    if (!chromeOff) document.body.insertAdjacentHTML('afterbegin', header(active));
    if (!chromeOff) document.body.insertAdjacentHTML('beforeend', footer() + bottomNav(active) + drawerShell());
    Art.injectStyles();
    if (!chromeOff && qs('#waFab')) qs('#waFab').href = waLink('السلام عليكم، أرغب بالاستفسار عن عطور دار الأُمراء.');
  }

  function init() {
    inject();
    wireGlobal();
    syncCounts();
    syncWishBtns();
    renderCart();
    renderSearch(null);
    tickCountdowns();
    setInterval(tickCountdowns, 1000);
    bindReveal();
    bindParallax();
    rails();
    Store.on('cart', () => { syncCounts(); renderCart(); });
    Store.on('wish', () => { syncCounts(); syncWishBtns(); });
    Store.on('notify', () => syncWishBtns());
    Store.on('products', () => { syncWishBtns(); renderCart(); });
    Store.on('addresses', () => { });
  }

  document.addEventListener('DOMContentLoaded', init);

  window.UI = {
    rails: rails,
    toast: toast, openPanel: openPanel, closePanel: closePanel,
    productCard: productCard, skeletonCards: skeletonCards, stars: stars, priceBlock: priceBlock,
    badges: badges, quickView: quickView, share: share, waLink: waLink,
    renderCart: renderCart, syncCounts: syncCounts, syncWishBtns: syncWishBtns,
    bindReveal: bindReveal, qs: qs, qsa: qsa, el: el, param: param,
    BADGE_AR: BADGE_AR
  };
})();
