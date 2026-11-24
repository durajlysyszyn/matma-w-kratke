/* core.js — narzędzia, ułamki, parsowanie odpowiedzi, budowanie zadań.
   Bez DOM: ten plik działa w przeglądarce i w Node (testy). */
var MP = (typeof window !== 'undefined' ? window : globalThis).MP = (typeof window !== 'undefined' ? window : globalThis).MP || {};
(function (MP) {
  'use strict';

  // ---------- losowość z ziarnem (zadanie da się odtworzyć po przerwie) ----------
  function rng(seed) {
    let a = seed >>> 0;
    const f = function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
    f.int = (lo, hi) => lo + Math.floor(f() * (hi - lo + 1));
    f.pick = (arr) => arr[Math.floor(f() * arr.length)];
    f.shuffle = (arr) => { const b = arr.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(f() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
    f.chance = (p) => f() < p;
    return f;
  }
  const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) { [a, b] = [b, a % b]; } return a; };
  const lcm = (a, b) => Math.abs(a * b) / gcd(a, b);

  // ---------- ułamki dokładne ----------
  function F(n, d) {
    if (d === undefined) d = 1;
    if (d === 0) throw new Error('Mianownik 0');
    if (d < 0) { n = -n; d = -d; }
    return { n: n, d: d };
  }
  const red = (x) => { const g = gcd(x.n, x.d) || 1; return F(x.n / g, x.d / g); };
  const add = (a, b) => red(F(a.n * b.d + b.n * a.d, a.d * b.d));
  const sub = (a, b) => red(F(a.n * b.d - b.n * a.d, a.d * b.d));
  const mul = (a, b) => red(F(a.n * b.n, a.d * b.d));
  const div = (a, b) => red(F(a.n * b.d, a.d * b.n));
  const eq = (a, b) => a.n * b.d === b.n * a.d;
  const val = (a) => a.n / a.d;
  const isSimplest = (a) => gcd(a.n, a.d) === 1;
  const fromDec = (k, places) => red(F(k, Math.pow(10, places))); // k / 10^places

  // ---------- zapis liczb (znaczniki interpretowane przez UI) ----------
  // [[3/4]] ułamek, [[1 2/3]] liczba mieszana
  function fracM(n, d) { return '[[' + n + '/' + d + ']]'; }
  function fmtF(x, form) {
    x = F(x.n, x.d);
    const neg = x.n < 0, n = Math.abs(x.n), d = x.d;
    const s = neg ? '−' : '';
    if (d === 1) return s + n;
    if (form !== 'improper' && n > d) {
      const w = Math.floor(n / d), r = n % d;
      if (r === 0) return s + w;
      return s + '[[' + w + ' ' + r + '/' + d + ']]';
    }
    return s + '[[' + n + '/' + d + ']]';
  }
  function fmtImp(x) { return fmtF(x, 'improper'); }
  // ułamek dziesiętny z przecinkiem; x = liczba całkowita k i places, lub ułamek
  function fmtDecK(k, places) {
    const neg = k < 0; k = Math.abs(k);
    let s = String(k);
    if (places > 0) {
      while (s.length <= places) s = '0' + s;
      s = s.slice(0, s.length - places) + ',' + s.slice(s.length - places);
      s = s.replace(/0+$/, '').replace(/,$/, '');
    }
    return (neg ? '−' : '') + s;
  }
  function fmtDec(x) { // ułamek o mianowniku 2^a5^b -> zapis dziesiętny
    x = red(x);
    let p = 0; while (Math.pow(10, p) % x.d !== 0 && p < 12) p++;
    if (Math.pow(10, p) % x.d !== 0) return fmtF(x);
    const k = x.n * (Math.pow(10, p) / x.d);
    return fmtDecK(k, p);
  }
  function fmtNum(x) { return x.d === 1 ? (x.n < 0 ? '−' + (-x.n) : String(x.n)) : fmtDec(x); }
  function pl(n, one, few, many) { n = Math.abs(n); if (n === 1) return one; const u = n % 10, t = n % 100; return (u >= 2 && u <= 4 && !(t >= 12 && t <= 14)) ? few : many; }
  function money(k) { const neg = k < 0; k = Math.abs(k); return (neg ? '−' : '') + Math.floor(k / 100) + ',' + String(k % 100).padStart(2, '0'); }
  function plain(s) { // znaczniki -> zwykły tekst (do porównań i czytników)
    return String(s).replace(/\[\[(\d+) (\d+)\/(\d+)\]\]/g, '$1 $2/$3').replace(/\[\[([^\]]+)\]\]/g, '$1');
  }

  // ---------- parsowanie odpowiedzi ucznia ----------
  const UNIT_RE = /\s*(cm²|cm2|cm\^2|dm²|dm2|mm²|mm2|m²|m2|km²|cm³|cm3|dm³|dm3|m³|m3|km\/h|m\/s|km|cm|mm|dm|m|h|godz\.?|godzin[ya]?|min\.?|minut[y]?|s|zł|zl|gr|%|°|stopni|ha|a|kg|dag|g|t|l|ml|szt\.?|sztuk[i]?|lat|dni)\.?\s*$/i;
  function parseNum(raw) {
    if (raw == null) return null;
    let s = String(raw).trim().toLowerCase();
    if (!s) return null;
    s = s.replace(/[−–—]/g, '-').replace(/\s+/g, ' ').replace(/\s*\/\s*/g, '/');
    for (let i = 0; i < 2; i++) s = s.replace(UNIT_RE, '');
    s = s.replace(/^\+/, '').trim();
    s = s.replace(/(\d) (?=\d{3}(\D|$))/g, '$1'); // 12 500 -> 12500
    let m;
    if ((m = s.match(/^(-?)(\d+) (\d+)\/(\d+)$/)) || (m = s.match(/^(-?)(\d+)i(\d+)\/(\d+)$/))) {
      const w = +m[2], n = +m[3], d = +m[4]; if (d === 0) return null;
      const v = F((w * d + n) * (m[1] ? -1 : 1), d);
      return { v: v, raw: s, kind: 'mixed', simplest: gcd(n, d) === 1 && n < d, num: n, den: d };
    }
    if ((m = s.match(/^(-?)(\d+)\/(\d+)$/))) {
      const n = +m[2], d = +m[3]; if (d === 0) return null;
      return { v: F(n * (m[1] ? -1 : 1), d), raw: s, kind: 'frac', simplest: gcd(n, d) === 1, improper: n >= d, num: n, den: d };
    }
    if ((m = s.match(/^(-?)(\d*)[.,](\d+)$/))) {
      const intp = m[2] || '0', fr = m[3];
      const k = +(intp + fr) * (m[1] ? -1 : 1);
      return { v: fromDec(k, fr.length), raw: s, kind: 'dec', places: fr.length };
    }
    if ((m = s.match(/^(-?)(\d+)$/))) {
      return { v: F(+m[2] * (m[1] ? -1 : 1), 1), raw: s, kind: 'int' };
    }
    return null;
  }

  // Sprawdzenie odpowiedzi liczbowej — w pełni deterministyczne
  function checkNum(item, raw) {
    const p = parseNum(raw);
    if (!p) return { ok: false, code: 'format', parsed: null };
    const a = item.answer;
    if (eq(p.v, a.value)) {
      if (a.form === 'simplest' && (p.kind === 'frac' || p.kind === 'mixed') && !p.simplest) return { ok: false, partial: true, code: 'not_simplified', parsed: p };
      if (a.form === 'mixed' && p.kind === 'frac' && p.improper && p.v.d !== 1) return { ok: false, partial: true, code: 'not_mixed', parsed: p };
      if (a.form === 'decimal' && (p.kind === 'frac' || p.kind === 'mixed')) return { ok: false, partial: true, code: 'not_decimal', parsed: p };
      return { ok: true, parsed: p };
    }
    // znane błędne rozumowania
    for (const w of (item.wrong || [])) if (w.v && eq(p.v, w.v)) return { ok: false, code: w.code, parsed: p };
    // pomyłka rachunkowa: wynik bliski poprawnemu
    const c = val(a.value), u = val(p.v);
    const near = (c === 0) ? Math.abs(u) <= 1 : Math.abs(u - c) / Math.abs(c) <= 0.12;
    const sameDen = (p.kind === 'frac' || p.kind === 'mixed') && p.v.d === a.value.d && Math.abs(p.v.n - a.value.n) <= 2;
    if ((near && Math.sign(u) === Math.sign(c)) || sameDen) return { ok: false, code: 'calc', parsed: p };
    if (Math.abs(u + c) < 1e-9 && c !== 0) return { ok: false, code: item.signCode || 'sign', parsed: p };
    return { ok: false, code: item.unknownCode || 'unknown', parsed: p };
  }

  function check(item, response) {
    const a = item.answer;
    if (a.kind === 'num') return checkNum(item, response);
    if (a.kind === 'choice') {
      const i = +response; const opt = item.options[i];
      if (!opt) return { ok: false, code: 'format' };
      return i === a.correct ? { ok: true } : { ok: false, code: opt.code || 'unknown' };
    }
    if (a.kind === 'order') {
      const seq = response || [];
      const ok = seq.length === a.seq.length && seq.every((x, i) => x === a.seq[i]);
      if (ok) return { ok: true };
      for (const w of (item.wrongOrders || [])) if (w.seq.length === seq.length && w.seq.every((x, i) => x === seq[i])) return { ok: false, code: w.code };
      return { ok: false, code: item.unknownCode || 'unknown' };
    }
    if (a.kind === 'match') {
      const r = response || {}; let bad = 0; let code = null;
      a.pairs.forEach((pr, i) => { if (r[i] !== pr) { bad++; const w = (item.matchWrong || {})[i + ':' + r[i]]; if (w) code = w; } });
      return bad === 0 ? { ok: true } : { ok: false, code: code || item.unknownCode || 'unknown', bad: bad };
    }
    if (a.kind === 'multi') { // kilka pól liczbowych (uzupełnianie działania)
      const res = (a.values || []).map((v, i) => { const p = parseNum((response || [])[i]); return p && eq(p.v, v); });
      if (res.every(Boolean)) return { ok: true };
      const idx = res.findIndex(x => !x);
      return { ok: false, code: (item.multiCodes && item.multiCodes[idx]) || item.unknownCode || 'unknown', fields: res };
    }
    if (a.kind === 'pos') { // punkt na osi liczbowej (z tolerancją wynikającą z precyzji przeciągania)
      if (response == null || response === '' || isNaN(+response)) return { ok: false, code: 'format' };
      const v = +response, c = val(a.value), tol = a.tol != null ? a.tol : (a.step || 1) / 4;
      if (Math.abs(v - c) <= tol + 1e-9) return { ok: true };
      for (const w of (item.wrong || [])) if (w.v && Math.abs(v - val(w.v)) <= tol + 1e-9) return { ok: false, code: w.code };
      if (c !== 0 && Math.abs(v + c) <= tol + 1e-9) return { ok: false, code: item.signCode || 'sign' };
      return { ok: false, code: item.unknownCode || 'unknown' };
    }
    if (a.kind === 'shade') { // zamalowane części figury: liczy się wartość ułamka (równoważne zaznaczenia są dobre)
      const k = Array.isArray(response) ? response.length : +response; if (!k) return { ok: false, code: 'format' };
      const got = F(k, a.parts);
      if (eq(got, a.value)) return { ok: true };
      if (k === a.value.n && a.parts !== a.value.d) return { ok: false, code: 'frac_part_parts' };
      if (eq(got, sub(F(1, 1), a.value))) return { ok: false, code: 'frac_part_rest' };
      return { ok: false, code: 'calc' };
    }
    if (a.kind === 'cut') { // paski pocięte na wspólny mianownik: {k, n:[…], s}
      const r = response || {}; const k = +r.k;
      if (!k) return { ok: false, code: 'format' };
      if (a.dens.some(d => k % d !== 0)) return { ok: false, code: 'cut_notcommon' };
      const ns = (r.n || []).map(Number);
      for (let i = 0; i < a.fr.length; i++) { const want = a.fr[i].n * k / a.fr[i].d; if (ns[i] !== want) return { ok: false, code: ns[i] === a.fr[i].n ? 'frac_expand_num' : 'calc', field: i }; }
      if (a.res) { const sv = F(+r.s, k); if (r.s === '' || r.s == null || isNaN(+r.s)) return { ok: false, code: 'format' }; if (!eq(sv, a.res)) return { ok: false, code: 'calc', field: 'sum' }; }
      return { ok: true };
    }
    if (a.kind === 'bins') { // segregowanie do grup: response = {i: binIndex}
      const r = response || {}; let bad = 0; let code = null;
      a.bins.forEach((b, i) => { if (r[i] !== b) { bad++; code = code || (item.binCodes && item.binCodes[i]) || null; } });
      return bad ? { ok: false, code: code || item.unknownCode || 'unknown', bad } : { ok: true };
    }
    if (a.kind === 'point') { // punkt w układzie współrzędnych
      const r = response || {}; if (r.x == null || r.y == null) return { ok: false, code: 'format' };
      if (r.x === a.x && r.y === a.y) return { ok: true };
      if (r.x === a.y && r.y === a.x) return { ok: false, code: 'coord_swap' };
      for (const w of (item.wrongPts || [])) if (w.x === r.x && w.y === r.y) return { ok: false, code: w.code };
      if (Math.abs(r.x) === Math.abs(a.x) && Math.abs(r.y) === Math.abs(a.y)) return { ok: false, code: item.signCode || 'sign' };
      return { ok: false, code: item.unknownCode || 'unknown' };
    }
    if (a.kind === 'rect') { // prostokąt o zadanych własnościach: response = {a, b}
      const r = response || {}; const x = +r.a, y = +r.b; if (!x || !y) return { ok: false, code: 'format' };
      const area = x * y, per = 2 * (x + y);
      const okA = a.area == null || area === a.area, okP = a.per == null || per === a.per;
      if (okA && okP) return { ok: true };
      if (a.area != null && per === a.area) return { ok: false, code: 'area_perim' };
      if (a.per != null && area === a.per) return { ok: false, code: 'area_perim' };
      return { ok: false, code: okA ? 'perim_half' : 'calc' };
    }
    if (a.kind === 'cells') { // zaznaczone kratki
      const k = Array.isArray(response) ? response.length : 0; if (!k) return { ok: false, code: 'format' };
      if (k === a.count) return { ok: true };
      if (a.wrongCounts && a.wrongCounts[k]) return { ok: false, code: a.wrongCounts[k] };
      return { ok: false, code: 'calc' };
    }
    if (a.kind === 'multisel') { // wybór kilku elementów (np. dane potrzebne do zadania)
      const r = (response || []).slice().sort(); const w = a.set.slice().sort();
      if (r.length === w.length && r.every((x, i) => x === w[i])) return { ok: true };
      const extra = r.filter(x => !w.includes(x)), miss = w.filter(x => !r.includes(x));
      return { ok: false, code: extra.length ? (item.extraCode || 'read') : (item.missCode || 'read'), extra: extra.length, miss: miss.length };
    }
    return { ok: false, code: 'format' };
  }

  // ---------- budowanie zadań ----------
  // base: {prompt, value(F), form, wrong:[{v,code}], hints:[3], sol:[kroki], unknownCode, visual, unit}
  function asInput(base) {
    return Object.assign({}, base, { type: base.fill ? 'fill' : 'input', answer: { kind: 'num', value: base.value, form: base.form || 'any' } });
  }
  function labelOf(v, base) {
    if (base.fmt) return base.fmt(v);
    if (base.form === 'decimal' || base.dec) return fmtNum(v);
    return fmtF(v, base.form === 'improper' ? 'improper' : undefined);
  }
  function asChoice(r, base) {
    const correct = labelOf(base.value, base);
    const seen = new Set([plain(correct)]);
    const opts = [{ label: correct, ok: true }];
    const cv = val(base.value);
    for (const w of r.shuffle(base.wrong || [])) {
      if (!w.v || eq(w.v, base.value)) continue;
      if (!Number.isInteger(w.v.n) || !Number.isInteger(w.v.d)) continue; // dystraktor musi być „ładną” liczbą
      if (!base.allowNeg && cv > 0 && val(w.v) <= 0) continue;
      const l = labelOf(w.v, base);
      if (seen.has(plain(l))) continue;
      seen.add(plain(l)); opts.push({ label: l, code: w.code });
      if (opts.length >= 4) break;
    }
    let guard = 0;
    while (opts.length < 4 && guard++ < 40) {
      const c = base.value; let v;
      if (c.d === 1) v = F(c.n + r.pick([-3, -2, -1, 1, 2, 3, 10, -10]) * (Math.abs(c.n) > 50 ? 10 : 1), 1);
      else v = red(F(c.n + r.pick([-2, -1, 1, 2, 3]), c.d));
      if (cv > 0 && val(v) <= 0) continue;
      const l = labelOf(v, base);
      if (seen.has(plain(l))) continue;
      seen.add(plain(l)); opts.push({ label: l, code: 'calc' });
    }
    const sh = r.shuffle(opts);
    return Object.assign({}, base, { type: 'choice', options: sh, answer: { kind: 'choice', correct: sh.findIndex(o => o.ok) } });
  }
  // Zadanie „znajdź błąd": pokazujemy rozwiązanie, w którym jeden krok jest błędny
  function asError(r, base) {
    const ev = base.errorVersion;
    if (!ev) return null;
    const opts = ev.steps.map((s, i) => ({ label: 'Krok ' + (i + 1), code: i === ev.wrongIdx ? null : 'error_spot' }));
    opts.push({ label: 'Wszystko jest dobrze', code: 'error_spot' });
    return Object.assign({}, base, {
      type: 'error', steps: ev.steps, options: opts, errorWhy: ev.why, errorCode: ev.code,
      prompt: (ev.intro || 'Ola rozwiązała to zadanie, ale w jednym kroku się pomyliła. Który krok jest błędny?') + '<br><b>' + base.prompt.replace(/^Oblicz:?\s*/i, '') + '</b>',
      answer: { kind: 'choice', correct: ev.wrongIdx }
    });
  }
  function asWhy(r, skill) {
    const list = skill.why || [];
    if (!list.length) return null;
    const q = r.pick(list);
    const opts = r.shuffle(q.opts.map(o => ({ label: o.t, ok: !!o.ok, code: o.code || (o.ok ? null : skill.mainCode || 'concept') })));
    return { type: 'why', prompt: q.q, options: opts, answer: { kind: 'choice', correct: opts.findIndex(o => o.ok) }, hints: q.hints || ['Pomyśl, co naprawdę oznacza ta zasada.', q.expl, 'Przeczytaj każdą odpowiedź i sprawdź ją na małym przykładzie.'], sol: [q.expl], expl: q.expl };
  }
  function build(r, skill, d, type) {
    let base = skill.gen(r, d, type);
    if (base.type) return base;
    if (skill.allowNeg) base.allowNeg = true;
    if (skill.fmt && !base.fmt) base.fmt = skill.fmt; // generator zbudował gotowe zadanie (np. kolejność, dopasowanie)
    let it = null;
    if (type === 'choice') it = asChoice(r, base);
    else if (type === 'error') it = asError(r, base);
    if (!it) it = asInput(base);
    return it;
  }

  // Rysunki pieniędzy (uproszczone, z nominałem) – dziecko liczy to, co widzi, a nie słowo „2 zł”
  function moneySvg(list) { // list: [{v: 2, u: 'zł'} | {v: 50, u: 'gr'}]
    const COIN = { 'gr1': ['#c9834a', '#c9834a', 22], 'gr2': ['#c9834a', '#c9834a', 24], 'gr5': ['#c9834a', '#c9834a', 26], 'gr10': ['#cfd3d8', '#cfd3d8', 24], 'gr20': ['#cfd3d8', '#cfd3d8', 26], 'gr50': ['#cfd3d8', '#cfd3d8', 28], 'zł1': ['#d7dade', '#d7dade', 30], 'zł2': ['#e1b94a', '#cfd3d8', 31], 'zł5': ['#cfd3d8', '#e1b94a', 33] };
    const NOTE = { 10: '#c9a26b', 20: '#a48ac9', 50: '#6d97cf', 100: '#7fb07f', 200: '#d9c36a', 500: '#a9b8c9' };
    let x = 6, out = '', H = 80;
    list.forEach(m => {
      const key = m.u + m.v;
      if (COIN[key]) { const [inner, ring, r] = COIN[key]; const cx = x + r, cy = H / 2; out += '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="' + ring + '" stroke="#8a8f96" stroke-width="1.5"/>' + (inner !== ring ? '<circle cx="' + cx + '" cy="' + cy + '" r="' + (r * 0.66).toFixed(1) + '" fill="' + inner + '" stroke="#8a8f96" stroke-width="1"/>' : '') + '<text x="' + cx + '" y="' + (cy - 1) + '" text-anchor="middle" dominant-baseline="middle" font-size="' + (r > 27 ? 17 : 14) + '" font-weight="700" fill="#2b2b2b">' + m.v + '</text><text x="' + cx + '" y="' + (cy + 14) + '" text-anchor="middle" font-size="9" fill="#2b2b2b">' + m.u + '</text>'; x += 2 * r + 8; }
      else if (m.u === 'zł' && NOTE[m.v]) { out += '<rect x="' + x + '" y="12" width="112" height="56" rx="6" fill="' + NOTE[m.v] + '" stroke="#6f6f6f" stroke-width="1.5"/><rect x="' + (x + 6) + '" y="18" width="100" height="44" rx="4" fill="none" stroke="rgba(0,0,0,.25)"/><circle cx="' + (x + 30) + '" cy="40" r="13" fill="rgba(255,255,255,.35)"/><text x="' + (x + 80) + '" y="44" text-anchor="middle" font-size="22" font-weight="700" fill="#1f1f1f">' + m.v + '</text><text x="' + (x + 80) + '" y="60" text-anchor="middle" font-size="10" fill="#1f1f1f">złotych</text>'; x += 120; }
    });
    return '<svg viewBox="0 0 ' + Math.max(60, x) + ' ' + H + '" class="vis money" role="img" aria-label="' + list.map(m => m.v + ' ' + m.u).join(', ') + '" style="max-width:' + Math.min(100, Math.max(30, x / 6)) + '%">' + out + '</svg>';
  }
  MP.moneySvg = moneySvg;
  MP.util = { rng, gcd, lcm, F, red, add, sub, mul, div, eq, val, isSimplest, fromDec, fracM, fmtF, fmtImp, fmtDec, fmtDecK, fmtNum, plain, parseNum, pl, money };
  MP.items = { check, checkNum, asInput, asChoice, asError, asWhy, build };
})(MP);
