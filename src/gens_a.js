/* gens_a.js — generatory: liczby naturalne, podzielność, ułamki zwykłe i działania na nich.
   Każdy generator zwraca: prompt, value (dokładny ułamek), wrong (znane błędne wyniki + kod błędu),
   hints (3 stopnie), sol (pełne rozwiązanie krok po kroku), opcjonalnie errorVersion i visual. */
var MP = (typeof window !== 'undefined' ? window : globalThis).MP;
(function (MP) {
  const U = MP.util, { F, red, add, sub, mul, div, eq, fmtF, fmtImp, fmtNum, gcd, lcm } = U;
  const SK = MP.SK = MP.SK || {};
  const def = (id, o) => { o.id = id; SK[id] = o; };
  const N = (n) => F(n, 1), pl = U.pl;
  const fr = (n, d) => '[[' + n + '/' + d + ']]';

  // ---------- rysunki ----------
  function pie(n, d, size) {
    size = size || 150; const c = size / 2, r = c - 6; let s = '';
    for (let i = 0; i < d; i++) {
      const a0 = (i / d) * 2 * Math.PI - Math.PI / 2, a1 = ((i + 1) / d) * 2 * Math.PI - Math.PI / 2;
      const x0 = c + r * Math.cos(a0), y0 = c + r * Math.sin(a0), x1 = c + r * Math.cos(a1), y1 = c + r * Math.sin(a1);
      const large = (a1 - a0) > Math.PI ? 1 : 0;
      s += '<path d="M' + c + ' ' + c + ' L' + x0.toFixed(1) + ' ' + y0.toFixed(1) + ' A' + r + ' ' + r + ' 0 ' + large + ' 1 ' + x1.toFixed(1) + ' ' + y1.toFixed(1) + ' Z" class="' + (i < n ? 'sh' : 'un') + '"/>';
    }
    return '<svg viewBox="0 0 ' + size + ' ' + size + '" class="vis pie" role="img" aria-label="Koło podzielone na ' + d + ' równych części, zamalowane ' + n + '">' + s + '</svg>';
  }
  function bar(n, d, order) {
    const w = 280, h = 54, cw = (w - 8) / d; let s = '';
    const shaded = order || [...Array(d).keys()].map(i => i < n);
    for (let i = 0; i < d; i++) s += '<rect x="' + (4 + i * cw).toFixed(1) + '" y="4" width="' + cw.toFixed(1) + '" height="' + (h - 8) + '" class="' + (shaded[i] ? 'sh' : 'un') + '"/>';
    return '<svg viewBox="0 0 ' + w + ' ' + h + '" class="vis bar" role="img" aria-label="Pasek podzielony na ' + d + ' równych części, zamalowane ' + n + '">' + s + '</svg>';
  }
  MP.draw = { pie, bar };

  // ===================== LICZBY NATURALNE =====================
  def('tabl', {
    name: 'Tabliczka mnożenia i dzielenie w pamięci', grade: 4, mainCode: 'calc',
    types: { 1: ['input', 'choice'], 2: ['input', 'choice'], 3: ['input', 'fill'] },
    gen(r, d, type) {
      const a = d === 1 ? r.int(2, 5) : r.int(6, 9), b = d === 1 ? r.int(2, 9) : r.int(4, 9), p = a * b;
      if (d === 3) {
        const div = r.chance(0.5);
        if (div) return { prompt: 'Oblicz: ' + p + ' : ' + a, value: N(b), wrong: [{ v: N(b + 1), code: 'calc' }, { v: N(p - a), code: 'op_confuse' }],
          hints: ['Dzielenie to odwrotność mnożenia. Zapytaj: ile razy ' + a + ' daje ' + p + '?', 'Szukasz liczby □, dla której ' + a + ' · □ = ' + p + '.', 'Sprawdź po kolei: ' + a + ' · ' + (b - 1) + ' = ' + (a * (b - 1)) + ', ' + a + ' · ' + b + ' = ?'],
          sol: [a + ' · ' + b + ' = ' + p, 'więc ' + p + ' : ' + a + ' = ' + b] };
        return { prompt: 'Uzupełnij: □ · ' + a + ' = ' + p, fill: true, value: N(b), wrong: [{ v: N(p - a), code: 'op_confuse' }, { v: N(b + 1), code: 'calc' }],
          hints: ['Jaką liczbę trzeba pomnożyć przez ' + a + ', żeby dostać ' + p + '?', 'Możesz podzielić: ' + p + ' : ' + a + '.', 'Policz: ' + a + ' · ' + b + ' = ?'], sol: [p + ' : ' + a + ' = ' + b, 'Sprawdzenie: ' + b + ' · ' + a + ' = ' + p] };
      }
      return { prompt: 'Oblicz: ' + a + ' · ' + b, value: N(p), wrong: [{ v: N(a + b), code: 'op_confuse' }, { v: N(a * (b - 1)), code: 'calc' }, { v: N(a * (b + 1)), code: 'calc' }],
        hints: ['Mnożenie to dodawanie tej samej liczby kilka razy.', a + ' · ' + b + ' to ' + b + ' razy po ' + a + '.', 'Jeśli pamiętasz ' + a + ' · ' + (b - 1) + ' = ' + (a * (b - 1)) + ', dodaj jeszcze ' + a + '.'],
        sol: [a + ' · ' + b + ' = ' + p] };
    }
  });

  def('nat_div_rem', {
    name: 'Dzielenie z resztą', grade: 4, mainCode: 'div_rem_big',
    types: { 1: ['multi'], 2: ['multi'], 3: ['input', 'choice'] },
    gen(r, d, type) {
      const b = d === 1 ? r.int(3, 6) : r.int(6, 9), q = d === 1 ? r.int(3, 9) : r.int(5, 12), rem = r.int(1, b - 1), a = b * q + rem;
      if (d === 3) {
        const th = MP.th();
        const ctx = r.pick([{ t: th.grp(a, b), ans: q + 1, wr: q, up: true }, { t: th.per(a, b), ans: q, wr: q + 1 }]);
        return { prompt: ctx.t, value: N(ctx.ans), wrong: [{ v: N(ctx.wr), code: 'read' }, { v: N(rem), code: 'read' }],
          hints: ['Podziel ' + a + ' przez ' + b + ' z resztą.', a + ' : ' + b + ' = ' + q + ' reszta ' + rem + '. Co oznacza ta reszta w tym zadaniu?', ctx.up ? 'Reszta to ' + rem + ' – czy te osoby też muszą się zmieścić?' : 'Pytają o PEŁNE porcje – czy reszta wystarczy na jeszcze jedną?'],
          sol: [a + ' : ' + b + ' = ' + q + ' r. ' + rem, ctx.up ? 'Zostaje jeszcze ' + rem + ' – dla nich potrzeba jeszcze jednego: ' + q + ' + 1 = ' + (q + 1) + '.' : 'Pełnych jest ' + q + ', a reszta ' + rem + ' to za mało na kolejną.'] };
      }
      return { type: 'multi', prompt: 'Podziel z resztą: ' + a + ' : ' + b + ' = □ r. □', labels: ['wynik', 'reszta'], answer: { kind: 'multi', values: [N(q), N(rem)] }, multiCodes: ['calc', 'div_rem_big'],
        hints: ['Ile razy ' + b + ' mieści się w ' + a + '?', 'Szukaj największej wielokrotności ' + b + ', która nie przekracza ' + a + '.', b + ' · ' + q + ' = ' + (b * q) + '. Ile brakuje do ' + a + '?'],
        sol: [b + ' · ' + q + ' = ' + (b * q), a + ' − ' + (b * q) + ' = ' + rem, 'Wynik: ' + q + ' reszta ' + rem + ' (reszta ' + rem + ' < ' + b + ' ✓)'] };
    }
  });

  def('nat_round', {
    name: 'Zaokrąglanie liczb naturalnych', grade: 6, mainCode: 'round_trunc',
    types: { 1: ['input', 'choice'], 2: ['input', 'choice'], 3: ['input', 'choice'] },
    gen(r, d) {
      const places = d === 1 ? [10, 'dziesiątek'] : d === 2 ? r.pick([[100, 'setek'], [1000, 'tysięcy']]) : r.pick([[1000, 'tysięcy'], [10000, 'dziesiątek tysięcy']]);
      const P = places[0];
      let n; do { n = r.int(P * 2, P * (d === 1 ? 99 : 60)) + r.int(0, P - 1); } while (n % P === 0);
      // wymuś przypadek „w górę" w połowie zadań
      if (r.chance(0.6)) { n = Math.floor(n / P) * P + r.int(Math.ceil(P / 2), P - 1); }
      const up = Math.round(n / P) * P, tr = Math.floor(n / P) * P;
      const wrong = [{ v: N(tr === up ? tr + P : tr), code: 'round_trunc' }, { v: N(Math.round(n / (P / 10)) * (P / 10)), code: 'round_place' }, { v: N(Math.round(n / (P * 10)) * (P * 10)), code: 'round_place' }];
      const ctx = d === 3 ? MP.th().count(n).replace(String(n), n.toLocaleString('pl-PL')) + ' Zaokrąglij tę liczbę do ' + places[1] + '.' : 'Zaokrąglij liczbę ' + n.toLocaleString('pl-PL') + ' do ' + places[1] + '.';
      const digit = Math.floor((n % P) / (P / 10));
      return { prompt: ctx, value: N(up), wrong, fmt: (v) => v.n.toLocaleString('pl-PL'),
        hints: ['Znajdź cyfrę rzędu ' + places[1] + ' i spójrz na cyfrę tuż za nią (po prawej).', 'Jeśli cyfra za nią to 0–4 – zaokrąglasz w dół, jeśli 5–9 – w górę.', 'Cyfra za rzędem ' + places[1] + ' to ' + digit + '.'],
        sol: ['Cyfra decydująca: ' + digit, digit >= 5 ? 'To 5 lub więcej → w górę.' : 'To mniej niż 5 → w dół.', n.toLocaleString('pl-PL') + ' ≈ ' + up.toLocaleString('pl-PL')] };
    }
  });

  // Kolejność wykonywania działań — wyrażenia budowane z szablonów, wynik i wynik „od lewej"
  function ordExpr(r, d) {
    const T = [];
    if (d === 1) {
      const a = r.int(2, 20), b = r.int(2, 9), c = r.int(2, 9);
      T.push({ s: a + ' + ' + b + ' · ' + c, v: a + b * c, ltr: (a + b) * c, ltrSteps: [a + ' + ' + b + ' = ' + (a + b), (a + b) + ' · ' + c + ' = ' + (a + b) * c], steps: [b + ' · ' + c + ' = ' + b * c, a + ' + ' + b * c + ' = ' + (a + b * c)], ops: [b + ' · ' + c, a + ' + ' + (b * c)] });
      const q = r.int(2, 9), e = r.int(2, 9), f = q * e, g = r.int(f + 1, f + 30);
      T.push({ s: g + ' − ' + f + ' : ' + e, v: g - q, ltr: (g - f) / e, steps: [f + ' : ' + e + ' = ' + q, g + ' − ' + q + ' = ' + (g - q)], ops: [f + ' : ' + e, g + ' − ' + q] });
    } else if (d === 2) {
      const a = r.int(2, 9), b = r.int(2, 12), c = r.int(2, 9);
      T.push({ s: a + ' · (' + b + ' + ' + c + ')', v: a * (b + c), ltr: a * b + c, ltrSteps: [a + ' · ' + b + ' = ' + a * b, a * b + ' + ' + c + ' = ' + (a * b + c)], steps: [b + ' + ' + c + ' = ' + (b + c), a + ' · ' + (b + c) + ' = ' + a * (b + c)], ops: [b + ' + ' + c, a + ' · ' + (b + c)] });
      const x = r.int(2, 6), y = r.int(2, 6), z = r.int(10, 40);
      T.push({ s: z + ' + ' + x + ' · ' + y + ' − ' + x, v: z + x * y - x, ltr: (z + x) * y - x, ltrSteps: [z + ' + ' + x + ' = ' + (z + x), (z + x) + ' · ' + y + ' = ' + (z + x) * y, (z + x) * y + ' − ' + x + ' = ' + ((z + x) * y - x)], steps: [x + ' · ' + y + ' = ' + x * y, z + ' + ' + x * y + ' = ' + (z + x * y), (z + x * y) + ' − ' + x + ' = ' + (z + x * y - x)], ops: [x + ' · ' + y, z + ' + ' + x * y, (z + x * y) + ' − ' + x] });
    } else {
      const a = r.int(2, 5), b = r.int(1, 4), c = r.int(2, 4), k = r.int(10, 30);
      const inner = a + b;
      T.push({ s: k + ' + ' + c + ' · (' + a + ' + ' + b + ')²', v: k + c * inner * inner, ltr: (k + c * inner) * (k + c * inner), steps: [a + ' + ' + b + ' = ' + inner, inner + '² = ' + inner * inner, c + ' · ' + inner * inner + ' = ' + c * inner * inner, k + ' + ' + c * inner * inner + ' = ' + (k + c * inner * inner)], ops: [a + ' + ' + b, inner + '²', c + ' · ' + inner * inner, k + ' + ' + c * inner * inner], ltrCode: 'order_ltr' });
      const p = r.int(2, 6), m = p * r.int(2, 6), n2 = r.int(2, 5);
      T.push({ s: '(' + m + ' : ' + p + ' + ' + n2 + ') · ' + p + ' − ' + n2 + '²', v: (m / p + n2) * p - n2 * n2, ltr: (m / p + n2) * p - n2 * 2, ltrCode: 'pow_mult', steps: [m + ' : ' + p + ' = ' + m / p, m / p + ' + ' + n2 + ' = ' + (m / p + n2), n2 + '² = ' + n2 * n2, (m / p + n2) + ' · ' + p + ' = ' + (m / p + n2) * p, (m / p + n2) * p + ' − ' + n2 * n2 + ' = ' + ((m / p + n2) * p - n2 * n2)], ops: [m + ' : ' + p, (m / p) + ' + ' + n2, n2 + '²', (m / p + n2) + ' · ' + p, ((m / p + n2) * p) + ' − ' + n2 * n2] });
    }
    return r.pick(T);
  }
  function ordGen(r, d, type) {
    const e = ordExpr(r, d);
    if (type === 'order') {
      const idx = e.ops.map((_, i) => i), sh = r.shuffle(idx);
      return { type: 'order', prompt: 'Ułóż działania w kolejności, w jakiej trzeba je wykonać w wyrażeniu:<br><b>' + e.s + '</b>', items: sh.map(i => e.ops[i]), answer: { kind: 'order', seq: idx.map(i => sh.indexOf(i)) }, unknownCode: 'order_ltr',
        hints: ['Najpierw nawiasy, potem potęgi, potem mnożenie i dzielenie, na końcu dodawanie i odejmowanie.', 'Znajdź w wyrażeniu nawias – jeśli jest, on idzie pierwszy.', 'Pierwsze działanie to: ' + e.ops[0]], sol: e.steps };
    }
    const wrong = [];
    if (Number.isInteger(e.ltr) && e.ltr !== e.v) wrong.push({ v: N(e.ltr), code: e.ltrCode || 'order_ltr' });
    wrong.push({ v: N(e.v + 1), code: 'calc' }, { v: N(e.v - 2), code: 'calc' });
    return { prompt: 'Oblicz: ' + e.s, value: N(e.v), wrong, unknownCode: 'order_ltr',
      errorVersion: e.ltrSteps && Number.isInteger(e.ltr) && e.ltr !== e.v ? { steps: e.ltrSteps, wrongIdx: 0, code: 'order_ltr', why: 'Kuba liczył po kolei od lewej. A najpierw trzeba wykonać ' + e.ops[0] + '.', intro: 'Kuba rozwiązał to zadanie i wyszło mu ' + e.ltr + '. W którym kroku popełnił błąd?' } : null,
      hints: ['Zanim zaczniesz liczyć, zaznacz, które działanie jest pierwsze.', 'Kolejność: nawiasy → potęgi → mnożenie i dzielenie → dodawanie i odejmowanie.', 'Pierwszy krok: ' + e.steps[0]], sol: e.steps };
  }
  def('ord_basic', { name: 'Kolejność działań bez nawiasów', grade: 4, mainCode: 'order_ltr', types: { 1: ['input', 'choice', 'order'], 2: ['input', 'order', 'choice'], 3: ['input', 'order'] },
    gen(r, d, type) { return ordGen(r, d < 3 ? 1 : 2, type); },
    why: [{ q: 'Dlaczego 2 + 3 · 4 = 14, a nie 20?', opts: [{ t: 'Bo mnożenie wykonujemy przed dodawaniem', ok: true }, { t: 'Bo zawsze liczymy od prawej strony', code: 'order_ltr' }, { t: 'Bo dodawanie jest ważniejsze', code: 'order_ltr' }, { t: 'To błąd – wynik to 20', code: 'order_ltr' }], expl: 'Mnożenie i dzielenie wykonujemy przed dodawaniem i odejmowaniem: 3 · 4 = 12, potem 2 + 12 = 14.' }] });
  def('ord_paren', { name: 'Kolejność działań z nawiasami i potęgami', grade: 5, prereq: ['ord_basic', 'pow_nat'], mainCode: 'order_ltr', types: { 1: ['input', 'order'], 2: ['input', 'order', 'choice'], 3: ['input', 'order'] },
    gen(r, d, type) { return ordGen(r, d === 1 ? 2 : 3, type); },
    why: [{ q: 'Co liczymy najpierw w wyrażeniu 5 · (6 − 2)²?', opts: [{ t: '6 − 2 (nawias)', ok: true }, { t: '5 · 6', code: 'order_ltr' }, { t: '2²', code: 'order_ltr' }, { t: '(6 − 2)² · 5 od prawej', code: 'order_ltr' }], expl: 'Najpierw nawias: 6 − 2 = 4, potem potęga: 4² = 16, na końcu mnożenie: 5 · 16 = 80.' }] });

  def('pow_nat', {
    name: 'Kwadraty i sześciany liczb', grade: 5, mainCode: 'pow_mult', prereq: ['tabl'],
    types: { 1: ['input', 'choice'], 2: ['input', 'choice', 'error'], 3: ['input'] },
    gen(r, d) {
      if (d === 3) {
        const a = r.int(2, 4), b = r.int(2, 5), c = r.int(2, 4);
        return { prompt: 'Oblicz: ' + a + '³ + ' + c + ' · ' + b + '²', value: N(a ** 3 + c * b * b), wrong: [{ v: N(a * 3 + c * b * 2), code: 'pow_mult' }, { v: N(a ** 3 + (c * b) ** 2), code: 'order_ltr' }],
          hints: ['Najpierw policz potęgi, potem mnożenie, na końcu dodawanie.', a + '³ = ' + a + ' · ' + a + ' · ' + a + ', a ' + b + '² = ' + b + ' · ' + b + '.', a + '³ = ' + a ** 3 + ', ' + b + '² = ' + b * b + '.'],
          sol: [a + '³ = ' + a ** 3, b + '² = ' + b * b, c + ' · ' + b * b + ' = ' + c * b * b, a ** 3 + ' + ' + c * b * b + ' = ' + (a ** 3 + c * b * b)] };
      }
      const cube = d === 2 && r.chance(0.6);
      const a = cube ? r.int(2, 5) : (d === 1 ? r.int(2, 9) : r.pick([11, 12, 13, 15, 20, 30]));
      const e = cube ? 3 : 2, v = a ** e;
      return { prompt: 'Oblicz: ' + a + (e === 2 ? '²' : '³'), value: N(v), wrong: [{ v: N(a * e), code: 'pow_mult' }, { v: N(a + e), code: 'pow_mult' }, { v: N(e === 3 ? a * a : a ** 3), code: 'calc' }],
        errorVersion: { steps: [a + (e === 2 ? '²' : '³') + ' = ' + a + ' · ' + e, '= ' + a * e], wrongIdx: 0, code: 'pow_mult', why: 'Potęga to mnożenie podstawy przez siebie, a nie przez wykładnik.' },
        hints: ['Mała liczba u góry mówi, ile razy pomnożyć podstawę przez samą siebie.', a + (e === 2 ? '²' : '³') + ' = ' + Array(e).fill(a).join(' · '), e === 3 ? 'Najpierw ' + a + ' · ' + a + ' = ' + a * a + ', potem jeszcze raz · ' + a + '.' : 'Policz ' + a + ' · ' + a + '.'],
        sol: [a + (e === 2 ? '²' : '³') + ' = ' + Array(e).fill(a).join(' · ') + ' = ' + v] };
    },
    why: [{ q: 'Co oznacza zapis 4³?', opts: [{ t: '4 · 4 · 4', ok: true }, { t: '4 · 3', code: 'pow_mult' }, { t: '4 + 4 + 4', code: 'pow_mult' }, { t: '3 · 3 · 3 · 3', code: 'pow_mult' }], expl: '4³ to trzy czwórki pomnożone przez siebie: 4 · 4 · 4 = 64.' }]
  });

  // ===================== PODZIELNOŚĆ =====================
  def('div_rules', {
    name: 'Cechy podzielności', grade: 5, mainCode: 'div_rule_3',
    types: { 1: ['choice'], 2: ['choice'], 3: ['choice'] },
    gen(r, d) {
      const k = d === 1 ? r.pick([2, 5, 10]) : d === 2 ? r.pick([3, 9]) : r.pick([4, 3, 9]);
      // generujemy liczbę-pułapkę
      let n, tries = 0, yes;
      do {
        n = r.int(100, d === 1 ? 999 : 9999); tries++;
        yes = n % k === 0;
        const last = n % 10;
        const trap = (k === 3 || k === 9) ? ((last % 3 === 0) !== yes) : k === 4 ? (last % 2 === 0 && !yes) || yes : true;
        if (trap && r.chance(0.5) === yes) break;
      } while (tries < 200);
      const sumDig = String(n).split('').reduce((s, c) => s + +c, 0);
      const code = (k === 3 || k === 9) ? 'div_rule_3' : k === 4 ? 'div_rule_4' : 'div_rule_basic';
      const opts = [{ label: 'Tak, dzieli się', ok: yes, code: yes ? null : code }, { label: 'Nie dzieli się', ok: !yes, code: yes ? code : null }];
      const rule = k === 2 ? 'ostatnia cyfra parzysta' : k === 5 ? 'ostatnia cyfra 0 lub 5' : k === 10 ? 'ostatnia cyfra 0' : k === 4 ? 'liczba z dwóch ostatnich cyfr dzieli się przez 4' : 'suma cyfr dzieli się przez ' + k;
      return { type: 'choice', prompt: 'Czy liczba <b>' + n + '</b> dzieli się przez ' + k + '?', options: opts, answer: { kind: 'choice', correct: yes ? 0 : 1 },
        hints: ['Przypomnij sobie cechę podzielności przez ' + k + '.', 'Cecha: ' + rule + '.', (k === 3 || k === 9) ? 'Suma cyfr: ' + String(n).split('').join(' + ') + ' = ' + sumDig + '.' : k === 4 ? 'Dwie ostatnie cyfry tworzą liczbę ' + (n % 100) + '.' : 'Ostatnia cyfra to ' + (n % 10) + '.'],
        sol: [(k === 3 || k === 9) ? 'Suma cyfr = ' + sumDig + (sumDig % k === 0 ? ' – dzieli się przez ' + k : ' – nie dzieli się przez ' + k) : k === 4 ? (n % 100) + (n % 100 % 4 === 0 ? ' dzieli się przez 4' : ' nie dzieli się przez 4') : 'Ostatnia cyfra: ' + (n % 10), yes ? 'Więc ' + n + ' dzieli się przez ' + k + '.' : 'Więc ' + n + ' nie dzieli się przez ' + k + '.'] };
    },
    why: [{ q: 'Dlaczego przy sprawdzaniu podzielności przez 3 nie wystarczy spojrzeć na ostatnią cyfrę?', opts: [{ t: 'Bo np. 13 kończy się na 3, a nie dzieli się przez 3 – trzeba dodać cyfry', ok: true }, { t: 'Wystarczy – liczby kończące się na 3, 6, 9 dzielą się przez 3', code: 'div_rule_3' }, { t: 'Bo przez 3 dzielą się tylko liczby parzyste', code: 'div_rule_3' }], expl: 'Ostatnia cyfra działa tylko dla 2, 5 i 10. Dla 3 i 9 sprawdzamy sumę cyfr (np. 13: 1 + 3 = 4 – nie dzieli się przez 3).' }]
  });

  const PRIMES = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97];
  const ODDCOMP = [9, 15, 21, 25, 27, 33, 35, 39, 45, 49, 51, 55, 57, 63, 65, 69, 77, 81, 85, 87, 91, 93, 95];
  def('prime', {
    name: 'Liczby pierwsze i złożone, rozkład na czynniki', grade: 5, mainCode: 'prime_odd', prereq: ['div_rules'],
    types: { 1: ['choice'], 2: ['choice'], 3: ['choice'] },
    gen(r, d) {
      if (d === 3) {
        const pool = [[60, '2 · 2 · 3 · 5', ['4 · 3 · 5', '2 · 30', '6 · 10']], [36, '2 · 2 · 3 · 3', ['4 · 9', '2 · 18', '6 · 6']], [84, '2 · 2 · 3 · 7', ['4 · 21', '2 · 6 · 7', '12 · 7']], [90, '2 · 3 · 3 · 5', ['9 · 10', '2 · 5 · 9', '3 · 30']], [126, '2 · 3 · 3 · 7', ['2 · 9 · 7', '14 · 9', '6 · 21']], [150, '2 · 3 · 5 · 5', ['6 · 25', '2 · 3 · 25', '10 · 15']]];
        const [n, ok, bad] = r.pick(pool);
        const opts = r.shuffle([{ label: ok, ok: true }].concat(r.shuffle(bad).slice(0, 3).map(b => ({ label: b, code: 'prime_factor_nonprime' }))));
        return { type: 'choice', prompt: 'Który zapis to rozkład liczby <b>' + n + '</b> na czynniki pierwsze?', options: opts, answer: { kind: 'choice', correct: opts.findIndex(o => o.ok) },
          hints: ['W rozkładzie mogą być tylko liczby pierwsze: 2, 3, 5, 7, 11…', 'Sprawdź każdy czynnik: czy jest liczbą pierwszą? 4, 6, 9, 10… nie są.', 'Zacznij dzielić ' + n + ' przez 2, dopóki się da, potem przez 3, potem przez 5…'],
          sol: ['Dzielimy ' + n + ' kolejno przez liczby pierwsze.', n + ' = ' + ok] };
      }
      const want = d === 1 ? 'pierwsza' : r.pick(['pierwsza', 'złożona']);
      let opts;
      if (want === 'pierwsza') {
        const p = r.pick(d === 1 ? PRIMES.slice(0, 10) : PRIMES.slice(4));
        const dist = [{ label: '1', code: 'prime_one' }].concat(r.shuffle(ODDCOMP.filter(x => d === 1 ? x < 40 : true)).slice(0, 2).map(x => ({ label: String(x), code: 'prime_odd' })));
        opts = r.shuffle([{ label: String(p), ok: true }].concat(dist));
      } else {
        const c = r.pick(ODDCOMP);
        opts = r.shuffle([{ label: String(c), ok: true }].concat(r.shuffle(PRIMES.slice(3, 20)).slice(0, 2).map(x => ({ label: String(x), code: 'prime_odd' })), [{ label: '1', code: 'prime_one' }]));
      }
      const ans = opts.find(o => o.ok).label;
      return { type: 'choice', prompt: 'Która z liczb jest <b>' + want + '</b>?', options: opts, answer: { kind: 'choice', correct: opts.findIndex(o => o.ok) },
        hints: ['Liczba pierwsza ma dokładnie dwa dzielniki: 1 i samą siebie. Złożona ma więcej.', 'Sprawdź, czy liczby dzielą się przez 2, 3, 5 lub 7. Pamiętaj, że 1 nie jest ani pierwsza, ani złożona.', 'Przyjrzyj się liczbie ' + ans + '.'],
        sol: [want === 'pierwsza' ? ans + ' dzieli się tylko przez 1 i przez ' + ans + ', więc jest pierwsza.' : ans + ' ma więcej niż dwa dzielniki, więc jest złożona.', 'Liczba 1 nie jest ani pierwsza, ani złożona.'] };
    },
    why: [{ q: 'Dlaczego 1 nie jest liczbą pierwszą?', opts: [{ t: 'Bo ma tylko jeden dzielnik, a liczba pierwsza ma dokładnie dwa', ok: true }, { t: 'Bo jest nieparzysta', code: 'prime_odd' }, { t: 'Jest liczbą pierwszą', code: 'prime_one' }, { t: 'Bo jest za mała', code: 'prime_one' }], expl: 'Liczba pierwsza ma dokładnie dwa różne dzielniki. 1 dzieli się tylko przez 1.' }]
  });

  function divisors(n) { const a = []; for (let i = 1; i <= n; i++) if (n % i === 0) a.push(i); return a; }
  def('nwd', {
    name: 'Największy wspólny dzielnik (NWD)', grade: 5, mainCode: 'nwd_nww_swap', prereq: ['tabl', 'div_rules'],
    types: { 1: ['input', 'choice'], 2: ['input', 'choice'], 3: ['input', 'choice'] },
    gen(r, d) {
      const g = d === 1 ? r.pick([2, 3, 4, 5, 6]) : r.pick([4, 6, 8, 9, 12]);
      let x, y; do { x = r.int(2, d === 1 ? 6 : 8); y = r.int(2, d === 1 ? 6 : 8); } while (x === y || gcd(x, y) !== 1);
      const a = g * x, b = g * y, L = lcm(a, b);
      const smallerCommon = divisors(g).filter(t => t > 1 && t < g);
      const wrong = [{ v: N(L), code: 'nwd_nww_swap' }, { v: N(a * b), code: 'nwd_nww_swap' }];
      if (smallerCommon.length) wrong.push({ v: N(r.pick(smallerCommon)), code: 'nwd_not_greatest' });
      const prompt = d === 3 ? MP.th().nwd(a, b) : 'Oblicz NWD(' + a + ', ' + b + ').';
      return { prompt, value: N(g), wrong, unknownCode: 'nwd_not_greatest',
        hints: ['NWD to największa liczba, przez którą dzielą się obie liczby.', 'Wypisz dzielniki: ' + a + ' → ' + divisors(a).join(', ') + '.', 'Dzielniki ' + b + ': ' + divisors(b).join(', ') + '. Które są wspólne?'],
        sol: ['Dzielniki ' + a + ': ' + divisors(a).join(', '), 'Dzielniki ' + b + ': ' + divisors(b).join(', '), 'Największy wspólny: ' + g + (d === 3 ? ' – tyle jednakowych zestawów (w każdym ' + x + ' i ' + y + ' sztuk).' : '')] };
    },
    why: [{ q: 'NWD dwóch liczb jest zawsze…', opts: [{ t: 'mniejszy lub równy od każdej z tych liczb', ok: true }, { t: 'większy od obu liczb', code: 'nwd_nww_swap' }, { t: 'równy ich iloczynowi', code: 'nwd_nww_swap' }, { t: 'równy ich sumie', code: 'concept' }], expl: 'Dzielnik „mieści się" w liczbie, więc nie może być od niej większy.' }]
  });
  def('nww', {
    name: 'Najmniejsza wspólna wielokrotność (NWW)', grade: 5, mainCode: 'nww_product', prereq: ['tabl'],
    types: { 1: ['input', 'choice'], 2: ['input', 'choice'], 3: ['input', 'choice'] },
    gen(r, d) {
      const pairs = d === 1 ? [[2, 3], [3, 4], [2, 5], [4, 5], [3, 5], [2, 7]] : [[4, 6], [6, 8], [6, 9], [8, 12], [9, 12], [10, 15], [6, 10], [12, 18], [4, 10]];
      const [a, b] = r.shuffle(r.pick(pairs)), L = lcm(a, b);
      const wrong = [{ v: N(gcd(a, b)), code: 'nwd_nww_swap' }, { v: N(a + b), code: 'lcd_sum' }];
      if (a * b !== L) wrong.push({ v: N(a * b), code: 'nww_product' });
      const mult = (n) => [1, 2, 3, 4, 5, 6].map(k => n * k).join(', ');
      const prompt = d === 3 ? MP.th().nww(a, b) : 'Oblicz NWW(' + a + ', ' + b + ').';
      return { prompt, value: N(L), wrong, unknownCode: 'nww_product',
        hints: ['NWW to najmniejsza liczba, która dzieli się przez obie liczby.', 'Wypisz wielokrotności większej liczby: ' + mult(Math.max(a, b)) + '…', 'Która z nich dzieli się też przez ' + Math.min(a, b) + '?'],
        sol: ['Wielokrotności ' + a + ': ' + mult(a), 'Wielokrotności ' + b + ': ' + mult(b), 'Najmniejsza wspólna: ' + L] };
    },
    why: [{ q: 'Dlaczego NWW(4, 6) = 12, a nie 24?', opts: [{ t: 'Bo 12 dzieli się przez 4 i przez 6 i jest najmniejszą taką liczbą', ok: true }, { t: 'Bo NWW to zawsze iloczyn liczb', code: 'nww_product' }, { t: 'Bo 4 + 6 + 2 = 12', code: 'lcd_sum' }], expl: '24 też jest wspólną wielokrotnością, ale 12 jest mniejsza i też dzieli się przez 4 i 6.' }]
  });

  // ===================== UŁAMKI ZWYKŁE =====================
  def('fr_part', {
    name: 'Ułamek jako część całości', grade: 4, mainCode: 'frac_flip', fmt: (v) => fmtImp(v),
    types: { 1: ['input', 'choice'], 2: ['input', 'choice'], 3: ['input', 'choice'] },
    gen(r, d) {
      const den = r.pick(d === 1 ? [3, 4, 5, 6, 8] : [5, 6, 8, 10, 12]), n = r.int(1, den - 1);
      if (d === 3) {
        const total = r.pick([24, 28, 30, 32]); const girls = r.int(Math.floor(total / 3), Math.floor(total * 2 / 3)); const boys = total - girls;
        return { prompt: MP.th().part(total, girls) + ' Zapisz ułamek.', value: red(F(boys, total)), wrong: [{ v: red(F(girls, total)), code: 'read' }, { v: red(F(boys, girls)), code: 'frac_part_rest' }, { v: red(F(total, boys)), code: 'frac_flip' }],
          hints: ['Najpierw policz, ile jest tych, o które pyta zadanie.', 'Jest ich ' + total + ' − ' + girls + ' = ' + boys + '. Całość to wszystkie ' + total + '.', 'Ułamek: (ta grupa) / (wszyscy razem).'],
          sol: [total + ' − ' + girls + ' = ' + boys, 'Część całości: ' + fr(boys, total) + (gcd(boys, total) > 1 ? ' = ' + fmtF(red(F(boys, total))) : '')] };
      }
      const asked = d === 2 && r.chance(0.5) ? 'nie' : '';
      const vis = r.chance(0.5) ? pie(n, den) : bar(n, den);
      const ans = asked ? F(den - n, den) : F(n, den);
      return { prompt: 'Jaka część figury jest ' + (asked ? '<b>niezamalowana</b>' : 'zamalowana') + '?', visual: vis, value: ans,
        wrong: [{ v: F(asked ? n : den - n, den), code: 'read' }, { v: n === den - n ? F(den, n) : F(n, den - n), code: 'frac_part_rest' }, { v: F(den, Math.max(1, n)), code: 'frac_flip' }],
        hints: ['Policz, na ile RÓWNYCH części podzielono całą figurę – to będzie mianownik (na dole).', 'Wszystkich części jest ' + den + '. Teraz policz te ' + (asked ? 'niezamalowane' : 'zamalowane') + ' – to licznik.', (asked ? 'Niezamalowanych' : 'Zamalowanych') + ' części jest ' + ans.n + '.'],
        sol: ['Wszystkich części: ' + den + ' (mianownik)', (asked ? 'Niezamalowanych' : 'Zamalowanych') + ': ' + ans.n + ' (licznik)', 'Odpowiedź: ' + fr(ans.n, den)] };
    },
    why: [{ q: 'Co oznacza mianownik w ułamku 3/8?', opts: [{ t: 'Na ile równych części podzielono całość', ok: true }, { t: 'Ile części wzięliśmy', code: 'frac_flip' }, { t: 'Ile części zostało', code: 'frac_part_rest' }, { t: 'Nic – liczy się tylko licznik', code: 'concept' }], expl: 'Mianownik (na dole) mówi, na ile równych części podzielono całość: tu na 8.' }]
  });

  def('fr_expand', {
    name: 'Rozszerzanie ułamków', grade: 4, mainCode: 'frac_expand_num', prereq: ['tabl'],
    types: { 1: ['fill', 'choice'], 2: ['fill', 'choice'], 3: ['fill', 'choice'] },
    gen(r, d) {
      const b = r.int(2, d === 1 ? 6 : 9), a = r.int(1, b - 1), k = r.int(2, d === 1 ? 4 : 8);
      if (gcd(a, b) !== 1) return this.gen(r, d);
      const askDen = d >= 2 && r.chance(0.5);
      if (askDen) {
        return { prompt: 'Uzupełnij: ' + fr(a, b) + ' = [[' + a * k + '/□]]', fill: true, value: N(b * k), wrong: [{ v: N(b + (a * k - a)), code: 'frac_expand_add' }, { v: N(b * k + 1), code: 'calc' }, { v: N(b), code: 'frac_expand_num' }],
          hints: ['Licznik zmienił się z ' + a + ' na ' + a * k + '. Przez ile go pomnożono?', a + ' · ' + k + ' = ' + a * k + '. Mianownik trzeba pomnożyć przez tę samą liczbę.', 'Policz ' + b + ' · ' + k + '.'],
          sol: [a + ' · ' + k + ' = ' + a * k + ', więc mnożymy przez ' + k, b + ' · ' + k + ' = ' + b * k, fr(a, b) + ' = ' + fr(a * k, b * k)] };
      }
      return { prompt: 'Uzupełnij: ' + fr(a, b) + ' = [[□/' + b * k + ']]', fill: true, value: N(a * k), wrong: [{ v: N(a + (b * k - b)), code: 'frac_expand_add' }, { v: N(a), code: 'frac_expand_num' }, { v: N(a * k + 1), code: 'calc' }],
        hints: ['Mianownik zmienił się z ' + b + ' na ' + b * k + '. Przez ile go pomnożono?', b + ' · ' + k + ' = ' + b * k + '. Licznik musisz pomnożyć przez tę samą liczbę.', 'Policz ' + a + ' · ' + k + '.'],
        sol: [b + ' · ' + k + ' = ' + b * k + ', więc mnożymy przez ' + k, a + ' · ' + k + ' = ' + a * k, fr(a, b) + ' = ' + fr(a * k, b * k)],
        errorVersion: { steps: ['Mianownik: ' + b + ' → ' + b * k + ', czyli + ' + (b * k - b), 'Licznik: ' + a + ' + ' + (b * k - b) + ' = ' + (a + b * k - b), fr(a, b) + ' = ' + fr(a + b * k - b, b * k)], wrongIdx: 0, code: 'frac_expand_add', why: 'Ułamek rozszerzamy mnożąc, a nie dodając.' } };
    },
    why: [{ q: 'Dlaczego 1/2 = 2/4?', opts: [{ t: 'Bo licznik i mianownik pomnożono przez 2 – to ta sama część całości', ok: true }, { t: 'Bo do licznika i mianownika dodano 1', code: 'frac_expand_add' }, { t: 'Nie są równe – 2/4 jest większe', code: 'frac_compare_den' }, { t: 'Bo 2 + 4 = 6', code: 'concept' }], expl: 'Gdy każdą połowę przetniesz na 2 kawałki, masz 2 kawałki z 4 – to wciąż połowa.' }]
  });

  def('fr_simplify', {
    name: 'Skracanie ułamków', grade: 4, mainCode: 'frac_simpl_sub', prereq: ['fr_expand', 'tabl'],
    types: { 1: ['input', 'choice'], 2: ['input', 'choice'], 3: ['input', 'choice'] },
    gen(r, d) {
      let a, b; do { b = r.int(2, 9); a = r.int(1, b - 1); } while (gcd(a, b) !== 1);
      const k = d === 1 ? r.pick([2, 3, 5]) : d === 2 ? r.pick([4, 6, 8]) : r.pick([6, 8, 9, 12]);
      const A = a * k, B = b * k, c = Math.min(A - 1, r.int(1, 3));
      const part = divisors(k).filter(t => t > 1 && t < k);
      const wrong = [{ v: red(F(A - c, B - c)).n === A - c ? F(A - c, B - c) : F(A - c, B - c), code: 'frac_simpl_sub' }, { v: F(a, b + 1), code: 'calc' }];
      return { prompt: 'Skróć ułamek ' + fr(A, B) + ' maksymalnie.', value: F(a, b), form: 'simplest', wrong,
        hints: ['Znajdź liczbę, przez którą dzielą się i licznik, i mianownik.', 'Licznik i mianownik dzielą się przez ' + (part.length ? part[0] : k) + '. Podziel oba.' + (part.length ? ' Może da się skrócić jeszcze raz?' : ''), 'Najlepiej podzielić przez NWD(' + A + ', ' + B + ') = ' + k + '.'],
        sol: ['NWD(' + A + ', ' + B + ') = ' + k, A + ' : ' + k + ' = ' + a + ', ' + B + ' : ' + k + ' = ' + b, fr(A, B) + ' = ' + fr(a, b)],
        errorVersion: { steps: ['Odejmuję ' + c + ' od licznika i mianownika', fr(A, B) + ' = ' + fr(A - c, B - c)], wrongIdx: 0, code: 'frac_simpl_sub', why: 'Skracanie to dzielenie licznika i mianownika przez tę samą liczbę. Odejmowanie zmienia wartość ułamka.' } };
    },
    why: [{ q: 'Skracając ułamek 6/9 do 2/3…', opts: [{ t: 'nie zmieniamy jego wartości – dzielimy licznik i mianownik przez 3', ok: true }, { t: 'zmniejszamy jego wartość', code: 'frac_simpl_sub' }, { t: 'odejmujemy 4 od licznika i 6 od mianownika', code: 'frac_simpl_sub' }], expl: 'Skracanie to odwrotność rozszerzania – wartość ułamka się nie zmienia.' }]
  });

  def('fr_mixed', {
    name: 'Liczby mieszane i ułamki niewłaściwe', grade: 4, mainCode: 'frac_mixed_conv', prereq: ['tabl', 'nat_div_rem'],
    types: { 1: ['input', 'choice'], 2: ['fill', 'choice'], 3: ['input', 'choice'] },
    gen(r, d) {
      const b = r.int(2, d === 3 ? 12 : 8), w = r.int(1, d === 3 ? 9 : 5); let a = r.int(1, b - 1);
      if (gcd(a, b) !== 1) a = 1;
      const n = w * b + a;
      if (d === 2) {
        return { prompt: 'Zamień na ułamek niewłaściwy: [[' + w + ' ' + a + '/' + b + ']] = [[□/' + b + ']]', fill: true, value: N(n), wrong: [{ v: N(w * b), code: 'frac_mixed_conv' }, { v: N(w + a), code: 'frac_mixed_conv' }, { v: N(w * a + b), code: 'frac_mixed_conv' }],
          hints: ['Ile ' + b + '-ych części jest w jednej całości?', 'W ' + w + ' całościach jest ' + w + ' · ' + b + ' = ' + w * b + ' części.', 'Dodaj jeszcze ' + a + ' części.'], sol: [w + ' · ' + b + ' = ' + w * b, w * b + ' + ' + a + ' = ' + n, '[[' + w + ' ' + a + '/' + b + ']] = ' + fr(n, b)],
          errorVersion: { steps: [w + ' · ' + a + ' = ' + w * a, w * a + ' + ' + b + ' = ' + (w * a + b), '[[' + w + ' ' + a + '/' + b + ']] = ' + fr(w * a + b, b)], wrongIdx: 0, code: 'frac_mixed_conv', why: 'Całości mnożymy przez MIANOWNIK, a nie przez licznik.' } };
      }
      return { prompt: 'Zamień ułamek ' + fr(n, b) + ' na liczbę mieszaną.', value: F(n, b), form: 'mixed', wrong: [{ v: F(a * b + w, b), code: 'frac_mixed_conv' }, { v: F((w + 1) * b + a, b), code: 'calc' }, { v: F(w * b, b), code: 'frac_mixed_conv' }],
        hints: ['Ile całości mieści się w ' + fr(n, b) + '? Podziel ' + n + ' przez ' + b + '.', n + ' : ' + b + ' = ' + w + ' reszta ' + a + '.', 'Wynik dzielenia to całości, reszta to licznik, mianownik zostaje ' + b + '.'],
        sol: [n + ' : ' + b + ' = ' + w + ' r. ' + a, fr(n, b) + ' = [[' + w + ' ' + a + '/' + b + ']]'] };
    },
    why: [{ q: 'Ile to jest 2 1/4 w ćwiartkach (czwartych częściach)?', opts: [{ t: '9/4', ok: true }, { t: '3/4', code: 'frac_mixed_conv' }, { t: '8/4', code: 'frac_mixed_conv' }, { t: '6/4', code: 'frac_mixed_conv' }], expl: 'Jedna całość to 4 ćwiartki, więc 2 całości = 8 ćwiartek. Do tego 1 ćwiartka: 9/4.' }]
  });

  function cmpGen(r, d, type, mk, toLabel, codeFor, names) {
    // mk(): zwraca [x, y] dwie liczby (ułamki F); toLabel: zapis
    if (type === 'order') {
      const L = mk('order');
      const vals = L.vals, sortedIdx = vals.map((v, i) => i).sort((i, j) => U.val(vals[i]) - U.val(vals[j]));
      const sh = r.shuffle(vals.map((v, i) => i));
      const items = sh.map(i => toLabel(vals[i]));
      const seq = sortedIdx.map(i => sh.indexOf(i));
      const wrongOrders = (L.wrongSorts || []).map(ws => ({ seq: ws.order.map(i => sh.indexOf(i)), code: ws.code }));
      return { type: 'order', prompt: 'Ułóż liczby od <b>najmniejszej</b> do <b>największej</b>.', items, answer: { kind: 'order', seq }, wrongOrders, unknownCode: L.code,
        hints: L.hints, sol: [sortedIdx.map(i => toLabel(vals[i])).join(' < ')] };
    }
    const P = mk('pair');
    const [x, y] = P.vals, c = Math.sign(U.val(x) - U.val(y));
    const syms = ['<', '>', '='], correct = c < 0 ? 0 : c > 0 ? 1 : 2;
    const opts = syms.map((s, i) => ({ label: s, ok: i === correct, code: i === correct ? null : (P.miscon && P.miscon[i]) || 'calc' }));
    return { type: 'choice', prompt: 'Wstaw znak: ' + toLabel(x) + ' □ ' + toLabel(y), options: opts, answer: { kind: 'choice', correct }, inline: true, hints: P.hints, sol: P.sol(syms[correct]) };
  }
  def('fr_compare', {
    name: 'Porównywanie ułamków zwykłych', grade: 5, mainCode: 'frac_compare_den', prereq: ['fr_part', 'fr_expand'],
    types: { 1: ['choice'], 2: ['choice'], 3: ['choice', 'order'] },
    gen(r, d, type) {
      const sym = (a, b) => U.val(a) < U.val(b) ? 0 : U.val(a) > U.val(b) ? 1 : 2;
      return cmpGen(r, d, type, (mode) => {
        if (mode === 'order') {
          const base = r.pick([[1, 2], [1, 3], [2, 3], [3, 4], [1, 6], [5, 8], [2, 5], [3, 10]]);
          let vals = r.shuffle([[1, 2], [1, 3], [2, 3], [3, 4], [1, 6], [5, 8], [2, 5], [3, 10], [5, 6], [1, 4]]).filter((p, i, A) => A.findIndex(q => q[0] / q[1] === p[0] / p[1]) === i).slice(0, 4).map(p => F(p[0], p[1]));
          const byDen = vals.map((v, i) => i).sort((i, j) => vals[i].d - vals[j].d || vals[i].n - vals[j].n);
          const byNum = vals.map((v, i) => i).sort((i, j) => vals[i].n - vals[j].n || vals[i].d - vals[j].d);
          return { vals, wrongSorts: [{ order: byDen, code: 'frac_compare_den' }, { order: byNum, code: 'frac_compare_num' }], code: 'frac_compare_num',
            hints: ['Zamień wszystkie ułamki na wspólny mianownik albo porównaj je z 1/2.', 'Wspólny mianownik dla 2, 3, 4, 5, 6, 8, 10 to np. 120.', 'Najmniejszy ułamek to ' + fmtF(vals.slice().sort((a, b) => U.val(a) - U.val(b))[0]) + '.'] };
        }
        let x, y, kind;
        if (d === 1) { const den = r.int(4, 12); let a = r.int(1, den - 1), b = r.int(1, den - 1); if (a === b) b = a === 1 ? 2 : a - 1; x = F(a, den); y = F(b, den); kind = 'den'; }
        else if (d === 2) { const n = r.int(1, 5); let p = r.int(n + 1, 9), q = r.int(n + 1, 12); if (p === q) q++; x = F(n, p); y = F(n, q); kind = 'num'; }
        else { const pairs = [[2, 3, 3, 4], [3, 5, 2, 3], [5, 6, 7, 9], [3, 4, 5, 7], [4, 9, 1, 2], [7, 10, 2, 3], [5, 8, 3, 5], [2, 7, 1, 4]]; const p = r.pick(pairs); x = F(p[0], p[1]); y = F(p[2], p[3]); if (r.chance(0.5)) [x, y] = [y, x]; kind = 'mix'; }
        const mis = {};
        if (kind === 'num') { const byDen = x.d > y.d ? 1 : 0; if (byDen !== sym(x, y)) mis[byDen] = 'frac_compare_den'; }
        if (kind === 'mix') { const byNum = x.n > y.n ? 1 : x.n < y.n ? 0 : 2; if (byNum !== sym(x, y)) mis[byNum] = 'frac_compare_num'; const byDen = x.d > y.d ? 1 : 0; if (byDen !== sym(x, y) && !mis[byDen]) mis[byDen] = 'frac_compare_den'; }
        const L = lcm(x.d, y.d);
        return { vals: [x, y], miscon: mis,
          hints: kind === 'den' ? ['Mianowniki są takie same – kawałki mają tę samą wielkość.', 'Wystarczy porównać liczniki: który ułamek ma więcej kawałków?', 'Porównaj ' + x.n + ' i ' + y.n + '.']
            : kind === 'num' ? ['Liczniki są takie same – masz tyle samo kawałków. Które kawałki są większe?', 'Większy mianownik oznacza mniejsze kawałki.', fr(1, x.d) + ' jest ' + (x.d < y.d ? 'większe' : 'mniejsze') + ' niż ' + fr(1, y.d) + '.']
              : ['Sprowadź oba ułamki do wspólnego mianownika.', 'Wspólny mianownik: ' + L + '.', fmtF(x) + ' = ' + fr(x.n * L / x.d, L) + ', ' + fmtF(y) + ' = ' + fr(y.n * L / y.d, L) + '.'],
          sol: (s) => kind === 'mix' ? [fmtF(x) + ' = ' + fr(x.n * L / x.d, L), fmtF(y) + ' = ' + fr(y.n * L / y.d, L), fmtF(x) + ' ' + s + ' ' + fmtF(y)] : [fmtF(x) + ' ' + s + ' ' + fmtF(y)] };
      }, (v) => fmtF(v));
    },
    why: [{ q: 'Dlaczego 1/3 > 1/5?', opts: [{ t: 'Bo dzieląc całość na 3 części, każdy kawałek jest większy niż przy podziale na 5', ok: true }, { t: 'To nieprawda, bo 5 > 3', code: 'frac_compare_den' }, { t: 'Bo 3 jest liczbą pierwszą', code: 'concept' }], expl: 'Im mniej części, tym większa każda z nich. Dlatego 1/3 > 1/5.' }]
  });

  def('fr_common', {
    name: 'Sprowadzanie ułamków do wspólnego mianownika', grade: 5, mainCode: 'lcd_sum', prereq: ['fr_expand', 'nww'],
    types: { 1: ['input', 'choice'], 2: ['multi'], 3: ['multi', 'input'] },
    gen(r, d, type) {
      const pairs = d === 1 ? [[2, 4], [3, 6], [2, 6], [4, 8], [5, 10], [2, 3], [3, 4]] : [[4, 6], [6, 8], [6, 9], [8, 12], [10, 15], [4, 10], [6, 4], [9, 12]];
      const [b1, b2] = r.shuffle(r.pick(pairs)); const L = lcm(b1, b2);
      let a1 = r.int(1, b1 - 1), a2 = r.int(1, b2 - 1); if (gcd(a1, b1) !== 1) a1 = 1; if (gcd(a2, b2) !== 1) a2 = 1;
      if (type === 'multi') {
        return { type: 'multi', prompt: 'Sprowadź do wspólnego mianownika ' + L + ':<br>' + fr(a1, b1) + ' = [[□/' + L + ']]  i  ' + fr(a2, b2) + ' = [[□/' + L + ']]', labels: ['licznik 1', 'licznik 2'], answer: { kind: 'multi', values: [N(a1 * L / b1), N(a2 * L / b2)] }, multiCodes: ['frac_expand_num', 'frac_expand_num'],
          hints: ['Każdy ułamek rozszerz tak, by miał mianownik ' + L + '.', 'Przez ile trzeba pomnożyć ' + b1 + ', by dostać ' + L + '? A ' + b2 + '?', b1 + ' · ' + L / b1 + ' = ' + L + ', więc licznik ' + a1 + ' też mnożymy przez ' + L / b1 + '.'],
          sol: [fr(a1, b1) + ' = ' + fr(a1 + ' · ' + L / b1, b1 + ' · ' + L / b1) + ' = ' + fr(a1 * L / b1, L), fr(a2, b2) + ' = ' + fr(a2 + ' · ' + L / b2, b2 + ' · ' + L / b2) + ' = ' + fr(a2 * L / b2, L)] };
      }
      const wrong = [{ v: N(b1 + b2), code: 'lcd_sum' }, { v: N(Math.max(b1, b2)), code: 'unknown' }];
      if (b1 * b2 !== L) wrong.push({ v: N(b1 * b2), code: 'lcd_product' });
      return { prompt: 'Jaki jest <b>najmniejszy</b> wspólny mianownik ułamków ' + fr(a1, b1) + ' i ' + fr(a2, b2) + '?', value: N(L), wrong, unknownCode: 'lcd_sum',
        hints: ['Wspólny mianownik musi dzielić się przez ' + b1 + ' i przez ' + b2 + '.', 'To jest NWW(' + b1 + ', ' + b2 + '). Wypisz wielokrotności ' + Math.max(b1, b2) + '.', 'Wielokrotności ' + Math.max(b1, b2) + ': ' + [1, 2, 3, 4].map(k => k * Math.max(b1, b2)).join(', ') + '… Która dzieli się przez ' + Math.min(b1, b2) + '?'],
        sol: ['NWW(' + b1 + ', ' + b2 + ') = ' + L, 'Najmniejszy wspólny mianownik: ' + L] };
    },
    why: [{ q: 'Po co sprowadzamy ułamki do wspólnego mianownika przed dodawaniem?', opts: [{ t: 'Żeby kawałki miały tę samą wielkość – wtedy można je policzyć razem', ok: true }, { t: 'Żeby wynik był większy', code: 'concept' }, { t: 'Nie trzeba – wystarczy dodać liczniki i mianowniki', code: 'frac_add_both' }, { t: 'Bo tak każe nauczyciel', code: 'concept' }], expl: 'Nie dodamy „połówek" i „ćwiartek" tak po prostu – najpierw zamieniamy je na kawałki tej samej wielkości: 1/2 = 2/4.' }]
  });

  // ===================== DZIAŁANIA NA UŁAMKACH ZWYKŁYCH =====================
  function addSteps(a, b, c, dd, op) {
    const L = lcm(b, dd), k1 = L / b, k2 = L / dd, n1 = a * k1, n2 = c * k2, res = op === '+' ? n1 + n2 : n1 - n2;
    const R = red(F(res, L));
    const s = [];
    if (b !== dd) s.push('Wspólny mianownik: NWW(' + b + ', ' + dd + ') = ' + L, fr(a, b) + ' = ' + fr(n1, L) + ',  ' + fr(c, dd) + ' = ' + fr(n2, L));
    s.push(fr(n1, L) + ' ' + (op === '+' ? '+' : '−') + ' ' + fr(n2, L) + ' = ' + fr(res, L));
    if (!(R.n === res && R.d === L)) s.push(fr(res, L) + ' = ' + fmtF(R));
    return { s, L, n1, n2, res, R };
  }
  def('fr_add_same', {
    name: 'Dodawanie i odejmowanie ułamków o jednakowych mianownikach', grade: 4, mainCode: 'frac_add_both', prereq: ['fr_part'],
    types: { 1: ['input', 'choice'], 2: ['input', 'choice', 'error'], 3: ['input'] },
    gen(r, d) {
      const b = r.int(5, 12);
      if (d === 3) {
        const total = b; const x = r.int(1, Math.floor(b / 3)), y = r.int(1, Math.floor(b / 3));
        const ans = F(b - x - y, b);
        return { prompt: MP.th().pieces(b, fr(x, b), fr(y, b)), value: red(ans), wrong: [{ v: red(F(x + y, b)), code: 'read' }, { v: red(F(b - x - y, 3 * b)), code: 'frac_add_both' }],
          hints: ['Całość to ' + fr(b, b) + ' = 1.', 'Najpierw policz, ile ubyło razem: ' + fr(x, b) + ' + ' + fr(y, b) + '.', 'Razem to ' + fr(x + y, b) + '. Odejmij to od całości ' + fr(b, b) + '.'],
          sol: [fr(x, b) + ' + ' + fr(y, b) + ' = ' + fr(x + y, b), fr(b, b) + ' − ' + fr(x + y, b) + ' = ' + fr(b - x - y, b) + (gcd(b - x - y, b) > 1 ? ' = ' + fmtF(red(ans)) : '')] };
      }
      const minus = d === 2 && r.chance(0.5);
      let a, c;
      if (minus) { a = r.int(3, b - 1); c = r.int(1, a - 1); }
      else if (d === 1) { a = r.int(1, b - 2); c = r.int(1, b - 1 - a); }
      else { a = r.int(Math.ceil(b / 2), b - 1); c = r.int(Math.ceil(b / 2), b - 1); }
      const res = minus ? a - c : a + c, R = red(F(res, b));
      const wrong = minus ? [{ v: red(F(a + c, b)), code: 'frac_sub_sign' }, { v: F(res, 1), code: 'frac_add_both' }] : [{ v: red(F(a + c, b + b)), code: 'frac_add_both' }, { v: red(F(a * c, b)), code: 'op_confuse' }];
      return { prompt: 'Oblicz: ' + fr(a, b) + (minus ? ' − ' : ' + ') + fr(c, b), value: R, form: 'simplest', wrong,
        errorVersion: !minus ? { steps: ['Dodaję liczniki: ' + a + ' + ' + c + ' = ' + (a + c), 'Dodaję mianowniki: ' + b + ' + ' + b + ' = ' + 2 * b, 'Wynik: ' + fr(a + c, 2 * b)], wrongIdx: 1, code: 'frac_add_both', why: 'Mianowników nie dodajemy – kawałki mają wciąż tę samą wielkość.' } : null,
        hints: ['Mianowniki są takie same – kawałki mają jednakową wielkość.', 'Mianownik zostaje ' + b + '. ' + (minus ? 'Odejmij' : 'Dodaj') + ' tylko liczniki.', a + (minus ? ' − ' : ' + ') + c + ' = ' + res + '.'],
        sol: [fr(a, b) + (minus ? ' − ' : ' + ') + fr(c, b) + ' = ' + fr(res, b)].concat(R.n !== res || R.d !== b ? [fr(res, b) + ' = ' + fmtF(R)] : []) };
    },
    why: [{ q: 'Ile to jest 1/4 + 2/4 i dlaczego?', opts: [{ t: '3/4 – kawałki są tej samej wielkości, więc liczymy tylko kawałki', ok: true }, { t: '3/8 – dodajemy liczniki i mianowniki', code: 'frac_add_both' }, { t: '2/16 – mnożymy', code: 'op_confuse' }], expl: 'Jedna ćwiartka i dwie ćwiartki to trzy ćwiartki. Pizza dalej jest pokrojona na 4 części.' }]
  });

  def('fr_add_diff', {
    name: 'Dodawanie i odejmowanie ułamków o różnych mianownikach', grade: 5, mainCode: 'frac_add_both', prereq: ['fr_add_same', 'fr_common'],
    types: { 1: ['input', 'choice'], 2: ['input', 'choice', 'error'], 3: ['input', 'error'] },
    gen(r, d) {
      let b, dd;
      if (d === 1) { [b, dd] = r.pick([[2, 4], [3, 6], [2, 6], [4, 8], [5, 10], [2, 8], [3, 9]]); }
      else if (d === 2) { [b, dd] = r.pick([[2, 3], [3, 4], [2, 5], [3, 5], [4, 5], [2, 7]]); }
      else { [b, dd] = r.pick([[4, 6], [6, 8], [6, 9], [8, 12], [10, 15], [4, 10], [6, 10]]); }
      if (r.chance(0.5)) [b, dd] = [dd, b];
      let a = r.int(1, b - 1), c = r.int(1, dd - 1); if (gcd(a, b) !== 1) a = 1; if (gcd(c, dd) !== 1) c = 1;
      let op = (d >= 2 && r.chance(0.45)) ? '−' : '+';
      if (op === '−' && a / b < c / dd) { [a, b, c, dd] = [c, dd, a, b]; }
      if (op === '−' && a / b === c / dd) op = '+';
      const st = addSteps(a, b, c, dd, op === '+' ? '+' : '-');
      const L = st.L, naive = op === '+' ? a + c : a - c;
      const wrong = [{ v: red(F(Math.max(0, naive), b + dd)), code: 'frac_add_both' }, { v: red(F(Math.max(0, naive), L)), code: 'frac_expand_num' }];
      if (b * dd !== L) { const nb = op === '+' ? a * dd + c * b : a * dd - c * b; if (!eq(red(F(nb, b * dd)), st.R)) wrong.push({ v: red(F(nb, b * dd)), code: 'calc' }); }
      if (naive <= 0) wrong.shift();
      const ctx = d === 3 && r.chance(0.4);
      const am = MP.th().amt;
      const prompt = ctx ? (op === '+' ? am.sum(fr(a, b), fr(c, dd)) : am.rest(fr(a, b), fr(c, dd))) : 'Oblicz: ' + fr(a, b) + ' ' + op + ' ' + fr(c, dd);
      return { prompt, value: st.R, form: 'simplest', wrong, unit: ctx ? am.u : null,
        errorVersion: { steps: ['Wspólny mianownik: ' + L, 'Zamieniam: ' + fr(a, b) + ' = ' + fr(a, L) + ', ' + fr(c, dd) + ' = ' + fr(c, L), fr(a, L) + ' ' + op + ' ' + fr(c, L) + ' = ' + fr(naive, L)], wrongIdx: 1, code: 'frac_expand_num', why: 'Zmieniając mianownik, trzeba tak samo pomnożyć licznik.' },
        hints: ['Kawałki mają różną wielkość (różne mianowniki). Najpierw sprowadź ułamki do wspólnego mianownika.', 'Wspólny mianownik to NWW(' + b + ', ' + dd + ') = ' + L + '. Rozszerz oba ułamki.', 'Pierwszy krok: ' + fr(a, b) + ' = ' + fr(st.n1, L) + ' oraz ' + fr(c, dd) + ' = ' + fr(st.n2, L) + '.'],
        sol: st.s };
    },
    why: [{ q: 'Dlaczego 1/2 + 1/3 to nie 2/5?', opts: [{ t: 'Bo 2/5 jest mniejsze niż 1/2 – a dodając, wynik powinien urosnąć', ok: true }, { t: '1/2 + 1/3 to właśnie 2/5', code: 'frac_add_both' }, { t: 'Bo trzeba pomnożyć: 1/6', code: 'op_confuse' }], expl: 'Dodając coś do 1/2, nie możemy dostać mniej niż 1/2. Poprawnie: 3/6 + 2/6 = 5/6.' }]
  });

  def('fr_add_mixed', {
    name: 'Dodawanie i odejmowanie liczb mieszanych', grade: 5, mainCode: 'frac_mixed_borrow', prereq: ['fr_add_diff', 'fr_mixed'],
    types: { 1: ['input', 'choice'], 2: ['input', 'choice'], 3: ['input', 'choice'] },
    gen(r, d) {
      const b = r.pick([3, 4, 5, 6, 8]);
      const w1 = r.int(2, 6), w2 = r.int(1, w1 - 1 || 1);
      let a1, a2;
      if (d === 1) { a1 = r.int(1, b - 2); a2 = r.int(1, b - 1 - a1); }
      else if (d === 2) { a1 = r.int(Math.ceil(b / 2), b - 1); a2 = r.int(Math.ceil(b / 2), b - 1); }
      else { a1 = r.int(1, b - 2); a2 = r.int(a1 + 1, b - 1); }
      const X = F(w1 * b + a1, b), Y = F(w2 * b + a2, b);
      const minus = d === 3;
      const R = minus ? sub(X, Y) : add(X, Y);
      const mx = (w, a) => '[[' + w + ' ' + a + '/' + b + ']]';
      const wrong = minus ? [{ v: add(F(w1 - w2, 1), F(a2 - a1, b)), code: 'frac_mixed_borrow' }, { v: add(F(w1 - w2, 1), red(F(a1, b))), code: 'calc' }] : [{ v: add(F(w1 + w2, 1), red(F(a1 + a2, 2 * b))), code: 'frac_add_both' }];
      return { prompt: 'Oblicz: ' + mx(w1, a1) + (minus ? ' − ' : ' + ') + mx(w2, a2), value: R, form: 'simplest', wrong,
        hints: minus ? ['Odejmij osobno całości i ułamki. Ale uwaga: ' + fr(a1, b) + ' < ' + fr(a2, b) + '!', 'Pożycz 1 całość: ' + mx(w1, a1) + ' = ' + mx(w1 - 1, a1 + b) + '.', 'Teraz: ' + mx(w1 - 1, a1 + b) + ' − ' + mx(w2, a2) + '.']
          : ['Dodaj osobno całości i osobno ułamki.', 'Całości: ' + w1 + ' + ' + w2 + ' = ' + (w1 + w2) + '. Ułamki: ' + fr(a1, b) + ' + ' + fr(a2, b) + ' = ' + fr(a1 + a2, b) + '.', a1 + a2 >= b ? fr(a1 + a2, b) + ' to więcej niż 1 – zamień na liczbę mieszaną i dodaj do całości.' : 'Połącz wynik.'],
        sol: minus ? [mx(w1, a1) + ' = ' + mx(w1 - 1, a1 + b), mx(w1 - 1, a1 + b) + ' − ' + mx(w2, a2) + ' = ' + (w1 - 1 - w2 ? mx(w1 - 1 - w2, a1 + b - a2) : fr(a1 + b - a2, b))].concat((a1 + b - a2) % b === 0 || gcd(a1 + b - a2, b) > 1 ? ['= ' + fmtF(R)] : [])
          : [(w1 + w2) + ' + ' + fr(a1 + a2, b), '= ' + fmtF(R)] };
    },
    why: [{ q: 'Jak najłatwiej obliczyć 3 1/4 − 1 3/4?', opts: [{ t: 'Zamienić 3 1/4 na 2 5/4 i dopiero odjąć', ok: true }, { t: 'Odjąć całości (3−1) i ułamki „odwrotnie" (3/4 − 1/4)', code: 'frac_mixed_borrow' }, { t: 'Nie da się – wynik byłby ujemny', code: 'concept' }], expl: 'Z 1/4 nie odejmiesz 3/4, więc pożyczasz całość: 3 1/4 = 2 5/4. Potem 2 5/4 − 1 3/4 = 1 2/4 = 1 1/2.' }]
  });

  def('fr_mul_int', {
    name: 'Mnożenie ułamka przez liczbę naturalną', grade: 5, mainCode: 'frac_mul_both', prereq: ['fr_simplify', 'fr_mixed'],
    types: { 1: ['input', 'choice'], 2: ['input', 'choice', 'error'], 3: ['input', 'choice'] },
    gen(r, d) {
      const b = r.int(3, 10), a = r.int(1, b - 1), n = r.int(2, d === 1 ? 3 : 9);
      if (gcd(a, b) !== 1) return this.gen(r, d);
      if (d === 3) {
        const w = r.int(1, 4);
        const X = F(w * b + a, b), R = mul(X, N(n));
        return { prompt: 'Oblicz: ' + n + ' · [[' + w + ' ' + a + '/' + b + ']]', value: R, form: 'simplest', wrong: [{ v: add(N(w * n), F(a, b)), code: 'frac_mixed_mul' }, { v: red(F(n * (w * b + a), n * b)), code: 'frac_mul_both' }],
          hints: ['Zamień liczbę mieszaną na ułamek niewłaściwy.', '[[' + w + ' ' + a + '/' + b + ']] = ' + fr(w * b + a, b) + '.', 'Teraz pomnóż licznik ' + (w * b + a) + ' przez ' + n + '.'],
          sol: ['[[' + w + ' ' + a + '/' + b + ']] = ' + fr(w * b + a, b), n + ' · ' + fr(w * b + a, b) + ' = ' + fr(n * (w * b + a), b), '= ' + fmtF(R)] };
      }
      const R = mul(F(a, b), N(n));
      return { prompt: 'Oblicz: ' + n + ' · ' + fr(a, b), value: R, form: 'simplest', wrong: [{ v: F(n * a, n * b), code: 'frac_mul_both' }, { v: red(F(a, n * b)), code: 'frac_div_mul' }, { v: red(F(a + n, b)), code: 'op_confuse' }],
        errorVersion: { steps: [n + ' · ' + fr(a, b) + ' = ' + fr(n + ' · ' + a, n + ' · ' + b), '= ' + fr(n * a, n * b)], wrongIdx: 0, code: 'frac_mul_both', why: 'Przez liczbę mnożymy tylko licznik – mianownik (wielkość kawałków) się nie zmienia.' },
        hints: ['Mnożenie przez ' + n + ' to dodanie ' + fr(a, b) + ' aż ' + n + ' razy.', 'Mnożymy tylko licznik: ' + n + ' · ' + a + '. Mianownik zostaje ' + b + '.', 'Wynik: ' + fr(n * a, b) + ' – czy da się skrócić albo zamienić na liczbę mieszaną?'],
        sol: [n + ' · ' + fr(a, b) + ' = ' + fr(n * a, b)].concat(eq(R, F(n * a, b)) && R.d === b ? [] : ['= ' + fmtF(R)]) };
    },
    why: [{ q: 'Ile to jest 3 · 2/7?', opts: [{ t: '6/7 – trzy razy po dwie siódme', ok: true }, { t: '6/21', code: 'frac_mul_both' }, { t: '5/7', code: 'op_confuse' }, { t: '2/21', code: 'frac_div_mul' }], expl: 'Trzy razy po 2 kawałki to 6 kawałków. Kawałki są dalej siódme: 6/7.' }]
  });

  def('fr_mul', {
    name: 'Mnożenie ułamków zwykłych', grade: 5, mainCode: 'frac_mul_cross', prereq: ['fr_mul_int', 'fr_simplify'],
    types: { 1: ['input', 'choice'], 2: ['input', 'choice'], 3: ['input', 'choice'] },
    gen(r, d) {
      if (d === 3) {
        const b = r.pick([2, 3, 4, 5]), w = r.int(1, 3), a = r.int(1, b - 1), c2 = r.pick([2, 3, 4, 5, 6]), c1 = r.int(1, c2 - 1);
        if (gcd(a, b) !== 1 || gcd(c1, c2) !== 1) return this.gen(r, d);
        const X = F(w * b + a, b), Y = F(c1, c2), R = mul(X, Y);
        return { prompt: 'Oblicz: [[' + w + ' ' + a + '/' + b + ']] · ' + fr(c1, c2), value: R, form: 'simplest', wrong: [{ v: add(mul(N(w), Y), F(a * c1, b * c2)), code: 'calc' }, { v: add(N(w), red(F(a * c1, b * c2))), code: 'frac_mixed_mul' }],
          hints: ['Zamień liczbę mieszaną na ułamek niewłaściwy.', '[[' + w + ' ' + a + '/' + b + ']] = ' + fr(w * b + a, b) + '.', 'Pomnóż licznik przez licznik i mianownik przez mianownik. Możesz najpierw skrócić „na krzyż".'],
          sol: ['[[' + w + ' ' + a + '/' + b + ']] = ' + fr(w * b + a, b), fr(w * b + a, b) + ' · ' + fr(c1, c2) + ' = ' + fr((w * b + a) * c1, b * c2), '= ' + fmtF(R)] };
      }
      let a, b, c, dd;
      if (d === 1) { b = r.int(2, 6); a = r.int(1, b - 1); dd = r.int(2, 6); c = r.int(1, dd - 1); }
      else { const p = r.pick([[2, 3, 3, 4], [3, 5, 10, 9], [4, 9, 3, 8], [5, 6, 3, 10], [2, 7, 7, 8], [6, 7, 14, 15], [3, 4, 8, 9]]); [a, b, c, dd] = p; }
      if (gcd(a, b) !== 1 || gcd(c, dd) !== 1) return this.gen(r, d);
      const R = mul(F(a, b), F(c, dd));
      const wrong = [{ v: red(F(a * dd, b * c)), code: 'frac_mul_cross' }, { v: red(F(a * c, b + dd)), code: 'frac_add_both' }];
      if (b === dd) wrong.push({ v: red(F(a * c, b)), code: 'concept' });
      return { prompt: 'Oblicz: ' + fr(a, b) + ' · ' + fr(c, dd), value: R, form: 'simplest', wrong,
        hints: ['Mnożąc ułamki, nie potrzebujesz wspólnego mianownika.', 'Licznik · licznik, mianownik · mianownik.', d === 2 ? 'Zanim pomnożysz, sprawdź, czy da się skrócić „na krzyż" (licznik jednego z mianownikiem drugiego).' : a + ' · ' + c + ' = ' + a * c + ', ' + b + ' · ' + dd + ' = ' + b * dd + '.'],
        sol: [fr(a, b) + ' · ' + fr(c, dd) + ' = ' + fr(a + ' · ' + c, b + ' · ' + dd) + ' = ' + fr(a * c, b * dd)].concat(R.n !== a * c ? ['= ' + fmtF(R)] : []) };
    },
    why: [{ q: 'Dlaczego 1/2 · 1/2 = 1/4 (wynik jest mniejszy)?', opts: [{ t: 'Bo bierzemy połowę z połowy', ok: true }, { t: 'To błąd – mnożenie zawsze zwiększa', code: 'concept' }, { t: 'Bo dodajemy mianowniki', code: 'frac_add_both' }], expl: 'Mnożenie przez ułamek mniejszy od 1 to branie części – np. połowa z połowy pizzy to ćwiartka.' }]
  });

  def('fr_div', {
    name: 'Dzielenie ułamków zwykłych', grade: 5, mainCode: 'frac_div_noinv', prereq: ['fr_mul'],
    types: { 1: ['input', 'choice'], 2: ['input', 'choice', 'error'], 3: ['input', 'choice'] },
    gen(r, d) {
      if (d === 1) {
        const n = r.int(2, 5), b = r.int(2, 9), a = r.int(1, b - 1) * (r.chance(0.5) ? 1 : n);
        if (gcd(a, b) !== 1) return this.gen(r, d);
        const R = div(F(a, b), N(n));
        return { prompt: 'Oblicz: ' + fr(a, b) + ' : ' + n, value: R, form: 'simplest', wrong: [{ v: red(F(a * n, b)), code: 'frac_div_mul' }, { v: red(F(b, a * n)), code: 'frac_div_inv_first' }],
          hints: ['Dzieląc przez ' + n + ', szukasz ' + n + '-ej części ułamka – wynik będzie mniejszy.', 'Dzielenie przez ' + n + ' to mnożenie przez ' + fr(1, n) + '.', fr(a, b) + ' · ' + fr(1, n) + ' = ?'],
          sol: [fr(a, b) + ' : ' + n + ' = ' + fr(a, b) + ' · ' + fr(1, n), '= ' + fr(a, b * n) + (R.d !== b * n ? ' = ' + fmtF(R) : '')] };
      }
      let a, b, c, dd, w = 0;
      if (d === 2) { b = r.int(2, 9); a = r.int(1, b - 1); dd = r.int(2, 9); c = r.int(1, dd - 1); }
      else { b = r.pick([2, 3, 4]); w = r.int(1, 3); a = r.int(1, b - 1); dd = r.pick([2, 3, 4, 6]); c = r.int(1, dd - 1); }
      if (gcd(a, b) !== 1 || gcd(c, dd) !== 1) return this.gen(r, d);
      const X = F(w * b + a, b), Y = F(c, dd), R = div(X, Y);
      const xs = w ? '[[' + w + ' ' + a + '/' + b + ']]' : fr(a, b);
      const wrong = [{ v: mul(X, Y), code: 'frac_div_noinv' }, { v: mul(F(X.d, X.n), Y), code: 'frac_div_inv_first' }];
      if (w) wrong.push({ v: add(N(w), div(F(a, b), Y)), code: 'frac_mixed_mul' });
      return { prompt: 'Oblicz: ' + xs + ' : ' + fr(c, dd), value: R, form: 'simplest', wrong,
        errorVersion: !w ? { steps: [fr(a, b) + ' : ' + fr(c, dd) + ' = ' + fr(a, b) + ' · ' + fr(c, dd), '= ' + fr(a * c, b * dd)], wrongIdx: 0, code: 'frac_div_noinv', why: 'Przy zamianie na mnożenie trzeba odwrócić drugi ułamek: ' + fr(c, dd) + ' → ' + fr(dd, c) + '.' } : null,
        hints: [(w ? 'Najpierw zamień liczbę mieszaną na ułamek niewłaściwy. ' : '') + 'Dzielenie przez ułamek zamieniamy na mnożenie.', 'Odwróć DRUGI ułamek: ' + fr(c, dd) + ' → ' + fr(dd, c) + '.', (w ? fr(X.n, b) : fr(a, b)) + ' · ' + fr(dd, c) + ' = ?'],
        sol: (w ? [xs + ' = ' + fr(X.n, b)] : []).concat([fr(X.n, b) + ' : ' + fr(c, dd) + ' = ' + fr(X.n, b) + ' · ' + fr(dd, c), '= ' + fr(X.n * dd, b * c) + (R.n !== X.n * dd || R.d !== b * c ? ' = ' + fmtF(R) : '')]) };
    },
    why: [{ q: 'Dlaczego 3 : 1/2 = 6?', opts: [{ t: 'Bo w 3 całościach mieści się 6 połówek', ok: true }, { t: 'To błąd – dzielenie zmniejsza, więc wynik to 1 1/2', code: 'frac_div_noinv' }, { t: 'Bo 3 + 3 = 6', code: 'concept' }], expl: 'Dzielenie pyta „ile razy się mieści". W każdej całości mieszczą się 2 połówki, więc w 3 całościach – 6.' }]
  });

  def('fr_of', {
    name: 'Obliczanie ułamka danej liczby', grade: 5, mainCode: 'frac_of_div', prereq: ['tabl', 'fr_part'],
    types: { 1: ['input', 'choice'], 2: ['input', 'choice'], 3: ['input', 'choice'] },
    gen(r, d) {
      const b = r.int(2, 8), a = d === 1 ? 1 : r.int(2, Math.max(2, b - 1)), q = r.int(2, 12), Nn = b * q;
      if (gcd(a, b) !== 1) return this.gen(r, d);
      const part = a * q;
      if (d === 3) {
        const th = MP.th(), itm = r.pick(th.items), rt = th.route(Nn, fr(a, b));
        const ctx = r.pick([
          { t: 'Cena: ' + itm[0] + ' – ' + Nn + ' zł. W promocji cena spadła o ' + fr(a, b) + '. Ile kosztuje teraz?', v: Nn - part, w: [[part, 'read'], [Nn + part, 'read']], unit: 'zł' },
          { t: rt.t, v: Nn - part, w: [[part, 'read']], unit: rt.u },
          { t: 'W klasie jest ' + q + ' uczniów, co stanowi ' + fr(1, b) + ' wszystkich uczniów na wycieczce. Ilu uczniów jest na wycieczce?', v: Nn, w: [[q, 'read'], [Math.max(1, Math.round(q / b)), 'frac_of_div']], unit: null, whole: true }
        ]);
        return { prompt: ctx.t, value: N(ctx.v), wrong: ctx.w.map(x => ({ v: N(x[0]), code: x[1] })).concat([{ v: N(Nn * a), code: 'frac_of_partial' }]),
          hints: ctx.whole ? ['Jeśli ' + q + ' to jedna ' + b + '-a część, to całość składa się z ' + b + ' takich części.', 'Pomnóż ' + q + ' przez ' + b + '.', q + ' · ' + b + ' = ?'] : ['Najpierw oblicz ' + fr(a, b) + ' z ' + Nn + '.', Nn + ' : ' + b + ' = ' + q + ', a potem · ' + a + ' = ' + part + '.', 'To jest zmiana. Zadanie pyta, ile ZOSTAŁO – odejmij ' + part + ' od ' + Nn + '.'],
          sol: ctx.whole ? [q + ' · ' + b + ' = ' + Nn] : [fr(a, b) + ' z ' + Nn + ' = ' + Nn + ' : ' + b + ' · ' + a + ' = ' + part, Nn + ' − ' + part + ' = ' + (Nn - part)] };
      }
      return { prompt: 'Oblicz ' + fr(a, b) + ' z liczby ' + Nn + '.', value: N(part), wrong: [{ v: N(q), code: a === 1 ? 'calc' : 'frac_of_partial' }, { v: N(Nn * a), code: 'frac_of_partial' }, { v: red(F(Nn * b, a)), code: 'frac_of_div' }],
        hints: ['Podziel ' + Nn + ' na ' + b + ' równych części.', Nn + ' : ' + b + ' = ' + q + ' – tyle jest w jednej części.', a === 1 ? 'Bierzesz jedną część.' : 'Bierzesz ' + a + ' części: ' + a + ' · ' + q + '.'],
        sol: [Nn + ' : ' + b + ' = ' + q].concat(a > 1 ? [a + ' · ' + q + ' = ' + part] : []) };
    },
    why: [{ q: 'Czy 3/4 z 20 może być większe niż 20?', opts: [{ t: 'Nie – 3/4 to mniej niż całość, więc wynik jest mniejszy od 20', ok: true }, { t: 'Tak – wychodzi 80/3', code: 'frac_of_div' }, { t: 'Tak – wychodzi 60', code: 'frac_of_partial' }], expl: 'Ułamek mniejszy od 1 to część liczby – zawsze mniej niż cała liczba. 3/4 z 20 = 15.' }]
  });

  def('fr_pow', {
    name: 'Kwadraty i sześciany ułamków', grade: 5, mainCode: 'pow_frac_num', prereq: ['fr_mul', 'pow_nat'],
    types: { 1: ['input', 'choice'], 2: ['input', 'choice'], 3: ['input', 'choice'] },
    gen(r, d) {
      if (d === 3) {
        const b = r.pick([2, 3, 4]), w = 1, a = 1;
        const X = F(w * b + a, b), R = mul(X, X);
        return { prompt: 'Oblicz: ([[' + w + ' ' + a + '/' + b + ']])²', value: R, form: 'simplest', wrong: [{ v: add(N(1), F(1, b * b)), code: 'pow_mixed' }, { v: mul(X, N(2)), code: 'pow_mult' }],
          hints: ['Najpierw zamień liczbę mieszaną na ułamek niewłaściwy.', '[[1 1/' + b + ']] = ' + fr(b + 1, b) + '.', 'Teraz ' + fr(b + 1, b) + ' · ' + fr(b + 1, b) + '.'],
          sol: ['[[1 1/' + b + ']] = ' + fr(b + 1, b), '(' + fr(b + 1, b) + ')² = ' + fr((b + 1) * (b + 1), b * b), '= ' + fmtF(R)] };
      }
      const cube = d === 2 && r.chance(0.5); const b = r.int(2, cube ? 4 : 9), a = r.int(1, b - 1);
      if (gcd(a, b) !== 1) return this.gen(r, d);
      const e = cube ? 3 : 2, R = F(a ** e, b ** e);
      return { prompt: 'Oblicz: (' + fr(a, b) + ')' + (cube ? '³' : '²'), value: R, form: 'simplest', wrong: [{ v: red(F(a ** e, b)), code: 'pow_frac_num' }, { v: red(F(a * e, b * e)), code: 'pow_mult' }, { v: red(F(a * e, b)), code: 'pow_mult' }],
        hints: ['Potęga to mnożenie przez siebie: (' + fr(a, b) + ')' + (cube ? '³' : '²') + ' = ' + Array(e).fill(fr(a, b)).join(' · ') + '.', 'Potęgujesz i licznik, i mianownik.', 'Licznik: ' + a + (cube ? '³' : '²') + ' = ' + a ** e + ', mianownik: ' + b + (cube ? '³' : '²') + ' = ' + b ** e + '.'],
        sol: ['(' + fr(a, b) + ')' + (cube ? '³' : '²') + ' = ' + Array(e).fill(fr(a, b)).join(' · ') + ' = ' + fr(a ** e, b ** e)] };
    }
  });

  MP.gensHelpers = { cmpGen, divisors, fr };
})(MP);
