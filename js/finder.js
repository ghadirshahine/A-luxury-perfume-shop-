/* ============================================================
   دار الأُمراء — DAR AL-UMARA  |  js/finder.js
   «اكتشف عطرك المثالي» — استشارة عطرية تفاعلية من خمسة أسئلة:
   لمن العطر؟ نوع الرائحة؟ المناسبة؟ الفصل؟ القوة؟
   يطابق الإجابات مع بصمة كل عطر (العائلات، الجنس، المواسم،
   القوة، التقييم) ويعرض أفضل الترشيحات مع شرح واضح:
   «لماذا يناسبك هذا العطر؟» — ويحفظ النتيجة في تفضيلات الحساب.
   ============================================================ */
(function () {
  'use strict';
  const esc = Store.esc, price = Store.price, qs = UI.qs;

  /* ---------- الأسئلة الخمسة ---------- */
  const QUESTIONS = [
    {
      key: 'gender', q: 'لمن العطر؟', sub: 'نحدّد الفئة الأنسب لاختيارك',
      opts: [
        { v: 'men', ar: 'رجل', ic: 'shield' },
        { v: 'women', ar: 'امرأة', ic: 'flower' },
        { v: 'unisex', ar: 'للجنسين', ic: 'infinity' }
      ]
    },
    {
      key: 'family', q: 'ما نوع الرائحة التي تفضلها؟', sub: 'اختر حتى ثلاث عائلات عطرية تحبها', multi: true, max: 3,
      opts: [
        { v: 'woody', ar: 'خشبية', ic: 'wood' },
        { v: 'oriental', ar: 'شرقية', ic: 'star8' },
        { v: 'floral', ar: 'زهرية', ic: 'flower' },
        { v: 'citrus', ar: 'حمضية', ic: 'sun' },
        { v: 'sweet', ar: 'حلوة', ic: 'cake' },
        { v: 'fresh', ar: 'منعشة', ic: 'wave' },
        { v: 'spicy', ar: 'توابل', ic: 'flame' },
        { v: 'oud', ar: 'عود', ic: 'wood' },
        { v: 'musk', ar: 'مسك', ic: 'moon' }
      ]
    },
    {
      key: 'occasion', q: 'متى ستستخدم العطر؟', sub: 'لكل مناسبة نفحة تليق بها',
      opts: [
        { v: 'daily', ar: 'يوميًا', ic: 'sun' },
        { v: 'work', ar: 'العمل', ic: 'briefcase' },
        { v: 'special', ar: 'المناسبات', ic: 'rings' },
        { v: 'evening', ar: 'السهرات', ic: 'moon' },
        { v: 'travel', ar: 'السفر', ic: 'map-pin' }
      ]
    },
    {
      key: 'season', q: 'ما الفصل المفضل؟', sub: 'نوازن النفحات مع أجواء استخدامك',
      opts: [
        { v: 'summer', ar: 'الصيف', ic: 'sun' },
        { v: 'winter', ar: 'الشتاء', ic: 'snow' },
        { v: 'spring', ar: 'الربيع', ic: 'flower' },
        { v: 'autumn', ar: 'الخريف', ic: 'wood' },
        { v: 'all', ar: 'جميع الفصول', ic: 'infinity' }
      ]
    },
    {
      key: 'strength', q: 'ما قوة العطر التي تفضلها؟', sub: 'من النفحة الهادئة إلى الحضور الطاغي',
      opts: [
        { v: 2, ar: 'خفيف', ic: 'wave', sub: 'نفحة راقية تبقى قريبة منك' },
        { v: 3, ar: 'متوسط', ic: 'layers', sub: 'توازن مثالي بين الحضور والرقي' },
        { v: 4, ar: 'قوي', ic: 'flame', sub: 'أثر يبقى في المكان بعد مغادرتك' }
      ]
    }
  ];

  /* ---------- الحالة ---------- */
  const ans = { gender: null, family: [], occasion: null, season: null, strength: null };
  let step = -1;          /* -1: المقدمة، 0..4: الأسئلة، 5: النتائج */
  let results = null;     /* [{p, s, why, pct}] */
  let fromSaved = false;  /* هل النتيجة معروضة من التفضيلات المحفوظة؟ */
  let advanceTimer = null;

  function resetAns() {
    ans.gender = null; ans.family = []; ans.occasion = null; ans.season = null; ans.strength = null;
  }

  /* ---------- التنسيق ---------- */
  function fmtDate(s) {
    if (!s) return '';
    const p = String(s).split('-');
    return p.length === 3 ? p[2] + '/' + p[1] + '/' + p[0] : s;
  }

  /* ---------- محرّك المطابقة ---------- */
  const MAXP = 38; /* أقصى مجموع نقاط نظري */
  function scoreFor(p) {
    const t = p.tags || {}; const why = []; let s = 0;

    /* الجنس */
    if ((t.gender || []).indexOf(ans.gender) > -1) {
      s += 8; why.push('مصنّف كعطر ' + DICT.genders[ans.gender] + ' — يطابق اختيارك تمامًا');
    } else if ((t.gender || []).indexOf('unisex') > -1) {
      s += 4; why.push('عطر للجنسين يمنحك حضورًا متوازنًا ومرونة في الاختيار');
    } else { s -= 8; }

    /* العائلات العطرية */
    const fam = (t.families || []).filter(f => ans.family.indexOf(f) > -1);
    if (fam.length) {
      s += fam.length * 6;
      why.push('عائلته العطرية تحمل ' + fam.map(f => DICT.families[f]).join('، ') + ' — كما تفضّل');
    }

    /* المناسبة */
    if ((t.occasions || []).indexOf(ans.occasion) > -1) {
      s += 5; why.push('يُبرز أناقته في ' + DICT.occasions[ans.occasion] + ' — مناسبتك المفضلة');
    }

    /* الفصل */
    if (ans.season !== 'all') {
      if ((t.seasons || []).indexOf(ans.season) > -1) {
        s += 4; why.push('نفحاته تتألق في ' + DICT.seasons[ans.season]);
      } else if ((t.seasons || []).indexOf('all') > -1) {
        s += 3; why.push('يناسب جميع الفصول — بما فيها ' + DICT.seasons[ans.season]);
      }
    }

    /* قوة العطر */
    const diff = Math.abs((t.strength || 3) - ans.strength);
    s += Math.max(0, 3 - diff);
    if (diff === 0) why.push('قوته «' + (DICT.strengths[t.strength] || '') + '» — في المستوى الذي تفضّله بالضبط');
    else if (diff <= 1) why.push('قوته «' + (DICT.strengths[t.strength] || '') + '» قريبة من المستوى الذي تبحث عنه');

    /* التقييم والمخزون */
    s += (p.rating - 4.5) * 2;
    if (p.rating >= 4.7) why.push('تقييم ' + p.rating + ' من ' + Store.statsFor(p).count + ' مراجعة');
    if ((p.stock || 0) <= 0) s -= 5;

    return { s: s, why: why.slice(0, 4), pct: Math.max(64, Math.min(97, Math.round((s / MAXP) * 100))) };
  }
  function computeResults() {
    return Store.products()
      .map(p => { const r = scoreFor(p); return { p: p, s: r.s, why: r.why, pct: r.pct }; })
      .sort((a, b) => b.s - a.s)
      .slice(0, 4);
  }

  /* ---------- المقدمة ---------- */
  function introHTML() {
    const pr = Store.prefs();
    const prev = pr && pr.picks ? pr.picks.map(Store.byId).filter(Boolean).slice(0, 4) : [];
    return '<div class="finder-shell">' +
      '<section class="panel-card gold-edge find-intro">' +
        '<span class="fi-tag"><svg class="ic ic-xs"><use href="#i-sparkles"/></svg> استشارة عطرية شخصية</span>' +
        '<h2>خمسة أسئلة… وعطرٌ يليق بك</h2>' +
        '<p class="fi-lead">أجب عن أسئلة سريعة حول ذوقك ومناسبتك المفضلة، ليقترح عليك خبراؤنا تحفًا عطرية مختارة بعناية — مع تفسير واضح: <b>«لماذا يناسبك هذا العطر؟»</b></p>' +
        '<ol class="fi-preview">' +
          QUESTIONS.map((q, i) => '<li><span>' + (i + 1) + '</span>' + q.q + '</li>').join('') +
        '</ol>' +
        '<button class="btn btn-gold btn-lg" type="button" data-start><svg class="ic ic-sm"><use href="#i-sparkles"/></svg> ابدأ الاستشارة</button>' +
        (prev.length
          ? '<div class="fi-last">' +
            '<p class="fi-last-note"><svg class="ic ic-xs"><use href="#i-clock"/></svg> لديك نتيجة محفوظة' + (pr.at ? ' من ' + fmtDate(pr.at) : '') + '</p>' +
            '<div class="fi-last-row">' + prev.map(p =>
              '<a class="fi-thumb" href="product.html?id=' + p.id + '">' + Art.product(p, { compact: true }) +
              '<span>' + esc(p.name_ar) + '</span></a>').join('') + '</div>' +
            '<button class="btn btn-outline btn-sm" type="button" data-last>عرض نتيجتي السابقة</button>' +
            '</div>'
          : '') +
      '</section></div>';
  }

  /* ---------- سؤال من الأسئلة ---------- */
  function wizardHTML() {
    const q = QUESTIONS[step];
    const pct = Math.round(((step + 1) / (QUESTIONS.length + 1)) * 100);
    const picked = q.multi ? ans[q.key] : null;
    return '<div class="finder-shell">' +
      '<section class="panel-card gold-edge find-wiz">' +
        '<div class="fw-top">' +
          '<button class="btn btn-ghost btn-sm" type="button" data-back><svg class="ic ic-xs"><use href="#i-arrow-right"/></svg> ' + (step === 0 ? 'المقدمة' : 'السابق') + '</button>' +
          '<span class="fw-count">السؤال ' + (step + 1) + ' من ' + QUESTIONS.length + '</span>' +
        '</div>' +
        '<div class="fprog" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + pct + '" aria-label="تقدم الاستشارة"><i style="width:' + pct + '%"></i></div>' +
        '<h2 class="fq-q">' + q.q + '</h2>' +
        '<p class="fq-sub">' + q.sub + (q.multi ? ' — اختيار متعدد' : '') + '</p>' +
        '<div class="fopts' + (q.multi ? ' fopts-wide' : '') + '" role="group" aria-label="' + q.q + '">' +
          q.opts.map(o => {
            const on = q.multi ? picked.indexOf(o.v) > -1 : String(ans[q.key]) === String(o.v);
            return '<button class="fopt' + (on ? ' on' : '') + '" type="button" data-opt="' + o.v + '" aria-pressed="' + on + '">' +
              '<span class="fo-ic"><svg class="ic"><use href="#i-' + o.ic + '"/></svg></span>' +
              '<span class="fo-txt"><b>' + o.ar + '</b>' + (o.sub ? '<small>' + o.sub + '</small>' : '') + '</span>' +
              '<span class="fo-check"><svg class="ic ic-xs"><use href="#i-check"/></svg></span></button>';
          }).join('') +
        '</div>' +
        (q.multi
          ? '<div class="fnav"><span class="fw-hint">' + (picked.length ? 'اخترت ' + picked.length + ' من ' + q.max : 'اختر عائلة واحدة على الأقل') + '</span>' +
            '<button class="btn btn-gold" type="button" data-next' + (picked.length ? '' : ' disabled') + '>التالي <svg class="ic ic-xs"><use href="#i-arrow-left"/></svg></button></div>'
          : '') +
      '</section></div>';
  }

  /* ---------- النتائج ---------- */
  function summaryChips() {
    const chips = [];
    if (DICT.genders[ans.gender]) chips.push(DICT.genders[ans.gender]);
    ans.family.forEach(f => { if (DICT.families[f]) chips.push(DICT.families[f]); });
    if (DICT.occasions[ans.occasion]) chips.push(DICT.occasions[ans.occasion]);
    if (ans.season && DICT.seasons[ans.season]) chips.push(DICT.seasons[ans.season]);
    if (DICT.strengths[ans.strength]) chips.push('قوة ' + DICT.strengths[ans.strength]);
    return chips;
  }
  function bestHTML(r) {
    const p = r.p, so = Store.sizeOf(p), st = Store.statsFor(p);
    return '<section class="panel-card gold-edge fmatch">' +
      '<div class="fm-media">' + Art.product(p) +
        '<span class="fm-pct"><b>' + r.pct + '%</b><small>توافق</small></span>' +
      '</div>' +
      '<div class="fm-info">' +
        '<span class="fm-brand">' + esc((BRANDS[p.brand] || {}).ar || '') + '</span>' +
        '<h2 class="fm-name"><a href="product.html?id=' + p.id + '">' + esc(p.name_ar) + '</a></h2>' +
        '<div class="fm-rate">' + UI.stars(st.rating) + '<span class="rating-count">' + st.count + ' تقييمًا</span></div>' +
        '<h3 class="fm-why-h"><svg class="ic ic-sm"><use href="#i-sparkles"/></svg> لماذا يناسبك هذا العطر؟</h3>' +
        '<ul class="fwhy">' + r.why.map(w =>
          '<li><svg class="ic ic-xs"><use href="#i-check"/></svg><span>' + esc(w) + '</span></li>').join('') + '</ul>' +
        '<div class="fm-buy">' +
          '<div class="fm-price-wrap"><b class="fm-price">' + price(so.price) + '</b><small>' + esc(Store.sizeLabel(so)) + '</small></div>' +
          (p.stock > 0
            ? '<button class="btn btn-gold" type="button" data-add="' + p.id + '" data-size="' + so.ml + '"><svg class="ic ic-xs"><use href="#i-cart"/></svg> أضف إلى السلة</button>'
            : '<button class="btn btn-outline" type="button" data-notify="' + p.id + '"><svg class="ic ic-xs"><use href="#i-bell"/></svg> أبلغني عند التوفّر</button>') +
          '<a class="btn btn-outline" href="product.html?id=' + p.id + '">عرض العطر</a>' +
          '<button class="icon-btn round" type="button" data-wish="' + p.id + '" aria-label="أضف إلى المفضلة"><svg class="ic"><use href="#i-heart"/></svg></button>' +
        '</div>' +
      '</div>' +
    '</section>';
  }
  function restHTML(list) {
    return '<div class="grid-cards fgrid">' + list.map(r => {
      const p = r.p, so = Store.sizeOf(p);
      return '<article class="fcard panel-card">' +
        '<a class="fc-art" href="product.html?id=' + p.id + '" aria-label="' + esc(p.name_ar) + '">' +
          Art.product(p, { compact: true }) +
          '<span class="fm-pct sm"><b>' + r.pct + '%</b></span>' +
        '</a>' +
        '<div class="fc-body">' +
          '<span class="fc-brand">' + esc((BRANDS[p.brand] || {}).ar || '') + '</span>' +
          '<h3 class="fc-name"><a href="product.html?id=' + p.id + '">' + esc(p.name_ar) + '</a></h3>' +
          '<p class="fc-why"><b>لماذا يناسبك؟</b> ' + esc(r.why.slice(0, 2).join(' · ')) + '</p>' +
          '<div class="fc-row">' +
            '<b class="fc-price">' + price(so.price) + '</b>' +
            '<span class="fc-acts">' +
              '<button class="icon-btn round" type="button" data-wish="' + p.id + '" aria-label="أضف إلى المفضلة"><svg class="ic"><use href="#i-heart"/></svg></button>' +
              (p.stock > 0
                ? '<button class="icon-btn round" type="button" data-add="' + p.id + '" data-size="' + so.ml + '" aria-label="أضف إلى السلة"><svg class="ic"><use href="#i-cart"/></svg></button>'
                : '<button class="icon-btn round" type="button" data-notify="' + p.id + '" aria-label="أبلغني عند التوفّر"><svg class="ic"><use href="#i-bell"/></svg></button>') +
            '</span>' +
          '</div>' +
        '</div></article>';
    }).join('') + '</div>';
  }
  function resultsHTML() {
    if (!results || !results.length) return '';
    return '<div class="finder-shell fwide">' +
      '<section class="panel-card find-res-head">' +
        '<div>' +
          '<h2><svg class="ic ic-sm"><use href="#i-star8"/></svg> ' + (fromSaved ? 'نتيجتك المحفوظة' : 'نتيجتك العطرية جاهزة') + '</h2>' +
          '<p class="frh-sub">ارتكزت توصياتنا على إجاباتك — والتفاصيل الكاملة أمام كل عطر.</p>' +
          '<div class="chips">' + summaryChips().map(c => '<span class="chip on">' + esc(c) + '</span>').join('') + '</div>' +
        '</div>' +
        '<div class="frh-actions">' +
          '<button class="btn btn-gold" type="button" data-restart><svg class="ic ic-xs"><use href="#i-refresh"/></svg> أعد الاستشارة</button>' +
          '<a class="btn btn-outline" href="account.html#prefs">تفضيلاتي في الحساب</a>' +
        '</div>' +
      '</section>' +
      bestHTML(results[0]) +
      (results.length > 1
        ? '<div class="section-head"><div><h2>ترشيحات أخرى بعناية</h2><p class="sh-sub">عطور تنافس اختيارك الأول — بنسب توافق عالية</p></div>' +
          '<a class="sec-link" href="shop.html">تصفّح المتجر <svg class="ic"><use href="#i-chevron-left"/></svg></a></div>' + restHTML(results.slice(1))
        : '') +
      '<p class="fnote"><svg class="ic ic-xs"><use href="#i-info"/></svg> حُفظت نتيجتك في تفضيلات حسابك — يمكنك تحديثها في أي وقت من صفحة «حسابي».</p>' +
      '</div>';
  }

  /* ---------- العرض ---------- */
  function render() {
    const page = qs('#finderPage'); if (!page) return;
    page.removeAttribute('aria-busy');
    if (step === -1) page.innerHTML = introHTML();
    else if (step >= QUESTIONS.length) page.innerHTML = resultsHTML();
    else page.innerHTML = wizardHTML();
    UI.bindReveal(page);
    UI.syncWishBtns();
    document.title = (step === -1 ? 'اكتشف عطرك المثالي' : 'استشارة عطرية') + ' | دار الأُمراء';
  }
  function scrollTop() {
    const t = qs('#finderPage');
    if (t) window.scrollTo({ top: Math.max(0, t.getBoundingClientRect().top + window.scrollY - 110), behavior: 'smooth' });
  }
  function go(n) {
    step = n; render(); scrollTop();
  }
  function finish() {
    results = computeResults();
    fromSaved = false;
    step = QUESTIONS.length;
    const picks = results.map(r => r.p.id);
    const d = new Date();
    const at = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    Store.savePrefs({
      gender: ans.gender, family: ans.family.slice(), occasion: ans.occasion,
      season: ans.season, strength: ans.strength, at: at, picks: picks
    });
    render(); scrollTop();
    UI.toast('حُفظت نتيجتك في تفضيلاتك العطرية', 'success', 2600);
  }
  function showLast() {
    const pr = Store.prefs();
    if (!pr || !pr.picks || !pr.picks.length) { start(); return; }
    ans.gender = pr.gender; ans.family = pr.family || []; ans.occasion = pr.occasion;
    ans.season = pr.season; ans.strength = pr.strength;
    results = pr.picks.map(Store.byId).filter(Boolean).map(p => {
      const r = scoreFor(p);
      return { p: p, s: r.s, why: r.why, pct: r.pct };
    });
    if (!results.length) { start(); return; }
    fromSaved = true;
    step = QUESTIONS.length;
    render(); scrollTop();
  }
  function start() {
    resetAns();
    results = null;
    fromSaved = false;
    go(0);
  }

  /* ---------- الأحداث ---------- */
  function wire() {
    const page = qs('#finderPage'); if (!page) return;
    page.addEventListener('click', function (e) {
      const t = e.target;

      if (t.closest('[data-start]') || t.closest('[data-restart]')) { start(); return; }
      if (t.closest('[data-last]')) { showLast(); return; }

      if (t.closest('[data-back]')) {
        if (advanceTimer) { clearTimeout(advanceTimer); advanceTimer = null; }
        go(step - 1);
        return;
      }
      const nextBtn = t.closest('[data-next]');
      if (nextBtn) {
        if (advanceTimer) { clearTimeout(advanceTimer); advanceTimer = null; }
        if (step + 1 >= QUESTIONS.length) finish(); else go(step + 1);
        return;
      }

      const opt = t.closest('[data-opt]');
      if (opt) {
        const q = QUESTIONS[step];
        const raw = opt.dataset.opt;
        if (q.multi) {
          const v = raw;
          const i = ans[q.key].indexOf(v);
          if (i > -1) ans[q.key].splice(i, 1);
          else if (ans[q.key].length >= q.max) { UI.toast('يمكنك اختيار ' + q.max + ' عائلات كحد أقصى', 'info', 2200); return; }
          else ans[q.key].push(v);
          render();
        } else {
          ans[q.key] = q.key === 'strength' ? Number(raw) : raw;
          render();
          if (advanceTimer) clearTimeout(advanceTimer);
          advanceTimer = setTimeout(function () {
            advanceTimer = null;
            if (step + 1 >= QUESTIONS.length) finish(); else go(step + 1);
          }, 280);
        }
        return;
      }
    });
  }

  Store.onReady(function () {
    wire();
    render();
  });
})();
