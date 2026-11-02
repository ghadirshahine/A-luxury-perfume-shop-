/* ============================================================
   دار الأُمراء — DAR AL-UMARA  |  js/account.js
   لوحة حساب العميل: نظرة عامة، الطلبات وتتبعها، العناوين،
   نادي العطور (النقاط والاستبدال والدعوات)، التفضيلات العطرية،
   شوهد مؤخرًا، والإعدادات — بتبويبات وروابط عميقة #hash.
   ============================================================ */
(function () {
  'use strict';
  const esc = Store.esc, price = Store.price, qs = UI.qs;

  const TABS = [
    ['overview', 'نظرة عامة', 'user'],
    ['orders', 'طلباتي', 'package'],
    ['addresses', 'العناوين', 'map-pin'],
    ['points', 'نادي العطور', 'crown'],
    ['prefs', 'تفضيلاتي', 'sparkles'],
    ['recent', 'شوهد مؤخرًا', 'clock'],
    ['settings', 'الإعدادات', 'settings']
  ];
  const ORD_FILTERS = [
    ['all', 'الكل'], ['new', 'جديدة'], ['processing', 'قيد التجهيز'],
    ['shipped', 'تم الشحن'], ['delivered', 'تم التسليم'], ['other', 'ملغاة / مرتجعة']
  ];

  let tab = '';
  let ordFilter = 'all';
  const openOrders = {};
  let addrEditId = null;
  let addrFormOpen = false;
  let resetArmed = false;

  function fmtDate(s) {
    if (!s) return '';
    const p = String(s).split('-');
    return p.length === 3 ? p[2] + '/' + p[1] + '/' + p[0] : s;
  }
  function field(id, label, req, inputHTML, hint) {
    return '<div class="field" data-f="' + id + '"><label for="' + id + '">' + label + (req ? ' <span class="req">*</span>' : '') + '</label>' +
      inputHTML + (hint ? '<p class="hint">' + hint + '</p>' : '') +
      '<p class="error-msg"><svg class="ic ic-xs"><use href="#i-alert"/></svg><span class="em"></span></p></div>';
  }
  function copyText(txt) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(txt).then(function () { UI.toast('نُسخ: ' + txt, 'success', 2000); })
        .catch(function () { UI.toast('تعذّر النسخ تلقائيًا', 'info'); });
    } else { UI.toast('تعذّر النسخ تلقائيًا', 'info'); }
  }

  /* ---------- التبويبات ---------- */
  function normalizeTab() {
    const h = (location.hash || '').replace('#', '');
    return TABS.some(t => t[0] === h) ? h : 'overview';
  }
  function renderTabs() {
    const nav = qs('#accTabs'); if (!nav) return;
    nav.innerHTML = TABS.map(t =>
      '<a class="acc-tab' + (tab === t[0] ? ' on' : '') + '" href="#' + t[0] + '" data-acc-tab="' + t[0] + '"' +
      (tab === t[0] ? ' aria-current="page"' : '') + '><svg class="ic"><use href="#i-' + t[2] + '"/></svg> ' + t[1] + '</a>').join('');
  }

  /* ---------- تسجيل الدخول ---------- */
  function loginHTML() {
    return '<div class="acc-login panel-card gold-edge">' +
      '<div class="panel-head"><h2><svg class="ic ic-sm"><use href="#i-user"/></svg> تسجيل الدخول / إنشاء حساب</h2></div>' +
      '<p class="acc-login-intro">أدخل رقم هاتفك للدخول — وإن لم يكن لديك حساب سننشئه فورًا ونمنحك <b class="muted">' + STORE_CONFIG.loyalty.signup + ' نقطة ترحيبية</b> في نادي العطور.</p>' +
      '<form id="accLoginForm" novalidate>' +
        '<div class="form-2col">' +
          field('accName', 'الاسم (اختياري)', false, '<input class="input" id="accName" autocomplete="name" placeholder="مثال: عبدالله العتيبي">') +
          field('accPhone', 'رقم الهاتف', true, '<input class="input" id="accPhone" type="tel" inputmode="numeric" dir="ltr" autocomplete="tel" placeholder="8 أرقام تبدأ بـ 5 أو 6 أو 9">') +
        '</div>' +
        '<button class="btn btn-gold btn-lg btn-block" type="submit">دخول / إنشاء حساب</button>' +
      '</form>' +
      '<p class="co-hint"><svg class="ic ic-xs"><use href="#i-info"/></svg> للتجربة السريعة: <button type="button" class="code-hint" data-demo-login>0955500001</button> — حساب تجريبي كامل مع طلبات ونقاط ومكافآت.</p>' +
      '</div>';
  }
  function doLogin(phone, name) {
    if (!/^09[3-6]\d{7}$/.test(phone)) { UI.toast('رقم هاتف سوري غير صحيح — 10 أرقام تبدأ بـ 093 إلى 096', 'error', 2800); return; }
    Store.login(phone, name);
    UI.toast('أهلًا بك في دار الأُمراء' + (name ? ' يا ' + name : '') + ' — ' + STORE_CONFIG.loyalty.name, 'success');
    renderPage();
  }

  /* ---------- نظرة عامة ---------- */
  function stat(icon, val, label) {
    return '<div class="stat"><svg class="ic"><use href="#i-' + icon + '"/></svg><b>' + val + '</b><span>' + label + '</span></div>';
  }
  function overviewHTML(acc) {
    const orders = Store.ordersFor(acc.phone);
    const active = orders.filter(o => ['new', 'processing', 'shipped'].indexOf(o.status) > -1).length;
    const latest = orders[0];
    const wish = Store.wishlist().map(w => Store.byId(w.pid)).filter(Boolean).slice(0, 3);
    return '<div class="acc-stack">' +
      '<section class="panel-card gold-edge acc-hero">' +
        '<div><h2>أهلًا، ' + esc(acc.name || 'عزيزنا العميل') + '</h2>' +
        '<p>عضو في ' + STORE_CONFIG.loyalty.name + ' منذ ' + fmtDate(acc.joined) + ' — <bdi dir="ltr">' + esc(acc.phone) + '</bdi></p></div>' +
        '<div class="acc-hero-actions">' +
          '<span class="points-pill"><svg class="ic"><use href="#i-crown"/></svg> ' + Store.pointsBalance() + ' نقطة</span>' +
          '<button class="btn btn-outline btn-sm" type="button" data-logout><svg class="ic ic-xs"><use href="#i-logout"/></svg> خروج</button>' +
        '</div>' +
      '</section>' +
      '<div class="stats-row">' +
        stat('crown', Store.pointsBalance(), 'رصيد النقاط') +
        stat('package', orders.length, 'إجمالي الطلبات') +
        stat('truck', active, 'طلبات نشطة') +
        stat('heart', Store.wishlist().length, 'في المفضلة') +
      '</div>' +
      (latest
        ? '<section class="panel-card"><div class="panel-head"><h2>آخر طلب</h2>' +
          '<a class="sec-link" href="#orders" data-acc-tab="orders">كل الطلبات <svg class="ic"><use href="#i-chevron-left"/></svg></a></div>' +
          '<div class="ord-mini"><span class="ord-id" dir="ltr">' + esc(latest.id) + '</span>' +
          '<span class="muted">' + fmtDate(latest.date) + '</span>' +
          '<span class="status status-' + latest.status + '">' + esc(DICT.statuses[latest.status]) + '</span>' +
          '<b class="ord-mini-total">' + price(latest.total) + '</b></div>' +
          '<div class="timeline compact" style="margin-top:var(--s-4)">' +
          Store.orderTimeline(latest).map(x => '<div class="tl-item ' + (x.done ? 'done' : '') + (x.current ? ' current' : '') + '">' +
            '<b>' + esc(x.ar) + '</b><small>' + fmtDate(x.date) + '</small></div>').join('') + '</div></section>'
        : '<section class="panel-card"><div class="empty-state"><svg class="ic"><use href="#i-package"/></svg><h3>لا توجد طلبات بعد</h3><p>ابدأ رحلتك العطرية واطلب عطرك الأول — التوصيل خلال 24 – 48 ساعة.</p><a class="btn btn-gold" href="shop.html">اكتشف العطور</a></div></section>') +
      (wish.length
        ? '<section class="panel-card"><div class="panel-head"><h2>من مفضلتك</h2>' +
          '<a class="sec-link" href="wishlist.html">عرض الكل <svg class="ic"><use href="#i-chevron-left"/></svg></a></div>' +
          '<div class="co-items">' + wish.map(p =>
            '<div class="co-item"><span class="co-art">' + Art.product(p, { compact: true }) + '</span>' +
            '<span class="co-name"><a href="product.html?id=' + p.id + '">' + esc(p.name_ar) + '</a><small>' + esc(Store.sizeLabel(Store.sizeOf(p))) + '</small></span>' +
            '<b>' + price(Store.sizeOf(p).price) + '</b></div>').join('') + '</div></section>'
        : '') +
      '<section class="panel-card"><div class="panel-head"><h2>اختصارات سريعة</h2></div>' +
        '<div class="chips">' +
          '<a class="chip" href="shop.html">تصفّح المتجر</a>' +
          '<a class="chip" href="finder.html">اكتشف عطرك المثالي</a>' +
          '<a class="chip" href="wishlist.html">قائمة المفضلة</a>' +
          '<a class="chip" href="gifts.html">هدايا فاخرة</a>' +
        '</div></section>' +
      '</div>';
  }

  /* ---------- الطلبات ---------- */
  function inFilter(o) {
    if (ordFilter === 'all') return true;
    if (ordFilter === 'other') return o.status === 'cancelled' || o.status === 'returned';
    return o.status === ordFilter;
  }
  function orderCard(o) {
    const open = !!openOrders[o.id];
    const items = (o.items || []).map(it => {
      const p = Store.byId(it.pid) || {};
      return '<div class="co-item"><span class="co-art">' + (p.id ? Art.product(p, { compact: true }) : '') + '</span>' +
        '<span class="co-name">' + esc(p.name_ar || it.pid) + '<small>' + (it.size ? it.size + ' مل × ' + it.qty : '× ' + it.qty) + '</small></span>' +
        '<b>' + price((it.price || 0) * (it.qty || 1)) + '</b></div>';
    }).join('');
    return '<article class="acc-order panel-card' + (open ? ' open' : '') + '">' +
      '<button class="ord-head" type="button" data-order-toggle="' + esc(o.id) + '" aria-expanded="' + open + '" aria-label="تفاصيل الطلب ' + esc(o.id) + '">' +
        '<span class="ord-id">' + esc(o.id) + '</span>' +
        '<span class="ord-date">' + fmtDate(o.date) + '</span>' +
        '<span class="status status-' + o.status + '">' + esc(DICT.statuses[o.status]) + '</span>' +
        '<span class="ord-total">' + price(o.total) + '</span>' +
        '<svg class="ic ic-sm ord-chev"><use href="#i-chevron-down"/></svg>' +
      '</button>' +
      '<div class="ord-body"' + (open ? '' : ' hidden') + '>' +
        '<div class="ord-grid">' +
          '<div><h4 class="ord-sub">المنتجات</h4><div class="co-items">' + items + '</div>' +
            '<div style="margin-top:var(--s-3)">' +
              '<div class="tr-row"><span>المجموع الفرعي</span><b>' + price(o.subtotal || 0) + '</b></div>' +
              (o.discount > 0 ? '<div class="tr-row discount"><span>خصم</span><b>− ' + price(o.discount) + '</b></div>' : '') +
              '<div class="tr-row"><span>الشحن</span><b>' + ((o.shipping || 0) === 0 ? 'مجاني' : price(o.shipping)) + '</b></div>' +
              (o.packaging > 0 ? '<div class="tr-row"><span>التغليف</span><b>' + price(o.packaging) + '</b></div>' : '') +
              '<div class="tr-row total"><span>الإجمالي</span><b>' + price(o.total || 0) + '</b></div>' +
            '</div></div>' +
          '<div class="ord-side">' +
            '<h4 class="ord-sub">التتبع</h4>' +
            '<div class="timeline compact">' +
              Store.orderTimeline(o).map(x => '<div class="tl-item ' + (x.done ? 'done' : '') + (x.current ? ' current' : '') + '">' +
                '<b>' + esc(x.ar) + '</b><small>' + fmtDate(x.date) + '</small></div>').join('') +
            '</div>' +
            '<p class="tr-note">' + esc(o.city || '') + ' — ' + esc((DICT.payments || {})[o.payment] || o.payment || '') +
            (o.gift ? '<br>إهداء: «' + esc(o.gift) + '»' : '') + '</p>' +
            '<div class="chips">' +
              '<a class="chip" href="' + UI.waLink('السلام عليكم، استفسار عن الطلب ' + o.id) + '" target="_blank" rel="noopener"><svg class="ic ic-xs"><use href="#i-whatsapp"/></svg> استفسار واتساب</a>' +
              '<button class="chip" type="button" data-reorder="' + esc(o.id) + '"><svg class="ic ic-xs"><use href="#i-refresh"/></svg> اطلب مرة أخرى</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div></article>';
  }
  function ordersHTML(acc) {
    const orders = Store.ordersFor(acc.phone);
    const counts = {};
    orders.forEach(o => { counts[o.status] = (counts[o.status] || 0) + 1; });
    const list = orders.filter(inFilter);
    return '<div class="acc-stack">' +
      '<div class="chips" role="group" aria-label="تصفية الطلبات">' +
        ORD_FILTERS.map(f => {
          let n = f[0] === 'all' ? orders.length : (f[0] === 'other' ? (counts.cancelled || 0) + (counts.returned || 0) : (counts[f[0]] || 0));
          return '<button class="chip' + (ordFilter === f[0] ? ' on' : '') + '" type="button" data-ord-filter="' + f[0] + '">' + f[1] + ' (' + n + ')</button>';
        }).join('') +
      '</div>' +
      (list.length
        ? '<div class="acc-orders">' + list.map(orderCard).join('') + '</div>'
        : '<div class="empty-state panel-card"><svg class="ic"><use href="#i-package"/></svg><h3>لا توجد طلبات في هذا التصنيف</h3><p>جرّب تصنيفًا آخر أو تابع التسوق.</p><a class="btn btn-gold" href="shop.html">اكتشف العطور</a></div>') +
      '</div>';
  }

  /* ---------- العناوين ---------- */
  function addrCard(a) {
    return '<article class="addr-card' + (a.default ? ' def' : '') + '">' +
      (a.default ? '<span class="drop-tag" style="position:absolute;inset-inline-end:14px;inset-block-start:14px">العنوان الافتراضي</span>' : '') +
      '<h4 class="addr-num">' + esc(a.area || '') + ' — قطعة ' + esc(a.block || '') + '</h4>' +
      '<p class="addr-line">' + esc(a.city || '') + ' · شارع ' + esc(a.street || '') + '</p>' +
      '<p class="addr-line">' + esc(a.house || '') + '</p>' +
      (a.note ? '<p class="addr-line muted">' + esc(a.note) + '</p>' : '') +
      '<div class="addr-actions">' +
        '<button class="btn btn-ghost btn-sm" type="button" data-addr-edit="' + esc(a.id) + '"><svg class="ic ic-xs"><use href="#i-edit"/></svg> تعديل</button>' +
        (!a.default ? '<button class="btn btn-ghost btn-sm" type="button" data-addr-default="' + esc(a.id) + '">اجعله افتراضيًا</button>' : '') +
        '<button class="cl-link danger" type="button" data-addr-remove="' + esc(a.id) + '">حذف</button>' +
      '</div></article>';
  }
  function addrFormHTML() {
    if (!addrFormOpen) return '';
    const a = addrEditId ? (Store.addresses().find(x => x.id === addrEditId) || {}) : {};
    const GOVS = ['دمشق', 'ريف دمشق', 'حلب', 'حمص', 'اللاذقية', 'حماة'];
    return '<section class="panel-card"><div class="panel-head"><h2>' + (addrEditId ? 'تعديل العنوان' : 'إضافة عنوان جديد') + '</h2>' +
      '<button class="icon-btn" type="button" data-addr-cancel aria-label="إغلاق النموذج"><svg class="ic"><use href="#i-close"/></svg></button></div>' +
      '<form id="addrForm" novalidate>' +
        '<div class="form-2col">' +
          field('adCity', 'المحافظة', true, '<select class="select" id="adCity">' + GOVS.map(g => '<option' + (a.city === g ? ' selected' : '') + '>' + g + '</option>').join('') + '</select>') +
          field('adArea', 'المنطقة', true, '<input class="input" id="adArea" placeholder="مثال: الحمرا" value="' + esc(a.area || '') + '">') +
          field('adBlock', 'القطعة', true, '<input class="input" id="adBlock" placeholder="مثال: 4" value="' + esc(a.block || '') + '">') +
          field('adStreet', 'الشارع', true, '<input class="input" id="adStreet" placeholder="مثال: شارع الحمرا" value="' + esc(a.street || '') + '">') +
        '</div>' +
        '<div class="form-2col">' +
          field('adHouse', 'رقم المنزل / الشقة', true, '<input class="input" id="adHouse" placeholder="منزل 12 — الدور 3" value="' + esc(a.house || '') + '">') +
          field('adNote', 'ملاحظة (اختياري)', false, '<input class="input" id="adNote" placeholder="مثال: الاتصال قبل الوصول" value="' + esc(a.note || '') + '">') +
        '</div>' +
        '<label class="check" style="margin-bottom:var(--s-3)"><input type="checkbox" id="adDefault"' + (a.default ? ' checked' : '') + '> اجعله العنوان الافتراضي</label>' +
        '<div class="chips"><button class="btn btn-gold" type="submit"><svg class="ic ic-xs"><use href="#i-check"/></svg> ' + (addrEditId ? 'حفظ التعديلات' : 'حفظ العنوان') + '</button></div>' +
      '</form></section>';
  }
  function addressesHTML() {
    const list = Store.addresses();
    return '<div class="acc-stack">' +
      '<div class="panel-head" style="margin:0"><h2>عناوين التوصيل</h2>' +
      '<button class="btn btn-outline btn-sm" type="button" data-addr-new><svg class="ic ic-xs"><use href="#i-plus"/></svg> عنوان جديد</button></div>' +
      (list.length
        ? '<div class="addr-grid">' + list.map(addrCard).join('') + '</div>'
        : '<div class="empty-state panel-card"><svg class="ic"><use href="#i-map-pin"/></svg><h3>لا توجد عناوين محفوظة</h3><p>أضف عنوان التوصيل لتسريع طلباتك القادمة.</p></div>') +
      addrFormHTML() +
      '</div>';
  }

  /* ---------- نادي العطور ---------- */
  function rwIcon(rw) {
    if (rw.type === 'coupon') return (rw.coupon && rw.coupon.type === 'shipping') ? 'truck' : 'percent';
    if (rw.type === 'gift') return 'gift';
    return 'sparkles';
  }
  function pointsHTML(acc) {
    const bal = Store.pointsBalance();
    const ledger = Store.ledger();
    const mine = Store.personalCoupons();
    const earn = [
      { ic: 'user', t: 'إنشاء حساب', d: 'مكافأة ترحيبية فورية', p: '+' + STORE_CONFIG.loyalty.signup },
      { ic: 'cart', t: 'شراء المنتجات', d: 'نقطة عن كل دينار', p: '+1 / د.ك' },
      { ic: 'star', t: 'كتابة تقييم', d: 'شاركنا رأيك بعطر جربته', p: '+' + STORE_CONFIG.loyalty.review },
      { ic: 'share', t: 'دعوة الأصدقاء', d: 'عند انضمام صديق عبر رابطك', p: '+' + STORE_CONFIG.loyalty.invite },
      { ic: 'refresh', t: 'الشراء المتكرر', d: 'نقاط مضاعفة في الحملات', p: '×2' },
      { ic: 'sparkles', t: 'المناسبات والعروض', d: 'شارك في فعاليات دار الأُمراء', p: '+' }
    ];
    return '<div class="acc-stack">' +
      '<section class="panel-card gold-edge acc-hero">' +
        '<div><h2><svg class="ic ic-sm"><use href="#i-crown"/></svg> ' + STORE_CONFIG.loyalty.name + '</h2>' +
        '<p>رصيدك يعادل خصومات وهدايا حصرية — كل دينار شراء = نقطة.</p></div>' +
        '<div class="acc-hero-actions"><span class="points-pill"><svg class="ic"><use href="#i-crown"/></svg> ' + bal + ' نقطة</span></div>' +
      '</section>' +
      '<section class="panel-card"><div class="panel-head"><h2>اكسب النقاط</h2></div><div class="earn-grid">' +
        earn.map(e => '<div class="earn-card"><svg class="ic"><use href="#i-' + e.ic + '"/></svg>' +
          '<span><b>' + e.t + '</b><small>' + e.d + '</small></span><span class="pts">' + e.p + '</span></div>').join('') +
      '</div></section>' +
      '<section class="panel-card"><div class="panel-head"><h2>استبدل نقاطك</h2><span class="muted">رصيدك: ' + bal + ' نقطة</span></div>' +
        '<div class="rewards-grid">' + LOYALTY_REWARDS.map(rw => {
          const can = bal >= rw.pts;
          return '<article class="reward-card"><span class="rw-ic"><svg class="ic"><use href="#i-' + rwIcon(rw) + '"/></svg></span>' +
            '<span class="rw-txt"><b>' + esc(rw.ar) + '</b><small>' + esc(rw.desc) + '</small></span>' +
            '<span class="reward-cost"><b>' + rw.pts + '</b><small>نقطة</small></span>' +
            '<button class="btn btn-outline btn-sm" type="button" data-redeem="' + rw.id + '"' + (can ? '' : ' disabled title="رصيد غير كافٍ"') + '>استبدال</button></article>';
        }).join('') + '</div></section>' +
      (mine.length
        ? '<section class="panel-card"><div class="panel-head"><h2>كوبوناتك الشخصية</h2></div><div class="acc-stack-sm">' +
          mine.map(c => '<div class="coupon-mine"><span><b class="code" dir="ltr">' + esc(c.code) + '</b><br><small class="muted">' + esc(c.desc || '') + '</small></span>' +
            '<button class="btn btn-ghost btn-sm" type="button" data-copy="' + esc(c.code) + '"><svg class="ic ic-xs"><use href="#i-share"/></svg> نسخ</button></div>').join('') +
          '</div></section>'
        : '') +
      '<section class="panel-card"><div class="panel-head"><h2>ادعُ صديقًا واكسب</h2></div>' +
        '<p class="muted" style="margin-top:0">شارك رابطك — وعند انضمام صديق تحصل على <b class="gold-text">' + STORE_CONFIG.loyalty.invite + ' نقطة</b>.</p>' +
        '<div class="coupon-mine"><span class="code" dir="ltr" style="overflow-wrap:anywhere">' + esc(Store.referralLink()) + '</span>' +
          '<span class="chips">' +
            '<button class="btn btn-ghost btn-sm" type="button" data-copy="' + esc(Store.referralLink()) + '"><svg class="ic ic-xs"><use href="#i-share"/></svg> نسخ الرابط</button>' +
            '<button class="btn btn-gold btn-sm" type="button" data-claim-invite>احتساب مكافأة دعوة</button>' +
          '</span></div></section>' +
      '<section class="panel-card"><div class="panel-head"><h2>سجل النقاط</h2></div>' +
        (ledger.length
          ? '<div class="table-wrap"><table class="table ledger-table"><thead><tr><th>التاريخ</th><th>البيان</th><th>النقاط</th></tr></thead><tbody>' +
            ledger.slice(0, 12).map(e => '<tr><td>' + fmtDate(e.d) + '</td><td>' + esc(e.reason) + '</td>' +
              '<td class="' + (e.pts >= 0 ? 'ledger-pos' : 'ledger-neg') + '">' + (e.pts >= 0 ? '+' : '') + e.pts + '</td></tr>').join('') +
            '</tbody></table></div>' + (ledger.length > 12 ? '<p class="tr-note">تُعرض آخر 12 حركة.</p>' : '')
          : '<div class="empty-state"><svg class="ic"><use href="#i-crown"/></svg><h3>لا توجد حركات بعد</h3><p>ابدأ بإنشاء حساب أو شراء عطرك الأول لتجمع النقاط.</p></div>') +
      '</section>' +
      '</div>';
  }

  /* ---------- التفضيلات ---------- */
  function prefsHTML() {
    const pr = Store.prefs();
    if (!pr) {
      return '<div class="empty-state panel-card"><svg class="ic"><use href="#i-sparkles"/></svg>' +
        '<h3>لم تحدد تفضيلاتك العطرية بعد</h3>' +
        '<p>أجب على أسئلة سريعة في «اكتشف عطرك المثالي» وسنحفظ تفضيلاتك هنا مع توصيات مخصصة لك.</p>' +
        '<a class="btn btn-gold" href="finder.html">اكتشف عطرك المثالي</a></div>';
    }
    const chips = [];
    if (pr.gender && DICT.genders[pr.gender]) chips.push('لمن: ' + DICT.genders[pr.gender]);
    (pr.family || []).forEach(f => { if (DICT.families[f]) chips.push(DICT.families[f]); });
    if (pr.occasion && DICT.occasions[pr.occasion]) chips.push('المناسبة: ' + DICT.occasions[pr.occasion]);
    if (pr.season && DICT.seasons[pr.season]) chips.push('الموسم: ' + DICT.seasons[pr.season]);
    if (pr.strength && DICT.strengths[pr.strength]) chips.push('القوة: ' + DICT.strengths[pr.strength]);
    const picks = (pr.picks || []).map(Store.byId).filter(Boolean).slice(0, 4);
    return '<div class="acc-stack">' +
      '<section class="panel-card gold-edge">' +
        '<div class="panel-head"><h2><svg class="ic ic-sm"><use href="#i-sparkles"/></svg> تفضيلاتك العطرية</h2>' +
        (pr.at ? '<span class="muted">آخر تحديث: ' + fmtDate(pr.at) + '</span>' : '') + '</div>' +
        '<div class="chips">' + chips.map(c => '<span class="chip on">' + esc(c) + '</span>').join('') + '</div>' +
        '<div class="chips" style="margin-top:var(--s-4)">' +
          '<a class="btn btn-gold btn-sm" href="finder.html">تحديث التفضيلات</a>' +
          '<button class="cl-link danger" type="button" data-prefs-clear>مسح التفضيلات</button>' +
        '</div>' +
      '</section>' +
      (picks.length
        ? '<section class="panel-card"><div class="panel-head"><h2>توصياتك المحفوظة</h2>' +
          '<a class="sec-link" href="finder.html">المزيد <svg class="ic"><use href="#i-chevron-left"/></svg></a></div>' +
          '<div class="co-items">' + picks.map(p =>
            '<div class="co-item"><span class="co-art">' + Art.product(p, { compact: true }) + '</span>' +
            '<span class="co-name"><a href="product.html?id=' + p.id + '">' + esc(p.name_ar) + '</a><small>' + esc(Store.sizeLabel(Store.sizeOf(p))) + '</small></span>' +
            '<b>' + price(Store.sizeOf(p).price) + '</b></div>').join('') + '</div></section>'
        : '') +
      '</div>';
  }

  /* ---------- شوهد مؤخرًا ---------- */
  function recentHTML() {
    const list = Store.recentlyViewed().map(Store.byId).filter(Boolean);
    if (!list.length) {
      return '<div class="empty-state panel-card"><svg class="ic"><use href="#i-clock"/></svg>' +
        '<h3>لم تشاهد أي عطر بعد</h3><p>العطور التي تتصفحها ستظهر هنا لمتابعتها بسهولة.</p>' +
        '<a class="btn btn-gold" href="shop.html">ابدأ التصفح</a></div>';
    }
    return '<div class="acc-stack"><div class="grid-cards">' + list.map(p => UI.productCard(p)).join('') + '</div></div>';
  }

  /* ---------- الإعدادات ---------- */
  function settingsHTML(acc) {
    return '<div class="acc-stack">' +
      '<section class="panel-card"><div class="panel-head"><h2>بيانات الحساب</h2></div>' +
        '<form id="setForm" novalidate>' +
          '<div class="form-2col">' +
            field('setName', 'الاسم', true, '<input class="input" id="setName" value="' + esc(acc.name || '') + '">') +
            field('setEmail', 'البريد الإلكتروني', false, '<input class="input" id="setEmail" type="email" dir="ltr" value="' + esc(acc.email || '') + '" placeholder="name@example.com">') +
          '</div>' +
          field('setPhone', 'رقم الهاتف (معرّف الحساب)', false, '<input class="input" id="setPhone" dir="ltr" value="' + esc(acc.phone) + '" readonly>', 'رقم الهاتف ثابت لأنه معرّف حسابك.') +
          '<button class="btn btn-gold" type="submit"><svg class="ic ic-xs"><use href="#i-check"/></svg> حفظ التعديلات</button>' +
        '</form></section>' +
      '<section class="panel-card"><div class="panel-head"><h2>الجلسة والبيانات</h2></div>' +
        '<div class="chips">' +
          '<button class="btn btn-outline btn-sm" type="button" data-logout><svg class="ic ic-xs"><use href="#i-logout"/></svg> تسجيل الخروج</button>' +
          '<button class="cl-link danger" type="button" data-reset-demo aria-label="إعادة تعيين التجربة">إعادة تعيين التجربة (يمسح السلة والمفضلة والطلبات المحفوظة)</button>' +
        '</div>' +
        '<p class="tr-note">بياناتك محفوظة محليًا في متصفحك لأغراض العرض التجريبي، ويمكن ربط هذا الحساب لاحقًا بقاعدة بيانات حقيقية.</p>' +
      '</section>' +
      '</div>';
  }

  /* ---------- العرض الرئيسي ---------- */
  function renderPage() {
    const page = qs('#accPage'); if (!page) return;
    const acc = Store.account();
    page.removeAttribute('aria-busy');
    if (!acc) {
      tab = '';
      renderTabs();
      document.title = 'حسابي | دار الأُمراء';
      page.innerHTML = loginHTML();
      UI.bindReveal(page);
      return;
    }
    if (!tab) tab = normalizeTab();
    renderTabs();
    const body =
      tab === 'orders' ? ordersHTML(acc) :
        tab === 'addresses' ? addressesHTML() :
          tab === 'points' ? pointsHTML(acc) :
            tab === 'prefs' ? prefsHTML() :
              tab === 'recent' ? recentHTML() :
                tab === 'settings' ? settingsHTML(acc) : overviewHTML(acc);
    document.title = 'حسابي — ' + (TABS.find(t => t[0] === tab) || TABS[0])[1] + ' | دار الأُمراء';
    page.innerHTML = body;
    UI.bindReveal(page);
    UI.syncWishBtns();
  }

  /* ---------- الأحداث ---------- */
  function wire() {
    document.addEventListener('click', function (e) {
      const tabBtn = e.target.closest('[data-acc-tab]');
      if (tabBtn) {
        e.preventDefault();
        tab = tabBtn.dataset.accTab;
        if (location.hash !== '#' + tab) { try { history.replaceState(null, '', '#' + tab); } catch (err) { } }
        renderPage();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      const demo = e.target.closest('[data-demo-login]');
      if (demo) {
        const ph = qs('#accPhone'); if (ph) ph.value = '0955500001';
        doLogin('0955500001', 'عبدالله العتيبي');
        return;
      }
      if (e.target.closest('[data-logout]')) {
        Store.logout();
        UI.toast('سجّلنا خروجك — إلى اللقاء', 'info');
        tab = ''; renderPage();
        return;
      }
      const tog = e.target.closest('[data-order-toggle]');
      if (tog) { const id = tog.dataset.orderToggle; openOrders[id] = !openOrders[id]; renderPage(); return; }
      const fl = e.target.closest('[data-ord-filter]');
      if (fl) { ordFilter = fl.dataset.ordFilter; renderPage(); return; }
      const re = e.target.closest('[data-reorder]');
      if (re) {
        const o = Store.orderById(re.dataset.reorder);
        if (!o) return;
        (o.items || []).forEach(it => Store.addToCart(it.pid, it.size, it.qty));
        UI.toast('أُضيفت منتجات الطلب إلى سلتك', 'success');
        UI.openPanel('cartDrawer');
        return;
      }
      const rw = e.target.closest('[data-redeem]');
      if (rw) {
        const reward = LOYALTY_REWARDS.find(x => x.id === rw.dataset.redeem);
        if (!reward) return;
        const res = Store.redeemReward(reward);
        UI.toast(res.msg, res.ok ? 'success' : 'error', 3200);
        if (res.ok && res.code) { try { if (navigator.clipboard) navigator.clipboard.writeText(res.code); } catch (err) { } }
        renderPage();
        return;
      }
      const cp = e.target.closest('[data-copy]');
      if (cp) { copyText(cp.dataset.copy); return; }
      if (e.target.closest('[data-claim-invite]')) {
        const res = Store.claimInviteBonus();
        UI.toast(res.msg, res.ok ? 'success' : 'info');
        renderPage();
        return;
      }
      if (e.target.closest('[data-prefs-clear]')) {
        Store.savePrefs(null);
        UI.toast('مُسحت تفضيلاتك العطرية', 'info');
        renderPage();
        return;
      }
      /* العناوين */
      if (e.target.closest('[data-addr-new]')) { addrEditId = null; addrFormOpen = true; renderPage(); return; }
      const ae = e.target.closest('[data-addr-edit]');
      if (ae) { addrEditId = ae.dataset.addrEdit; addrFormOpen = true; renderPage(); return; }
      const ad = e.target.closest('[data-addr-default]');
      if (ad) {
        const a = Store.addresses().find(x => x.id === ad.dataset.addrDefault);
        if (a) { Store.saveAddress(Object.assign({}, a, { default: true })); UI.toast('حُدّد كعنوان افتراضي', 'success'); }
        renderPage();
        return;
      }
      const ar = e.target.closest('[data-addr-remove]');
      if (ar) { Store.removeAddress(ar.dataset.addrRemove); UI.toast('حُذف العنوان', 'info'); renderPage(); return; }
      if (e.target.closest('[data-addr-cancel]')) { addrFormOpen = false; addrEditId = null; renderPage(); return; }
      /* إعادة تعيين التجربة */
      const rs = e.target.closest('[data-reset-demo]');
      if (rs) {
        if (!resetArmed) {
          resetArmed = true;
          rs.textContent = 'متأكد؟ اضغط مرة أخرى للتأكيد النهائي';
          rs.classList.add('armed');
          setTimeout(function () { resetArmed = false; }, 4000);
          return;
        }
        Store.resetAll();
        tab = ''; addrEditId = null; addrFormOpen = false;
        UI.toast('أُعيدت التجربة إلى حالتها الأصلية', 'info');
        renderPage();
        return;
      }
    });

    document.addEventListener('submit', function (e) {
      if (e.target.id === 'accLoginForm') {
        e.preventDefault();
        doLogin((qs('#accPhone') || {}).value ? qs('#accPhone').value.trim() : '', (qs('#accName') || {}).value ? qs('#accName').value.trim() : '');
        return;
      }
      if (e.target.id === 'addrForm') {
        e.preventDefault();
        const g = id => { const el = qs('#' + id); return el ? el.value.trim() : ''; };
        const req = [['adArea', g('adArea')], ['adBlock', g('adBlock')], ['adStreet', g('adStreet')], ['adHouse', g('adHouse')]];
        const bad = req.find(x => !x[1]);
        if (bad) { const f = qs('[data-f="' + bad[0] + '"]'); if (f) { f.classList.add('has-error'); const em = f.querySelector('.em'); if (em) em.textContent = 'هذا الحقل مطلوب'; } UI.toast('أكمل الحقول المطلوبة', 'error'); return; }
        Store.saveAddress({
          id: addrEditId || undefined, city: g('adCity'), area: g('adArea'), block: g('adBlock'),
          street: g('adStreet'), house: g('adHouse'), note: g('adNote'),
          default: !!(qs('#adDefault') && qs('#adDefault').checked)
        });
        UI.toast(addrEditId ? 'حُفظت التعديلات' : 'أُضيف العنوان بنجاح', 'success');
        addrEditId = null; addrFormOpen = false;
        renderPage();
        return;
      }
      if (e.target.id === 'setForm') {
        e.preventDefault();
        const name = ((qs('#setName') || {}).value || '').trim();
        const email = ((qs('#setEmail') || {}).value || '').trim();
        if (name.length < 3) { UI.toast('يرجى كتابة الاسم الكامل', 'error'); return; }
        if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { UI.toast('صيغة البريد غير صحيحة', 'error'); return; }
        Store.updateAccount({ name: name, email: email });
        UI.toast('حُفظت بياناتك بنجاح', 'success');
        renderPage();
      }
    });

    document.addEventListener('input', function (e) {
      const f = e.target.closest && e.target.closest('.field.has-error');
      if (f) { f.classList.remove('has-error'); const em = f.querySelector('.em'); if (em) em.textContent = ''; }
    });

    window.addEventListener('hashchange', function () {
      if (!Store.account()) return;
      tab = normalizeTab();
      renderPage();
    });
  }

  Store.onReady(function () {
    wire();
    renderPage();
    Store.on('account', renderPage);
    Store.on('points', function () { if (tab === 'points' || tab === 'overview') renderPage(); });
    Store.on('orders', function () { if (tab === 'orders' || tab === 'overview') renderPage(); });
  });
})();
