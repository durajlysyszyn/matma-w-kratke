/* interact.js — interaktywne typy zadań: oś liczbowa (przeciąganie punktu), zamalowywanie części figury,
   paski cięte na wspólny mianownik, segregowanie do grup, punkt w układzie współrzędnych, prostokąt o zadanych
   wymiarach, zaznaczanie kratek, wybór danych do zadania oraz dopasowywanie par i układanie kolejności (przeciąganie lub dotyk).
   Każdy komponent działa myszką, palcem i klawiaturą (alternatywa dla przeciągania: dotknij element, potem miejsce). */
var MP = (typeof window !== 'undefined' ? window : globalThis).MP;
(function (MP) {
  const U = MP.util;
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const TYPES = ['nline', 'shade', 'cutbars', 'bins', 'point', 'rect', 'cells', 'multisel', 'match', 'order'];
  const M = (s) => (MP.mathHTML ? MP.mathHTML(s) : String(s));
  const fmtV = (v) => { const x = Math.round(v * 1e6) / 1e6; return x < 0 ? '−' + String(-x).replace('.', ',') : String(x).replace('.', ','); };

  // ---------- oś liczbowa ----------
  function nlGeom(ax) { const W = 360, x0 = 24, x1 = 336; const X = (v) => x0 + (v - ax.min) / (ax.max - ax.min) * (x1 - x0); const V = (x) => ax.min + (x - x0) / (x1 - x0) * (ax.max - ax.min); return { W, x0, x1, X, V }; }
  function nlLabel(v, ax) {
    if (ax.labelFn === 'frac' && ax.den) { const n = Math.round(v * ax.den); if (n % ax.den === 0) return String(n / ax.den); return null; }
    return Math.abs(v - Math.round(v)) < 1e-9 ? (v < 0 ? '−' + -Math.round(v) : String(Math.round(v))) : null;
  }
  function renderNline(it, val, o) {
    const ax = it.axis, g = nlGeom(ax); const n = Math.round((ax.max - ax.min) / ax.step);
    let s = '<line x1="10" y1="56" x2="' + (g.W - 6) + '" y2="56" class="ln"/><polygon points="' + (g.W - 8) + ',51 ' + g.W + ',56 ' + (g.W - 8) + ',61" style="fill:var(--ink)"/>';
    for (let i = 0; i <= n; i++) { const v = ax.min + i * ax.step; const lab = (ax.labels && ax.labels[i] !== undefined) ? ax.labels[i] : nlLabel(v, ax); const big = lab != null && lab !== ''; s += '<line x1="' + g.X(v).toFixed(1) + '" y1="' + (big ? 44 : 49) + '" x2="' + g.X(v).toFixed(1) + '" y2="' + (big ? 68 : 63) + '" class="tick"/>'; if (big) s += '<text x="' + g.X(v).toFixed(1) + '" y="88" text-anchor="middle" class="lb">' + esc(lab) + '</text>'; }
    (ax.marks || []).forEach(m => { s += '<circle cx="' + g.X(m.v).toFixed(1) + '" cy="56" r="5" style="fill:var(--mute)"/><text x="' + g.X(m.v).toFixed(1) + '" y="30" text-anchor="middle" class="ax">' + esc(m.label) + '</text>'; });
    const has = val != null && val !== '';
    const mx = has ? g.X(+val) : g.X(ax.min + (ax.max - ax.min) / 2);
    s += '<rect x="0" y="20" width="' + g.W + '" height="80" fill="transparent" class="nlhit"/>';
    s += '<g class="nlm' + (has ? '' : ' ghost') + '" transform="translate(' + mx.toFixed(1) + ',0)"><line x1="0" y1="18" x2="0" y2="56" style="stroke:var(--pen);stroke-width:3"/><circle cx="0" cy="56" r="11" style="fill:var(--pen);stroke:#fff;stroke-width:3"/><text x="0" y="13" text-anchor="middle" class="lb" style="fill:var(--pen)">' + esc(it.markLabel || '?') + '</text></g>';
    return '<div class="ix nl' + (o.state ? ' ' + o.state : '') + '"><p class="small muted ixi">' + (o.disabled ? '' : 'Przeciągnij niebieski znacznik albo dotknij osi. Klawiatura: strzałki ← →.') + '</p><svg viewBox="0 0 ' + g.W + ' 100" class="vis geo nlsvg" role="slider" tabindex="' + (o.disabled ? -1 : 0) + '" aria-label="oś liczbowa – ustaw znacznik" aria-valuetext="' + (has ? fmtV(+val) : 'nie ustawiono') + '" style="width:min(560px,100%);touch-action:none">' + s + '</svg>' + (has && it.axis.showVal ? '<p class="small">Znacznik: <b>' + fmtV(+val) + '</b></p>' : '') + '</div>';
  }
  function bindNline(el, it, get, set) {
    const svg = el.querySelector('.nlsvg'); if (!svg) return; const ax = it.axis, g = nlGeom(ax);
    const snap = (v) => { const k = Math.round((v - ax.min) / ax.step); return Math.max(ax.min, Math.min(ax.max, ax.min + k * ax.step)); };
    const toV = (e) => { const r = svg.getBoundingClientRect(); const x = (e.clientX - r.left) / r.width * g.W; return snap(g.V(x)); };
    let drag = false;
    svg.addEventListener('pointerdown', (e) => { drag = true; svg.setPointerCapture(e.pointerId); const v = +toV(e).toFixed(6); set(v, true); const m = svg.querySelector('.nlm'); if (m) { m.setAttribute('transform', 'translate(' + g.X(v).toFixed(1) + ',0)'); m.classList.remove('ghost'); } });
    svg.addEventListener('pointermove', (e) => { if (drag) { const v = +toV(e).toFixed(6); if (v !== +get()) { set(v, true); const m = svg.querySelector('.nlm'); if (m) { m.setAttribute('transform', 'translate(' + g.X(v).toFixed(1) + ',0)'); m.classList.remove('ghost'); } } } });
    svg.addEventListener('pointerup', () => { drag = false; set(get()); });
    svg.addEventListener('keydown', (e) => { const cur = get() == null || get() === '' ? ax.min : +get(); if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { e.preventDefault(); set(+snap(cur + ax.step).toFixed(6)); } if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { e.preventDefault(); set(+snap(cur - ax.step).toFixed(6)); } });
  }

  // ---------- zamalowywanie części ----------
  function shapeParts(it) {
    const p = it.parts, sh = it.shape || 'bar', out = [];
    if (sh === 'bar') { const W = 320, H = 60; for (let i = 0; i < p; i++) out.push('<rect x="' + (10 + i * W / p).toFixed(2) + '" y="10" width="' + (W / p).toFixed(2) + '" height="' + H + '"'); return { vb: '0 0 340 80', parts: out, frame: '<rect x="10" y="10" width="' + W + '" height="' + H + '" style="fill:none;stroke:var(--ink);stroke-width:2.5;pointer-events:none"/>' }; }
    if (sh === 'grid') { const cols = it.cols, rows = p / cols, c = 34; for (let i = 0; i < p; i++) out.push('<rect x="' + (6 + (i % cols) * c) + '" y="' + (6 + Math.floor(i / cols) * c) + '" width="' + c + '" height="' + c + '"'); return { vb: '0 0 ' + (12 + cols * c) + ' ' + (12 + rows * c), parts: out, frame: '' }; }
    const r = 70, C = 76; for (let i = 0; i < p; i++) { const a0 = 2 * Math.PI * i / p - Math.PI / 2, a1 = 2 * Math.PI * (i + 1) / p - Math.PI / 2; const P = (a) => (C + r * Math.cos(a)).toFixed(2) + ' ' + (C + r * Math.sin(a)).toFixed(2); out.push(p === 1 ? '<circle cx="' + C + '" cy="' + C + '" r="' + r + '"' : '<path d="M' + C + ' ' + C + ' L' + P(a0) + ' A' + r + ' ' + r + ' 0 0 1 ' + P(a1) + ' Z"'); }
    return { vb: '0 0 152 152', parts: out, frame: '' };
  }
  function renderShade(it, val, o) {
    const sel = Array.isArray(val) ? val : []; const g = shapeParts(it);
    const body = g.parts.map((p, i) => p + ' class="part ' + (sel.includes(i) ? 'sh' : 'un') + '" data-part="' + i + '" tabindex="' + (o.disabled ? -1 : 0) + '" role="button" aria-pressed="' + sel.includes(i) + '" aria-label="część ' + (i + 1) + ' z ' + it.parts + '"/>').join('') + g.frame;
    return '<div class="ix shade' + (o.state ? ' ' + o.state : '') + '"><p class="small muted ixi">' + (o.disabled ? '' : 'Dotknij części, żeby je zamalować (drugie dotknięcie cofa).') + '</p><svg viewBox="' + g.vb + '" class="vis geo shsvg" style="width:' + (it.shape === 'circle' ? '200px' : 'min(420px,100%)') + '">' + body + '</svg><p class="small">Zamalowane: <b>' + sel.length + '</b> z ' + it.parts + '</p></div>';
  }
  function bindShade(el, it, get, set) {
    el.querySelectorAll('[data-part]').forEach(p => { const tog = () => { const cur = (get() || []).slice(); const i = +p.dataset.part; const k = cur.indexOf(i); if (k >= 0) cur.splice(k, 1); else cur.push(i); set(cur); }; p.addEventListener('click', tog); p.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tog(); } }); });
  }

  // ---------- paski cięte na wspólny mianownik ----------
  function cutBar(fr, k, y, label) {
    const W = 300, x0 = 70, H = 40, wFill = W * fr.n / fr.d; let s = '';
    s += '<rect x="' + x0 + '" y="' + y + '" width="' + W + '" height="' + H + '" class="un"/>';
    s += '<rect x="' + x0 + '" y="' + y + '" width="' + wFill.toFixed(2) + '" height="' + H + '" class="sh"/>';
    for (let i = 1; i < fr.d; i++) s += '<line x1="' + (x0 + W * i / fr.d).toFixed(2) + '" y1="' + y + '" x2="' + (x0 + W * i / fr.d).toFixed(2) + '" y2="' + (y + H) + '" style="stroke:var(--ink);stroke-width:2.5"/>';
    let fits = true;
    if (k > 1) for (let i = 1; i < k; i++) { const xx = x0 + W * i / k; s += '<line x1="' + xx.toFixed(2) + '" y1="' + (y - 4) + '" x2="' + xx.toFixed(2) + '" y2="' + (y + H + 4) + '" class="dash"/>'; }
    if (k % fr.d !== 0) fits = false;
    s += '<rect x="' + x0 + '" y="' + y + '" width="' + W + '" height="' + H + '" style="fill:none;stroke:var(--ink);stroke-width:2.5"/>';
    s += '<text x="' + (x0 - 10) + '" y="' + (y + H / 2 + 6) + '" text-anchor="end" class="lb">' + label + '</text>';
    s += '<text x="' + (x0 + W + 8) + '" y="' + (y + H / 2 + 7) + '" class="lb" style="fill:' + (k > 1 ? (fits ? 'var(--ok)' : 'var(--coral)') : 'var(--mute)') + '">' + (k > 1 ? (fits ? '✓' : '✗') : '') + '</text>';
    return { s, fits };
  }
  function renderCut(it, val, o) {
    const v = val || {}; const k = +v.k || 1; const fr = it.cut.fr; let y = 18, body = '', allFit = true;
    fr.forEach((f, i) => { const b = cutBar(f, k, y, f.n + '/' + f.d); body += b.s; allFit = allFit && b.fits; y += 62; });
    const dis = o.disabled ? ' disabled' : '';
    let h = '<div class="ix cut' + (o.state ? ' ' + o.state : '') + '"><p class="small muted ixi">' + (o.disabled ? '' : 'Krok 1: potnij oba paski na tyle samo równych części (przyciski − i +). Przerywane kreski muszą trafić w granice zamalowanych części na obu paskach.') + '</p>';
    h += '<div class="stepper"><button type="button" data-cutk="-1" aria-label="mniej części"' + dis + '>−</button><span>Liczba części: <b>' + (k > 1 ? k : '—') + '</b></span><button type="button" data-cutk="1" aria-label="więcej części"' + dis + '>+</button></div>';
    h += '<svg viewBox="0 0 400 ' + (y - 4) + '" class="vis geo" style="width:min(520px,100%)">' + body + '</svg>';
    if (k > 1) h += '<p class="small">' + (allFit ? '<b style="color:var(--ok)">Kreski pasują na obu paskach</b> – teraz wszystkie kawałki są jednakowe: każdy to 1/' + k + ' całości.' : '<b style="color:var(--coral)">Kreski nie pasują</b> na pasku oznaczonym ✗ – kawałki nie byłyby równe. Spróbuj innej liczby.') + '</p>';
    // krok 2: liczniki po rozszerzeniu (i ewentualnie wynik)
    const fr2 = (i) => '<span class="mfr"><input data-cutn="' + i + '" inputmode="numeric" autocomplete="off" value="' + esc((v.n || [])[i] || '') + '"' + dis + ' aria-label="licznik ułamka ' + (i + 1) + ' po rozszerzeniu"><i></i><b>' + (k > 1 ? k : '□') + '</b></span>';
    h += '<div class="cutrow"><span class="small muted">Krok 2:</span> ' + fr.map((f, i) => M('[[' + f.n + '/' + f.d + ']]') + ' = ' + fr2(i)).join('<span class="sp"></span>') + '</div>';
    if (it.cut.res) h += '<div class="cutrow"><span class="small muted">Krok 3:</span> ' + fr.map((f, i) => '<span class="mfr"><b data-cutm="' + i + '">' + esc((v.n || [])[i] || '□') + '</b><i></i><b>' + (k > 1 ? k : '□') + '</b></span>').join(' ' + it.cut.op + ' ') + ' = <span class="mfr"><input data-cuts="1" inputmode="numeric" autocomplete="off" value="' + esc(v.s == null ? '' : v.s) + '"' + dis + ' aria-label="licznik wyniku"><i></i><b>' + (k > 1 ? k : '□') + '</b></span></div>';
    return h + '</div>';
  }
  function bindCut(el, it, get, set) {
    const cur = () => Object.assign({ k: 1, n: [], s: '' }, get() || {});
    el.querySelectorAll('[data-cutk]').forEach(b => b.addEventListener('click', () => { const v = cur(); v.k = Math.max(1, Math.min(it.cut.maxK || 24, (+v.k || 1) + +b.dataset.cutk)); set(v); }));
    el.querySelectorAll('[data-cutn]').forEach(inp => inp.addEventListener('input', () => { const v = cur(); v.n = (v.n || []).slice(); v.n[+inp.dataset.cutn] = inp.value.replace(/\D/g, ''); set(v, true); const m = el.querySelector('[data-cutm="' + inp.dataset.cutn + '"]'); if (m) m.textContent = v.n[+inp.dataset.cutn] || '□'; }));
    el.querySelectorAll('[data-cuts]').forEach(inp => inp.addEventListener('input', () => { const v = cur(); v.s = inp.value.replace(/\D/g, ''); set(v, true); }));
  }

  // ---------- segregowanie do grup ----------
  function renderBins(it, val, o) {
    const v = val || {}; const selI = o.sel;
    let h = '<div class="ix bins' + (o.state ? ' ' + o.state : '') + '"><p class="small muted ixi">' + (o.disabled ? '' : 'Przeciągnij każdy element do właściwej grupy – albo dotknij elementu, a potem grupy.') + '</p><div class="pool" data-drop="pool">';
    it.items.forEach((x, i) => { if (v[i] === undefined) h += '<button type="button" class="chipx' + (selI === i ? ' sel' : '') + '" data-drag="' + i + '"' + (o.disabled ? ' disabled' : '') + '>' + M(x) + '</button>'; });
    h += '</div><div class="binrow">';
    it.binNames.forEach((b, j) => { h += '<div class="bin" data-drop="' + j + '" role="button" tabindex="' + (o.disabled ? -1 : 0) + '" aria-label="grupa: ' + esc(b) + '"><b>' + esc(b) + '</b><div class="binin">' + it.items.map((x, i) => v[i] === j ? '<button type="button" class="chipx in" data-drag="' + i + '"' + (o.disabled ? ' disabled' : '') + '>' + M(x) + '</button>' : '').join('') + '</div></div>'; });
    return h + '</div></div>';
  }

  // ---------- dopasowywanie par ----------
  function renderMatch(it, val, o) {
    const v = val || {}; const used = Object.values(v);
    let h = '<div class="ix mt' + (o.state ? ' ' + o.state : '') + '"><p class="small muted ixi">' + (o.disabled ? '' : 'Przeciągnij kartę z prawej na pasujące miejsce – albo dotknij karty, a potem miejsca.') + '</p><div class="mtgrid"><div class="mtl">';
    it.left.forEach((l, i) => { h += '<div class="mtslot" data-drop="' + i + '" role="button" tabindex="' + (o.disabled ? -1 : 0) + '"><span class="mtq">' + M(l) + '</span><span class="mtarrow">↔</span><span class="mta">' + (v[i] !== undefined ? '<button type="button" class="chipx in" data-drag="' + v[i] + '"' + (o.disabled ? ' disabled' : '') + '>' + M(it.right[v[i]]) + '</button>' : '<span class="muted small">upuść tutaj</span>') + '</span></div>'; });
    h += '</div><div class="pool mtr" data-drop="pool">';
    it.right.forEach((r, j) => { if (!used.includes(j)) h += '<button type="button" class="chipx' + (o.sel === j ? ' sel' : '') + '" data-drag="' + j + '"' + (o.disabled ? ' disabled' : '') + '>' + M(r) + '</button>'; });
    return h + '</div></div></div>';
  }

  // ---------- kolejność ----------
  function renderOrder(it, val, o) {
    const seq = Array.isArray(val) ? val : [];
    let h = '<div class="ix ord2' + (o.state ? ' ' + o.state : '') + '"><p class="small muted ixi">' + (o.disabled ? '' : (it.orderHint || 'Przeciągnij elementy do ramki we właściwej kolejności – albo dotykaj ich po kolei. Element w ramce dotknij, żeby go cofnąć.')) + '</p><ol class="seq2" data-drop="seq">' + (seq.length ? seq.map((k, j) => '<li><button type="button" class="chipx in" data-unseq="' + j + '" data-drag="' + k + '"' + (o.disabled ? ' disabled' : '') + '><span class="ordn">' + (j + 1) + '.</span> ' + M(it.items[k]) + '</button></li>').join('') : '<li class="muted small empty">tu ułóż kolejność</li>') + '</ol><div class="pool" data-drop="pool">';
    it.items.forEach((x, k) => { if (!seq.includes(k)) h += '<button type="button" class="chipx" data-drag="' + k + '"' + (o.disabled ? ' disabled' : '') + '>' + M(x) + '</button>'; });
    return h + '</div></div>';
  }

  // ---------- wspólne przeciąganie (mysz, dotyk) z alternatywą „dotknij – dotknij" ----------
  function dragBind(el, onDrop, onTap) {
    el.querySelectorAll('[data-drag]').forEach(ch => {
      if (ch.disabled) return;
      let sx = 0, sy = 0, ghost = null, moved = false, lx = 0, ly = 0, active = false;
      const cleanup = () => { if (ghost) { ghost.remove(); ghost = null; } document.querySelectorAll('.chipx.ghost').forEach(g => g.remove()); el.querySelectorAll('[data-drop]').forEach(d => d.classList.remove('over')); active = false; };
      const dropAt = (x, y) => { const t = document.elementFromPoint(x, y); const dz = t && t.closest('[data-drop]'); if (dz && el.contains(dz)) onDrop(+ch.dataset.drag, dz.dataset.drop, ch); };
      ch.addEventListener('pointerdown', (e) => { cleanup(); sx = lx = e.clientX; sy = ly = e.clientY; moved = false; active = true; try { ch.setPointerCapture(e.pointerId); } catch (er) { } });
      ch.addEventListener('pointermove', (e) => {
        if (!active) return; lx = e.clientX; ly = e.clientY;
        if (!moved && Math.hypot(e.clientX - sx, e.clientY - sy) > 8) { moved = true; ghost = ch.cloneNode(true); ghost.classList.add('ghost'); document.body.appendChild(ghost); }
        if (ghost) { ghost.style.left = (e.clientX - ghost.offsetWidth / 2) + 'px'; ghost.style.top = (e.clientY - ghost.offsetHeight / 2) + 'px'; el.querySelectorAll('[data-drop]').forEach(d => d.classList.remove('over')); const t = document.elementFromPoint(e.clientX, e.clientY); const dz = t && t.closest('[data-drop]'); if (dz && el.contains(dz)) dz.classList.add('over'); }
      });
      ch.addEventListener('pointerup', (e) => { const was = active; cleanup(); if (was && moved) dropAt(e.clientX, e.clientY); });
      // dotyk: przeglądarka może przerwać gest (przewijanie, przytrzymanie) – wtedy sprzątamy „ducha” i upuszczamy w ostatnim miejscu
      ch.addEventListener('pointercancel', () => { const was = active && moved; cleanup(); if (was) dropAt(lx, ly); });
      ch.addEventListener('lostpointercapture', () => { if (active && !moved) active = false; });
      ch.addEventListener('click', (e) => { if (moved) { e.preventDefault(); moved = false; return; } onTap(+ch.dataset.drag, ch); });
    });
    el.querySelectorAll('[data-drop]').forEach(dz => { const go = (e) => { if (e.target.closest('[data-drag]')) return; onDrop(null, dz.dataset.drop, null); }; dz.addEventListener('click', go); dz.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(e); } }); });
  }

  // ---------- punkt w układzie współrzędnych ----------
  function ptGeom(R) { const s = 24, c = 12 + R * s; return { s, c, X: (x) => c + x * s, Y: (y) => c - y * s, R, W: 2 * c }; }
  function renderPoint(it, val, o) {
    const R = it.grid || 5, g = ptGeom(R); const v = val || null; let b = '';
    for (let i = -R; i <= R; i++) { b += '<line x1="' + g.X(i) + '" y1="' + g.Y(R) + '" x2="' + g.X(i) + '" y2="' + g.Y(-R) + '" class="grid"/><line x1="' + g.X(-R) + '" y1="' + g.Y(i) + '" x2="' + g.X(R) + '" y2="' + g.Y(i) + '" class="grid"/>'; }
    b += '<line x1="' + g.X(-R) + '" y1="' + g.c + '" x2="' + g.X(R) + '" y2="' + g.c + '" class="ln" style="stroke-width:1.5"/><line x1="' + g.c + '" y1="' + g.Y(R) + '" x2="' + g.c + '" y2="' + g.Y(-R) + '" class="ln" style="stroke-width:1.5"/>';
    for (let i = -R; i <= R; i++) if (i && i % 2 === 0) b += '<text x="' + g.X(i) + '" y="' + (g.c + 15) + '" text-anchor="middle" class="ax">' + (i < 0 ? '−' + -i : i) + '</text><text x="' + (g.c - 6) + '" y="' + (g.Y(i) + 4) + '" text-anchor="end" class="ax">' + (i < 0 ? '−' + -i : i) + '</text>';
    b += '<text x="' + (g.X(R) - 6) + '" y="' + (g.c - 6) + '" class="ax">x</text><text x="' + (g.c + 6) + '" y="' + (g.Y(R) + 12) + '" class="ax">y</text>';
    (it.given || []).forEach(p => { b += '<circle cx="' + g.X(p.x) + '" cy="' + g.Y(p.y) + '" r="6" style="fill:var(--mute)"/><text x="' + (g.X(p.x) + 8) + '" y="' + (g.Y(p.y) - 8) + '" class="lb">' + esc(p.label) + '</text>'; });
    b += '<rect x="0" y="0" width="' + g.W + '" height="' + g.W + '" fill="transparent"/>';
    b += '<g class="ptm"' + (v ? '' : ' style="display:none"') + ' transform="translate(' + g.X(v ? v.x : 0) + ',' + g.Y(v ? v.y : 0) + ')"><circle cx="0" cy="0" r="9" style="fill:var(--pen);stroke:#fff;stroke-width:3"/><text x="10" y="-10" class="lb" style="fill:var(--pen)">' + esc(it.ptLabel || 'P') + '</text></g>';
    return '<div class="ix pt' + (o.state ? ' ' + o.state : '') + '"><p class="small muted ixi">' + (o.disabled ? '' : 'Dotknij punktu kratki albo przeciągnij znacznik. Klawiatura: strzałki.') + '</p><svg viewBox="0 0 ' + g.W + ' ' + g.W + '" class="vis geo ptsvg" tabindex="' + (o.disabled ? -1 : 0) + '" role="application" aria-label="układ współrzędnych – ustaw punkt" style="width:min(320px,100%);touch-action:none">' + b + '</svg><p class="small">Twój punkt: <b>' + (v ? '(' + (v.x < 0 ? '−' + -v.x : v.x) + ', ' + (v.y < 0 ? '−' + -v.y : v.y) + ')' : '—') + '</b></p></div>';
  }
  function bindPoint(el, it, get, set) {
    const svg = el.querySelector('.ptsvg'); if (!svg) return; const R = it.grid || 5, g = ptGeom(R); let drag = false;
    const at = (e) => { const r = svg.getBoundingClientRect(); const x = (e.clientX - r.left) / r.width * g.W, y = (e.clientY - r.top) / r.height * g.W; return { x: Math.max(-R, Math.min(R, Math.round((x - g.c) / g.s))), y: Math.max(-R, Math.min(R, Math.round((g.c - y) / g.s))) }; };
    const mv = (p) => { const m = svg.querySelector('.ptm'); if (m) { m.style.display = ''; m.setAttribute('transform', 'translate(' + g.X(p.x) + ',' + g.Y(p.y) + ')'); } };
    svg.addEventListener('pointerdown', (e) => { drag = true; svg.setPointerCapture(e.pointerId); const p = at(e); set(p, true); mv(p); });
    svg.addEventListener('pointermove', (e) => { if (drag) { const p = at(e), c = get() || {}; if (p.x !== c.x || p.y !== c.y) { set(p, true); mv(p); } } });
    svg.addEventListener('pointerup', () => { drag = false; set(get()); });
    svg.addEventListener('keydown', (e) => { const c = Object.assign({ x: 0, y: 0 }, get() || {}); const d = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] }[e.key]; if (d) { e.preventDefault(); set({ x: Math.max(-R, Math.min(R, c.x + d[0])), y: Math.max(-R, Math.min(R, c.y + d[1])) }); } });
  }

  // ---------- prostokąt o zadanych wymiarach ----------
  function renderRect(it, val, o) {
    const v = Object.assign({ a: 1, b: 1 }, val || {}); const c = 22, Wm = it.rmax || 10, Hm = it.rmax2 || 8; let b = '';
    for (let i = 0; i <= Wm; i++) b += '<line x1="' + (8 + i * c) + '" y1="8" x2="' + (8 + i * c) + '" y2="' + (8 + Hm * c) + '" class="grid"/>';
    for (let j = 0; j <= Hm; j++) b += '<line x1="8" y1="' + (8 + j * c) + '" x2="' + (8 + Wm * c) + '" y2="' + (8 + j * c) + '" class="grid"/>';
    b += '<rect x="8" y="' + (8 + (Hm - v.b) * c) + '" width="' + v.a * c + '" height="' + v.b * c + '" class="shape"/>';
    const dis = o.disabled ? ' disabled' : '';
    const st = (key, lbl) => '<div class="stepper"><button type="button" data-rk="' + key + '" data-rd="-1"' + dis + ' aria-label="zmniejsz ' + lbl + '">−</button><span>' + lbl + ': <b>' + v[key] + '</b></span><button type="button" data-rk="' + key + '" data-rd="1"' + dis + ' aria-label="zwiększ ' + lbl + '">+</button></div>';
    return '<div class="ix rect' + (o.state ? ' ' + o.state : '') + '"><p class="small muted ixi">' + (o.disabled ? '' : 'Zmieniaj długości boków przyciskami − i +. Bok kratki = 1.') + '</p><div class="row" style="gap:10px;flex-wrap:wrap">' + st('a', 'długość') + st('b', 'szerokość') + '</div><svg viewBox="0 0 ' + (16 + Wm * c) + ' ' + (16 + Hm * c) + '" class="vis geo" style="width:min(300px,100%)">' + b + '</svg>' + (it.live ? '<p class="small">Pole: <b>' + v.a * v.b + '</b> · obwód: <b>' + 2 * (v.a + v.b) + '</b></p>' : '') + '</div>';
  }
  function bindRect(el, it, get, set) { el.querySelectorAll('[data-rk]').forEach(b => b.addEventListener('click', () => { const v = Object.assign({ a: 1, b: 1 }, get() || {}); const k = b.dataset.rk; v[k] = Math.max(1, Math.min(k === 'a' ? (it.rmax || 10) : (it.rmax2 || 8), v[k] + +b.dataset.rd)); set(v); })); }

  // ---------- zaznaczanie kratek ----------
  function renderCells(it, val, o) {
    const sel = Array.isArray(val) ? val : []; const c = 30, W = it.cols, H = it.rows; let b = '';
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) { const k = j * W + i; b += '<rect x="' + (6 + i * c) + '" y="' + (6 + j * c) + '" width="' + c + '" height="' + c + '" class="part ' + (sel.includes(k) ? 'sh' : 'un') + '" data-part="' + k + '" tabindex="' + (o.disabled ? -1 : 0) + '" role="button" aria-pressed="' + sel.includes(k) + '" aria-label="kratka ' + (j + 1) + ', ' + (i + 1) + '"/>'; }
    return '<div class="ix cells' + (o.state ? ' ' + o.state : '') + '"><p class="small muted ixi">' + (o.disabled ? '' : 'Dotknij kratek, żeby je zaznaczyć.') + '</p><svg viewBox="0 0 ' + (12 + W * c) + ' ' + (12 + H * c) + '" class="vis geo shsvg" style="width:min(' + (20 + W * 34) + 'px,100%)">' + b + '</svg><p class="small">Zaznaczone kratki: <b>' + sel.length + '</b></p></div>';
  }

  // ---------- wybór kilku elementów ----------
  function renderMultisel(it, val, o) {
    const sel = Array.isArray(val) ? val : [];
    return '<div class="ix msel' + (o.state ? ' ' + o.state : '') + '"><p class="small muted ixi">' + (o.disabled ? '' : (it.selHint || 'Zaznacz wszystkie pasujące elementy.')) + '</p><div class="pool">' + it.opts.map((x, i) => '<button type="button" class="chipx' + (sel.includes(i) ? ' sel' : '') + '" data-ms="' + i + '" aria-pressed="' + sel.includes(i) + '"' + (o.disabled ? ' disabled' : '') + '>' + M(x) + '</button>').join('') + '</div></div>';
  }

  // ---------- API ----------
  function render(it, val, o) {
    o = o || {};
    if (it.type === 'nline') return renderNline(it, val, o);
    if (it.type === 'shade') return renderShade(it, val, o);
    if (it.type === 'cutbars') return renderCut(it, val, o);
    if (it.type === 'bins') return renderBins(it, val, o);
    if (it.type === 'point') return renderPoint(it, val, o);
    if (it.type === 'rect') return renderRect(it, val, o);
    if (it.type === 'cells') return renderCells(it, val, o);
    if (it.type === 'multisel') return renderMultisel(it, val, o);
    if (it.type === 'match') return renderMatch(it, val, o);
    if (it.type === 'order') return renderOrder(it, val, o);
    return '';
  }
  // get(): bieżąca odpowiedź; set(v, soft): zapis (soft = bez pełnego odświeżenia pól tekstowych)
  function bind(host, it, get, set, opts) {
    opts = opts || {}; const el = host.querySelector('.ix'); if (!el || opts.disabled) return;
    const rerender = (v) => { const box = el.parentNode; const tmp = document.createElement('div'); tmp.innerHTML = render(it, v, { sel: opts.sel }); const nu = tmp.firstChild; box.replaceChild(nu, el); bind(host, it, get, set, opts); const f = nu.querySelector('[data-focus]'); if (f) f.focus(); };
    const put = (v, soft) => { set(v); if (!soft) { const hadFocus = el.contains(document.activeElement); rerender(v); if (hadFocus && ['nline', 'point'].includes(it.type)) { const s2 = host.querySelector(it.type === 'nline' ? '.nlsvg' : '.ptsvg'); if (s2) s2.focus({ preventScroll: true }); } } };
    if (it.type === 'nline') return bindNline(el, it, get, (v, soft) => put(v, soft));
    if (it.type === 'point') return bindPoint(el, it, get, (v, soft) => put(v, soft));
    if (it.type === 'shade' || it.type === 'cells') return bindShade(el, it, get, (v) => put(v));
    if (it.type === 'cutbars') return bindCut(el, it, get, (v, soft) => { set(v); if (!soft) rerender(v); });
    if (it.type === 'rect') return bindRect(el, it, get, (v) => put(v));
    if (it.type === 'multisel') { el.querySelectorAll('[data-ms]').forEach(b => b.addEventListener('click', () => { const cur = (get() || []).slice(); const i = +b.dataset.ms; const k = cur.indexOf(i); if (k >= 0) cur.splice(k, 1); else cur.push(i); put(cur); })); return; }
    if (it.type === 'bins') {
      const assign = (i, dropId) => { const v = Object.assign({}, get() || {}); if (dropId === 'pool') delete v[i]; else v[i] = +dropId; opts.sel = null; put(v); };
      return dragBind(el, (i, dropId) => { if (i === null) { if (opts.sel !== null) assign(opts.sel, dropId); return; } assign(i, dropId); }, (i) => { opts.sel = opts.sel === i ? null : i; rerender(get()); });
    }
    if (it.type === 'match') {
      const assign = (j, dropId) => { const v = Object.assign({}, get() || {}); Object.keys(v).forEach(k => { if (v[k] === j) delete v[k]; }); if (dropId !== 'pool') v[+dropId] = j; opts.sel = null; put(v); };
      return dragBind(el, (j, dropId) => { if (j === null) { if (opts.sel !== null) assign(opts.sel, dropId); return; } assign(j, dropId); }, (j, ch) => { if (ch.classList.contains('in')) { assign(j, 'pool'); return; } opts.sel = opts.sel === j ? null : j; rerender(get()); });
    }
    if (it.type === 'order') {
      const cur = () => (Array.isArray(get()) ? get() : []).slice();
      return dragBind(el, (k, dropId, ch) => { if (k === null) return; const s = cur().filter(x => x !== k); if (dropId === 'seq') s.push(k); put(s); }, (k, ch) => { const s = cur(); if (ch.dataset.unseq !== undefined) { s.splice(+ch.dataset.unseq, 1); } else s.push(k); put(s); });
    }
  }
  // czy odpowiedź jest kompletna (do komunikatu „uzupełnij")
  function incomplete(it, v) {
    if (it.type === 'nline') return v == null || v === '' ? 'Ustaw znacznik na osi.' : null;
    if (it.type === 'shade' || it.type === 'cells') return !v || !v.length ? 'Zaznacz części figury.' : null;
    if (it.type === 'cutbars') { if (!v || !(+v.k > 1)) return 'Najpierw potnij paski na równe części (przycisk +).'; if (it.cut.fr.some((f, i) => !(v.n || [])[i])) return 'Uzupełnij liczniki po rozszerzeniu.'; if (it.cut.res && (v.s === '' || v.s == null)) return 'Wpisz licznik wyniku.'; return null; }
    if (it.type === 'bins') return Object.keys(v || {}).length < it.items.length ? 'Rozmieść wszystkie elementy w grupach.' : null;
    if (it.type === 'match') return Object.keys(v || {}).length < it.left.length ? 'Dopasuj wszystkie elementy.' : null;
    if (it.type === 'order') return (v || []).length < it.items.length ? 'Ułóż wszystkie elementy.' : null;
    if (it.type === 'point') return !v ? 'Ustaw punkt.' : null;
    if (it.type === 'rect') return !v ? 'Ustaw wymiary prostokąta przyciskami + i −.' : null;
    if (it.type === 'multisel') return !v || !v.length ? 'Zaznacz co najmniej jeden element.' : null;
    return null;
  }
  MP.ix = { TYPES, has: (t) => TYPES.includes(t), render, bind, incomplete };
})(MP);
