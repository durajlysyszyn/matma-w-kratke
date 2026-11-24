/* viz.js — matematycznie poprawne wizualizacje (SVG): paski ułamkowe, oś liczbowa, koło podzielone na części.
   Używane w podpowiedziach, ścieżce naprawczej i w interaktywnych zadaniach. */
var MP = (typeof window !== 'undefined' ? window : globalThis).MP;
(function (MP) {
  const U = MP.util;
  const svg = (w, h, body, label, cls) => '<svg viewBox="0 0 ' + w + ' ' + h + '" class="vis ' + (cls || 'geo') + '" role="img" aria-label="' + label + '">' + body + '</svg>';
  // jeden pasek: całość podzielona na d równych części, n zamalowanych (n może być > d – wtedy kilka pasków)
  function barRow(n, d, x, y, W, H, opt) {
    opt = opt || {}; let s = ''; const cw = W / d;
    for (let i = 0; i < d; i++) s += '<rect x="' + (x + i * cw).toFixed(2) + '" y="' + y + '" width="' + cw.toFixed(2) + '" height="' + H + '" class="' + (i < n ? (opt.cls || 'sh') : 'un') + '"/>';
    s += '<rect x="' + x + '" y="' + y + '" width="' + W + '" height="' + H + '" style="fill:none;stroke:var(--ink);stroke-width:2.5"/>';
    return s;
  }
  // bars([[n,d,label], …]) – kolejne paski tej samej długości (ta sama całość!)
  function bars(list, o) {
    o = o || {}; const W = 300, H = 34, gap = 16, lw = 70; let s = '', y = 6;
    list.forEach(([n, d, label, cls]) => {
      const whole = Math.max(1, Math.ceil(n / d));
      for (let k = 0; k < whole; k++) {
        const nn = Math.max(0, Math.min(d, n - k * d));
        s += barRow(nn, d, lw + k * 0, y, W, H, { cls });
        if (k === 0 && label) s += '<text x="' + (lw - 10) + '" y="' + (y + H / 2 + 6) + '" text-anchor="end" class="lb">' + label + '</text>';
        y += H + 6;
      }
      y += gap - 6;
    });
    return svg(lw + W + 10, y, s, o.label || 'paski ułamkowe', 'geo bars');
  }
  const fl = (n, d) => d === 1 ? String(n) : n + '/' + d;
  // wizualizacja dodawania ułamków o różnych mianownikach: oryginalne paski + te same paski pocięte na wspólny mianownik
  function addFractions(a, b, sub) {
    const L = U.lcm(a.d, b.d); const A = a.n * L / a.d, B = b.n * L / b.d;
    const top = bars([[a.n, a.d, fl(a.n, a.d)], [b.n, b.d, fl(b.n, b.d)]], { label: 'paski ułamków przed sprowadzeniem' });
    const bottom = bars([[A, L, fl(A, L)], [B, L, fl(B, L), 'sh2'], [sub ? A - B : A + B, L, fl(sub ? A - B : A + B, L), 'ok']], { label: 'paski po podzieleniu na ' + L + ' części' });
    return { top, bottom, L, A, B };
  }
  // oś liczbowa z zaznaczonymi punktami (wartości U.F)
  function numberLine(min, max, step, marks, o) {
    o = o || {}; const W = 340, x = (v) => 20 + (v - min) / (max - min) * 300; let s = '<line x1="10" y1="40" x2="332" y2="40" class="ln"/>';
    const nTicks = Math.round((max - min) / step);
    for (let i = 0; i <= nTicks; i++) { const v = min + i * step; const isInt = Math.abs(v - Math.round(v)) < 1e-9; s += '<line x1="' + x(v).toFixed(1) + '" y1="' + (isInt ? 28 : 34) + '" x2="' + x(v).toFixed(1) + '" y2="' + (isInt ? 52 : 46) + '" class="tick"/>'; if (isInt) s += '<text x="' + x(v).toFixed(1) + '" y="70" text-anchor="middle" class="lb">' + (v < 0 ? '−' + -Math.round(v) : Math.round(v)) + '</text>'; }
    (marks || []).forEach(m => { const v = U.val(m.v); s += '<circle cx="' + x(v).toFixed(1) + '" cy="40" r="6" style="fill:' + (m.color || 'var(--coral)') + '"/>' + (m.label ? '<text x="' + x(v).toFixed(1) + '" y="18" text-anchor="middle" class="lb" style="fill:' + (m.color || 'var(--coral)') + '">' + m.label + '</text>' : ''); });
    return svg(W, 78, s, o.label || 'oś liczbowa', 'geo nl');
  }
  // koło podzielone na d części, n zamalowanych
  function pie(n, d, r) {
    r = r || 60; const c = r + 4; let s = '';
    for (let i = 0; i < d; i++) { const a0 = 2 * Math.PI * i / d - Math.PI / 2, a1 = 2 * Math.PI * (i + 1) / d - Math.PI / 2; const p = (a) => (c + r * Math.cos(a)).toFixed(2) + ' ' + (c + r * Math.sin(a)).toFixed(2); s += d === 1 ? '<circle cx="' + c + '" cy="' + c + '" r="' + r + '" class="' + (n ? 'sh' : 'un') + '"/>' : '<path d="M' + c + ' ' + c + ' L' + p(a0) + ' A' + r + ' ' + r + ' 0 0 1 ' + p(a1) + ' Z" class="' + (i < n ? 'sh' : 'un') + '"/>'; }
    return svg(2 * c, 2 * c, s, n + ' z ' + d + ' części koła', 'pie');
  }
  // dobór wizualizacji do zadania (używane przy powtarzającym się błędzie)
  function forItem(it, code, mode) {
    const t = U.plain(it.prompt || '');
    let m = t.match(/(\d+)\/(\d+) ([+−]) (\d+)\/(\d+)/);
    if (m && mode === 'line') { const a = U.F(+m[1], +m[2]), b = U.F(+m[4], +m[5]); const sub = m[3] === '−'; const r = sub ? U.sub(a, b) : U.add(a, b); const L = U.lcm(a.d, b.d); if (U.val(r) >= 0) { const mx = Math.max(1, Math.ceil(Math.max(U.val(a), U.val(r)))); return { html: '<p>Oś podzielona na ' + L + '-e części (wspólny mianownik). ' + fl(a.n, a.d) + ' = ' + fl(a.n * L / a.d, L) + ', a ' + fl(b.n, b.d) + ' = ' + fl(b.n * L / b.d, L) + ' – tyle małych kroków ' + (sub ? 'cofamy się' : 'idziemy dalej') + '.</p>' + numberLine(0, mx, 1 / L, [{ v: a, label: fl(a.n, a.d) }, { v: r, label: '=' + fl(r.n, r.d), color: 'var(--ok)' }]), kind: 'line' }; } }
    if (m) { const a = U.F(+m[1], +m[2]), b = U.F(+m[4], +m[5]); const sub = m[3] === '−'; if (U.val(sub ? U.sub(a, b) : U.add(a, b)) >= 0) { const v = addFractions(a, b, sub); return { html: '<p>Najpierw paski takie, jak w zadaniu – kawałki mają <b>różną wielkość</b>, więc nie da się ich po prostu policzyć razem:</p>' + v.top + '<p>Teraz te same paski pocięte na <b>' + v.L + ' równe części</b>. Zamalowana część się nie zmieniła – zmieniła się tylko liczba kawałków. Teraz kawałki są jednakowe i można je ' + (sub ? 'odjąć' : 'dodać') + ':</p>' + v.bottom, kind: 'bars' }; } }
    m = t.match(/(\d+)\/(\d+)/);
    if (m && +m[2] <= 12 && +m[1] <= 24) { const n = +m[1], d = +m[2]; return { html: '<p>Tak wygląda ułamek ' + n + '/' + d + ': całość podzielona na ' + d + ' równych części, zamalowane ' + n + '.</p>' + bars([[n, d, n + '/' + d]]), kind: 'bars' }; }
    if (it.visual) return { html: '<p>Przyjrzyj się jeszcze raz rysunkowi – policz po kolei to, o co pyta zadanie.</p>' + it.visual, kind: 'visual' };
    return null;
  }
  MP.viz = { bars, barRow, addFractions, numberLine, pie, forItem, svg };
})(MP);
