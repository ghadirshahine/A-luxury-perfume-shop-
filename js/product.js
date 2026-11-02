/* ============================================================
   دار الأُمراء — DAR AL-UMARA  |  js/product.js
   صفحة المنتج: المعرض مع التكبير، الأحجام والكمية، الهرم العطري،
   التقييمات والمراجعات مع رفع صورة، التوصيات، وبيانات SEO.
   ============================================================ */
(async function () {
  'use strict';
  await Store.ready();
  const esc = Store.esc, price = Store.price, qs = UI.qs, qsa = UI.qsa;
  const pid = UI.param('id') || (Store.products()[0] || {}).id;
  const p = Store.byId(pid);

  const MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  function fmtDate(d) {
    const parts = String(d || '').split('-');
    if (parts.length !== 3) return d || '';
    return Number(parts[2]) + ' ' + (MONTHS[Number(parts[1]) - 1] || '') + ' ' + parts[0];
  }
  function ld(obj) {
    const s = document.createElement('script');
    s.type = 'application/ld+json';
    s.textContent = JSON.stringify(obj);
    document.head.appendChild(s);
  }

  /* ---------- منتج غير موجود ---------- */
  if (!p) {
    const top = qs('#pdpTop');
    if (top) top.innerHTML = '<div class="empty-state" style="grid-column:1/-1"><svg class="ic"><use href="#i-search"/></svg>' +
      '<h3>لم نجد هذا العطر</h3><p>قد يكون الرابط قديمًا — تصفّح المتجر لاكتشاف عطورنا الفاخرة.</p>' +
      '<a class="btn btn-gold" href="shop.html">تصفّح المتجر</a></div>';
    return;
  }

  let size = p.sizes[0].ml;
  let qty = 1;
  let starsSel = 5;
  let photoData = null;
  let showAll = false;

  /* ---------- المعرض ---------- */
  function moodSVG() {
    return '<svg class="art" viewBox="0 0 400 400" role="img" aria-label="' + esc(p.name_ar) + ' — هوية بصرية" xmlns="http://www.w3.org/2000/svg">' +
      '<defs><radialGradient id="moodg" cx="50%" cy="40%" r="65%">' +
      '<stop offset="0%" stop-color="#CBAA6C" stop-opacity="0.3"/><stop offset="100%" stop-color="#CBAA6C" stop-opacity="0"/>' +
      '</radialGradient></defs>' +
      '<rect width="400" height="400" fill="#12100D"/><rect width="400" height="400" fill="url(#moodg)"/>' +
      '<g fill="none" stroke="#CBAA6C" stroke-width="1.1" opacity="0.85">' +
      '<circle cx="200" cy="180" r="86" opacity="0.5"/><circle cx="200" cy="180" r="66" stroke-dasharray="2 5"/>' +
      '<circle cx="200" cy="180" r="46" opacity="0.6"/></g>' +
      '<text x="200" y="194" text-anchor="middle" font-family="Amiri, serif" font-size="42" fill="#E8D3A3">أ</text>' +
      '<text x="200" y="304" text-anchor="middle" font-family="Tajawal, sans-serif" font-size="24" fill="#F6F0E6">' + esc(p.name_ar) + '</text>' +
      '<text x="200" y="336" text-anchor="middle" font-family="Cormorant Garamond, serif" font-size="12" letter-spacing="6" fill="#CBAA6C">' + esc(String(p.name_en || '').toUpperCase()) + '</text>' +
      '</svg>';
  }
  const SLIDES = (p.images && p.images.length ? p.images : [{ art: 'bottle' }]).map(im =>
    im.url ? '<img class="art" src="' + esc(im.url) + '" alt="' + esc(im.alt || p.name_ar) + '">' :
      im.art === 'box' ? Art.box(p) : im.art === 'mood' ? moodSVG() : Art.product(p));
  let slide = 0;

  function badgesOverlay() {
    let out = '';
    (p.badges || []).forEach(b => { if (UI.BADGE_AR[b]) out += '<span class="badge badge-' + b + '">' + UI.BADGE_AR[b] + '</span>'; });
    if (p.stock === 0) out += '<span class="badge badge-oos">نفدت الكمية</span>';
    return out ? '<div class="badges">' + out + '</div>' : '';
  }

  /* ---------- العمود العلوي ---------- */
  function setSlide(i) {
    slide = i;
    const cur = qs('#galCurrent');
    if (cur) cur.innerHTML = SLIDES[i];
    qsa('[data-slide]').forEach(b => {
      const on = Number(b.dataset.slide) === i;
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', String(on));
    });
  }
  function wireZoom() {
    const gm = qs('#galleryMain');
    if (!gm || gm._zoom || !window.matchMedia('(hover: hover)').matches) return;
    gm._zoom = true;
    gm.addEventListener('mousemove', e => {
      const r = gm.getBoundingClientRect();
      gm.style.setProperty('--zx', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%');
      gm.style.setProperty('--zy', ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%');
      gm.classList.add('zoom');
    });
    gm.addEventListener('mouseleave', () => gm.classList.remove('zoom'));
  }

  function priceHTML() { return UI.priceBlock(p, size); }
  function sizesHTML() {
    return p.sizes.map(s =>
      '<button class="chip' + (s.ml === size ? ' on' : '') + '" role="radio" aria-checked="' + (s.ml === size) + '" data-pdp-size="' + s.ml + '">' +
      esc(Store.sizeLabel(s)) + ' — ' + price(s.price) + '</button>').join('');
  }
  function stockHTML() {
    if (p.stock === 0) return '<p class="pdp-stock out"><svg class="ic ic-xs"><use href="#i-x-circle"/></svg> نفدت الكمية — أبلغنا لنعلمك فور توفره</p>';
    if (p.stock <= 5) return '<p class="pdp-stock low"><svg class="ic ic-xs"><use href="#i-alert"/></svg> آخر ' + p.stock + ' قطع متوفرة</p>';
    return '<p class="pdp-stock ok"><svg class="ic ic-xs"><use href="#i-check-circle"/></svg> متوفر — جاهز للشحن خلال 24 ساعة</p>';
  }
  function topHTML() {
    const brand = BRANDS[p.brand] || {};
    const st = Store.statsFor(p);
    const fams = (p.tags.families || []).map(f => DICT.families[f] || f).slice(0, 4);
    const occ = (p.tags.occasions || []).map(o => DICT.occasions[o] || o).slice(0, 3);
    const genders = (p.tags.gender || []).map(g => DICT.genders[g] || g);
    const waMsg = 'مرحبًا دار الأُمراء، أستفسر عن عطر «' + p.name_ar + '» (' + (p.name_en || '') + ') — الرمز ' + p.id.toUpperCase() + '، السعر ' + price(Store.sizeOf(p, size).price) + '.';

    return '<div class="pdp-media">' +
      '<div class="gallery-main" id="galleryMain">' + badgesOverlay() +
      '<div class="gal-current" id="galCurrent">' + SLIDES[0] + '</div></div>' +
      '<div class="thumbs" role="group" aria-label="صور العطر">' +
      SLIDES.map((s, i) => '<button class="thumb' + (i === 0 ? ' on' : '') + '" type="button" data-slide="' + i + '" aria-pressed="' + (i === 0) + '" aria-label="الصورة ' + (i + 1) + '">' + s + '</button>').join('') +
      '</div></div>' +

      '<div class="pdp-info">' +
      '<span class="pdp-brand"><a href="shop.html?brand=' + p.brand + '">' + esc(brand.ar || '') + '</a> <i>|</i> ' + esc(brand.en || '') + '</span>' +
      '<h1 class="pdp-name">' + esc(p.name_ar) + '</h1>' +
      '<p class="pdp-en">' + esc(p.name_en || '') + ' · ' + esc(DICT.concentrations[p.concentration] || '') + '</p>' +
      '<div class="pdp-rating">' + UI.stars(st.rating) + '<a class="rating-count" href="#reviews">' + st.count + ' تقييمًا — اقرأ المراجعات</a></div>' +
      '<div class="pdp-badges"><span class="rev-tag">' + esc(DICT.concentrations[p.concentration] || '') + '</span>' +
      fams.map(f => '<span class="rev-tag">' + esc(f) + '</span>').join('') +
      genders.map(g => '<span class="rev-tag">' + esc(g) + '</span>').join('') + '</div>' +
      '<div id="pdpPrice">' + priceHTML() + '</div>' +
      '<p class="pdp-desc">' + esc(p.short_ar) + '</p>' +
      '<div class="pdp-field"><span class="qv-label">الحجم</span><div class="chips" role="radiogroup" aria-label="اختر الحجم" id="pdpSizes">' + sizesHTML() + '</div></div>' +
      '<div class="pdp-row"><div class="qty" role="group" aria-label="الكمية">' +
      '<button type="button" data-pdp-minus aria-label="إنقاص الكمية"><svg class="ic ic-xs"><use href="#i-minus"/></svg></button>' +
      '<output id="pdpQty" aria-live="polite">1</output>' +
      '<button type="button" data-pdp-plus aria-label="زيادة الكمية"><svg class="ic ic-xs"><use href="#i-plus"/></svg></button></div>' +
      stockHTML() + '</div>' +
      '<div class="pdp-cta">' +
      (p.stock === 0
        ? '<button class="btn btn-gold btn-lg" id="pdpNotify" data-notify="' + p.id + '"><svg class="ic ic-sm"><use href="#i-bell"/></svg> أبلغني عند التوفّر</button>'
        : '<button class="btn btn-gold btn-lg" id="pdpAdd"><svg class="ic ic-sm"><use href="#i-cart"/></svg> أضف إلى السلة</button>' +
        '<button class="btn btn-ivory btn-lg" id="pdpBuy"><svg class="ic ic-sm"><use href="#i-check"/></svg> اشترِ الآن</button>') +
      '<button class="icon-btn round" data-wish="' + p.id + '" aria-label="أضف إلى المفضلة"><svg class="ic"><use href="#i-heart"/></svg></button>' +
      '<button class="icon-btn round" data-share="' + esc(p.name_ar) + '" data-share-text="' + esc(p.short_ar) + '" aria-label="شارك العطر"><svg class="ic"><use href="#i-share"/></svg></button>' +
      '</div>' +
      '<a class="pdp-wa" href="' + UI.waLink(waMsg) + '" target="_blank" rel="noopener"><svg class="ic"><use href="#i-whatsapp"/></svg> اسأل عن هذا العطر عبر واتساب</a>' +
      '<dl class="pdp-meta">' +
      kv('رمز المنتج', p.id.toUpperCase()) + kv('التركيز', DICT.concentrations[p.concentration] || '') +
      kv('العائلة العطرية', fams.join('، ')) + kv('المناسبة', occ.join('، ')) +
      kv('الشحن', 'توصيل سريع داخل سوريا — مجاني للطلبات فوق ' + Store.settings().freeShippingThreshold + ' د.ك') +
      kv('الإرجاع', 'إرجاع مجاني خلال 14 يومًا') +
      '</dl>' +
      '</div>';
  }
  function kv(k, v) { return '<div class="kv"><dt>' + esc(k) + '</dt><dd>' + esc(v) + '</dd></div>'; }

  /* ---------- الهرم العطري ---------- */
  function noteCards(list) {
    return (list || []).map(n => {
      const d = NOTES_DICT[n] || { ar: n, desc: '' };
      return '<div class="note-card"><b>' + esc(d.ar) + '</b><small>' + esc(d.desc) + '</small></div>';
    }).join('');
  }
  function metersHTML() {
    const pct = v => Math.round((Number(v) || 0) / 5 * 100);
    const pctAr = v => ({ 1: 'خفيف جدًا', 2: 'خفيف', 3: 'متوسط', 4: 'قوي', 5: 'قوي جدًا' }[Math.round(Number(v))] || '—');
    const st = Store.statsFor(p);
    return '<div class="meter-block"><div class="meter-row"><span>الثبات (Longevity)</span><b>' + pctAr(p.longevity) + '</b></div>' +
      '<div class="meter"><i style="width:' + pct(p.longevity) + '%"></i></div></div>' +
      '<div class="meter-block"><div class="meter-row"><span>الفوحان (Sillage)</span><b>' + pctAr(p.sillage) + '</b></div>' +
      '<div class="meter"><i style="width:' + pct(p.sillage) + '%"></i></div></div>' +
      (st.longevityAvg ? '<p class="rev-agg">متوسط تقييم العملاء: ثبات ' + st.longevityAvg + '/5 · فوحان ' + st.sillageAvg + '/5</p>' : '');
  }
  function notesHTML() {
    const fams = (p.tags.families || []).map(f => DICT.families[f] || f);
    const seasons = (p.tags.seasons || []).map(s => DICT.seasons[s] || s);
    return '<div class="section-head reveal"><div class="sh-txt"><p class="eyebrow">تشريح العطر</p><h2>الهرم العطري</h2>' +
      '<p class="sh-sub">رحلة الرائحة من أول بخة حتى آخر لمسة على البشرة.</p></div></div>' +
      '<div class="pdp-notes-grid">' +
      '<div class="pyr">' +
      '<div class="pyr-tier tier-top"><div class="pyr-head"><b>النوتات العليا</b><small>Top Notes</small></div><div class="pyr-notes">' + noteCards(p.notes.top) + '</div></div>' +
      '<div class="pyr-tier tier-middle"><div class="pyr-head"><b>قلب العطر</b><small>Heart Notes</small></div><div class="pyr-notes">' + noteCards(p.notes.middle) + '</div></div>' +
      '<div class="pyr-tier tier-base"><div class="pyr-head"><b>النوتات الأساسية</b><small>Base Notes</small></div><div class="pyr-notes">' + noteCards(p.notes.base) + '</div></div>' +
      '</div>' +
      '<div class="pdp-meters">' +
      '<div class="panel-card"><h3>الأداء العطري</h3>' + metersHTML() + '</div>' +
      '<div class="panel-card"><h3>عن هذا العطر</h3><p>' + esc(p.description_ar) + '</p>' +
      '<div class="chips">' + fams.map(f => '<span class="chip">' + esc(f) + '</span>').join('') +
      seasons.map(s => '<span class="chip">' + esc(s) + '</span>').join('') + '</div></div>' +
      '</div></div>';
  }

  /* ---------- التقييمات ---------- */
  function summaryHTML() {
    const st = Store.statsFor(p);
    const max = Math.max.apply(null, st.dist.concat([1]));
    const bars = st.dist.map((n, i) => {
      const star = 5 - i;
      return '<div class="rev-bar"><span>' + star + ' ★</span><span class="bar"><i style="width:' + Math.round(n / max * 100) + '%"></i></span><span>' + n + '</span></div>';
    }).join('');
    return '<div class="rev-avg"><b>' + st.rating.toFixed(1) + '</b>' + UI.stars(st.rating) +
      '<small>' + st.count + ' تقييمًا · ' + st.recommendPct + '% يوصون به</small></div>' +
      '<div><div class="rev-bars">' + bars + '</div>' +
      (st.longevityAvg ? '<p class="rev-agg">متوسط تجربة المشترين: الثبات ' + st.longevityAvg + '/5 · الفوحان ' + st.sillageAvg + '/5</p>' : '') +
      '</div>';
  }
  function reviewCard(r) {
    const long = r.longevity ? '<span class="rev-tag">الثبات: ' + (DICT.strengths[r.longevity] || '') + '</span>' : '';
    const sill = r.sillage ? '<span class="rev-tag">الفوحان: ' + (DICT.strengths[r.sillage] || '') + '</span>' : '';
    const rec = r.recommend !== false ? '<span class="rev-tag">يوصي بالعطر ✓</span>' : '<span class="rev-tag">لا يوصي به</span>';
    const photo = (r.photo && /^data:image\//.test(r.photo)) ? '<div class="rev-photos"><img src="' + r.photo + '" alt="صورة مرفقة من مراجعة ' + esc(r.name || '') + '" loading="lazy"></div>' : '';
    const help = r.uid
      ? '<button class="rev-help" type="button" data-rev-helpful="' + r.uid + '"><svg class="ic"><use href="#i-check"/></svg> مفيد (' + (r.helpful || 0) + ')</button>'
      : '<span class="rev-help" style="border-style:dashed;cursor:default"><svg class="ic"><use href="#i-check"/></svg> مفيد (' + (r.helpful || 0) + ')</span>';
    return '<article class="rev-card reveal in">' +
      '<div class="rev-head"><span class="rev-avatar" aria-hidden="true">' + esc(String(r.name || 'ز').trim().charAt(0)) + '</span>' +
      '<div class="rh-txt"><b>' + esc(r.name || 'عميل دار الأُمراء') + '</b><small>' + esc(fmtDate(r.date)) + '</small></div>' +
      (r.verified !== false ? '<span class="rev-verify"><svg class="ic"><use href="#i-check-circle"/></svg> مشترٍ موثّق</span>' : '') +
      '</div>' +
      '<div class="rev-stars">' + UI.stars(r.rating) + '</div>' +
      '<p class="rev-text">' + esc(r.text) + '</p>' +
      '<div class="rev-tags">' + long + sill + rec + '</div>' + photo +
      '<div class="rev-foot">' + help + '</div></article>';
  }
  function renderList() {
    const wrap = qs('#revList'); if (!wrap) return;
    const all = Store.statsFor(p).list;
    const shown = showAll ? all : all.slice(0, 4);
    wrap.innerHTML = shown.length
      ? '<div class="rev-list">' + shown.map(reviewCard).join('') + '</div>' +
      (all.length > 4 ? '<div class="rev-more-wrap"><button class="btn btn-outline" type="button" id="revMore">' + (showAll ? 'عرض أقل' : 'عرض كل المراجعات (' + all.length + ')') + '</button></div>' : '')
      : '<div class="empty-state"><svg class="ic"><use href="#i-star8"/></svg><h3>كن أول من يقيّم هذا العطر</h3><p>شاركنا تجربتك وساعد غيرك على الاختيار — واحصل على نقاط نادي العطور.</p></div>';
  }
  function updateSummary() { const s = qs('#revSummary'); if (s) s.innerHTML = summaryHTML(); }
  function reviewsHTML() {
    const acc = Store.account();
    return '<div class="section-head reveal"><div class="sh-txt"><p class="eyebrow">تجارب حقيقية</p><h2>التقييمات والمراجعات</h2></div>' +
      '<button class="btn btn-outline btn-sm" type="button" id="goWrite"><svg class="ic ic-xs"><use href="#i-edit"/></svg> اكتب مراجعتك</button></div>' +
      '<div class="rev-wrap">' +
      '<div class="rev-summary reveal" id="revSummary"></div>' +
      '<form class="panel-card rev-form" id="revForm" novalidate>' +
      '<h3>شاركنا تجربتك</h3>' +
      '<div class="field"><span class="field-label">تقييمك <span class="req">*</span></span>' +
      '<div class="star-input" id="rfStars" role="radiogroup" aria-label="اختر تقييمًا من 5">' +
      [1, 2, 3, 4, 5].map(i => '<button type="button" role="radio" aria-checked="' + (i === 5) + '" data-rstar="' + i + '" class="' + (i <= 5 ? 'on' : '') + '" aria-label="' + i + ' نجوم"><svg class="ic"><use href="#i-star"/></svg></button>').join('') +
      '</div></div>' +
      '<div class="form-2col">' +
      '<div class="field"><label for="rfName">الاسم</label><input class="input" id="rfName" type="text" maxlength="40" value="' + esc(acc ? acc.name : '') + '" placeholder="اسمك (اختياري)"></div>' +
      '<div class="field"><label for="rfPhoto">صورة (اختياري)</label>' +
      '<label class="upload-box" for="rfPhoto"><svg class="ic"><use href="#i-camera"/></svg> أضف صورة للعطر<input type="file" id="rfPhoto" accept="image/*"></label></div>' +
      '</div>' +
      '<div class="upload-previews" id="rfPreview"></div>' +
      '<div class="field"><label for="rfText">مراجعتك <span class="req">*</span></label>' +
      '<textarea class="textarea" id="rfText" maxlength="600" placeholder="كيف كانت تجربتك مع العطر؟ الثبات، الفوحان، المناسبة..."></textarea>' +
      '<p class="hint">اكتب 10 أحرف على الأقل — وستحصل على ' + STORE_CONFIG.loyalty.review + ' نقطة في نادي العطور.</p></div>' +
      '<div class="form-2col">' +
      '<div class="field"><label for="rfLong">مدى الثبات</label><select class="select" id="rfLong">' +
      [1, 2, 3, 4, 5].map(i => '<option value="' + i + '"' + (i === 4 ? ' selected' : '') + '>' + DICT.strengths[i] + '</option>').join('') + '</select></div>' +
      '<div class="field"><label for="rfSill">قوة الفوحان</label><select class="select" id="rfSill">' +
      [1, 2, 3, 4, 5].map(i => '<option value="' + i + '"' + (i === 4 ? ' selected' : '') + '>' + DICT.strengths[i] + '</option>').join('') + '</select></div>' +
      '</div>' +
      '<label class="check" style="margin-bottom:var(--s-4)"><input type="checkbox" id="rfRec" checked> أوصي بهذا العطر</label>' +
      '<button class="btn btn-gold" type="submit" id="rfSubmit"><svg class="ic ic-sm"><use href="#i-star"/></svg> نشر المراجعة</button>' +
      '</form>' +
      '<div id="revList"></div>' +
      '</div>';
  }
  function submitReview() {
    const name = (qs('#rfName').value || '').trim() || 'عميل دار الأُمراء';
    const text = (qs('#rfText').value || '').trim();
    if (text.length < 10) { UI.toast('اكتب مراجعة من 10 أحرف على الأقل', 'error'); qs('#rfText').focus(); return; }
    Store.addReview(p.id, {
      name: name, rating: starsSel, text: text,
      longevity: Number(qs('#rfLong').value), sillage: Number(qs('#rfSill').value),
      recommend: qs('#rfRec').checked, photo: photoData || undefined
    });
    const reason = 'كتابة تقييم — ' + p.name_ar;
    if (!Store.ledger().some(e => e.reason === reason)) {
      Store.addPoints(reason, STORE_CONFIG.loyalty.review);
      UI.toast('شكرًا! حصلت على ' + STORE_CONFIG.loyalty.review + ' نقطة في نادي العطور', 'success');
    } else {
      UI.toast('شكرًا على تحديث تجربتك!', 'success');
    }
    qs('#rfText').value = ''; photoData = null;
    const prev = qs('#rfPreview'); if (prev) prev.innerHTML = '';
    showAll = true; renderList(); updateSummary();
    const list = qs('#revList');
    if (list) window.scrollTo({ top: list.getBoundingClientRect().top + window.scrollY - 120, behavior: 'smooth' });
  }

  /* ---------- التوصيات ---------- */
  function renderSimilar() {
    const sec = qs('#pdpSimilarSec'), wrap = qs('#pdpSimilar');
    const sim = Store.similarTo(p.id, 8);
    if (!sim.length || !wrap) return;
    wrap.innerHTML = '<div class="section-head reveal"><div class="sh-txt"><p class="eyebrow">اختيارات قريبة من ذوقك</p><h2>عطور مشابهة</h2></div>' +
      '<a class="sec-link" href="shop.html?family=' + (p.tags.families[0] || '') + '">تصفّح المزيد <svg class="ic"><use href="#i-chevron-left"/></svg></a></div>' +
      '<div class="rail-wrap"><button class="rail-btn next" type="button" data-rail="railSim" data-dir="next" aria-label="التالي"><svg class="ic"><use href="#i-chevron-left"/></svg></button>' +
      '<button class="rail-btn prev" type="button" data-rail="railSim" data-dir="prev" aria-label="السابق"><svg class="ic"><use href="#i-chevron-right"/></svg></button>' +
      '<div class="rail" id="railSim">' + sim.map(x => UI.productCard(x)).join('') + '</div></div>';
    sec.hidden = false;
  }
  function renderAlso() {
    const sec = qs('#pdpAlsoSec'), wrap = qs('#pdpAlso');
    const list = Store.alsoBought(p.id, 4);
    if (!list.length || !wrap) return;
    wrap.innerHTML = '<div class="section-head reveal"><div class="sh-txt"><p class="eyebrow">يقتنونها معًا</p><h2>عملاء اشتروا هذا المنتج اشتروا أيضًا</h2></div></div>' +
      '<div class="grid-cards">' + list.map(x => UI.productCard(x)).join('') + '</div>';
    sec.hidden = false;
  }

  /* ---------- SEO ---------- */
  function injectSEO() {
    const brand = BRANDS[p.brand] || {};
    const st = Store.statsFor(p);
    const so = Store.sizeOf(p, size);
    document.title = p.name_ar + ' — ' + (brand.ar || '') + ' | دار الأُمراء';
    const mdesc = document.querySelector('meta[name="description"]');
    const desc = p.short_ar + ' — ' + String(p.description_ar || '').slice(0, 130);
    if (mdesc) mdesc.setAttribute('content', desc);
    const ogt = document.querySelector('meta[property="og:title"]');
    if (ogt) ogt.setAttribute('content', p.name_ar + ' — ' + (brand.ar || ''));
    const ogd = document.querySelector('meta[property="og:description"]');
    if (ogd) ogd.setAttribute('content', desc);
    ld({
      '@context': 'https://schema.org', '@type': 'Product',
      name: p.name_ar, alternateName: p.name_en, sku: p.id.toUpperCase(),
      description: p.description_ar,
      brand: { '@type': 'Brand', name: brand.ar || '' },
      image: ['https://dar-alumara.example.com/images/hero.jpg'],
      offers: {
        '@type': 'Offer', priceCurrency: 'KWD', price: so.price.toFixed(3),
        availability: p.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
        url: 'https://dar-alumara.example.com/product.html?id=' + p.id
      },
      aggregateRating: { '@type': 'AggregateRating', ratingValue: String(st.rating), reviewCount: st.count }
    });
    const cats = CATEGORIES.filter(c => (p.categories || []).includes(c.id)).slice(0, 1);
    const crumb = [{ '@type': 'ListItem', position: 1, name: 'الرئيسية', item: 'https://dar-alumara.example.com/' },
    { '@type': 'ListItem', position: 2, name: 'المتجر', item: 'https://dar-alumara.example.com/shop.html' }];
    if (cats.length) crumb.push({ '@type': 'ListItem', position: 3, name: cats[0].ar, item: 'https://dar-alumara.example.com/shop.html?category=' + cats[0].id });
    crumb.push({ '@type': 'ListItem', position: crumb.length + 1, name: p.name_ar, item: 'https://dar-alumara.example.com/product.html?id=' + p.id });
    ld({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: crumb });
  }

  /* ---------- الأحداث ---------- */
  function doAdd() {
    if (p.stock === 0) { Store.toggleNotify(p.id); UI.toast('سنُعلمك فور توفر «' + esc(p.name_ar) + '»', 'success'); return false; }
    if (qty > p.stock) { qty = p.stock; const o = qs('#pdpQty'); if (o) o.textContent = qty; }  /* لا تتجاوز المخزون */
    Store.addToCart(p.id, size, qty);
    return true;
  }
  document.addEventListener('click', function (e) {
    const sz = e.target.closest('[data-pdp-size]');
    if (sz) {
      size = Number(sz.dataset.pdpSize);
      qsa('[data-pdp-size]').forEach(b => {
        const on = Number(b.dataset.pdpSize) === size;
        b.classList.toggle('on', on); b.setAttribute('aria-checked', String(on));
      });
      const pr = qs('#pdpPrice'); if (pr) pr.innerHTML = priceHTML();
      return;
    }
    if (e.target.closest('[data-pdp-plus]')) { qty = Math.min(Math.max(1, Math.min(99, p.stock)), qty + 1); const o = qs('#pdpQty'); if (o) o.textContent = qty; return; }
    if (e.target.closest('[data-pdp-minus]')) { qty = Math.max(1, qty - 1); const o = qs('#pdpQty'); if (o) o.textContent = qty; return; }
    if (e.target.closest('#pdpAdd')) { if (doAdd()) { UI.toast('أُضيف «' + esc(p.name_ar) + '» إلى سلتك', 'success'); UI.openPanel('cartDrawer'); } return; }
    if (e.target.closest('#pdpBuy')) { if (doAdd()) location.href = 'checkout.html'; return; }
    const th = e.target.closest('[data-slide]');
    if (th) { setSlide(Number(th.dataset.slide)); return; }
    if (e.target.closest('#goWrite')) { const f = qs('#revForm'); if (f) { f.scrollIntoView({ behavior: 'smooth', block: 'center' }); qs('#rfText').focus({ preventScroll: true }); } return; }
    const rs = e.target.closest('[data-rstar]');
    if (rs) {
      starsSel = Number(rs.dataset.rstar);
      qsa('[data-rstar]').forEach(b => { const on = Number(b.dataset.rstar) <= starsSel; b.classList.toggle('on', on); b.setAttribute('aria-checked', String(Number(b.dataset.rstar) === starsSel)); });
      return;
    }
    if (e.target.closest('#revMore')) { showAll = !showAll; renderList(); return; }
    const help = e.target.closest('[data-rev-helpful]');
    if (help && !help.disabled) {
      Store.markHelpful(p.id, help.dataset.revHelpful);
      help.disabled = true; help.classList.add('on');
      renderList(); updateSummary();
      return;
    }
    if (e.target.closest('#rfPhotoX')) { photoData = null; const prev = qs('#rfPreview'); if (prev) prev.innerHTML = ''; return; }
  });
  document.addEventListener('change', function (e) {
    if (e.target.id !== 'rfPhoto') return;
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (!/^image\//.test(file.type)) { UI.toast('الرجاء اختيار صورة صحيحة', 'error'); return; }
    Store.downscaleImage(file, 640, 0.72).then(data => {
      photoData = data;
      const prev = qs('#rfPreview');
      if (prev) prev.innerHTML = '<div class="up-thumb"><img src="' + data + '" alt="معاينة الصورة المرفقة"><button type="button" class="up-x" id="rfPhotoX" aria-label="إزالة الصورة"><svg class="ic"><use href="#i-close"/></svg></button></div>';
    }).catch(() => UI.toast('تعذّر معالجة الصورة', 'error'));
  });
  document.addEventListener('submit', function (e) {
    if (e.target && e.target.id === 'revForm') { e.preventDefault(); submitReview(); }
  });

  /* ---------- التهيئة ---------- */
  function init() {
    const top = qs('#pdpTop');
    top.innerHTML = topHTML();
    top.removeAttribute('aria-busy');
    const crumb = qs('#crumbName');
    if (crumb) crumb.textContent = p.name_ar;
    wireZoom();
    qs('#pdpNotes').innerHTML = notesHTML();
    qs('#pdpNotesSec').hidden = false;
    qs('#pdpReviews').innerHTML = reviewsHTML();
    qs('#reviews').hidden = false;
    updateSummary();
    renderList();
    renderSimilar();
    renderAlso();
    injectSEO();
    Store.pushRecent(p.id);
    UI.bindReveal();
    UI.syncWishBtns();
    UI.rails();
  }
  init();
})();
