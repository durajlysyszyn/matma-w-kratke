/* helpers.js — pomocnicy ucznia (rysunkowe zwierzątka, robot, ufok) w stylu awatara.
   Każdy ma kilka stanów: idle (czeka), happy (dobra odpowiedź), oops (zła – łagodnie, wspierająco),
   think (wskazówka / zastanawia się), party (awans, zaliczony test). Rysowane w SVG, bez obrazków z sieci. */
var MP = window.MP;
(function (MP) {
  const INK = '#1c2130';
  let uid = 0;
  // ---------- mimika wspólna dla wszystkich ----------
  // o: { ey: wysokość oczu, ex: rozstaw od środka, my: wysokość ust, ink, big: duże oczy (ufok), eyeBg: białka (ciemna sierść), noBlush }
  function face(st, o) {
    const ink = o.ink || INK, ex = o.ex || 12, ey = o.ey || 60, my = o.my || 80, L = 60 - ex, R = 60 + ex;
    let s = '';
    if (o.eyeBg) s += '<circle cx="' + L + '" cy="' + ey + '" r="' + (o.big ? 10 : 7) + '" fill="' + o.eyeBg + '"/><circle cx="' + R + '" cy="' + ey + '" r="' + (o.big ? 10 : 7) + '" fill="' + o.eyeBg + '"/>';
    const dot = (x, dy) => o.big
      ? '<ellipse cx="' + x + '" cy="' + (ey + (dy || 0)) + '" rx="7" ry="9.5" fill="' + ink + '"/><circle cx="' + (x + 2.5) + '" cy="' + (ey - 3.5 + (dy || 0)) + '" r="2.6" fill="#fff"/>'
      : '<circle cx="' + x + '" cy="' + (ey + (dy || 0)) + '" r="4.2" fill="' + ink + '"/><circle cx="' + (x + 1.4) + '" cy="' + (ey - 1.5 + (dy || 0)) + '" r="1.4" fill="#fff"/>';
    const arc = (x) => '<path d="M' + (x - (o.big ? 7 : 5)) + ' ' + (ey + 2) + ' Q' + x + ' ' + (ey - (o.big ? 8 : 5)) + ' ' + (x + (o.big ? 7 : 5)) + ' ' + (ey + 2) + '" stroke="' + ink + '" stroke-width="' + (o.big ? 4 : 3.2) + '" fill="none" stroke-linecap="round"/>';
    if (st === 'happy' || st === 'party') s += arc(L) + arc(R);
    else if (st === 'think') s += dot(L + 1.5, -1.5) + dot(R + 1.5, -1.5) + '<path d="M' + (R - 6) + ' ' + (ey - (o.big ? 14 : 10)) + ' L' + (R + 6) + ' ' + (ey - (o.big ? 16 : 12)) + '" stroke="' + ink + '" stroke-width="2.4" stroke-linecap="round"/>';
    else if (st === 'oops') s += dot(L) + dot(R) + '<path d="M' + (L - 6) + ' ' + (ey - (o.big ? 13 : 9)) + ' L' + (L + 4) + ' ' + (ey - (o.big ? 16 : 12)) + '" stroke="' + ink + '" stroke-width="2.4" stroke-linecap="round"/><path d="M' + (R - 4) + ' ' + (ey - (o.big ? 16 : 12)) + ' L' + (R + 6) + ' ' + (ey - (o.big ? 13 : 9)) + '" stroke="' + ink + '" stroke-width="2.4" stroke-linecap="round"/>';
    else s += dot(L) + dot(R);
    // usta
    if (st === 'happy' || st === 'party') s += '<path d="M51 ' + (my - 2) + ' Q60 ' + (my + 11) + ' 69 ' + (my - 2) + ' Z" fill="' + ink + '"/><path d="M55 ' + (my + 3.5) + ' Q60 ' + (my + 8) + ' 65 ' + (my + 3.5) + ' Q60 ' + (my + 2) + ' 55 ' + (my + 3.5) + ' Z" fill="#f472b6"/>';
    else if (st === 'oops') s += '<path d="M53 ' + (my + 3) + ' Q56.5 ' + (my - 1) + ' 60 ' + (my + 2) + ' Q63.5 ' + (my + 5) + ' 67 ' + (my + 1) + '" stroke="' + ink + '" stroke-width="2.6" fill="none" stroke-linecap="round"/>';
    else if (st === 'think') s += '<path d="M55 ' + (my + 2) + ' L66 ' + (my - 1) + '" stroke="' + ink + '" stroke-width="2.8" stroke-linecap="round"/>';
    else s += '<path d="M53 ' + my + ' Q60 ' + (my + 6) + ' 67 ' + my + '" stroke="' + ink + '" stroke-width="2.8" fill="none" stroke-linecap="round"/>';
    if (!o.noBlush) s += '<circle cx="' + (L - 6) + '" cy="' + (ey + 11) + '" r="4.5" fill="#f2583a" opacity=".2"/><circle cx="' + (R + 6) + '" cy="' + (ey + 11) + '" r="4.5" fill="#f2583a" opacity=".2"/>';
    return s;
  }
  // ---------- dodatki zależne od stanu ----------
  const star = (x, y, r, c) => '<path d="M' + x + ' ' + (y - r) + ' L' + (x + r * .3) + ' ' + (y - r * .3) + ' L' + (x + r) + ' ' + y + ' L' + (x + r * .3) + ' ' + (y + r * .3) + ' L' + x + ' ' + (y + r) + ' L' + (x - r * .3) + ' ' + (y + r * .3) + ' L' + (x - r) + ' ' + y + ' L' + (x - r * .3) + ' ' + (y - r * .3) + ' Z" fill="' + c + '"/>';
  function extras(st) {
    if (st === 'happy') return star(18, 30, 7, '#ffd84a') + star(102, 24, 5, '#ffd84a') + star(104, 44, 3.5, '#fff');
    if (st === 'party') return [[14, 20, '#f2583a', 20], [100, 14, '#2f4bd8', -25], [106, 40, '#127a5a', 40], [12, 46, '#9333ea', -15], [30, 10, '#ffd84a', 10], [88, 30, '#ffd84a', 60]]
      .map(c => '<rect x="' + c[0] + '" y="' + c[1] + '" width="7" height="4" rx="1" fill="' + c[2] + '" transform="rotate(' + c[3] + ' ' + c[0] + ' ' + c[1] + ')"/>').join('') + star(22, 32, 6, '#ffd84a') + star(98, 52, 5, '#ffd84a');
    if (st === 'oops') return '<path d="M98 40 Q104 50 98 54 Q92 50 98 40 Z" fill="#7dd3fc" stroke="#38bdf8" stroke-width="1"/>';
    if (st === 'think') return '<circle cx="92" cy="30" r="3" fill="#fff" stroke="' + INK + '" stroke-width="1.2"/><circle cx="100" cy="20" r="5" fill="#fff" stroke="' + INK + '" stroke-width="1.2"/><text x="100" y="24" text-anchor="middle" font-size="9" font-weight="700" fill="' + INK + '" font-family="system-ui,sans-serif">?</text>';
    return '';
  }
  // ---------- postacie ----------
  const C = {};
  C.swinka = { name: 'Truflinka', kind: 'świnka', sound: 'Chrum, chrum!', bg: '#ffe4ef', face: { ey: 56, my: 89 },
    draw: () => '<path d="M28 44 L36 18 L54 34 Z" fill="#f7a8c4"/><path d="M33 38 L37 25 L47 33 Z" fill="#ff8fb4"/><path d="M92 44 L84 18 L66 34 Z" fill="#f7a8c4"/><path d="M87 38 L83 25 L73 33 Z" fill="#ff8fb4"/>' +
      '<path d="M22 120 Q26 98 60 96 Q94 98 98 120 Z" fill="#ffbfd6"/><ellipse cx="60" cy="64" rx="35" ry="31" fill="#ffbfd6"/>' +
      '<ellipse cx="60" cy="76" rx="14" ry="9.5" fill="#f79cbf"/><ellipse cx="55" cy="76" rx="2.3" ry="3.4" fill="#c2577f"/><ellipse cx="65" cy="76" rx="2.3" ry="3.4" fill="#c2577f"/>' };
  C.maine = { name: 'Leon', kind: 'kot maine coon', sound: 'Mrrrau!', bg: '#fde9cf', face: { ey: 60, my: 83 },
    draw: () => '<path d="M26 50 L32 12 L54 34 Z" fill="#7a4e2b"/><path d="M32 42 L34 22 L47 34 Z" fill="#f4c7a1"/><path d="M32 13 L29 2 M32 13 L35 3" stroke="#5b3a20" stroke-width="2" stroke-linecap="round"/>' +
      '<path d="M94 50 L88 12 L66 34 Z" fill="#7a4e2b"/><path d="M88 42 L86 22 L73 34 Z" fill="#f4c7a1"/><path d="M88 13 L91 2 M88 13 L85 3" stroke="#5b3a20" stroke-width="2" stroke-linecap="round"/>' +
      '<path d="M20 120 Q24 96 60 94 Q96 96 100 120 Z" fill="#8b5e3c"/><path d="M42 98 L48 110 L54 98 L60 112 L66 98 L72 110 L78 98 Q60 92 42 98 Z" fill="#f1dfc4"/>' +
      '<path d="M26 66 Q26 34 60 32 Q94 34 94 66 L102 70 L93 74 L100 82 L88 82 Q76 96 60 96 Q44 96 32 82 L20 82 L27 74 L18 70 Z" fill="#9a6a3f"/>' +
      '<path d="M48 38 L52 47 L60 40 L68 47 L72 38" stroke="#5b3a20" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M30 60 L38 62 M30 68 L37 68 M90 60 L82 62 M90 68 L83 68" stroke="#5b3a20" stroke-width="2.5" stroke-linecap="round"/>' +
      '<ellipse cx="60" cy="80" rx="16" ry="11" fill="#f1dfc4"/><path d="M56 73 L64 73 L60 78 Z" fill="#e58a8a"/>' +
      '<path d="M44 80 L28 77 M44 84 L29 86 M76 80 L92 77 M76 84 L91 86" stroke="#f8f1e7" stroke-width="1.4" stroke-linecap="round"/>' };
  C.dalmatynczyk = { name: 'Kropka', kind: 'dalmatyńczyk', sound: 'Hau, hau!', bg: '#e0f2fe', face: { ey: 58, my: 84 },
    draw: () => '<path d="M20 120 Q24 98 60 96 Q96 98 100 120 Z" fill="#fff" stroke="#e5e7eb" stroke-width="1.5"/><circle cx="36" cy="110" r="4" fill="#1f2937"/><circle cx="84" cy="106" r="3" fill="#1f2937"/>' +
      '<rect x="40" y="92" width="40" height="7" rx="3.5" fill="#f2583a"/><circle cx="60" cy="101" r="4" fill="#ffd84a"/>' +
      '<ellipse cx="60" cy="62" rx="31" ry="30" fill="#fff" stroke="#e5e7eb" stroke-width="1.5"/>' +
      '<ellipse cx="29" cy="62" rx="10" ry="20" fill="#1f2937" transform="rotate(18 29 62)"/><ellipse cx="91" cy="62" rx="10" ry="20" fill="#1f2937" transform="rotate(-18 91 62)"/>' +
      '<circle cx="45" cy="42" r="4.5" fill="#1f2937"/><circle cx="74" cy="40" r="3" fill="#1f2937"/><circle cx="82" cy="72" r="3.5" fill="#1f2937"/><circle cx="38" cy="76" r="3" fill="#1f2937"/><circle cx="64" cy="34" r="2.2" fill="#1f2937"/>' +
      '<ellipse cx="60" cy="78" rx="14" ry="10" fill="#f3f4f6"/><ellipse cx="60" cy="72" rx="6.5" ry="4.5" fill="#111"/>' };
  C.rudy = { name: 'Marchewka', kind: 'rudy kot', sound: 'Miau!', bg: '#ffedd5', face: { ey: 60, my: 83 },
    draw: () => '<path d="M28 46 L34 18 L54 34 Z" fill="#ea8a2c"/><path d="M33 40 L36 26 L47 34 Z" fill="#ffc9a3"/><path d="M92 46 L86 18 L66 34 Z" fill="#ea8a2c"/><path d="M87 40 L84 26 L73 34 Z" fill="#ffc9a3"/>' +
      '<path d="M22 120 Q26 98 60 96 Q94 98 98 120 Z" fill="#f59e42"/><ellipse cx="60" cy="64" rx="32" ry="29" fill="#f59e42"/>' +
      '<path d="M54 36 L55 45 M60 35 L60 45 M66 36 L65 45" stroke="#d9731c" stroke-width="3" stroke-linecap="round"/><path d="M29 60 L37 62 M29 67 L36 67 M91 60 L83 62 M91 67 L84 67" stroke="#d9731c" stroke-width="2.5" stroke-linecap="round"/>' +
      '<ellipse cx="60" cy="80" rx="14" ry="9" fill="#fff3e6"/><path d="M56 73 L64 73 L60 78 Z" fill="#f08080"/>' +
      '<path d="M45 80 L30 77 M45 84 L31 86 M75 80 L90 77 M75 84 L89 86" stroke="#7c3f10" stroke-width="1.2" stroke-linecap="round" opacity=".55"/>' };
  C.bernenczyk = { name: 'Bruno', kind: 'berneński pies pasterski', sound: 'Hau!', bg: '#fef3c7', face: { ey: 59, my: 88, eyeBg: '#fff', ink: '#3b2414' },
    draw: () => '<path d="M20 120 Q24 96 60 94 Q96 96 100 120 Z" fill="#1c1917"/><path d="M46 96 Q60 92 74 96 L68 120 L52 120 Z" fill="#fff"/>' +
      '<ellipse cx="27" cy="62" rx="11" ry="20" fill="#1c1917" transform="rotate(16 27 62)"/><ellipse cx="93" cy="62" rx="11" ry="20" fill="#1c1917" transform="rotate(-16 93 62)"/>' +
      '<ellipse cx="60" cy="62" rx="32" ry="31" fill="#1c1917"/><path d="M60 32 Q53 50 51 66 Q49 84 60 94 Q71 84 69 66 Q67 50 60 32 Z" fill="#fff"/>' +
      '<ellipse cx="41" cy="76" rx="8" ry="7" fill="#b45309"/><ellipse cx="79" cy="76" rx="8" ry="7" fill="#b45309"/><circle cx="47" cy="48" r="3.6" fill="#c2611a"/><circle cx="73" cy="48" r="3.6" fill="#c2611a"/>' +
      '<ellipse cx="60" cy="84" rx="16" ry="11" fill="#fff"/><ellipse cx="60" cy="77" rx="6.5" ry="4.5" fill="#111"/>' };
  C.robot = { name: 'Bit', kind: 'robot', sound: 'Bip-bup!', bg: '#dbeafe', face: { ey: 56, my: 70, ink: '#67e8f9', noBlush: true },
    draw: () => '<path d="M60 30 L60 17" stroke="#64748b" stroke-width="3"/><circle cx="60" cy="14" r="5" fill="#f2583a"/>' +
      '<rect x="30" y="94" width="60" height="30" rx="10" fill="#94a3b8"/><rect x="50" y="100" width="20" height="10" rx="3" fill="#ffd84a"/>' +
      '<circle cx="24" cy="60" r="7" fill="#64748b"/><circle cx="96" cy="60" r="7" fill="#64748b"/>' +
      '<rect x="26" y="30" width="68" height="62" rx="16" fill="#cbd5e1"/><rect x="33" y="40" width="54" height="42" rx="10" fill="#1e293b"/>' +
      '<circle cx="32" cy="36" r="2" fill="#64748b"/><circle cx="88" cy="36" r="2" fill="#64748b"/><circle cx="32" cy="87" r="2" fill="#64748b"/><circle cx="88" cy="87" r="2" fill="#64748b"/>' +
      '<circle cx="41" cy="73" r="3" fill="#f472b6" opacity=".7"/><circle cx="79" cy="73" r="3" fill="#f472b6" opacity=".7"/>' };
  C.ufok = { name: 'Zyzio', kind: 'ufok', sound: 'Zyg-zyg!', bg: '#dcfce7', face: { ey: 60, ex: 14, my: 85, big: true, ink: '#14321f' },
    draw: () => '<path d="M46 32 L38 13 M74 32 L82 13" stroke="#4ade80" stroke-width="3" stroke-linecap="round"/><circle cx="37" cy="11" r="5" fill="#facc15"/><circle cx="83" cy="11" r="5" fill="#facc15"/>' +
      '<path d="M24 120 Q28 98 60 97 Q92 98 96 120 Z" fill="#a78bfa"/><path d="M48 104 L60 112 L72 104" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/>' +
      '<path d="M60 26 Q94 28 92 64 Q90 96 60 98 Q30 96 28 64 Q26 28 60 26 Z" fill="#86efac"/><circle cx="42" cy="40" r="2.5" fill="#4ade80"/><circle cx="80" cy="44" r="3" fill="#4ade80"/>' };
  const ORDER = ['swinka', 'maine', 'dalmatynczyk', 'rudy', 'bernenczyk', 'robot', 'ufok'];
  const DEF_ID = 'swinka';

  function svg(id, st, size, label) {
    const h = C[id] || C[DEF_ID]; st = st || 'idle'; const cid = 'hlp' + (++uid);
    return '<svg class="helper hs-' + st + '" viewBox="0 0 120 120" width="' + (size || 72) + '" height="' + (size || 72) + '" role="img" aria-label="' + (label || (h.name + ' – ' + h.kind)) + '">' +
      '<defs><clipPath id="' + cid + '"><circle cx="60" cy="60" r="58"/></clipPath></defs><g clip-path="url(#' + cid + ')"><rect width="120" height="120" fill="' + h.bg + '"/>' +
      h.draw() + face(st, h.face) + '</g>' + extras(st) + '</svg>';
  }
  const LINES = {
    happy: ['Brawo!', 'Super!', 'Tak jest!', 'Ekstra!'],
    party: ['Hurra!', 'Wow, awans!', 'Fantastycznie!'],
    oops: ['Nic się nie stało!', 'Spokojnie, damy radę!', 'Każdy się czasem myli.'],
    think: ['Pomyślmy razem…', 'Mam podpowiedź!', 'Spróbuj tak…']
  };
  function line(id, st) { const h = C[id] || C[DEF_ID]; const L = LINES[st]; if (!L) return ''; const t = L[Math.floor(Math.random() * L.length)]; return st === 'happy' || st === 'party' ? h.sound + ' ' + t : t; }
  MP.helpers = { ORDER, DEF: DEF_ID, C, svg, line, get: (id) => C[id] || C[DEF_ID], id: (id) => (C[id] ? id : DEF_ID) };
})(MP);
