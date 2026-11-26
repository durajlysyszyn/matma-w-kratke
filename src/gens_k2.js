/* gens_k2.js — generatory dla klasy 2 (edukacja matematyczna, podstawa 2017)
   oraz działania pisemne (klasy 4–5). Język poleceń prosty, liczby w zakresie 100 (mnożenie i dzielenie do 50). */
var MP = (typeof window !== 'undefined' ? window : globalThis).MP;
(function (MP) {
  const U = MP.util, { F } = U;
  const SK = MP.SK, def = (id, o) => { o.id = id; SK[id] = o; };
  const N = (n) => F(n, 1), pl = U.pl;
  const { cmpGen } = MP.gensHelpers;
  const KIDS = [['Ola', 'f'], ['Kuba', 'm'], ['Zosia', 'f'], ['Antek', 'm'], ['Hania', 'f'], ['Staś', 'm'], ['Lena', 'f'], ['Franek', 'm']];
  const vg = (g, m, f) => g === 'f' ? f : m; // forma czasownika wg rodzaju

  // ---------- rysunki ----------
  const svgW = (w, h, body, label) => '<svg viewBox="0 0 ' + w + ' ' + h + '" class="vis geo" role="img" aria-label="' + label + '">' + body + '</svg>';
  function tensSvg(t, u) { // dziesiątki jako pionowe słupki, jedności jako kostki
    let s = ''; for (let i = 0; i < t; i++) { for (let k = 0; k < 10; k++) s += '<rect x="' + (10 + i * 22) + '" y="' + (10 + k * 13) + '" width="16" height="11" rx="2" class="barc"/>'; }
    for (let j = 0; j < u; j++) s += '<rect x="' + (20 + t * 22 + (j % 3) * 18) + '" y="' + (106 - Math.floor(j / 3) * 18) + '" width="14" height="14" rx="2" class="sh"/>';
    return svgW(30 + t * 22 + 60, 140, s, t + ' dziesiątek i ' + u + ' jedności');
  }
  function dotsSvg(rows, cols) { let s = ''; for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) s += '<circle cx="' + (18 + j * 26) + '" cy="' + (18 + i * 26) + '" r="9" class="barc"/>'; return svgW(cols * 26 + 10, rows * 26 + 10, s, rows + ' rzędy po ' + cols + ' kropek'); }
  function clockSvg(h, m) {
    let s = '<circle cx="80" cy="80" r="72" class="un" style="stroke-width:3"/>';
    for (let i = 1; i <= 12; i++) { const a = i * Math.PI / 6; s += '<text x="' + (80 + 56 * Math.sin(a)).toFixed(1) + '" y="' + (80 - 56 * Math.cos(a)).toFixed(1) + '" class="lb" text-anchor="middle" dominant-baseline="middle">' + i + '</text>'; }
    for (let i = 0; i < 60; i++) { const a = i * Math.PI / 30, r1 = i % 5 ? 68 : 64; s += '<line x1="' + (80 + r1 * Math.sin(a)).toFixed(1) + '" y1="' + (80 - r1 * Math.cos(a)).toFixed(1) + '" x2="' + (80 + 71 * Math.sin(a)).toFixed(1) + '" y2="' + (80 - 71 * Math.cos(a)).toFixed(1) + '" class="grid"/>'; }
    const ha = ((h % 12) + m / 60) * Math.PI / 6, ma = m * Math.PI / 30;
    s += '<line x1="80" y1="80" x2="' + (80 + 34 * Math.sin(ha)).toFixed(1) + '" y2="' + (80 - 34 * Math.cos(ha)).toFixed(1) + '" class="ln" style="stroke-width:6"/>';
    s += '<line x1="80" y1="80" x2="' + (80 + 54 * Math.sin(ma)).toFixed(1) + '" y2="' + (80 - 54 * Math.cos(ma)).toFixed(1) + '" class="ln" style="stroke:var(--pen);stroke-width:3.5"/><circle cx="80" cy="80" r="5" class="barc"/>';
    return '<svg viewBox="0 0 160 160" class="vis geo" style="width:180px" role="img" aria-label="zegar ze wskazówkami">' + s + '</svg>';
  }
  function shapeSvg(k) {
    const B = { 'trójkąt': '<polygon points="20,130 160,130 90,20" class="shape"/>', 'kwadrat': '<rect x="35" y="25" width="110" height="110" class="shape"/>', 'prostokąt': '<rect x="15" y="45" width="160" height="80" class="shape"/>', 'koło': '<circle cx="90" cy="80" r="60" class="shape"/>', 'pięciokąt': '<polygon points="90,15 160,65 133,140 47,140 20,65" class="shape"/>', 'sześciokąt': '<polygon points="50,20 130,20 170,80 130,140 50,140 10,80" class="shape"/>' };
    return svgW(180, 160, B[k], 'figura');
  }
  MP.draw.clockSvg = clockSvg;

  // ===================== LICZBY DO 100 =====================
  def('k2_dj', {
    name: 'Dziesiątki i jedności', grade: 2, mainCode: 'k2_dj_swap',
    types: { 1: ['multi'], 2: ['input', 'choice'], 3: ['input', 'choice'] },
    gen(r, d) {
      const t = r.int(1, 9), u = r.int(1, 9), n = t * 10 + u;
      if (d === 1) return { type: 'multi', prompt: 'Ile dziesiątek i ile jedności ma liczba <b>' + n + '</b>?', visual: tensSvg(t, u), labels: ['dziesiątki', 'jedności'], answer: { kind: 'multi', values: [N(t), N(u)] }, multiCodes: ['k2_dj_swap', 'k2_dj_swap'],
        hints: ['Pierwsza cyfra (z lewej) mówi, ile jest dziesiątek.', 'Ostatnia cyfra mówi, ile jest jedności.', 'Na rysunku policz słupki (dziesiątki) i kostki (jedności).'], sol: [n + ' = ' + t + ' dziesiątek i ' + u + ' jedności', n + ' = ' + t * 10 + ' + ' + u] };
      if (d === 2) return { prompt: 'Jaka liczba ma <b>' + t + '</b> ' + pl(t, 'dziesiątkę', 'dziesiątki', 'dziesiątek') + ' i <b>' + u + '</b> ' + pl(u, 'jedność', 'jedności', 'jedności') + '?', value: N(n), wrong: [{ v: N(u * 10 + t), code: 'k2_dj_swap' }, { v: N(t + u), code: 'k2_dj_sum' }],
        hints: [t + ' dziesiątek to ' + t * 10 + '.', 'Dodaj do tego ' + u + ' jedności.', t * 10 + ' + ' + u + ' = ?'], sol: [t + ' dziesiątek = ' + t * 10, t * 10 + ' + ' + u + ' = ' + n] };
      const t2 = r.int(2, 7), u2 = r.int(11, 19), v = t2 * 10 + u2;
      return { prompt: 'Jaka liczba ma <b>' + t2 + '</b> ' + pl(t2, 'dziesiątkę', 'dziesiątki', 'dziesiątek') + ' i <b>' + u2 + '</b> jedności?', value: N(v), wrong: [{ v: N(+(String(t2) + String(u2))), code: 'k2_dj_concat' }, { v: N(t2 + u2), code: 'k2_dj_sum' }],
        hints: ['Uwaga: jedności jest więcej niż 9! Z 10 jedności robi się 1 dziesiątka.', u2 + ' jedności = 1 dziesiątka i ' + (u2 - 10) + ' jedności.', 'Razem ' + (t2 + 1) + ' dziesiątek i ' + (u2 - 10) + ' jedności.'], sol: [t2 * 10 + ' + ' + u2 + ' = ' + v] };
    },
    why: [{ q: 'Co oznacza cyfra 4 w liczbie 47?', opts: [{ t: '4 dziesiątki, czyli 40', ok: true }, { t: '4 jedności', code: 'k2_dj_swap' }, { t: 'Nic – liczy się tylko 7', code: 'concept' }], expl: 'W liczbie 47 cyfra 4 stoi na miejscu dziesiątek: to 40. Cyfra 7 to jedności.' }]
  });

  def('k2_cmp', {
    name: 'Porównywanie liczb do 100', grade: 2, mainCode: 'k2_cmp_units', prereq: ['k2_dj'],
    types: { 1: ['choice'], 2: ['choice'], 3: ['choice', 'order'] },
    gen(r, d, type) {
      return cmpGen(r, d, type, (mode) => {
        if (mode === 'order') {
          const s = new Set(); while (s.size < 4) s.add(r.int(11, 99));
          const arr = [...s]; const vals = arr.map(N);
          const byU = vals.map((v, i) => i).sort((i, j) => arr[i] % 10 - arr[j] % 10 || arr[i] - arr[j]);
          return { vals, wrongSorts: [{ order: byU, code: 'k2_cmp_units' }], code: 'k2_cmp_units', hints: ['Najpierw patrz na dziesiątki (pierwszą cyfrę).', 'Mniej dziesiątek = mniejsza liczba.', 'Gdy dziesiątki są takie same, porównaj jedności.'] };
        }
        let a, b;
        if (d === 1) { a = r.int(1, 9) * 10 + r.int(0, 9); b = r.int(1, 9) * 10 + r.int(0, 9); if (Math.floor(a / 10) === Math.floor(b / 10)) b = (b + 20) % 100 || 15; }
        else { const t = r.int(1, 8), u = r.int(0, 9); if (r.chance(0.5)) { a = t * 10 + u; b = u === 0 ? (t + 1) * 10 + r.int(1, 9) : u * 10 + t; if (a === b) b = a + 9; } else { a = t * 10 + r.int(0, 9); b = t * 10 + r.int(0, 9); } }
        if (r.chance(0.12)) b = a;
        const sym = a < b ? 0 : a > b ? 1 : 2, byU = (a % 10) < (b % 10) ? 0 : (a % 10) > (b % 10) ? 1 : 2;
        const mis = {}; if (byU !== sym) mis[byU] = 'k2_cmp_units';
        return { vals: [N(a), N(b)], miscon: mis, hints: ['Porównaj najpierw dziesiątki.', Math.floor(a / 10) + ' dziesiątek i ' + Math.floor(b / 10) + ' dziesiątek – gdzie więcej?', 'Gdy dziesiątki są równe, patrz na jedności.'], sol: (s) => [a + ' ' + s + ' ' + b] };
      }, (v) => String(v.n));
    },
    why: [{ q: 'Dlaczego 52 > 29, chociaż 9 > 2?', opts: [{ t: 'Bo 5 dziesiątek to więcej niż 2 dziesiątki', ok: true }, { t: 'To nieprawda – 29 jest większe', code: 'k2_cmp_units' }, { t: 'Bo 5 + 2 > 2 + 9', code: 'concept' }], expl: 'Dziesiątki są „ważniejsze" od jedności: 50 to dużo więcej niż 20.' }]
  });

  def('k2_parity', {
    name: 'Liczby parzyste i nieparzyste', grade: 2, mainCode: 'k2_parity',
    types: { 1: ['choice'], 2: ['choice'], 3: ['input', 'choice'] },
    gen(r, d, type) {
      const isEven = (x) => x % 2 === 0;
      if (d === 3 && type === 'choice') {
        // inne pytanie niż w wersji otwartej: wybór listy, w której są same liczby parzyste / nieparzyste
        const even = r.chance(0.5), want = (x) => isEven(x) === even;
        const mk = (good) => { const out = []; let g = 0; while (out.length < 4 && g++ < 200) { const x = r.int(11, 98); if (out.includes(x)) continue; if (good ? want(x) : true) out.push(x); } if (!good && out.every(want)) out[r.int(0, 3)] += 1; return out.sort((a, b) => a - b); };
        const opts = [{ label: mk(true).join(', '), ok: true }];
        let g = 0; while (opts.length < 4 && g++ < 50) { const l = mk(false); if (l.every(want)) continue; const lab = l.join(', '); if (!opts.some(o => o.label === lab)) opts.push({ label: lab, code: 'k2_parity' }); }
        const sh = r.shuffle(opts);
        return { type: 'choice', prompt: 'W której grupie są <b>same liczby ' + (even ? 'parzyste' : 'nieparzyste') + '</b>?', options: sh, answer: { kind: 'choice', correct: sh.findIndex(o => o.ok) },
          hints: ['Patrz tylko na ostatnią cyfrę każdej liczby.', 'Parzyste kończą się na 0, 2, 4, 6, 8. Nieparzyste – na 1, 3, 5, 7, 9.', 'Wystarczy jedna liczba nie na miejscu, żeby grupa odpadła.'], sol: ['Same ' + (even ? 'parzyste' : 'nieparzyste') + ': ' + sh.find(o => o.ok).label + '.'] };
      }
      if (d === 3) {
        // różne przedziały i różne pytania – nie zawsze „od x1 do x1+10” i nie zawsze 5
        const even = r.chance(0.6), word = even ? 'parzystych' : 'nieparzystych', want = (x) => isEven(x) === even;
        const a = r.int(10, 80), len = r.pick([5, 6, 7, 8, 9, 11, 12]), b = a + len, incl = r.chance(0.5);
        const lo = incl ? a : a + 1, hi = incl ? b : b - 1; const list = []; for (let x = lo; x <= hi; x++) if (want(x)) list.push(x);
        const v = list.length;
        const prompt = incl ? 'Ile jest liczb <b>' + word + '</b> od ' + a + ' do ' + b + ' (razem z ' + a + ' i ' + b + ')?' : 'Ile jest liczb <b>' + word + '</b> większych od ' + a + ' i mniejszych od ' + b + '?';
        return { prompt, value: N(v), wrong: [{ v: N(v + 1), code: 'k2_parity' }, { v: N(Math.max(1, v - 1)), code: 'k2_parity' }, { v: N(hi - lo + 1), code: 'read' }].filter(w => w.v.n !== v), hints: ['Wypisz liczby od ' + lo + ' do ' + hi + ' na kartce.', 'Zakreśl te, które kończą się na ' + (even ? '0, 2, 4, 6 albo 8' : '1, 3, 5, 7 albo 9') + '.', 'Policz zakreślone liczby.'], sol: [list.join(', '), 'To ' + v + ' ' + pl(v, 'liczba', 'liczby', 'liczb') + '.'], countOf: list };
      }
      const max = d === 1 ? 20 : 99, even = r.chance(0.5);
      const pick = (want) => { let x; do { x = r.int(2, max); } while ((x % 2 === 0) !== want); return x; };
      const right = pick(even);
      const opts = [{ label: String(right), ok: true }];
      while (opts.length < 4) { let x = pick(!even); if (d === 2 && r.chance(0.6)) { const t = r.int(1, 9); x = t * 10 + (even ? r.pick([1, 3, 5, 7, 9]) : r.pick([0, 2, 4, 6, 8])); if (even && t % 2) x = (t + 1) * 10 % 100 + x % 10; } if (!opts.some(o => o.label === String(x)) && x % 2 !== (even ? 0 : 1) && x > 1) opts.push({ label: String(x), code: 'k2_parity' }); }
      const sh = r.shuffle(opts);
      return { type: 'choice', prompt: 'Która liczba jest <b>' + (even ? 'parzysta' : 'nieparzysta') + '</b>?', options: sh, answer: { kind: 'choice', correct: sh.findIndex(o => o.ok) },
        hints: ['Parzystą liczbę da się podzielić na dwie równe części – „na pół, bez reszty".', 'Patrz tylko na OSTATNIĄ cyfrę: 0, 2, 4, 6, 8 – parzysta; 1, 3, 5, 7, 9 – nieparzysta.', 'Ostatnia cyfra liczby ' + right + ' to ' + right % 10 + '.'], sol: [right + ' kończy się na ' + right % 10 + ', więc jest ' + (even ? 'parzysta' : 'nieparzysta') + '.'] };
    }
  });

  def('k2_seq', {
    name: 'Ciągi liczbowe i rytmy', grade: 2, mainCode: 'k2_seq',
    types: { 1: ['input', 'choice'], 2: ['input', 'choice'], 3: ['input', 'choice'] },
    gen(r, d) {
      // kilka rodzajów reguł; brakująca liczba nie zawsze na końcu
      const kinds = d === 1 ? ['up', 'up', 'down'] : d === 2 ? ['up', 'down', 'down', 'mid'] : ['grow', 'alt', 'mid', 'down2'];
      const kind = r.pick(kinds); let seq, desc, step;
      if (kind === 'up' || kind === 'down') {
        step = d === 1 ? r.pick([2, 3, 5, 10]) : r.pick([3, 4, 6, 7, 8, 9, 11]);
        const up = kind === 'up';
        const s0 = up ? r.int(0, 100 - 5 * step) : r.int(5 * step, 100);
        seq = [0, 1, 2, 3, 4].map(i => s0 + (up ? 1 : -1) * i * step); desc = 'co ' + step + (up ? ' w górę' : ' w dół');
      } else if (kind === 'mid') {
        step = r.pick([2, 3, 4, 5, 6, 10]); const up = r.chance(0.5); const s0 = up ? r.int(1, 100 - 5 * step) : r.int(5 * step, 99);
        seq = [0, 1, 2, 3, 4].map(i => s0 + (up ? 1 : -1) * i * step); desc = 'co ' + step + (up ? ' w górę' : ' w dół');
      } else if (kind === 'grow') {
        const s0 = r.int(1, 20), inc = r.pick([1, 2]); seq = [s0]; for (let i = 0; i < 4; i++) seq.push(seq[i] + inc * (i + 1)); desc = 'skoki rosną: ' + [1, 2, 3, 4].map(i => '+' + inc * i).join(', ');
      } else if (kind === 'alt') {
        const p = r.int(3, 9), q = r.int(1, p - 1), s0 = r.int(5, 40); seq = [s0]; for (let i = 0; i < 4; i++) seq.push(seq[i] + (i % 2 ? -q : p)); desc = 'na zmianę: +' + p + ', −' + q;
      } else { // down2: odejmujemy coraz mniej
        const s0 = r.int(60, 99); seq = [s0]; for (let i = 0; i < 4; i++) seq.push(seq[i] - (5 - i)); desc = 'skoki maleją: −5, −4, −3, −2';
      }
      const gap = kind === 'mid' ? r.int(1, 3) : 4;
      const value = seq[gap]; const shown = seq.map((x, i) => i === gap ? '□' : String(x)); const shownSeq = gap === 4 ? shown.slice(0, 5) : shown;
      const near = [value + 1, value - 1, gap > 0 ? seq[gap - 1] + 1 : value + 2].filter(x => x > 0 && x !== value);
      return { prompt: (gap === 4 ? 'Jaka liczba będzie następna?' : 'Jakiej liczby brakuje?') + '<br><b>' + shownSeq.join(', ') + (gap === 4 ? '' : '') + '</b>', value: N(value), wrong: near.map(x => ({ v: N(x), code: 'k2_seq' })),
        hints: ['Sprawdź, o ile zmienia się każda kolejna liczba.', 'Policz różnice między sąsiednimi liczbami, które widzisz.', 'Reguła: ' + desc + '.'], sol: ['Reguła: ' + desc, (gap === 4 ? 'Następna: ' : 'Brakuje: ') + value] };
    }
  });

  // ===================== DODAWANIE I ODEJMOWANIE =====================
  function noCarry(a, b) { return Math.floor(a / 10) * 10 + Math.floor(b / 10) * 10 + (a % 10 + b % 10) % 10; }
  def('k2_add', {
    name: 'Dodawanie w zakresie 100', grade: 2, mainCode: 'k2_carry', prereq: ['k2_dj'],
    types: { 1: ['input', 'choice'], 2: ['input', 'choice', 'error'], 3: ['input', 'choice'] },
    gen(r, d) {
      let a, b;
      if (d === 1) { if (r.chance(0.4)) { a = r.int(1, 6) * 10; b = r.int(1, 9 - a / 10) * 10; } else { a = r.int(1, 8) * 10 + r.int(0, 5); b = r.int(1, 9 - a % 10); } }
      else if (d === 2) { a = r.int(1, 8) * 10 + r.int(3, 9); b = r.int(10 - a % 10, 9); }
      else { do { a = r.int(1, 6) * 10 + r.int(3, 9); b = r.int(1, 3) * 10 + r.int(10 - a % 10, 9); } while (a + b > 99); }
      const s = a + b, carry = (a % 10 + b % 10) >= 10;
      const wrong = [{ v: N(s + 1), code: 'calc' }, { v: N(s - 1), code: 'calc' }];
      if (carry) wrong.unshift({ v: N(noCarry(a, b)), code: 'k2_carry' });
      const toTen = 10 - a % 10;
      const story = d < 3 && MP.storyAS ? MP.storyAS(r, a, b, false) : null;
      return { prompt: story || 'Oblicz: ' + a + ' + ' + b, value: N(s), wrong,
        errorVersion: carry ? { steps: ['Jedności: ' + a % 10 + ' + ' + b % 10 + ' = ' + (a % 10 + b % 10) + ', piszę ' + (a % 10 + b % 10) % 10, 'Dziesiątki: ' + Math.floor(a / 10) + ' + ' + Math.floor(b / 10) + ' = ' + (Math.floor(a / 10) + Math.floor(b / 10)), 'Wynik: ' + noCarry(a, b)], wrongIdx: 1, code: 'k2_carry', why: 'Z jedności zrobiła się jeszcze jedna dziesiątka – trzeba ją dodać do dziesiątek.', intro: 'Kuba liczył i wyszło mu ' + noCarry(a, b) + '. Gdzie się pomylił?' } : null,
        hints: carry ? ['Dopełnij do pełnej dziesiątki.', b < 10 ? a + ' + ' + toTen + ' = ' + (a + toTen) + '. Zostaje jeszcze ' + (b - toTen) + '.' : 'Najpierw dodaj dziesiątki: ' + a + ' + ' + Math.floor(b / 10) * 10 + ' = ' + (a + Math.floor(b / 10) * 10) + '.', b < 10 ? (a + toTen) + ' + ' + (b - toTen) + ' = ?' : 'Teraz dodaj jedności: ' + (a + Math.floor(b / 10) * 10) + ' + ' + b % 10 + '.']
          : ['Dodaj osobno dziesiątki i jedności.', 'Dziesiątki: ' + Math.floor(a / 10) + ' + ' + Math.floor(b / 10) + ', jedności: ' + a % 10 + ' + ' + b % 10 + '.', 'Połącz wynik.'],
        sol: carry && b < 10 ? [a + ' + ' + toTen + ' = ' + (a + toTen), (a + toTen) + ' + ' + (b - toTen) + ' = ' + s] : [a + ' + ' + Math.floor(b / 10) * 10 + ' = ' + (a + Math.floor(b / 10) * 10), (a + Math.floor(b / 10) * 10) + ' + ' + b % 10 + ' = ' + s] };
    },
    why: [{ q: 'Jak łatwo policzyć 38 + 5?', opts: [{ t: '38 + 2 = 40, potem 40 + 3 = 43', ok: true }, { t: '8 + 5 = 13, więc 313', code: 'k2_carry' }, { t: '8 + 5 = 13, piszę 3, wynik 33', code: 'k2_carry' }], expl: 'Najpierw dopełniamy do pełnej dziesiątki (40), a potem dodajemy resztę.' }]
  });

  def('k2_sub', {
    name: 'Odejmowanie w zakresie 100', grade: 2, mainCode: 'k2_borrow', prereq: ['k2_add'],
    types: { 1: ['input', 'choice'], 2: ['input', 'choice', 'error'], 3: ['input', 'choice'] },
    gen(r, d) {
      let a, b;
      if (d === 1) { if (r.chance(0.4)) { a = r.int(3, 9) * 10; b = r.int(1, a / 10 - 1) * 10; } else { a = r.int(2, 9) * 10 + r.int(4, 9); b = r.int(1, a % 10); if (r.chance(0.5)) b += r.int(1, Math.floor(a / 10) - 1) * 10; } }
      else if (d === 2) { a = r.int(2, 9) * 10 + r.int(0, 6); b = r.int(a % 10 + 1, 9); }
      else { a = r.int(4, 9) * 10 + r.int(0, 6); b = r.int(1, Math.floor(a / 10) - 2) * 10 + r.int(a % 10 + 1, 9); }
      const v = a - b, borrow = (a % 10) < (b % 10);
      const flip = (Math.floor(a / 10) - Math.floor(b / 10)) * 10 + Math.abs(a % 10 - b % 10);
      const wrong = [{ v: N(v + 1), code: 'calc' }, { v: N(a + b), code: 'op_confuse' }];
      if (borrow) wrong.unshift({ v: N(flip), code: 'k2_borrow' }, { v: N(v + 10), code: 'k2_borrow' });
      const down = a % 10;
      const story = d < 3 && MP.storyAS ? MP.storyAS(r, a, b, true) : null;
      return { prompt: story || 'Oblicz: ' + a + ' − ' + b, value: N(v), wrong,
        errorVersion: borrow ? { steps: ['Jedności: ' + b % 10 + ' − ' + a % 10 + ' = ' + Math.abs(a % 10 - b % 10), 'Dziesiątki: ' + Math.floor(a / 10) + ' − ' + Math.floor(b / 10) + ' = ' + (Math.floor(a / 10) - Math.floor(b / 10)), 'Wynik: ' + flip], wrongIdx: 0, code: 'k2_borrow', why: 'Nie wolno odwracać odejmowania! Z ' + a % 10 + ' nie odejmiesz ' + b % 10 + ' – trzeba „rozmienić" jedną dziesiątkę.', intro: 'Ola liczyła i wyszło jej ' + flip + '. Gdzie się pomyliła?' } : null,
        hints: borrow ? ['Odejmuj „do pełnej dziesiątki".', b < 10 ? a + ' − ' + down + ' = ' + (a - down) + '. Musisz odjąć jeszcze ' + (b - down) + '.' : 'Najpierw odejmij dziesiątki: ' + a + ' − ' + Math.floor(b / 10) * 10 + ' = ' + (a - Math.floor(b / 10) * 10) + '.', b < 10 ? (a - down) + ' − ' + (b - down) + ' = ?' : 'Teraz odejmij jedności: ' + (a - Math.floor(b / 10) * 10) + ' − ' + b % 10 + '.']
          : ['Odejmij osobno dziesiątki i jedności.', 'Dziesiątki: ' + Math.floor(a / 10) + ' − ' + Math.floor(b / 10) + ', jedności: ' + a % 10 + ' − ' + b % 10 + '.', 'Sprawdź dodawaniem: wynik + ' + b + ' powinno dać ' + a + '.'],
        sol: borrow && b < 10 ? [a + ' − ' + down + ' = ' + (a - down), (a - down) + ' − ' + (b - down) + ' = ' + v, 'Sprawdzenie: ' + v + ' + ' + b + ' = ' + a] : [a + ' − ' + Math.floor(b / 10) * 10 + ' = ' + (a - Math.floor(b / 10) * 10), (a - Math.floor(b / 10) * 10) + ' − ' + b % 10 + ' = ' + v, 'Sprawdzenie: ' + v + ' + ' + b + ' = ' + a] };
    },
    why: [{ q: 'Jak sprawdzić, czy 42 − 5 = 37?', opts: [{ t: 'Dodać: 37 + 5 – jeśli wyjdzie 42, jest dobrze', ok: true }, { t: 'Odjąć jeszcze raz 5', code: 'concept' }, { t: 'Nie da się sprawdzić', code: 'concept' }], expl: 'Dodawanie „odkręca" odejmowanie: 37 + 5 = 42 ✓.' }]
  });

  def('k2_box', {
    name: 'Okienka (brakująca liczba)', grade: 2, mainCode: 'k2_box', prereq: ['k2_add', 'k2_sub'],
    types: { 1: ['fill', 'choice'], 2: ['fill', 'choice'], 3: ['fill', 'choice'] },
    gen(r, d) {
      const x = r.int(3, d === 1 ? 15 : 45), a = r.int(2, d === 1 ? 9 : 40);
      if (d === 1) return { prompt: '□ + ' + a + ' = ' + (x + a), fill: true, value: N(x), wrong: [{ v: N(x + 2 * a), code: 'k2_box' }], hints: ['Jaka liczba po dodaniu ' + a + ' da ' + (x + a) + '?', 'Możesz odjąć: ' + (x + a) + ' − ' + a + '.', 'Sprawdź: wstaw swój wynik w okienko.'], sol: [(x + a) + ' − ' + a + ' = ' + x, 'Sprawdzenie: ' + x + ' + ' + a + ' = ' + (x + a)] };
      if (d === 2) { const big = x + a; return { prompt: big + ' − □ = ' + x, fill: true, value: N(a), wrong: [{ v: N(big + x), code: 'k2_box' }], hints: ['Ile trzeba zabrać z ' + big + ', żeby zostało ' + x + '?', 'Policz: ' + big + ' − ' + x + '.', 'Sprawdź: ' + big + ' − twój wynik = ' + x + '?'], sol: [big + ' − ' + x + ' = ' + a, 'Sprawdzenie: ' + big + ' − ' + a + ' = ' + x] }; }
      return { prompt: '□ − ' + a + ' = ' + x, fill: true, value: N(x + a), wrong: [{ v: N(Math.abs(x - a)), code: 'k2_box' }], hints: ['Od jakiej liczby trzeba odjąć ' + a + ', żeby zostało ' + x + '?', 'Liczba w okienku jest WIĘKSZA od ' + x + ' – dodaj: ' + x + ' + ' + a + '.', 'Sprawdź swój wynik odejmowaniem.'], sol: [x + ' + ' + a + ' = ' + (x + a), 'Sprawdzenie: ' + (x + a) + ' − ' + a + ' = ' + x] };
    }
  });

  // ===================== MNOŻENIE I DZIELENIE DO 50 =====================
  def('k2_mul', {
    name: 'Mnożenie w zakresie 50', grade: 2, mainCode: 'op_confuse', prereq: ['k2_add'],
    types: { 1: ['input', 'choice'], 2: ['input', 'choice'], 3: ['fill', 'input'] },
    gen(r, d) {
      if (d === 1) {
        const a = r.pick([2, 3, 4, 5]), b = r.int(2, 5);
        if (r.chance(0.5)) return { prompt: 'Ile jest kropek? Policz mnożeniem: <b>' + a + ' rzędy po ' + b + '</b>.', visual: dotsSvg(a, b), value: N(a * b), wrong: [{ v: N(a + b), code: 'op_confuse' }, { v: N(a * b - 1), code: 'calc' }], hints: ['W każdym rzędzie jest ' + b + ' kropek.', 'Rzędów jest ' + a + ': ' + Array(a).fill(b).join(' + ') + '.', a + ' · ' + b + ' = ?'], sol: [Array(a).fill(b).join(' + ') + ' = ' + a * b, a + ' · ' + b + ' = ' + a * b] };
        const x = r.pick([2, 5, 10]), y = r.int(1, x === 10 ? 5 : 9);
        return { prompt: 'Oblicz: ' + y + ' · ' + x, value: N(x * y), wrong: [{ v: N(x + y), code: 'op_confuse' }, { v: N(x * (y + 1)), code: 'calc' }], hints: ['Mnożenie to dodawanie tej samej liczby kilka razy.', y + ' · ' + x + ' = ' + Array(Math.min(y, 6)).fill(x).join(' + ') + (y > 6 ? ' + …' : '') + '.', 'Licz „co ' + x + '": ' + [1, 2, 3].map(i => i * x).join(', ') + '…'], sol: [y + ' · ' + x + ' = ' + x * y] };
      }
      let a, b; do { a = r.int(3, 9); b = r.int(3, 9); } while (a * b > 50);
      if (d === 3) return { prompt: '□ · ' + b + ' = ' + a * b, fill: true, value: N(a), wrong: [{ v: N(a * b - b), code: 'op_confuse' }, { v: N(a + 1), code: 'calc' }], hints: ['Ile razy trzeba wziąć ' + b + ', żeby było ' + a * b + '?', 'Licz co ' + b + ': ' + [1, 2, 3, 4].map(i => i * b).join(', ') + '…', 'Możesz też podzielić: ' + a * b + ' : ' + b + '.'], sol: [a * b + ' : ' + b + ' = ' + a, 'Sprawdzenie: ' + a + ' · ' + b + ' = ' + a * b] };
      return { prompt: 'Oblicz: ' + a + ' · ' + b, value: N(a * b), wrong: [{ v: N(a + b), code: 'op_confuse' }, { v: N(a * (b - 1)), code: 'calc' }, { v: N(a * (b + 1)), code: 'calc' }], hints: ['Mnożenie to dodawanie tej samej liczby.', a + ' · ' + b + ' = ' + Array(a).fill(b).join(' + ') + '.', 'Jeśli znasz ' + a + ' · ' + (b - 1) + ' = ' + a * (b - 1) + ', dodaj jeszcze ' + a + '.'], sol: [a + ' · ' + b + ' = ' + a * b] };
    },
    why: [{ q: 'Co oznacza 3 · 4?', opts: [{ t: '4 + 4 + 4 (trzy razy po 4)', ok: true }, { t: '3 + 4', code: 'op_confuse' }, { t: '34', code: 'concept' }], expl: '3 · 4 to trzy razy po 4: 4 + 4 + 4 = 12.' }]
  });

  def('k2_div', {
    name: 'Dzielenie w zakresie 50', grade: 2, mainCode: 'op_confuse', prereq: ['k2_mul'],
    types: { 1: ['input', 'choice'], 2: ['input', 'choice'], 3: ['input', 'choice'] },
    gen(r, d) {
      let a, b; do { a = r.int(2, d === 1 ? 5 : 9); b = r.int(2, d === 1 ? 5 : 9); } while (a * b > 50);
      const p = a * b;
      if (d === 3) return { prompt: 'Ile razy liczba ' + b + ' mieści się w liczbie ' + p + '?', value: N(a), wrong: [{ v: N(p - b), code: 'op_confuse' }, { v: N(p * b > 99 ? a + 1 : p * b), code: 'op_confuse' }], hints: ['Licz co ' + b + ', aż dojdziesz do ' + p + '.', [1, 2, 3, 4].map(i => i * b).join(', ') + '… Ile liczb trzeba było powiedzieć?', 'To dzielenie: ' + p + ' : ' + b + '.'], sol: [p + ' : ' + b + ' = ' + a, 'bo ' + a + ' · ' + b + ' = ' + p] };
      return { prompt: 'Oblicz: ' + p + ' : ' + b, value: N(a), wrong: [{ v: N(p - b), code: 'op_confuse' }, { v: N(a + 1), code: 'calc' }], hints: ['Rozdziel ' + p + ' na ' + b + ' równe części.', 'Jaka liczba razy ' + b + ' daje ' + p + '? □ · ' + b + ' = ' + p, 'Sprawdź: ' + a + ' · ' + b + ' = ?'], sol: [p + ' : ' + b + ' = ' + a, 'Sprawdzenie: ' + a + ' · ' + b + ' = ' + p] };
    },
    why: [{ q: 'Jak sprawdzić, że 20 : 4 = 5?', opts: [{ t: 'Pomnożyć: 5 · 4 = 20', ok: true }, { t: 'Odjąć: 20 − 4', code: 'op_confuse' }, { t: 'Dodać: 5 + 4', code: 'op_confuse' }], expl: 'Mnożenie sprawdza dzielenie: 5 · 4 = 20 ✓.' }]
  });

  def('k2_half', {
    name: 'Połowa i podwojenie', grade: 2, mainCode: 'k2_half',
    types: { 1: ['input', 'choice'], 2: ['input', 'choice'], 3: ['input', 'choice'] },
    gen(r, d) {
      if (d === 2) { const n = r.int(6, 25); return { prompt: 'Podwój liczbę ' + n + ' (weź ją dwa razy).', value: N(2 * n), wrong: [{ v: N(n + 2), code: 'k2_half' }, { v: N(Math.floor(n / 2)), code: 'k2_half' }], hints: ['Podwoić to dodać liczbę do niej samej.', n + ' + ' + n + ' = ?', 'Możesz osobno: dziesiątki i jedności.'], sol: [n + ' + ' + n + ' = ' + 2 * n] }; }
      const n = d === 1 ? 2 * r.int(2, 10) : 2 * r.int(11, 45);
      return { prompt: 'Ile to jest połowa liczby ' + n + '?', value: N(n / 2), wrong: [{ v: N(2 * n), code: 'k2_half' }, { v: N(n - 2), code: 'k2_half' }], hints: ['Połowa to jedna z dwóch równych części.', 'Jaka liczba dodana do siebie daje ' + n + '? □ + □ = ' + n, d === 3 ? 'Podziel osobno: połowa z ' + Math.floor(n / 10) * 10 + ' i połowa z ' + n % 10 + '.' : n + ' : 2 = ?'], sol: [n + ' : 2 = ' + n / 2, 'bo ' + n / 2 + ' + ' + n / 2 + ' = ' + n] };
    }
  });

  // ===================== ZADANIA Z TREŚCIĄ (motywy) =====================
  def('k2_word', {
    name: 'Zadania z treścią', grade: 2, mainCode: 'read', prereq: ['k2_add', 'k2_sub'],
    types: { 1: ['input', 'choice'], 2: ['input', 'choice'], 3: ['input', 'choice'] },
    gen(r, d) {
      const th = MP.th(), T = th.k2t || MP.THEMES.szkola.k2t, [nm, g] = r.pick(KIDS);
      const t = (n) => n + ' ' + pl(n, T[0], T[1], T[2]);
      const op = d === 3 ? r.pick(['mul', 'div']) : r.pick(['add', 'sub']);
      if (op === 'add') { const a = d === 1 ? r.int(5, 30) : r.int(15, 60), b = d === 1 ? r.int(2, 9) : r.int(11, 35); const s = a + b;
        return { prompt: nm + ' ' + vg(g, 'miał', 'miała') + ' ' + t(a) + '. ' + vg(g, 'Dostał', 'Dostała') + ' jeszcze ' + t(b) + '. Ile ' + T[2] + ' ma teraz?', value: N(s), wrong: [{ v: N(Math.abs(a - b)), code: 'op_confuse' }, { v: N(s + 1), code: 'calc' }], hints: ['Czy ' + vg(g, 'ma', 'ma') + ' teraz więcej, czy mniej? Więcej – więc dodajemy.', 'Działanie: ' + a + ' + ' + b + '.', 'Policz ' + a + ' + ' + b + '.'], sol: [a + ' + ' + b + ' = ' + s, 'Odpowiedź: ' + nm + ' ma ' + t(s) + '.'] }; }
      if (op === 'sub') { const a = d === 1 ? r.int(12, 30) : r.int(35, 90), b = d === 1 ? r.int(2, 9) : r.int(11, a - 10); const v = a - b;
        return { prompt: nm + ' ' + vg(g, 'miał', 'miała') + ' ' + t(a) + '. ' + vg(g, 'Dał', 'Dała') + ' koledze ' + t(b) + '. Ile ' + T[2] + ' ' + vg(g, 'mu', 'jej') + ' zostało?', value: N(v), wrong: [{ v: N(a + b), code: 'op_confuse' }, { v: N(v + 1), code: 'calc' }], hints: ['Czy zostało więcej, czy mniej niż było? Mniej – więc odejmujemy.', 'Działanie: ' + a + ' − ' + b + '.', 'Sprawdź: wynik + ' + b + ' = ' + a + '?'], sol: [a + ' − ' + b + ' = ' + v, 'Odpowiedź: zostało ' + t(v) + '.'] }; }
      let a, b; do { a = r.int(2, 9); b = r.int(2, 9); } while (a * b > 50);
      if (op === 'mul') return { prompt: 'W każdym z ' + a + ' pudełek jest po ' + t(b) + '. Ile ' + T[2] + ' jest we wszystkich pudełkach?', value: N(a * b), wrong: [{ v: N(a + b), code: 'op_confuse' }, { v: N(a * b - b), code: 'calc' }], hints: ['Każde pudełko ma tyle samo – to mnożenie.', 'Działanie: ' + a + ' · ' + b + '.', Array(a).fill(b).join(' + ') + ' = ?'], sol: [a + ' · ' + b + ' = ' + a * b, 'Odpowiedź: razem ' + t(a * b) + '.'] };
      return { prompt: nm + ' ' + vg(g, 'rozdzielił', 'rozdzieliła') + ' ' + t(a * b) + ' po równo między ' + b + ' ' + pl(b, 'dziecko', 'dzieci', 'dzieci') + '. Ile ' + T[2] + ' dostało każde dziecko?', value: N(a), wrong: [{ v: N(a * b - b), code: 'op_confuse' }, { v: N(a * b + b), code: 'op_confuse' }], hints: ['Dzielimy po równo – to dzielenie.', 'Działanie: ' + a * b + ' : ' + b + '.', 'Jaka liczba razy ' + b + ' daje ' + a * b + '?'], sol: [a * b + ' : ' + b + ' = ' + a, 'Odpowiedź: każde dziecko dostało ' + t(a) + '.'] };
    }
  });

  // ===================== PIENIĄDZE =====================
  def('k2_money', {
    name: 'Pieniądze: złote i grosze', grade: 2, mainCode: 'k2_zlgr', prereq: ['k2_add', 'k2_sub'],
    types: { 1: ['input', 'choice'], 2: ['input', 'choice'], 3: ['fill', 'choice'] },
    gen(r, d) {
      if (d === 1) { const coins = Array.from({ length: r.int(3, 4) }, () => r.pick([1, 2, 5])); const s = coins.reduce((a, b) => a + b, 0);
        return { visual: MP.moneySvg(coins.map(v => ({ v, u: 'zł' }))), prompt: 'W skarbonce są monety: ' + coins.map(c => c + ' zł').join(', ') + '. Ile to razem złotych?', value: N(s), wrong: [{ v: N(coins.length), code: 'read' }, { v: N(s - 1), code: 'calc' }], hints: ['Dodaj wartości wszystkich monet.', 'Zacznij od największych.', coins.join(' + ') + ' = ?'], sol: [coins.join(' + ') + ' = ' + s + ' zł'] }; }
      if (d === 2) { const T = (MP.th().k2t) || MP.THEMES.szkola.k2t; const pay = r.pick([10, 20, 50]), price = r.int(2, pay - 2);
        return { visual: MP.moneySvg([{ v: pay, u: 'zł' }]), prompt: 'Kupujesz ' + T[0] + ' za ' + price + ' zł. Płacisz banknotem ' + pay + ' zł. Ile dostaniesz reszty?', value: N(pay - price), wrong: [{ v: N(pay + price), code: 'op_confuse' }, { v: N(price), code: 'read' }], hints: ['Reszta to to, co zostaje z banknotu po zapłaceniu.', 'Działanie: ' + pay + ' − ' + price + '.', 'Sprawdź: ' + price + ' + reszta = ' + pay + '.'], sol: [pay + ' − ' + price + ' = ' + (pay - price) + ' zł'] }; }
      const z = r.int(1, 5), g = r.pick([0, 20, 50, 70, 10]);
      return { visual: MP.moneySvg(Array.from({ length: z }, () => ({ v: 1, u: 'zł' })).concat(MP.moneyList(0, g))), prompt: z + ' zł ' + (g ? g + ' gr ' : '') + '= □ gr', fill: true, value: N(z * 100 + g), wrong: [{ v: N(z * 10 + g), code: 'k2_zlgr' }, { v: N(z + g), code: 'k2_zlgr' }], hints: ['1 zł = 100 gr.', z + ' zł = ' + z * 100 + ' gr.', g ? 'Dodaj jeszcze ' + g + ' gr.' : 'To już wszystko.'], sol: [z + ' zł = ' + z * 100 + ' gr', (g ? z * 100 + ' + ' + g + ' = ' : '') + (z * 100 + g) + ' gr'] };
    }
  });

  // ===================== CZAS =====================
  const HN = ['dwunastej', 'pierwszej', 'drugiej', 'trzeciej', 'czwartej', 'piątej', 'szóstej', 'siódmej', 'ósmej', 'dziewiątej', 'dziesiątej', 'jedenastej', 'dwunastej'];
  const tm = (h, m) => h + ':' + String(m).padStart(2, '0');
  def('k2_clock', {
    name: 'Zegar: godziny, połówki, kwadranse', grade: 2, mainCode: 'k2_hands',
    types: { 1: ['choice'], 2: ['choice'], 3: ['input', 'choice'] },
    gen(r, d, type) {
      const h = r.int(1, 12), m = d === 1 ? 0 : r.pick([30, 15, 45]);
      if (d === 3 && type !== 'choice') { const add = r.int(2, 5); const nh = (h + add - 1) % 12 + 1;
        return { prompt: 'Zegar pokazuje godzinę ' + h + ':00. Która godzina będzie za ' + add + ' ' + pl(add, 'godzinę', 'godziny', 'godzin') + '? (wpisz samą godzinę, np. 7)', visual: clockSvg(h, 0), value: N(nh), wrong: [{ v: N(((h - add - 1) % 12 + 12) % 12 + 1), code: 'op_confuse' }, { v: N(h + add), code: 'k2_clock12' }].filter(w => w.v.n !== nh), hints: ['Przesuń w myślach małą wskazówkę o ' + add + ' liczby do przodu.', 'Po 12 jest znowu 1.', h + ' + ' + add + ' = ' + (h + add) + (h + add > 12 ? ', a na zegarze to ' + nh : '') + '.'], sol: ['Za ' + add + ' h będzie godzina ' + nh + '.'] }; }
      const right = tm(h, m);
      const cand = [];
      if (m === 0) cand.push([tm(12, h * 5 % 60 === 0 ? 0 : h * 5 % 60), 'k2_hands'], [tm(h % 12 + 1, 0), 'calc'], [tm(h, 30), 'k2_hands'], [tm((h + 10) % 12 + 1, 0), 'calc']);
      else cand.push([tm(m === 45 ? h % 12 + 1 : h, m), m === 45 ? 'k2_halfhour' : 'calc'], [tm(m === 30 || m === 15 ? h % 12 + 1 : (h + 10) % 12 + 1, m), 'k2_halfhour'], [tm(h, 60 - m === 30 ? 0 : 60 - m), 'k2_hands'], [tm(m / 5, h * 5 % 60), 'k2_hands']);
      const opts = [{ label: right, ok: true }];
      cand.forEach(c => { if (!opts.some(o => o.label === c[0]) && opts.length < 4 && !c[0].startsWith('0:')) opts.push({ label: c[0], code: c[1] }); });
      let k = 1; while (opts.length < 4) { const l = tm((h + k * 3 - 1) % 12 + 1, m); if (!opts.some(o => o.label === l)) opts.push({ label: l, code: 'calc' }); k++; }
      const sh = r.shuffle(opts);
      const say = m === 0 ? 'godzina ' + h : m === 30 ? 'wpół do ' + HN[h % 12 + 1] : m === 15 ? 'kwadrans po ' + (h === 1 ? 'pierwszej' : HN[h]) : 'za kwadrans ' + HN[h % 12 + 1];
      return { type: 'choice', prompt: 'Którą godzinę pokazuje zegar?', visual: clockSvg(h, m), options: sh, answer: { kind: 'choice', correct: sh.findIndex(o => o.ok) },
        hints: ['Mała, gruba wskazówka pokazuje godziny. Duża, długa (niebieska) – minuty.', m === 0 ? 'Duża wskazówka na 12 – to pełna godzina.' : m === 30 ? 'Duża wskazówka na 6 – to pół godziny (30 minut).' : m === 15 ? 'Duża wskazówka na 3 – to kwadrans (15 minut).' : 'Duża wskazówka na 9 – to 45 minut (za kwadrans pełna godzina).', m === 0 ? 'Gdzie jest mała wskazówka?' : 'Mała wskazówka jest między ' + h + ' a ' + (h % 12 + 1) + ' – godzina to wciąż ' + h + '.'], sol: ['Zegar pokazuje ' + right + ' (' + say + ').'] };
    }
  });

  const DNI = ['poniedziałek', 'wtorek', 'środa', 'czwartek', 'piątek', 'sobota', 'niedziela'];
  const MIES = ['styczeń', 'luty', 'marzec', 'kwiecień', 'maj', 'czerwiec', 'lipiec', 'sierpień', 'wrzesień', 'październik', 'listopad', 'grudzień'];
  def('k2_cal', {
    name: 'Kalendarz: dni tygodnia i miesiące', grade: 2, mainCode: 'k2_cal',
    types: { 1: ['choice'], 2: ['choice'], 3: ['input', 'choice'] },
    gen(r, d, type) {
      if (d === 3) { const add = r.pick([7, 14]), day = r.int(1, 30 - add); const mi = r.int(0, 11);
        const gen = ['stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca', 'lipca', 'sierpnia', 'września', 'października', 'listopada', 'grudnia'][mi];
        return { prompt: 'Dziś jest ' + day + ' ' + gen + '. Którego ' + gen + ' będzie za ' + (add === 7 ? 'tydzień' : 'dwa tygodnie') + '? (wpisz liczbę)', value: N(day + add), wrong: [{ v: N(day + add - 1), code: 'k2_cal' }, { v: N(day + (add === 7 ? 1 : 2)), code: 'k2_cal' }], hints: ['Tydzień ma 7 dni.', add === 7 ? 'Dodaj 7.' : 'Dwa tygodnie to 14 dni.', day + ' + ' + add + ' = ?'], sol: [day + ' + ' + add + ' = ' + (day + add)] }; }
      const days = d === 1, L = days ? DNI : MIES;
      const i = r.int(0, L.length - 1), k = d === 1 ? r.int(1, 3) : r.int(1, 4);
      const right = L[(i + k) % L.length];
      const opts = [{ label: right, ok: true }, { label: L[(i + k + 1) % L.length], code: 'k2_cal' }, { label: L[(i + k - 1 + L.length) % L.length], code: k > 1 ? 'k2_cal' : 'read' }, { label: L[(i - k + L.length * 2) % L.length], code: 'read' }];
      const uniq = []; opts.forEach(o => { if (!uniq.some(u => u.label === o.label)) uniq.push(o); });
      while (uniq.length < 4) { const l = L[r.int(0, L.length - 1)]; if (!uniq.some(u => u.label === l)) uniq.push({ label: l, code: 'calc' }); }
      const sh = r.shuffle(uniq);
      const q = days ? 'Dziś jest <b>' + L[i] + '</b>. Jaki dzień tygodnia będzie za ' + k + ' ' + pl(k, 'dzień', 'dni', 'dni') + '?' : 'Teraz jest <b>' + L[i] + '</b>. Jaki miesiąc będzie za ' + (k === 1 ? 'miesiąc' : k + ' ' + pl(k, 'miesiąc', 'miesiące', 'miesięcy')) + '?';
      return { type: 'choice', prompt: q, options: sh, answer: { kind: 'choice', correct: sh.findIndex(o => o.ok) },
        hints: [days ? 'Wymień dni tygodnia po kolei: poniedziałek, wtorek, środa…' : 'Wymień miesiące po kolei: styczeń, luty, marzec…', 'Zacznij od „' + L[i] + '" i licz ' + k + ' do przodu (dzisiejszego nie liczysz).', 'Pierwszy krok do przodu to ' + L[(i + 1) % L.length] + '.'], sol: [L[i] + ' → ' + Array.from({ length: k }, (_, j) => L[(i + j + 1) % L.length]).join(' → ')] };
    }
  });

  // ===================== MIARY =====================
  def('k2_len', {
    name: 'Miary: długość, masa, pojemność', grade: 2, mainCode: 'units_factor', prereq: ['k2_add'],
    types: { 1: ['fill', 'choice'], 2: ['input', 'choice'], 3: ['input', 'choice'] },
    gen(r, d) {
      if (d === 1) { const m = r.int(1, 5), c = r.chance(0.5) ? 0 : r.pick([10, 20, 50, 30, 40]);
        return { prompt: m + ' m ' + (c ? c + ' cm ' : '') + '= □ cm', fill: true, value: N(m * 100 + c), wrong: [{ v: N(m * 10 + c), code: 'units_factor' }, { v: N(m + c), code: 'units_factor' }].filter(w => w.v.n !== m * 100 + c), hints: ['1 metr = 100 centymetrów.', m + ' m = ' + m * 100 + ' cm.', c ? 'Dodaj jeszcze ' + c + ' cm.' : 'To już wynik.'], sol: [m + ' m = ' + m * 100 + ' cm', c ? m * 100 + ' + ' + c + ' = ' + (m * 100 + c) + ' cm' : ''] .filter(Boolean) }; }
      if (d === 2) { const K = r.pick([['kg', 'Arbuz waży', 'a melon', 'Ile ważą razem?', 2, 9], ['l', 'W jednym wiadrze jest', 'a w drugim', 'Ile litrów wody jest razem?', 3, 12], ['cm', 'Jeden ołówek ma', 'a drugi', 'Ile centymetrów mają razem, położone jeden za drugim?', 8, 19]]);
        const a = r.int(K[4], K[5]), b = r.int(K[4], K[5]);
        return { prompt: K[1] + ' ' + a + ' ' + K[0] + ', ' + K[2] + ' ' + b + ' ' + K[0] + '. ' + K[3], value: N(a + b), unit: K[0], wrong: [{ v: N(Math.abs(a - b)), code: 'op_confuse' }, { v: N(a + b + 1), code: 'calc' }], hints: ['„Razem" – dodajemy.', a + ' + ' + b + ' = ?', 'Pamiętaj o jednostce: ' + K[0] + '.'], sol: [a + ' ' + K[0] + ' + ' + b + ' ' + K[0] + ' = ' + (a + b) + ' ' + K[0]] }; }
      const cut = r.int(15, 85);
      return { prompt: 'Wstążka ma 1 metr długości. Odcięto ' + cut + ' cm. Ile centymetrów wstążki zostało?', value: N(100 - cut), unit: 'cm', wrong: [{ v: N(cut), code: 'read' }, { v: N(cut - 1 > 0 ? 100 + cut : 1), code: 'op_confuse' }, { v: N(Math.abs(10 - cut)), code: 'units_factor' }].filter(w => w.v.n > 0 && w.v.n !== 100 - cut), hints: ['Zamień 1 m na centymetry.', '1 m = 100 cm.', '100 − ' + cut + ' = ?'], sol: ['1 m = 100 cm', '100 − ' + cut + ' = ' + (100 - cut) + ' cm'] };
    }
  });

  // ===================== FIGURY =====================
  const SH = { 'trójkąt': 3, 'kwadrat': 4, 'prostokąt': 4, 'koło': 0, 'pięciokąt': 5, 'sześciokąt': 6 };
  def('k2_shapes', {
    name: 'Figury geometryczne', grade: 2, mainCode: 'k2_shape',
    types: { 1: ['choice'], 2: ['input', 'choice'], 3: ['input', 'choice'] },
    gen(r, d, type) {
      if (d === 3) { const a = r.int(2, 9), b = r.int(2, 9), sq = r.chance(0.4); const B = sq ? a : b; const P = 2 * (a + B);
        return { prompt: (sq ? 'Kwadrat ma bok ' + a + ' cm.' : 'Prostokąt ma boki ' + a + ' cm i ' + b + ' cm.') + ' Ile centymetrów mają wszystkie jego boki razem?', value: N(P), unit: 'cm', wrong: [{ v: N(a + B), code: 'perim_half' }, { v: N(sq ? 3 * a : P - 1), code: sq ? 'k2_shape' : 'calc' }], hints: ['Ta figura ma 4 boki. ' + (sq ? 'Wszystkie są równe.' : 'Naprzeciwko siebie są boki równe.'), 'Wypisz wszystkie 4 boki: ' + [a, B, a, B].join(', ') + '.', [a, B, a, B].join(' + ') + ' = ?'], sol: [[a, B, a, B].join(' + ') + ' = ' + P + ' cm'] }; }
      const names = Object.keys(SH), k = d === 1 ? r.pick(['trójkąt', 'kwadrat', 'prostokąt', 'koło']) : r.pick(['trójkąt', 'kwadrat', 'prostokąt', 'pięciokąt', 'sześciokąt']);
      if (d === 2 && type !== 'choice') return { prompt: 'Ile boków ma ta figura?', visual: shapeSvg(k), value: N(SH[k]), wrong: [{ v: N(SH[k] + 1), code: 'calc' }, { v: N(SH[k] - 1), code: 'calc' }], hints: ['Przesuwaj palcem po kolejnych bokach.', 'Bok to prosty odcinek od rogu do rogu.', 'Policz rogi (wierzchołki) – boków jest tyle samo.'], sol: ['To ' + k + ': ma ' + SH[k] + ' ' + pl(SH[k], 'bok', 'boki', 'boków') + '.'] };
      const pool = r.shuffle(names.filter(n => n !== k)); const dist = (k === 'kwadrat' ? ['prostokąt'] : k === 'prostokąt' ? ['kwadrat'] : []).concat(pool).filter((v, i, a) => a.indexOf(v) === i).slice(0, 3);
      const opts = r.shuffle([{ label: k, ok: true }].concat(dist.map(n => ({ label: n, code: (k === 'kwadrat' && n === 'prostokąt') || (k === 'prostokąt' && n === 'kwadrat') ? 'k2_shape' : 'k2_shape' }))));
      return { type: 'choice', prompt: 'Jak nazywa się ta figura?', visual: shapeSvg(k), options: opts, answer: { kind: 'choice', correct: opts.findIndex(o => o.ok) },
        hints: ['Policz boki i rogi.', k === 'koło' ? 'Ta figura nie ma żadnych rogów.' : 'Ta figura ma ' + SH[k] + ' ' + pl(SH[k], 'róg', 'rogi', 'rogów') + '.', k === 'kwadrat' ? 'Wszystkie boki są tej samej długości.' : k === 'prostokąt' ? 'Dwa boki są dłuższe, dwa krótsze.' : 'Dopasuj nazwę do liczby boków.'], sol: ['To jest ' + k + '.'] };
    }
  });

  // ===================== DZIAŁANIA PISEMNE (kl. 4–5) =====================
  function digitsNoCarryAdd(a, b) { const A = String(a).split('').reverse(), B = String(b).split('').reverse(); let s = ''; for (let i = 0; i < Math.max(A.length, B.length); i++) s = ((+(A[i] || 0) + +(B[i] || 0)) % 10) + s; return +s; }
  function digitsAbsSub(a, b) { const A = String(a).split('').reverse(), B = String(b).split('').reverse(); let s = ''; for (let i = 0; i < A.length; i++) s = Math.abs(+(A[i] || 0) - +(B[i] || 0)) + s; return +s; }
  def('nat_pis', {
    name: 'Działania pisemne', grade: 5, mainCode: 'pis_carry', prereq: ['tabl'],
    types: { 1: ['input', 'choice'], 2: ['input', 'choice'], 3: ['input', 'choice'] },
    gen(r, d) {
      if (d === 1) { const a = r.int(1000, 8999), b = r.int(1000, 9999 - a); const s = a + b; const w = digitsNoCarryAdd(a, b);
        return { prompt: 'Oblicz pisemnie: ' + a + ' + ' + b, value: N(s), wrong: (w !== s ? [{ v: N(w), code: 'pis_carry' }] : []).concat([{ v: N(s + 10), code: 'calc' }]), hints: ['Podpisz liczby jedna pod drugą: jedności pod jednościami.', 'Dodawaj od prawej. Gdy wyjdzie 10 lub więcej, zapisz jedności, a 1 przenieś do następnej kolumny.', 'Jedności: ' + a % 10 + ' + ' + b % 10 + ' = ' + (a % 10 + b % 10) + '.'], sol: [a + ' + ' + b + ' = ' + s] }; }
      if (d === 2) { let a = r.int(2000, 9999), b = r.int(1000, a - 100); if (r.chance(0.4)) { a = r.int(2, 9) * 1000 + r.int(0, 9); } const v = a - b; const w = digitsAbsSub(a, b);
        return { prompt: 'Oblicz pisemnie: ' + a + ' − ' + b, value: N(v), wrong: (w !== v ? [{ v: N(w), code: 'pis_borrow' }] : []).concat([{ v: N(v + 100), code: 'pis_borrow' }, { v: N(v - 10), code: 'calc' }]), hints: ['Podpisz liczby: jedności pod jednościami.', 'Odejmuj od prawej. Gdy cyfra u góry jest mniejsza, „pożycz" 1 z następnej kolumny (u góry staje się o 10 więcej).', 'Sprawdź dodawaniem: wynik + ' + b + ' = ' + a + '?'], sol: [a + ' − ' + b + ' = ' + v, 'Sprawdzenie: ' + v + ' + ' + b + ' = ' + a] }; }
      if (r.chance(0.5)) { const a = r.int(12, 98), b = r.int(12, 98); const p = a * b; const w = a * (b % 10) + a * Math.floor(b / 10);
        return { prompt: 'Oblicz pisemnie: ' + a + ' · ' + b, value: N(p), wrong: [{ v: N(w), code: 'pis_shift' }, { v: N(p + 10), code: 'calc' }], hints: ['Najpierw pomnóż ' + a + ' przez ' + b % 10 + ' (jedności).', 'Potem ' + a + ' przez ' + Math.floor(b / 10) + ' dziesiątki – ten wynik zapisz przesunięty o jedno miejsce w lewo (to ' + a + ' · ' + Math.floor(b / 10) * 10 + ').', a + ' · ' + b % 10 + ' = ' + a * (b % 10) + ', ' + a + ' · ' + Math.floor(b / 10) * 10 + ' = ' + a * Math.floor(b / 10) * 10 + '. Dodaj.'], sol: [a + ' · ' + b % 10 + ' = ' + a * (b % 10), a + ' · ' + Math.floor(b / 10) * 10 + ' = ' + a * Math.floor(b / 10) * 10, a * (b % 10) + ' + ' + a * Math.floor(b / 10) * 10 + ' = ' + p] }; }
      const b = r.int(3, 9), q = r.int(105, 999), a = b * q;
      return { prompt: 'Oblicz pisemnie: ' + a + ' : ' + b, value: N(q), wrong: [{ v: N(q + 1), code: 'calc' }, { v: N(Math.floor(q / 10)), code: 'pis_zero' }].filter(w => w.v.n !== q), hints: ['Dziel od lewej: ile razy ' + b + ' mieści się w pierwszej cyfrze (lub dwóch pierwszych)?', 'Po każdym kroku odejmij, dopisz następną cyfrę i dziel dalej.', 'Sprawdź mnożeniem: wynik · ' + b + ' = ' + a + '?'], sol: [a + ' : ' + b + ' = ' + q, 'Sprawdzenie: ' + q + ' · ' + b + ' = ' + a] };
    }
  });
})(MP);
