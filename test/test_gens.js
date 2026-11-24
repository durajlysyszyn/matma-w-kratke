// Testy generatorów: każde zadanie musi mieć poprawny klucz, rozpoznawać własną odpowiedź,
// nie mylić znanych błędów z poprawną odpowiedzią, mieć 3 wskazówki i rozwiązanie.
const path = require('path'); const A = (f) => require(path.join(__dirname, '..', 'src', f));
['core.js', 'errors.js', 'gens_a.js', 'gens_b.js', 'gens_c.js', 'gens_k2.js', 'gens_k13.js', 'gens_k4p.js', 'gens_k78.js', 'gens_ix.js', 'themes.js', 'curriculum.js', 'curriculum_more.js', 'engine.js', 'interact.js'].forEach(A);
const U = MP.util, I = MP.items;
let fails = 0, total = 0; const bad = {};
function fail(id, msg, it) { fails++; bad[id] = bad[id] || []; if (bad[id].length < 4) bad[id].push(msg + ' :: ' + U.plain(it && it.prompt || '').slice(0, 120)); }
function answerFor(it) {
  const a = it.answer;
  if (a.kind === 'num') { const v = a.value; if (v.d === 1) return String(v.n); if (a.form === 'decimal' || it.dec) { const s = U.plain(U.fmtNum(v)).replace('−', '-'); if (/,/.test(s) || /^-?\d+$/.test(s)) return s; } return (v.n < 0 ? '-' : '') + Math.abs(v.n) + '/' + v.d; }
  if (a.kind === 'choice') return a.correct;
  if (a.kind === 'order') return a.seq.slice();
  if (a.kind === 'match') return Object.assign({}, a.pairs);
  if (a.kind === 'multi') return a.values.map(v => v.d === 1 ? String(v.n) : U.plain(U.fmtNum(v)));
  if (a.kind === 'pos') return U.val(a.value);
  if (a.kind === 'shade') { const k = a.value.n * a.parts / a.value.d; return Array.from({ length: k }, (_, i) => i); }
  if (a.kind === 'cut') { const k = a.dens.reduce((x, y) => U.lcm(x, y)); return { k, n: a.fr.map(f => f.n * k / f.d), s: a.res ? a.res.n * k / a.res.d : undefined }; }
  if (a.kind === 'bins') return Object.assign({}, a.bins);
  if (a.kind === 'point') return { x: a.x, y: a.y };
  if (a.kind === 'rect') return { a: a.solA, b: a.solB };
  if (a.kind === 'cells') return Array.from({ length: a.count }, (_, i) => i);
  if (a.kind === 'multisel') return a.set.slice();
}
// niezależna weryfikacja kluczy zadań interaktywnych + sprawdzenie, że typowe błędy są rozpoznawane
function ixVerify(id, it, fail) {
  const a = it.answer, P = U.plain;
  if (a.kind === 'pos') {
    const ax = it.axis; const v = U.val(a.value); if (v < ax.min - 1e-9 || v > ax.max + 1e-9) fail(id, 'pos poza osią', it);
    const steps = (v - ax.min) / ax.step; if (Math.abs(steps - Math.round(steps)) > 1e-6) fail(id, 'pos nie na kresce', it);
    const m = P(it.prompt).match(/liczby (−?[\d ,\/]+)/); if (m) { const p = U.parseNum(m[1].trim().replace('−', '-')); if (p && !U.eq(p.v, a.value)) fail(id, 'pos klucz ≠ polecenie ' + m[1], it); }
    if (I.check(it, v + ax.step).ok) fail(id, 'pos: sąsiednia kreska zaakceptowana', it);
  }
  if (a.kind === 'shade') { if (a.parts !== it.parts || (a.value.n * a.parts) % a.value.d) fail(id, 'shade części', it); if (I.check(it, [0]).ok && a.value.n * a.parts / a.value.d !== 1) fail(id, 'shade 1 część ok', it); }
  if (a.kind === 'cut') {
    const L = a.dens.reduce((x, y) => U.lcm(x, y)); if (L > (it.cut.maxK || 24)) fail(id, 'cut: NWW > maxK', it);
    const r1 = I.check(it, { k: a.dens[0] * a.dens[1] + 1, n: [1, 1], s: 1 }); if (r1.ok || r1.code !== 'cut_notcommon') fail(id, 'cut: zły podział nie wykryty', it);
    const r2 = I.check(it, { k: L, n: a.fr.map(f => f.n), s: 0 }); if (a.fr.some(f => f.d !== L) && r2.code !== 'frac_expand_num') fail(id, 'cut: nierozszerzony licznik ' + r2.code, it);
    if (a.res) { const op = it.cut.op; const want = op === '+' ? U.add(a.fr[0], a.fr[1]) : U.sub(a.fr[0], a.fr[1]); if (!U.eq(want, a.res)) fail(id, 'cut: zły wynik w kluczu', it); }
  }
  if (a.kind === 'bins') { if (a.bins.length !== it.items.length) fail(id, 'bins długość', it); if (new Set(a.bins).size < 2) fail(id, 'bins: jedna grupa', it); if (new Set(it.items).size !== it.items.length) fail(id, 'bins: powtórka', it);
    it.items.forEach((x, i) => { const s = P(x); let truth = null;
      if (/właściwe/.test(P(it.prompt))) { const m = s.match(/(\d+)\/(\d+)/); truth = +m[1] < +m[2] ? 0 : 1; }
      else if (/podzielne przez (\d+)/.test(P(it.prompt))) { const k = +P(it.prompt).match(/podzielne przez (\d+)/)[1]; truth = (+s) % k === 0 ? 0 : 1; }
      else if (/dodatnie i ujemne/.test(P(it.prompt))) truth = /^[−-]/.test(s) ? 0 : 1;
      if (truth !== null && truth !== a.bins[i]) fail(id, 'bins: zły klucz dla ' + s, it); }); }
  if (a.kind === 'point') { const R = it.grid || 5; if (Math.abs(a.x) > R || Math.abs(a.y) > R) fail(id, 'point poza siatką', it);
    const m = P(it.prompt).match(/= \((−?\d+), (−?\d+)\)/); const n = (t) => +t.replace('−', '-');
    if (m) { const x = n(m[1]), y = n(m[2]); let t = [x, y]; if (/osi x/.test(it.prompt)) t = [x, -y]; else if (/osi y/.test(it.prompt)) t = [-x, y]; else if (/początku/.test(it.prompt)) t = [-x, -y]; if (t[0] !== a.x || t[1] !== a.y) fail(id, 'point klucz', it); }
    if (a.x !== a.y && I.check(it, { x: a.y, y: a.x }).ok) fail(id, 'point swap ok', it); }
  if (a.kind === 'rect') { if (a.solA > (it.rmax || 10) || a.solB > (it.rmax2 || 8)) fail(id, 'rect: rozwiązanie nie mieści się', it); }
  if (a.kind === 'order' && it.items) { if (a.seq.length !== it.items.length || new Set(a.seq).size !== a.seq.length) fail(id, 'order permutacja', it); }
  if (a.kind === 'multisel') { if (I.check(it, a.set.concat([3])).ok) fail(id, 'multisel: nadmiar ok', it); }
  if (MP.ix && MP.ix.has(it.type) === false && ['pos','shade','cut','bins','point','rect','cells','multisel'].includes(a.kind)) fail(id, 'brak komponentu', it);
}
const ids = Object.keys(MP.SK).filter(id => MP.isReady(id)); const THL = Object.keys(MP.THEMES);
for (const id of ids) {
  const skill = MP.SK[id];
  for (const d of [1, 2, 3]) {
    const types = (skill.types[d] || []).concat(skill.why ? ['why'] : []);
    for (const ty of types) {
      for (let k = 0; k < 170; k++) {
        total++;
        const spec = { skill: id, d, type: ty, seed: 1000 * k + d * 7 + ty.length, th: THL[k % THL.length] };
        let it;
        try { it = MP.engine.buildItem(spec); } catch (e) { fail(id, 'WYJĄTEK ' + d + '/' + ty + ': ' + e.message); continue; }
        if (!it || !it.answer) { fail(id, 'brak odpowiedzi', it); continue; }
        if (!it.prompt) fail(id, 'brak polecenia', it);
        if (!it.hints || it.hints.length < 3 || it.hints.some(h => !h || /undefined|NaN/.test(h))) fail(id, 'wskazówki ' + JSON.stringify(it.hints), it);
        if (!it.sol || !it.sol.length || it.sol.some(s => /undefined|NaN|Infinity/.test(s))) fail(id, 'rozwiązanie ' + JSON.stringify(it.sol), it);
        if (/undefined|NaN|Infinity|\[object|function|=>/.test(it.prompt)) fail(id, 'polecenie zepsute [' + spec.th + ']', it);
        const a = it.answer;
        if (a.kind === 'num') {
          if (!isFinite(U.val(a.value))) fail(id, 'wartość nieskończona', it);
          const wrongs = (it.wrong || []).filter(w => w.v && U.eq(w.v, a.value));
          // znany błąd nie może być równy poprawnej odpowiedzi (inaczej zła diagnoza) — to tylko ostrzeżenie, check() i tak najpierw sprawdza poprawność
          if ((it.wrong || []).some(w => w.v && !isFinite(U.val(w.v)))) fail(id, 'błędny wariant nieskończony', it);
          // klucz w postaci wymaganej formy musi przejść
          let ans = answerFor(it);
          if (a.form === 'mixed' && a.value.d !== 1 && Math.abs(a.value.n) > a.value.d) { const w = Math.floor(Math.abs(a.value.n) / a.value.d), r = Math.abs(a.value.n) % a.value.d; ans = (a.value.n < 0 ? '-' : '') + w + ' ' + r + '/' + a.value.d; }
          if (a.form === 'simplest' && a.value.d !== 1 && !U.isSimplest(a.value)) fail(id, 'klucz nieskrócony', it);
          const r = I.check(it, ans);
          if (!r.ok) fail(id, 'własna odpowiedź odrzucona: ' + ans + ' ' + JSON.stringify(r.code), it);
          // każdy znany błąd ≠ poprawnej i rozpoznany z właściwym kodem
          for (const w of (it.wrong || [])) { if (!w.v || U.eq(w.v, a.value)) continue; const wa = (w.v.n < 0 ? '-' : '') + Math.abs(w.v.n) + (w.v.d === 1 ? '' : '/' + w.v.d); const rr = I.check(it, wa); if (rr.ok) fail(id, 'błąd uznany za dobry', it); }
          // równoważna nieskrócona forma przy simplest -> partial
          if (a.form === 'simplest' && a.value.d > 1) { const rr = I.check(it, (a.value.n * 2) + '/' + (a.value.d * 2)); if (rr.ok || rr.code !== 'not_simplified') fail(id, 'nieskrócona forma nie wykryta', it); }
        } else if (a.kind === 'choice') {
          if (!it.options || it.options.length < 2) fail(id, 'za mało opcji', it);
          if (a.correct < 0 || a.correct >= it.options.length) fail(id, 'indeks poprawnej opcji', it);
          const labels = it.options.map(o => U.plain(o.label));
          if (new Set(labels).size !== labels.length) fail(id, 'powtórzone opcje ' + labels.join(' | '), it);
          if (it.options.filter(o => o.ok).length > 1) fail(id, 'kilka poprawnych opcji', it);
          if (!I.check(it, a.correct).ok) fail(id, 'choice: poprawna odrzucona', it);
          it.options.forEach((o, i) => { if (i !== a.correct && I.check(it, i).ok) fail(id, 'choice: zła uznana', it); });
          if (labels.some(l => /undefined|NaN/.test(l))) fail(id, 'opcja zepsuta ' + labels.join('|'), it);
          if (it.type === 'error' && (!it.steps || !it.steps.length)) fail(id, 'error bez kroków', it);
        } else if (a.kind === 'order') {
          if (!I.check(it, a.seq).ok) fail(id, 'order: poprawna odrzucona', it);
          if (new Set(it.items.map(U.plain)).size !== it.items.length) fail(id, 'order: duplikaty ' + it.items.join('|'), it);
        } else if (a.kind === 'match') {
          if (!I.check(it, Object.assign({}, a.pairs)).ok) fail(id, 'match: poprawna odrzucona', it);
          if (new Set(it.right.map(U.plain)).size !== it.right.length) fail(id, 'match: duplikaty', it);
        } else if (a.kind === 'multi') {
          const ans = answerFor(it); if (!I.check(it, ans).ok) fail(id, 'multi: poprawna odrzucona ' + JSON.stringify(ans), it);
          if (a.values.some(v => !isFinite(U.val(v)))) fail(id, 'multi nieskończone', it);
        } else {
          const ans = answerFor(it); const r = I.check(it, ans); if (!r.ok) fail(id, a.kind + ': poprawna odrzucona ' + JSON.stringify(ans) + ' ' + r.code, it);
        }
        if (it.type && MP.ix.has(it.type) || ['pos','shade','cut','bins','point','rect','cells','multisel'].includes(a.kind)) ixVerify(id, it, fail);
        if (it.type !== 'input' && it.type !== 'choice' && !it.aspect && !['why','error','fill','multi','order','match'].includes(it.type)) fail(id, 'brak aspektu', it);
      }
    }
  }
}
// porównanie z niezależnie liczoną wartością dla kilku umiejętności (weryfikacja klucza)
function verify(id, d, fn, n) { for (let k = 0; k < (n || 200); k++) { const it = MP.engine.buildItem({ skill: id, d, type: 'input', seed: 77 + k }); const exp = fn(U.plain(it.prompt)); if (exp === null) continue; total++; if (Math.abs(U.val(it.answer.value) - exp) > 1e-9) fail(id, 'klucz ≠ niezależne obliczenie ' + exp + ' vs ' + U.val(it.answer.value), it); } }
const num = (s) => +s.replace('−', '-').replace(',', '.');
const fracv = (s) => { const m = s.match(/^(\d+) (\d+)\/(\d+)$/); if (m) return +m[1] + m[2] / m[3]; const q = s.match(/^(\d+)\/(\d+)$/); if (q) return q[1] / q[2]; return num(s); };
verify('tabl', 1, (p) => { const m = p.match(/(\d+) · (\d+)$/); return m ? m[1] * m[2] : null; });
verify('ord_basic', 1, (p) => { const e = p.replace('Oblicz: ', '').replace(/·/g, '*').replace(/:/g, '/').replace(/−/g, '-'); return /^[\d+\-*/ ()]+$/.test(e) ? eval(e) : null; });
verify('ord_paren', 2, (p) => { const e = p.replace('Oblicz: ', '').replace(/·/g, '*').replace(/:/g, '/').replace(/−/g, '-').replace(/\)²/g, ')**2').replace(/(\d+)²/g, '($1**2)'); return /^[\d+\-*/ ()]+$/.test(e) ? eval(e) : null; });
verify('fr_add_diff', 2, (p) => { const m = p.match(/^Oblicz: (\d+)\/(\d+) ([+−]) (\d+)\/(\d+)$/); return m ? (m[1] / m[2] + (m[3] === '+' ? 1 : -1) * m[4] / m[5]) : null; });
verify('fr_mul', 2, (p) => { const m = p.match(/^Oblicz: (\d+)\/(\d+) · (\d+)\/(\d+)$/); return m ? (m[1] / m[2]) * (m[3] / m[4]) : null; });
verify('fr_div', 2, (p) => { const m = p.match(/^Oblicz: (.+) : (\d+)\/(\d+)$/); return m ? fracv(m[1]) / (m[2] / m[3]) : null; });
verify('fr_div', 3, (p) => { const m = p.match(/^Oblicz: (.+) : (\d+)\/(\d+)$/); return m ? fracv(m[1]) / (m[2] / m[3]) : null; });
verify('dec_mul', 2, (p) => { const m = p.match(/^Oblicz: ([\d,]+) · ([\d,]+)$/); return m ? num(m[1]) * num(m[2]) : null; });
verify('dec_add', 2, (p) => { const m = p.match(/^Oblicz: ([\d,]+) ([+−]) ([\d,]+)$/); return m ? (m[2] === '+' ? num(m[1]) + num(m[3]) : num(m[1]) - num(m[3])) : null; });
verify('int_add', 3, (p) => { const m = p.match(/^Oblicz: (−?\d+) ([+−]) \(?(−?\d+)\)?$/); return m ? (m[2] === '+' ? num(m[1]) + num(m[3]) : num(m[1]) - num(m[3])) : null; });
verify('int_mul', 1, (p) => { const m = p.match(/^Oblicz: (−?\d+) · \(?(−?\d+)\)?$/); return m ? num(m[1]) * num(m[2]) : null; });
verify('area_trap', 1, (p) => { const m = p.match(/podstawy (\d+) cm i (\d+) cm oraz wysokość (\d+)/); return m ? (+m[1] + +m[2]) * m[3] / 2 : null; });
verify('area_tri', 2, (p) => { const m = p.match(/podstawę (\d+) cm, wysokość (\d+) cm/); return m ? m[1] * m[2] / 2 : null; });
verify('pct_of', 2, (p) => { const m = p.match(/Oblicz (\d+)% z liczby (\d+)/); return m ? m[1] * m[2] / 100 : null; });
verify('eq_solve', 2, (p) => { const m = p.match(/(\d+)x \+ (\d+) = (\d+)/); return m ? (m[3] - m[2]) / m[1] : null; });
verify('speed', 1, (p) => { const m = p.match(/prędkością (\d+) km\/h przez (\d+) h/); return m ? m[1] * m[2] : null; });
verify('nww', 1, (p) => { const m = p.match(/NWW\((\d+), (\d+)\)/); if (!m) return null; const a = +m[1], b = +m[2]; let l = Math.max(a, b); while (l % a || l % b) l++; return l; });
verify('nwd', 2, (p) => { const m = p.match(/NWD\((\d+), (\d+)\)/); if (!m) return null; let a = +m[1], b = +m[2]; while (b) [a, b] = [b, a % b]; return a; });
verify('dec_shift', 2, (p) => { const m = p.match(/^Oblicz: ([\d,]+) ([·:]) (\d+)$/); return m ? (m[2] === '·' ? num(m[1]) * m[3] : num(m[1]) / m[3]) : null; });

// parser
const P = (s) => { const p = U.parseNum(s); return p ? U.val(p.v) : null; };
const cases = [['3/4', 0.75], ['1 1/2', 1.5], ['0,25', 0.25], ['−3', -3], ['-2,5', -2.5], ['12 cm²', 12], ['4,75 zł', 4.75], ['12 500', 12500], [' 7 ', 7], ['abc', null], ['1/0', null], ['2i1/3', 7 / 3], ['90°', 90], ['35%', 35], [',5', 0.5]];
cases.forEach(([s, v]) => { total++; const got = P(s); if ((v === null && got !== null) || (v !== null && (got === null || Math.abs(got - v) > 1e-9))) { fails++; console.log('PARSER', s, got, v); } });

// --- niezależna weryfikacja kluczy dla nowych umiejętności ---
verify('k1_add', 3, (p) => { const m = p.match(/^Oblicz: (\d+) \+ (\d+)$/); return m ? +m[1] + +m[2] : null; });
verify('k1_sub', 3, (p) => { const m = p.match(/^Oblicz: (\d+) − (\d+)$/); return m ? m[1] - m[2] : null; });
verify('k3_add', 3, (p) => { const m = p.match(/^Oblicz: (\d+) ([+−]) (\d+)$/); return m ? (m[2] === '+' ? +m[1] + +m[3] : m[1] - m[3]) : null; });
verify('nat_mental', 2, (p) => { const m = p.match(/: ([\d ]+) − (\d+)$/); return m ? +m[1].replace(/ /g, '') - m[2] : null; });
verify('pyth', 1, (p) => { const m = p.match(/mają (\d+) cm i (\d+) cm/); return m ? Math.hypot(+m[1], +m[2]) : null; });
verify('pyth', 2, (p) => { const m = p.match(/ma (\d+) cm, a jedna przyprostokątna (\d+) cm/); return m ? Math.sqrt(m[1] * m[1] - m[2] * m[2]) : null; });
verify('poly_reg', 1, (p) => { const N = { 'czworokąta': 4, 'pięciokąta': 5, 'sześciokąta': 6, 'siedmiokąta': 7, 'ośmiokąta': 8, 'dziesięciokąta': 10 }; const m = p.match(/kątów wewnętrznych (\S+)\?/); return m && N[m[1]] ? (N[m[1]] - 2) * 180 : null; });
verify('combin', 3, (p) => { const m = p.match(/gra (\d+) zawodników/); return m ? m[1] * (m[1] - 1) / 2 : null; });
verify('prop_div', 1, (p) => { const m = p.match(/Podziel (\d+) w stosunku (\d+) : (\d+)/); return m ? m[1] / (+m[2] + +m[3]) * Math.max(+m[2], +m[3]) : null; });
verify('mean', 1, (p) => { const m = p.match(/matematyki: ([\d, ]+)\./); if (!m) return null; const a = m[1].split(', ').map(Number); return a.reduce((x, y) => x + y, 0) / a.length; });
verify('median', 1, (p) => { const m = p.match(/danych: ([\d, ]+)\./); if (!m) return null; const a = m[1].split(', ').map(Number).sort((x, y) => x - y); const n = a.length; return n % 2 ? a[(n - 1) / 2] : (a[n / 2 - 1] + a[n / 2]) / 2; });
verify('eq_lin', 1, (p) => { const m = p.match(/równanie: (\d*)x ([+−]) (\d+) = (\d*)x ([+−]) (\d+)$/); if (!m) return null; const a = +(m[1] || 1), b = (m[2] === '+' ? 1 : -1) * m[3], c = +(m[4] || 1), e = (m[5] === '+' ? 1 : -1) * m[6]; return (e - b) / (a - c); });
verify('vat', 1, (p) => { const m = p.match(/netto roweru wynosi ([\d ]+) zł. VAT wynosi (\d+)%/); return m ? +m[1].replace(/ /g, '') * (100 + +m[2]) / 100 : null; });
verify('pct_whole', 1, (p) => { const m = p.match(/^(\d+)% pewnej liczby to (\d+)\./); return m ? m[2] * 100 / m[1] : null; });
verify('k3_box', 3, (p) => { const m = p.match(/^□ : (\d+) = (\d+)$/); return m ? m[1] * m[2] : null; });

console.log('Po weryfikacji: zadań', total, 'błędów', fails); for (const k in bad) console.log(' ✗', k, bad[k].join(' | '));

console.log('Sprawdzonych zadań:', total, ' Błędów:', fails);
Object.keys(bad).forEach(k => console.log(' ✗', k, '\n    ' + bad[k].join('\n    ')));
process.exit(fails ? 1 : 0);
