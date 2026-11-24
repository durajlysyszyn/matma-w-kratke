/* gens_c.js — kąty, wielokąty, pola i obwody, bryły, jednostki, skala, czas, prędkość, dane, zadania tekstowe. */
var MP = (typeof window !== 'undefined' ? window : globalThis).MP;
(function (MP) {
  const U = MP.util, { F, red, add, sub, mul, div, eq, fmtF, fmtNum, fmtDecK, fromDec, gcd } = U;
  const SK = MP.SK, def = (id, o) => { o.id = id; SK[id] = o; };
  const N = (n) => F(n, 1), pl = U.pl, money = U.money, fr = (n, d) => '[[' + n + '/' + d + ']]', ds = fmtDecK, dsF = fmtNum;

  // ---------- rysunki geometryczne (SVG, kolory ze zmiennych CSS) ----------
  const svg = (w, h, body, label) => '<svg viewBox="0 0 ' + w + ' ' + h + '" class="vis geo" role="img" aria-label="' + (label || 'rysunek') + '">' + body + '</svg>';
  const txt = (x, y, t, cls) => '<text x="' + x + '" y="' + y + '" class="' + (cls || 'lb') + '" text-anchor="middle" dominant-baseline="middle">' + t + '</text>';
  function angleSvg(deg, label) {
    const w = 260, h = 160, cx = 70, cy = 130, L = 150, rad = deg * Math.PI / 180;
    const x2 = cx + L * Math.cos(-rad) * 0.85, y2 = cy + L * Math.sin(-rad) * 0.85;
    const ar = 34, ax = cx + ar * Math.cos(-rad), ay = cy + ar * Math.sin(-rad);
    let body = '<line x1="' + cx + '" y1="' + cy + '" x2="' + (cx + L) + '" y2="' + cy + '" class="ln"/><line x1="' + cx + '" y1="' + cy + '" x2="' + x2.toFixed(1) + '" y2="' + y2.toFixed(1) + '" class="ln"/>';
    body += deg === 90 ? '<path d="M' + (cx + 18) + ' ' + cy + ' V' + (cy - 18) + ' H' + cx + '" class="arc"/>' : '<path d="M' + (cx + ar) + ' ' + cy + ' A' + ar + ' ' + ar + ' 0 ' + (deg > 180 ? 1 : 0) + ' 0 ' + ax.toFixed(1) + ' ' + ay.toFixed(1) + '" class="arc"/>';
    if (label) body += txt(cx + 52 * Math.cos(-rad / 2), cy + 52 * Math.sin(-rad / 2), label);
    return svg(w, h, body, 'kąt');
  }
  function crossSvg(a, labels) { // dwie przecinające się proste; a – kąt między nimi
    const w = 280, h = 170, cx = 140, cy = 85, L = 130, rad = a * Math.PI / 180;
    let b = '<line x1="' + (cx - L) + '" y1="' + cy + '" x2="' + (cx + L) + '" y2="' + cy + '" class="ln"/>';
    b += '<line x1="' + (cx - L * 0.6 * Math.cos(rad)).toFixed(1) + '" y1="' + (cy + L * 0.6 * Math.sin(rad)).toFixed(1) + '" x2="' + (cx + L * 0.6 * Math.cos(rad)).toFixed(1) + '" y2="' + (cy - L * 0.6 * Math.sin(rad)).toFixed(1) + '" class="ln"/>';
    const pos = [[rad / 2, 30], [(Math.PI + rad) / 2, 30], [Math.PI + rad / 2, 30], [(3 * Math.PI + rad) / 2, 30]];
    labels.forEach((t, i) => { if (t) b += txt((cx + pos[i][1] * 1.4 * Math.cos(pos[i][0])).toFixed(1), (cy - pos[i][1] * 1.4 * Math.sin(pos[i][0])).toFixed(1), t); });
    return svg(w, h, b, 'dwie przecinające się proste');
  }
  function triSvg(labels, kind) {
    const pts = kind === 'iso' ? [[40, 150], [240, 150], [140, 25]] : kind === 'right' ? [[50, 150], [240, 150], [50, 35]] : [[30, 150], [250, 150], [95, 30]];
    let b = '<polygon points="' + pts.map(p => p.join(',')).join(' ') + '" class="shape"/>';
    if (kind === 'right') b += '<path d="M66 150 V134 H50" class="arc"/>';
    if (kind === 'iso') b += '<line x1="85" y1="84" x2="97" y2="92" class="tick"/><line x1="183" y1="92" x2="195" y2="84" class="tick"/>';
    const off = [[28, -12], [-30, -12], [0, 26]];
    labels.forEach((t, i) => { if (t) b += txt(pts[i][0] + off[i][0], pts[i][1] + off[i][1], t); });
    return svg(280, 175, b, 'trójkąt');
  }
  function rectSvg(a, b, la, lb, mode) {
    const sc = 200 / Math.max(a, b * 1.4), W = a * sc, H = b * sc, x0 = 40, y0 = 20;
    let s = '<rect x="' + x0 + '" y="' + y0 + '" width="' + W.toFixed(1) + '" height="' + H.toFixed(1) + '" class="shape"/>';
    s += txt(x0 + W / 2, y0 + H + 16, la) + txt(x0 + W + 26, y0 + H / 2, lb);
    return svg(x0 + W + 70, y0 + H + 34, s, 'prostokąt');
  }
  function paraSvg(base, h, side, kind, lb, lh, ls) {
    const sk = kind === 'rhomb' ? 0 : 50, x0 = 30, y0 = 20, W = 200, H = 110;
    const pts = kind === 'trap' ? [[x0, y0 + H], [x0 + W, y0 + H], [x0 + W - 40, y0], [x0 + 55, y0]] : [[x0, y0 + H], [x0 + W - sk, y0 + H], [x0 + W, y0], [x0 + sk, y0]];
    let s = '<polygon points="' + pts.map(p => p.join(',')).join(' ') + '" class="shape"/>';
    const hx = kind === 'trap' ? x0 + 110 : x0 + sk + 20;
    s += '<line x1="' + hx + '" y1="' + y0 + '" x2="' + hx + '" y2="' + (y0 + H) + '" class="dash"/><path d="M' + hx + ' ' + (y0 + H - 12) + ' h12 v12" class="arc"/>';
    s += txt((pts[0][0] + pts[1][0]) / 2, y0 + H + 16, lb) + txt(hx + 16, y0 + H / 2, lh);
    if (ls) s += kind === 'trap' ? txt((pts[2][0] + pts[3][0]) / 2, y0 - 10, ls) : txt(x0 + sk / 2 - 14, y0 + H / 2, ls);
    return svg(270, 165, s, kind === 'trap' ? 'trapez' : 'równoległobok');
  }
  function lShapeSvg(A, B, c, d) { // duży prostokąt A×B z wyciętym rogiem c×d (prawy górny)
    const sc = 180 / Math.max(A, B), W = A * sc, H = B * sc, cw = c * sc, ch = d * sc, x0 = 40, y0 = 20;
    const p = [[x0, y0], [x0 + W - cw, y0], [x0 + W - cw, y0 + ch], [x0 + W, y0 + ch], [x0 + W, y0 + H], [x0, y0 + H]];
    let s = '<polygon points="' + p.map(q => q.map(v => v.toFixed(1)).join(',')).join(' ') + '" class="shape"/>';
    s += txt(x0 + W / 2, y0 + H + 16, A + ' cm') + txt(x0 - 22, y0 + H / 2, B + ' cm') + txt(x0 + (W - cw) / 2, y0 - 10, (A - c) + ' cm') + txt(x0 + W + 24, y0 + ch + (H - ch) / 2, (B - d) + ' cm');
    return svg(x0 + W + 70, y0 + H + 34, s, 'figura w kształcie litery L');
  }
  function boxSvg(a, b, c) {
    const x0 = 30, y0 = 50, W = 150, H = 90, dx = 50, dy = -35;
    let s = '<polygon points="' + [[x0, y0], [x0 + W, y0], [x0 + W, y0 + H], [x0, y0 + H]].map(p => p.join(',')).join(' ') + '" class="shape"/>';
    s += '<polygon points="' + [[x0, y0], [x0 + dx, y0 + dy], [x0 + W + dx, y0 + dy], [x0 + W, y0]].map(p => p.join(',')).join(' ') + '" class="shape top"/>';
    s += '<polygon points="' + [[x0 + W, y0], [x0 + W + dx, y0 + dy], [x0 + W + dx, y0 + H + dy], [x0 + W, y0 + H]].map(p => p.join(',')).join(' ') + '" class="shape side"/>';
    s += txt(x0 + W / 2, y0 + H + 16, a) + txt(x0 + W + dx / 2 + 16, y0 + H + dy / 2 + 12, b) + txt(x0 - 18, y0 + H / 2, c);
    return svg(270, 165, s, 'prostopadłościan');
  }
  function barChart(labels, vals, unitLbl) {
    const W = 320, H = 190, x0 = 40, y0 = 15, ch = 140, max = Math.max(...vals), step = max <= 10 ? 2 : max <= 25 ? 5 : 10, top = Math.ceil(max / step) * step, bw = (W - x0 - 10) / vals.length;
    let s = '';
    for (let v = 0; v <= top; v += step) { const y = y0 + ch - v / top * ch; s += '<line x1="' + x0 + '" y1="' + y + '" x2="' + (W - 6) + '" y2="' + y + '" class="grid"/>' + '<text x="' + (x0 - 6) + '" y="' + y + '" class="ax" text-anchor="end" dominant-baseline="middle">' + v + '</text>'; }
    vals.forEach((v, i) => { const h = v / top * ch, x = x0 + i * bw + bw * 0.18; s += '<rect x="' + x.toFixed(1) + '" y="' + (y0 + ch - h).toFixed(1) + '" width="' + (bw * 0.64).toFixed(1) + '" height="' + h.toFixed(1) + '" class="barc"/>' + '<text x="' + (x + bw * 0.32).toFixed(1) + '" y="' + (y0 + ch + 14) + '" class="ax" text-anchor="middle">' + labels[i] + '</text>'; });
    return svg(W, H, s, 'diagram słupkowy: ' + labels.map((l, i) => l + ' ' + vals[i]).join(', '));
  }
  MP.draw.angleSvg = angleSvg;

  // ===================== KĄTY =====================
  def('ang_type', {
    name: 'Rodzaje kątów', grade: 4, mainCode: 'ang_type',
    types: { 1: ['choice'], 2: ['choice'], 3: ['choice'] },
    gen(r, d) {
      const kinds = ['ostry', 'prosty', 'rozwarty', 'półpełny'];
      const k = r.int(0, 3); const deg = k === 0 ? r.int(15, 80) : k === 1 ? 90 : k === 2 ? r.int(100, 170) : 180;
      const opts = kinds.map((t, i) => ({ label: t, ok: i === k, code: 'ang_type' }));
      const showDeg = d >= 2;
      return { type: 'choice', prompt: showDeg ? 'Kąt ma miarę <b>' + deg + '°</b>. Jaki to kąt?' : 'Jaki kąt jest na rysunku?', visual: d === 1 || d === 3 ? angleSvg(deg, d === 3 ? '' : '') : null, options: opts, answer: { kind: 'choice', correct: k },
        hints: ['Porównaj kąt z kątem prostym (90°) – jak róg kartki.', 'Ostry < 90°, prosty = 90°, rozwarty – między 90° a 180°, półpełny = 180° (prosta linia).', showDeg ? deg + '° jest ' + (deg < 90 ? 'mniejsze' : deg === 90 ? 'równe' : 'większe') + ' od 90°.' : 'Przyłóż róg kartki do wierzchołka kąta.'],
        sol: [deg + '° → kąt ' + kinds[k]] };
    }
  });

  def('ang_pairs', {
    name: 'Kąty przyległe i wierzchołkowe', grade: 5, mainCode: 'ang_adj_vert', prereq: ['ang_type'],
    types: { 1: ['input', 'choice'], 2: ['input', 'choice'], 3: ['input', 'choice'] },
    gen(r, d) {
      const a = r.int(25, 85), adj = d === 1 || (d === 3 && r.chance(0.5));
      const v = adj ? 180 - a : a;
      const lab = adj ? ['α = ' + a + '°', 'β = ?', '', ''] : ['α = ' + a + '°', '', 'β = ?', ''];
      const prompt = (adj ? 'Kąty α i β są <b>przyległe</b>.' : 'Kąty α i β są <b>wierzchołkowe</b>.') + ' Kąt α = ' + a + '°. Oblicz miarę kąta β.';
      const wrong = adj ? [{ v: N(a), code: 'ang_adj_vert' }, { v: N(90 - a), code: 'ang_90' }, { v: N(360 - a), code: 'concept' }] : [{ v: N(180 - a), code: 'ang_adj_vert' }, { v: N(90 - a), code: 'ang_90' }];
      return { prompt: d === 3 ? 'Na rysunku są dwie przecinające się proste. Kąt α = ' + a + '°. Oblicz miarę kąta β.' : prompt, visual: crossSvg(a, lab), value: N(v), wrong, unit: '°', unknownCode: 'ang_adj_vert',
        hints: [adj ? 'Kąty przyległe leżą obok siebie i razem tworzą kąt półpełny.' : 'Kąty wierzchołkowe leżą naprzeciw siebie.', adj ? 'α + β = 180°.' : 'Kąty wierzchołkowe są równe.', adj ? 'β = 180° − ' + a + '°.' : 'β = α.'],
        sol: [adj ? 'β = 180° − ' + a + '° = ' + v + '°' : 'β = α = ' + a + '°'] };
    },
    why: [{ q: 'Dlaczego kąty przyległe zawsze dają razem 180°?', opts: [{ t: 'Bo razem tworzą prostą linię – kąt półpełny', ok: true }, { t: 'Bo są równe', code: 'ang_adj_vert' }, { t: 'Bo razem tworzą kąt prosty', code: 'ang_90' }], expl: 'Dwa kąty przyległe mają wspólne ramię, a pozostałe ramiona tworzą jedną prostą – to kąt półpełny, 180°.' }]
  });

  def('ang_triangle', {
    name: 'Suma kątów w trójkącie', grade: 5, mainCode: 'ang_sum_360', prereq: ['ang_pairs'],
    types: { 1: ['input', 'choice'], 2: ['input', 'choice'], 3: ['input', 'choice'] },
    gen(r, d) {
      if (d === 1) {
        const a = r.int(30, 80), b = r.int(30, 150 - a - 10), c = 180 - a - b;
        return { prompt: 'Dwa kąty trójkąta mają miary ' + a + '° i ' + b + '°. Oblicz miarę trzeciego kąta.', visual: triSvg([a + '°', b + '°', '?'], 'any'), value: N(c), unit: '°', wrong: [{ v: N(360 - a - b), code: 'ang_sum_360' }, { v: N(a + b), code: 'concept' }],
          hints: ['Suma kątów w każdym trójkącie wynosi 180°.', 'Dodaj znane kąty: ' + a + '° + ' + b + '° = ' + (a + b) + '°.', 'Ile brakuje do 180°?'], sol: [a + '° + ' + b + '° = ' + (a + b) + '°', '180° − ' + (a + b) + '° = ' + c + '°'] };
      }
      if (d === 2) {
        const top = 2 * r.int(15, 60), base = (180 - top) / 2;
        return { prompt: 'Trójkąt jest <b>równoramienny</b>. Kąt między ramionami ma ' + top + '°. Oblicz miarę kąta przy podstawie.', visual: triSvg(['?', '', top + '°'], 'iso'), value: N(base), unit: '°', wrong: [{ v: N(180 - top), code: 'ang_iso' }, { v: N(top), code: 'ang_iso' }, { v: N((360 - top) / 2), code: 'ang_sum_360' }],
          hints: ['W trójkącie równoramiennym kąty przy podstawie są równe.', 'Na dwa kąty przy podstawie zostaje 180° − ' + top + '° = ' + (180 - top) + '°.', 'Podziel to na 2.'], sol: ['180° − ' + top + '° = ' + (180 - top) + '°', (180 - top) + '° : 2 = ' + base + '°'] };
      }
      const right = r.chance(0.5);
      if (right) { const a = r.int(20, 70); return { prompt: 'W trójkącie prostokątnym jeden z kątów ostrych ma ' + a + '°. Oblicz drugi kąt ostry.', visual: triSvg(['', a + '°', '?'], 'right'), value: N(90 - a), unit: '°', wrong: [{ v: N(180 - a), code: 'concept' }, { v: N(270 - a), code: 'ang_sum_360' }], hints: ['Jeden kąt trójkąta prostokątnego ma 90°.', 'Na dwa pozostałe kąty zostaje 180° − 90° = 90°.', '90° − ' + a + '° = ?'], sol: ['180° − 90° − ' + a + '° = ' + (90 - a) + '°'] }; }
      const base = r.int(35, 75), top = 180 - 2 * base;
      return { prompt: 'W trójkącie równoramiennym kąt przy podstawie ma ' + base + '°. Oblicz kąt między ramionami.', visual: triSvg([base + '°', '', '?'], 'iso'), value: N(top), unit: '°', wrong: [{ v: N(180 - base), code: 'ang_iso' }, { v: N(base), code: 'ang_iso' }],
        hints: ['Dwa kąty przy podstawie są równe – oba mają ' + base + '°.', 'Razem dają ' + 2 * base + '°.', '180° − ' + 2 * base + '° = ?'], sol: [base + '° + ' + base + '° = ' + 2 * base + '°', '180° − ' + 2 * base + '° = ' + top + '°'] };
    }
  });

  def('tri_ineq', {
    name: 'Nierówność trójkąta i rodzaje trójkątów', grade: 5, mainCode: 'tri_ineq',
    types: { 1: ['choice'], 2: ['choice'], 3: ['choice'] },
    gen(r, d) {
      if (d === 3) {
        const a = r.int(3, 8), b = r.int(a + 2, a + 7), ok = r.int(b - a + 1, a + b - 1);
        const opts = r.shuffle([{ label: ok + ' cm', ok: true }, { label: (a + b) + ' cm', code: 'tri_ineq_eq' }, { label: (b - a) + ' cm', code: 'tri_ineq_eq' }, { label: (a + b + 3) + ' cm', code: 'tri_ineq' }]);
        return { type: 'choice', prompt: 'Dwa boki trójkąta mają ' + a + ' cm i ' + b + ' cm. Jaką długość może mieć trzeci bok?', options: opts, answer: { kind: 'choice', correct: opts.findIndex(o => o.ok) },
          hints: ['Każde dwa boki razem muszą być dłuższe od trzeciego.', 'Trzeci bok musi być krótszy niż ' + a + ' + ' + b + ' = ' + (a + b) + ' cm…', '…i dłuższy niż ' + b + ' − ' + a + ' = ' + (b - a) + ' cm.'], sol: ['Trzeci bok musi być między ' + (b - a) + ' cm a ' + (a + b) + ' cm (bez tych końców).', 'Pasuje: ' + ok + ' cm.'] };
      }
      let s; const yes = r.chance(0.5);
      if (yes) { const a = r.int(3, 9), b = r.int(3, 9); s = [a, b, r.int(Math.abs(a - b) + 1, a + b - 1)]; }
      else if (d === 2) { const a = r.int(2, 7), b = r.int(2, 7); s = [a, b, a + b]; }
      else { const a = r.int(2, 5), b = r.int(2, 5); s = [a, b, a + b + r.int(1, 5)]; }
      s = r.shuffle(s);
      const mx = Math.max(...s), rest = s.reduce((x, y) => x + y, 0) - mx;
      const code = rest === mx ? 'tri_ineq_eq' : 'tri_ineq';
      return { type: 'choice', prompt: 'Czy z odcinków o długościach ' + s.join(' cm, ') + ' cm można zbudować trójkąt?', options: [{ label: 'Tak', ok: yes, code: yes ? null : code }, { label: 'Nie', ok: !yes, code: yes ? 'tri_ineq' : null }], answer: { kind: 'choice', correct: yes ? 0 : 1 },
        hints: ['Wystarczy sprawdzić najdłuższy odcinek.', 'Czy dwa krótsze odcinki razem są DŁUŻSZE od najdłuższego?', rest + ' cm porównaj z ' + mx + ' cm.'], sol: ['Dwa krótsze: ' + rest + ' cm, najdłuższy: ' + mx + ' cm', rest > mx ? rest + ' > ' + mx + ' → trójkąt powstanie.' : rest + (rest === mx ? ' = ' : ' < ') + mx + ' → trójkąt nie powstanie.'] };
    }
  });

  def('circ_parts', {
    name: 'Koło i okrąg: promień, średnica, cięciwa', grade: 4, mainCode: 'circ_rd',
    types: { 1: ['input', 'choice'], 2: ['input', 'choice'], 3: ['input', 'choice'] },
    gen(r, d) {
      if (d === 3) { const dd = r.pick([40, 50, 60, 70]); return { prompt: 'Koło roweru ma średnicę ' + dd + ' cm. Ile decymetrów ma jego promień?', value: N(dd / 20), unit: 'dm', wrong: [{ v: N(dd / 2), code: 'units' }, { v: N(dd / 10), code: 'circ_rd' }, { v: N(dd * 2 / 10), code: 'circ_rd' }], hints: ['Promień to połowa średnicy.', 'Promień = ' + dd + ' cm : 2 = ' + dd / 2 + ' cm.', '1 dm = 10 cm.'], sol: ['r = ' + dd + ' : 2 = ' + dd / 2 + ' cm', dd / 2 + ' cm = ' + dd / 20 + ' dm'] }; }
      const rr = r.int(2, 25), toD = d === 1 || r.chance(0.5);
      return { prompt: toD ? 'Promień okręgu ma ' + rr + ' cm. Ile ma średnica?' : 'Średnica koła ma ' + 2 * rr + ' cm. Ile ma promień?', value: N(toD ? 2 * rr : rr), unit: 'cm', wrong: [{ v: N(toD ? rr / 2 : 4 * rr), code: 'circ_rd' }, { v: N(toD ? rr : 2 * rr), code: 'circ_rd' }].filter(w => Number.isInteger(w.v.n / w.v.d)),
        hints: ['Promień łączy środek z okręgiem. Średnica przechodzi przez środek od brzegu do brzegu.', 'Średnica to dwa promienie.', toD ? '2 · ' + rr + ' = ?' : 2 * rr + ' : 2 = ?'], sol: [toD ? 'd = 2 · r = ' + 2 * rr + ' cm' : 'r = d : 2 = ' + rr + ' cm'] };
    }
  });

  // ===================== OBWODY I POLA =====================
  def('perim', {
    name: 'Obwody wielokątów', grade: 4, mainCode: 'area_perim',
    types: { 1: ['input', 'choice'], 2: ['input', 'choice'], 3: ['input', 'choice'] },
    gen(r, d) {
      if (d === 3) {
        const a = r.int(3, 12), b = r.int(3, 15), P = 2 * (a + b);
        return { prompt: 'Obwód prostokąta wynosi ' + P + ' cm. Jeden bok ma ' + a + ' cm. Ile ma drugi bok?', value: N(b), unit: 'cm', wrong: [{ v: N(P - a), code: 'perim_inverse' }, { v: N(P - 2 * a), code: 'perim_inverse' }, { v: red(F(P, a)), code: 'area_perim' }],
          hints: ['Prostokąt ma dwa boki po ' + a + ' cm i dwa boki nieznane.', 'Dwa boki po ' + a + ' cm to razem ' + 2 * a + ' cm. Na dwa pozostałe boki zostaje ' + P + ' − ' + 2 * a + ' = ' + (P - 2 * a) + ' cm.', 'Podziel to na 2.'],
          sol: ['2 · ' + a + ' = ' + 2 * a, P + ' − ' + 2 * a + ' = ' + (P - 2 * a), (P - 2 * a) + ' : 2 = ' + b + ' cm'], visual: rectSvg(a, b, a + ' cm', '?') };
      }
      if (d === 2 && r.chance(0.5)) {
        const s = [r.int(3, 9), r.int(3, 9), r.int(3, 9)]; const mx = Math.max(...s); const rest = s[0] + s[1] + s[2] - mx; if (rest <= mx) s[s.indexOf(mx)] = rest - 1;
        const P = s[0] + s[1] + s[2];
        return { prompt: 'Trójkąt ma boki ' + s.join(' cm, ') + ' cm. Oblicz jego obwód.', visual: triSvg([], 'any'), value: N(P), unit: 'cm', wrong: [{ v: N(s[0] * s[1]), code: 'area_perim' }, { v: N(P - 1), code: 'calc' }], hints: ['Obwód to suma długości wszystkich boków.', 'Dodaj trzy boki.', s.join(' + ') + ' = ?'], sol: [s.join(' + ') + ' = ' + P + ' cm'] };
      }
      const sq = d === 2 && r.chance(0.5); const a = r.int(2, 15), b = sq ? a : r.int(2, 15);
      const P = 2 * (a + b);
      return { prompt: sq ? 'Kwadrat ma bok ' + a + ' cm. Oblicz jego obwód.' : 'Prostokąt ma boki ' + a + ' cm i ' + b + ' cm. Oblicz jego obwód.', visual: rectSvg(a, b, a + ' cm', b + ' cm'), value: N(P), unit: 'cm', wrong: [{ v: N(a * b), code: 'area_perim' }, { v: N(a + b), code: 'perim_half' }, { v: N(2 * a + b), code: 'calc' }],
        hints: ['Obwód to długość wszystkich boków dookoła figury.', 'Prostokąt ma 4 boki: ' + a + ', ' + b + ', ' + a + ', ' + b + '.', a + ' + ' + b + ' + ' + a + ' + ' + b + ' = ?'], sol: [a + ' + ' + b + ' + ' + a + ' + ' + b + ' = ' + P + ' cm'] };
    }
  });

  def('area_rect', {
    name: 'Pole prostokąta i kwadratu', grade: 4, mainCode: 'area_perim', prereq: ['tabl', 'perim'],
    types: { 1: ['input', 'choice'], 2: ['input', 'choice'], 3: ['input', 'choice'] },
    gen(r, d) {
      if (d === 3) {
        const A = r.int(8, 14), B = r.int(6, 12), c = r.int(2, A - 4), dd = r.int(2, B - 3);
        const P = A * B - c * dd;
        return { prompt: 'Oblicz pole figury z rysunku.', visual: lShapeSvg(A, B, c, dd), value: N(P), unit: 'cm²', wrong: [{ v: N(A * B), code: 'area_compound' }, { v: N(2 * (A + B)), code: 'area_perim' }, { v: N(A * B - c - dd), code: 'calc' }],
          hints: ['Figurę możesz potraktować jak duży prostokąt z wyciętym rogiem.', 'Duży prostokąt: ' + A + ' · ' + B + ' = ' + A * B + ' cm². Jakie wymiary ma wycięty róg?', 'Wycięty róg: ' + c + ' cm na ' + dd + ' cm.'],
          sol: ['Duży prostokąt: ' + A + ' · ' + B + ' = ' + A * B + ' cm²', 'Wycięty kawałek: ' + c + ' · ' + dd + ' = ' + c * dd + ' cm²', A * B + ' − ' + c * dd + ' = ' + P + ' cm²'] };
      }
      const sq = d === 2 && r.chance(0.5); const a = r.int(2, 12), b = sq ? a : r.int(2, 12);
      if (d === 2 && !sq) { const P = a * b; return { prompt: 'Prostokąt ma pole ' + P + ' cm². Jeden bok ma ' + a + ' cm. Ile ma drugi bok?', visual: rectSvg(a, b, a + ' cm', '?'), value: N(b), unit: 'cm', wrong: [{ v: N(P - a), code: 'concept' }, { v: N(P / 2 - a), code: 'area_perim' }].filter(w => w.v.n > 0), hints: ['Pole = bok · bok.', a + ' · □ = ' + P + '.', P + ' : ' + a + ' = ?'], sol: [P + ' : ' + a + ' = ' + b + ' cm'] }; }
      const P = a * b;
      return { prompt: sq ? 'Oblicz pole kwadratu o boku ' + a + ' cm.' : 'Oblicz pole prostokąta o bokach ' + a + ' cm i ' + b + ' cm.', visual: rectSvg(a, b, a + ' cm', b + ' cm'), value: N(P), unit: 'cm²', wrong: [{ v: N(2 * (a + b)), code: 'area_perim' }, { v: N(a + b), code: 'area_perim' }, { v: N(sq ? 4 * a : a * (b + 1)), code: sq ? 'area_perim' : 'calc' }],
        hints: ['Pole to liczba kwadracików 1 cm × 1 cm, które zmieszczą się w figurze.', 'W jednym rzędzie mieści się ' + a + ' kwadracików, a rzędów jest ' + b + '.', 'Pole = ' + a + ' · ' + b + '.'], sol: ['P = ' + a + ' · ' + b + ' = ' + P + ' cm²'] };
    },
    why: [{ q: 'Prostokąt 3 cm × 4 cm. Co jest prawdą?', opts: [{ t: 'Pole = 12 cm², obwód = 14 cm', ok: true }, { t: 'Pole = 14 cm², obwód = 12 cm', code: 'area_perim' }, { t: 'Pole i obwód to to samo', code: 'area_perim' }], expl: 'Pole: 3 · 4 = 12 cm². Obwód: 3 + 4 + 3 + 4 = 14 cm. Jednostki też są różne!' }]
  });

  def('area_tri', {
    name: 'Pole trójkąta', grade: 5, mainCode: 'tri_no_half', prereq: ['area_rect'],
    types: { 1: ['input', 'choice'], 2: ['input', 'choice', 'error'], 3: ['input', 'choice'] },
    gen(r, d) {
      if (d === 3) {
        const a = r.int(3, 12), h = 2 * r.int(2, 8) / (a % 2 ? 1 : 1), P = a * h / 2;
        return { prompt: 'Pole trójkąta wynosi ' + P + ' cm², a jego podstawa ma ' + a + ' cm. Oblicz wysokość opuszczoną na tę podstawę.', value: N(h), unit: 'cm', wrong: [{ v: red(F(P, a)), code: 'tri_no_half' }, { v: N(P - a), code: 'concept' }].filter(w => w.v.n > 0),
          hints: ['Wzór: P = a · h : 2.', 'Najpierw pomnóż pole przez 2: ' + P + ' · 2 = ' + 2 * P + '. To jest a · h.', 'Teraz ' + 2 * P + ' : ' + a + '.'], sol: ['a · h = 2 · P = ' + 2 * P, 'h = ' + 2 * P + ' : ' + a + ' = ' + h + ' cm'] };
      }
      const a = r.int(3, 14), h = r.int(2, 12); if ((a * h) % 2) return this.gen(r, d);
      const side = h + r.int(1, 4), P = a * h / 2, right = d === 1;
      return { prompt: right ? 'Trójkąt prostokątny ma przyprostokątne ' + a + ' cm i ' + h + ' cm. Oblicz jego pole.' : 'Trójkąt ma podstawę ' + a + ' cm, wysokość ' + h + ' cm i bok skośny ' + side + ' cm. Oblicz jego pole.',
        visual: right ? triSvg(['', '', ''], 'right') : paraSvg(0, 0, 0, 'tri'), value: N(P), unit: 'cm²', wrong: [{ v: N(a * h), code: 'tri_no_half' }].concat(right ? [{ v: N(a + h), code: 'area_perim' }] : [{ v: red(F(a * side, 2)), code: 'area_side_not_h' }, { v: N(a * side), code: 'area_side_not_h' }]),
        errorVersion: { steps: ['P = a · h', 'P = ' + a + ' · ' + h + ' = ' + a * h + ' cm²'], wrongIdx: 0, code: 'tri_no_half', why: 'Wzór na pole trójkąta to P = a · h : 2 – zapomniano podzielić przez 2.' },
        hints: ['Trójkąt to połowa prostokąta (lub równoległoboku) o tej samej podstawie i wysokości.', 'Wzór: P = a · h : 2' + (right ? '. W trójkącie prostokątnym jedna przyprostokątna jest wysokością dla drugiej.' : '. Potrzebujesz wysokości, nie boku skośnego.'), a + ' · ' + h + ' = ' + a * h + '. Teraz podziel przez 2.'],
        sol: ['P = ' + a + ' · ' + h + ' : 2', '= ' + a * h + ' : 2 = ' + P + ' cm²'] };
    },
    why: [{ q: 'Dlaczego we wzorze na pole trójkąta dzielimy przez 2?', opts: [{ t: 'Bo trójkąt to połowa prostokąta o tej samej podstawie i wysokości', ok: true }, { t: 'Bo trójkąt ma 3 boki', code: 'concept' }, { t: 'Nie dzielimy – P = a · h', code: 'tri_no_half' }], expl: 'Przetnij prostokąt po przekątnej – powstaną dwa jednakowe trójkąty. Każdy ma połowę pola.' }]
  });

  // paraSvg dla trójkąta – prosty kształt
  const _para = paraSvg;
  function paraOrTri(base, h, side, kind, lb, lh, ls) {
    if (kind === 'tri') {
      const pts = [[30, 140], [240, 140], [90, 25]];
      return svg(280, 165, '<polygon points="' + pts.map(p => p.join(',')).join(' ') + '" class="shape"/><line x1="90" y1="25" x2="90" y2="140" class="dash"/><path d="M90 128 h12 v12" class="arc"/>', 'trójkąt z wysokością');
    }
    return _para(base, h, side, kind, lb, lh, ls);
  }
  paraSvg = paraOrTri; // eslint-disable-line no-func-assign

  def('area_para', {
    name: 'Pole równoległoboku i rombu', grade: 5, mainCode: 'area_side_not_h', prereq: ['area_rect'],
    types: { 1: ['input', 'choice'], 2: ['input', 'choice'], 3: ['input', 'choice'] },
    gen(r, d) {
      const rhomb = d === 3 || (d === 2 && r.chance(0.5));
      if (rhomb) {
        const e = 2 * r.int(2, 9), f = r.int(3, 14), P = e * f / 2;
        return { prompt: 'Romb ma przekątne długości ' + e + ' cm i ' + f + ' cm. Oblicz jego pole.', value: N(P), unit: 'cm²', wrong: [{ v: N(e * f), code: 'tri_no_half' }, { v: N(e + f), code: 'area_perim' }],
          hints: ['Pole rombu możesz policzyć z przekątnych.', 'Wzór: P = e · f : 2.', e + ' · ' + f + ' = ' + e * f + '. Teraz podziel przez 2.'], sol: ['P = ' + e + ' · ' + f + ' : 2 = ' + P + ' cm²'] };
      }
      const a = r.int(4, 14), h = r.int(2, 10), side = h + r.int(1, 4);
      return { prompt: 'Równoległobok ma podstawę ' + a + ' cm, wysokość ' + h + ' cm i bok ' + side + ' cm. Oblicz jego pole.', visual: _para(a, h, side, 'para', a + ' cm', 'h = ' + h + ' cm', side + ' cm'), value: N(a * h), unit: 'cm²',
        wrong: [{ v: N(a * side), code: 'area_side_not_h' }, { v: red(F(a * h, 2)), code: 'tri_no_half' }, { v: N(2 * (a + side)), code: 'area_perim' }],
        hints: ['Równoległobok można „przestawić" w prostokąt: odetnij trójkąt z jednej strony i dołóż z drugiej.', 'Wzór: P = a · h (podstawa razy wysokość).', 'Wysokość to przerywana linia: ' + h + ' cm. Bok ' + side + ' cm nie jest potrzebny.'],
        sol: ['P = a · h = ' + a + ' · ' + h + ' = ' + a * h + ' cm²'] };
    }
  });

  def('area_trap', {
    name: 'Pole trapezu', grade: 5, mainCode: 'trap_formula', prereq: ['area_tri', 'area_para'],
    types: { 1: ['input', 'choice'], 2: ['input', 'choice'], 3: ['input', 'choice'] },
    gen(r, d) {
      let a = r.int(6, 16), b = r.int(2, a - 2), h = r.int(2, 10); if (((a + b) * h) % 2) h++;
      const P = (a + b) * h / 2;
      if (d === 3) {
        return { prompt: 'Działka ma kształt trapezu o podstawach ' + a + ' m i ' + b + ' m. Jej pole to ' + P + ' m². Jaka jest wysokość tego trapezu?', value: N(h), unit: 'm', wrong: [{ v: red(F(P, a + b)), code: 'trap_formula' }, { v: red(F(2 * P, a * b)), code: 'trap_formula' }].filter(w => w.v.n > 0),
          hints: ['Wzór: P = (a + b) · h : 2.', 'Suma podstaw: ' + a + ' + ' + b + ' = ' + (a + b) + '. Podwojone pole: ' + 2 * P + '.', (a + b) + ' · h = ' + 2 * P + ', więc h = ' + 2 * P + ' : ' + (a + b) + '.'], sol: ['(a + b) · h = 2 · P = ' + 2 * P, 'h = ' + 2 * P + ' : ' + (a + b) + ' = ' + h + ' m'] };
      }
      return { prompt: 'Trapez ma podstawy ' + a + ' cm i ' + b + ' cm oraz wysokość ' + h + ' cm. Oblicz jego pole.', visual: _para(a, h, 0, 'trap', a + ' cm', 'h = ' + h + ' cm', b + ' cm'), value: N(P), unit: 'cm²',
        wrong: [{ v: N((a + b) * h), code: 'tri_no_half' }, { v: red(F(a * b * h, 2)), code: 'trap_formula' }, { v: N(a * h), code: 'trap_formula' }],
        hints: ['Dwa takie same trapezy złożone razem tworzą równoległobok o podstawie a + b.', 'Wzór: P = (a + b) · h : 2.', '(' + a + ' + ' + b + ') · ' + h + ' = ' + (a + b) * h + '. Teraz podziel przez 2.'],
        sol: ['P = (' + a + ' + ' + b + ') · ' + h + ' : 2', '= ' + (a + b) + ' · ' + h + ' : 2 = ' + (a + b) * h + ' : 2 = ' + P + ' cm²'] };
    }
  });

  def('area_units', {
    name: 'Jednostki pola (mm², cm², m², ar, hektar)', grade: 5, mainCode: 'area_units_100', prereq: ['area_rect', 'units_len'],
    types: { 1: ['input', 'choice'], 2: ['input', 'choice'], 3: ['input', 'choice'] },
    gen(r, d) {
      const T = d === 1 ? r.pick([['m²', 'cm²', 10000, 100], ['cm²', 'mm²', 100, 10], ['dm²', 'cm²', 100, 10]]) : d === 2 ? r.pick([['a', 'm²', 100, 10], ['ha', 'm²', 10000, 100], ['m²', 'dm²', 100, 10], ['ha', 'a', 100, 10]]) : r.pick([['m²', 'cm²', 10000, 100], ['ha', 'm²', 10000, 100], ['km²', 'ha', 100, 10]]);
      const k = r.int(2, 9);
      return { prompt: k + ' ' + T[0] + ' = □ ' + T[1], fill: true, value: N(k * T[2]), wrong: [{ v: N(k * T[3]), code: 'area_units_100' }, { v: N(k * T[2] * 10), code: 'units_factor' }],
        hints: ['Jednostki pola to kwadraty. Pomyśl, ile małych kwadratów mieści się w dużym.', T[0] === 'm²' ? '1 m = 100 cm, więc 1 m² = 100 · 100 cm².' : T[0] === 'ha' && T[1] === 'm²' ? '1 ha to kwadrat 100 m × 100 m.' : T[0] === 'a' ? '1 ar to kwadrat 10 m × 10 m.' : 'Bok dużego kwadratu to 10 boków małego.', '1 ' + T[0] + ' = ' + T[2].toLocaleString('pl-PL') + ' ' + T[1] + '.'],
        sol: ['1 ' + T[0] + ' = ' + T[2].toLocaleString('pl-PL') + ' ' + T[1], k + ' ' + T[0] + ' = ' + (k * T[2]).toLocaleString('pl-PL') + ' ' + T[1]], fmt: (v) => (v.n / v.d).toLocaleString('pl-PL') };
    }
  });

  // ===================== BRYŁY =====================
  def('vol_box', {
    name: 'Objętość prostopadłościanu i sześcianu', grade: 5, mainCode: 'vol_surf', prereq: ['area_rect', 'pow_nat'],
    types: { 1: ['input', 'choice'], 2: ['input', 'choice'], 3: ['input', 'choice'] },
    gen(r, d) {
      if (d === 3) {
        const a = r.pick([20, 30, 40, 50]), b = r.pick([20, 30, 40]), c = r.pick([10, 20, 30, 50]), V = a * b * c;
        return { prompt: 'Akwarium ma wymiary ' + a + ' cm × ' + b + ' cm × ' + c + ' cm. Ile litrów wody zmieści? (1 l = 1 dm³)', visual: boxSvg(a + ' cm', b + ' cm', c + ' cm'), value: N(V / 1000), unit: 'l', wrong: [{ v: N(V), code: 'units' }, { v: N(V / 100), code: 'units_factor' }],
          hints: ['Zamień wymiary na decymetry: 10 cm = 1 dm.', a + ' cm = ' + a / 10 + ' dm, ' + b + ' cm = ' + b / 10 + ' dm, ' + c + ' cm = ' + c / 10 + ' dm.', 'Objętość = ' + a / 10 + ' · ' + b / 10 + ' · ' + c / 10 + ' dm³ = tyle samo litrów.'],
          sol: [a / 10 + ' · ' + b / 10 + ' · ' + c / 10 + ' = ' + V / 1000 + ' dm³', V / 1000 + ' dm³ = ' + V / 1000 + ' l'] };
      }
      const cube = d === 2 && r.chance(0.5); const a = r.int(2, 10), b = cube ? a : r.int(2, 8), c = cube ? a : r.int(2, 8), V = a * b * c;
      return { prompt: cube ? 'Oblicz objętość sześcianu o krawędzi ' + a + ' cm.' : 'Oblicz objętość prostopadłościanu o wymiarach ' + a + ' cm, ' + b + ' cm i ' + c + ' cm.', visual: boxSvg(a + ' cm', b + ' cm', c + ' cm'), value: N(V), unit: 'cm³',
        wrong: [{ v: N(2 * (a * b + b * c + a * c)), code: 'vol_surf' }, { v: N(a + b + c), code: 'concept' }, { v: N(cube ? 3 * a : a * b), code: cube ? 'pow_mult' : 'concept' }],
        hints: ['Objętość to liczba sześcianików 1 cm × 1 cm × 1 cm, które zmieszczą się w środku.', 'Na dnie mieści się ' + a + ' · ' + b + ' = ' + a * b + ' sześcianików, a warstw jest ' + c + '.', 'V = ' + a + ' · ' + b + ' · ' + c + '.'], sol: ['V = ' + a + ' · ' + b + ' · ' + c + ' = ' + V + ' cm³'] };
    }
  });

  def('surf_box', {
    name: 'Pole powierzchni prostopadłościanu', grade: 5, mainCode: 'surf_half', prereq: ['area_rect'],
    types: { 1: ['input', 'choice'], 2: ['input', 'choice'], 3: ['input', 'choice'] },
    gen(r, d) {
      const cube = d === 2; const a = r.int(2, 9), b = cube ? a : r.int(2, 8), c = cube ? a : r.int(2, 8);
      const full = 2 * (a * b + a * c + b * c);
      if (d === 3) {
        const P = a * b + 2 * a * c + 2 * b * c;
        return { prompt: 'Pudełko bez pokrywki ma wymiary dna ' + a + ' cm × ' + b + ' cm i wysokość ' + c + ' cm. Ile cm² kartonu potrzeba na jego wykonanie?', visual: boxSvg(a + ' cm', b + ' cm', c + ' cm'), value: N(P), unit: 'cm²', wrong: [{ v: N(full), code: 'read' }, { v: N(a * b * c), code: 'vol_surf' }, { v: N(a * b + a * c + b * c), code: 'surf_half' }],
          hints: ['Pudełko bez pokrywki ma 5 ścian: dno i 4 ściany boczne.', 'Dno: ' + a + ' · ' + b + '. Ściany boczne: dwie po ' + a + ' · ' + c + ' i dwie po ' + b + ' · ' + c + '.', a * b + ' + 2 · ' + a * c + ' + 2 · ' + b * c + ' = ?'], sol: ['Dno: ' + a * b, 'Ściany: 2 · ' + a * c + ' + 2 · ' + b * c + ' = ' + (2 * a * c + 2 * b * c), 'Razem: ' + P + ' cm²'] };
      }
      return { prompt: cube ? 'Oblicz pole powierzchni sześcianu o krawędzi ' + a + ' cm.' : 'Oblicz pole powierzchni prostopadłościanu o wymiarach ' + a + ' cm × ' + b + ' cm × ' + c + ' cm.', visual: boxSvg(a + ' cm', b + ' cm', c + ' cm'), value: N(full), unit: 'cm²',
        wrong: cube ? [{ v: N(4 * a * a), code: 'surf_faces' }, { v: N(a * a * a), code: 'vol_surf' }, { v: N(a * a), code: 'surf_faces' }] : [{ v: N(a * b + a * c + b * c), code: 'surf_half' }, { v: N(a * b * c), code: 'vol_surf' }],
        hints: ['Pole powierzchni to suma pól wszystkich ścian – tyle papieru potrzeba, żeby okleić bryłę.', cube ? 'Sześcian ma 6 jednakowych ścian – kwadratów ' + a + ' × ' + a + '.' : 'Są 3 pary jednakowych ścian: ' + a + '×' + b + ', ' + a + '×' + c + ', ' + b + '×' + c + '.', cube ? '6 · ' + a * a + ' = ?' : '2 · (' + a * b + ' + ' + a * c + ' + ' + b * c + ') = ?'],
        sol: cube ? ['Jedna ściana: ' + a * a + ' cm²', '6 · ' + a * a + ' = ' + full + ' cm²'] : ['Pola ścian: ' + a * b + ', ' + a * c + ', ' + b * c, '2 · (' + a * b + ' + ' + a * c + ' + ' + b * c + ') = ' + full + ' cm²'] };
    }
  });

  // ===================== JEDNOSTKI, CZAS, SKALA =====================
  def('units_len', {
    name: 'Jednostki długości i masy', grade: 4, mainCode: 'units_factor',
    types: { 1: ['input', 'choice'], 2: ['input', 'choice'], 3: ['input', 'choice'] },
    gen(r, d) {
      const T = r.pick([['m', 'cm', 100], ['cm', 'mm', 10], ['km', 'm', 1000], ['kg', 'g', 1000], ['kg', 'dag', 100], ['t', 'kg', 1000], ['dm', 'cm', 10], ['m', 'dm', 10]]);
      if (d === 1) { const k = r.int(2, 30); return { prompt: k + ' ' + T[0] + ' = □ ' + T[1], fill: true, value: N(k * T[2]), wrong: [{ v: N(k * (T[2] === 10 ? 100 : T[2] / 10)), code: 'units_factor' }, { v: red(F(k, T[2])), code: 'units_dir' }], hints: ['Ile ' + T[1] + ' jest w 1 ' + T[0] + '?', '1 ' + T[0] + ' = ' + T[2] + ' ' + T[1] + '.', k + ' · ' + T[2] + ' = ?'], sol: [k + ' · ' + T[2] + ' = ' + k * T[2] + ' ' + T[1]], fmt: (v) => dsF(v) }; }
      if (d === 2) { const k = T[2] * r.int(2, 40); return { prompt: k + ' ' + T[1] + ' = □ ' + T[0], fill: true, value: N(k / T[2]), wrong: [{ v: N(k * T[2]), code: 'units_dir' }, { v: red(F(k, T[2] === 10 ? 100 : T[2] / 10)), code: 'units_factor' }], hints: ['Zamieniasz na WIĘKSZĄ jednostkę – liczba będzie mniejsza.', '1 ' + T[0] + ' = ' + T[2] + ' ' + T[1] + '.', k + ' : ' + T[2] + ' = ?'], sol: [k + ' : ' + T[2] + ' = ' + k / T[2] + ' ' + T[0]], fmt: (v) => dsF(v) }; }
      const k = r.int(11, 99), p = T[2] === 10 ? 1 : T[2] === 100 ? 2 : 3;
      return { prompt: ds(k, 1) + ' ' + T[0] + ' = □ ' + T[1], fill: true, value: mul(fromDec(k, 1), N(T[2])), wrong: [{ v: mul(fromDec(k, 1), N(T[2] / 10 || 1)), code: 'units_factor' }, { v: div(fromDec(k, 1), N(T[2])), code: 'units_dir' }], dec: true,
        hints: ['1 ' + T[0] + ' = ' + T[2] + ' ' + T[1] + '.', 'Pomnóż ' + ds(k, 1) + ' przez ' + T[2] + '.', 'Mnożąc przez ' + T[2] + ', przesuwasz przecinek o ' + p + ' w prawo.'], sol: [ds(k, 1) + ' · ' + T[2] + ' = ' + dsF(mul(fromDec(k, 1), N(T[2]))) + ' ' + T[1]] };
    }
  });

  const hm = (m) => Math.floor(m / 60) + ':' + String(m % 60).padStart(2, '0');
  def('time_calc', {
    name: 'Obliczenia zegarowe i kalendarzowe', grade: 4, mainCode: 'time_base100',
    types: { 1: ['choice', 'input'], 2: ['input', 'choice'], 3: ['input', 'choice'] },
    gen(r, d, type) {
      if (d === 1 || (d === 3 && type === 'choice')) {
        const start = r.int(8 * 60, 18 * 60) + r.pick([0, 5, 10, 15, 30, 40, 45, 50]) % 60, dur = d === 1 ? r.pick([25, 35, 45, 50, 75, 90]) : r.int(70, 170), end = start + dur;
        const wrongEnd = Math.floor(start / 60) * 60 + Math.floor((start % 60 + dur) / 100) * 60 + (start % 60 + dur) % 100;
        const opts = [{ label: hm(end), ok: true }];
        const cand = [[wrongEnd, 'time_base100'], [end - 60, 'calc'], [end + 10, 'calc'], [end + 60, 'calc']];
        for (const c of cand) if (c[0] !== end && !opts.some(o => o.label === hm(c[0])) && c[0] % 60 < 60 && opts.length < 4) opts.push({ label: hm(c[0]), code: c[1] });
        const sh = r.shuffle(opts);
        return { type: 'choice', prompt: 'Film zaczął się o ' + hm(start) + ' i trwał ' + (dur >= 60 ? Math.floor(dur / 60) + ' h ' + (dur % 60 ? dur % 60 + ' min' : '') : dur + ' min') + '. O której się skończył?', options: sh, answer: { kind: 'choice', correct: sh.findIndex(o => o.ok) },
          hints: ['Dodawaj czas kawałkami: najpierw do pełnej godziny.', 'Do pełnej godziny od ' + hm(start) + ' brakuje ' + (60 - start % 60) % 60 + ' min.', 'Pamiętaj: godzina ma 60 minut, nie 100.'], sol: [hm(start) + ' + ' + dur + ' min = ' + hm(end)] };
      }
      if (d === 2) {
        const s = r.int(8 * 60, 15 * 60) + r.pick([10, 20, 35, 40, 45, 50]), e = s + r.int(50, 160);
        const naive = (Math.floor(e / 60) * 100 + e % 60) - (Math.floor(s / 60) * 100 + s % 60);
        return { prompt: 'Ile minut minęło od ' + hm(s) + ' do ' + hm(e) + '?', value: N(e - s), unit: 'min', wrong: naive !== e - s ? [{ v: N(naive), code: 'time_base100' }] : [],
          hints: ['Licz „skokami" przez pełne godziny.', 'Od ' + hm(s) + ' do ' + hm(Math.ceil(s / 60) * 60) + ' jest ' + (Math.ceil(s / 60) * 60 - s) + ' min.', 'Potem policz pełne godziny i resztę minut.'], sol: ['Od ' + hm(s) + ' do ' + hm(Math.ceil(s / 60) * 60) + ': ' + (Math.ceil(s / 60) * 60 - s) + ' min', 'Od ' + hm(Math.ceil(s / 60) * 60) + ' do ' + hm(e) + ': ' + (e - Math.ceil(s / 60) * 60) + ' min', 'Razem: ' + (e - s) + ' min'] };
      }
      const months = [['styczeń', 31], ['luty', 28], ['marzec', 31], ['kwiecień', 30], ['maj', 31], ['czerwiec', 30], ['lipiec', 31], ['sierpień', 31], ['wrzesień', 30], ['październik', 31], ['listopad', 30], ['grudzień', 31]];
      const mi = r.int(0, 10), day = r.int(10, months[mi][1]), add = r.int(8, 20);
      let nd = day + add, nm = mi; if (nd > months[mi][1]) { nd -= months[mi][1]; nm++; }
      const gen2 = ['stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca', 'lipca', 'sierpnia', 'września', 'października', 'listopada', 'grudnia'];
      return { prompt: 'Wycieczka zaczyna się ' + day + ' ' + gen2[mi] + ' i trwa ' + add + ' dni (pierwszy dzień liczymy jako dzień 1). Którego dnia miesiąca jest ostatni dzień wycieczki? (rok nie jest przestępny)', value: N(nd - 1 <= 0 ? months[mi][1] : nd - 1), wrong: [{ v: N(nd), code: 'calc' }, { v: N(day + add - 1), code: 'concept' }],
        hints: ['Ostatni dzień to dzień startu + ' + (add - 1) + ' (bo pierwszy dzień już się liczy).', months[mi][0] + ' ma ' + months[mi][1] + ' dni.', 'Jeśli przekroczysz ' + months[mi][1] + ', przejdź do następnego miesiąca.'],
        sol: [day + ' + ' + (add - 1) + ' = ' + (day + add - 1), (day + add - 1) > months[mi][1] ? (day + add - 1) + ' − ' + months[mi][1] + ' = ' + (day + add - 1 - months[mi][1]) + ' ' + gen2[(mi + 1) % 12] : 'To ' + (day + add - 1) + ' ' + gen2[mi]] };
    }
  });

  def('scale', {
    name: 'Skala i plan', grade: 6, mainCode: 'scale_dir', prereq: ['units_len'],
    types: { 1: ['input', 'choice'], 2: ['input', 'choice'], 3: ['input', 'choice'] },
    gen(r, d) {
      if (d === 1) { const s = r.pick([100, 200, 50, 500]), cm = r.int(2, 12); const real = s * cm / 100; return { prompt: 'Plan pokoju wykonano w skali 1 : ' + s + '. Na planie ściana ma ' + cm + ' cm. Ile metrów ma w rzeczywistości?', value: fromDec(s * cm, 2), dec: true, unit: 'm', wrong: [{ v: N(s * cm), code: 'units' }, { v: red(F(cm, s)), code: 'scale_dir' }], hints: ['Skala 1 : ' + s + ' znaczy: 1 cm na planie to ' + s + ' cm w rzeczywistości.', cm + ' cm na planie to ' + cm + ' · ' + s + ' = ' + s * cm + ' cm.', 'Zamień ' + s * cm + ' cm na metry: 100 cm = 1 m.'], sol: [cm + ' · ' + s + ' = ' + s * cm + ' cm', s * cm + ' cm = ' + dsF(fromDec(s * cm, 2)) + ' m'] }; }
      if (d === 2) { const s = r.pick([10000, 50000, 100000, 200000]), cm = r.int(2, 9); const km = s * cm / 100000; return { prompt: 'Mapa ma skalę 1 : ' + s.toLocaleString('pl-PL') + '. Odległość na mapie to ' + cm + ' cm. Ile to kilometrów w terenie?', value: red(F(s * cm, 100000)), dec: true, unit: 'km', wrong: [{ v: red(F(s * cm, 1000)), code: 'units' }, { v: red(F(s * cm, 100)), code: 'units' }], hints: ['1 cm na mapie = ' + s.toLocaleString('pl-PL') + ' cm w terenie.', '1 km = 100 000 cm. Więc 1 cm na mapie = ' + dsF(red(F(s, 100000))) + ' km.', cm + ' · ' + dsF(red(F(s, 100000))) + ' km = ?'], sol: ['1 cm → ' + dsF(red(F(s, 100000))) + ' km', cm + ' cm → ' + dsF(red(F(s * cm, 100000))) + ' km'] }; }
      const s = r.pick([100000, 200000, 500000]), km = r.pick([10, 20, 30, 40, 50, 60]); const cm = km * 100000 / s;
      if (!Number.isInteger(cm * 10)) return this.gen(r, d);
      return { prompt: 'Odległość między miastami to ' + km + ' km. Jaka będzie na mapie w skali 1 : ' + s.toLocaleString('pl-PL') + '? Podaj w cm.', value: red(F(km * 100000, s)), dec: true, unit: 'cm', wrong: [{ v: N(km * s / 1000), code: 'scale_dir' }, { v: red(F(km * 1000, s)), code: 'units' }],
        hints: ['Z terenu na mapę – dzielimy przez ' + s.toLocaleString('pl-PL') + '.', km + ' km = ' + (km * 100000).toLocaleString('pl-PL') + ' cm.', (km * 100000).toLocaleString('pl-PL') + ' : ' + s.toLocaleString('pl-PL') + ' = ?'], sol: [km + ' km = ' + (km * 100000).toLocaleString('pl-PL') + ' cm', (km * 100000).toLocaleString('pl-PL') + ' : ' + s.toLocaleString('pl-PL') + ' = ' + dsF(red(F(km * 100000, s))) + ' cm'] };
    }
  });

  // ===================== PRĘDKOŚĆ =====================
  def('speed', {
    name: 'Droga, prędkość i czas', grade: 6, mainCode: 'speed_formula', prereq: ['tabl', 'fr_of'],
    types: { 1: ['input', 'choice'], 2: ['input', 'choice'], 3: ['input', 'choice'] },
    gen(r, d) {
      const who = r.pick(MP.th().mover); const sfx = who[3] === 'f' ? 'a' : who[3] === 'n' ? 'o' : '';
      const v = r.pick(who[2]);
      if (d === 1) { const t = r.int(2, 5); return { prompt: who[0] + ' ' + who[1] + ' z prędkością ' + v + ' km/h przez ' + t + ' h. Jaką drogę pokonał' + sfx + '?', value: N(v * t), unit: 'km', wrong: [{ v: red(F(v, t)), code: 'speed_formula' }, { v: N(v + t), code: 'speed_formula' }], hints: ['Prędkość ' + v + ' km/h znaczy: w każdej godzinie ' + v + ' km.', 'Droga = prędkość · czas.', v + ' · ' + t + ' = ?'], sol: ['s = v · t = ' + v + ' · ' + t + ' = ' + v * t + ' km'] }; }
      if (d === 2) { const t = r.int(2, 5), s = v * t; const askV = r.chance(0.5); return askV ? { prompt: who[0] + ' pokonał' + sfx + ' ' + s + ' km w ' + t + ' h. Jaka była średnia prędkość?', value: N(v), unit: 'km/h', wrong: [{ v: N(s * t), code: 'speed_formula' }, { v: N(s - t), code: 'speed_formula' }], hints: ['Prędkość to droga przebyta w 1 godzinę.', 'v = s : t.', s + ' : ' + t + ' = ?'], sol: ['v = ' + s + ' : ' + t + ' = ' + v + ' km/h'] }
        : { prompt: who[0] + ' porusza się z prędkością ' + v + ' km/h. Ile godzin zajmie pokonanie ' + s + ' km?', value: N(t), unit: 'h', wrong: [{ v: N(s * v), code: 'speed_formula' }, { v: red(F(v, s)), code: 'speed_formula' }], hints: ['W każdej godzinie pokonuje ' + v + ' km.', 'Ile razy ' + v + ' mieści się w ' + s + '? t = s : v.', s + ' : ' + v + ' = ?'], sol: ['t = ' + s + ' : ' + v + ' = ' + t + ' h'] }; }
      const mins = r.pick([15, 30, 45, 20, 40]); const s = red(F(v * mins, 60));
      if (s.d !== 1) return this.gen(r, d);
      return { prompt: who[0] + ' ' + who[1] + ' z prędkością ' + v + ' km/h przez ' + mins + ' minut. Jaką drogę pokonał' + sfx + '?', value: s, unit: 'km', wrong: [{ v: N(v * mins), code: 'units_time' }, { v: N(v), code: 'units_time' }],
        hints: ['Prędkość jest w km/h – zamień minuty na część godziny.', mins + ' min = ' + fmtF(red(F(mins, 60))) + ' h.', v + ' · ' + fmtF(red(F(mins, 60))) + ' = ?'], sol: [mins + ' min = ' + fmtF(red(F(mins, 60))) + ' h', 's = ' + v + ' · ' + fmtF(red(F(mins, 60))) + ' = ' + dsF(s) + ' km'] };
    },
    why: [{ q: 'Samochód jedzie 60 km/h. Co to znaczy?', opts: [{ t: 'W ciągu każdej godziny pokonuje 60 km', ok: true }, { t: 'Jedzie 60 godzin', code: 'speed_formula' }, { t: 'Przejedzie 60 km w minutę', code: 'units_time' }], expl: 'km/h czytamy „kilometrów na godzinę" – tyle kilometrów w jednej godzinie.' }]
  });

  // ===================== DANE =====================
  def('data_read', {
    name: 'Odczytywanie danych z diagramów i tabel', grade: 6, mainCode: 'read',
    types: { 1: ['input', 'choice'], 2: ['input', 'choice'], 3: ['input', 'choice'] },
    gen(r, d) {
      const ctx = MP.th().chart;
      const step = d === 1 ? 2 : 5; const pool = r.shuffle([...Array(d === 1 ? 6 : 7).keys()].map(k => step * (k + 1))); const vals = ctx.l.map((_, k) => pool[k]);
      const i = r.int(0, vals.length - 1); let j = r.int(0, vals.length - 1); if (j === i) j = (i + 1) % vals.length;
      const vis = barChart(ctx.l, vals);
      if (d === 1) return { prompt: ctx.t + ' ' + ctx.one(ctx.l[i]), visual: vis, value: N(vals[i]), wrong: [{ v: N(vals[j]), code: 'read' }, { v: N(vals[i] + 1), code: 'calc' }], hints: ['Znajdź słupek podpisany „' + ctx.l[i] + '".', 'Poprowadź wzrokiem poziomą linię od czubka słupka do osi z liczbami.', 'Odczytaj liczbę na osi. Linie pomocnicze są co ' + step + '.'], sol: ['Słupek „' + ctx.l[i] + '" sięga do ' + vals[i] + '.'] };
      const [hi, lo] = vals[i] >= vals[j] ? [i, j] : [j, i];
      if (d === 2) return { prompt: ctx.t + ' ' + ctx.more(ctx.l[hi], ctx.l[lo]), visual: vis, value: N(vals[hi] - vals[lo]), wrong: [{ v: N(vals[hi]), code: 'read' }, { v: N(vals[hi] + vals[lo]), code: 'read' }], hints: ['Odczytaj oba słupki.', ctx.l[hi] + ': ' + vals[hi] + ', ' + ctx.l[lo] + ': ' + vals[lo] + '.', '„O ile więcej" – odejmij.'], sol: [vals[hi] + ' − ' + vals[lo] + ' = ' + (vals[hi] - vals[lo])] };
      const tot = vals.reduce((a, b) => a + b, 0);
      return { prompt: ctx.t + ' ' + ctx.all, visual: vis, value: N(tot), wrong: [{ v: N(tot - vals[0]), code: 'read' }, { v: N(Math.max(...vals)), code: 'read' }], hints: ['Odczytaj wartość każdego słupka.', 'Wartości: ' + vals.slice(0, 2).join(', ') + '…', 'Dodaj wszystkie wartości.'], sol: [vals.join(' + ') + ' = ' + tot] };
    }
  });

  // ===================== ZADANIA TEKSTOWE WIELOETAPOWE =====================
  def('word_multi', {
    name: 'Zadania tekstowe wieloetapowe', grade: 6, mainCode: 'read', prereq: ['dec_add', 'dec_mul'],
    types: { 1: ['input'], 2: ['input', 'multi'], 3: ['multi', 'input'] },
    gen(r, d, type) {
      const TT = [
        () => { const th = MP.th(); const cheap = th.items.filter(x => x[2] <= 2500); const pool = cheap.length >= 2 ? cheap : th.items; const two = r.shuffle(pool).slice(0, 2); const A = two[0], Bq = two[1];
          const n = r.int(2, 4), tot = n * A[2] + Bq[2]; const pay = [2000, 5000, 10000, 20000, 50000].find(x => x > tot);
          if (!pay) return null;
          return { txt: 'Kupujesz: ' + A[1] + ' – ' + n + ' szt. po ' + money(A[2]) + ' zł oraz ' + Bq[1] + ' za ' + money(Bq[2]) + ' zł. Płacisz banknotem ' + pay / 100 + ' zł. Ile reszty dostaniesz?', steps: [['koszt ' + n + ' szt. (zł)', fromDec(n * A[2], 2)], ['koszt razem (zł)', fromDec(tot, 2)], ['reszta (zł)', fromDec(pay - tot, 2)]], wr: [[fromDec(pay - A[2] - Bq[2], 2), 'read'], [fromDec(tot, 2), 'read']] }; },
        () => { const who = r.pick(MP.th().mover); const v = r.pick(who[2]), t1 = r.int(2, 3), t2 = r.int(1, 2), stop = r.pick([30, 45]); const sfx = who[3] === 'f' ? 'a' : who[3] === 'n' ? 'o' : '';
          return { txt: who[0] + ' ' + who[1] + ' przez ' + t1 + ' h z prędkością ' + v + ' km/h, potem był ' + stop + '-minutowy postój, a następnie jeszcze ' + t2 + ' h z tą samą prędkością. Ile kilometrów pokonał' + sfx + ' w sumie?', steps: [['droga przed postojem (km)', N(v * t1)], ['droga po postoju (km)', N(v * t2)], ['cała droga (km)', N(v * (t1 + t2))]], wr: [[N(v * (t1 + t2) + v * stop / 60), 'read'], [N(v * t1), 'read']] }; },
        () => { const os = r.pick([4, 6]), nos = os === 4 ? r.pick([6, 8, 10]) : r.pick([9, 12]), m = os * r.pick([25, 50, 75]), e = r.pick([2, 3]); const k = red(F(nos, os));
          if (!(Number.isInteger(m * nos / os)) || !Number.isInteger(e * nos / os)) return null;
          return { txt: 'Przepis na naleśniki dla ' + os + ' osób: ' + m + ' g mąki i ' + e + ' jajka. Ile gramów mąki potrzeba dla ' + nos + ' osób?', steps: [['mąka na 1 osobę (g)', red(F(m, os))], ['mąka dla ' + nos + ' osób (g)', N(m * nos / os)]], wr: [[N(m + nos - os), 'read'], [N(m * nos), 'calc']] }; },
        () => { const mecze = r.int(8, 15), wyg = r.int(3, mecze - 3), rem = r.int(1, mecze - wyg - 1), prz = mecze - wyg - rem; const pk = wyg * 3 + rem;
          return { txt: 'Drużyna rozegrała ' + mecze + ' meczów: ' + wyg + ' wygrała, ' + rem + ' zremisowała, a resztę przegrała. Za wygraną są 3 punkty, za remis 1, za porażkę 0. Ile punktów zdobyła?', steps: [['punkty za wygrane', N(wyg * 3)], ['punkty za remisy', N(rem)], ['razem punktów', N(pk)]], wr: [[N(wyg + rem), 'read'], [N(wyg * 3), 'read']] }; }
      ];
      const T = TT[r.chance(0.75) ? r.int(0, 1) : r.int(2, 3)];
      const t = T(); if (!t) return this.gen(r, d, type);
      const last = t.steps[t.steps.length - 1][1];
      if (type === 'multi') return { type: 'multi', prompt: t.txt + '<br><span class="muted">Rozwiąż krok po kroku – wpisz wynik każdego etapu.</span>', labels: t.steps.map(s => s[0]), answer: { kind: 'multi', values: t.steps.map(s => s[1]) }, multiCodes: t.steps.map(() => 'calc'), writeUp: true,
        hints: ['Przeczytaj zadanie dwa razy. Co jest dane, a o co pytają?', 'Podziel zadanie na etapy – są podpisane przy polach.', 'Pierwszy etap: ' + t.steps[0][0] + '.'], sol: t.steps.map(s => s[0] + ': ' + dsF(s[1])) };
      return { prompt: t.txt, value: last, dec: true, wrong: t.wr.map(w => ({ v: w[0], code: w[1] })), writeUp: true,
        hints: ['Przeczytaj zadanie dwa razy. Co jest dane, a o co pytają?', 'To zadanie ma kilka etapów: ' + t.steps.map(s => s[0]).join(' → ') + '.', 'Pierwszy etap: ' + t.steps[0][0] + ' = ' + dsF(t.steps[0][1]) + '.'], sol: t.steps.map(s => s[0] + ': ' + dsF(s[1])) };
    }
  });
})(MP);
