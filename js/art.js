/* ============================================================
   دار الأُمراء — DAR AL-UMARA  |  js/art.js
   محرّك الرسم: صور المنتجات (SVG داخلي)، زخارف التصنيفات
   والمجموعات، النقوش العربية، ونظام الأيقونات الموحّد.
   لا يعتمد على أي مكتبة خارجية.
   ============================================================ */
(function () {
  'use strict';

  let gid = 0;
  const nid = () => 'ag' + (++gid).toString(36);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const FONT_AR = "'Amiri','Times New Roman',serif";
  const FONT_EN = "'Cormorant Garamond',Georgia,serif";

  function rand(seed) {
    let s = 7;
    for (let i = 0; i < seed.length; i++) s = (s * 31 + seed.charCodeAt(i)) % 99991;
    return function () { s = (s * 1103515245 + 12345) % 2147483648; return s / 2147483648; };
  }

  /* ---------- لوحات الألوان العطرية ---------- */
  const PALETTES = {
    amber:   { liquid: ['#8A4A0F', '#C98A2E', '#E8B45A'], glass: '#D9A85F', glow: '#CBAA6C' },
    rose:    { liquid: ['#8E3244', '#C25A6C', '#E8A0A8'], glass: '#E3B7BC', glow: '#D8B4A0' },
    ivory:   { liquid: ['#CFC6B2', '#E8E2D4', '#F6F0E6'], glass: '#EFE9DB', glow: '#E8DED0' },
    gold:    { liquid: ['#A87F1F', '#D4AF37', '#E6CFA0'], glass: '#E6CFA0', glow: '#D4AF37' },
    green:   { liquid: ['#2F5B3A', '#5E8A4F', '#9DBB77'], glass: '#A9C29B', glow: '#9AAB8E' },
    ruby:    { liquid: ['#5E1A26', '#9E3242', '#C9606E'], glass: '#C98A94', glow: '#B23A4A' },
    mist:    { liquid: ['#C3CFD6', '#DCE4E8', '#F2F5F6'], glass: '#E6ECEF', glow: '#C9D4DA' },
    tobacco: { liquid: ['#5A3418', '#8A5A2B', '#B98A4F'], glass: '#B98A5F', glow: '#A9793F' },
    caramel: { liquid: ['#7A4A1E', '#B87A3A', '#DFA85F'], glass: '#D9A05B', glow: '#C98A3A' },
    smoke:   { liquid: ['#3E3E3C', '#6B6B66', '#9A9A92'], glass: '#8C8C86', glow: '#8A9B8E', labelDark: true },
    black:   { liquid: ['#191418', '#2E2530', '#4A3B4E'], glass: '#5A4E5E', glow: '#8A6E8E', labelDark: true },
    sage:    { liquid: ['#46543F', '#6E7F5F', '#9AAB8E'], glass: '#9AAB8E', glow: '#7E8E72' },
    azure:   { liquid: ['#1E4A66', '#3A7A9E', '#7FB3CE'], glass: '#7FB3CE', glow: '#4A8AAE' },
    blush:   { liquid: ['#B26E7A', '#D89AA4', '#F0C6CC'], glass: '#E8BCC2', glow: '#D8B4A0' }
  };

  /* خريطة الهوية البصرية لكل عطر */
  const ART_MAP = {
    p01: { shape: 'flacon',   palette: 'amber' },
    p02: { shape: 'flacon',   palette: 'rose' },
    p03: { shape: 'oriental', palette: 'amber' },
    p04: { shape: 'round',    palette: 'ivory' },
    p05: { shape: 'column',   palette: 'gold' },
    p06: { shape: 'column',   palette: 'green' },
    p07: { shape: 'flacon',   palette: 'ruby' },
    p08: { shape: 'round',    palette: 'mist' },
    p09: { shape: 'column',   palette: 'tobacco' },
    p10: { shape: 'round',    palette: 'caramel' },
    p11: { shape: 'mabkhara', palette: 'smoke' },
    p12: { shape: 'round',    palette: 'blush' },
    p13: { shape: 'gift',     palette: 'gold' },
    p14: { shape: 'flacon',   palette: 'black' },
    p15: { shape: 'column',   palette: 'sage' },
    p16: { shape: 'round',    palette: 'azure' }
  };

  /* ---------- تعريفات مشتركة ---------- */
  function defs(id, pal) {
    return '<defs>' +
      '<radialGradient id="' + id + 'g" cx="50%" cy="42%" r="62%">' +
        '<stop offset="0%" stop-color="' + pal.glow + '" stop-opacity="0.20"/>' +
        '<stop offset="55%" stop-color="' + pal.glow + '" stop-opacity="0.05"/>' +
        '<stop offset="100%" stop-color="' + pal.glow + '" stop-opacity="0"/>' +
      '</radialGradient>' +
      '<linearGradient id="' + id + 'o" x1="0" y1="0" x2="1" y2="1">' +
        '<stop offset="0%" stop-color="#E8D3A3"/><stop offset="40%" stop-color="#CBAA6C"/>' +
        '<stop offset="70%" stop-color="#8C6D3F"/><stop offset="100%" stop-color="#E0C48C"/>' +
      '</linearGradient>' +
      '<linearGradient id="' + id + 'w" x1="0" y1="0" x2="1" y2="0">' +
        '<stop offset="0%" stop-color="#ffffff" stop-opacity="0.22"/>' +
        '<stop offset="45%" stop-color="#ffffff" stop-opacity="0.05"/>' +
        '<stop offset="100%" stop-color="#ffffff" stop-opacity="0.12"/>' +
      '</linearGradient>' +
      '<linearGradient id="' + id + 'l" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0%" stop-color="' + pal.liquid[2] + '"/>' +
        '<stop offset="55%" stop-color="' + pal.liquid[1] + '"/>' +
        '<stop offset="100%" stop-color="' + pal.liquid[0] + '"/>' +
      '</linearGradient>' +
      '' +
    '</defs>';
  }

  const BODY_PATHS = {
    flacon:   'M138 196 Q138 166 168 156 H232 Q262 166 262 196 V330 Q262 344 248 344 H152 Q138 344 138 330 Z',
    oriental: 'M200 140 C258 140 282 196 282 240 C282 306 250 346 200 346 C150 346 118 306 118 240 C118 196 142 140 200 140 Z',
    column:   'M162 128 H238 V336 Q238 350 224 350 H176 Q162 350 162 336 Z',
    round:    'M200 262 m-82 0 a82 82 0 1 0 164 0 a82 82 0 1 0 -164 0 Z'
  };

  function labelGroup(p, box, pal) {
    const dark = !!pal.labelDark;
    const bg = dark ? 'rgba(11,11,11,0.62)' : 'rgba(246,240,230,0.94)';
    const line = dark ? 'rgba(203,170,108,0.65)' : 'rgba(140,109,63,0.5)';
    const brandCol = dark ? '#D8BE8A' : '#8C6D3F';
    const nameCol = dark ? '#F6F0E6' : '#241E17';
    const brand = (BRANDS[p.brand] && BRANDS[p.brand].en) || 'UMARA';
    const words = String(p.name_ar).split(' ');
    let l1 = '', l2 = '';
    if (words.length === 1) { l1 = words[0]; }
    else {
      let a = '', b = '';
      words.forEach(w => { if (a.length <= b.length) a = a ? a + ' ' + w : w; else b = b ? b + ' ' + w : w; });
      l1 = a; l2 = b;
    }
    const fs = brand.length > 10 ? 6 : 7;
    const cx = box.x + box.w / 2;
    let out = '<rect x="' + box.x + '" y="' + box.y + '" width="' + box.w + '" height="' + box.h +
      '" rx="5" fill="' + bg + '" stroke="rgba(203,170,108,0.45)" stroke-width="0.8"/>' +
      '<text x="' + cx + '" y="' + (box.y + 13) + '" text-anchor="middle" font-family="' + FONT_EN +
      '" font-size="' + fs + '" letter-spacing="2" fill="' + brandCol + '">' + esc(brand) + '</text>' +
      '<line x1="' + (box.x + 9) + '" y1="' + (box.y + 18) + '" x2="' + (box.x + box.w - 9) + '" y2="' + (box.y + 18) +
      '" stroke="' + line + '" stroke-width="0.7"/>';
    const yBase = box.y + (l2 ? 34 : 38);
    out += '<text x="' + cx + '" y="' + yBase + '" text-anchor="middle" font-family="' + FONT_AR +
      '" font-size="13.5" fill="' + nameCol + '">' + esc(l1) + '</text>';
    if (l2) out += '<text x="' + cx + '" y="' + (yBase + 15) + '" text-anchor="middle" font-family="' + FONT_AR +
      '" font-size="13.5" fill="' + nameCol + '">' + esc(l2) + '</text>';
    return out;
  }

  function shapeGroup(p, shape, pal, id) {
    const clip = 'clip-path="url(#' + id + 'c)"';
    switch (shape) {
      case 'flacon':
        return '<defs><clipPath id="' + id + 'c"><path d="' + BODY_PATHS.flacon + '"/></clipPath></defs>' + '<path d="' + BODY_PATHS.flacon + '" fill="url(#' + id + 'w)" stroke="rgba(230,207,160,0.4)" stroke-width="1.1"/>' +
          '<g ' + clip + '><rect x="130" y="216" width="140" height="136" fill="url(#' + id + 'l)" opacity="0.92"/>' +
          '<path d="M138 196 Q138 166 168 156 H232 Q262 166 262 196" fill="none" stroke="rgba(255,255,255,0.18)" stroke-width="5"/></g>' +
          '<rect x="186" y="112" width="28" height="46" fill="url(#' + id + 'w)" stroke="rgba(230,207,160,0.35)" stroke-width="1"/>' +
          '<rect x="182" y="106" width="36" height="9" rx="2" fill="url(#' + id + 'o)"/>' +
          '<rect x="184" y="62" width="32" height="46" rx="4" fill="url(#' + id + 'o)"/>' +
          '<path d="M150 190 Q144 250 152 316" fill="none" stroke="rgba(255,255,255,0.20)" stroke-width="6" stroke-linecap="round"/>' +
          labelGroup(p, { x: 168, y: 226, w: 64, h: 66 }, pal);
      case 'oriental':
        return '<defs><clipPath id="' + id + 'c"><path d="' + BODY_PATHS.oriental + '"/></clipPath></defs>' + '<path d="' + BODY_PATHS.oriental + '" fill="url(#' + id + 'w)" stroke="rgba(230,207,160,0.4)" stroke-width="1.1"/>' +
          '<g ' + clip + '><rect x="110" y="226" width="180" height="126" fill="url(#' + id + 'l)" opacity="0.92"/></g>' +
          '<rect x="188" y="100" width="24" height="44" fill="url(#' + id + 'w)" stroke="rgba(230,207,160,0.35)" stroke-width="1"/>' +
          '<rect x="184" y="94" width="32" height="9" rx="2" fill="url(#' + id + 'o)"/>' +
          '<path d="M186 94 Q186 62 200 58 Q214 62 214 94 Z" fill="url(#' + id + 'o)"/>' +
          '<path d="M136 210 Q132 270 150 312" fill="none" stroke="rgba(255,255,255,0.18)" stroke-width="6" stroke-linecap="round"/>' +
          labelGroup(p, { x: 168, y: 232, w: 64, h: 62 }, pal);
      case 'column':
        return '<defs><clipPath id="' + id + 'c"><path d="' + BODY_PATHS.column + '"/></clipPath></defs>' + '<path d="' + BODY_PATHS.column + '" fill="url(#' + id + 'w)" stroke="rgba(230,207,160,0.4)" stroke-width="1.1"/>' +
          '<g ' + clip + '><rect x="156" y="224" width="88" height="130" fill="url(#' + id + 'l)" opacity="0.92"/></g>' +
          '<rect x="190" y="105" width="20" height="24" fill="url(#' + id + 'w)" stroke="rgba(230,207,160,0.35)" stroke-width="1"/>' +
                    '<rect x="187" y="96" width="26" height="9" rx="2" fill="url(#' + id + 'o)"/>' +
          '<rect x="190" y="52" width="20" height="46" rx="3" fill="url(#' + id + 'o)"/>' +
          '<path d="M174 146 Q170 240 176 330" fill="none" stroke="rgba(255,255,255,0.18)" stroke-width="5" stroke-linecap="round"/>' +
          labelGroup(p, { x: 170, y: 224, w: 60, h: 64 }, pal);
      case 'round':
        return '<defs><clipPath id="' + id + 'c"><path d="' + BODY_PATHS.round + '"/></clipPath></defs>' + '<path d="' + BODY_PATHS.round + '" fill="url(#' + id + 'w)" stroke="rgba(230,207,160,0.4)" stroke-width="1.1"/>' +
          '<g ' + clip + '><rect x="110" y="252" width="180" height="112" fill="url(#' + id + 'l)" opacity="0.92"/></g>' +
          '<rect x="189" y="152" width="22" height="42" fill="url(#' + id + 'w)" stroke="rgba(230,207,160,0.35)" stroke-width="1"/>' +
          '<rect x="185" y="146" width="30" height="8" rx="2" fill="url(#' + id + 'o)"/>' +
          '<circle cx="200" cy="128" r="18" fill="url(#' + id + 'o)"/>' +
          '<path d="M136 230 Q130 272 142 306" fill="none" stroke="rgba(255,255,255,0.18)" stroke-width="5" stroke-linecap="round"/>' +
          labelGroup(p, { x: 170, y: 246, w: 60, h: 58 }, pal);
      case 'mabkhara':
        return '<path d="M136 190 Q142 258 200 266 Q258 258 264 190 Q236 176 200 176 Q164 176 136 190 Z" fill="url(#' + id + 'w)" stroke="rgba(230,207,160,0.4)" stroke-width="1.1"/>' +
          '<path d="M148 190 Q200 206 252 190" fill="none" stroke="url(#' + id + 'o)" stroke-width="4"/>' +
          '<circle cx="184" cy="196" r="4" fill="#E8B45A" opacity="0.9"/><circle cx="200" cy="201" r="4.6" fill="#C98A2E" opacity="0.9"/><circle cx="217" cy="196" r="3.6" fill="#E8B45A" opacity="0.85"/>' +
          '<path d="M176 264 H224 L232 320 H168 Z" fill="' + pal.glass + '" opacity="0.55" stroke="rgba(230,207,160,0.35)" stroke-width="1"/>' +
          '<rect x="150" y="320" width="100" height="10" rx="4" fill="url(#' + id + 'o)"/>' +
          '<path d="M200 152 C 188 132, 214 118, 200 98 C 190 82, 210 68, 198 48" fill="none" stroke="rgba(210,206,198,0.55)" stroke-width="4" stroke-linecap="round"/>' +
          '<path d="M176 156 C 166 140, 186 128, 174 110 C 166 97, 182 84, 172 66" fill="none" stroke="rgba(210,206,198,0.32)" stroke-width="3.4" stroke-linecap="round"/>' +
          '<path d="M224 158 C 216 142, 236 130, 224 112 C 216 99, 232 86, 222 68" fill="none" stroke="rgba(210,206,198,0.32)" stroke-width="3.4" stroke-linecap="round"/>' +
          '<rect x="170" y="210" width="60" height="42" rx="5" fill="rgba(11,11,11,0.55)" stroke="rgba(203,170,108,0.45)" stroke-width="0.8"/>' +
          '<text x="200" y="222" text-anchor="middle" font-family="' + FONT_EN + '" font-size="6.4" letter-spacing="2" fill="#D8BE8A">' + esc((BRANDS[p.brand] || {}).en || 'UMARA') + '</text>' +
          '<line x1="179" y1="227" x2="221" y2="227" stroke="rgba(203,170,108,0.6)" stroke-width="0.7"/>' +
          '<text x="200" y="244" text-anchor="middle" font-family="' + FONT_AR + '" font-size="13" fill="#F6F0E6">بخور</text>';
      case 'gift':
        return '<rect x="150" y="150" width="26" height="58" rx="4" fill="url(#' + id + 'w)" stroke="rgba(230,207,160,0.4)" stroke-width="1"/>' +
          '<rect x="224" y="150" width="26" height="58" rx="4" fill="url(#' + id + 'w)" stroke="rgba(230,207,160,0.4)" stroke-width="1"/>' +
          '<rect x="147" y="140" width="32" height="9" rx="2" fill="url(#' + id + 'o)"/><rect x="221" y="140" width="32" height="9" rx="2" fill="url(#' + id + 'o)"/>' +
          '<rect x="112" y="186" width="176" height="26" rx="4" fill="' + pal.glass + '" opacity="0.35" stroke="rgba(230,207,160,0.5)" stroke-width="1.2"/>' +
          '<rect x="118" y="208" width="164" height="132" rx="6" fill="' + pal.glass + '" opacity="0.28" stroke="rgba(230,207,160,0.5)" stroke-width="1.2"/>' +
          '<rect x="190" y="186" width="20" height="154" fill="url(#' + id + 'o)"/>' +
          '<path d="M200 186 C 178 170, 166 152, 182 146 C 196 141, 200 162, 200 176" fill="none" stroke="#D8BE8A" stroke-width="4"/>' +
          '<path d="M200 186 C 222 170, 234 152, 218 146 C 204 141, 200 162, 200 176" fill="none" stroke="#D8BE8A" stroke-width="4"/>' +
          '<circle cx="200" cy="268" r="27" fill="rgba(11,11,11,0.5)" stroke="#CBAA6C" stroke-width="1.4"/>' +
          '<circle cx="200" cy="268" r="22" fill="none" stroke="rgba(203,170,108,0.45)" stroke-width="0.8" stroke-dasharray="2 3"/>' +
          '<text x="200" y="276" text-anchor="middle" font-family="' + FONT_AR + '" font-size="22" fill="#E8D3A3">أ</text>' +
          '<text x="200" y="318" text-anchor="middle" font-family="' + FONT_EN + '" font-size="7.4" letter-spacing="3" fill="#D8BE8A">DAR AL-UMARA</text>';
    }
    return '';
  }

  /* ---------- صورة المنتج الرئيسية ---------- */
  function product(p, opts) {
    opts = opts || {};
    const photo = p.images && p.images.find(image => image.url);
    if (photo) {
      return '<img class="art" src="' + esc(photo.url) + '" alt="' + esc(photo.alt || p.name_ar) +
        '" loading="lazy">';
    }
    const art = p.art || ART_MAP[p.id] || { shape: 'flacon', palette: 'gold' };
    const pal = PALETTES[art.palette] || PALETTES.gold;
    const id = nid();
    const rnd = rand(p.id + p.slug);
    let particles = '';
    if (!opts.compact) {
      for (let i = 0; i < 7; i++) {
        const x = 90 + Math.round(rnd() * 220), y = 70 + Math.round(rnd() * 160);
        const s = 1.4 + rnd() * 1.8;
        particles += '<rect x="' + x + '" y="' + y + '" width="' + s.toFixed(1) + '" height="' + s.toFixed(1) +
          '" fill="' + pal.glow + '" opacity="' + (0.18 + rnd() * 0.3).toFixed(2) + '" transform="rotate(45 ' + x + ' ' + y + ')"/>';
      }
    }
    const decor = opts.compact ? '' :
      '<circle cx="200" cy="218" r="132" fill="none" stroke="rgba(203,170,108,0.10)" stroke-width="1"/>' +
      '<circle cx="200" cy="218" r="152" fill="none" stroke="rgba(203,170,108,0.06)" stroke-width="1" stroke-dasharray="2 7"/>' +
      '<g opacity="0.05" transform="translate(318 52) scale(6)" stroke="#CBAA6C" fill="none" stroke-width="0.9">' +
        '<polygon points="12,3 13.8,8.1 18.2,5.8 15.9,10.2 21,12 15.9,13.8 18.2,18.2 13.8,15.9 12,21 10.2,15.9 5.8,18.2 8.1,13.8 3,12 8.1,10.2 5.8,5.8 10.2,8.1"/></g>' +
      '<g opacity="0.05" transform="translate(38 268) scale(4.4)" stroke="#CBAA6C" fill="none" stroke-width="0.9">' +
        '<polygon points="12,3 13.8,8.1 18.2,5.8 15.9,10.2 21,12 15.9,13.8 18.2,18.2 13.8,15.9 12,21 10.2,15.9 5.8,18.2 8.1,13.8 3,12 8.1,10.2 5.8,5.8 10.2,8.1"/></g>';
    return '<svg class="art" viewBox="0 0 400 400" role="img" aria-label="' + esc(p.name_ar) + ' — ' + esc((BRANDS[p.brand] || {}).ar || '') + '" xmlns="http://www.w3.org/2000/svg">' +
      defs(id, pal) +
      '<rect width="400" height="400" fill="#12100D"/>' +
      '<rect width="400" height="400" fill="url(#' + id + 'g)"/>' +
      decor +
      '<ellipse cx="200" cy="352" rx="104" ry="13" fill="#000" opacity="0.5"/>' +
      '<ellipse cx="200" cy="352" rx="64" ry="7" fill="#000" opacity="0.45"/>' +
      shapeGroup(p, art.shape, pal, id) +
      particles +
      '</svg>';
  }

  /* ---------- عرض العلبة (الشريحة الثانية في المعرض) ---------- */
  function box(p) {
    const id = nid();
    const pal = (PALETTES[((p.art || ART_MAP[p.id]) || {}).palette] || PALETTES.gold);
    return '<svg class="art" viewBox="0 0 400 400" role="img" aria-label="علبة ' + esc(p.name_ar) + ' الفاخرة" xmlns="http://www.w3.org/2000/svg">' +
      defs(id, pal) +
      '<rect width="400" height="400" fill="#12100D"/>' +
      '<rect width="400" height="400" fill="url(#' + id + 'g)"/>' +
      '<circle cx="200" cy="210" r="140" fill="none" stroke="rgba(203,170,108,0.08)" stroke-width="1"/>' +
      '<ellipse cx="200" cy="356" rx="120" ry="14" fill="#000" opacity="0.5"/>' +
      '<rect x="86" y="150" width="228" height="192" rx="10" fill="' + pal.glass + '" opacity="0.22" stroke="rgba(230,207,160,0.45)" stroke-width="1.4"/>' +
      '<rect x="86" y="150" width="228" height="34" rx="8" fill="rgba(203,170,108,0.16)" stroke="rgba(230,207,160,0.45)" stroke-width="1.2"/>' +
      '<rect x="86" y="150" width="228" height="192" rx="10" fill="none" stroke="rgba(203,170,108,0.25)" stroke-width="0.8" stroke-dasharray="3 5" transform="translate(6 6)"/>' +
      '<rect x="100" y="196" width="200" height="130" rx="6" fill="rgba(11,11,11,0.35)"/>' +
      '<line x1="100" y1="262" x2="300" y2="262" stroke="rgba(203,170,108,0.35)" stroke-width="0.8"/>' +
      '<circle cx="200" cy="248" r="30" fill="none" stroke="#CBAA6C" stroke-width="1.3"/>' +
      '<circle cx="200" cy="248" r="24" fill="none" stroke="rgba(203,170,108,0.4)" stroke-width="0.8" stroke-dasharray="2 3"/>' +
      '<text x="200" y="258" text-anchor="middle" font-family="' + FONT_AR + '" font-size="26" fill="#E8D3A3">أ</text>' +
      '<text x="200" y="298" text-anchor="middle" font-family="' + FONT_EN + '" font-size="9" letter-spacing="4" fill="#D8BE8A">DAR AL-UMARA</text>' +
      '<text x="200" y="314" text-anchor="middle" font-family="' + FONT_AR + '" font-size="12" fill="#C9BFAE">' + esc(p.name_ar) + '</text>' +
      '</svg>';
  }

  /* ---------- فنّ التصنيفات ---------- */
  function category(cat) {
    const id = nid();
    const a = cat.accent || '#CBAA6C';
    return '<svg class="art" viewBox="0 0 400 400" role="img" aria-label="' + esc(cat.ar) + '" xmlns="http://www.w3.org/2000/svg">' +
      '<defs><radialGradient id="' + id + '" cx="50%" cy="38%" r="65%">' +
      '<stop offset="0%" stop-color="' + a + '" stop-opacity="0.22"/><stop offset="100%" stop-color="' + a + '" stop-opacity="0"/>' +
      '</radialGradient></defs>' +
      '<rect width="400" height="400" fill="#14110E"/><rect width="400" height="400" fill="url(#' + id + ')"/>' +
      '<g opacity="0.07" transform="translate(268 66) scale(5)" stroke="' + a + '" fill="none" stroke-width="0.9">' +
      '<polygon points="12,3 13.8,8.1 18.2,5.8 15.9,10.2 21,12 15.9,13.8 18.2,18.2 13.8,15.9 12,21 10.2,15.9 5.8,18.2 8.1,13.8 3,12 8.1,10.2 5.8,5.8 10.2,8.1"/></g>' +
      '<circle cx="200" cy="200" r="118" fill="none" stroke="' + a + '" stroke-opacity="0.16" stroke-width="1"/>' +
      '<circle cx="200" cy="200" r="134" fill="none" stroke="' + a + '" stroke-opacity="0.08" stroke-width="1" stroke-dasharray="2 7"/>' +
      '<g transform="translate(' + (200 - 72) + ' ' + (200 - 72) + ') scale(6)" fill="none" stroke="' + a + '" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round" opacity="0.92">' +
      (GLYPHS[cat.glyph] || GLYPHS.star8) + '</g>' +
      '<rect x="178" y="330" width="44" height="2" fill="' + a + '" opacity="0.35"/>' +
      '</svg>';
  }

  /* ---------- فنّ المجموعات ---------- */
  function collection(col) {
    const id = nid();
    const a = col.accent || '#CBAA6C';
    return '<svg class="art" viewBox="0 0 800 360" role="img" aria-label="' + esc(col.ar) + '" xmlns="http://www.w3.org/2000/svg">' +
      '<defs><radialGradient id="' + id + '" cx="38%" cy="40%" r="70%">' +
      '<stop offset="0%" stop-color="' + a + '" stop-opacity="0.20"/><stop offset="100%" stop-color="' + a + '" stop-opacity="0"/>' +
      '</radialGradient></defs>' +
      '<rect width="800" height="360" fill="#14110E"/><rect width="800" height="360" fill="url(#' + id + ')"/>' +
      '<path d="M-40 330 Q 400 -70 840 330" fill="none" stroke="' + a + '" stroke-opacity="0.18" stroke-width="1.2"/>' +
      '<path d="M-40 356 Q 400 -20 840 356" fill="none" stroke="' + a + '" stroke-opacity="0.09" stroke-width="1"/>' +
      '<g opacity="0.10" transform="translate(452 96) scale(9)" stroke="' + a + '" fill="none" stroke-width="0.85">' +
      '<polygon points="12,3 13.8,8.1 18.2,5.8 15.9,10.2 21,12 15.9,13.8 18.2,18.2 13.8,15.9 12,21 10.2,15.9 5.8,18.2 8.1,13.8 3,12 8.1,10.2 5.8,5.8 10.2,8.1"/></g>' +
      '<g transform="translate(' + (560 - 60) + ' ' + (180 - 60) + ') scale(5)" fill="none" stroke="' + a + '" stroke-width="1.15" stroke-linecap="round" stroke-linejoin="round" opacity="0.9">' +
      (GLYPHS[col.glyph] || GLYPHS.star8) + '</g>' +
      '<circle cx="560" cy="180" r="104" fill="none" stroke="' + a + '" stroke-opacity="0.14" stroke-width="1"/>' +
      '<circle cx="560" cy="180" r="120" fill="none" stroke="' + a + '" stroke-opacity="0.07" stroke-width="1" stroke-dasharray="2 7"/>' +
      '</svg>';
  }

  /* ---------- فنّ مناسبات الهدايا ---------- */
  function occasion(o) {
    const id = nid();
    return '<svg class="art" viewBox="0 0 200 200" role="img" aria-label="' + esc(o.ar) + '" xmlns="http://www.w3.org/2000/svg">' +
      '<defs><radialGradient id="' + id + '" cx="50%" cy="40%" r="70%">' +
      '<stop offset="0%" stop-color="#CBAA6C" stop-opacity="0.18"/><stop offset="100%" stop-color="#CBAA6C" stop-opacity="0"/>' +
      '</radialGradient></defs>' +
      '<rect width="200" height="200" fill="#14110E"/><rect width="200" height="200" fill="url(#' + id + ')"/>' +
      '<circle cx="100" cy="100" r="62" fill="none" stroke="rgba(203,170,108,0.16)" stroke-width="1"/>' +
      '<g transform="translate(' + (100 - 34) + ' ' + (100 - 34) + ') scale(2.8)" fill="none" stroke="#CBAA6C" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round" opacity="0.9">' +
      (GLYPHS[o.glyph] || GLYPHS.gift) + '</g>' +
      '</svg>';
  }

  /* ---------- النقش العربي (خلفية CSS) ---------- */
  function patternURL(alpha) {
    const a = alpha == null ? 0.05 : alpha;
    const star = '<polygon points="60,18 66.5,40 88,33.5 81.5,55 103,60 81.5,65 88,86.5 66.5,80 60,102 53.5,80 32,86.5 38.5,65 17,60 38.5,55 32,33.5 53.5,40" fill="none" stroke="#CBAA6C" stroke-width="1"/>';
    const corners = '<g opacity="0.7">' +
      '<path d="M0 0 L10 0 M0 0 L0 10" stroke="#CBAA6C" stroke-width="1" fill="none"/>' +
      '<path d="M120 0 L110 0 M120 0 L120 10" stroke="#CBAA6C" stroke-width="1" fill="none"/>' +
      '<path d="M0 120 L10 120 M0 120 L0 110" stroke="#CBAA6C" stroke-width="1" fill="none"/>' +
      '<path d="M120 120 L110 120 M120 120 L120 110" stroke="#CBAA6C" stroke-width="1" fill="none"/></g>';
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">' +
      '<g opacity="' + a + '">' + star + corners + '</g></svg>';
    return 'url("data:image/svg+xml,' + encodeURIComponent(svg).replace(/'/g, '%27') + '")';
  }
  function injectStyles() {
    if (document.getElementById('art-pattern-style')) return;
    const st = document.createElement('style');
    st.id = 'art-pattern-style';
    st.textContent = '.patterned{background-image:' + patternURL(0.05) + ';background-size:120px 120px;}';
    document.head.appendChild(st);
  }

  /* ---------- مونوغرام الدار ---------- */
  function monogram(size) {
    const s = size || 40;
    return '<svg class="monogram" width="' + s + '" height="' + s + '" viewBox="0 0 48 48" role="img" aria-label="دار الأُمراء" xmlns="http://www.w3.org/2000/svg">' +
      '<circle cx="24" cy="24" r="22" fill="none" stroke="#CBAA6C" stroke-width="1.6"/>' +
      '<circle cx="24" cy="24" r="18" fill="none" stroke="rgba(203,170,108,0.45)" stroke-width="0.8" stroke-dasharray="2 3"/>' +
      '<text x="24" y="31" text-anchor="middle" font-family="' + FONT_AR + '" font-size="20" fill="#E8D3A3">أ</text></svg>';
  }

  /* ---------- نظام الأيقونات (24×24) ---------- */
  const GLYPHS = {
    'search': '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/>',
    'cart': '<path d="M6 7h15l-1.7 9.4a2 2 0 0 1-2 1.6H9.3a2 2 0 0 1-2-1.7L5.4 4.8A1 1 0 0 0 4.4 4H2.6"/><circle cx="9.6" cy="20.6" r="1.4"/><circle cx="17.6" cy="20.6" r="1.4"/>',
    'heart': '<path d="M12 20.3S4 15.4 4 9.9A4.6 4.6 0 0 1 8.6 5.3c1.6 0 2.7.8 3.4 1.9.7-1.1 1.8-1.9 3.4-1.9A4.6 4.6 0 0 1 20 9.9c0 5.5-8 10.4-8 10.4z"/>',
    'heart-fill': '<path fill="currentColor" stroke="none" d="M12 20.3S4 15.4 4 9.9A4.6 4.6 0 0 1 8.6 5.3c1.6 0 2.7.8 3.4 1.9.7-1.1 1.8-1.9 3.4-1.9A4.6 4.6 0 0 1 20 9.9c0 5.5-8 10.4-8 10.4z"/>',
    'user': '<circle cx="12" cy="8" r="3.6"/><path d="M5 20c.6-3.6 3.4-5.4 7-5.4s6.4 1.8 7 5.4"/>',
    'menu': '<path d="M4 7h16M4 12h16M4 17h16"/>',
    'close': '<path d="M6 6l12 12M18 6L6 18"/>',
    'chevron-down': '<path d="M6 9.5l6 6 6-6"/>',
    'chevron-up': '<path d="M6 14.5l6-6 6 6"/>',
    'chevron-left': '<path d="M14.5 5.5 8 12l6.5 6.5"/>',
    'chevron-right': '<path d="M9.5 5.5 16 12l-6.5 6.5"/>',
    'arrow-left': '<path d="M19 12H5M11 6l-6 6 6 6"/>',
    'arrow-right': '<path d="M5 12h14M13 6l6 6-6 6"/>',
    'arrow-up': '<path d="M12 19V6M6.5 11 12 5.5 17.5 11"/>',
    'star': '<path fill="currentColor" stroke="none" d="M12 2.8l2.8 5.7 6.3.9-4.6 4.4 1.1 6.3L12 17.2l-5.6 2.9 1.1-6.3L2.9 9.4l6.3-.9z"/>',
    'plus': '<path d="M12 5v14M5 12h14"/>',
    'minus': '<path d="M5 12h14"/>',
    'trash': '<path d="M5 7h14M10 7V5h4v2M8 7l.8 12h6.4L16 7"/><path d="M10.5 10.5v5M13.5 10.5v5"/>',
    'filter': '<path d="M4 6h16M7 12h10M10 18h4"/>',
    'sort': '<path d="M7 4v14M7 18l-2.5-2.5M7 18l2.5-2.5M17 20V6M17 6l-2.5 2.5M17 6l2.5 2.5"/>',
    'share': '<circle cx="6" cy="12" r="2.4"/><circle cx="17.5" cy="6" r="2.4"/><circle cx="17.5" cy="18" r="2.4"/><path d="M8.2 10.8l7-3.4M8.2 13.2l7 3.4"/>',
    'whatsapp': '<path fill="currentColor" stroke="none" d="M12 3a9 9 0 0 0-7.6 13.8L3 21l4.4-1.2A9 9 0 1 0 12 3zm4.4 12.4c-.2.5-1 1-1.4 1-.4.1-.8.1-1.3-.1a11 11 0 0 1-3.4-2.1 10 10 0 0 1-2.2-3.1c-.3-.7-.3-1.4-.1-1.8.2-.4.6-.9 1-.9h.6c.2 0 .4 0 .5.4l.7 1.7c.1.2.1.4 0 .5l-.4.6c-.1.2-.2.3 0 .5.2.4 1 1.6 2.1 2.2.9.5 1.2.5 1.4.3l.6-.7c.2-.2.3-.2.5-.1l1.7.8c.2.1.3.2.3.4s0 .6-.1.9z"/>',
    'check': '<path d="M5 12.5l4.5 4.5L19 7"/>',
    'check-circle': '<circle cx="12" cy="12" r="8.5"/><path d="M8.5 12.3l2.4 2.4 4.6-4.8"/>',
    'truck': '<path d="M3 7h11v9H3zM14 10h4l3 3v3h-7z"/><circle cx="7" cy="18" r="1.7"/><circle cx="17" cy="18" r="1.7"/>',
    'shield': '<path d="M12 3l7.5 3v6c0 4.6-3.2 7.6-7.5 9-4.3-1.4-7.5-4.4-7.5-9V6z"/><path d="M8.8 12l2.2 2.2 4.2-4.4"/>',
    'refresh': '<path d="M4 12a8 8 0 0 1 13.7-5.7L20 8.6M20 4.5v4h-4M20 12a8 8 0 0 1-13.7 5.7L4 15.4M4 19.5v-4h4"/>',
    'gift': '<rect x="4" y="9" width="16" height="11" rx="1.5"/><path d="M4 13h16M12 9v11M12 9c-2.5 0-4.5-1-4.5-2.7C7.5 5 9 4.5 10 5c1.4.7 2 2.5 2 4zM12 9c2.5 0 4.5-1 4.5-2.7 0-1.3-1.5-1.8-2.5-1.3C12.6 5.7 12 7.5 12 9z"/>',
    'phone': '<path d="M6.5 3.5h3l1.5 4-2 1.5c.8 1.8 2.4 3.4 4.2 4.2l1.5-2 4 1.5v3a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4.5 5.7a2 2 0 0 1 2-2.2z"/>',
    'mail': '<rect x="3.5" y="5.5" width="17" height="13" rx="2"/><path d="M4.5 7.5 12 13l7.5-5.5"/>',
    'map-pin': '<path d="M12 21s-6.5-5.4-6.5-10a6.5 6.5 0 0 1 13 0C18.5 15.6 12 21 12 21z"/><circle cx="12" cy="10.6" r="2.4"/>',
    'clock': '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    'eye': '<path d="M2.5 12S6 6.5 12 6.5 21.5 12 21.5 12 18 17.5 12 17.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.6"/>',
    'sparkles': '<path d="M12 3l1.7 4.6L18 9.3l-4.3 1.7L12 15.6l-1.7-4.6L6 9.3l4.3-1.7z"/><path d="M18.5 15l.9 2.3 2.3.9-2.3.9-.9 2.3-.9-2.3-2.3-.9 2.3-.9z"/>',
    'sliders': '<path d="M5 7h8M18 7h1M5 12h1M11 12h8M5 17h10M20 17h0"/><circle cx="15.5" cy="7" r="1.9"/><circle cx="8.5" cy="12" r="1.9"/><circle cx="17.5" cy="17" r="1.9"/>',
    'package': '<path d="M12 3 4.5 7v10L12 21l7.5-4V7z"/><path d="M4.5 7 12 11l7.5-4M12 11v10"/>',
    'credit-card': '<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M3 10h18M6.5 14.5h4"/>',
    'bell': '<path d="M12 4a5.5 5.5 0 0 1 5.5 5.5c0 4 1.5 5.5 1.5 5.5H5s1.5-1.5 1.5-5.5A5.5 5.5 0 0 1 12 4z"/><path d="M10 18.8a2.1 2.1 0 0 0 4 0"/>',
    'logout': '<path d="M14 6H6.5A1.5 1.5 0 0 0 5 7.5v9A1.5 1.5 0 0 0 6.5 18H14M10 12h10M17 8.5 20.5 12 17 15.5"/>',
    'edit': '<path d="M14.5 5.5l4 4L8 20H4v-4z"/><path d="M12.5 7.5l4 4"/>',
    'chart': '<path d="M4 4v16h16"/><rect x="7" y="12" width="3" height="5"/><rect x="12" y="8" width="3" height="9"/><rect x="17" y="5" width="3" height="12"/>',
    'users': '<circle cx="9" cy="9" r="3.2"/><path d="M3.5 19c.5-3 2.8-4.5 5.5-4.5s5 1.5 5.5 4.5"/><path d="M15.5 6.4a3.2 3.2 0 0 1 0 5.2M17.5 14.9c1.8.6 2.9 2 3.2 4.1"/>',
    'tag': '<path d="M4 4h7l9 9-7 7-9-9z"/><circle cx="8.5" cy="8.5" r="1.4"/>',
    'image': '<rect x="3.5" y="5" width="17" height="14" rx="2"/><circle cx="9" cy="10" r="1.8"/><path d="M4.5 17.5 10 12l3 3 3.5-3.5 3.5 4"/>',
    'settings': '<circle cx="12" cy="12" r="3"/><path d="M12 3.5v2.2M12 18.3v2.2M20.5 12h-2.2M5.7 12H3.5M18 6l-1.6 1.6M7.6 16.4 6 18M18 18l-1.6-1.6M7.6 7.6 6 6"/>',
    'grid': '<rect x="4" y="4" width="7" height="7" rx="1"/><rect x="13" y="4" width="7" height="7" rx="1"/><rect x="4" y="13" width="7" height="7" rx="1"/><rect x="13" y="13" width="7" height="7" rx="1"/>',
    'flame': '<path d="M12 3.5c1 3-.5 4.5-2 6C8.5 11 7 12.5 7 15a5 5 0 0 0 10 0c0-1.8-.8-3-1.6-4-.3 1-.9 1.8-1.9 2.3.7-2.6-.3-6-1.5-9.8z"/>',
    'percent': '<path d="M6 18 18 6"/><circle cx="7.5" cy="7.5" r="2.2"/><circle cx="16.5" cy="16.5" r="2.2"/>',
    'layers': '<path d="M12 4 4 8.5 12 13l8-4.5z"/><path d="M4 12.5 12 17l8-4.5M4 16.5 12 21l8-4.5"/>',
    'x-circle': '<circle cx="12" cy="12" r="8.5"/><path d="M9 9l6 6M15 9l-6 6"/>',
    'alert': '<path d="M12 4 21 19H3z"/><path d="M12 10v4M12 16.6v.2"/>',
    'info': '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5M12 8.2v.2"/>',
    'camera': '<path d="M4 8.5h3.5L9 6h6l1.5 2.5H20v11H4z"/><circle cx="12" cy="13" r="3.4"/>',
    'smoke': '<path d="M9 20c-1.8-2.5 1.5-3.5 0-6M13 20c-1.8-2.5 1.5-3.5 0-6M17 20c-1.8-2.5 1.5-3.5 0-6"/>',
    'moon': '<path d="M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10z"/>',
    'sun': '<circle cx="12" cy="12" r="4"/><path d="M12 2.8v2M12 19.2v2M21.2 12h-2M4.8 12h-2M18.5 5.5l-1.4 1.4M6.9 17.1l-1.4 1.4M18.5 18.5l-1.4-1.4M6.9 6.9 5.5 5.5"/>',
    'wave': '<path d="M3 10c2.5-3 5-3 7.5 0s5 3 7.5 0M3 16c2.5-3 5-3 7.5 0s5 3 7.5 0"/>',
    'snow': '<path d="M12 3v18M4.2 7.5l15.6 9M19.8 7.5l-15.6 9"/>',
    'flower': '<circle cx="12" cy="12" r="2.2"/><path d="M12 9.8C10.5 7 10.8 4.6 12 3c1.2 1.6 1.5 4 0 6.8zM12 14.2c1.5 2.8 1.2 5.2 0 6.8-1.2-1.6-1.5-4 0-6.8zM9.8 12C7 10.5 4.6 10.8 3 12c1.6 1.2 4 1.5 6.8 0zM14.2 12c2.8-1.5 5.2-1.2 6.8 0-1.6 1.2-4 1.5-6.8 0z"/>',
    'infinity': '<path d="M12 12c-2-2.7-3.8-4-5.7-4a4 4 0 0 0 0 8c1.9 0 3.7-1.3 5.7-4s3.8-4 5.7-4a4 4 0 0 1 0 8c-1.9 0-3.7-1.3-5.7-4z"/>',
    'crown': '<path d="M4.5 18h15M5.5 15.5 4 7.5l4.5 3.5L12 5.5l3.5 5.5L20 7.5l-1.5 8z"/>',
    'star8': '<polygon points="12,3 13.8,8.1 18.2,5.8 15.9,10.2 21,12 15.9,13.8 18.2,18.2 13.8,15.9 12,21 10.2,15.9 5.8,18.2 8.1,13.8 3,12 8.1,10.2 5.8,5.8 10.2,8.1"/>',
    'tower': '<path d="M5 20V9l7-5 7 5v11M9.5 20v-5.5a2.5 2.5 0 0 1 5 0V20"/>',
    'wood': '<rect x="4" y="9" width="16" height="6.5" rx="3.2"/><ellipse cx="18.8" cy="12.25" rx="1.7" ry="3.1"/><path d="M7.5 12.25h4"/>',
    'shield-glyph': '<path d="M12 3l7.5 3v6c0 4.6-3.2 7.6-7.5 9-4.3-1.4-7.5-4.4-7.5-9V6z"/>',
    'cake': '<path d="M4.5 20h15M5.5 20v-6c0-1.4 1.4-2 2.6-2h7.8c1.2 0 2.6.6 2.6 2v6"/><path d="M5.5 16h13M12 12v-2M12 8.5v.2"/>',
    'rings': '<circle cx="9.5" cy="14" r="5"/><circle cx="14.5" cy="14" r="5"/><path d="M12 4.5 10 7h4z"/>',
    'cap': '<path d="M12 5 3 9.5 12 14l9-4.5z"/><path d="M6.5 11.5V16c0 1.4 2.5 2.7 5.5 2.7s5.5-1.3 5.5-2.7v-4.5M21 9.5V15"/>',
    'tie': '<path d="M12 4 9.5 6l1 2.5L9 18l3 2 3-2-1.5-9.5 1-2.5z"/>',
    'briefcase': '<rect x="3.5" y="8" width="17" height="11" rx="1.8"/><path d="M9 8V6.5A1.5 1.5 0 0 1 10.5 5h3A1.5 1.5 0 0 1 15 6.5V8M3.5 12.5h17"/>',
    'instagram': '<rect x="4" y="4" width="16" height="16" rx="4.5"/><circle cx="12" cy="12" r="3.6"/><circle cx="16.8" cy="7.3" r="0.9"/>',
    'x-social': '<path d="M5 4.5 19 19.5M19 4.5 5 19.5"/>',
    'tiktok': '<path d="M14 4v9.5a4 4 0 1 1-3-3.9"/><path d="M14 6.5c.8 1.8 2.3 2.9 4.5 3"/>',
    'quote': '<path d="M9 7c-2.5.8-4 2.7-4 5.4V17h5v-5H7.4c.1-1.6.9-2.7 2.6-3.4zM19 7c-2.5.8-4 2.7-4 5.4V17h5v-5h-2.6c.1-1.6.9-2.7 2.6-3.4z"/>'
  };

  function iconSprite() {
    let sym = '';
    Object.keys(GLYPHS).forEach(name => {
      sym += '<symbol id="i-' + name + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">' + GLYPHS[name] + '</symbol>';
    });
    return '<svg xmlns="http://www.w3.org/2000/svg" style="position:absolute;width:0;height:0;overflow:hidden" aria-hidden="true"><defs></defs>' + sym + '</svg>';
  }

  window.Art = {
    product: product, box: box, category: category, collection: collection, occasion: occasion,
    patternURL: patternURL, injectStyles: injectStyles, monogram: monogram,
    iconSprite: iconSprite, GLYPHS: GLYPHS, ART_MAP: ART_MAP
  };
})();
