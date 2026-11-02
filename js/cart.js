/* ============================================================
   دار الأُمراء — DAR AL-UMARA  |  js/cart.js
   صفحة السلة الكاملة: الصفوف (تُدار عبر التفويض العام في ui.js)،
   الشحن المجاني، الكوبونات، التغليف الفاخر، رسالة الإهداء،
   الملخص التقديري، إفراغ السلة، والتوصيات.
   ============================================================ */
(function () {
  'use strict';
  const esc = Store.esc, price = Store.price, qs = UI.qs;

  let mine = false;          /* تمييز تعديلات هذه الصفحة على cartExtras */
  let confirmTimer = null;   /* مؤقّت تأكيد إفراغ السلة */

  function extras() { return Store.cartExtras(); }
  function couponCode() { return extras().coupon || null; }

  /* ---------- الشحن المجاني ---------- */
  function progressHTML(subtotal) {
    const th = Store.settings().freeShippingThreshold;
    const pct = Math.min(100, Math.round(subtotal / th * 100));
    return subtotal >= th
      ? '<div class="ship-msg ok"><svg class="ic ic-xs"><use href="#i-check"/></svg> تهانينا! حصلت على شحن مجاني</div><div class="ship-bar"><i style="width:100%"></i></div>'
      : '<div class="ship-msg">أضف <b>' + price(th - subtotal) + '</b> للحصول على شحن مجاني</div><div class="ship-bar"><i style="width:' + pct + '%"></i></div>';
  }

  /* ---------- صفوف المنتجات ---------- */
  function lineHTML(x) {
    const p = x.product, so = x.sizeObj;
    return '<div class="cart-line" data-pid="' + p.id + '" data-size="' + x.size + '">' +
      '<a class="cl-art" href="product.html?id=' + p.id + '" aria-hidden="true" tabindex="-1">' + Art.product(p, { compact: true }) + '</a>' +
      '<div class="cl-info">' +
        '<a class="cl-name" href="product.html?id=' + p.id + '">' + esc(p.name_ar) + '</a>' +
        '<span class="cl-meta">' + esc((BRANDS[p.brand] || {}).ar || '') + ' · ' + esc(Store.sizeLabel(so)) + ' · ' + esc(DICT.concentrations[p.concentration] || '') + '</span>' +
        '<div class="cl-row2">' +
          '<div class="qty" role="group" aria-label="الكمية"><button type="button" data-cart-minus aria-label="إنقاص الكمية"><svg class="ic ic-xs"><use href="#i-minus"/></svg></button>' +
          '<output aria-live="polite">' + x.qty + '</output>' +
          '<button type="button" data-cart-plus aria-label="زيادة الكمية"><svg class="ic ic-xs"><use href="#i-plus"/></svg></button></div>' +
          (x.qty > 1 ? '<span class="cl-unit">' + price(so.price) + ' للوحدة</span>' : '') +
          (p.stock > 0 && p.stock <= 5 ? '<span class="cl-unit warn">باقي ' + p.stock + ' قطع فقط</span>' : '') +
        '</div>' +
      '</div>' +
      '<div class="cl-side">' +
        '<span class="cl-price">' + price(x.line) + '</span>' +
        '<div class="cl-acts">' +
          '<button class="cl-link" type="button" data-move-wish title="نقل إلى المفضلة">للمفضلة</button>' +
          '<button class="cl-link danger" type="button" data-remove title="حذف من السلة">حذف</button>' +
        '</div>' +
      '</div></div>';
  }

  /* ---------- كود الخصم ---------- */
  function couponBoxHTML() {
    const code = couponCode();
    if (code) {
      const c = Store.findCoupon(code);
      const t = Store.totals({ coupon: code });
      return '<div class="coupon-applied"><span class="fchip"><svg class="ic ic-xs"><use href="#i-tag"/></svg> ' + esc(code) + ' ' +
        '<button type="button" data-coupon-remove aria-label="إزالة كود الخصم"><svg class="ic"><use href="#i-close"/></svg></button></span>' +
        '<p class="tr-note">' + esc(c ? c.desc : '') + (t.discount > 0 ? ' — وفّرت ' + price(t.discount) : (c && c.type === 'shipping' ? ' — شحن مجاني مفعّل' : '')) + '</p></div>';
    }
    return '<div class="coupon-row">' +
      '<label class="sr-only" for="couponCode">كود الخصم</label>' +
      '<input class="input" id="couponCode" placeholder="كود الخصم" autocomplete="off" spellcheck="false">' +
      '<button class="btn btn-gold" id="applyCoupon" type="button">تفعيل</button></div>' +
      '<p class="tr-note">جرّب <button type="button" class="code-hint" data-code="UMARA10">UMARA10</button> لخصم 10% — أو <button type="button" class="code-hint" data-code="FREESHIP">FREESHIP</button> لشحن مجاني</p>';
  }

  /* ---------- التغليف ورسالة الإهداء ---------- */
  function extrasHTML() {
    const ex = extras();
    const fee = Store.settings().packagingFee;
    return '<div class="panel-card cart-tools">' +
        '<div class="panel-head"><h2><svg class="ic ic-sm"><use href="#i-tag"/></svg> كود الخصم</h2></div>' +
        '<div id="couponBox">' + couponBoxHTML() + '</div>' +
      '</div>' +
      '<div class="panel-card cart-tools">' +
        '<div class="panel-head"><h2><svg class="ic ic-sm"><use href="#i-gift"/></svg> التغليف والإهداء</h2></div>' +
        '<div class="opt-stack">' +
          '<label class="opt-card' + (ex.packaging ? ' on' : '') + '"><input type="checkbox" id="packOpt"' + (ex.packaging ? ' checked' : '') + '>' +
          '<span class="oc-ic"><svg class="ic"><use href="#i-sparkles"/></svg></span>' +
          '<span class="oc-txt"><b>تغليف فاخر بالشريط الذهبي</b><small>' + esc(STORE_CONFIG.packaging.ar) + ' — بطاقة شكر وختم شمعي أنيق</small></span>' +
          '<span class="oc-price">' + price(fee) + '</span></label>' +
        '</div>' +
        '<div class="field" style="margin:var(--s-4) 0 0">' +
          '<label for="giftMsg">رسالة إهداء (اختياري)</label>' +
          '<textarea class="textarea" id="giftMsg" maxlength="220" rows="3" placeholder="اكتب رسالتك بخط أنيق على بطاقة دار الأُمراء…">' + esc(ex.gift || '') + '</textarea>' +
          '<p class="hint"><span id="giftCount">' + ((ex.gift || '').length) + '</span> / 220 حرفًا — تُطبع بطاقتك وتُرفق مع الطلب.</p>' +
        '</div>' +
      '</div>';
  }

  /* ---------- الملخص التقديري ---------- */
  function summaryHTML() {
    const code = couponCode();
    const ex = extras();
    const t = Store.totals({ coupon: code, packaging: !!ex.packaging, shippingMethod: 'standard' });
    return '<div class="panel-head"><h2>ملخص الطلب</h2><span class="muted">' + Store.itemCount() + ' قطعة</span></div>' +
      '<div class="tr-row"><span>المجموع الفرعي</span><b>' + price(t.subtotal) + '</b></div>' +
      (t.discount > 0 ? '<div class="tr-row discount"><span>خصم ' + esc(code) + '</span><b>− ' + price(t.discount) + '</b></div>' : '') +
      (t.packaging > 0 ? '<div class="tr-row"><span>التغليف الفاخر</span><b>' + price(t.packaging) + '</b></div>' : '') +
      '<div class="tr-row"><span>الشحن (عادي)</span><b>' + (t.shipping === 0 ? 'مجاني' : price(t.shipping)) + '</b></div>' +
      '<div class="tr-row total"><span>الإجمالي التقديري</span><b>' + price(t.total) + '</b></div>' +
      '<p class="tr-note">' + (t.remainingForFree > 0
        ? 'متبقٍ ' + price(t.remainingForFree) + ' للشحن المجاني — يُحسب الشحن النهائي في صفحة الدفع.'
        : 'شحنك مجاني — يُحسب الشحن النهائي في صفحة الدفع حسب الطريقة المختارة.') + '</p>' +
      '<div class="cart-cta">' +
        '<a class="btn btn-gold btn-lg btn-block" href="checkout.html">إتمام الشراء <svg class="ic ic-xs"><use href="#i-chevron-left"/></svg></a>' +
        '<a class="btn btn-outline btn-block" href="shop.html">متابعة التسوق</a>' +
      '</div>' +
      '<div class="cart-foot-links">' +
        '<a class="cl-link" href="wishlist.html">عرض المفضلة</a>' +
        '<button class="cl-link danger" id="clearCart" type="button" data-arm="">إفراغ السلة</button>' +
      '</div>';
  }
  function trustHTML() {
    return '<div class="trust cart-trust">' +
      '<div class="trust-item"><svg class="ic"><use href="#i-shield"/></svg><div><b>دفع آمن 100%</b><small>شام برس وتقسيط متاح</small></div></div>' +
      '<div class="trust-item"><svg class="ic"><use href="#i-truck"/></svg><div><b>توصيل سريع</b><small>خلال 24 – 48 ساعة</small></div></div>' +
      '<div class="trust-item"><svg class="ic"><use href="#i-refresh"/></svg><div><b>استبدال سهل</b><small>خلال 14 يومًا</small></div></div>' +
      '<div class="trust-item"><svg class="ic"><use href="#i-whatsapp"/></svg><div><b>دعم واتساب</b><small>يوميًا 10 ص — 10 م</small></div></div>' +
      '</div>';
  }

  /* ---------- العرض الكامل ---------- */
  function render() {
    const page = qs('#cartPage'); if (!page) return;
    const reco = qs('#cartReco');
    const ex = extras();
    const t = Store.totals({ coupon: couponCode(), packaging: !!ex.packaging, shippingMethod: 'standard' });
    page.removeAttribute('aria-busy');

    if (!t.items.length) {
      document.title = 'سلة التسوق | دار الأُمراء';
      page.innerHTML = '<div class="cart-empty cart-page-empty">' +
        '<svg class="ic"><use href="#i-cart"/></svg>' +
        '<h3>سلتك فارغة حاليًا</h3>' +
        '<p>اكتشف عطورنا الفاخرة وابدأ رحلتك العطرية — أو تابع ما حفظته في المفضلة.</p>' +
        '<div class="cart-cta">' +
          '<a class="btn btn-gold btn-lg" href="shop.html">اكتشف العطور</a>' +
          '<a class="btn btn-outline" href="wishlist.html">قائمة المفضلة</a>' +
        '</div></div>';
      if (reco) reco.hidden = true;
      return;
    }

    document.title = 'سلة التسوق (' + Store.itemCount() + ') | دار الأُمراء';
    page.innerHTML =
      '<div class="cart-layout">' +
        '<div class="cart-main">' +
          '<div class="ship-progress">' + progressHTML(t.subtotal) + '</div>' +
          '<div class="panel-card cart-lines-card">' +
            '<div class="panel-head"><h2>منتجاتك (' + t.items.length + ')</h2>' +
            '<a class="cl-link" href="shop.html">+ أضف المزيد</a></div>' +
            t.items.map(lineHTML).join('') +
          '</div>' +
          extrasHTML() +
        '</div>' +
        '<aside class="cart-aside">' +
          '<section class="panel-card gold-edge cart-summary" id="cartSummary" aria-label="ملخص الطلب">' + summaryHTML() + '</section>' +
          trustHTML() +
        '</aside>' +
      '</div>';

    if (reco) { reco.hidden = false; renderReco(); }
    UI.bindReveal(page);
    UI.syncWishBtns();
  }

  function renderSummary() {
    const box = qs('#cartSummary');
    if (box) box.innerHTML = summaryHTML();
  }
  function renderCouponBox() {
    const box = qs('#couponBox');
    if (box) box.innerHTML = couponBoxHTML();
  }

  /* ---------- التوصيات ---------- */
  function renderReco() {
    const rail = qs('#railCartRec'); if (!rail) return;
    const inCart = {};
    Store.cart().forEach(x => { inCart[x.pid] = 1; });
    const picks = Store.forYou(12).filter(p => !inCart[p.id]).slice(0, 8);
    if (!picks.length) { const sec = qs('#cartReco'); if (sec) sec.hidden = true; return; }
    rail.innerHTML = picks.map(p => UI.productCard(p)).join('');
    UI.bindReveal(rail);
    UI.syncWishBtns();
    UI.rails();
  }

  /* ---------- تعديل الخصائص مع تمييز المصدر ---------- */
  function patchExtra(o) {
    mine = true;
    try { Store.setCartExtras(o); } finally { mine = false; }
  }

  /* ---------- تفعيل الكود ---------- */
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
    UI.toast(v.coupon.type === 'shipping'
      ? 'فعّلنا الشحن المجاني على طلبك'
      : 'تم تفعيل الكود — وفّرت ' + price(t.discount), 'success');
  }

  /* ---------- إفراغ السلة (تأكيد بخطوتين) ---------- */
  function clearCartFlow() {
    const b = qs('#clearCart'); if (!b) return;
    if (b.dataset.arm !== '1') {
      b.dataset.arm = '1';
      b.textContent = 'متأكد؟ اضغط مرة أخرى';
      b.classList.add('armed');
      clearTimeout(confirmTimer);
      confirmTimer = setTimeout(() => {
        const bb = qs('#clearCart');
        if (bb) { bb.dataset.arm = ''; bb.textContent = 'إفراغ السلة'; bb.classList.remove('armed'); }
      }, 3000);
      return;
    }
    Store.clearCart();
    UI.toast('أُفرغت السلة بالكامل', 'info');
  }

  /* ---------- الأحداث ---------- */
  const saveGift = Store.debounce(function (v) { patchExtra({ gift: v }); }, 500);

  function wire() {
    document.addEventListener('change', function (e) {
      const t = e.target;
      if (t.id === 'packOpt') {
        patchExtra({ packaging: t.checked });
        const card = t.closest('.opt-card');
        if (card) card.classList.toggle('on', t.checked);
        renderSummary();
        UI.toast(t.checked ? 'أُضيف التغليف الفاخر بالشريط الذهبي' : 'أُلغي التغليف الفاخر', 'info', 2000);
      }
    });
    document.addEventListener('input', function (e) {
      if (e.target.id === 'giftMsg') {
        const v = e.target.value.slice(0, 220);
        const c = qs('#giftCount'); if (c) c.textContent = v.length;
        saveGift(v);
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && e.target.id === 'couponCode') { e.preventDefault(); applyCoupon(); }
    });
    document.addEventListener('click', function (e) {
      if (e.target.closest('#applyCoupon')) { applyCoupon(); return; }
      if (e.target.closest('[data-coupon-remove]')) {
        patchExtra({ coupon: null });
        renderCouponBox();
        renderSummary();
        UI.toast('أُزيل كود الخصم', 'info', 2000);
        return;
      }
      const hint = e.target.closest('[data-code]');
      if (hint) {
        const inp = qs('#couponCode');
        if (inp) { inp.value = hint.dataset.code; applyCoupon(); }
        return;
      }
      if (e.target.closest('#clearCart')) { clearCartFlow(); return; }
    });
  }

  Store.onReady(function () {
    wire();
    render();
    Store.on('cart', render);
    Store.on('cartExtras', function () { if (!mine) render(); });
  });
})();
