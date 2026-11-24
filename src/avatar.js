/* avatar.js — awatar ucznia rysowany w SVG z wybranych elementów (bez zdjęć, bez danych osobowych). */
var MP = window.MP;
(function (MP) {
  const O = {
    bg: ['#ffd84a', '#7f95ff', '#5fd3a8', '#ff8a70', '#c9a7ff', '#7dd3fc', '#f9a8d4', '#d9f99d'],
    skin: ['#ffe0c7', '#f5c9a5', '#e0a77e', '#b9794f', '#8a5636', '#5e3a24'],
    hair: ['krótkie', 'jeżyk', 'grzywka', 'długie', 'kucyki', 'loki', 'irokez', 'bez włosów'],
    hairC: ['#2b1d14', '#5a3a22', '#a8692f', '#e8c070', '#c2410c', '#1f2937', '#6d28d9', '#2563eb'],
    eyes: ['kropki', 'wesołe', 'duże', 'mrugnięcie', 'zdecydowane'],
    mouth: ['uśmiech', 'szeroki uśmiech', 'język', 'spokojny', 'zdziwienie'],
    acc: ['brak', 'okulary', 'czapka z daszkiem', 'słuchawki', 'hełm astronauty', 'opaska sportowa', 'korona', 'piegi'],
    shirt: ['#2f4bd8', '#f2583a', '#127a5a', '#1c2130', '#e8c53f', '#9333ea', '#0ea5e9', '#ffffff']
  };
  const LBL = { bg: 'Tło', skin: 'Skóra', hair: 'Fryzura', hairC: 'Kolor włosów', eyes: 'Oczy', mouth: 'Usta', acc: 'Dodatek', shirt: 'Koszulka' };
  const DEF = { bg: 1, skin: 1, hair: 0, hairC: 1, eyes: 0, mouth: 0, acc: 0, shirt: 0 };
  function hairSvg(h, c, back) {
    if (back) {
      if (h === 3) return '<path d="M30 58 Q28 100 40 108 L80 108 Q92 100 90 58 Z" fill="' + c + '"/>';
      if (h === 4) return '<circle cx="26" cy="64" r="10" fill="' + c + '"/><circle cx="94" cy="64" r="10" fill="' + c + '"/>';
      return '';
    }
    switch (h) {
      case 0: return '<path d="M33 56 Q34 30 60 29 Q86 30 87 56 Q80 42 60 41 Q40 42 33 56 Z" fill="' + c + '"/>';
      case 1: return '<path d="M34 52 L38 34 L44 44 L50 28 L56 42 L62 26 L68 42 L74 30 L78 44 L84 34 L86 52 Q60 40 34 52 Z" fill="' + c + '"/>';
      case 2: return '<path d="M32 58 Q32 28 60 28 Q88 28 88 58 Q82 46 72 44 Q60 54 42 46 Q36 50 32 58 Z" fill="' + c + '"/>';
      case 3: return '<path d="M30 62 Q30 28 60 27 Q90 28 90 62 Q84 44 60 42 Q36 44 30 62 Z" fill="' + c + '"/>';
      case 4: return '<path d="M33 54 Q36 30 60 30 Q84 30 87 54 Q76 42 60 42 Q44 42 33 54 Z" fill="' + c + '"/>';
      case 5: return [36, 46, 56, 66, 76, 84, 32, 88].map((x, i) => '<circle cx="' + x + '" cy="' + (i < 6 ? 36 + (i % 2) * 4 : 50) + '" r="9" fill="' + c + '"/>').join('');
      case 6: return '<path d="M52 44 L54 18 L60 14 L66 18 L68 44 Z" fill="' + c + '"/>';
      default: return '';
    }
  }
  function eyesSvg(e) {
    const ink = '#1c2130';
    switch (e) {
      case 1: return '<path d="M44 62 Q48 57 52 62" stroke="' + ink + '" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M68 62 Q72 57 76 62" stroke="' + ink + '" stroke-width="3" fill="none" stroke-linecap="round"/>';
      case 2: return '<circle cx="48" cy="61" r="6" fill="#fff" stroke="' + ink + '" stroke-width="1.5"/><circle cx="72" cy="61" r="6" fill="#fff" stroke="' + ink + '" stroke-width="1.5"/><circle cx="49" cy="62" r="3" fill="' + ink + '"/><circle cx="73" cy="62" r="3" fill="' + ink + '"/>';
      case 3: return '<circle cx="48" cy="61" r="3.5" fill="' + ink + '"/><path d="M68 61 L77 61" stroke="' + ink + '" stroke-width="3" stroke-linecap="round"/>';
      case 4: return '<path d="M42 55 L53 58" stroke="' + ink + '" stroke-width="2.5" stroke-linecap="round"/><path d="M78 55 L67 58" stroke="' + ink + '" stroke-width="2.5" stroke-linecap="round"/><circle cx="48" cy="63" r="3.5" fill="' + ink + '"/><circle cx="72" cy="63" r="3.5" fill="' + ink + '"/>';
      default: return '<circle cx="48" cy="61" r="3.5" fill="' + ink + '"/><circle cx="72" cy="61" r="3.5" fill="' + ink + '"/>';
    }
  }
  function mouthSvg(m) {
    const ink = '#1c2130';
    switch (m) {
      case 1: return '<path d="M48 74 Q60 88 72 74 Z" fill="' + ink + '"/><path d="M52 76 Q60 80 68 76" stroke="#fff" stroke-width="2" fill="none"/>';
      case 2: return '<path d="M49 75 Q60 84 71 75" stroke="' + ink + '" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M58 79 Q62 88 66 79 Z" fill="#f2583a"/>';
      case 3: return '<path d="M52 77 L68 77" stroke="' + ink + '" stroke-width="3" stroke-linecap="round"/>';
      case 4: return '<ellipse cx="60" cy="78" rx="5" ry="6" fill="' + ink + '"/>';
      default: return '<path d="M49 75 Q60 84 71 75" stroke="' + ink + '" stroke-width="3" fill="none" stroke-linecap="round"/>';
    }
  }
  function accSvg(a, hc) {
    const ink = '#1c2130';
    switch (a) {
      case 1: return '<circle cx="48" cy="61" r="8" fill="none" stroke="' + ink + '" stroke-width="2.5"/><circle cx="72" cy="61" r="8" fill="none" stroke="' + ink + '" stroke-width="2.5"/><path d="M56 61 L64 61" stroke="' + ink + '" stroke-width="2.5"/>';
      case 2: return '<path d="M31 46 Q32 24 60 24 Q88 24 89 46 Z" fill="#f2583a"/><path d="M60 46 L100 48 Q98 54 88 52 L60 50 Z" fill="#c2410c"/>';
      case 3: return '<path d="M30 62 Q30 26 60 26 Q90 26 90 62" stroke="' + ink + '" stroke-width="5" fill="none"/><rect x="22" y="54" width="12" height="20" rx="5" fill="#2f4bd8"/><rect x="86" y="54" width="12" height="20" rx="5" fill="#2f4bd8"/>';
      case 4: return '<circle cx="60" cy="64" r="40" fill="#bfe3ff" fill-opacity=".28" stroke="#e5e7eb" stroke-width="5"/><path d="M34 40 Q46 30 58 32" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round" opacity=".8"/>';
      case 5: return '<rect x="32" y="40" width="56" height="9" rx="4" fill="#f2583a"/><rect x="32" y="43" width="56" height="3" fill="#fff"/>';
      case 6: return '<path d="M40 34 L44 18 L52 28 L60 14 L68 28 L76 18 L80 34 Z" fill="#ffd84a" stroke="#c2a000" stroke-width="1.5"/>';
      case 7: return [[42, 70], [46, 73], [50, 70], [70, 70], [74, 73], [78, 70]].map(p => '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="1.4" fill="#a0522d"/>').join('');
      default: return '';
    }
  }
  let uid = 0;
  function svg(av, size, label) {
    av = Object.assign({}, DEF, av || {}); const cid = 'avc' + (++uid);
    const c = (k) => O[k][av[k] % O[k].length];
    const hc = c('hairC');
    return '<svg class="avatar" viewBox="0 0 120 120" width="' + (size || 64) + '" height="' + (size || 64) + '" role="img" aria-label="' + (label || 'awatar') + '">' +
      '<defs><clipPath id="' + cid + '"><circle cx="60" cy="60" r="58"/></clipPath></defs><g clip-path="url(#' + cid + ')">' +
      '<rect width="120" height="120" fill="' + c('bg') + '"/>' +
      hairSvg(av.hair % O.hair.length, hc, true) +
      '<path d="M20 120 Q22 92 60 90 Q98 92 100 120 Z" fill="' + c('shirt') + '"/>' +
      '<rect x="52" y="80" width="16" height="14" rx="4" fill="' + c('skin') + '"/>' +
      '<ellipse cx="60" cy="62" rx="27" ry="29" fill="' + c('skin') + '"/>' +
      '<circle cx="33" cy="64" r="5" fill="' + c('skin') + '"/><circle cx="87" cy="64" r="5" fill="' + c('skin') + '"/>' +
      hairSvg(av.hair % O.hair.length, hc, false) + eyesSvg(av.eyes % O.eyes.length) + mouthSvg(av.mouth % O.mouth.length) +
      '<circle cx="42" cy="72" r="4" fill="#f2583a" opacity=".18"/><circle cx="78" cy="72" r="4" fill="#f2583a" opacity=".18"/>' +
      accSvg(av.acc % O.acc.length, hc) + '</g></svg>';
  }
  function random() { const a = {}; Object.keys(O).forEach(k => { a[k] = Math.floor(Math.random() * O[k].length); }); if (Math.random() < 0.6) a.acc = 0; return a; }
  MP.avatar = { O, LBL, DEF, svg, random };
})(MP);
