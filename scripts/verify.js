/* ============================================================
   دار الأُمراء — DAR AL-UMARA  |  scripts/verify.js
   مجموعة التحقق الوظيفي والانسجام (تعمل بلا أي اعتماديات):
   1) سلامة البيانات: كل ارتباطات المنتجات والطلبات والكوبونات.
   2) محرك المتجر: اختبارات فعلية للسلة والدفع والنقاط والبحث
      عبر تشغيل store.js الحقيقي داخل سياق Node vm.
   3) محرك الرسم: توليد صور وقواميس art.js لكل الكتالوج.
   4) الانسجام الثابت: فحص صفحات HTML وفئات CSS المطلوبة ونظام
      العناوين والأوصاف وترتيب السكربتات وفئات غير معرّفة.
   التشغيل:  node scripts/verify.js
   ============================================================ */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

let pass = 0, fail = 0;
const failures = [];
function ok(cond, label) {
  if (cond) { pass++; return true; }
  fail++; failures.push(label);
  console.log('  [FAIL] ' + label);
  return false;
}
function eq(a, b, label) { return ok(a === b, label + '  (got: ' + JSON.stringify(a) + ' | want: ' + JSON.stringify(b) + ')'); }
function near(a, b, label, eps) {
  eps = eps || 0.0005;
  return ok(Math.abs(a - b) <= eps, label + '  (got: ' + a + ' | want: ' + b + ')');
}
const inSet = (v, set) => set.indexOf(v) !== -1;

/* ---------- تهيئة سياق المتصفح المصغّر ---------- */
const ctx = {};
vm.createContext(ctx);
ctx.window = ctx;              // window === global (كما في المتصفح)
ctx.console = console;
ctx.setTimeout = setTimeout;
ctx.clearTimeout = clearTimeout;
ctx.location = { origin: 'https://umara.example', pathname: '/index.html' };
try {
  vm.runInContext(read('js/data.js'), ctx, { filename: 'data.js' });
  vm.runInContext(read('js/store.js'), ctx, { filename: 'store.js' });
  vm.runInContext(read('js/art.js'), ctx, { filename: 'art.js' });
  // جسر: الربطات المعجمية (const) لا تظهر كخصائص على السياق، فتُنقل إلى window.__DATA
  vm.runInContext('window.__DATA = { STORE_CONFIG: STORE_CONFIG, DICT: DICT, NOTES_DICT: NOTES_DICT, BRANDS: BRANDS, CATEGORIES: CATEGORIES, COLLECTIONS: COLLECTIONS, PRODUCTS: PRODUCTS, SEED_REVIEWS: SEED_REVIEWS, SEED_ORDERS: SEED_ORDERS, SEED_CUSTOMERS: SEED_CUSTOMERS, COUPONS: COUPONS, LOYALTY_REWARDS: LOYALTY_REWARDS, GIFT_OCCASIONS: GIFT_OCCASIONS };', ctx, { filename: 'expose-data.js' });
} catch (e) {
  console.log('[FATAL] تعذّر تشغيل محرّكات الموقع داخل vm: ' + e.message);
  process.exit(1);
}
const S = ctx.Store, A = ctx.Art, D = ctx.__DATA;
ok(S && A, 'window.Store و window.Art معرّفان بعد تحميل السكربتات');

/* ============================================================
   1) سلامة البيانات
   ============================================================ */
console.log('\n== 1) سلامة البيانات ==');
{
  const ids = new Set(D.PRODUCTS.map(p => p.id));
  const GENDER = Object.keys(D.DICT.genders), FAM = Object.keys(D.DICT.families);
  const OCC = Object.keys(D.DICT.occasions), SEA = Object.keys(D.DICT.seasons);
  const CONC = Object.keys(D.DICT.concentrations), ST = Object.keys(D.DICT.statuses);
  const PAY = Object.keys(D.DICT.payments), BADGE = ['bestseller', 'new', 'limited', 'exclusive', 'gift'];
  const KIND = ['bottle', 'box', 'mood'];

  eq(D.PRODUCTS.length, 16, 'عدد المنتجات = 16');
  eq(new Set(D.PRODUCTS.map(p => p.id)).size, 16, 'معرّفات المنتجات فريدة');
  eq(new Set(D.PRODUCTS.map(p => p.slug)).size, 16, 'الروابط (slug) فريدة');

  D.PRODUCTS.forEach(p => {
    const t = 'المنتج ' + p.id;
    ok(p.name_ar && p.name_en && p.short_ar && p.description_ar, t + ': الحقول النصية معبّأة');
    ok(!!D.BRANDS[p.brand], t + ': العلامة موجودة في BRANDS');
    ok(typeof p.price === 'number' && p.price > 0, t + ': السعر > 0');
    ok(p.oldPrice == null || p.oldPrice > p.price, t + ': oldPrice أكبر من price');
    ok(p.rating >= 0 && p.rating <= 5, t + ': التقييم ضمن 0..5');
    ok(Number.isInteger(p.reviewsCount) && p.reviewsCount >= 0, t + ': عدد التقييمات صحيح');
    ok(p.badges.every(b => inSet(b, BADGE)), t + ': الشارات معروفة');
    ok(typeof p.isNew === 'boolean', t + ': isNew منطقي');
    ok(p.tags.gender.length > 0 && p.tags.gender.every(g => inSet(g, GENDER)), t + ': الأجناس معروفة');
    ok(p.tags.families.length > 0 && p.tags.families.every(f => inSet(f, FAM)), t + ': العائلات العطرية معروفة');
    ok(p.tags.occasions.every(o => inSet(o, OCC)), t + ': المناسبات معروفة');
    ok(p.tags.seasons.every(s => inSet(s, SEA)), t + ': الفصول معروفة');
    ok(p.tags.strength >= 1 && p.tags.strength <= 5, t + ': القوة 1..5');
    ['top', 'middle', 'base'].forEach(lv => {
      ok(p.notes[lv] && p.notes[lv].length > 0 && p.notes[lv].every(k => !!D.NOTES_DICT[k]),
        t + ': نوتات ' + lv + ' معروفة');
    });
    ok(!!D.DICT.concentrations[p.concentration], t + ': التركيز معروف');
    ok(p.sizes.length >= 1 && p.sizes.length <= 3 && p.sizes.every(s => typeof s.ml === 'number' && s.ml >= 0 && s.price > 0),
      t + ': الأحجام والأسعار صالحة');
    ok(p.stock >= 0, t + ': المخزون >= 0');
    ok(p.images.length > 0 && p.images.every(im => inSet(im.art, KIND)), t + ': أنواع الصور معروفة');
    ok((p.recommended || []).every(x => ids.has(x)), t + ': recommended تشير لمنتجات موجودة');
    ok((p.coPurchase || []).every(x => ids.has(x)), t + ': coPurchase تشير لمنتجات موجودة');
    ok(p.categories.length > 0 && p.categories.every(c => D.CATEGORIES.some(cat => cat.id === c)),
      t + ': التصنيفات معروفة');
    ok(p.longevity >= 1 && p.longevity <= 5 && p.sillage >= 1 && p.sillage <= 5, t + ': الثبات والفوحان 1..5');
  });

  /* تغطية قواميس المطابق: كل قيمة يجب أن يخدمها منتج واحد على الأقل */
  FAM.forEach(f => ok(D.PRODUCTS.some(p => p.tags.families.includes(f)), 'عائلة "' + f + '" مغطاة بمنتج'));
  GENDER.forEach(g => ok(D.PRODUCTS.some(p => p.tags.gender.includes(g)), 'جنس "' + g + '" مغطى بمنتج'));
  OCC.forEach(o => ok(D.PRODUCTS.some(p => p.tags.occasions.includes(o)), 'مناسبة "' + o + '" مغطاة بمنتج'));
  SEA.forEach(s => ok(D.PRODUCTS.some(p => p.tags.seasons.includes(s)), 'فصل "' + s + '" مغطى بمنتج'));
  CONC.forEach(c => ok(D.PRODUCTS.some(p => p.concentration === c), 'تركيز "' + c + '" مغطى بمنتج'));
  D.CATEGORIES.forEach(c => ok(D.PRODUCTS.some(p => p.categories.includes(c.id)), 'تصنيف "' + c.id + '" مغطى بمنتج'));

  /* الطلبات */
  eq(D.SEED_ORDERS.length, 15, 'عدد الطلبات الأولية = 15');
  eq(new Set(D.SEED_ORDERS.map(o => o.id)).size, 15, 'معرّفات الطلبات فريدة');
  D.SEED_ORDERS.forEach(o => {
    const t = 'الطلب ' + o.id;
    ok(/^\d{4}-\d{2}-\d{2}$/.test(o.date), t + ': صيغة التاريخ');
    ok(/^09\d{8}$/.test(o.phone), t + ': رقم الهاتف سوري');
    ok(inSet(o.status, ST), t + ': الحالة معروفة');
    ok(inSet(o.payment, PAY), t + ': وسيلة الدفع معروفة');
    ok(o.items.length > 0 && o.items.every(i => ids.has(i.pid) && i.qty >= 1 && i.price > 0), t + ': بنود الطلب صالحة');
    const sum = o.items.reduce((n, i) => n + i.price * i.qty, 0);
    near(o.subtotal, sum, t + ': المجموع الفرعي مطابق للبنود');
    near(o.total, o.subtotal - o.discount + o.shipping + o.packaging, t + ': الإجمالي = فرعي - خصم + شحن + تغليف');
    ok(o.coupon == null || D.COUPONS.some(c => c.code === o.coupon), t + ': الكوبون معروف');
  });

  /* العملاء */
  eq(D.SEED_CUSTOMERS.length, 10, 'عدد العملاء الأوليين = 10');
  eq(new Set(D.SEED_CUSTOMERS.map(c => c.phone)).size, 10, 'هواتف العملاء فريدة');
  D.SEED_CUSTOMERS.forEach(c => {
    ok(/^09\d{8}$/.test(c.phone) && c.name, 'العميل ' + c.phone + ': بيانات صالحة');
    ok(c.favorites.every(f => ids.has(f)), 'العميل ' + c.phone + ': المفضلة تشير لمنتجات موجودة');
  });

  /* المجموعات ومناسبات الهدايا والكوبونات */
  eq(D.COLLECTIONS.length, 7, 'عدد المجموعات = 7');
  D.COLLECTIONS.forEach(c => ok(c.products.length > 0 && c.products.every(x => ids.has(x)), 'المجموعة ' + c.id + ': منتجات موجودة'));
  eq(D.GIFT_OCCASIONS.length, 7, 'عدد مناسبات الهدايا = 7');
  D.GIFT_OCCASIONS.forEach(g => ok(g.suggest.every(x => ids.has(x)), 'مناسبة ' + g.id + ': اقتراحات موجودة'));
  eq(D.COUPONS.length, 5, 'عدد الكوبونات = 5');
  D.COUPONS.forEach(c => {
    ok(['percent', 'fixed', 'shipping'].indexOf(c.type) !== -1, 'الكوبون ' + c.code + ': نوع صالح');
    ok(c.value >= 0 && c.min >= 0, 'الكوبون ' + c.code + ': قيم صالحة');
  });
  D.LOYALTY_REWARDS.forEach(r => ok(r.pts > 0 && ['coupon', 'perk', 'gift'].indexOf(r.type) !== -1, 'المكافأة ' + r.id + ': صالحة'));
}

/* ============================================================
   2) محرك المتجر — اختبارات وظيفية على الكود الحقيقي
   ============================================================ */
console.log('\n== 2) محرك المتجر ==');
{
  /* أدوات التنسيق */
  eq(S.price(1234.5), '1,234.500 د.ك', 'تنسيق السعر بالدينار (3 خانات + فاصلة آلاف)');
  eq(S.norm('وُرْدة دمشق'), 'ورده دمشق', 'تطبيع البحث: حركات + ة→ه');
  eq(S.norm('أطلس'), 'اطلس', 'تطبيع البحث: همزة → ا');
  eq(S.discountPct(S.byId('p01')), 19, 'نسبة الخصم p01 = 19%');

  /* السلة */
  S.clearCart();
  eq(S.addToCart('p01', 100, 1), 1, 'إضافة أول قطعة → العدد 1');
  eq(S.addToCart('p01', 100, 2), 3, 'تجميع الكمية لنفس الحجم → 3');
  S.setQty('p01', 100, 0);
  eq(S.cart()[0].qty, 1, 'حد أدنى للكمية = 1');
  S.addToCart('p02', 50, 1);
  eq(S.itemCount(), 2, 'سلة بمنتجين → 2');
  S.setQty('p01', 100, 250);
  eq(S.cart().find(x => x.pid === 'p01').qty, 99, 'حد أقصى للكمية = 99');
  S.setQty('p01', 100, 1);

  /* الحسابات */
  let to = S.totals({});
  near(to.subtotal, 131.5, 'المجموع الفرعي 89 + 42.5');
  to = S.totals({ coupon: 'UMARA10', shippingMethod: 'standard', packaging: true });
  near(to.discount, 13.15, 'خصم UMARA10 = 10%');
  eq(to.shipping, 0, 'الشحن مجاني فوق حد 20 د.ك');
  near(to.packaging, 2, 'تغليف فاخر = 2');
  near(to.total, 120.35, 'الإجمالي الكلي 131.5 - 13.15 + 2');
  to = S.totals({ coupon: 'UMARA10', shippingMethod: 'express' });
  eq(to.shipping, 3, 'الشحن السريع = 3 د.ك');
  near(to.total, 121.35, 'إجمالي الشحن السريع');
  to = S.totals({ coupon: 'FREESHIP', shippingMethod: 'standard' });
  eq(to.shipping, 0, 'كوبون FREESHIP يصفّر الشحن');

  /* الكوبونات */
  ok(S.validateCoupon('umara10', 89, '0955500001').ok, 'قبول الكوبون بأحرف صغيرة');
  ok(!S.validateCoupon('UMARA10', 5, '0955500001').ok, 'رفض كود تحت الحد الأدنى');
  ok(!S.validateCoupon('WELCOME15', 89, '0955500001').ok, 'WELCOME15 مرفوض لعميل لديه طلبات');
  ok(S.validateCoupon('WELCOME15', 89, '99988877').ok, 'WELCOME15 مقبول لعميل جديد');
  ok(!S.validateCoupon('NOPE', 89, '0955500001').ok, 'رفض كود غير موجود');
  near(S.couponAmount(S.findCoupon('GOLD5'), 33).discount, 5, 'خصم ثابت GOLD5 = 5');
  near(S.couponAmount(S.findCoupon('GOLD5'), 3).discount, 3, 'خصم ثابت لا يتجاوز المجموع');

  /* المفضلة */
  ok(S.toggleWish('p03') === true && S.inWish('p03'), 'إضافة للمفضلة');
  ok(S.toggleWish('p03') === false && !S.inWish('p03'), 'إزالة من المفضلة');
  S.toggleWish('p03');
  ok(S.wishPriceDrop({ pid: 'p03', priceAt: 999 }), 'رصد انخفاض السعر');
  ok(!S.wishPriceDrop({ pid: 'p03', priceAt: 1 }), 'لا انخفاض عند السعر الأعلى');
  S.wishMove('p03', 100, 1);
  ok(!S.inWish('p03') && S.cart().some(x => x.pid === 'p03' && x.size === 100), 'نقل المفضلة إلى السلة');

  /* الطلبات */
  const oid = S.placeOrder({
    phone: '99900011', name: 'عميل اختبار', items: [{ pid: 'p01', size: 100, qty: 1, price: 89 }],
    subtotal: 89, discount: 8.9, shipping: 0, packaging: 2, coupon: 'UMARA10', total: 82.1, city: 'دمشق'
  });
  eq(oid, 'ORD-100255', 'ترقيم الطلب الجديد يتبع الأعلى 100254');
  eq(S.orderById(oid).status, 'new', 'الطلب الجديد يبدأ بحالة «جديد»');
  eq(S.allOrders()[0].id, oid, 'الطلب الجديد يتصدر القائمة (الأحدث)');
  eq(S.orderPoints({ total: 82.1 }), 82, 'نقاط الطلب = floor(الإجمالي × 1)');
  S.setOrderStatus(oid, 'shipped');
  eq(S.orderById(oid).status, 'shipped', 'تحديث حالة طلب المستخدم');
  S.setOrderStatus('ORD-100254', 'delivered');
  eq(S.orderById('ORD-100254').status, 'delivered', 'تجاوز حالة طلب أولي (override)');
  eq(S.orderTimeline(S.orderById('ORD-100254')).length, 4, 'الخط الزمني للطلب المُسلَّم 4 مراحل');
  eq(S.orderTimeline(S.orderById('ORD-100214')).length, 2, 'الخط الزمني للطلب الملغي مرحلتان');

  /* التقييمات */
  const before = S.statsFor(S.byId('p05')).count;
  S.addReview('p05', { rating: 5, text: 'عطر استثنائي يفوح طويلًا', longevity: 5, sillage: 4, recommend: true });
  const st = S.statsFor(S.byId('p05'));
  eq(st.count, before + 1, 'إضافة تقييم تزيد العّداد');
  ok(st.list[0].verified === true && st.list[0].text.indexOf('استثنائي') !== -1, 'التقييم يُحفظ موثّقًا بالنص');
  S.markHelpful('p05', st.list[0].uid);
  eq(S.reviewsFor('p05')[0].helpful, 1, 'زر «مفيد» يزيد العداد');

  /* الحساب والنقاط */
  const acc = S.login('0955500001');
  eq(acc.name, 'عبدالله العتيبي', 'دخول العميل التجريبي باسمه');
  eq(S.pointsBalance(), 367, 'رصيد النقاط الأولي 367 (انضمام + 3 طلبات + تقييم)');
  eq(S.updateAccount({ email: 'a@umara.co' }).email, 'a@umara.co', 'تحديث بيانات الحساب');
  ok(S.redeemReward(D.LOYALTY_REWARDS[2]).ok, 'استبدال مكافأة التغليف (150 نقطة)');
  eq(S.pointsBalance(), 217, 'الرصيد بعد الاستبدال = 217');
  const rw2 = S.redeemReward(D.LOYALTY_REWARDS[1]);
  ok(rw2.ok && /^UMARA-RW2-/.test(rw2.code), 'استبدال كوبون شحن شخصي');
  ok(!!S.findCoupon(rw2.code), 'الكوبون الشخصي فعّال في findCoupon');
  ok(!S.redeemReward(D.LOYALTY_REWARDS[4]).ok, 'رفض استبدال يتجاوز الرصيد');
  ok(S.claimInviteBonus().ok, 'مكافأة دعوة صديق تُصرف مرة واحدة');
  ok(!S.claimInviteBonus().ok, 'منع تكرار مكافأة الدعوة');
  eq(S.pointsBalance(), 42, 'الرصيد النهائي = 217 - 200 + 25');
  ok(S.referralLink().indexOf('0955500001') !== -1, 'رابط الدعوة يحمل رقم العميل');
  S.logout();
  ok(!S.redeemReward(D.LOYALTY_REWARDS[0]).ok, 'الاستبدال يتطلب تسجيل الدخول');
  eq(S.login('0955500002').name, 'عميل دار الأُمراء', 'دخول عميل جديد باسم افتراضي');
  eq(S.pointsBalance(), 100, 'عميل جديد: رصيد الانضمام فقط');

  /* العناوين */
  const a1 = S.saveAddress({ title: 'المنزل', city: 'دمشق', area: 'الحمرا', block: '1', street: '2', house: '3', default: true });
  ok(/^ad/.test(a1.id), 'العنوان يُنال معرّفًا فريدًا');
  eq(S.defaultAddress().id, a1.id, 'العنوان الافتراضي الأول');
  const a2 = S.saveAddress({ title: 'العمل', city: 'حلب', area: 'الشرق', block: '4', street: '5', house: '6', default: true });
  eq(S.defaultAddress().id, a2.id, 'تبديل العنوان الافتراضي');
  ok(!S.addresses().find(a => a.id === a1.id).default, 'القديم يفقد صفة الافتراضي');
  S.removeAddress(a1.id);
  eq(S.addresses().length, 1, 'حذف عنوان من عنوانين');

  /* شوهد مؤخرًا والتفضيلات والإعدادات والعرض المحدود */
  S.pushRecent('p05'); S.pushRecent('p06'); S.pushRecent('p05');
  eq(JSON.stringify(S.recentlyViewed()), JSON.stringify(['p05', 'p06']), 'شوهد مؤخرًا: بلا تكرار والأحدث أولًا');
  S.savePrefs({ gender: 'men', families: ['oud'], occasions: ['evening'] });
  eq(S.prefs().gender, 'men', 'حفظ تفضيلات المطابق');
  const p01 = S.byId('p01');
  const end1 = S.offerEnds(p01), end2 = S.offerEnds(p01);
  eq(end1, end2, 'عدّاد العرض ثابت بين الزيارات');
  near(end1 - Date.now(), 72 * 3600 * 1000, 'نهاية العرض = 72 ساعة من أول زيارة', 60000);
  const noSale = D.PRODUCTS.find(p => !p.saleHours);
  if (noSale) eq(S.offerEnds(noSale), null, 'منتج بلا عرض → لا عدّاد');
  S.saveSettings({ freeShippingThreshold: 500 });
  eq(S.settings().freeShippingThreshold, 500, 'تعديل حد الشحن المجاني من الإعدادات');
  to = S.totals({ shippingMethod: 'standard' });
  eq(to.shipping, 1.5, 'تحت الحد الجديد: شحن عادي 1.5 د.ك');
  S.saveSettings({});
  eq(S.settings().freeShippingThreshold, 20, 'استعادة الإعداد الافتراضي');

  /* البحث */
  const r1 = S.search('عود');
  ok(r1.products.length > 0 && r1.notes.some(n => n.key === 'oud'), 'بحث «عود» يطال النوتات');
  const r2 = S.search('عود ملكي');
  eq(r2.products[0].id, 'p01', 'الاسم الكامل يتصدر النتائج');
  const r3 = S.search('OUD');
  ok(r3.brands.some(b => b.id === 'umara') || r3.products.some(p => p.id === 'p01'), 'البحث اللاتيني يطال الاسم الإنجليزي');
  eq(S.search('').products.length, 0, 'بحث فارغ → لا نتائج');
  eq(S.search('zzzqqq').products.length, 0, 'بحث بلا تطابق → لا نتائج');

  /* التوصيات */
  const sim = S.similarTo('p01', 4);
  eq(sim.length, 4, '4 عطور مشابهة لعود ملكي');
  ok(!sim.some(p => p.id === 'p01'), 'لا يقترح المنتج نفسه');
  const ab = S.alsoBought('p01', 3);
  ok(ab.length > 0 && ab.every(p => p01.coPurchase.indexOf(p.id) !== -1), 'اشتروا أيضًا من قائمة الشراء المشترك');
  const fy = S.forYou(4);
  eq(fy.length, 4, 'توصيات شخصية 4 منتجات');
  ok(fy.every(p => p.stock > 0), 'التوصيات الشخصية من المتوفر فقط');
  ok(S.similarTo('__missing__').length === 0, 'معرّف مجهول في المشابهات → قائمة فارغة');

  /* تعديل الكتالوج من الإدارة ثم إعادة الضبط الشامل */
  const custom = JSON.parse(JSON.stringify(D.PRODUCTS));
  custom.find(p => p.id === 'p01').name_ar = 'عود ملكي معدّل';
  S.saveProducts(custom);
  eq(S.byId('p01').name_ar, 'عود ملكي معدّل', 'كتالوج مخصص من لوحة التحكم يسود');
  S.saveCoupons([{ code: 'TESTX', type: 'fixed', value: 1, min: 0, active: true }]);
  ok(!!S.findCoupon('TESTX'), 'كوبونات مخصصة من لوحة التحكم فعّالة');
  S.resetAll();
  eq(S.products().length, 16, 'إعادة الضبط تعيد الكتالوج الأصلي');
  eq(S.byId('p01').name_ar, 'عود ملكي', 'بيانات المنتج الأصلية تعود');
  eq(S.cart().length, 0, 'إعادة الضبط تفرّغ السلة');
  eq(S.wishlist().length, 0, 'إعادة الضبط تفرّغ المفضلة');
  eq(S.account(), null, 'إعادة الضبط تسجّل الخروج');
}

/* ============================================================
   3) محرك الرسم — توليد فعلي لكل الكتالوج
   ============================================================ */
console.log('\n== 3) محرك الرسم ==');
{
  const svgOk = (s, label) => ok(typeof s === 'string' && s.indexOf('<svg') !== -1 && s.indexOf('undefined') === -1, label);
  D.PRODUCTS.forEach(p => {
    svgOk(A.product(p), 'رسم المنتج ' + p.id);
    svgOk(A.box(p), 'رسم العلبة ' + p.id);
  });
  D.CATEGORIES.forEach(c => svgOk(A.category(c.id), 'زخرفة التصنيف ' + c.id));
  D.COLLECTIONS.forEach(c => svgOk(A.collection(c.id), 'زخرفة المجموعة ' + c.id));
  D.GIFT_OCCASIONS.forEach(g => svgOk(A.occasion(g.id), 'زخرفة مناسبة ' + g.id));
  svgOk(A.monogram('ع'), 'النقش العربي الأحادي');

  const glyphKeys = Object.keys(A.GLYPHS);
  ok(glyphKeys.length >= 70, 'عدد الأيقونات >= 70 (فعليًا ' + glyphKeys.length + ')');
  const sprite = A.iconSprite();
  const missing = glyphKeys.filter(k => sprite.indexOf('id="i-' + k + '"') === -1);
  eq(missing.length, 0, 'كل الأيقونات مولّدة داخل sprite' + (missing.length ? ' — ناقص: ' + missing.join(', ') : ''));
  D.CATEGORIES.forEach(c => ok(!!A.GLYPHS[c.glyph], 'أيقونة التصنيف ' + c.id + ' موجودة'));
  D.COLLECTIONS.forEach(c => ok(!!A.GLYPHS[c.glyph], 'أيقونة المجموعة ' + c.id + ' موجودة'));
  D.GIFT_OCCASIONS.forEach(g => ok(!!A.GLYPHS[g.glyph], 'أيقونة المناسبة ' + g.id + ' موجودة'));

  D.PRODUCTS.forEach(p => ok(!!A.ART_MAP[p.id], 'خريطة الرسم تغطي ' + p.id));
  const pp = JSON.parse(JSON.stringify(D.PRODUCTS[0]));
  pp.art = { shape: 'round', palette: 'rose' };
  ok(A.product(pp) !== A.product(D.PRODUCTS[0]), 'اختيار الإدارة (shape/palette) يغيّر رسم المنتج');
}

/* ============================================================
   4) الانسجام الثابت — صفحات HTML وفئات CSS
   ============================================================ */
console.log('\n== 4) انسجام الصفحات و CSS ==');
{
  const files = fs.readdirSync(ROOT).filter(f => f.endsWith('.html')).sort();
  ok(files.length >= 12, 'عدد الصفحات >= 12 (فعليًا ' + files.length + ')');

  let cssAll = '';
  fs.readdirSync(path.join(ROOT, 'css')).filter(f => f.endsWith('.css'))
    .forEach(f => { cssAll += '\n' + fs.readFileSync(path.join(ROOT, 'css', f), 'utf8'); });
  const cssHas = tok => new RegExp('\\.' + tok.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?![\\w-])').test(cssAll);

  const coreOrder = ['data.js', 'store.js', 'art.js', 'ui.js'];
  files.forEach(f => {
    const html = fs.readFileSync(path.join(ROOT, f), 'utf8');
    const isAdmin = f === 'admin.html';
    ok(/<html[^>]+dir="rtl"[^>]*lang="ar"|<html[^>]+lang="ar"[^>]*dir="rtl"/.test(html), f + ': اتجاه RTL ولغة عربية');
    ok(/<title>[^<]{4,}<\/title>/.test(html), f + ': عنوان الصفحة');
    ok(/name="description"\s+content="[^"]{20,}"/.test(html) || /content="[^"]{20,}"\s+name="description"/.test(html), f + ': الوصف التعريفي');
    ok(/name="viewport"/.test(html), f + ': منفذ العرض للجوال');
    ok(/data-page="[a-z0-9-]+"/.test(html), f + ': السمة data-page');
    ok(/data-chrome="off"/.test(html) === isAdmin, f + ': إعداد الهيكل العام (chrome)');

    const scripts = [...html.matchAll(/src="js\/([\w.-]+\.js)"/g)].map(m => m[1]);
    ok(scripts.length >= 4, f + ': يحمّل السكربتات (' + scripts.length + ')');
    const idx = coreOrder.map(c => scripts.indexOf(c));
    ok(idx.every((v, i) => v !== -1 && (i === 0 || v > idx[i - 1])), f + ': ترتيب data → store → art → ui');
    const pageJs = scripts.slice(4);
    ok(pageJs.length <= 1, f + ': سكربت صفحة واحد على الأكثر (' + (pageJs.join(',') || 'بلا') + ')');
    // القوالب الديناميكية (المنتج/النجاح) تبني الـ h1 من سكربت الصفحة — نتحقق من الإجمالي الفعلي
    const h1 = (html.match(/<h1[\s>]/g) || []).length;
    const injectedH1 = pageJs.some(s => fs.readFileSync(path.join(ROOT, 'js', s), 'utf8').indexOf('<h1') !== -1);
    eq(h1 + (injectedH1 ? 1 : 0), 1, f + ': عنوان h1 واحد (ثابت أو يُبنى من السكربت)');
    scripts.forEach(s => ok(fs.existsSync(path.join(ROOT, 'js', s)), f + ': وجود الملف js/' + s));

    const imgs = [...html.matchAll(/<img\b[^>]*>/g)].map(m => m[0]);
    ok(imgs.every(tag => /alt="/.test(tag)), f + ': كل الصور ببديل نصي alt');

    const tokens = new Set();
    [...html.matchAll(/class="([^"]*)"/g)].forEach(m => m[1].split(/\s+/).filter(Boolean).forEach(t => tokens.add(t)));
    const missing = [...tokens].filter(t => !cssHas(t));
    eq(missing.length, 0, f + ': كل الفئات معرّفة في CSS' + (missing.length ? ' — ناقص: ' + missing.join(', ') : ''));
  });
}

/* ============================================================
   الخلاصة
   ============================================================ */
console.log('\n----------------------------------------');
console.log('نتيجة التحقق: ' + pass + ' ناجح، ' + fail + ' فاشل');
if (failures.length) {
  console.log('الإخفاقات:');
  failures.forEach(f => console.log('  - ' + f));
  process.exitCode = 1;
} else {
  console.log('الموقع سليم وظيفيًا ومتّسق بالكامل.');
}
