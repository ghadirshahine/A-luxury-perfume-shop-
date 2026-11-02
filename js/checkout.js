/* ============================================================
   دار الأُمراء — DAR AL-UMARA  |  js/checkout.js
   صفحة إتمام الشراء: بيانات العميل، العنوان، الشحن، الدفع،
   التغليف والإهداء، الكوبون، الملخص الحيّ، والتحقق ثم إنشاء الطلب.
   ============================================================ */
(function () {
  'use strict';
  const esc = Store.esc, price = Store.price, qs = UI.qs;

  let mine = false;
  let shipM = 'standard';
  let payM = 'knet';

  const GOVS = ['دمشق', 'ريف دمشق', 'حلب', 'حمص', 'اللاذقية', 'حماة'];
  const PAYS = [
    { id: 'knet', ar: 'شام برس ShamPay', ic: 'credit-card', note: 'الدفع الفوري عبر البطاقات السورية' },
    { id: 'card', ar: 'بطاقة ائتمانية', ic: 'credit-card', note: 'Visa / Mastercard — دفع مشفّر وآمن' },
    { id: 'applepay', ar: 'Apple Pay', ic: 'phone', note: 'دفع سريع بلمسة واحدة' },
    { id: 'paypal', ar: 'PayPal', ic: 'shield', note: 'للعملاء من خارج سوريا' },
    { id: 'cod', ar: 'الدفع عند الاستلام', ic: 'truck', note: 'رسوم استلام 0.500 د.ك تُضاف عند التسليم' }
  ];

  function extras() { return Store.cartExtras(); }
  function coTotals() {
    const ex = extras();
    return Store.totals({ coupon: ex.coupon || null, packaging: !!ex.packaging, shippingMethod: shipM });
  }
  function dev() { return Store.defaultAddress() || {}; }

  /* ---------- أدوات بناء الحقول ---------- */
  function field(id, label, req, inputHTML, hint) {
    return '<div class="field" data-f="' + id + '"><label for="' + id + '">' + label + (req ? ' <span class="req">*</span>' : '') + '</label>' +
      inputHTML + (hint ? '<p class="hint">' + hint + '</p>' : '') +
      '<p class="error-msg"><svg class="ic ic-xs"><use href="#i-alert"/></svg><span class="em"></span></p></div>';
  }
  function panel(num, title, icon, body, extra) {
    return '<section class="panel-card co-section">' +
      '<div class="co-head"><span class="co-num">' + num + '</span><h2><svg class="ic ic-sm"><use href="#i-' + icon + '"/></svg> ' + title + '</h2></div>' +
      body + (extra || '') + '</section>';
  }

  /* ---------- الأقسام ---------- */
  function customerHTML() {
    const acc = Store.account();
    return panel(1, 'بيانات العميل', 'user',
      '<div class="form-2col">' +
        field('coName', 'الاسم الكامل', true,
          '<input class="input" id="coName" autocomplete="name" placeholder="مثال: عبدالله العتيبي" value="' + esc(acc ? acc.name : '') + '">') +
        field('coPhone', 'رقم الهاتف', true,
          '<input class="input" id="coPhone" type="tel" inputmode="numeric" dir="ltr" autocomplete="tel" placeholder="8 أرقام تبدأ بـ 5 أو 6 أو 9" value="' + esc(acc ? acc.phone : '') + '">') +
      '</div>' +
      field('coEmail', 'البريد الإلكتروني (اختياري)', false,
        '<input class="input" id="coEmail" type="email" dir="ltr" autocomplete="email" placeholder="name@example.com" value="' + esc(acc ? acc.email || '' : '') + '">',
        'نرسل تأكيد الطلب وتتبع الشحن إلى بريدك.'),
      acc ? '' : '<p class="co-hint"><svg class="ic ic-xs"><use href="#i-info"/></svg> لديك حساب في دار الأُمراء؟ <a href="account.html">سجّل الدخول</a> لملء بياناتك تلقائيًا وربط الطلب بحسابك.</p>');
  }

  function addressHTML() {
    const a = dev();
    return panel(2, 'عنوان التوصيل', 'map-pin',
      '<div class="form-2col">' +
        field('coCity', 'المحافظة', true,
          '<select class="select" id="coCity">' + GOVS.map(g => '<option' + (a.city === g ? ' selected' : '') + '>' + g + '</option>').join('') + '</select>') +
        field('coArea', 'المنطقة', true, '<input class="input" id="coArea" placeholder="مثال: الحمرا" value="' + esc(a.area || '') + '">') +
        field('coBlock', 'القطعة', true, '<input class="input" id="coBlock" inputmode="numeric" placeholder="مثال: 4" value="' + esc(a.block || '') + '">') +
        field('coStreet', 'الشارع', true, '<input class="input" id="coStreet" placeholder="مثال: شارع الحمرا" value="' + esc(a.street || '') + '">') +
      '</div>' +
      field('coHouse', 'رقم المنزل / الشقة', true, '<input class="input" id="coHouse" placeholder="مثال: منزل 12 — الدور 3" value="' + esc(a.house || '') + '">') +
      '<div class="field"><label for="coNotes">ملاحظات على التوصيل (اختياري)</label>' +
      '<textarea class="textarea" id="coNotes" rows="2" placeholder="مثال: الاتصال قبل الوصول، تسليم لموظف الاستقبال…">' + esc(a.note || '') + '</textarea></div>' +
      '<label class="check"><input type="checkbox" id="coSaveAddr"' + (Store.account() ? ' checked' : '') + '> حفظ هذا العنوان لطلباتك القادمة</label>');
  }

  function shippingHTML() {
    const s = Store.settings();
    const t = coTotals();
    const qualifies = t.subtotal - t.discount >= s.freeShippingThreshold || (t.coupon && t.coupon.type === 'shipping');
    return panel(3, 'طريقة الشحن', 'truck',
      '<div class="opt-stack">' + STORE_CONFIG.shippingMethods.map(m => {
        const free = (m.id === 'standard' || (t.coupon && t.coupon.type === 'shipping')) && qualifies;
        return '<label class="opt-card"><input type="radio" name="shipM" value="' + m.id + '"' + (m.id === shipM ? ' checked' : '') + '>' +
          '<span class="oc-ic"><svg class="ic"><use href="#i-' + (m.id === 'express' ? 'flame' : 'truck') + '"/></svg></span>' +
          '<span class="oc-txt"><b>' + esc(m.ar) + '</b><small>الوصول خلال ' + esc(m.eta) + (free ? ' — مؤهّل للشحن المجاني' : '') + '</small></span>' +
          '<span class="oc-price">' + (free ? 'مجاني' : price(m.id === 'express' ? s.expressFee : s.standardFee)) + '</span></label>';
      }).join('') + '</div>' +
      '<p class="co-hint"><svg class="ic ic-xs"><use href="#i-info"/></svg> الشحن مجاني للطلبات من ' + price(s.freeShippingThreshold) + ' فأكثر (التوصيل العادي).</p>');
  }

  function paymentHTML() {
    return panel(4, 'طريقة الدفع', 'credit-card',
      '<div class="opt-stack">' + PAYS.map(p =>
        '<label class="opt-card"><input type="radio" name="payM" value="' + p.id + '"' + (p.id === payM ? ' checked' : '') + '>' +
        '<span class="oc-ic"><svg class="ic"><use href="#i-' + p.ic + '"/></svg></span>' +
        '<span class="oc-txt"><b>' + esc(p.ar) + '</b><small>' + esc(p.note) + '</small></span></label>').join('') + '</div>' +
      '<p class="co-secure"><svg class="ic"><use href="#i-shield"/></svg> الدفع مؤمّن بتشفير 256-bit عبر بوابات دفع معتمدة</p>' +
      '<div class="pay-marks" aria-label="طرق الدفع المتاحة"><span>شام برس</span><span>VISA</span><span>Mastercard</span><span>Apple Pay</span></div>');
  }

  function extrasHTML() {
    const ex = extras();
    const fee = Store.settings().packagingFee;
    return panel(5, 'التغليف ورسالة الإهداء', 'gift',
      '<div class="opt-stack">' +
        '<label class="opt-card' + (ex.packaging ? ' on' : '') + '"><input type="checkbox" id="coPack"' + (ex.packaging ? ' checked' : '') + '>' +
        '<span class="oc-ic"><svg class="ic"><use href="#i-sparkles"/></svg></span>' +
        '<span class="oc-txt"><b>تغليف فاخر بالشريط الذهبي</b><small>' + esc(STORE_CONFIG.packaging.ar) + ' — بطاقة شكر وختم شمعي</small></span>' +
        '<span class="oc-price">' + price(fee) + '</span></label>' +
      '</div>' +
      '<div class="field" style="margin:var(--s-4) 0 0"><label for="coGift">رسالة الإهداء (اختياري)</label>' +
      '<textarea class="textarea" id="coGift" maxlength="220" rows="3" placeholder="اكتب رسالتك بخط أنيق على بطاقة دار الأُمراء…">' + esc(ex.gift || '') + '</textarea>' +
      '<p class="hint"><span id="coGiftCount">' + ((ex.gift || '').length) + '</span> / 220 حرفًا</p></div>');
  }

  /* ---------- الملخص ---------- */
  function summaryHTML() {
    const ex = extras();
    const t = coTotals();
    return '<div class="panel-head"><h2>ملخص الطلب</h2><a class="cl-link" href="cart.html">تعديل السلة</a></div>' +
      '<div class="co-items">' + t.items.map(x =>
        '<div class="co-item"><span class="co-art">' + Art.product(x.product, { compact: true }) + '</span>' +
        '<span class="co-name">' + esc(x.product.name_ar) + '<small>' + esc(Store.sizeLabel(x.sizeObj)) + ' × ' + x.qty + '</small></span>' +
        '<b>' + price(x.line) + '</b></div>').join('') + '</div>' +
      '<div id="couponBox" class="co-coupon">' + couponBoxHTML() + '</div>' +
      '<div class="tr-row" style="margin-top:var(--s-4)"><span>المجموع الفرعي</span><b>' + price(t.subtotal) + '</b></div>' +
      (t.discount > 0 ? '<div class="tr-row discount"><span>خصم ' + esc(ex.coupon) + '</span><b>− ' + price(t.discount) + '</b></div>' : '') +
      '<div class="tr-row"><span>الشحن (' + (shipM === 'express' ? 'سريع' : 'عادي') + ')</span><b>' + (t.shipping === 0 ? 'مجاني' : price(t.shipping)) + '</b></div>' +
      (t.packaging > 0 ? '<div class="tr-row"><span>التغليف الفاخر</span><b>' + price(t.packaging) + '</b></div>' : '') +
      '<div class="tr-row total"><span>الإجمالي النهائي</span><b>' + price(t.total) + '</b></div>' +
      '<div class="cart-cta"><button class="btn btn-gold btn-lg btn-block" id="coSubmit" type="button">' +
      '<svg class="ic ic-xs"><use href="#i-shield"/></svg> تأكيد الطلب والدفع</button></div>' +
      '<p class="tr-note">بالضغط على «تأكيد الطلب» أنت توافق على شروط الاستخدام وسياسة الاستبدال والاسترجاع خلال 14 يومًا.</p>';
  }

  function couponBoxHTML() {
    const code = extras().coupon || null;
    if (code) {
      const c = Store.findCoupon(code);
      return '<span class="fchip"><svg class="ic ic-xs"><use href="#i-tag"/></svg> ' + esc(code) +
        ' <button type="button" data-coupon-remove aria-label="إزالة كود الخصم"><svg class="ic"><use href="#i-close"/></svg></button></span>';
    }
    return '<div class="coupon-row"><label class="sr-only" for="couponCode">كود الخصم</label>' +
      '<input class="input" id="couponCode" placeholder="كود الخصم (اختياري)" autocomplete="off" spellcheck="false">' +
      '<button class="btn btn-outline" id="applyCoupon" type="button">تفعيل</button></div>';
  }

  function trustHTML() {
    return '<div class="trust cart-trust">' +
      '<div class="trust-item"><svg class="ic"><use href="#i-shield"/></svg><div><b>دفع آمن 100%</b><small>بوابات معتمدة ومشفّرة</small></div></div>' +
      '<div class="trust-item"><svg class="ic"><use href="#i-truck"/></svg><div><b>توصيل سريع</b><small>خلال 24 – 48 ساعة</small></div></div>' +
      '<div class="trust-item"><svg class="ic"><use href="#i-refresh"/></svg><div><b>استبدال سهل</b><small>خلال 14 يومًا</small></div></div>' +
      '<div class="trust-item"><svg class="ic"><use href="#i-whatsapp"/></svg><div><b>دعم واتساب</b><small>يوميًا 10 ص — 10 م</small></div></div>' +
      '</div>';
  }

  /* ---------- العرض ---------- */
  function render() {
    const page = qs('#coPage'); if (!page) return;
    page.removeAttribute('aria-busy');
    if (!Store.cart().length) {
      document.title = 'إتمام الشراء | دار الأُمراء';
      page.innerHTML = '<div class="cart-empty cart-page-empty">' +
        '<svg class="ic"><use href="#i-cart"/></svg><h3>سلتك فارغة حاليًا</h3>' +
        '<p>أضف عطورك المفضلة أولًا ثم عد لإتمام الشراء — الدفع آمن والتوصيل سريع.</p>' +
        '<div class="cart-cta"><a class="btn btn-gold btn-lg" href="shop.html">اكتشف العطور</a>' +
        '<a class="btn btn-outline" href="wishlist.html">قائمة المفضلة</a></div></div>';
      return;
    }
    document.title = 'إتمام الشراء (' + Store.itemCount() + ' قطعة) | دار الأُمراء';
    page.innerHTML =
      '<div class="checkout-layout">' +
        '<div class="co-main">' +
          customerHTML() + addressHTML() + shippingHTML() + paymentHTML() + extrasHTML() +
        '</div>' +
        '<aside class="cart-aside">' +
          '<section class="panel-card gold-edge" id="coSummary" aria-label="ملخص الطلب">' + summaryHTML() + '</section>' +
          trustHTML() +
        '</aside>' +
      '</div>';
    UI.bindReveal(page);
  }

  function renderSummary() {
    const box = qs('#coSummary');
    if (box) box.innerHTML = summaryHTML();
  }
  function renderCouponBox() {
    const box = qs('#couponBox');
    if (box) box.innerHTML = couponBoxHTML();
  }

  function patchExtra(o) {
    mine = true;
    try { Store.setCartExtras(o); } finally { mine = false; }
  }

  /* ---------- الكوبون ---------- */
  function applyCoupon() {
    const inp = qs('#couponCode'); if (!inp) return;
    const code = inp.value.trim();
    if (!code) { UI.toast('أدخل كود الخصم أولًا', 'error'); inp.focus(); return; }
    const acc = Store.account();
    const v = Store.validateCoupon(code, Store.totals().subtotal, acc ? acc.phone : null);
    if (!v.ok) { UI.toast(v.msg, 'error', 2800); return; }
    patchExtra({ coupon: v.coupon.code });
    renderCouponBox();
    renderSummary();
    const t = Store.totals({ coupon: v.coupon.code });
    UI.toast(v.coupon.type === 'shipping' ? 'فعّلنا الشحن المجاني على طلبك' : 'تم تفعيل الكود — وفّرت ' + price(t.discount), 'success');
  }

  /* ---------- التحقق ---------- */
  function setErr(id, msg) {
    const f = qs('[data-f="' + id + '"]'); if (!f) return;
    f.classList.toggle('has-error', !!msg);
    const em = f.querySelector('.em'); if (em) em.textContent = msg || '';
  }
  function validate() {
    const get = id => { const el = qs('#' + id); return el ? el.value.trim() : ''; };
    const rules = [
      ['coName', get('coName').length >= 3 ? '' : 'يرجى كتابة الاسم الكامل (3 أحرف على الأقل)'],
      ['coPhone', /^09[3-6]\d{7}$/.test(get('coPhone')) ? '' : 'رقم هاتف سوري غير صحيح — 10 أرقام تبدأ بـ 093 إلى 096'],
      ['coEmail', (!get('coEmail') || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(get('coEmail'))) ? '' : 'صيغة البريد الإلكتروني غير صحيحة'],
      ['coArea', get('coArea') ? '' : 'يرجى كتابة اسم المنطقة'],
      ['coBlock', get('coBlock') ? '' : 'هذا الحقل مطلوب'],
      ['coStreet', get('coStreet') ? '' : 'هذا الحقل مطلوب'],
      ['coHouse', get('coHouse') ? '' : 'هذا الحقل مطلوب']
    ];
    let firstBad = null;
    rules.forEach(r => { setErr(r[0], r[1]); if (r[1] && !firstBad) firstBad = r[0]; });
    return firstBad;
  }

  /* ---------- تأكيد الطلب ---------- */
  function submit() {
    const bad = validate();
    if (bad) {
      const f = qs('[data-f="' + bad + '"]');
      if (f) {
        f.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const inp = f.querySelector('input, select, textarea');
        if (inp) setTimeout(() => inp.focus({ preventScroll: true }), 380);
      }
      UI.toast('راجع الحقول المطلوبة قبل تأكيد الطلب', 'error');
      return;
    }
    const btn = qs('#coSubmit');
    if (btn) { btn.disabled = true; btn.innerHTML = '<svg class="ic ic-xs"><use href="#i-clock"/></svg> جارٍ تأكيد الدفع الآمن…'; }

    const get = id => { const el = qs('#' + id); return el ? el.value.trim() : ''; };
    const t = coTotals();
    const ex = extras();
    const order = {
      phone: get('coPhone'), name: get('coName'), email: get('coEmail'),
      items: t.items.map(x => ({ pid: x.pid, size: x.size, qty: x.qty, price: x.sizeObj.price })),
      subtotal: t.subtotal, discount: t.discount, shipping: t.shipping, packaging: t.packaging,
      coupon: t.coupon ? t.coupon.code : null, total: t.total,
      city: get('coCity') + ' — ' + get('coArea'),
      address: get('coBlock') + ' / ' + get('coStreet') + ' / ' + get('coHouse'),
      payment: payM, note: get('coNotes')
    };
    if (ex.gift) order.gift = ex.gift;

    if (qs('#coSaveAddr') && qs('#coSaveAddr').checked) {
      Store.saveAddress({
        city: get('coCity'), area: get('coArea'), block: get('coBlock'),
        street: get('coStreet'), house: get('coHouse'), note: get('coNotes'), default: true
      });
    }

    setTimeout(function () {
      const id = Store.placeOrder(order);
      Store.addPoints('شراء — الطلب ' + id, Store.orderPoints(order));
      Store.clearCart();
      Store.setCartExtras({ packaging: false, gift: '', coupon: null });
      UI.toast('تم استلام طلبك بنجاح — جارٍ تحويلك لصفحة التأكيد', 'success');
      setTimeout(function () { location.href = 'success.html?id=' + id; }, 900);
    }, 700);
  }

  /* ---------- الأحداث ---------- */
  const saveGift = Store.debounce(function (v) { patchExtra({ gift: v }); }, 500);

  function syncExtrasUI() {
    const ex = extras();
    const p = qs('#coPack');
    if (p) { p.checked = !!ex.packaging; const c = p.closest('.opt-card'); if (c) c.classList.toggle('on', !!ex.packaging); }
    const g = qs('#coGift');
    if (g && document.activeElement !== g) g.value = ex.gift || '';
    const gc = qs('#coGiftCount');
    if (gc) gc.textContent = (ex.gift || '').length;
  }

  function wire() {
    document.addEventListener('change', function (e) {
      const t = e.target;
      if (t.name === 'shipM') { shipM = t.value; renderSummary(); return; }
      if (t.name === 'payM') { payM = t.value; return; }
      if (t.id === 'coPack') {
        patchExtra({ packaging: t.checked });
        const card = t.closest('.opt-card');
        if (card) card.classList.toggle('on', t.checked);
        renderSummary();
        UI.toast(t.checked ? 'أُضيف التغليف الفاخر' : 'أُلغي التغليف الفاخر', 'info', 2000);
      }
    });
    document.addEventListener('input', function (e) {
      if (e.target.id === 'coGift') {
        const v = e.target.value.slice(0, 220);
        const c = qs('#coGiftCount'); if (c) c.textContent = v.length;
        saveGift(v);
      }
      if (e.target.closest && e.target.closest('.field.has-error')) {
        const f = e.target.closest('.field'); const em = f.querySelector('.em');
        f.classList.remove('has-error'); if (em) em.textContent = '';
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && e.target.id === 'couponCode') { e.preventDefault(); applyCoupon(); }
      if (e.key === 'Enter' && e.target.id === 'coSubmit') { e.preventDefault(); submit(); }
    });
    document.addEventListener('click', function (e) {
      if (e.target.closest('#coSubmit')) { submit(); return; }
      if (e.target.closest('#applyCoupon')) { applyCoupon(); return; }
      if (e.target.closest('[data-coupon-remove]')) {
        patchExtra({ coupon: null });
        renderCouponBox();
        renderSummary();
        UI.toast('أُزيل كود الخصم', 'info', 2000);
      }
    });
  }

  Store.onReady(function () {
    wire();
    render();
    Store.on('cartExtras', function () {
      if (!mine) { syncExtrasUI(); renderSummary(); }
    });
  });
})();
