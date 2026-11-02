/* ============================================================
   دار الأُمراء — DAR AL-UMARA  |  js/shop.js
   صفحة المتجر: قراءة المتغيّرات من العنوان، الفلاتر متعددة
   المجموعات، الترتيب، الترقيم، الرقائق النشطة، ولوحة الجوال.
   ============================================================ */
(function () {
  'use strict';
  const esc = Store.esc, qs = UI.qs, qsa = UI.qsa;
  const PER = 9;

  const MULTI = ['family', 'gender', 'brand', 'note', 'size', 'occasion', 'season', 'concentration'];
  const FLAG_LABEL = { bestseller: 'الأكثر مبيعًا', new: 'وصل حديثًا', sale: 'عروض وخصومات', rated: 'الأعلى تقييمًا' };

  const S = {
    q: '', category: '', collection: '', flags: '',
    family: [], gender: [], brand: [], note: [], size: [],
    occasion: [], season: [], concentration: [],
    rating: 0, priceMin: null, priceMax: null, available: false,
    sort: 'best', page: 1
  };

  /* ---------- قراءة العنوان ---------- */
  function fromURL() {
    const u = new URLSearchParams(location.search);
    S.q = u.get('q') || '';
    S.category = u.get('category') || '';
    S.collection = u.get('collection') || '';
    S.flags = u.get('filter') || '';
    MULTI.forEach(k => { const v = u.get(k); if (v) S[k] = v.split(',').map(x => (k === 'size' ? Number(x) : x)).filter(Boolean); });
    if (u.get('rating')) S.rating = Number(u.get('rating')) || 0;
    if (u.get('min') != null && u.get('min') !== '') S.priceMin = Number(u.get('min'));
    if (u.get('max') != null && u.get('max') !== '') S.priceMax = Number(u.get('max'));
    S.available = u.get('stock') === '1';
    if (u.get('sort')) S.sort = u.get('sort');
    if (u.get('page')) S.page = Math.max(1, Number(u.get('page')) || 1);
  }
  function toURL() {
    const p = new URLSearchParams();
    if (S.q) p.set('q', S.q);
    if (S.category) p.set('category', S.category);
    if (S.collection) p.set('collection', S.collection);
    if (S.flags) p.set('filter', S.flags);
    MULTI.forEach(k => { if (S[k].length) p.set(k, S[k].join(',')); });
    if (S.rating) p.set('rating', S.rating);
    if (S.priceMin != null) p.set('min', S.priceMin);
    if (S.priceMax != null) p.set('max', S.priceMax);
    if (S.available) p.set('stock', '1');
    if (S.sort !== 'best') p.set('sort', S.sort);
    if (S.page > 1) p.set('page', S.page);
    const s = p.toString();
    try { history.replaceState(null, '', location.pathname + (s ? '?' + s : '')); } catch (e) { }
  }

  /* ---------- التصفية ---------- */
  function filtered() {
    let list = Store.products();
    if (S.q) { const ids = {}; Store.search(S.q, 999).products.forEach(p => (ids[p.id] = 1)); list = list.filter(p => ids[p.id]); }
    if (S.collection) { const c = COLLECTIONS.find(x => x.id === S.collection); const set = {}; ((c && c.products) || []).forEach(id => (set[id] = 1)); list = list.filter(p => set[p.id]); }
    if (S.category) list = list.filter(p => (p.categories || []).indexOf(S.category) > -1);
    if (S.flags === 'bestseller') list = list.filter(p => p.bestsellerRank);
    else if (S.flags === 'new') list = list.filter(p => p.isNew);
    else if (S.flags === 'sale') list = list.filter(p => p.oldPrice && p.oldPrice > p.price);
    else if (S.flags === 'rated') list = list.filter(p => p.rating >= 4.5);
    if (S.family.length) list = list.filter(p => p.tags.families.some(f => S.family.includes(f)));
    if (S.gender.length) list = list.filter(p => p.tags.gender.some(g => S.gender.includes(g)));
    if (S.occasion.length) list = list.filter(p => (p.tags.occasions || []).some(o => S.occasion.includes(o)));
    if (S.season.length) list = list.filter(p => (p.tags.seasons || []).some(x => S.season.includes(x)));
    if (S.concentration.length) list = list.filter(p => S.concentration.includes(p.concentration));
    if (S.brand.length) list = list.filter(p => S.brand.includes(p.brand));
    if (S.note.length) list = list.filter(p => { const ns = Store.notesArr(p); return S.note.some(n => ns.includes(n)); });
    if (S.size.length) list = list.filter(p => (p.sizes || []).some(sz => S.size.includes(sz.ml)));
    if (S.rating) list = list.filter(p => p.rating >= S.rating);
    if (S.priceMin != null) list = list.filter(p => p.price >= S.priceMin);
    if (S.priceMax != null) list = list.filter(p => p.price <= S.priceMax);
    if (S.available) list = list.filter(p => p.stock > 0);
    return list;
  }
  function sorted(list) {
    return list.slice().sort((a, b) => {
      switch (S.sort) {
        case 'new': return String(b.createdAt || '').localeCompare(String(a.createdAt || ''));
        case 'rating': return (b.rating - a.rating) || (b.reviewsCount - a.reviewsCount);
        case 'price-asc': return a.price - b.price;
        case 'price-desc': return b.price - a.price;
        default: { const ra = a.bestsellerRank || 999, rb = b.bestsellerRank || 999; return (ra - rb) || (b.rating - a.rating); }
      }
    });
  }

  /* ---------- لوحة الفلاتر ---------- */
  function countBy(fn) { return (p) => fn(p) ? 1 : 0; }
  function countFor(attr, val) {
    const all = Store.products();
    return all.reduce((n, p) => n + ({
      gender: countBy(x => x.tags.gender.indexOf(val) > -1),
      family: countBy(x => x.tags.families.indexOf(val) > -1),
      brand: countBy(x => x.brand === val),
      note: countBy(x => Store.notesArr(x).indexOf(val) > -1),
      size: countBy(x => (x.sizes || []).some(sz => sz.ml === val)),
      occasion: countBy(x => (x.tags.occasions || []).indexOf(val) > -1),
      season: countBy(x => (x.tags.seasons || []).indexOf(val) > -1),
      concentration: countBy(x => x.concentration === val)
    }[attr])(p), 0);
  }
  function isOn(attr, val) { return S[attr].some(v => String(v) === String(val)); }
  function checkGroup(attr, title, entries) {
    return '<div class="fgroup"><h4>' + title + '</h4><div class="fg-opts">' + entries.map(e =>
      '<label class="check"><input type="checkbox" data-fattr="' + attr + '" value="' + e[0] + '"' + (isOn(attr, e[0]) ? ' checked' : '') + '>' +
      '<span>' + esc(e[1]) + '</span><span class="count">' + e[2] + '</span></label>').join('') + '</div></div>';
  }
  function filtersHTML() {
    const all = Store.products();
    const maxPrice = Math.ceil(Math.max.apply(null, all.map(p => p.price)));
    const sizes = [];
    all.forEach(p => (p.sizes || []).forEach(s => { if (sizes.indexOf(s.ml) < 0) sizes.push(s.ml); }));
    sizes.sort((a, b) => a - b);
    /* المكوّنات الأكثر حضورًا */
    const noteCount = {};
    all.forEach(p => Store.notesArr(p).forEach(n => { noteCount[n] = (noteCount[n] || 0) + 1; }));
    const topNotes = Object.keys(noteCount).sort((a, b) => noteCount[b] - noteCount[a]).slice(0, 14);

    let html = '';
    html += checkGroup('gender', 'الجنس', Object.keys(DICT.genders).map(g => [g, DICT.genders[g], countFor('gender', g)]));
    html += '<div class="fgroup"><h4>التصنيفات</h4><div class="fg-opts">' +
      CATEGORIES.map(c => {
        const n = all.filter(p => (p.categories || []).indexOf(c.id) > -1).length;
        return '<label class="check"><input type="radio" name="fcat" data-fattr="category" value="' + c.id + '"' + (S.category === c.id ? ' checked' : '') + '><span>' + esc(c.ar) + '</span><span class="count">' + n + '</span></label>';
      }).join('') + '</div></div>';
    html += checkGroup('family', 'العائلة العطرية', Object.keys(DICT.families).map(f => [f, DICT.families[f], countFor('family', f)]).filter(e => e[2] > 0));
    html += checkGroup('brand', 'العلامة التجارية', Object.keys(BRANDS).map(id => [id, BRANDS[id].ar, countFor('brand', id)]));
    html += checkGroup('note', 'المكوّنات', topNotes.map(n => [n, (NOTES_DICT[n] || {}).ar || n, countFor('note', n)]));
    html += checkGroup('concentration', 'التركيز', Object.keys(DICT.concentrations).filter(c => all.some(p => p.concentration === c)).map(c => [c, DICT.concentrations[c], countFor('concentration', c)]));
    html += checkGroup('size', 'الحجم', sizes.map(sz => [sz, sz + ' مل', countFor('size', sz)]));
    html += checkGroup('occasion', 'المناسبة', Object.keys(DICT.occasions).map(o => [o, DICT.occasions[o], countFor('occasion', o)]).filter(e => e[2] > 0));
    html += checkGroup('season', 'الموسم', Object.keys(DICT.seasons).map(s => [s, DICT.seasons[s], countFor('season', s)]).filter(e => e[2] > 0));
    html += '<div class="fgroup"><h4>السعر (د.ك)</h4>' +
      '<div class="range-row"><input class="input" type="number" min="0" step="0.5" placeholder="من" data-price="min" value="' + (S.priceMin != null ? S.priceMin : '') + '" aria-label="أقل سعر">' +
      '<span class="muted">—</span>' +
      '<input class="input" type="number" min="0" step="0.5" placeholder="إلى" data-price="max" value="' + (S.priceMax != null ? S.priceMax : '') + '" aria-label="أعلى سعر"></div>' +
      '<input type="range" class="range" data-price="range" min="0" max="' + maxPrice + '" step="5" value="' + (S.priceMax != null ? Math.min(S.priceMax, maxPrice) : maxPrice) + '" aria-label="الحد الأقصى للسعر">' +
      '<div class="range-scale"><span>0</span><span>' + maxPrice + ' د.ك</span></div></div>';
    html += '<div class="fgroup"><h4>التقييم</h4><div class="fg-opts">' +
      [[4.5, '4.5 فأكثر'], [4, '4 فأكثر'], [3.5, '3.5 فأكثر']].map(r => {
        const n = all.filter(p => p.rating >= r[0]).length;
        return '<label class="check"><input type="radio" name="frate" data-fattr="rating" value="' + r[0] + '"' + (Number(S.rating) === r[0] ? ' checked' : '') + '><span>' + r[1] + ' ★</span><span class="count">' + n + '</span></label>';
      }).join('') + '</div></div>';
    html += '<div class="fgroup"><h4>التوفر</h4><label class="check"><input type="checkbox" data-fattr="available" value="1"' + (S.available ? ' checked' : '') + '><span>المتوفر فقط</span></label></div>';
    return html;
  }
  function renderFilters() {
    const html = filtersHTML();
    const a = qs('#shopFilters'), b = qs('#filterSheetBody');
    if (a) a.innerHTML = html;
    if (b) b.innerHTML = html;
  }
  function syncInputs() {
    qsa('[data-fattr]').forEach(inp => {
      const attr = inp.dataset.fattr;
      if (attr === 'available') inp.checked = S.available;
      else if (attr === 'rating') inp.checked = Number(S.rating) === Number(inp.value);
      else if (attr === 'category') inp.checked = S.category === inp.value;
      else inp.checked = isOn(attr, inp.value);
    });
    qsa('[data-price="min"]').forEach(i => { i.value = S.priceMin != null ? S.priceMin : ''; });
    qsa('[data-price="max"]').forEach(i => { i.value = S.priceMax != null ? S.priceMax : ''; });
  }

  /* ---------- الرقائق النشطة ---------- */
  function chip(label, attr, val) {
    return '<span class="fchip">' + esc(label) + '<button type="button" data-fchip="' + attr + '" data-fval="' + esc(String(val)) + '" aria-label="إزالة فلتر ' + esc(label) + '"><svg class="ic"><use href="#i-close"/></svg></button></span>';
  }
  function chipsHTML() {
    const out = [];
    if (S.q) out.push(chip('بحث: ' + S.q, 'q', ''));
    if (S.category) { const c = CATEGORIES.find(x => x.id === S.category); if (c) out.push(chip(c.ar, 'category', '')); }
    if (S.collection) { const c = COLLECTIONS.find(x => x.id === S.collection); if (c) out.push(chip(c.ar, 'collection', '')); }
    if (S.flags && FLAG_LABEL[S.flags]) out.push(chip(FLAG_LABEL[S.flags], 'flags', ''));
    S.family.forEach(v => out.push(chip(DICT.families[v] || v, 'family', v)));
    S.gender.forEach(v => out.push(chip(DICT.genders[v] || v, 'gender', v)));
    S.occasion.forEach(v => out.push(chip(DICT.occasions[v] || v, 'occasion', v)));
    S.season.forEach(v => out.push(chip(DICT.seasons[v] || v, 'season', v)));
    S.concentration.forEach(v => out.push(chip(DICT.concentrations[v] || v, 'concentration', v)));
    S.brand.forEach(v => { const b = BRANDS.find(x => x.id === v); out.push(chip((b && b.ar) || v, 'brand', v)); });
    S.note.forEach(v => out.push(chip((NOTES_DICT[v] || {}).ar || v, 'note', v)));
    S.size.forEach(v => out.push(chip(v + ' مل', 'size', v)));
    if (S.rating) out.push(chip(S.rating + ' ★ فأكثر', 'rating', ''));
    if (S.priceMin != null || S.priceMax != null) out.push(chip('السعر: ' + (S.priceMin != null ? S.priceMin : '0') + ' — ' + (S.priceMax != null ? S.priceMax : '∞'), 'price', ''));
    if (S.available) out.push(chip('المتوفر فقط', 'available', ''));
    return out.join('');
  }
  function activeCount() {
    let n = S.family.length + S.gender.length + S.brand.length + S.note.length + S.size.length +
      S.occasion.length + S.season.length + S.concentration.length;
    if (S.category) n++;
    if (S.collection) n++;
    if (S.flags) n++;
    if (S.rating) n++;
    if (S.priceMin != null || S.priceMax != null) n++;
    if (S.available) n++;
    return n;
  }
  function plural(n) { return n === 1 ? 'نتيجة واحدة' : n === 2 ? 'نتيجتان' : (n >= 3 && n <= 10 ? n + ' نتائج' : n + ' نتيجة'); }

  /* ---------- الترتيب والعنوان ---------- */
  function updateHeads() {
    const t = qs('#shopTitle'), c = qs('#crumbCurrent'), sub = qs('#shopSub');
    let title = 'كل العطور', crumb = 'المتجر', subTxt = 'اكتشف مجموعتنا الكاملة من العطور الفاخرة — استخدم الفلاتر للوصول إلى عطرك المثالي بسرعة.';
    if (S.q) { title = 'نتائج البحث عن «' + S.q + '»'; crumb = 'بحث'; subTxt = 'نتائج مطابقة لبحثك — يمكنك تعديل الفلاتر لتحسين النتائج.'; }
    else if (S.collection) { const c = COLLECTIONS.find(x => x.id === S.collection); if (c) { title = c.ar; crumb = c.ar; subTxt = c.desc; } }
    else if (S.category) { const c = CATEGORIES.find(x => x.id === S.category); if (c) { title = c.ar; crumb = c.ar; subTxt = 'تصفّح ' + c.ar + ' من دار الأُمراء.'; } }
    else if (S.flags && FLAG_LABEL[S.flags]) { title = FLAG_LABEL[S.flags]; crumb = title; }
    if (t) t.textContent = title;
    if (c) c.textContent = crumb;
    if (sub) sub.textContent = subTxt;
    document.title = title + ' — المتجر | دار الأُمراء';
  }
  function renderQuickCats() {
    const wrap = qs('#quickCats'); if (!wrap) return;
    wrap.innerHTML = '<a class="chip' + (!S.category ? ' on' : '') + '" href="shop.html">الكل</a>' +
      CATEGORIES.map(c => '<a class="chip' + (S.category === c.id ? ' on' : '') + '" href="shop.html?category=' + c.id + '">' + esc(c.ar) + '</a>').join('');
  }

  /* ---------- العرض الرئيسي ---------- */
  function render() {
    const list = sorted(filtered());
    const pages = Math.max(1, Math.ceil(list.length / PER));
    S.page = Math.min(S.page, pages);
    const start = (S.page - 1) * PER;
    const slice = list.slice(start, start + PER);

    const grid = qs('#shopGrid');
    if (grid) {
      grid.removeAttribute('aria-busy');
      grid.innerHTML = slice.length
        ? slice.map(p => UI.productCard(p)).join('')
        : '<div class="empty-state" style="grid-column:1/-1"><svg class="ic"><use href="#i-search"/></svg>' +
        '<h3>لا توجد عطور مطابقة</h3><p>جرّب تعديل الفلاتر أو ابحث بكلمات أخرى — أو تصفّح كل العطور.</p>' +
        '<button class="btn btn-gold" type="button" data-reset>مسح كل الفلاتر</button></div>';
    }

    const rc = qs('#resultCount');
    if (rc) rc.textContent = plural(list.length);
    const fc = qs('#filterCount');
    if (fc) { const n = activeCount(); fc.textContent = n; fc.hidden = !n; }
    const chips = qs('#activeChips');
    if (chips) chips.innerHTML = chipsHTML();

    const sel = qs('#sortSel'); if (sel && sel.value !== S.sort) sel.value = S.sort;

    renderPager(pages);
    syncInputs();
    updateHeads();
    toURL();
    UI.bindReveal();
    UI.syncWishBtns();
  }
  function renderPager(pages) {
    const nav = qs('#shopPager'); if (!nav) return;
    if (pages <= 1) { nav.hidden = true; nav.innerHTML = ''; return; }
    nav.hidden = false;
    let html = '<button type="button" data-gopage="' + (S.page - 1) + '"' + (S.page === 1 ? ' disabled' : '') + ' aria-label="السابق"><svg class="ic ic-sm"><use href="#i-chevron-right"/></svg></button>';
    for (let i = 1; i <= pages; i++) {
      if (pages > 7 && i > 2 && i < pages - 1 && Math.abs(i - S.page) > 1) {
        if (i === 3 || i === pages - 2) html += '<span class="pager-dots">…</span>';
        continue;
      }
      html += '<button type="button" data-gopage="' + i + '" class="' + (i === S.page ? 'on' : '') + '"' + (i === S.page ? ' aria-current="page"' : '') + '>' + i + '</button>';
    }
    html += '<button type="button" data-gopage="' + (S.page + 1) + '"' + (S.page === pages ? ' disabled' : '') + ' aria-label="التالي"><svg class="ic ic-sm"><use href="#i-chevron-left"/></svg></button>';
    nav.innerHTML = html;
  }
  function gotoPage(n) {
    S.page = n; render();
    const bar = qs('#filterBar');
    if (bar) window.scrollTo({ top: bar.getBoundingClientRect().top + window.scrollY - 96, behavior: 'smooth' });
  }

  /* ---------- الأحداث ---------- */
  function setMulti(attr, val, on) {
    val = attr === 'size' ? Number(val) : val;
    if (on) { if (!S[attr].some(v => String(v) === String(val))) S[attr].push(val); }
    else S[attr] = S[attr].filter(v => String(v) !== String(val));
  }
  function wire() {
    document.addEventListener('change', function (e) {
      const t = e.target;
      if (t.matches('[data-fattr]')) {
        const attr = t.dataset.fattr;
        if (attr === 'available') S.available = t.checked;
        else if (attr === 'rating') S.rating = t.checked ? Number(t.value) : 0;
        else if (attr === 'category') S.category = t.checked ? t.value : '';
        else setMulti(attr, t.value, t.checked);
        S.page = 1; render();
        return;
      }
      if (t.matches('[data-price]')) {
        const kind = t.dataset.price;
        if (kind === 'min') S.priceMin = t.value === '' ? null : Number(t.value);
        if (kind === 'max') S.priceMax = t.value === '' ? null : Number(t.value);
        if (kind === 'range') S.priceMax = Number(t.value);
        S.page = 1; render();
        return;
      }
      if (t.id === 'sortSel') { S.sort = t.value; S.page = 1; render(); }
    });
    document.addEventListener('click', function (e) {
      if (e.target.closest('#openFilters')) { UI.openPanel('filterSheet'); return; }
      if (e.target.closest('#clearFiltersTop') || e.target.closest('#clearFilters') || e.target.closest('[data-reset]')) { clearAll(); return; }
      const go = e.target.closest('[data-gopage]');
      if (go && !go.disabled) { gotoPage(Number(go.dataset.gopage)); return; }
      const ch = e.target.closest('[data-fchip]');
      if (ch) {
        const attr = ch.dataset.fchip, val = ch.dataset.fval;
        if (attr === 'q') S.q = '';
        else if (attr === 'category') S.category = '';
        else if (attr === 'collection') S.collection = '';
        else if (attr === 'flags') S.flags = '';
        else if (attr === 'rating') S.rating = 0;
        else if (attr === 'price') { S.priceMin = null; S.priceMax = null; }
        else if (attr === 'available') S.available = false;
        else setMulti(attr, val, false);
        S.page = 1; render();
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && e.target.matches('[data-price]')) { S.page = 1; render(); }
    });
  }
  function clearAll() {
    MULTI.forEach(k => (S[k] = []));
    S.q = ''; S.category = ''; S.collection = ''; S.flags = '';
    S.rating = 0; S.priceMin = null; S.priceMax = null; S.available = false;
    S.sort = 'best'; S.page = 1;
    render();
    UI.toast('أُعيدت كل الفلاتر', 'info', 2200);
  }

  Store.onReady(function () {
    fromURL();
    renderQuickCats();
    renderFilters();
    wire();
    render();
  });
})();
