/* ============================================================
   دار الأُمراء — DAR AL-UMARA  |  js/success.js
   صفحة تأكيد الطلب: عرض الطلب من ?id=، المسار الزمني، الأصناف،
   الإجماليات، نقاط نادي العطور، رسالة الإهداء، ومشاركة واتساب.
   ============================================================ */
(function () {
  'use strict';
  const esc = Store.esc, price = Store.price, qs = UI.qs;

  function fmtDate(s) {
    if (!s) return '';
    const p = String(s).split('-');
    return p.length === 3 ? p[2] + '/' + p[1] + '/' + p[0] : s;
  }

  function totalsRows(o) {
    return '<div class="tr-row"><span>المجموع الفرعي</span><b>' + price(o.subtotal || 0) + '</b></div>' +
      (o.discount > 0 ? '<div class="tr-row discount"><span>خصم ' + esc(o.coupon || '') + '</span><b>− ' + price(o.discount) + '</b></div>' : '') +
      '<div class="tr-row"><span>الشحن</span><b>' + ((o.shipping || 0) === 0 ? 'مجاني' : price(o.shipping)) + '</b></div>' +
      (o.packaging > 0 ? '<div class="tr-row"><span>التغليف الفاخر</span><b>' + price(o.packaging) + '</b></div>' : '') +
      '<div class="tr-row total"><span>الإجمالي المدفوع</span><b>' + price(o.total || 0) + '</b></div>';
  }

  function render() {
    const wrap = qs('#sxPage'); if (!wrap) return;
    const id = UI.param('id');
    let order = id ? Store.orderById(id) : null;
    if (!order) order = Store.userOrders()[0] || null;

    wrap.removeAttribute('aria-busy');

    if (!order) {
      wrap.innerHTML = '<div class="cart-empty cart-page-empty">' +
        '<svg class="ic"><use href="#i-package"/></svg>' +
        '<h3>لم نعثر على الطلب</h3><p>تأكد من الرابط أو تفضل بزيارة صفحة حسابك لعرض كل طلباتك.</p>' +
        '<div class="cart-cta"><a class="btn btn-gold" href="account.html#orders">طلباتي</a>' +
        '<a class="btn btn-outline" href="shop.html">تصفّح المتجر</a></div></div>';
      return;
    }

    document.title = 'تم تأكيد الطلب ' + order.id + ' | دار الأُمراء';
    const tl = Store.orderTimeline(order);
    const pts = Store.orderPoints(order);
    const st = DICT.statuses[order.status] || order.status;
    const pay = (DICT.payments && DICT.payments[order.payment]) || order.payment || '';
    const items = (order.items || []).map(it => {
      const p = Store.byId(it.pid) || {};
      return '<div class="co-item">' +
        '<span class="co-art">' + (p.id ? Art.product(p, { compact: true }) : '') + '</span>' +
        '<span class="co-name">' + esc(p.name_ar || it.pid) + '<small>' + (it.size ? it.size + ' مل × ' + it.qty : '× ' + it.qty) + '</small></span>' +
        '<b>' + price((it.price || 0) * (it.qty || 1)) + '</b></div>';
    }).join('');

    const waMsg = 'السلام عليكم، أرغب بتأكيد طلبي ' + order.id + ' من دار الأُمراء.';

    wrap.innerHTML =
      '<div class="sx-hero">' +
        '<span class="sx-check"><svg class="ic ic-xl"><use href="#i-check"/></svg></span>' +
        '<h1>شكرًا لك، تم استلام طلبك بنجاح</h1>' +
        '<p>رقم طلبك <b class="sx-id" dir="ltr">' + esc(order.id) + '</b> — بتاريخ ' + fmtDate(order.date) +
        '. أرسلنا تفاصيل التأكيد' + (order.email ? ' إلى <bdi dir="ltr">' + esc(order.email) + '</bdi>' : ' عبر رسالة نصية') + '، وسنبقيك على اطلاع بكل مرحلة.</p>' +
        '<div class="chips">' +
          '<span class="chip on">' + esc(st) + '</span>' +
          '<span class="chip">' + esc(pay) + '</span>' +
          '<span class="chip">' + esc(order.city || '') + '</span>' +
        '</div>' +
        '<div class="cart-cta">' +
          '<a class="btn btn-gold" href="account.html#orders"><svg class="ic ic-xs"><use href="#i-truck"/></svg> تتبع الطلب</a>' +
          '<a class="btn btn-outline" href="shop.html">متابعة التسوق</a>' +
          '<a class="btn btn-ghost" href="' + UI.waLink(waMsg) + '" target="_blank" rel="noopener"><svg class="ic ic-xs"><use href="#i-whatsapp"/></svg> تأكيد عبر واتساب</a>' +
        '</div>' +
      '</div>' +

      '<div class="sx-grid">' +
        '<section class="panel-card">' +
          '<div class="panel-head"><h2>مسار الطلب</h2><span class="status status-' + order.status + '">' + esc(st) + '</span></div>' +
          '<div class="timeline">' +
            tl.map(x => '<div class="tl-item ' + (x.done ? 'done' : '') + (x.current ? ' current' : '') + '">' +
              '<b>' + esc(x.ar) + '</b><small>' + fmtDate(x.date) + '</small></div>').join('') +
          '</div>' +
          '<p class="tr-note">يصل الطلب عادة خلال 24 – 48 ساعة داخل سوريا — سنرسل لك رابط التتبع فور الشحن.</p>' +
        '</section>' +

        '<section class="panel-card gold-edge">' +
          '<div class="panel-head"><h2>تفاصيل الطلب</h2><button class="cl-link" type="button" id="sxCopy"><svg class="ic ic-xs"><use href="#i-share"/></svg> نسخ رقم الطلب</button></div>' +
          '<div class="co-items">' + items + '</div>' +
          '<div style="margin-top:var(--s-4)">' + totalsRows(order) + '</div>' +
          '<div class="points-pill sx-points" title="نقاط نادي العطور"><svg class="ic"><use href="#i-crown"/></svg> + ' + pts + ' نقطة أُضيفت إلى نادي العطور</div>' +
          (order.gift ? '<p class="sx-gift"><b>بطاقة الإهداء:</b> «' + esc(order.gift) + '»</p>' : '') +
          (order.note ? '<p class="tr-note">ملاحظتك: ' + esc(order.note) + '</p>' : '') +
        '</section>' +
      '</div>';

    const copyBtn = qs('#sxCopy');
    if (copyBtn) {
      copyBtn.addEventListener('click', function () {
        const done = function () { UI.toast('نُسخ رقم الطلب — الصقه حيث شئت', 'success', 2200); };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(order.id).then(done).catch(function () { UI.toast('تعذّر النسخ تلقائيًا', 'info'); });
        } else { UI.toast('تعذّر النسخ تلقائيًا', 'info'); }
      });
    }

    UI.bindReveal(wrap);
  }

  Store.onReady(render);
})();
