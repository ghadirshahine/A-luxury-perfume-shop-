/* ============================================================
   دار الأُمراء — DAR AL-UMARA  |  scripts/audit.js
   فحص تماسك المشروع: مراجع السكربتات والأنماط، الروابط الداخلية،
   أيقونات #i-*، دوال Store/UI/Art، وتسلسل تحميل السكربتات.
   التشغيل:  node scripts/audit.js
   ============================================================ */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const exists = f => fs.existsSync(path.join(ROOT, f));

const htmlFiles = ['404.html', 'account.html', 'admin.html', 'cart.html', 'checkout.html',
  'finder.html', 'gifts.html', 'index.html', 'product.html', 'shop.html', 'success.html', 'wishlist.html'];
const jsFiles = fs.readdirSync(path.join(ROOT, 'js')).filter(f => f.endsWith('.js'));
const cssFiles = fs.readdirSync(path.join(ROOT, 'css')).filter(f => f.endsWith('.css'));

let errors = 0, warns = 0;
const err = m => { errors++; console.log('  [ERROR] ' + m); };
const warn = m => { warns++; console.log('  [WARN ] ' + m); };

/* ---------- 1) أيقونات #i-* مقابل GLYPHS ---------- */
console.log('\n=== 1) مراجع الأيقونات #i-* ===');
const artSrc = read('js/art.js');
const glyphBlock = artSrc.slice(artSrc.indexOf('const GLYPHS'), artSrc.indexOf('};', artSrc.indexOf('const GLYPHS')));
const glyphs = new Set([...glyphBlock.matchAll(/'([a-z-]+)':\s*'/g)].map(m => m[1]));
console.log('  أيقونات متاحة: ' + glyphs.size);
const allSrc = htmlFiles.map(f => ({ f: f, s: read(f) })).concat(jsFiles.map(f => ({ f: 'js/' + f, s: read('js/' + f) })));
allSrc.forEach(x => {
  const refs = new Set([...x.s.matchAll(/#i-([a-z-]+)/g)].map(m => m[1]));
  refs.forEach(g => { if (!glyphs.has(g)) err(x.f + ' → أيقونة مفقودة: #i-' + g); });
});

/* ---------- 2) سلامة السكربتات والأنماط والروابط ---------- */
console.log('\n=== 2) مراجع الملفات والروابط الداخلية ===');
htmlFiles.forEach(f => {
  const s = read(f);
  [...s.matchAll(/<script src="([^"]+)"/g)].forEach(m => { if (!exists(m[1])) err(f + ' → سكربت مفقود: ' + m[1]); });
  [...s.matchAll(/<link[^>]+href="([^"]+\.css)"/g)].forEach(m => { if (!exists(m[1])) err(f + ' → نمط مفقود: ' + m[1]); });
  const links = new Set([...s.matchAll(/href="([a-zA-Z0-9_-]+\.html[^"]*)"/g)].map(m => m[1].split('#')[0].split('?')[0]));
  links.forEach(l => { if (!exists(l)) err(f + ' → رابط مكسور: ' + l); });
});

/* ---------- 3) تسلسل السكربتات في كل صفحة ---------- */
console.log('\n=== 3) تسلسل تحميل السكربتات ===');
htmlFiles.forEach(f => {
  const srcs = [...read(f).matchAll(/<script src="js\/([^"]+)"/g)].map(m => m[1]);
  const core = ['data.js', 'store.js', 'art.js', 'ui.js'];
  let idx = -1, ok = true;
  core.forEach(c => {
    const i = srcs.indexOf(c);
    if (i === -1) { warn(f + ' → لا يحمّل ' + c + ' (قد يكون مقصودًا)'); ok = false; return; }
    if (i < idx) { err(f + ' → ترتيب خاطئ: ' + c); ok = false; }
    idx = i;
  });
  if (ok && srcs.length > 4) {
    const page = srcs[srcs.length - 1];
    const known = ['home.js', 'shop.js', 'product.js', 'cart.js', 'checkout.js', 'success.js', 'account.js', 'wishlist.js', 'finder.js', 'gifts.js', 'admin.js'];
    if (known.indexOf(page) === -1) warn(f + ' → سكربت صفحة غير معروف: ' + page);
  }
});

/* ---------- 4) دوال Store / UI / Art المستخدمة مقابل المُصدَّرة ---------- */
console.log('\n=== 4) استدعاءات Store/UI/Art ===');
function exportsOf(src, marker) {
  const i = src.indexOf(marker);
  if (i === -1) return new Set();
  const j = src.indexOf('};', i);
  const block = src.slice(i, j);
  return new Set([...block.matchAll(/([a-zA-Z_$][\w$]*)\s*:\s*([a-zA-Z_$][\w$]*)/g)].map(m => m[1]));
}
const storeExp = exportsOf(read('js/store.js'), 'window.Store =');
const uiExp = exportsOf(read('js/ui.js'), 'window.UI =');
const artExp = exportsOf(read('js/art.js'), 'window.Art =');
jsFiles.forEach(f => {
  const s = read('js/' + f);
  if (f === 'store.js' || f === 'ui.js' || f === 'art.js') return;
  const checks = [['Store', storeExp], ['UI', uiExp], ['Art', artExp]];
  checks.forEach(([ns, exp]) => {
    const used = new Set([...s.matchAll(new RegExp('\\b' + ns + '\\.([a-zA-Z_$][\\w$]*)', 'g'))].map(m => m[1]));
    used.forEach(u => { if (!exp.has(u)) err('js/' + f + ' → ' + ns + '.' + u + ' غير موجود في ' + ns); });
  });
});

/* ---------- 5) أصناف CSS المميزة للصفحات الجديدة ---------- */
console.log('\n=== 5) أصناف CSS للصفحات الجديدة ===');
const allCss = cssFiles.map(f => read('css/' + f)).join('\n');
const defined = new Set([...allCss.matchAll(/\.([a-z][a-z0-9-]+)/g)].map(m => m[1]));
const spotFn = (html, classes) => {
  const s = read(html);
  classes.forEach(c => {
    if (s.includes('"' + c) || s.includes(' ' + c + '"') || s.includes(c + '"') || s.includes("'" + c)) {
      if (!defined.has(c)) err(html + ' → صنف بلا تعريف CSS: .' + c);
    }
  });
};
spotFn('finder.html', ['finder-shell', 'fwide', 'find-intro']);
spotFn('gifts.html', ['gift-grid', 'occ-grid']);
spotFn('404.html', ['nf-wrap', 'nf-card', 'nf-num', 'nf-orn', 'nf-title', 'nf-text', 'nf-actions', 'nf-links', 'nf-quote']);
spotFn('admin.html', ['ad-shell', 'ad-side', 'ad-brand', 'ad-logo', 'ad-nav', 'ad-side-foot', 'ad-main', 'ad-top', 'ad-top-actions', 'ad-content']);
/* الأصناف التي يولدها admin.js حيًا */
const adminJs = read('js/admin.js');
['ad-grid-4', 'ad-grid-2', 'ad-grid-2b', 'ad-panel', 'ad-ph', 'ad-sub-h', 'ad-toolbar', 'ad-thumb', 'ad-prodname',
  'ad-stock', 'ad-actions', 'ad-st-sel', 'vrow', 'ad-detail-grid', 'ad-mini-items', 'ad-mini-item', 'ad-dl',
  'ad-form', 'ad-form-grid', 'ad-fs', 'ad-form-actions', 'ad-form-msg', 'atc-grid', 'atc-card', 'atc-top',
  'ad-tgls', 'ad-tgl', 'banner-preview', 'code-mono', 'donut-wrap', 'donut-legend', 'chart-svg', 'chart-empty',
  'ad-desc', 'ad-note', 'ad-off', 'ad-gold', 'ad-flex', 'ad-count', 'ad-form-wrap', 'ad-offer-row'].forEach(c => {
  if (!adminJs.includes(c)) warn('admin.js لا يستخدم .' + c + ' (تحقق إن كان مقصودًا)');
  if (!defined.has(c)) err('admin → صنف بلا تعريف CSS: .' + c);
});

/* ---------- 6) سلامة صياغة JS ---------- */
console.log('\n=== 6) صياغة السكربتات ===');
const { execFileSync } = require('child_process');
jsFiles.forEach(f => {
  try { execFileSync(process.execPath, ['--check', path.join(ROOT, 'js', f)], { stdio: 'pipe' }); }
  catch (e) { err('js/' + f + ' → خطأ صياغة: ' + String(e.stderr).split('\n')[0]); }
});

/* ---------- 7) فحوص منطقية سريعة ---------- */
console.log('\n=== 7) فحوص منطقية ===');
const idx = read('index.html');
if (!idx.includes('id="heroTitle"')) err('index.html → heroTitle مفقود (يحتاجه بانر اللوحة)');
if (!idx.includes('id="heroSub"')) err('index.html → heroSub مفقود');
const uisrc = read('js/ui.js');
if (!uisrc.includes('chromeOff')) err('ui.js → دعم data-chrome=off مفقود');
const storeSrc = read('js/store.js');
if (!storeSrc.includes('umara_prefs')) warn('store.js لا يعرّف مفتاح prefs');
const finderJs = read('js/finder.js');
if (!finderJs.includes('savePrefs')) warn('finder.js لا يحفظ التفضيلات');
if (!read('js/home.js').includes('umara_banners')) warn('home.js لا يقرأ بانر اللوحة');

console.log('\n============================================');
console.log('النتيجة: ' + errors + ' خطأ، ' + warns + ' تحذير');
console.log('============================================');
process.exit(errors ? 1 : 0);
