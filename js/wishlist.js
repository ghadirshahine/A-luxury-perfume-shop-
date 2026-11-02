/* ============================================================
   دار الأُمراء — DAR AL-UMARA  |  js/wishlist.js
   قائمة المفضلة: حفظ العطور، مراقبة انخفاض الأسعار، حالة التوفّر،
   نقل إلى السلة، حذف، وإضافة الكل بضغطة واحدة + توصيات.
   ============================================================ */
(function () {
  'use strict';
  const esc = Store.esc, price = Store.price, qs = UI.qs;

  function rows() {
    return Store.wishlist().map(w => ({ w: w, p: Store.byId(w.pid) })).filter(x => x.p);
  }

  /* ---------- صف المفضلة ---------- */
  function rowHTML(x) {
    const w = x.w, p = x.p;
    const so = Store.sizeOf(p);
    const drop = Store.wishPriceDrop(w);
    const save = drop ? (w.priceAt - p.price) : 0;
    const st = Store.statsFor(p);
    const oos = p.stock === 0;
    return '<article class="wrow reveal" data-pid="' + p.id + '">' +
      '<a class="wrow-art" href="product.html?id=' + p.id + '" aria-hidden="true" tabindex="-1">' + Art.product(p, { compact: true }) + '</a>' +
      '<div class="wrow-info">' +
        '<h3><a href="product.html?id=' + p.id + '">' + esc(p.name_ar) + '</a></h3>' +
        '<span class="wrow-cat">' + esc((BRANDS[p.brand] || {}).ar || '') + ' · ' + esc(DICT.concentrations[p.concentration] || '') + ' · ' + esc(Store.sizeLabel(so)) + '</span>' +
        '<div class="wrow-meta">' + UI.stars(st.rating) + '<span class="rating-count">' + st.count + ' تقييمًا</span>' +
          (drop ? '<span class="drop-tag"><svg class="ic"><use href="#i-chevron-down"/></svg> انخفض السعر — وفّر ' + price(save) + '</span>' : '') +
        '</div>' +
        '<div class="wrow-price">' + price(so.price) + (drop ? ' <s>' + price(w.priceAt) + '</s>' : '') + '</div>' +
      '</div>' +
      '<div class="wrow-side">' +
        (oos
          ? '<span class="st-pill st-out">نفدت الكمية مؤقتًا</span>'
          : '<span class="st-pill st-ok"><svg class="ic ic-xs"><use href="#i-check"/></svg> متوفر — يوصل خلال 24 ساعة</span>') +
        '<div class="wrow-actions">' +
          (oos
            ? '<button class="btn btn-outline btn-sm" type="button" data-notify="' + p.id + '"><svg class="ic ic-xs"><use href="#i-bell"/></svg> أبلغني عند التوفّر</button>'
            : '<button class="btn btn-gold btn-sm" type="button" data-wadd="' + p.id + '"><svg class="ic ic-xs"><use href="#i-cart"/></svg> أضف إلى السلة</button>') +
          '<a class="btn btn-ghost btn-sm" href="product.html?id=' + p.id + '">التفاصيل</a>' +
          '<button class="icon-btn" type="button" data-wremove="' + p.id + '" aria-label="إزالة من المفضلة"><svg class="ic ic-sm"><use href="#i-trash"/></svg></button>' +
        '</div>' +
      '</div></article>';
  }

  /* ---------- التوصيات ---------- */
  function renderReco(list) {
    const rail = qs('#railWishRec'), sec = qs('#wishReco');
    if (!rail || !sec) return;
    const inWish = {};
    list.forEach(x => { inWish[x.p.id] = 1; });
    const picks = Store.forYou(12).filter(p => !inWish[p.id]).slice(0, 8);
    if (!picks.length) { sec.hidden = true; return; }
    sec.hidden = false;
    rail.innerHTML = picks.map(p => UI.productCard(p)).join('');
    UI.bindReveal(rail);
    UI.syncWishBtns();
    UI.rails();
  }

  /* ---------- العرض ---------- */
  function render() {
    const wrap = qs('#wishList'); if (!wrap) return;
    const list = rows();
    const sub = qs('#wishSub'), addAllBtn = qs('#wishAddAll'), reco = qs('#wishReco');
    wrap.removeAttribute('aria-busy');

    if (!list.length) {
      document.title = 'قائمة المفضلة | دار الأُمراء';
      if (sub) sub.textContent = 'احفظ العطور التي تعجبك هنا — نراقب الأسعار ونُعلمك فور أي انخفاض.';
      if (addAllBtn) addAllBtn.hidden = true;
      wrap.innerHTML = '<div class="cart-empty wish-empty">' +
        '<svg class="ic"><use href="#i-heart"/></svg>' +
        '<h3>مفضلتك فارغة حاليًا</h3>' +
        '<p>اضغط أيقونة القلب على أي عطر لتحفظه هنا — ونتابع سعره وتوفّره معك.</p>' +
        '<a class="btn btn-gold btn-lg" href="shop.html">اكتشف العطور</a></div>';
      if (reco) reco.hidden = true;
      return;
    }

    document.title = 'المفضلة (' + list.length + ') | دار الأُمراء';
    const drops = list.filter(x => Store.wishPriceDrop(x.w));
    const oosN = list.filter(x => x.p.stock === 0).length;

    if (sub) {
      sub.textContent = 'لديك ' + list.length + (list.length === 1 ? ' عطر محفوظ' : ' عطور محفوظة') +
        (drops.length ? ' — أحدها بسعر أقل الآن!' : ' — نراقب الأسعار نيابة عنك.') +
        (oosN ? ' (' + oosN + ' بانتظار التوفّر)' : '');
    }
    if (addAllBtn) addAllBtn.hidden = false;

    const banner = drops.length
      ? '<div class="alert alert-success"><svg class="ic"><use href="#i-chevron-down"/></svg><p><b>أخبار سارة!</b> انخفض سعر ' +
        drops.length + (drops.length === 1 ? ' عطر ' : ' عطور ') + 'من مفضلتك — اغتنم الفرصة قبل انتهاء العرض.</p></div>'
      : '<div class="alert alert-info"><svg class="ic"><use href="#i-bell"/></svg><p><b>مراقبة الأسعار مفعّلة</b> نحفظ سعر كل عطر عند إضافته للمفضلة، ونُعلمك فور أي انخفاض أو عودة إلى التوفّر.</p></div>';

    wrap.innerHTML = banner + '<div class="wish-list">' + list.map(rowHTML).join('') + '</div>';
    renderReco(list);
    UI.bindReveal(wrap);
    UI.syncWishBtns();
  }

  /* ---------- إضافة الكل إلى السلة ---------- */
  function addAll() {
    const list = rows().filter(x => x.p.stock > 0);
    if (!list.length) { UI.toast('لا توجد عطور متوفرة حاليًا في مفضلتك', 'info'); return; }
    list.forEach(x => Store.wishMove(x.p.id));
    UI.toast('أُضيف ' + list.length + (list.length === 1 ? ' عطر ' : ' عطور ') + 'إلى سلتك', 'success');
    UI.openPanel('cartDrawer');
  }

  /* ---------- الأحداث ---------- */
  document.addEventListener('click', function (e) {
    const rm = e.target.closest('[data-wremove]');
    if (rm) {
      Store.removeWish(rm.dataset.wremove);
      UI.toast('أُزيل العطر من المفضلة', 'info', 2000);
      return;
    }
    const add = e.target.closest('[data-wadd]');
    if (add) {
      Store.wishMove(add.dataset.wadd);
      UI.toast('نُقل العطر إلى سلتك', 'success');
      UI.openPanel('cartDrawer');
      return;
    }
    if (e.target.closest('#wishAddAll')) addAll();
  });

  Store.onReady(function () {
    render();
    Store.on('wish', render);
    Store.on('products', render);
  });
})();
