/* ============================================================
   دار الأُمراء — DAR AL-UMARA  |  js/data.js
   الطبقة الأساسية للبيانات: الإعدادات، القواميس، العلامات،
   التصنيفات، المجموعات، المنتجات، التقييمات، الطلبات، الكوبونات.
   لا تعتمد على أي ملف آخر — تُحمَّل أولاً.
   ============================================================ */

const STORE_CONFIG = {
  brandAr: 'دار الأُمراء',
  brandEn: 'DAR AL-UMARA',
  tagline: 'دار العطور الفاخرة',
  currency: { code: 'KWD', symbol: 'د.ك', decimals: 3 },
  whatsapp: '963936305204',
  freeShippingThreshold: 20,
  shippingMethods: [
    { id: 'standard', ar: 'توصيل عادي', eta: '1–2 يوم عمل', fee: 1.5 },
    { id: 'express', ar: 'توصيل سريع', eta: 'خلال 24 ساعة', fee: 3 }
  ],
  packaging: { ar: 'تغليف فاخر بالشريط الذهبي', fee: 2 },
  loyalty: { name: 'نادي العطور', perKwd: 1, signup: 100, review: 50, invite: 25, referralCode: 'UMARA-FRIEND' }
};

/* ---------------- القواميس ---------------- */
const DICT = {
  families: {
    woody: 'خشبية', oriental: 'شرقية', floral: 'زهرية', citrus: 'حمضية',
    sweet: 'حلوة', fresh: 'منعشة', spicy: 'توابل', oud: 'عود', musk: 'مسك', gourmand: 'غورماند', aquatic: 'مائية', aromatic: 'عطرية'
  },
  occasions: { daily: 'يوميًا', work: 'العمل', special: 'المناسبات', evening: 'السهرات', travel: 'السفر', sport: 'الرياضة' },
  seasons: { summer: 'الصيف', winter: 'الشتاء', spring: 'الربيع', autumn: 'الخريف', all: 'جميع الفصول' },
  genders: { men: 'رجالي', women: 'نسائي', unisex: 'للجنسين' },
  concentrations: { EDP: 'أو دو بارفان', EDT: 'أو دو تواليت', Parfum: 'بارفان', Extrait: 'إكستريه', SET: 'طقم', Bakhoor: 'بخور' },
  statuses: { new: 'جديدة', processing: 'قيد التجهيز', shipped: 'تم الشحن', delivered: 'تم التسليم', cancelled: 'ملغاة', returned: 'مرتجعة' },
  payments: { knet: 'كي نت', card: 'بطاقة ائتمانية', applepay: 'Apple Pay', paypal: 'PayPal', cod: 'الدفع عند الاستلام' },
  strengths: { 1: 'خفيف جدًا', 2: 'خفيف', 3: 'متوسط', 4: 'قوي', 5: 'قوي جدًا' }
};

/* ---------------- قاموس المكوّنات (يغذّي البحث والهرم العطري) ---------------- */
const NOTES_DICT = {
  bergamot:        { ar: 'البرغموت',        desc: 'انطلاقة حمضية مشرقة من كالابريا' },
  saffron:         { ar: 'الزعفران',        desc: 'توابل ذهبية نادرة تمنح العطر حضورًا ملكيًا' },
  rose:            { ar: 'الورد',           desc: 'زهرة فاخرة متعددة الطبقات، قلب العطور الشرقية' },
  oud:             { ar: 'العود',           desc: 'أخشاب معتّقة فاخرة تمنح العطر عمقًا وأصالة' },
  amber:           { ar: 'العنبر',          desc: 'راتنج دافئ يمنح ثباتًا استثنائيًا' },
  musk:            { ar: 'المسك',           desc: 'نعومة نظيفة تبقى قريبة من البشرة' },
  sandalwood:      { ar: 'خشب الصندل',      desc: 'خشب كريمي هادئ يمنح العطر نعومة' },
  lychee:          { ar: 'الليتشي',         desc: 'فاكهة استوائية حلوة ومنعشة' },
  peony:           { ar: 'الفاوانيا',       desc: 'زهرة ناعمة براقة' },
  cinnamon:        { ar: 'القرفة',          desc: 'دفء حار وحلو' },
  'blood-orange':  { ar: 'البرتقال الدموي', desc: 'انطلاقة فاكهية غنية' },
  frankincense:    { ar: 'اللبان',          desc: 'رائحة المجالس العربية الأصيلة' },
  vanilla:         { ar: 'الفانيلا',        desc: 'حلاوة كريمية أنيقة من مدغشقر' },
  tonka:           { ar: 'التونكا',         desc: 'حبوب دافئة بحلاوة لوزية' },
  'orange-blossom':{ ar: 'زهر البرتقال',    desc: 'انطلاقة زهرية عذبة' },
  lily:            { ar: 'الزنبق',          desc: 'زهرة بيضاء نقية' },
  cardamom:        { ar: 'الهيل',           desc: 'توابل شرقية باردة وأنيقة' },
  nutmeg:          { ar: 'جوزة الطيب',      desc: 'توابل دافئة تمنح العطر عمقًا' },
  leather:         { ar: 'الجلد',           desc: 'حضور جسور فخم' },
  patchouli:       { ar: 'الباتشولي',       desc: 'أرضي عميق يثبّت قلب العطر' },
  lemon:           { ar: 'الليمون',         desc: 'انتعاش حمضي نقي' },
  neroli:          { ar: 'النيرولي',        desc: 'زهر برتقال فاخر منعش' },
  geranium:        { ar: 'إبرة الراعي',     desc: 'زهرية عشبية متوازنة' },
  cedar:           { ar: 'خشب الأرز',       desc: 'خشب جاف أنيق' },
  'pink-pepper':   { ar: 'الفلفل الوردي',   desc: 'لمسة توابل وردية شفافة' },
  jasmine:         { ar: 'الياسمين',        desc: 'زهرة بيضاء ليلية آسرة' },
  tuberose:        { ar: 'التوبروز',        desc: 'زهرة بيضاء كثيفة وفخمة' },
  cypress:         { ar: 'السرو',           desc: 'خشبي عشبي منعش' },
  almond:          { ar: 'اللوز',           desc: 'حلاوة مكسرات ناعمة' },
  orchid:          { ar: 'الأوركيد',        desc: 'زهرة استوائية غامضة' },
  pear:            { ar: 'الكمثرى',         desc: 'فاكهية عصيرية ناعمة' },
  basil:           { ar: 'الحبق',           desc: 'عشبي أخضر منعش' },
  grapefruit:      { ar: 'الجريب فروت',     desc: 'حمضية مرّة راقية' },
  sage:            { ar: 'المريمية',        desc: 'عشبية أرضية أنيقة' },
  vetiver:         { ar: 'الفيتيفر',        desc: 'جذور خشبية دخانية' },
  sea:             { ar: 'نوتات بحرية',     desc: 'انتعاش مائي نقي' },
  chocolate:       { ar: 'الشوكولاتة الداكنة', desc: 'حلاوة غنية جسورة' }
};

/* ---------------- العلامات التجارية ---------------- */
const BRANDS = {
  umara:   { ar: 'دار الأُمراء',   en: 'UMARA',        accent: '#CBAA6C', desc: 'دارنا الأم — تمزج تراث العود بأرقى اللمسات العصرية.' },
  noor:   { ar: 'ميزون نُور',  en: 'MAISON NOOR', accent: '#C9A227', desc: 'أناقة فرنسية بروح شرقية.' },
  awj:    { ar: 'أوج الشرق',   en: 'AWJ AL SHARQ', accent: '#B8935A', desc: 'عطور استثنائية مستوحاة من قصور الشرق.' },
  lujain: { ar: 'لُجين',       en: 'LUJAIN',      accent: '#D8B4A0', desc: 'زهور نادرة بروح ذهبية ناعمة.' },
  nafah:  { ar: 'نَفَح',       en: 'NAFAH',       accent: '#C7B27A', desc: 'نفحات يومية فاخرة بأسعار مدروسة.' },
  siraj:  { ar: 'سِراج',       en: 'SIRAJ',       accent: '#9FAEB8', desc: 'خشبيات عصرية للرجل الأنيق.' }
};

/* ---------------- التصنيفات (بطاقات الأقسام) ---------------- */
const CATEGORIES = [
  { id: 'men',      ar: 'عطور رجالية',   glyph: 'shield',   accent: '#B8935A' },
  { id: 'women',    ar: 'عطور نسائية',   glyph: 'flower',   accent: '#D8B4A0' },
  { id: 'unisex',   ar: 'عطور للجنسين',  glyph: 'infinity', accent: '#CBAA6C' },
  { id: 'luxury',   ar: 'عطور فاخرة',    glyph: 'crown',    accent: '#D4AF37' },
  { id: 'oriental', ar: 'العطور الشرقية', glyph: 'star8',    accent: '#C9A227' },
  { id: 'western',  ar: 'العطور الغربية', glyph: 'tower',    accent: '#9FAEB8' },
  { id: 'oud',      ar: 'عطور العود',    glyph: 'wood',     accent: '#A67C52' },
  { id: 'musk',     ar: 'المسك',         glyph: 'moon',     accent: '#E8DED0' },
  { id: 'bakhoor',  ar: 'البخور',        glyph: 'smoke',    accent: '#8A9B8E' },
  { id: 'gifts',    ar: 'أطقم الهدايا',  glyph: 'gift',     accent: '#D4AF37' }
];

/* ---------------- المجموعات الحصرية ---------------- */
const COLLECTIONS = [
  { id: 'royal-oud', ar: 'مجموعة العود الفاخرة', desc: 'أجود أنواع العود المعتّق بلمسة ملكية.', accent: '#A67C52', glyph: 'wood',   products: ['p01', 'p07', 'p11'] },
  { id: 'occasions', ar: 'مجموعة المناسبات',     desc: 'عطور تكتب لحظاتك الاستثنائية.',        accent: '#D4AF37', glyph: 'star8',  products: ['p05', 'p08', 'p13'] },
  { id: 'royal',     ar: 'مجموعة العطور الملكية', desc: 'تحف عطرية بثبات وحضور لا يُنسى.',       accent: '#CBAA6C', glyph: 'crown',  products: ['p01', 'p03', 'p05', 'p13', 'p14'] },
  { id: 'daily',     ar: 'مجموعة العطور اليومية', desc: 'نفحات خفيفة أنيقة ترافقك كل يوم.',      accent: '#C7B27A', glyph: 'sun',    products: ['p04', 'p06', 'p09', 'p12', 'p16'] },
  { id: 'oriental',  ar: 'مجموعة العطور الشرقية', desc: 'دفء العنبر والعود والعنبر الرمادي.',    accent: '#C9A227', glyph: 'star8',  products: ['p03', 'p05', 'p07', 'p11', 'p14'] },
  { id: 'summer',    ar: 'مجموعة العطور الصيفية', desc: 'انتعاش مشمس لأيام الصيف الطويلة.', accent: '#9FC4C9', glyph: 'wave', products: ['p06', 'p08', 'p16'] },
  { id: 'winter',    ar: 'مجموعة العطور الشتوية', desc: 'دفء التوابل والأخشاب لأمسيات الشتاء.',   accent: '#B8935A', glyph: 'snow',   products: ['p01', 'p03', 'p10', 'p15'] }
];

/* ---------------- كتالوج العطور (16 عطرًا) ----------------
   الحقول: id, slug, name_ar, name_en, brand, price, oldPrice, currency,
   badges[], rating, reviewsCount, tags{families,gender,occasions,seasons,strength},
   notes{top,middle,base}, concentration, sizes[{ml,price,label?}], stock,
   images[], recommended[], categories[], longevity, sillage, isNew,
   bestsellerRank, saleHours, coPurchase[], short_ar, description_ar, createdAt */
const PRODUCTS = [
  {
    id: 'p01', slug: 'oud-royal', name_ar: 'عود ملكي', name_en: 'Oud Royal', brand: 'umara',
    price: 89, oldPrice: 110, currency: 'KWD',
    badges: ['bestseller', 'exclusive'], rating: 4.9, reviewsCount: 214,
    tags: { families: ['oud', 'oriental', 'woody'], gender: ['men', 'unisex'], occasions: ['evening', 'special'], seasons: ['winter', 'autumn'], strength: 5 },
    notes: { top: ['bergamot', 'saffron'], middle: ['rose', 'oud'], base: ['amber', 'musk', 'sandalwood'] },
    concentration: 'EDP',
    sizes: [{ ml: 50, price: 59 }, { ml: 100, price: 89 }],
    stock: 24,
    images: [{ art: 'bottle' }, { art: 'box' }, { art: 'mood' }],
    recommended: ['p07', 'p11', 'p03', 'p13'],
    categories: ['men', 'unisex', 'luxury', 'oriental', 'oud'],
    longevity: 5, sillage: 5, isNew: false, bestsellerRank: 1, saleHours: 72,
    coPurchase: ['p07', 'p11', 'p03'],
    short_ar: 'عود كمبودي معتّق وورد طائفي بثبات استثنائي',
    description_ar: 'تحفة شرقية بامتياز؛ عود كمبودي معتّق يلتقي بورد طائفي وزعفران ذهبي، ليترك خلفك أثرًا لا يُنسى في كل مجلس.',
    createdAt: '2026-03-12'
  },
  {
    id: 'p02', slug: 'damascus-rose', name_ar: 'وردة دمشق', name_en: 'Damascus Rose', brand: 'lujain',
    price: 42.5, oldPrice: 55, currency: 'KWD',
    badges: ['bestseller'], rating: 4.7, reviewsCount: 186,
    tags: { families: ['floral'], gender: ['women'], occasions: ['special', 'daily'], seasons: ['spring'], strength: 3 },
    notes: { top: ['lychee', 'bergamot'], middle: ['rose', 'peony'], base: ['musk', 'amber'] },
    concentration: 'EDP',
    sizes: [{ ml: 30, price: 29.5 }, { ml: 50, price: 42.5 }],
    stock: 40,
    images: [{ art: 'bottle' }, { art: 'box' }, { art: 'mood' }],
    recommended: ['p08', 'p10', 'p12'],
    categories: ['women', 'western'],
    longevity: 4, sillage: 3, isNew: false, bestsellerRank: 3, saleHours: null,
    coPurchase: ['p08', 'p10'],
    short_ar: 'ورد دمشقي نديّ بلمسة ليتشي مشرقة',
    description_ar: 'باقة من ورد دمشقي نديّ تتفتح على ليتشي مشرق، لتُغلق بنعومة مسكية دافئة؛ أنوثة راقية تدوم طويلًا.',
    createdAt: '2026-02-08'
  },
  {
    id: 'p03', slug: 'amber-night', name_ar: 'عنبر الليل', name_en: 'Amber Night', brand: 'noor',
    price: 76, oldPrice: 95, currency: 'KWD',
    badges: ['bestseller'], rating: 4.8, reviewsCount: 163,
    tags: { families: ['oriental', 'spicy'], gender: ['unisex'], occasions: ['evening'], seasons: ['winter'], strength: 5 },
    notes: { top: ['cinnamon', 'blood-orange'], middle: ['amber', 'frankincense'], base: ['vanilla', 'tonka', 'musk'] },
    concentration: 'EDP',
    sizes: [{ ml: 50, price: 52 }, { ml: 100, price: 76 }],
    stock: 18,
    images: [{ art: 'bottle' }, { art: 'box' }, { art: 'mood' }],
    recommended: ['p05', 'p07', 'p01'],
    categories: ['unisex', 'luxury', 'oriental'],
    longevity: 5, sillage: 4, isNew: false, bestsellerRank: 2, saleHours: 48,
    coPurchase: ['p01', 'p05'],
    short_ar: 'عنبر دافئ وقرفة على قاعدة فانيلا غنية',
    description_ar: 'ليلة شتوية في زجاجة؛ قرفة دافئة وبرتقال دموي يفتحان الطريق لعنبر ذهبي ولبان، على قاعدة فانيلا وتونكا لا تقاوم.',
    createdAt: '2026-01-20'
  },
  {
    id: 'p04', slug: 'white-musk', name_ar: 'مسك أبيض', name_en: 'White Musk', brand: 'nafah',
    price: 35, oldPrice: null, currency: 'KWD',
    badges: [], rating: 4.6, reviewsCount: 142,
    tags: { families: ['musk', 'fresh'], gender: ['women'], occasions: ['daily', 'work'], seasons: ['all'], strength: 2 },
    notes: { top: ['orange-blossom'], middle: ['musk', 'lily'], base: ['musk', 'vanilla'] },
    concentration: 'EDP',
    sizes: [{ ml: 50, price: 35 }, { ml: 100, price: 55 }],
    stock: 46,
    images: [{ art: 'bottle' }, { art: 'box' }, { art: 'mood' }],
    recommended: ['p12', 'p02'],
    categories: ['women', 'musk'],
    longevity: 3, sillage: 2, isNew: false, bestsellerRank: 5, saleHours: null,
    coPurchase: ['p12', 'p16'],
    short_ar: 'نقاء المسك الأبيض بلمسة زهر البرتقال',
    description_ar: 'تعريف النقاء: مسك أبيض ناعم يلامس البشرة كالحرير، بافتتاحية من زهر البرتقال؛ رفيقك اليومي الأنيق.',
    createdAt: '2026-01-05'
  },
  {
    id: 'p05', slug: 'saffron-gold', name_ar: 'زعفران الذهب', name_en: 'Saffron Gold', brand: 'awj',
    price: 95, oldPrice: 120, currency: 'KWD',
    badges: ['new', 'exclusive'], rating: 4.9, reviewsCount: 98,
    tags: { families: ['spicy', 'oriental'], gender: ['unisex'], occasions: ['special'], seasons: ['autumn', 'winter'], strength: 4 },
    notes: { top: ['saffron', 'nutmeg'], middle: ['rose', 'leather'], base: ['oud', 'amber', 'patchouli'] },
    concentration: 'Extrait',
    sizes: [{ ml: 50, price: 68 }, { ml: 100, price: 95 }],
    stock: 4,
    images: [{ art: 'bottle' }, { art: 'box' }, { art: 'mood' }],
    recommended: ['p03', 'p13', 'p01'],
    categories: ['unisex', 'luxury', 'oriental'],
    longevity: 5, sillage: 5, isNew: true, bestsellerRank: null, saleHours: 120,
    coPurchase: ['p13', 'p01'],
    short_ar: 'زعفران وجلد وورد على قاعدة عود ملكي',
    description_ar: 'إصدار حصري بتركيز إكستريه؛ زعفران ذهبي يعانق جلدًا ناعمًا ووردًا فاخرًا، ليجلس على عرش من العود والعنبر.',
    createdAt: '2026-09-01'
  },
  {
    id: 'p06', slug: 'italian-bergamot', name_ar: 'برغموت إيطالي', name_en: 'Italian Bergamot', brand: 'umara',
    price: 44, oldPrice: 56, currency: 'KWD',
    badges: ['bestseller'], rating: 4.5, reviewsCount: 127,
    tags: { families: ['citrus', 'aromatic'], gender: ['men'], occasions: ['daily', 'work'], seasons: ['summer', 'spring'], strength: 2 },
    notes: { top: ['bergamot', 'lemon'], middle: ['neroli', 'geranium'], base: ['musk', 'cedar'] },
    concentration: 'EDT',
    sizes: [{ ml: 50, price: 29.9 }, { ml: 100, price: 44 }],
    stock: 52,
    images: [{ art: 'bottle' }, { art: 'box' }, { art: 'mood' }],
    recommended: ['p16', 'p15', 'p09'],
    categories: ['men', 'western'],
    longevity: 3, sillage: 3, isNew: false, bestsellerRank: 4, saleHours: null,
    coPurchase: ['p16', 'p15'],
    short_ar: 'برغموت كالابريا وانطلاقة صباحية مشرقة',
    description_ar: 'صباح إيطالي في قارورة؛ برغموت كالابريا المشرق مع نيرولي متوهج، ينتهي بمسك نظيف وخشب أرز أنيق. منعش لا يُقاوم.',
    createdAt: '2026-02-14'
  },
  {
    id: 'p07', slug: 'oud-rose', name_ar: 'عود وورد', name_en: 'Oud & Rose', brand: 'awj',
    price: 82, oldPrice: null, currency: 'KWD',
    badges: ['new'], rating: 4.8, reviewsCount: 154,
    tags: { families: ['oud', 'floral', 'oriental'], gender: ['women'], occasions: ['evening', 'special'], seasons: ['winter'], strength: 4 },
    notes: { top: ['rose', 'pink-pepper'], middle: ['oud', 'patchouli'], base: ['musk', 'amber'] },
    concentration: 'EDP',
    sizes: [{ ml: 50, price: 56 }, { ml: 100, price: 82 }],
    stock: 15,
    images: [{ art: 'bottle' }, { art: 'box' }, { art: 'mood' }],
    recommended: ['p01', 'p14', 'p03'],
    categories: ['women', 'oriental', 'oud'],
    longevity: 5, sillage: 4, isNew: true, bestsellerRank: 7, saleHours: null,
    coPurchase: ['p01', 'p03'],
    short_ar: 'ثنائية الورد والعود في أبهى صورها',
    description_ar: 'الثنائية الأسطورية: ورد ناعم بلمسة فلفل وردي يعانق عودًا فاخرًا وباتشولي عميقًا؛ فخامة شرقية بلمسة أنثوية.',
    createdAt: '2026-08-20'
  },
  {
    id: 'p08', slug: 'jasmine-night', name_ar: 'ليل الياسمين', name_en: 'Jasmine Night', brand: 'lujain',
    price: 48, oldPrice: null, currency: 'KWD',
    badges: [], rating: 4.7, reviewsCount: 112,
    tags: { families: ['floral'], gender: ['women'], occasions: ['evening', 'special'], seasons: ['spring', 'summer'], strength: 3 },
    notes: { top: ['jasmine', 'bergamot'], middle: ['tuberose', 'orange-blossom'], base: ['sandalwood', 'musk'] },
    concentration: 'EDP',
    sizes: [{ ml: 30, price: 31 }, { ml: 50, price: 48 }],
    stock: 33,
    images: [{ art: 'bottle' }, { art: 'box' }, { art: 'mood' }],
    recommended: ['p02', 'p14'],
    categories: ['women', 'western'],
    longevity: 4, sillage: 3, isNew: false, bestsellerRank: null, saleHours: null,
    coPurchase: ['p02', 'p14'],
    short_ar: 'ياسمين ليلي وتوبروز بلمسة صندل',
    description_ar: 'حديقة ليلية مزهرة؛ ياسمين آسر يتفتح مع توبروز مخملي، ليستقر على صندل كريمي ومسك ناعم. أنوثة خالدة.',
    createdAt: '2026-04-02'
  },
  {
    id: 'p09', slug: 'indian-sandalwood', name_ar: 'صندل هندي', name_en: 'Indian Sandalwood', brand: 'noor',
    price: 58, oldPrice: null, currency: 'KWD',
    badges: ['new'], rating: 4.6, reviewsCount: 88,
    tags: { families: ['woody'], gender: ['men'], occasions: ['work', 'daily'], seasons: ['all'], strength: 3 },
    notes: { top: ['cardamom', 'bergamot'], middle: ['sandalwood', 'cypress'], base: ['vanilla', 'amber', 'musk'] },
    concentration: 'EDP',
    sizes: [{ ml: 50, price: 42 }, { ml: 100, price: 58 }],
    stock: 0,
    images: [{ art: 'bottle' }, { art: 'box' }, { art: 'mood' }],
    recommended: ['p15', 'p06', 'p05'],
    categories: ['men', 'western'],
    longevity: 4, sillage: 3, isNew: true, bestsellerRank: null, saleHours: null,
    coPurchase: ['p15', 'p06'],
    short_ar: 'صندل ميسور كريمي بهيل دافئ',
    description_ar: 'صندل هندي أصيل بلمسة هيل وبرغموت؛ خشب كريمي هادئ يمنح حضورًا واثقًا بلا مبالغة. أناقة الرجل العصري.',
    createdAt: '2026-08-28'
  },
  {
    id: 'p10', slug: 'bourbon-vanilla', name_ar: 'فانيلا بوربون', name_en: 'Bourbon Vanilla', brand: 'nafah',
    price: 62, oldPrice: 74, currency: 'KWD',
    badges: ['bestseller'], rating: 4.5, reviewsCount: 173,
    tags: { families: ['sweet', 'gourmand'], gender: ['women'], occasions: ['evening', 'daily'], seasons: ['winter'], strength: 3 },
    notes: { top: ['vanilla', 'orange-blossom'], middle: ['tonka', 'almond'], base: ['musk', 'sandalwood'] },
    concentration: 'EDP',
    sizes: [{ ml: 50, price: 44 }, { ml: 100, price: 62 }],
    stock: 37,
    images: [{ art: 'bottle' }, { art: 'box' }, { art: 'mood' }],
    recommended: ['p02', 'p12', 'p14'],
    categories: ['women', 'western'],
    longevity: 4, sillage: 3, isNew: false, bestsellerRank: 6, saleHours: null,
    coPurchase: ['p02', 'p12'],
    short_ar: 'فانيلا مدغشقر كريمية دافئة',
    description_ar: 'دفء الفانيلا المدغشقرية الكريمية مع تونكا ولوز، يستقر على مسك ناعم؛ عطور حلوة راقية تناسب أمسيات الشتاء.',
    createdAt: '2026-03-30'
  },
  {
    id: 'p11', slug: 'bakhoor-umara', name_ar: 'بخور دار الأُمراء', name_en: 'Bakhoor Al-Umara', brand: 'umara',
    price: 65, oldPrice: null, currency: 'KWD',
    badges: ['exclusive'], rating: 4.9, reviewsCount: 76,
    tags: { families: ['oriental', 'oud'], gender: ['unisex'], occasions: ['special', 'evening'], seasons: ['winter', 'autumn'], strength: 4 },
    notes: { top: ['frankincense', 'amber'], middle: ['oud', 'rose'], base: ['musk', 'sandalwood'] },
    concentration: 'Bakhoor',
    sizes: [{ ml: 50, price: 65, label: 'بخور 50 غرامًا' }],
    stock: 12,
    images: [{ art: 'bottle' }, { art: 'box' }, { art: 'mood' }],
    recommended: ['p01', 'p13', 'p07'],
    categories: ['unisex', 'oriental', 'bakhoor', 'luxury'],
    longevity: 5, sillage: 5, isNew: false, bestsellerRank: null, saleHours: null,
    coPurchase: ['p01', 'p13'],
    short_ar: 'بخور فاخر برائحة المجالس العربية',
    description_ar: 'خلطة البخور الخاصة بالدار: لبان وعنبر يعانقان العود والورد؛ رائحة المجالس الأصيلة بلمسة معاصرة فاخرة.',
    createdAt: '2026-05-18'
  },
  {
    id: 'p12', slug: 'musk-ghazal', name_ar: 'مسك الغزال', name_en: 'Musk Ghazal', brand: 'nafah',
    price: 28.5, oldPrice: null, currency: 'KWD',
    badges: ['new'], rating: 4.6, reviewsCount: 95,
    tags: { families: ['musk'], gender: ['women'], occasions: ['daily'], seasons: ['all'], strength: 2 },
    notes: { top: ['orange-blossom'], middle: ['musk', 'jasmine'], base: ['amber', 'sandalwood'] },
    concentration: 'EDP',
    sizes: [{ ml: 50, price: 28.5 }, { ml: 100, price: 42 }],
    stock: 58,
    images: [{ art: 'bottle' }, { art: 'box' }, { art: 'mood' }],
    recommended: ['p04', 'p10', 'p02'],
    categories: ['women', 'musk'],
    longevity: 3, sillage: 2, isNew: true, bestsellerRank: null, saleHours: null,
    coPurchase: ['p04', 'p10'],
    short_ar: 'مسك ناعم يشبه نعومة الحرير',
    description_ar: 'كالنسمة على الحرير؛ مسك ناعم مع ياسمين وزهر برتقال، يستقر على عنبر وصندل بلمسة أنثوية نقية.',
    createdAt: '2026-09-10'
  },
  {
    id: 'p13', slug: 'royal-gift-set', name_ar: 'طقم الهدايا الملكي', name_en: 'Royal Gift Set', brand: 'umara',
    price: 150, oldPrice: 180, currency: 'KWD',
    badges: ['gift', 'exclusive', 'bestseller'], rating: 4.9, reviewsCount: 64,
    tags: { families: ['oriental', 'oud', 'musk'], gender: ['unisex'], occasions: ['special'], seasons: ['all'], strength: 4 },
    notes: { top: ['frankincense'], middle: ['oud', 'rose'], base: ['musk', 'amber'] },
    concentration: 'SET',
    sizes: [{ ml: 0, price: 150, label: 'عبوتان 50 مل + بخور 50 غرامًا' }],
    stock: 10,
    images: [{ art: 'bottle' }, { art: 'box' }, { art: 'mood' }],
    recommended: ['p01', 'p11', 'p05'],
    categories: ['gifts', 'luxury', 'unisex'],
    longevity: 5, sillage: 4, isNew: false, bestsellerRank: 8, saleHours: 96,
    coPurchase: ['p01', 'p11'],
    short_ar: 'عبوتان فاخرتان وبخور في صندوق ملكي',
    description_ar: 'الهدية التي لا تُنسى: عود ملكي 50مل، مسك أبيض 50مل، وبخور دار الأُمراء في صندوق ملكي بشريط ذهبي وبطاقة إهداء.',
    createdAt: '2026-02-25'
  },
  {
    id: 'p14', slug: 'black-orchid', name_ar: 'أوركيد أسود', name_en: 'Black Orchid', brand: 'noor',
    price: 69, oldPrice: 84, currency: 'KWD',
    badges: ['new', 'limited'], rating: 4.7, reviewsCount: 58,
    tags: { families: ['oriental', 'floral'], gender: ['women'], occasions: ['evening'], seasons: ['autumn', 'winter'], strength: 4 },
    notes: { top: ['orchid', 'pear'], middle: ['tuberose', 'cinnamon'], base: ['vanilla', 'amber', 'chocolate'] },
    concentration: 'Parfum',
    sizes: [{ ml: 30, price: 48 }, { ml: 50, price: 69 }],
    stock: 5,
    images: [{ art: 'bottle' }, { art: 'box' }, { art: 'mood' }],
    recommended: ['p07', 'p08', 'p10'],
    categories: ['women', 'oriental'],
    longevity: 5, sillage: 4, isNew: true, bestsellerRank: null, saleHours: 24,
    coPurchase: ['p07', 'p03'],
    short_ar: 'أوركيد غامض مع شوكولاتة وفانيلا',
    description_ar: 'غموض الأوركيد الأسود مع كمثرى ناعمة ودفء القرفة، على قاعدة شوكولاتة داكنة وفانيلا؛ إصدار محدود لحضور لا يُنسى.',
    createdAt: '2026-09-18'
  },
  {
    id: 'p15', slug: 'atlas-cedar', name_ar: 'أرز الأطلس', name_en: 'Atlas Cedar', brand: 'siraj',
    price: 39.5, oldPrice: null, currency: 'KWD',
    badges: [], rating: 4.4, reviewsCount: 71,
    tags: { families: ['woody', 'aromatic'], gender: ['men'], occasions: ['work', 'daily'], seasons: ['winter', 'autumn'], strength: 3 },
    notes: { top: ['basil', 'grapefruit'], middle: ['cedar', 'sage'], base: ['vetiver', 'amber'] },
    concentration: 'EDT',
    sizes: [{ ml: 50, price: 39.5 }, { ml: 100, price: 55 }],
    stock: 41,
    images: [{ art: 'bottle' }, { art: 'box' }, { art: 'mood' }],
    recommended: ['p09', 'p06', 'p01'],
    categories: ['men', 'western'],
    longevity: 3, sillage: 3, isNew: false, bestsellerRank: null, saleHours: null,
    coPurchase: ['p09', 'p06'],
    short_ar: 'خشبي عشبي أنيق بلمسة فيتيفر',
    description_ar: 'غابة أطلسية بعد المطر؛ حبق وجريب فروت ثم أرز ومريمية، على قاعدة فيتيفر دخانية. أناقة رجولية هادئة.',
    createdAt: '2026-06-06'
  },
  {
    id: 'p16', slug: 'sea-breeze', name_ar: 'نسيم البحر', name_en: 'Sea Breeze', brand: 'nafah',
    price: 32, oldPrice: null, currency: 'KWD',
    badges: ['new'], rating: 4.5, reviewsCount: 102,
    tags: { families: ['aquatic', 'fresh', 'citrus'], gender: ['men', 'unisex'], occasions: ['daily', 'sport', 'travel'], seasons: ['summer'], strength: 2 },
    notes: { top: ['bergamot', 'lemon'], middle: ['sea', 'lily'], base: ['musk', 'cedar'] },
    concentration: 'EDT',
    sizes: [{ ml: 50, price: 32 }, { ml: 100, price: 47 }],
    stock: 61,
    images: [{ art: 'bottle' }, { art: 'box' }, { art: 'mood' }],
    recommended: ['p06', 'p04', 'p15'],
    categories: ['men', 'unisex', 'western'],
    longevity: 3, sillage: 2, isNew: true, bestsellerRank: null, saleHours: null,
    coPurchase: ['p06', 'p04'],
    short_ar: 'انتعاش مائي نقي لأيام الصيف',
    description_ar: 'نسمة بحرية منعشة مع برغموت وليمون أخضر، ونوتات مائية نقية تستقر على مسك وخشب أشهب؛ طاقة الصيف في زجاجة.',
    createdAt: '2026-08-05'
  }
];

/* ---------------- تقييمات العملاء (بيانات أولية) ---------------- */
const SEED_REVIEWS = {
  p01: [
    { name: 'أبو خالد', rating: 5, date: '2026-08-14', text: 'ثباته خرافي، لبسته في عرس ووصلني مدح من كل الحضور. يستاهل كل فلس.', longevity: 5, sillage: 5, recommend: true, helpful: 42 },
    { name: 'نورة العلي', rating: 5, date: '2026-07-28', text: 'اشتريته هدية لزوجي ونال إعجابه من أول بخة. التغليف كان فخم جدًا.', longevity: 5, sillage: 4, recommend: true, helpful: 28 },
    { name: 'محمد الشمري', rating: 4, date: '2026-06-30', text: 'عود راقي وثابت، لكنه قوي للصيف. مثالي للشتاء والمساء.', longevity: 5, sillage: 4, recommend: true, helpful: 17 }
  ],
  p02: [
    { name: 'سارة', rating: 5, date: '2026-08-22', text: 'وردة دمشقية ناعمة وطبيعية. زوجي سألني عن اسمه مرتين في نفس اليوم!', longevity: 4, sillage: 3, recommend: true, helpful: 35 },
    { name: 'دلال العنزي', rating: 4, date: '2026-07-10', text: 'خفيف وأنثوي حلو للدوام، مدة الثبات جيدة لكن أحب تكون أقوى شوي.', longevity: 4, sillage: 3, recommend: true, helpful: 12 }
  ],
  p03: [
    { name: 'فهد', rating: 5, date: '2026-08-02', text: 'عنبر الليل اسم على مسمى. عطر شتوي ملكي، قرفة وفانيلا بثبات يوم كامل.', longevity: 5, sillage: 5, recommend: true, helpful: 51 },
    { name: 'هيا', rating: 5, date: '2026-07-19', text: 'ينفع للجنسين بامتياز، أنا وريلي نتنافس عليه 😄 يثبت على الملابس لأيام.', longevity: 5, sillage: 4, recommend: true, helpful: 33 }
  ],
  p04: [
    { name: 'منى', rating: 5, date: '2026-08-30', text: 'المسك الأبيض الأصلي بأحسن سعر. نظيف وناعم ويناسب كل يوم.', longevity: 3, sillage: 2, recommend: true, helpful: 24 },
    { name: 'ريم', rating: 4, date: '2026-06-12', text: 'ريحته نظيفة راقية، مثالي بعد الاستحمام وقبل النوم.', longevity: 3, sillage: 2, recommend: true, helpful: 9 }
  ],
  p05: [
    { name: 'عبدالعزيز', rating: 5, date: '2026-09-20', text: 'باقي منه 4 حبات؟ لا تستنون. زعفران وجلد وعود... تحفة تستاهل سعرها.', longevity: 5, sillage: 5, recommend: true, helpful: 19 },
    { name: 'بدر', rating: 5, date: '2026-09-12', text: 'أفخم عطر تويب في مجموعتي. إكستريه حقيقي، بخة وحدة تكفي.', longevity: 5, sillage: 5, recommend: true, helpful: 11 }
  ],
  p06: [
    { name: 'يوسف', rating: 5, date: '2026-08-18', text: 'برغموت نظيف ومنعش، عطري اليومي للدوام. سعره ممتاز بالنسبة لجودته.', longevity: 3, sillage: 3, recommend: true, helpful: 30 },
    { name: 'عبدالله', rating: 4, date: '2026-07-05', text: 'انطلاقة رهيبة أول ساعتين، بعدها يهدأ. مناسب للصيف.', longevity: 3, sillage: 3, recommend: true, helpful: 14 }
  ],
  p07: [
    { name: 'دانة', rating: 5, date: '2026-09-25', text: 'عود وورد بتوازن مثالي، لا يطغى الورد ولا العود. إدمان حقيقي.', longevity: 5, sillage: 4, recommend: true, helpful: 22 },
    { name: 'شيخة', rating: 5, date: '2026-09-08', text: 'جربته بسامبل ثم اشتريت الحجم الكبير مباشرة. فخم لكل مناسبة.', longevity: 4, sillage: 4, recommend: true, helpful: 16 }
  ],
  p08: [
    { name: 'لمياء', rating: 5, date: '2026-08-06', text: 'ياسمين حقيقي وليس صناعي. رومانسي وهادئ، مثالي للسهرات الصيفية.', longevity: 4, sillage: 3, recommend: true, helpful: 18 },
    { name: 'جواهر', rating: 4, date: '2026-06-25', text: 'زهرية فخمة وتلفت الانتباه بلطف. أتمنى يصدّرون حجم أكبر.', longevity: 4, sillage: 3, recommend: true, helpful: 7 }
  ],
  p10: [
    { name: 'عائشة', rating: 4, date: '2026-09-01', text: 'فانيلا دافئة تشبه المخبوزات الفاخرة. حلوه للشتاء والأمسيات.', longevity: 4, sillage: 3, recommend: true, helpful: 21 },
    { name: 'مريم', rating: 5, date: '2026-07-22', text: 'حبيبتي! ثباتها ممتاز على الملابس وتنفع للمناسبات العائلية.', longevity: 4, sillage: 4, recommend: true, helpful: 13 }
  ],
  p11: [
    { name: 'أم عبدالرحمن', rating: 5, date: '2026-08-27', text: 'بخور يدوم معطر البيت للأسبوع. خلطة راقية تشبه بخور الأفخم.', longevity: 5, sillage: 5, recommend: true, helpful: 26 },
    { name: 'خالد', rating: 5, date: '2026-07-30', text: 'أفخم بخور جربته، ضفته للضيافة والكل سأل عن مصدره.', longevity: 5, sillage: 5, recommend: true, helpful: 15 }
  ],
  p12: [
    { name: 'عبير', rating: 5, date: '2026-09-28', text: 'نعومة غزل حقيقية. سعره خيالي وجودته عالية، طلبته مرتين.', longevity: 3, sillage: 2, recommend: true, helpful: 12 },
    { name: 'مشاعل', rating: 4, date: '2026-09-15', text: 'مسك خفيف أنثوي جميل، يصلح للمدرسة والدوام. التغليف كيوت.', longevity: 3, sillage: 2, recommend: true, helpful: 6 }
  ],
  p13: [
    { name: 'سعود', rating: 5, date: '2026-09-05', text: 'أهديته لوالدتي في عيد ميلادها وكانت فرحتها لا توصف. الصندوق فخم جدًا.', longevity: 5, sillage: 4, recommend: true, helpful: 31 },
    { name: 'أحمد', rating: 5, date: '2026-08-11', text: 'طقم متكامل يستاهل سعره. تغليف وبطاقة إهداء والتوصيل كان أسرع من المتوقع.', longevity: 5, sillage: 4, recommend: true, helpful: 20 }
  ],
  p14: [
    { name: 'رزان', rating: 5, date: '2026-09-29', text: 'أوركيد أسود مفعم بالغموض، ثباته فوق الممتاز كونه بارفان. أنصح به للسهرات.', longevity: 5, sillage: 4, recommend: true, helpful: 10 }
  ],
  p15: [
    { name: 'طلال', rating: 4, date: '2026-08-09', text: 'خشبي هادئ وأنيق، ممتاز للشتاء والدوام. قيمة ممتازة مقابل السعر.', longevity: 3, sillage: 3, recommend: true, helpful: 8 }
  ],
  p16: [
    { name: 'حمد', rating: 5, date: '2026-09-02', text: 'نسمة بحرية منعشة، مثالي للصيف والرياضة. الثاني شريته لأخوي.', longevity: 3, sillage: 3, recommend: true, helpful: 17 },
    { name: 'عبدالوهاب', rating: 4, date: '2026-08-15', text: 'منعش وخفيف، بسعر ممتاز. عيبه الوحيد قصر مدة الثبات.', longevity: 3, sillage: 2, recommend: true, helpful: 9 }
  ]
};

/* ---------------- طلبات أولية (للحساب التجريبي ولوحة التحكم) ---------------- */
const SEED_ORDERS = [
  { id: 'ORD-100214', phone: '0955500001', name: 'عبدالله العتيبي', date: '2026-08-30', status: 'cancelled', payment: 'knet', items: [{ pid: 'p16', size: 50, qty: 1, price: 32 }], subtotal: 32, discount: 0, shipping: 0, packaging: 0, coupon: null, total: 32, city: 'دمشق — الحمرا', note: 'تم الإلغاء بطلب العميل' },
  { id: 'ORD-100231', phone: '0955500001', name: 'عبدالله العتيبي', date: '2026-09-08', status: 'delivered', payment: 'knet', items: [{ pid: 'p02', size: 50, qty: 1, price: 42.5 }, { pid: 'p12', size: 50, qty: 2, price: 28.5 }], subtotal: 99.5, discount: 9.95, shipping: 0, packaging: 2, coupon: 'UMARA10', total: 91.55, city: 'ريف دمشق — صحنايا' },
  { id: 'ORD-100247', phone: '0955500001', name: 'عبدالله العتيبي', date: '2026-09-27', status: 'shipped', payment: 'applepay', items: [{ pid: 'p06', size: 100, qty: 1, price: 44 }], subtotal: 44, discount: 0, shipping: 0, packaging: 0, coupon: null, total: 44, city: 'ريف دمشق — صحنايا' },
  { id: 'ORD-100252', phone: '0955500001', name: 'عبدالله العتيبي', date: '2026-10-01', status: 'processing', payment: 'card', items: [{ pid: 'p01', size: 100, qty: 1, price: 89 }], subtotal: 89, discount: 8.9, shipping: 0, packaging: 2, coupon: 'UMARA10', total: 82.1, city: 'ريف دمشق — صحنايا', gift: 'بالرفاء والبنين — مبروك الزواج يا بدر' },
  { id: 'ORD-100219', phone: '0955511102', name: 'نورة العلي', date: '2026-08-25', status: 'delivered', payment: 'card', items: [{ pid: 'p01', size: 100, qty: 1, price: 89 }], subtotal: 89, discount: 0, shipping: 0, packaging: 2, coupon: null, total: 91, city: 'حلب — الأشرفية' },
  { id: 'ORD-100222', phone: '0955533304', name: 'محمد الشمري', date: '2026-08-27', status: 'delivered', payment: 'cod', items: [{ pid: 'p15', size: 100, qty: 2, price: 55 }], subtotal: 110, discount: 11, shipping: 0, packaging: 0, coupon: 'UMARA10', total: 99, city: 'حمص — الحميدية' },
  { id: 'ORD-100228', phone: '0955544405', name: 'سارة الحربي', date: '2026-09-03', status: 'delivered', payment: 'applepay', items: [{ pid: 'p10', size: 100, qty: 1, price: 62 }, { pid: 'p04', size: 50, qty: 1, price: 35 }], subtotal: 97, discount: 0, shipping: 0, packaging: 2, coupon: null, total: 99, city: 'اللاذقية — الصليبة', gift: 'كل عام وأنتِ الأجمل — عيد ميلاد سعيد' },
  { id: 'ORD-100235', phone: '0955522203', name: 'فهد الرشيدي', date: '2026-09-11', status: 'delivered', payment: 'knet', items: [{ pid: 'p03', size: 100, qty: 1, price: 76 }], subtotal: 76, discount: 7.6, shipping: 0, packaging: 0, coupon: 'UMARA10', total: 68.4, city: 'دمشق — الشعلان' },
  { id: 'ORD-100239', phone: '0955566607', name: 'دلال العنزي', date: '2026-09-16', status: 'returned', payment: 'card', items: [{ pid: 'p08', size: 50, qty: 1, price: 48 }], subtotal: 48, discount: 0, shipping: 0, packaging: 0, coupon: null, total: 48, city: 'حماة — البارودة', note: 'تمت إعادة المبلغ — طلب العميلة تبديل الحجم' },
  { id: 'ORD-100242', phone: '0955577708', name: 'عبدالعزيز الدوسري', date: '2026-09-21', status: 'delivered', payment: 'knet', items: [{ pid: 'p05', size: 100, qty: 1, price: 95 }, { pid: 'p11', size: 50, qty: 1, price: 65 }], subtotal: 160, discount: 16, shipping: 0, packaging: 2, coupon: 'UMARA10', total: 146, city: 'دمشق — المزة' },
  { id: 'ORD-100245', phone: '0955588809', name: 'هيا المطيري', date: '2026-09-24', status: 'delivered', payment: 'paypal', items: [{ pid: 'p13', size: 0, qty: 1, price: 150 }], subtotal: 150, discount: 0, shipping: 0, packaging: 0, coupon: null, total: 150, city: 'دمشق — القصاع', gift: 'مبروك التخرج يا غالية' },
  { id: 'ORD-100249', phone: '0955599910', name: 'بدر العجمي', date: '2026-09-29', status: 'shipped', payment: 'knet', items: [{ pid: 'p14', size: 50, qty: 1, price: 69 }], subtotal: 69, discount: 0, shipping: 0, packaging: 2, coupon: null, total: 71, city: 'حمص — النزهة' },
  { id: 'ORD-100251', phone: '0955512111', name: 'يوسف الكندري', date: '2026-09-30', status: 'processing', payment: 'knet', items: [{ pid: 'p06', size: 100, qty: 1, price: 44 }, { pid: 'p16', size: 100, qty: 1, price: 47 }], subtotal: 91, discount: 9.1, shipping: 0, packaging: 0, coupon: 'UMARA10', total: 81.9, city: 'ريف دمشق — معضمية الشام' },
  { id: 'ORD-100253', phone: '0955523212', name: 'ريم السبيعي', date: '2026-10-02', status: 'new', payment: 'card', items: [{ pid: 'p02', size: 50, qty: 1, price: 42.5 }], subtotal: 42.5, discount: 0, shipping: 1.5, packaging: 0, coupon: null, total: 44, city: 'حلب — الفرقان' },
  { id: 'ORD-100254', phone: '0955534313', name: 'طلال الشمري', date: '2026-10-02', status: 'new', payment: 'cod', items: [{ pid: 'p07', size: 100, qty: 1, price: 82 }], subtotal: 82, discount: 8.2, shipping: 0, packaging: 2, coupon: 'UMARA10', total: 75.8, city: 'طرطوس — مشقيتا' }
];

/* ---------------- عملاء إضافيون (تبدأ لوحة التحكم ببيانات حيّة) ---------------- */
const SEED_CUSTOMERS = [
  { name: 'نورة العلي', phone: '0955511102', joined: '2026-02-10', favorites: ['p02', 'p10'] },
  { name: 'فهد الرشيدي', phone: '0955522203', joined: '2026-03-04', favorites: ['p03', 'p01'] },
  { name: 'محمد الشمري', phone: '0955533304', joined: '2026-03-22', favorites: ['p15'] },
  { name: 'سارة الحربي', phone: '0955544405', joined: '2026-04-15', favorites: ['p10', 'p04'] },
  { name: 'دلال العنزي', phone: '0955566607', joined: '2026-05-02', favorites: ['p08', 'p02'] },
  { name: 'عبدالعزيز الدوسري', phone: '0955577708', joined: '2026-05-28', favorites: ['p05', 'p11'] },
  { name: 'هيا المطيري', phone: '0955588809', joined: '2026-06-11', favorites: ['p13'] },
  { name: 'بدر العجمي', phone: '0955599910', joined: '2026-07-19', favorites: ['p14', 'p07'] },
  { name: 'يوسف الكندري', phone: '0955512111', joined: '2026-08-03', favorites: ['p06'] },
  { name: 'ريم السبيعي', phone: '0955523212', joined: '2026-08-30', favorites: ['p02'] }
];

/* ---------------- الكوبونات ---------------- */
const COUPONS = [
  { code: 'UMARA10', type: 'percent', value: 10, min: 10, desc: 'خصم 10% على جميع الطلبات', active: true },
  { code: 'WELCOME15', type: 'percent', value: 15, min: 20, desc: 'خصم ترحيبي 15% للعميل الجديد', active: true, firstOrder: true },
  { code: 'FREESHIP', type: 'shipping', value: 0, min: 15, desc: 'شحن مجاني للطلبات فوق 15 د.ك', active: true },
  { code: 'GOLD5', type: 'fixed', value: 5, min: 30, desc: 'خصم 5 د.ك على الطلبات فوق 30 د.ك', active: true },
  { code: 'SUMMER20', type: 'percent', value: 20, min: 40, desc: 'عرض الصيف الحصري 20%', active: true }
];

/* ---------------- نادي العطور — مكافآت الاستبدال ---------------- */
const LOYALTY_REWARDS = [
  { id: 'rw1', ar: 'قسيمة خصم 5 د.ك', pts: 500, type: 'coupon', coupon: { type: 'fixed', value: 5, min: 20 }, desc: 'كوبون شخصي يُطبَّق عند الدفع' },
  { id: 'rw2', ar: 'شحن مجاني', pts: 200, type: 'coupon', coupon: { type: 'shipping', value: 0, min: 0 }, desc: 'شحن مجاني على طلبك القادم' },
  { id: 'rw3', ar: 'تغليف فاخر مجاني', pts: 150, type: 'perk', desc: 'تغليف ذهبي + بطاقة إهداء مجانًا' },
  { id: 'rw4', ar: 'عينة عطر 7.5 مل', pts: 750, type: 'gift', desc: 'عينة فاخرة تختارها مع طلبك القادم' },
  { id: 'rw5', ar: 'بخور مصغّر حصري', pts: 1000, type: 'gift', desc: 'منتج حصري لأعضاء النادي فقط' }
];

/* ---------------- مناسبات الهدايا ---------------- */
const GIFT_OCCASIONS = [
  { id: 'birthday',    ar: 'أعياد الميلاد', desc: 'فاجئ من تحب بعطر يبقى ذكرى',        glyph: 'cake',    suggest: ['p13', 'p02', 'p06'] },
  { id: 'wedding',     ar: 'الزواج',        desc: 'هدايا فاخرة لبداية العمر الجديد',    glyph: 'rings',   suggest: ['p13', 'p05', 'p07'] },
  { id: 'anniversary', ar: 'ذكرى الزواج',   desc: 'احتفل بحبك بعطر لا يُنسى',           glyph: 'heart',   suggest: ['p07', 'p14', 'p03'] },
  { id: 'graduation',  ar: 'التخرج',        desc: 'تكريم النجاح بأجمل النفحات',         glyph: 'cap',     suggest: ['p13', 'p08', 'p06'] },
  { id: 'mothers',     ar: 'عيد الأم',      desc: 'تقدير لأغلى الغالين',                glyph: 'flower',  suggest: ['p02', 'p10', 'p08'] },
  { id: 'fathers',     ar: 'عيد الأب',      desc: 'فخامة تليق برجل البيت',              glyph: 'tie',     suggest: ['p01', 'p09', 'p15'] },
  { id: 'corporate',   ar: 'الهدايا الرسمية', desc: 'هدايا عمل بروح راقية',           glyph: 'briefcase', suggest: ['p13', 'p11', 'p05'] }
];
