/* ============================================================
   دار الأُمراء — DAR AL-UMARA  |  js/gifts.js
   قسم الهدايا: تجربة الإهداء (تغليف فاخر + رسالة شخصية تُحفظ في
   خصائص السلة عبر setCartExtras)، شبكة الهدايا حسب المناسبة مع
   اقتراحات فورية، طقم الهدايا الملكي، ورف الأكثر رواجًا كهدايا.
   ============================================================ */
(function () {
  'use strict';
  const esc = Store.esc, price = Store.price, qs = UI.qs;

  let mine = false;      /* تمييز تعديلات هذه الصفحة على cartExtras */
  let activeOcc = null;  /* المناسبة المختارة حاليًا */

  function extras() { return Store.cartExtras(); }
  function patchExtra(o) { mine = true; try { Store.setCartExtras(o); } finally { mine = false; } }

  /* ---------- تجربة الإهداء ---------- */
  function boxHTML() {
    const ex = extras();
    const fee = Store.settings().packagingFee;
    return '<div class="gift-grid">' +
      '<section class="panel-card gold-edge gift-panel">' +
        '<div class="panel-head"><h2><svg class="ic ic-sm"><use href="#i-gift"/></svg> جهّز هديتك</h2>' +
        '<span class="muted">خطوتان فقط قبل إتمام الشراء</span></div>' +
        '<p class="gp-lead">حوّل عطرك المفضل إلى هدية لا تُنسى: تغليف فاخر بالشريط الذهبي وختم شمعي، وبطاقة إهداء تُطبع برسالتك الشخصية.</p>' +
        '<div class="opt-stack">' +
          '<label class="opt-card' + (ex.packaging ? ' on' : '') + '"><input type="checkbox" id="gfPack"' + (ex.packaging ? ' checked' : '') + '>' +
            '<span class="oc-ic"><svg class="ic"><use href="#i-sparkles"/></svg></span>' +
            '<span class="oc-txt"><b>تغليف فاخر بالشريط الذهبي</b><small>' + esc(STORE_CONFIG.packaging.ar) + ' — بطاقة شكر وختم شمعي</small></span>' +
            '<span class="oc-price">' + price(fee) + '</span></label>' +
        '</div>' +
        '<div class="field" style="margin:var(--s-4) 0 0"><label for="gfMsg">بطاقة الإهداء — رسالة شخصية (اختياري)</label>' +
          '<textarea class="textarea" id="gfMsg" maxlength="220" rows="3" placeholder="اكتب رسالتك بخط أنيق على بطاقة دار الأُمراء…">' + esc(ex.gift || '') + '</textarea>' +
          '<p class="hint"><span id="gfCount">' + (ex.gift || '').length + '</span>/220 حرفًا — تُطبع بخط عربي أنيق على بطاقة مرافقة للهدية</p>' +
        '</div>' +
        '<div class="gift-actions">' +
          '<button class="btn btn-gold" type="button" id="gfCartBtn" data-open-cart><svg class="ic ic-xs"><use href="#i-cart"/></svg> <span id="gfCartTxt">راجع سلتك واطلب الآن</span></button>' +
          '<a class="btn btn-outline" href="shop.html">تصفّح العطور</a>' +
        '</div>' +
        '<p class="co-hint"><svg class="ic ic-xs"><use href="#i-info"/></svg> يُطبّق التغليف والرسالة على طلبك كاملًا — ويمكنك تعديلهما في أي وقت من السلة.</p>' +
      '</section>' +
      '<aside class="panel-card gift-feats">' +
        '<h3>لماذا هدايا دار الأُمراء؟</h3>' +
        '<div class="gfeat"><svg class="ic"><use href="#i-shield"/></svg><span><b>أصالة مضمونة</b><small>عطور أصلية 100% بضمان دار الأُمراء</small></span></div>' +
        '<div class="gfeat"><svg class="ic"><use href="#i-truck"/></svg><span><b>توصيل سريع</b><small>خلال 24 – 48 ساعة في جميع المحافظات السورية</small></span></div>' +
        '<div class="gfeat"><svg class="ic"><use href="#i-gift"/></svg><span><b>تغليف ملكي</b><small>شريط ذهبي وختم شمعي وبطاقة إهداء</small></span></div>' +
        '<div class="gfeat"><svg class="ic"><use href="#i-whatsapp"/></svg><span><b>استشارة هدايا</b><small><a class="cl-link" href="' + UI.waLink('مرحبًا، أحتاج مساعدة في اختيار هدية عطرية') + '" target="_blank" rel="noopener">تواصل معنا عبر واتساب</a> لاختيار الهدية الأنسب</small></span></div>' +
      '</aside>' +
      '</div>';
  }
  function renderBox() {
    const box = qs('#giftBox'); if (!box) return;
    box.removeAttribute('aria-busy');
    box.innerHTML = boxHTML();
    syncCartBtn();
  }
  function syncBox() {
    const ex = extras();
    const pack = qs('#gfPack');
    if (pack) { pack.checked = !!ex.packaging; const c = pack.closest('.opt-card'); if (c) c.classList.toggle('on', !!ex.packaging); }
    const msg = qs('#gfMsg');
    if (msg && document.activeElement !== msg) msg.value = ex.gift || '';
    const cnt = qs('#gfCount');
    if (cnt) cnt.textContent = (ex.gift || '').length;
  }
  function syncCartBtn() {
    const t = qs('#gfCartTxt'); if (!t) return;
    const n = Store.itemCount();
    t.textContent = n ? 'راجع سلتك واطلب الآن (' + n + ')' : 'راجع سلتك واطلب الآن';
  }

  /* ---------- الهدايا حسب المناسبة ---------- */
  function renderOcc() {
    const grid = qs('#occGrid'); if (!grid) return;
    grid.removeAttribute('aria-busy');
    grid.innerHTML = GIFT_OCCASIONS.map(o =>
      '<button class="occ-card' + (activeOcc === o.id ? ' on' : '') + '" type="button" data-occ="' + o.id + '" aria-pressed="' + (activeOcc === o.id) + '">' +
        '<span class="occ-ic"><svg class="ic"><use href="#i-' + o.glyph + '"/></svg></span>' +
        '<b>' + esc(o.ar) + '</b><small>' + esc(o.desc) + '</small>' +
        '<span class="occ-count">' + o.suggest.length + ' اقتراحات <svg class="ic ic-xs"><use href="#i-chevron-left"/></svg></span>' +
      '</button>').join('');
  }
  function renderPicks(scroll) {
    const box = qs('#giftPicks'); if (!box) return;
    const occ = GIFT_OCCASIONS.find(o => o.id === activeOcc);
    if (!occ) { box.hidden = true; box.innerHTML = ''; return; }
    const picks = occ.suggest.map(Store.byId).filter(Boolean);
    box.hidden = false;
    box.innerHTML = '<div class="container">' +
      '<div class="section-head">' +
        '<div><h2>هدايا مقترحة — ' + esc(occ.ar) + '</h2><p class="sh-sub">' + esc(occ.desc) + ' — مختارات بعناية من دار الأُمراء</p></div>' +
        '<a class="sec-link" href="shop.html?cat=gifts">أطقم الهدايا <svg class="ic"><use href="#i-chevron-left"/></svg></a>' +
      '</div>' +
      '<div class="grid-cards">' + picks.map(p => UI.productCard(p)).join('') + '</div></div>';
    UI.bindReveal(box); UI.syncWishBtns();
    if (scroll) {
      const top = box.getBoundingClientRect().top + window.scrollY - 90;
      window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    }
  }

  /* ---------- أطقم الهدايا ---------- */
  function setFeature(p) {
    const so = Store.sizeOf(p), st = Store.statsFor(p);
    return '<div class="gset panel-card gold-edge">' +
      '<div class="gset-media">' + Art.product(p) + '</div>' +
      '<div class="gset-info">' +
        '<span class="fm-brand">' + esc((BRANDS[p.brand] || {}).ar || '') + '</span>' +
        '<h3 class="gset-name"><a href="product.html?id=' + p.id + '">' + esc(p.name_ar) + '</a></h3>' +
        '<div class="fm-rate">' + UI.stars(st.rating) + '<span class="rating-count">' + st.count + ' تقييمًا</span></div>' +
        '<p class="gset-desc">' + esc(p.description_ar || p.short_ar) + '</p>' +
        '<div class="chips">' +
          '<span class="chip"><svg class="ic ic-xs"><use href="#i-layers"/></svg> ' + esc(DICT.concentrations[p.concentration] || p.concentration) + '</span>' +
          '<span class="chip"><svg class="ic ic-xs"><use href="#i-gift"/></svg> يصل جاهزًا للإهداء</span>' +
          '<span class="chip"><svg class="ic ic-xs"><use href="#i-sparkles"/></svg> علبة ملكية وشريط ذهبي</span>' +
        '</div>' +
        '<div class="fm-buy">' +
          '<div class="fm-price-wrap"><b class="fm-price">' + price(so.price) + '</b><small>' + esc(Store.sizeLabel(so)) + '</small></div>' +
          (p.stock > 0
            ? '<button class="btn btn-gold" type="button" data-add="' + p.id + '" data-size="' + so.ml + '"><svg class="ic ic-xs"><use href="#i-cart"/></svg> أضف إلى السلة</button>'
            : '<button class="btn btn-outline" type="button" data-notify="' + p.id + '"><svg class="ic ic-xs"><use href="#i-bell"/></svg> أبلغني عند التوفّر</button>') +
          '<a class="btn btn-outline" href="product.html?id=' + p.id + '">عرض التفاصيل</a>' +
          '<button class="icon-btn round" type="button" data-wish="' + p.id + '" aria-label="أضف إلى المفضلة"><svg class="ic"><use href="#i-heart"/></svg></button>' +
        '</div>' +
      '</div>' +
    '</div>';
  }
  function renderSets() {
    const box = qs('#giftSets'); if (!box) return;
    box.removeAttribute('aria-busy');
    const sets = Store.products().filter(p => (p.categories || []).indexOf('gifts') > -1);
    if (sets.length) {
      box.innerHTML = sets.map(setFeature).join('');
    } else {
      const top = Store.products().filter(p => p.bestsellerRank).sort((a, b) => a.bestsellerRank - b.bestsellerRank)[0];
      box.innerHTML = top ? setFeature(top) : '';
    }
  }

  /* ---------- الأكثر رواجًا ---------- */
  function renderTop() {
    const rail = qs('#railGiftTop'); if (!rail) return;
    const picks = Store.products()
      .filter(p => p.bestsellerRank)
      .sort((a, b) => a.bestsellerRank - b.bestsellerRank)
      .slice(0, 8);
    rail.innerHTML = (picks.length ? picks : Store.products().slice(0, 8)).map(p => UI.productCard(p)).join('');
    UI.bindReveal(rail);
    UI.syncWishBtns();
    UI.rails();
  }

  /* ---------- الأحداث ---------- */
  const saveGift = Store.debounce(function (v) { patchExtra({ gift: v }); }, 500);

  function wire() {
    document.addEventListener('change', function (e) {
      const t = e.target;
      if (t.id === 'gfPack') {
        patchExtra({ packaging: t.checked });
        const c = t.closest('.opt-card');
        if (c) c.classList.toggle('on', t.checked);
        UI.toast(t.checked ? 'أُضيف التغليف الفاخر إلى طلبك' : 'أُلغي التغليف الفاخر', t.checked ? 'success' : 'info', 2200);
      }
    });
    document.addEventListener('input', function (e) {
      const t = e.target;
      if (t.id === 'gfMsg') {
        const cnt = qs('#gfCount');
        if (cnt) cnt.textContent = t.value.length;
        saveGift(t.value);
      }
    });
    document.addEventListener('click', function (e) {
      const t = e.target;

      const occ = t.closest('[data-occ]');
      if (occ) {
        activeOcc = activeOcc === occ.dataset.occ ? null : occ.dataset.occ;
        renderOcc();
        renderPicks(!!activeOcc);
        return;
      }
      if (t.closest('[data-open-cart]')) {
        if (!Store.itemCount()) {
          UI.toast('سلتك فارغة — اختر عطرًا من الاقتراحات ثم عد لإتمام الهدية', 'info', 3000);
          return;
        }
        UI.openPanel('cartDrawer');
        return;
      }
    });
  }

  Store.onReady(function () {
    wire();
    renderBox();
    renderOcc();
    renderSets();
    renderTop();
    Store.on('cart', syncCartBtn);
    Store.on('cartExtras', function () { if (!mine) syncBox(); });
  });
})();
