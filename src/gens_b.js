/* gens_b.js — ułamki dziesiętne, liczby całkowite, wyrażenia i równania, procenty. */
var MP = (typeof window !== 'undefined' ? window : globalThis).MP;
(function (MP) {
  const U = MP.util, { F, red, add, sub, mul, div, eq, fmtF, fmtNum, fmtDecK, fromDec, gcd, lcm } = U;
  const SK = MP.SK, def = (id, o) => { o.id = id; SK[id] = o; };
  const N = (n) => F(n, 1), pl = U.pl, money = U.money, fr = (n, d) => '[[' + n + '/' + d + ']]';
  const D = (k, p) => fromDec(k, p);           // liczba dziesiętna k·10^-p (dokładnie)
  const ds = (k, p) => fmtDecK(k, p);          // zapis z przecinkiem
  const dsF = (x) => fmtNum(x);
  const minus = (s) => String(s).replace(/^-/, '−');
  const { cmpGen } = MP.gensHelpers;

  // ===================== UŁAMKI DZIESIĘTNE =====================
  def('dec_conv', {
    name: 'Zamiana ułamków zwykłych i dziesiętnych', grade: 5, mainCode: 'dec_places', prereq: ['fr_expand', 'fr_simplify'],
    types: { 1: ['input', 'choice', 'match'], 2: ['input', 'choice'], 3: ['input', 'choice', 'match'] },
    gen(r, d, type) {
      if (type === 'match') {
        const pool = d === 1 ? [[1, 10], [7, 10], [3, 100], [27, 100], [9, 100], [41, 100], [3, 1000], [125, 1000]] : [[1, 2], [1, 4], [3, 4], [1, 5], [2, 5], [1, 20], [3, 8], [7, 25], [1, 8]];
        const pick = r.shuffle(pool).slice(0, 4).map(p => F(p[0], p[1]));
        const right = r.shuffle(pick.map((v, i) => i));
        return { type: 'match', prompt: 'Dopasuj każdy ułamek zwykły do równego mu ułamka dziesiętnego.', left: pick.map(v => fr(v.n, v.d)), right: right.map(i => dsF(pick[i])), answer: { kind: 'match', pairs: pick.map((v, i) => right.indexOf(i)) }, unknownCode: 'dec_places',
          hints: ['Mianownik 10 → jedna cyfra po przecinku, 100 → dwie, 1000 → trzy.', 'Ułamki o innych mianownikach rozszerz do 10, 100 lub 1000, np. ' + fr(1, 4) + ' = ' + fr(25, 100) + '.', 'Zacznij od tego, który znasz najlepiej.'], sol: pick.map(v => fr(v.n, v.d) + ' = ' + dsF(v)) };
      }
      if (d === 1) {
        const p = r.pick([1, 2, 2, 3]), Pw = 10 ** p; let k = r.int(1, Pw - 1); if (k % 10 === 0) k += 1;
        const wrong = [{ v: D(k, Math.max(1, String(k).length)), code: 'dec_places' }, { v: D(k, p + 1), code: 'dec_places' }];
        return { prompt: 'Zapisz w postaci ułamka dziesiętnego: ' + fr(k, Pw), value: D(k, p), form: 'decimal', dec: true, wrong,
          hints: ['Mianownik ' + Pw + ' oznacza ' + (p === 1 ? 'dziesiąte – jedna cyfra' : p === 2 ? 'setne – dwie cyfry' : 'tysięczne – trzy cyfry') + ' po przecinku.', 'Licznik ' + k + ' wpisz tak, żeby kończył się na ' + p + '. miejscu po przecinku. Jeśli brakuje cyfr – dopisz zera z przodu.', 'Zacznij od „0," i dopisz cyfry.'],
          sol: [fr(k, Pw) + ' = ' + ds(k, p)] };
      }
      if (d === 2) {
        const p = r.pick([[1, 2], [1, 4], [3, 4], [1, 5], [2, 5], [3, 5], [4, 5], [1, 20], [7, 20], [3, 25], [9, 50], [1, 25]]);
        const R = F(p[0], p[1]), L = 10 % R.d === 0 ? 10 : 100, k = R.n * L / R.d, pl = L === 10 ? 1 : 2;
        return { prompt: 'Zapisz ' + ds(k, pl) + ' jako ułamek zwykły nieskracalny.', value: R, form: 'simplest', wrong: [{ v: F(k, L / 10 || 1), code: 'dec_places' }, { v: F(k, L * 10), code: 'dec_places' }],
          hints: ['Odczytaj liczbę: ' + ds(k, pl) + ' to ' + k + ' ' + (pl === 1 ? 'dziesiątych' : 'setnych') + '.', 'Zapisz ' + fr(k, L) + ' i skróć.', 'NWD(' + k + ', ' + L + ') = ' + gcd(k, L) + '.'],
          sol: [ds(k, pl) + ' = ' + fr(k, L), '= ' + fr(R.n, R.d)] };
      }
      const p = r.pick([[3, 4], [1, 4], [2, 5], [3, 5], [7, 20], [3, 8], [5, 8], [1, 8], [9, 25], [13, 50], [11, 20]]);
      const R = F(p[0], p[1]); const L = [10, 100, 1000].find(x => x % R.d === 0);
      return { prompt: 'Zamień ułamek ' + fr(R.n, R.d) + ' na ułamek dziesiętny.', value: R, form: 'decimal', dec: true, wrong: [{ v: D(+(String(R.n) + String(R.d)), String(R.d).length + String(R.n).length - (String(R.n).length)), code: 'dec_frac_digits' }, { v: D(+(String(R.n) + String(R.d)), String(R.n).length + String(R.d).length), code: 'dec_frac_digits' }],
        hints: ['Rozszerz ułamek tak, by mianownik był równy 10, 100 lub 1000.', R.d + ' · ' + L / R.d + ' = ' + L + '.', fr(R.n, R.d) + ' = ' + fr(R.n * L / R.d, L) + '. Teraz zapisz to z przecinkiem.'],
        sol: [fr(R.n, R.d) + ' = ' + fr(R.n * L / R.d, L), '= ' + dsF(R)],
        errorVersion: { steps: ['Przepisuję licznik i mianownik po przecinku', fr(R.n, R.d) + ' = 0,' + R.n + R.d], wrongIdx: 0, code: 'dec_frac_digits', why: 'Ułamka nie przepisujemy cyfra po cyfrze – trzeba go rozszerzyć do mianownika 10, 100 lub 1000.' } };
    },
    why: [{ q: 'Dlaczego 7/100 = 0,07, a nie 0,7?', opts: [{ t: 'Bo setne zajmują drugie miejsce po przecinku', ok: true }, { t: 'Bo 0,7 i 0,07 to to samo', code: 'dec_places' }, { t: 'Bo zero z przodu nic nie znaczy', code: 'dec_places' }], expl: '0,7 to 7 dziesiątych (70 setnych), a 0,07 to 7 setnych – jak 7 groszy.' }]
  });

  def('dec_compare', {
    name: 'Porównywanie ułamków dziesiętnych', grade: 5, mainCode: 'dec_compare_len', prereq: ['dec_conv'],
    types: { 1: ['choice'], 2: ['choice'], 3: ['choice', 'order'] },
    gen(r, d, type) {
      return cmpGen(r, d, type, (mode) => {
        if (mode === 'order') {
          const w = r.int(0, 3);
          const pool = r.shuffle([[w * 10 + 5, 1], [w * 100 + 45, 2], [w * 1000 + 125, 3], [w * 100 + 9, 2], [w * 100 + 52, 2], [w * 10 + 3, 1], [w * 1000 + 505, 3]]).slice(0, 4);
          const vals = pool.map(p => D(p[0], p[1])).filter((v, i, A) => A.findIndex(x => eq(x, v)) === i);
          while (vals.length < 4) vals.push(D(w * 10 + vals.length + 6, 1));
          const asInt = vals.map((v, i) => i).sort((i, j) => (+dsF(vals[i]).split(',')[1] || 0) - (+dsF(vals[j]).split(',')[1] || 0));
          return { vals, wrongSorts: [{ order: asInt, code: 'dec_compare_len' }], code: 'dec_compare_len',
            hints: ['Dopisz zera, żeby wszystkie liczby miały tyle samo cyfr po przecinku.', 'Np. ' + dsF(vals[0]) + ' i ' + dsF(vals[1]) + ' zapisz z trzema cyframi po przecinku.', 'Teraz porównaj je jak liczby naturalne.'] };
        }
        let x, y, kind;
        if (d === 1) { const p = r.pick([1, 2]); let a = r.int(10 ** (p - 1) * 2, 10 ** p * 5 - 1), b = r.int(10 ** (p - 1) * 2, 10 ** p * 5 - 1); if (a === b) b++; x = D(a, p); y = D(b, p); kind = 'same'; }
        else {
          const w = r.int(0, 4), t = r.int(2, 8), u = r.int(1, 9);
          const pairs = [[w * 10 + t, 1, w * 100 + (t - 1) * 10 + u, 2], [w * 10 + t, 1, w * 1000 + (t - 1) * 100 + u * 10 + r.int(1, 9), 3], [w * 100 + t * 10, 2, w * 100 + t * 10, 2]];
          let p = d === 3 ? r.pick(pairs) : pairs[r.int(0, 1)];
          x = D(p[0], p[1]); y = D(p[2], p[3]); if (r.chance(0.5)) [x, y] = [y, x]; kind = 'len';
        }
        const sym = U.val(x) < U.val(y) ? 0 : U.val(x) > U.val(y) ? 1 : 2;
        const mis = {};
        if (kind === 'len') { const lx = (dsF(x).split(',')[1] || '').length, ly = (dsF(y).split(',')[1] || '').length; const byLen = lx > ly ? 1 : lx < ly ? 0 : 2; if (byLen !== sym) mis[byLen] = 'dec_compare_len'; }
        return { vals: [x, y], miscon: mis,
          hints: ['Najpierw porównaj części całkowite (przed przecinkiem).', 'Jeśli są równe, dopisz zera, żeby obie liczby miały tyle samo cyfr po przecinku.', dsF(x) + ' i ' + dsF(y) + ' – porównuj cyfra po cyfrze od lewej.'],
          sol: (s) => [dsF(x) + ' ' + s + ' ' + dsF(y)] };
      }, (v) => dsF(v));
    },
    why: [{ q: 'Która liczba jest większa: 0,5 czy 0,45?', opts: [{ t: '0,5 – bo 0,5 = 0,50, a 50 setnych > 45 setnych', ok: true }, { t: '0,45 – bo ma więcej cyfr', code: 'dec_compare_len' }, { t: '0,45 – bo 45 > 5', code: 'dec_compare_len' }], expl: 'Dopisz zero: 0,50 i 0,45. Teraz widać, że 0,50 jest większe – jak 50 groszy i 45 groszy.' }]
  });

  def('dec_round', {
    name: 'Zaokrąglanie ułamków dziesiętnych', grade: 6, mainCode: 'round_trunc', prereq: ['dec_compare'],
    types: { 1: ['input', 'choice'], 2: ['input', 'choice'], 3: ['input', 'choice'] },
    gen(r, d) {
      const to = d === 1 ? r.pick([0, 1]) : r.pick([1, 2]);
      const p = to + 1 + (d === 3 ? 1 : 0); // ile cyfr po przecinku ma liczba
      let k = r.int(10 ** p, 10 ** p * 40);
      if (r.chance(0.6)) { const unit = 10 ** (p - to); k = Math.floor(k / unit) * unit + r.int(Math.ceil(unit / 2), unit - 1); }
      if (k % 10 === 0) k += 3;
      const unit = 10 ** (p - to), up = Math.round(k / unit), tr = Math.floor(k / unit);
      const names = ['całości', 'części dziesiątych', 'części setnych'];
      const isMoney = d === 3 && to === 2;
      const wrong = [{ v: D(tr === up ? tr + 1 : tr, to), code: 'round_trunc' }];
      if (to + 1 < p) wrong.push({ v: D(Math.round(k / (unit / 10)), to + 1), code: 'round_place' });
      if (to > 0) wrong.push({ v: D(Math.round(k / (unit * 10)), to - 1), code: 'round_place' });
      return { prompt: isMoney ? 'Cena za 1 kg sera wyszła ' + ds(k, p) + ' zł. Zaokrąglij ją do pełnych groszy (do części setnych).' : 'Zaokrąglij liczbę ' + ds(k, p) + ' do ' + names[to] + '.', value: D(up, to), dec: true, wrong,
        hints: ['Znajdź cyfrę ' + names[to].replace('części ', '').replace('całości', 'jedności') + ' i spójrz na następną cyfrę.', 'Jeśli następna cyfra to 5, 6, 7, 8 lub 9 – zwiększ o 1. Jeśli 0–4 – zostaw.', 'Cyfra decydująca to ' + Math.floor((k % unit) / (unit / 10)) + '.'],
        sol: ['Cyfra po miejscu zaokrąglenia: ' + Math.floor((k % unit) / (unit / 10)), ds(k, p) + ' ≈ ' + ds(up, to)] };
    }
  });

  def('dec_units', {
    name: 'Wyrażenia dwumianowane (zł i gr, m i cm, kg i g)', grade: 5, mainCode: 'dec_units_zero', prereq: ['dec_conv'],
    types: { 1: ['input', 'choice'], 2: ['input', 'choice'], 3: ['input', 'choice'] },
    gen(r, d) {
      const kinds = [{ big: 'zł', small: 'gr', f: 100 }, { big: 'm', small: 'cm', f: 100 }, { big: 'kg', small: 'g', f: 1000 }, { big: 'km', small: 'm', f: 1000 }];
      const K = d === 1 ? kinds[0] : r.pick(kinds), w = r.int(1, 19);
      const sm = d === 1 ? r.int(11, 99) : r.int(1, K.f === 100 ? 9 : 99);
      const p = K.f === 100 ? 2 : 3, total = w * K.f + sm;
      if (d === 3) {
        return { prompt: 'Zamień: ' + ds(total, p) + ' ' + K.big + ' = □ ' + K.small, fill: true, value: N(total), wrong: [{ v: N(+(String(w) + String(sm))), code: 'dec_units_zero' }, { v: N(total * 10), code: 'units_factor' }],
          hints: ['1 ' + K.big + ' = ' + K.f + ' ' + K.small + '.', 'Pomnóż ' + ds(total, p) + ' przez ' + K.f + ' – przesuń przecinek o ' + p + ' miejsca w prawo.', w + ' ' + K.big + ' = ' + w * K.f + ' ' + K.small + ', zostaje jeszcze ' + sm + ' ' + K.small + '.'],
          sol: [ds(total, p) + ' · ' + K.f + ' = ' + total, ds(total, p) + ' ' + K.big + ' = ' + total + ' ' + K.small] };
      }
      return { prompt: 'Zapisz w ' + K.big + ': ' + w + ' ' + K.big + ' ' + sm + ' ' + K.small + ' = □ ' + K.big, fill: true, value: D(total, p), dec: true, wrong: [{ v: D(w * 10 ** String(sm).length + sm, String(sm).length), code: 'dec_units_zero' }, { v: D(total, p - 1), code: 'units_factor' }],
        hints: ['1 ' + K.small + ' to ' + fr(1, K.f) + ' ' + K.big + '.', sm + ' ' + K.small + ' = ' + fr(sm, K.f) + ' ' + K.big + ' = ' + ds(sm, p) + ' ' + K.big + '.', 'Dodaj do tego ' + w + ' ' + K.big + '.'],
        sol: [sm + ' ' + K.small + ' = ' + ds(sm, p) + ' ' + K.big, w + ' + ' + ds(sm, p) + ' = ' + ds(total, p) + ' ' + K.big] };
    }
  });

  def('dec_add', {
    name: 'Dodawanie i odejmowanie ułamków dziesiętnych', grade: 5, mainCode: 'dec_align', prereq: ['dec_conv'],
    types: { 1: ['input', 'choice'], 2: ['input', 'choice', 'error'], 3: ['input'] },
    gen(r, d) {
      if (d === 1) {
        const p = r.pick([1, 2]); const a = r.int(11, 10 ** p * 9), b = r.int(11, 10 ** p * 9); const m = r.chance(0.4);
        const [x, y] = m && a < b ? [b, a] : [a, b];
        return { prompt: 'Oblicz: ' + ds(x, p) + (m ? ' − ' : ' + ') + ds(y, p), value: D(m ? x - y : x + y, p), dec: true, wrong: [{ v: D(m ? x - y : x + y, p + 1), code: 'dec_places' }, { v: D((m ? x - y : x + y) + 10 ** (p - 1), p), code: 'calc' }],
          hints: ['Zapisz liczby jedna pod drugą: przecinek pod przecinkiem.', 'Licz jak na liczbach naturalnych, od prawej strony.', 'W wyniku przecinek stawiasz w tym samym miejscu – pod przecinkami.'], sol: [ds(x, p) + (m ? ' − ' : ' + ') + ds(y, p) + ' = ' + ds(m ? x - y : x + y, p)] };
      }
      if (d === 2) {
        if (r.chance(0.5)) {
          let a = r.int(11, 99); if (a % 10 === 0) a += 1; let b = r.int(101, 999); if (b % 10 === 0) b += 1; // a: 1 miejsce, b: 2 miejsca
          const sum = a * 10 + b, a2 = ds(a, 1) + '0';
          return { prompt: 'Oblicz: ' + ds(a, 1) + ' + ' + ds(b, 2), value: D(sum, 2), dec: true, wrong: [{ v: D(a + b, 2), code: 'dec_align' }, { v: D(a + b, 1), code: 'dec_align' }],
            errorVersion: { steps: ['Zapisuję ' + ds(a, 1) + ' i ' + ds(b, 2) + ' tak, by ostatnie cyfry były pod sobą', 'Dodaję: ' + ds(a + b, 2)], wrongIdx: 0, code: 'dec_align', why: 'Liczby ustawiamy przecinek pod przecinkiem, a nie „do prawej".' },
            hints: ['Ustaw przecinek pod przecinkiem.', 'Dopisz zero, żeby obie liczby miały po dwie cyfry po przecinku: ' + ds(a, 1) + ' = ' + a2 + '.', 'Teraz dodaj ' + a2 + ' + ' + ds(b, 2) + '.'],
            sol: [ds(a, 1) + ' = ' + a2, a2 + ' + ' + ds(b, 2) + ' = ' + ds(sum, 2)] };
        }
        const w = r.int(3, 20), b = r.int(101, w * 100 - 1);
        return { prompt: 'Oblicz: ' + w + ' − ' + ds(b, 2), value: D(w * 100 - b, 2), dec: true, wrong: [{ v: D((w - Math.floor(b / 100)) * 100 + (b % 100), 2), code: 'dec_sub_whole' }, { v: D(w * 100 - b + 100, 2), code: 'calc' }],
          hints: ['Zapisz ' + w + ' z przecinkiem i zerami: ' + w + ',00.', 'Teraz odejmuj w słupku: ' + w + ',00 − ' + ds(b, 2) + '.', 'Pamiętaj o pożyczaniu z wyższego rzędu.'], sol: [w + ' = ' + w + ',00', w + ',00 − ' + ds(b, 2) + ' = ' + ds(w * 100 - b, 2)] };
      }
      const items = r.shuffle(MP.th().items).slice(0, 2).map(it => [it[0], it[2], it[2] < 1000 ? r.int(2, 4) : 1, it[1]]);
      const total = items.reduce((s, it) => s + it[1] * it[2], 0); const pay = [2000, 5000, 10000, 20000, 50000].find(x => x > total) || Math.ceil((total + 1) / 10000) * 10000;
      const desc = items.map(it => it[2] > 1 ? it[2] + ' × ' + it[0] + ' po ' + money(it[1]) + ' zł' : it[3] + ' za ' + money(it[1]) + ' zł').join(' oraz ');
      return { prompt: 'Kupujesz: ' + desc + '. Płacisz banknotem ' + pay / 100 + ' zł. Ile dostaniesz reszty?', value: D(pay - total, 2), dec: true, unit: 'zł', writeUp: true,
        wrong: [{ v: D(total, 2), code: 'read' }, { v: D(pay - items.reduce((s, it) => s + it[1], 0), 2), code: 'read' }],
        hints: ['Najpierw policz, ile kosztują wszystkie rzeczy razem.', items.map(it => it[2] + ' · ' + money(it[1]) + ' = ' + money(it[1] * it[2])).join(', ') + '.', 'Razem: ' + money(total) + ' zł. Teraz odejmij to od ' + pay / 100 + ' zł.'],
        sol: items.map(it => it[2] + ' · ' + money(it[1]) + ' = ' + money(it[1] * it[2]) + ' zł').concat(['Razem: ' + money(total) + ' zł', 'Reszta: ' + pay / 100 + ',00 − ' + money(total) + ' = ' + money(pay - total) + ' zł']) };
    }
  });

  def('dec_shift', {
    name: 'Mnożenie i dzielenie przez 10, 100, 1000', grade: 5, mainCode: 'dec_shift_dir', prereq: ['dec_conv'],
    types: { 1: ['input', 'choice'], 2: ['input', 'choice'], 3: ['input', 'choice'] },
    gen(r, d) {
      const z = d === 1 ? 1 : r.pick([2, 3]), P = 10 ** z, isMul = r.chance(0.5);
      const p = r.pick([1, 2]), k = r.int(11, 9999);
      const x = D(k, p);
      const R = isMul ? mul(x, N(P)) : div(x, N(P));
      const wrong = [{ v: isMul ? div(x, N(P)) : mul(x, N(P)), code: 'dec_shift_dir' }, { v: isMul ? mul(x, N(P * 10)) : div(x, N(P * 10)), code: 'dec_shift_count' }];
      if (z > 1) wrong.push({ v: isMul ? mul(x, N(10)) : div(x, N(10)), code: 'dec_shift_count' });
      if (isMul) wrong.push({ v: D(k * 10, p + 1), code: 'dec_shift_zero' });
      return { prompt: 'Oblicz: ' + ds(k, p) + (isMul ? ' · ' : ' : ') + P, value: R, dec: true, wrong,
        hints: [isMul ? 'Mnożenie przez ' + P + ' zwiększa liczbę – przecinek przesuwamy w PRAWO.' : 'Dzielenie przez ' + P + ' zmniejsza liczbę – przecinek przesuwamy w LEWO.', 'W liczbie ' + P + ' jest ' + z + ' zer' + (z === 1 ? 'o' : 'a') + ' – przesuń przecinek o ' + z + ' miejsc' + (z === 1 ? 'e' : 'a') + '.', 'Gdy brakuje cyfr, dopisz zera.'],
        sol: [ds(k, p) + (isMul ? ' · ' : ' : ') + P + ' = ' + dsF(R) + ' (przecinek o ' + z + ' w ' + (isMul ? 'prawo' : 'lewo') + ')'] };
    }
  });

  def('dec_mul', {
    name: 'Mnożenie ułamków dziesiętnych', grade: 5, mainCode: 'dec_mul_places', prereq: ['dec_shift', 'tabl'],
    types: { 1: ['input', 'choice'], 2: ['input', 'choice', 'error'], 3: ['input', 'choice'] },
    gen(r, d) {
      let a, pa, b, pb;
      if (d === 1) { a = r.int(2, 99); pa = r.pick([1, 2]); b = r.int(2, 9); pb = 0; }
      else if (d === 2) { a = r.int(2, 9); pa = 1; b = r.int(2, 9); pb = r.pick([1, 2]); }
      else { const p = r.pick([[125, 2, 8, 1], [25, 2, 4, 1], [15, 1, 12, 1], [24, 1, 5, 2], [35, 1, 14, 1], [75, 2, 4, 1]]); [a, pa, b, pb] = p; }
      const R = mul(D(a, pa), D(b, pb)), prod = a * b, places = pa + pb;
      const wrong = [{ v: D(prod, Math.max(pa, pb)), code: 'dec_mul_places' }, { v: D(prod, places + 1), code: 'dec_mul_places' }];
      if (places > 1) wrong.push({ v: D(prod, places - 1), code: 'dec_mul_places' });
      return { prompt: 'Oblicz: ' + ds(a, pa) + ' · ' + ds(b, pb), value: R, dec: true, wrong,
        errorVersion: places >= 2 ? { steps: ['Mnożę bez przecinków: ' + a + ' · ' + b + ' = ' + prod, 'Biorę tyle miejsc po przecinku, ile ma liczba z największą ich liczbą: ' + Math.max(pa, pb), 'Wynik: ' + ds(prod, Math.max(pa, pb))], wrongIdx: 1, code: 'dec_mul_places', why: 'Miejsca po przecinku w obu czynnikach DODAJEMY: ' + pa + ' + ' + pb + ' = ' + places + '.' } : null,
        hints: ['Pomnóż liczby tak, jakby nie było przecinków.', a + ' · ' + b + ' = ' + prod + '. Teraz policz cyfry po przecinku w obu czynnikach razem.', pa + ' + ' + pb + ' = ' + places + ' – tyle cyfr oddziel przecinkiem od prawej strony.'],
        sol: [a + ' · ' + b + ' = ' + prod, 'Miejsc po przecinku: ' + pa + ' + ' + pb + ' = ' + places, ds(a, pa) + ' · ' + ds(b, pb) + ' = ' + dsF(R)] };
    },
    why: [{ q: 'Ile to jest 0,3 · 0,2?', opts: [{ t: '0,06 – bo dziesiąta część z dziesiątej to setna', ok: true }, { t: '0,6', code: 'dec_mul_places' }, { t: '0,5', code: 'op_confuse' }, { t: '6', code: 'dec_mul_places' }], expl: '3 · 2 = 6, a miejsc po przecinku jest razem 1 + 1 = 2. Wynik: 0,06.' }]
  });

  def('dec_div', {
    name: 'Dzielenie ułamków dziesiętnych', grade: 5, mainCode: 'dec_div_shift', prereq: ['dec_shift', 'tabl'],
    types: { 1: ['input', 'choice'], 2: ['input', 'choice'], 3: ['input', 'choice'] },
    gen(r, d) {
      if (d === 1) {
        const b = r.int(2, 9), q = r.int(11, 99), p = 1, a = b * q;
        return { prompt: 'Oblicz: ' + ds(a, p) + ' : ' + b, value: D(q, p), dec: true, wrong: [{ v: D(q, p + 1), code: 'dec_places' }, { v: N(q), code: 'dec_places' }],
          hints: ['Dziel jak liczby naturalne.', 'Gdy w dzielnej dojdziesz do przecinka, postaw przecinek w wyniku.', a + ' : ' + b + ' = ' + q + '.'], sol: [a + ' : ' + b + ' = ' + q, ds(a, p) + ' : ' + b + ' = ' + ds(q, p)] };
      }
      if (d === 2) {
        const pr = r.pick([[7, 4], [9, 4], [3, 8], [11, 4], [13, 5], [7, 2], [9, 8], [17, 4]]); const R = F(pr[0], pr[1]);
        const q = Math.floor(pr[0] / pr[1]), rem = pr[0] % pr[1];
        return { prompt: 'Oblicz: ' + pr[0] + ' : ' + pr[1] + ' (wynik zapisz jako ułamek dziesiętny)', value: R, form: 'decimal', dec: true, wrong: [{ v: D(q * 10 + rem, 1), code: 'dec_div_rem' }, { v: N(q), code: 'dec_div_rem' }],
          hints: [pr[0] + ' : ' + pr[1] + ' = ' + q + ' reszta ' + rem + '. Reszty nie piszemy po przecinku!', 'Dopisz do dzielnej przecinek i zero: ' + pr[0] + ',0 i dziel dalej.', 'Możesz też zamienić ' + fr(pr[0], pr[1]) + ' na ułamek dziesiętny przez rozszerzenie.'],
          sol: [pr[0] + ' = ' + pr[0] + ',00', pr[0] + ',00 : ' + pr[1] + ' = ' + dsF(R)] };
      }
      const pr = r.pick([[24, 1, 3, 1], [48, 1, 6, 1], [36, 2, 4, 1], [125, 2, 5, 1], [72, 1, 9, 2], [56, 1, 7, 1], [45, 1, 15, 2]]); // a/10^pa : b/10^pb
      const [a, pa, b, pb] = pr; const R = div(D(a, pa), D(b, pb));
      return { prompt: 'Oblicz: ' + ds(a, pa) + ' : ' + ds(b, pb), value: R, dec: true, wrong: [{ v: div(D(a, pa), N(b)), code: 'dec_div_shift' }, { v: mul(R, N(10)), code: 'dec_div_shift' }],
        hints: ['Dzielnik ' + ds(b, pb) + ' ma przecinek. Zamień go na liczbę całkowitą, przesuwając przecinek w prawo.', 'Przesuń przecinek o ' + pb + ' miejsc' + (pb === 1 ? 'e' : 'a') + ' w OBU liczbach (dzielnej i dzielniku).', ds(a, pa) + ' : ' + ds(b, pb) + ' = ' + dsF(mul(D(a, pa), N(10 ** pb))) + ' : ' + b + '.'],
        sol: [ds(a, pa) + ' : ' + ds(b, pb) + ' = ' + dsF(mul(D(a, pa), N(10 ** pb))) + ' : ' + b, '= ' + dsF(R)] };
    },
    why: [{ q: 'Dlaczego 2,4 : 0,3 = 8 (a nie 0,8)?', opts: [{ t: 'Bo 0,3 mieści się w 2,4 aż 8 razy (24 dziesiąte : 3 dziesiąte)', ok: true }, { t: 'Bo dzielenie zawsze zmniejsza liczbę', code: 'dec_div_shift' }, { t: 'Wynik to 0,8', code: 'dec_div_shift' }], expl: 'Dzieląc przez liczbę mniejszą od 1, wynik jest WIĘKSZY od dzielnej. 24 dziesiąte : 3 dziesiąte = 8.' }]
  });

  // ===================== LICZBY CAŁKOWITE =====================
  const Z = (n) => n < 0 ? '(−' + (-n) + ')' : String(n);
  const zs = (n) => n < 0 ? '−' + (-n) : String(n);
  def('int_compare', {
    name: 'Liczby całkowite na osi i ich porównywanie', grade: 5, allowNeg: true, mainCode: 'int_compare_neg',
    types: { 1: ['choice'], 2: ['choice'], 3: ['choice', 'order'] },
    gen(r, d, type) {
      return cmpGen(r, d, type, (mode) => {
        if (mode === 'order') {
          const s = new Set(); while (s.size < 5) s.add(r.int(-15, 10));
          const arr = [...s]; const vals = arr.map(n => N(n));
          const byAbs = vals.map((v, i) => i).sort((i, j) => Math.abs(arr[i]) - Math.abs(arr[j]));
          const negFlip = vals.map((v, i) => i).sort((i, j) => { const a = arr[i], b = arr[j]; const ka = a < 0 ? -a - 100 : a, kb = b < 0 ? -b - 100 : b; return ka - kb; });
          return { vals, wrongSorts: [{ order: byAbs, code: 'int_compare_neg' }, { order: negFlip, code: 'int_compare_neg' }], code: 'int_compare_neg',
            hints: ['Wyobraź sobie oś liczbową: im bardziej w lewo, tym mniejsza liczba.', 'Liczby ujemne są mniejsze od zera i od każdej dodatniej.', 'Wśród ujemnych najmniejsza jest ta najdalej od zera.'] };
        }
        let a, b;
        if (d === 1) { a = r.int(-9, 9); b = -a !== a && r.chance(0.5) ? -Math.abs(r.int(1, 9)) : r.int(1, 9); }
        else { a = -r.int(2, 20); b = -r.int(1, 20); }
        if (a === b) b = a - 1;
        const x = N(a), y = N(b), sym = a < b ? 0 : 1;
        const mis = {}; const byAbs = Math.abs(a) < Math.abs(b) ? 0 : Math.abs(a) > Math.abs(b) ? 1 : 2; if (byAbs !== sym) mis[byAbs] = 'int_compare_neg';
        return { vals: [x, y], miscon: mis, hints: ['Pomyśl o termometrze: która temperatura jest wyższa?', 'Na osi liczbowej większa liczba leży bardziej na prawo.', 'Zaznacz ' + zs(a) + ' i ' + zs(b) + ' na osi.'], sol: (s) => [zs(a) + ' ' + s + ' ' + zs(b)] };
      }, (v) => zs(v.n));
    },
    why: [{ q: 'Która temperatura jest niższa: −8°C czy −3°C?', opts: [{ t: '−8°C, bo jest dalej od zera w stronę zimna', ok: true }, { t: '−3°C, bo 3 < 8', code: 'int_compare_neg' }, { t: 'Są takie same', code: 'concept' }], expl: 'Na termometrze −8 jest niżej niż −3. Dlatego −8 < −3.' }]
  });

  def('int_abs', {
    name: 'Wartość bezwzględna', grade: 6, allowNeg: true, mainCode: 'abs_neg', prereq: ['int_compare'],
    types: { 1: ['input', 'choice'], 2: ['input', 'choice'], 3: ['choice'] },
    gen(r, d) {
      if (d === 3) {
        const k = r.int(2, 12);
        const opts = r.shuffle([{ label: zs(k) + ' i ' + zs(-k), ok: true }, { label: 'tylko ' + k, code: 'abs_neg' }, { label: 'tylko ' + zs(-k), code: 'abs_neg' }, { label: 'żadna liczba', code: 'concept' }]);
        return { type: 'choice', prompt: 'Które liczby mają wartość bezwzględną równą ' + k + '?', options: opts, answer: { kind: 'choice', correct: opts.findIndex(o => o.ok) },
          hints: ['Wartość bezwzględna to odległość od zera.', 'Jakie liczby leżą ' + k + ' kroków od zera?', 'Idź ' + k + ' kroków w prawo… a w lewo?'], sol: ['|' + k + '| = ' + k + ' i |' + zs(-k) + '| = ' + k] };
      }
      if (d === 2) {
        const a = -r.int(2, 15), b = r.int(2, 15);
        const v = Math.abs(a) + Math.abs(b);
        return { prompt: 'Oblicz: |' + zs(a) + '| + |' + b + '|', value: N(v), wrong: [{ v: N(a + b), code: 'abs_neg' }, { v: N(-v), code: 'abs_neg' }],
          hints: ['Najpierw policz każdą wartość bezwzględną osobno.', '|' + zs(a) + '| = ' + (-a) + '.', 'Teraz ' + (-a) + ' + ' + b + '.'], sol: ['|' + zs(a) + '| = ' + (-a) + ', |' + b + '| = ' + b, (-a) + ' + ' + b + ' = ' + v] };
      }
      const a = -r.int(1, 30);
      return { prompt: 'Oblicz: |' + zs(a) + '|', value: N(-a), wrong: [{ v: N(a), code: 'abs_neg' }], signCode: 'abs_neg',
        hints: ['|liczba| to odległość tej liczby od zera.', 'Ile kroków dzieli ' + zs(a) + ' od zera?', 'Odległość nigdy nie jest ujemna.'], sol: ['|' + zs(a) + '| = ' + (-a)] };
    }
  });

  def('int_add', {
    name: 'Dodawanie i odejmowanie liczb całkowitych', grade: 6, allowNeg: true, mainCode: 'int_sign_add', prereq: ['int_compare'],
    types: { 1: ['input', 'choice'], 2: ['input', 'choice'], 3: ['input', 'choice', 'error'] },
    gen(r, d) {
      let a, b, op, v;
      if (d === 1) { a = -r.int(1, 12); b = r.int(1, 15); op = '+'; if (r.chance(0.5)) [a, b] = [b, a]; }
      else if (d === 2) { a = r.chance(0.5) ? -r.int(1, 15) : r.int(1, 10); b = r.int(1, 15); op = '−'; if (a > 0 && a > b) a = -a; }
      else { a = r.int(-12, 12) || 3; b = -r.int(1, 12); op = '−'; }
      v = op === '+' ? a + b : a - b;
      const wrong = [{ v: N(-v), code: 'int_sign_add' }];
      if (op === '+') wrong.push({ v: N(Math.abs(a) + Math.abs(b) * Math.sign(a + b || 1)), code: 'int_sign_add' }, { v: N(-(Math.abs(a) + Math.abs(b))), code: 'int_sign_add' });
      else if (b < 0) wrong.push({ v: N(a + b), code: 'int_sub_neg' });
      else wrong.push({ v: N(a + b), code: 'int_sign_add' }, { v: N(Math.abs(a) - b), code: 'int_sign_add' });
      const temp = d === 3 && r.chance(0.35);
      const prompt = temp ? 'Rano termometr pokazywał ' + zs(b) + '°C, a w południe ' + zs(a) + '°C. O ile stopni wzrosła temperatura?' : 'Oblicz: ' + zs(a) + ' ' + op + ' ' + Z(b);
      return { prompt, value: N(v), wrong, signCode: op === '−' && b < 0 ? 'int_sub_neg' : 'int_sign_add', unknownCode: 'int_sign_add',
        errorVersion: (op === '−' && b < 0) ? { steps: [zs(a) + ' − ' + Z(b) + ' = ' + zs(a) + ' − ' + (-b), '= ' + zs(a + b)], wrongIdx: 0, code: 'int_sub_neg', why: 'Odjęcie liczby ujemnej to dodanie liczby przeciwnej: − (' + zs(b) + ') = + ' + (-b) + '.' } : null,
        hints: op === '+' ? ['Wyobraź sobie oś liczbową. Startujesz w ' + zs(a) + '.', b > 0 ? 'Dodajesz ' + b + ' – idziesz ' + b + ' kroków w prawo.' : 'Dodajesz liczbę ujemną – idziesz w lewo.', 'Policz kroki: przez zero też przechodzisz.']
          : b < 0 ? ['Odejmowanie liczby ujemnej zamień na dodawanie liczby przeciwnej.', zs(a) + ' − ' + Z(b) + ' = ' + zs(a) + ' + ' + (-b) + '.', 'Teraz policz ' + zs(a) + ' + ' + (-b) + ' na osi.'] : ['Startujesz w ' + zs(a) + ' i odejmujesz ' + b + ' – idziesz w lewo.', 'Odejmowanie dodatniej liczby to ruch w stronę mniejszych liczb.', zs(a) + ' − ' + b + ' = ' + zs(a) + ' + ' + Z(-b) + '.'],
        sol: [op === '−' && b < 0 ? zs(a) + ' − ' + Z(b) + ' = ' + zs(a) + ' + ' + (-b) + ' = ' + zs(v) : zs(a) + ' ' + op + ' ' + Z(b) + ' = ' + zs(v)].concat(temp ? ['Temperatura wzrosła o ' + v + '°C'] : []) };
    },
    why: [{ q: 'Ile to jest −3 + 5 i dlaczego?', opts: [{ t: '2 – zaczynam od −3 i idę 5 kroków w prawo', ok: true }, { t: '−8 – dodaję liczby', code: 'int_sign_add' }, { t: '8', code: 'int_sign_add' }, { t: '−2', code: 'sign' }], expl: 'Z −3 idziemy 3 kroki do zera i jeszcze 2 dalej: wynik 2.' }]
  });

  def('int_mul', {
    name: 'Mnożenie i dzielenie liczb całkowitych', grade: 6, allowNeg: true, mainCode: 'int_mul_sign', prereq: ['int_add', 'tabl'],
    types: { 1: ['input', 'choice'], 2: ['input', 'choice'], 3: ['input', 'choice'] },
    gen(r, d) {
      if (d === 3) {
        const k = r.pick([0, 1, 2]);
        if (k === 0) { const a = r.int(2, 9); return { prompt: 'Oblicz: (−' + a + ')²', value: N(a * a), wrong: [{ v: N(-a * a), code: 'int_mul_sign' }, { v: N(-2 * a), code: 'pow_mult' }], signCode: 'int_mul_sign', hints: ['(−' + a + ')² = (−' + a + ') · (−' + a + ').', 'Minus razy minus daje plus.', a + ' · ' + a + ' = ' + a * a + '.'], sol: ['(−' + a + ')² = (−' + a + ') · (−' + a + ') = ' + a * a] }; }
        const a = -r.int(2, 6), b = -r.int(2, 5), c = r.int(2, 4) * (r.chance(0.5) ? -1 : 1);
        const v = a * b * c;
        return { prompt: 'Oblicz: ' + Z(a) + ' · ' + Z(b) + ' · ' + Z(c), value: N(v), wrong: [{ v: N(-v), code: 'int_mul_sign' }], signCode: 'int_mul_sign', hints: ['Mnóż po kolei od lewej.', Z(a) + ' · ' + Z(b) + ' = ' + a * b + ' (minus razy minus to plus).', 'Teraz ' + a * b + ' · ' + Z(c) + '.'], sol: [Z(a) + ' · ' + Z(b) + ' = ' + a * b, a * b + ' · ' + Z(c) + ' = ' + zs(v)] };
      }
      const a = r.int(2, 9) * (r.chance(0.5) ? -1 : 1), b = r.int(2, 9) * (d === 1 ? (a > 0 ? -1 : 1) : -1);
      const isDiv = d === 2 && r.chance(0.5);
      if (isDiv) { const p = a * b; return { prompt: 'Oblicz: ' + zs(p) + ' : ' + Z(b), value: N(a), wrong: [{ v: N(-a), code: 'int_mul_sign' }], signCode: 'int_mul_sign', hints: ['Najpierw podziel bez znaków: ' + Math.abs(p) + ' : ' + Math.abs(b) + '.', 'Takie same znaki → wynik dodatni, różne znaki → ujemny.', 'Znaki: ' + (p < 0 ? 'minus' : 'plus') + ' i ' + (b < 0 ? 'minus' : 'plus') + '.'], sol: [Math.abs(p) + ' : ' + Math.abs(b) + ' = ' + Math.abs(a), 'Znak wyniku: ' + (a < 0 ? 'minus' : 'plus'), 'Wynik: ' + zs(a)] }; }
      const v = a * b;
      return { prompt: 'Oblicz: ' + zs(a) + ' · ' + Z(b), value: N(v), wrong: [{ v: N(-v), code: 'int_mul_sign' }, { v: N(a + b), code: 'op_confuse' }], signCode: 'int_mul_sign',
        hints: ['Najpierw pomnóż bez znaków: ' + Math.abs(a) + ' · ' + Math.abs(b) + '.', 'Takie same znaki → wynik dodatni, różne znaki → ujemny.', 'Znaki czynników: ' + (a < 0 ? 'minus' : 'plus') + ' i ' + (b < 0 ? 'minus' : 'plus') + '.'],
        sol: [Math.abs(a) + ' · ' + Math.abs(b) + ' = ' + Math.abs(v), 'Znak: ' + (v < 0 ? 'różne znaki → minus' : 'takie same znaki → plus'), 'Wynik: ' + zs(v)] };
    }
  });

  // ===================== WYRAŻENIA I RÓWNANIA =====================
  def('alg_write', {
    name: 'Zapisywanie wyrażeń algebraicznych', grade: 6, mainCode: 'alg_more_times',
    types: { 1: ['choice'], 2: ['choice'], 3: ['choice'] },
    gen(r, d) {
      const k = r.int(2, 9), v = r.pick(['x', 'a', 'n']);
      const T1 = [
        { t: 'liczba o ' + k + ' większa od ' + v, ok: v + ' + ' + k, bad: [[k + v, 'alg_more_times'], [v + ' − ' + k, 'alg_less_more'], [v + ' : ' + k, 'concept']] },
        { t: 'liczba ' + k + ' razy większa od ' + v, ok: k + v, bad: [[v + ' + ' + k, 'alg_more_times'], [v + ' : ' + k, 'alg_less_more'], [v + ' − ' + k, 'concept']] },
        { t: 'liczba o ' + k + ' mniejsza od ' + v, ok: v + ' − ' + k, bad: [[k + ' − ' + v, 'alg_less_more'], [v + ' : ' + k, 'alg_less_times'], [v + ' + ' + k, 'alg_less_more']] },
        { t: 'liczba ' + k + ' razy mniejsza od ' + v, ok: v + ' : ' + k, bad: [[v + ' − ' + k, 'alg_less_times'], [k + v, 'alg_less_more'], [k + ' : ' + v, 'concept']] }
      ];
      const T2 = [
        { t: 'Bilet do kina kosztuje ' + v + ' zł, a popcorn ' + k + ' zł. Ile zapłaci 3 osoby, jeśli każda kupi bilet i popcorn?', ok: '3 · (' + v + ' + ' + k + ')', bad: [['3' + v + ' + ' + k, 'order_ltr'], [v + ' + ' + k + ' + 3', 'concept'], ['3 + ' + v + ' + ' + k, 'concept']] },
        { t: 'Kasia ma ' + v + ' naklejek, a Ola o ' + k + ' więcej. Ile naklejek mają razem?', ok: '2' + v + ' + ' + k, bad: [[v + ' + ' + k, 'read'], [k + v, 'alg_more_times'], [v + ' + ' + k + v, 'alg_more_times']] },
        { t: 'Tomek ma ' + v + ' lat, a jego tata jest ' + k + ' razy starszy. Ile lat ma tata?', ok: k + v, bad: [[v + ' + ' + k, 'alg_more_times'], [v + ' : ' + k, 'alg_less_more'], [k + ' + ' + v, 'alg_more_times']] }
      ];
      const T3 = [
        { t: 'Prostokąt ma boki ' + v + ' cm i ' + k + ' cm. Który zapis to jego obwód?', ok: '2' + v + ' + ' + 2 * k, bad: [[k + v, 'area_perim'], [v + ' + ' + k, 'perim_half'], ['2' + v + ' + ' + k, 'calc']] },
        { t: 'Zeszyt kosztuje ' + v + ' zł. Ile reszty dostaniesz z 20 zł, kupując ' + k + ' ' + pl(k, 'zeszyt', 'zeszyty', 'zeszytów') + '?', ok: '20 − ' + k + v, bad: [[k + v + ' − 20', 'alg_less_more'], ['20 − ' + v, 'read'], ['20 − ' + v + ' + ' + k, 'concept']] }
      ];
      const T = r.pick(d === 1 ? T1 : d === 2 ? T2 : T3);
      const opts = r.shuffle([{ label: T.ok, ok: true }].concat(T.bad.map(b => ({ label: b[0], code: b[1] }))));
      return { type: 'choice', prompt: d === 1 ? 'Który zapis oznacza: <b>' + T.t + '</b>?' : T.t + (d === 2 ? ' Wybierz wyrażenie.' : ''), options: opts, answer: { kind: 'choice', correct: opts.findIndex(o => o.ok) },
        hints: ['„O … więcej/mniej" to dodawanie/odejmowanie. „… razy więcej/mniej" to mnożenie/dzielenie.', 'Spróbuj podstawić konkretną liczbę zamiast ' + v + ', np. ' + v + ' = 10, i sprawdź, co wychodzi.', 'Zapis ' + k + v + ' oznacza ' + k + ' · ' + v + '.'],
        sol: ['Poprawny zapis: ' + T.ok] };
    },
    why: [{ q: 'Co oznacza zapis 5a?', opts: [{ t: '5 · a', ok: true }, { t: '5 + a', code: 'alg_more_times' }, { t: 'liczbę pięćdziesiąt-coś', code: 'alg_concat' }, { t: 'a : 5', code: 'alg_less_times' }], expl: 'Między liczbą a literą „ukrywa się" znak mnożenia: 5a = 5 · a.' }]
  });

  def('alg_value', {
    name: 'Obliczanie wartości wyrażeń algebraicznych', grade: 6, allowNeg: true, mainCode: 'alg_concat', prereq: ['ord_basic', 'alg_write'],
    types: { 1: ['input', 'choice'], 2: ['input', 'choice'], 3: ['input', 'choice'] },
    gen(r, d) {
      const x = d === 3 ? r.pick([-2, -3, -1]) : r.int(2, 9), a = r.int(2, 6), b = r.int(1, 12);
      const T = d === 1 ? { s: a + 'x + ' + b, v: a * x + b, w: [[+(String(a) + String(Math.abs(x))) + b, 'alg_concat'], [a + x + b, 'alg_concat']] }
        : d === 2 ? r.pick([{ s: a + '(x + ' + b + ')', v: a * (x + b), w: [[a * x + b, 'order_ltr'], [a + x + b, 'alg_concat']] }, { s: 'x² + ' + b, v: x * x + b, w: [[2 * x + b, 'pow_mult']] }])
          : { s: a + 'x + ' + b, v: a * x + b, w: [[-a * x + b, 'int_mul_sign'], [a * x - b, 'int_sign_add']] };
      const sub = T.s.replace(/(\d)x/g, '$1 · ' + Z(x)).replace(/x²/, Z(x) + '²').replace(/x/g, Z(x));
      return { prompt: 'Oblicz wartość wyrażenia <b>' + T.s + '</b> dla x = ' + zs(x) + '.', value: N(T.v), wrong: T.w.map(w => ({ v: N(w[0]), code: w[1] })), unknownCode: 'alg_concat',
        hints: ['Wstaw liczbę ' + zs(x) + ' w miejsce x.', 'Pamiętaj: ' + a + 'x to ' + a + ' · x. Otrzymujesz: ' + sub + '.', 'Teraz policz, pilnując kolejności działań.'],
        sol: [T.s + ' = ' + sub, '= ' + zs(T.v)] };
    }
  });

  def('eq_solve', {
    name: 'Rozwiązywanie równań', grade: 6, mainCode: 'eq_inverse', prereq: ['alg_value', 'tabl'],
    types: { 1: ['input', 'choice'], 2: ['input', 'choice', 'error'], 3: ['input', 'choice'] },
    gen(r, d) {
      const x = r.int(2, 12);
      if (d === 1) {
        const k = r.int(2, 9), t = r.pick(['add', 'mul', 'sub']);
        if (t === 'add') return { prompt: 'Rozwiąż równanie: x + ' + k + ' = ' + (x + k), value: N(x), wrong: [{ v: N(x + 2 * k), code: 'eq_inverse' }], hints: ['Jaka liczba po dodaniu ' + k + ' daje ' + (x + k) + '?', 'Odejmij ' + k + ' od obu stron.', (x + k) + ' − ' + k + ' = ?'], sol: ['x = ' + (x + k) + ' − ' + k, 'x = ' + x, 'Sprawdzenie: ' + x + ' + ' + k + ' = ' + (x + k) + ' ✓'] };
        if (t === 'sub') return { prompt: 'Rozwiąż równanie: x − ' + k + ' = ' + x, value: N(x + k), wrong: [{ v: N(x - k), code: 'eq_inverse' }], hints: ['Jaka liczba po odjęciu ' + k + ' daje ' + x + '?', 'Dodaj ' + k + ' do obu stron.', x + ' + ' + k + ' = ?'], sol: ['x = ' + x + ' + ' + k, 'x = ' + (x + k), 'Sprawdzenie: ' + (x + k) + ' − ' + k + ' = ' + x + ' ✓'] };
        return { prompt: 'Rozwiąż równanie: ' + k + 'x = ' + k * x, value: N(x), wrong: [{ v: N(k * x * k), code: 'eq_inverse' }, { v: N(k * x - k), code: 'eq_inverse' }], hints: [k + 'x znaczy ' + k + ' · x. Jaka liczba razy ' + k + ' daje ' + k * x + '?', 'Podziel obie strony przez ' + k + '.', k * x + ' : ' + k + ' = ?'], sol: ['x = ' + k * x + ' : ' + k, 'x = ' + x, 'Sprawdzenie: ' + k + ' · ' + x + ' = ' + k * x + ' ✓'] };
      }
      const a = r.int(2, 6), b = r.int(1, 15), c = a * x + b;
      if (d === 3 && r.chance(0.6)) {
        return { prompt: 'Pomyślałam liczbę. Pomnożyłam ją przez ' + a + ' i dodałam ' + b + '. Wyszło ' + c + '. Jaką liczbę pomyślałam?', value: N(x), wrong: [{ v: N((c + b) / a), code: 'eq_inverse' }, { v: red(F(c, a)), code: 'eq_inverse' }, { v: N(c - b), code: 'read' }], writeUp: true,
          hints: ['Zapisz to jako równanie: ' + a + 'x + ' + b + ' = ' + c + '.', 'Cofaj się od końca: najpierw „odkręć" dodawanie ' + b + '.', c + ' − ' + b + ' = ' + (c - b) + '. Teraz podziel przez ' + a + '.'],
          sol: [a + 'x + ' + b + ' = ' + c, a + 'x = ' + c + ' − ' + b + ' = ' + (c - b), 'x = ' + (c - b) + ' : ' + a + ' = ' + x] };
      }
      return { prompt: 'Rozwiąż równanie: ' + a + 'x + ' + b + ' = ' + c, value: N(x), wrong: [{ v: red(F(c + b, a)), code: 'eq_inverse' }, { v: red(F(c, a)).d === 1 ? red(F(c, a)) : N(c - b), code: 'eq_inverse' }],
        errorVersion: { steps: [a + 'x = ' + c + ' + ' + b, a + 'x = ' + (c + b), 'x = ' + fmtF(red(F(c + b, a)))], wrongIdx: 0, code: 'eq_inverse', why: 'Żeby pozbyć się „+ ' + b + '", trzeba ODJĄĆ ' + b + ' od obu stron.' },
        hints: ['Najpierw pozbądź się liczby ' + b + ' – odejmij ją od obu stron.', a + 'x = ' + c + ' − ' + b + ' = ' + (c - b) + '.', 'Teraz podziel obie strony przez ' + a + '.'],
        sol: [a + 'x = ' + c + ' − ' + b, a + 'x = ' + (c - b), 'x = ' + (c - b) + ' : ' + a, 'x = ' + x, 'Sprawdzenie: ' + a + ' · ' + x + ' + ' + b + ' = ' + c + ' ✓'] };
    },
    why: [{ q: 'Jak sprawdzić, czy x = 4 jest rozwiązaniem równania 3x − 2 = 10?', opts: [{ t: 'Wstawić 4 za x i sprawdzić, czy wyjdzie 10', ok: true }, { t: 'Dodać 4 do 10', code: 'eq_inverse' }, { t: 'Nie da się tego sprawdzić', code: 'concept' }], expl: '3 · 4 − 2 = 12 − 2 = 10 ✓. Wstawianie rozwiązania to zawsze dobry sposób na sprawdzenie.' }]
  });

  // ===================== PROCENTY =====================
  const PCT = [[50, 1, 2], [25, 1, 4], [75, 3, 4], [10, 1, 10], [20, 1, 5], [40, 2, 5], [1, 1, 100], [5, 1, 20], [30, 3, 10], [100, 1, 1]];
  def('pct_frac', {
    name: 'Procent jako ułamek', grade: 6, mainCode: 'pct_frac_den', prereq: ['fr_simplify', 'dec_conv'],
    types: { 1: ['choice', 'match'], 2: ['input', 'choice'], 3: ['input', 'choice'] },
    gen(r, d, type) {
      if (type === 'match') {
        const pick = r.shuffle(PCT.slice(0, 8)).slice(0, 4); const right = r.shuffle([0, 1, 2, 3]);
        return { type: 'match', prompt: 'Dopasuj procent do równego mu ułamka.', left: pick.map(p => p[0] + '%'), right: right.map(i => fr(pick[i][1], pick[i][2])), answer: { kind: 'match', pairs: pick.map((p, i) => right.indexOf(i)) }, unknownCode: 'pct_frac_den',
          hints: ['Procent to setne części: p% = p/100.', 'Zapisz każdy procent jako ułamek o mianowniku 100 i skróć.', '50% = 50/100 = 1/2.'], sol: pick.map(p => p[0] + '% = ' + fr(p[0], 100) + ' = ' + fr(p[1], p[2])) };
      }
      if (d === 3) {
        const k = r.int(1, 99), places = 2;
        return { prompt: 'Zapisz ' + ds(k, places) + ' w procentach.', value: N(k), fmt: (v) => dsF(v) + '%', wrong: [{ v: D(k, 1), code: 'pct_dec' }, { v: N(k * 10), code: 'pct_dec' }], unknownCode: 'pct_dec', unit: '%',
          hints: ['1 = 100%. Żeby zamienić na procenty, pomnóż przez 100.', ds(k, places) + ' · 100 = ?', 'Przesuń przecinek o dwa miejsca w prawo.'], sol: [ds(k, places) + ' = ' + fr(k, 100) + ' = ' + k + '%'] };
      }
      const p = r.pick(PCT.slice(0, 9));
      return { prompt: 'Zapisz ' + p[0] + '% jako ułamek zwykły nieskracalny.', value: F(p[1], p[2]), form: 'simplest', wrong: [{ v: F(1, p[0]), code: 'pct_frac_den' }].concat(p[0] % 10 && p[0] !== 10 ? [{ v: red(F(p[0], 10)), code: 'pct_frac_den' }] : []),
        hints: ['Procent znaczy „na sto": ' + p[0] + '% = ' + fr(p[0], 100) + '.', 'Teraz skróć ułamek ' + fr(p[0], 100) + '.', 'NWD(' + p[0] + ', 100) = ' + gcd(p[0], 100) + '.'], sol: [p[0] + '% = ' + fr(p[0], 100) + ' = ' + fr(p[1], p[2])] };
    },
    why: [{ q: 'Dlaczego 25% to ćwierć (1/4) całości?', opts: [{ t: 'Bo 25% = 25/100, a 100 to 4 razy po 25', ok: true }, { t: 'Bo 25% = 1/25', code: 'pct_frac_den' }, { t: 'Bo 2 + 5 = 7', code: 'concept' }], expl: 'Cała rzecz to 100%. Cztery części po 25% dają 100%, więc 25% to 1/4.' }]
  });

  def('pct_of', {
    name: 'Obliczanie procentu danej liczby', grade: 6, mainCode: 'pct_div', prereq: ['pct_frac', 'fr_of'],
    types: { 1: ['input', 'choice'], 2: ['input', 'choice'], 3: ['input', 'choice'] },
    gen(r, d) {
      const p = d === 1 ? r.pick([50, 10, 100, 25]) : r.pick([20, 25, 10, 75, 1, 5, 40]);
      const base = (p === 1 ? 100 : p === 5 ? 20 : 100 / gcd(p, 100));
      const Nn = base * r.int(2, d === 1 ? 10 : 30);
      const v = Nn * p / 100;
      if (d === 3) {
        const disc = r.pick([10, 20, 25, 50]); const price = (100 / gcd(disc, 100)) * r.int(3, 20); const cut = price * disc / 100;
        const up = r.chance(0.3);
        const itm = r.pick(MP.th().items)[0];
        return { prompt: up ? 'Cena: ' + itm + ' – ' + price + ' zł. Cena wzrosła o ' + disc + '%. Ile kosztuje teraz?' : 'Cena: ' + itm + ' – ' + price + ' zł. W promocji jest taniej o ' + disc + '%. Ile kosztuje w promocji?', value: N(up ? price + cut : price - cut), unit: 'zł', writeUp: true,
          wrong: [{ v: N(cut), code: 'read' }, { v: N(up ? price - cut : price + cut), code: 'alg_less_more' }, { v: N(price - disc), code: 'pct_div' }],
          hints: ['Najpierw oblicz ' + disc + '% z ' + price + ' zł.', disc + '% z ' + price + ' = ' + price + ' : 100 · ' + disc + ' = ' + cut + ' zł.', 'To jest zmiana ceny. Teraz ' + (up ? 'dodaj ją do' : 'odejmij ją od') + ' starej ceny.'],
          sol: [disc + '% z ' + price + ' = ' + cut + ' zł', price + (up ? ' + ' : ' − ') + cut + ' = ' + (up ? price + cut : price - cut) + ' zł'] };
      }
      const wrong = [{ v: red(F(Nn, p)), code: 'pct_div' }, { v: N(Nn * p), code: 'pct_mul100' }, { v: N(Math.max(1, Nn - p)), code: 'concept' }];
      const ctx = d === 2 && r.chance(0.5);
      return { prompt: ctx ? 'W szkole jest ' + Nn + ' uczniów. ' + p + '% z nich dojeżdża autobusem. Ilu to uczniów?' : 'Oblicz ' + p + '% z liczby ' + Nn + '.', value: N(v), wrong,
        hints: [p === 50 ? '50% to połowa.' : p === 25 ? '25% to ćwierć (1/4).' : p === 10 ? '10% to jedna dziesiąta – podziel przez 10.' : p + '% = ' + fr(p, 100) + '.', '1% z ' + Nn + ' to ' + Nn + ' : 100 = ' + dsF(F(Nn, 100)) + '.', 'Pomnóż to przez ' + p + ' (albo policz ' + fmtF(red(F(p, 100))) + ' z ' + Nn + ').'],
        sol: [p + '% z ' + Nn + ' = ' + fmtF(red(F(p, 100))) + ' · ' + Nn + ' = ' + v] };
    },
    why: [{ q: 'Jak najszybciej policzyć 10% z 230?', opts: [{ t: 'Podzielić 230 przez 10 – wychodzi 23', ok: true }, { t: 'Podzielić 230 przez 0,1', code: 'pct_div' }, { t: 'Odjąć 10 od 230', code: 'concept' }, { t: 'Pomnożyć 230 przez 10', code: 'pct_mul100' }], expl: '10% to 1/10 całości, więc dzielimy przez 10.' }]
  });
})(MP);
