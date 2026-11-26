/* gens_ix.js — interaktywne warianty zadań dobrane do charakteru umiejętności:
   ułamek na figurze (zamalowywanie), ułamek / liczba na osi (przeciąganie), paski cięte na wspólny mianownik,
   kolejność kroków rozwiązania, segregowanie, punkty w układzie współrzędnych, prostokąt o zadanym polu i obwodzie,
   zaznaczanie pola na siatce, wybór danych potrzebnych w zadaniu tekstowym. Każde zadanie: polecenie, typ interakcji,
   umiejętność, trudność, klucz, rozpoznawane błędne odpowiedzi, 3 wskazówki i pełne rozwiązanie. */
var MP = (typeof window !== 'undefined' ? window : globalThis).MP;
(function (MP) {
  const U = MP.util, { F, red, gcd, lcm, pl } = U;
  const fr = (n, d) => '[[' + n + '/' + d + ']]';
  const fs = (x) => U.fmtF(red(x));
  const extra = {}; // skill -> {type: {ds:[...], gen}}
  function add(skill, type, ds, gen) { (extra[skill] = extra[skill] || {})[type] = { ds, gen }; }

  // ===== ułamek jako część figury – zamalowywanie =====
  add('fr_part', 'shade', [1, 2, 3], (r, d) => {
    let den = r.pick(d === 1 ? [2, 3, 4, 5, 6] : [2, 3, 4, 5]), n = r.int(1, den - 1); if (gcd(n, den) !== 1) n = 1;
    const k = d === 1 ? 1 : d === 2 ? r.pick([2, 3]) : 2; const parts = den * k; const shape = d === 3 ? 'grid' : (d === 1 && den <= 6 && r.chance(0.4) ? 'circle' : 'bar');
    const cols = shape === 'grid' ? (parts % 4 === 0 ? 4 : parts % 3 === 0 ? 3 : 2) : 0;
    return { type: 'shade', aspect: 'visual', prompt: 'Zamaluj ' + fr(n, den) + ' ' + (shape === 'circle' ? 'koła' : shape === 'grid' ? 'prostokąta' : 'paska') + '.', parts, shape, cols, answer: { kind: 'shade', value: F(n, den), parts },
      hints: ['Mianownik (' + den + ') mówi, na ile równych części dzielimy całość.', k > 1 ? 'Figura ma ' + parts + ' części – to ' + k + ' razy więcej niż ' + den + '. Jedna „' + den + '-a część" to ' + k + ' kawałki.' : 'Figura jest podzielona na ' + parts + ' części – tyle, ile wynosi mianownik.', 'Zamaluj ' + n + ' · ' + k + ' = ' + n * k + ' ' + pl(n * k, 'część', 'części', 'części') + '.'],
      sol: [fr(n, den) + (k > 1 ? ' = ' + fr(n * k, parts) : ''), 'Zamalowujemy ' + n * k + ' z ' + parts + ' części.'] };
  });

  // ===== ułamek na osi liczbowej =====
  function fracLine(r, d, opts) {
    const den = r.pick(d === 1 ? [2, 3, 4, 5] : [3, 4, 5, 6, 8, 10]); const maxW = d === 3 ? r.int(2, 3) : 1;
    let n = d === 3 ? r.int(den + 1, den * maxW - 1) : r.int(1, den - 1); if (n % den === 0) n++;
    const v = F(n, den), lab = d === 3 && n > den ? '[[' + Math.floor(n / den) + ' ' + (n % den) + '/' + den + ']]' : fr(n, den);
    return { type: 'nline', aspect: 'visual', prompt: 'Przeciągnij znacznik w miejsce liczby ' + lab + ' na osi.', axis: { min: 0, max: maxW, step: 1 / den, den, labelFn: 'frac' }, markLabel: '?', answer: { kind: 'pos', value: v, step: 1 / den, tol: 1 / (3 * den) },
      wrong: [{ v: F(n, den + 1), code: 'nl_place' }, { v: F(den - n > 0 ? den - n : n + 1, den), code: 'nl_place' }, { v: F(n + 1, den), code: 'calc' }],
      hints: ['Odcinek od 0 do 1 podzielono na ' + den + ' równych części – każda to ' + fr(1, den) + '.', 'Licz małe kroki od zera.', 'Potrzebujesz ' + n + ' ' + pl(n, 'kroku', 'kroków', 'kroków') + ' po ' + fr(1, den) + '.'], sol: [lab + ' = ' + n + ' · ' + fr(1, den), 'Od zera ' + n + ' działek w prawo.'] };
  }
  add('fr_line', 'nline', [1, 2, 3], fracLine);
  add('int_compare', 'nline', [1, 2], (r, d) => {
    const R = d === 1 ? 6 : 10; let x = r.int(-R, -1); if (r.chance(0.3)) x = r.int(1, R);
    return { type: 'nline', aspect: 'visual', prompt: 'Przeciągnij znacznik w miejsce liczby ' + (x < 0 ? '−' + -x : x) + '.', axis: { min: -R, max: R, step: 1, labels: Array.from({ length: 2 * R + 1 }, (_, i) => (i - R) % (d === 1 ? 1 : 2) === 0 ? ((i - R) < 0 ? '−' + (R - i) : String(i - R)) : '') }, answer: { kind: 'pos', value: F(x, 1), step: 1, tol: 0.3 },
      wrong: [{ v: F(-x, 1), code: 'bin_sign' }, { v: F(x + (x < 0 ? -1 : 1), 1), code: 'calc' }], signCode: 'bin_sign', hints: ['Zero jest pośrodku osi.', x < 0 ? 'Liczby ujemne leżą na lewo od zera.' : 'Liczby dodatnie leżą na prawo od zera.', 'Odlicz ' + Math.abs(x) + ' ' + pl(Math.abs(x), 'kreskę', 'kreski', 'kresek') + ' od zera ' + (x < 0 ? 'w lewo' : 'w prawo') + '.'], sol: [(x < 0 ? '−' + -x : x) + ': ' + Math.abs(x) + ' działek ' + (x < 0 ? 'na lewo' : 'na prawo') + ' od zera.'] };
  });
  add('dec_compare', 'nline', [1, 2], (r, d) => {
    const step = d === 1 ? 0.1 : 0.05, max = d === 1 ? 1 : 2; const k = r.int(1, Math.round(max / step) - 1); const v = Math.round(k * step * 100) / 100; if (Math.abs(v - Math.round(v)) < 1e-9) return null;
    const vs = String(v).replace('.', ',');
    return { type: 'nline', aspect: 'visual', prompt: 'Przeciągnij znacznik w miejsce liczby ' + vs + '.', axis: { min: 0, max, step, labels: Array.from({ length: Math.round(max / step) + 1 }, (_, i) => { const x = Math.round(i * step * 100) / 100; return Math.abs(x * 2 - Math.round(x * 2)) < 1e-9 ? String(x).replace('.', ',') : ''; }) }, answer: { kind: 'pos', value: U.fromDec(Math.round(v * 100), 2), step, tol: step / 3 },
      wrong: [{ v: U.fromDec(Math.round(v * 10), 2), code: 'dec_places' }], hints: ['Odcinek od 0 do 1 podzielono na ' + Math.round(1 / step) + ' równych części.', 'Jedna działka to ' + String(step).replace('.', ',') + '.', vs + ' to ' + k + ' ' + pl(k, 'działka', 'działki', 'działek') + ' od zera.'], sol: [vs + ' = ' + k + ' · ' + String(step).replace('.', ',')] };
  });
  add('nat_axis', 'nline', [1, 2], (r, d) => {
    const unit = d === 1 ? r.pick([2, 5, 10]) : r.pick([20, 25, 50]); const start = unit * r.int(0, 10); const k = r.int(1, 9); const v = start + k * unit;
    const labels = Array.from({ length: 11 }, (_, i) => i === 0 || i === 5 || i === 10 ? String(start + i * unit) : '');
    return { type: 'nline', aspect: 'visual', prompt: 'Przeciągnij znacznik w miejsce liczby ' + v + '.', axis: { min: start, max: start + 10 * unit, step: unit, labels }, answer: { kind: 'pos', value: F(v, 1), step: unit, tol: unit / 3 },
      wrong: [{ v: F(start + (v - start) / unit, 1), code: 'axis_unit' }], hints: ['Najpierw ustal, ile wynosi jedna działka.', 'Między ' + start + ' a ' + (start + 5 * unit) + ' jest 5 działek, więc jedna to ' + unit + '.', v + ' to ' + k + ' ' + pl(k, 'działka', 'działki', 'działek') + ' od ' + start + '.'], sol: ['1 działka = ' + unit, start + ' + ' + k + ' · ' + unit + ' = ' + v] };
  });

  // ===== paski cięte na wspólny mianownik =====
  const PAIRS = { 1: [[2, 4], [3, 6], [2, 6], [4, 8], [2, 8]], 2: [[2, 3], [3, 4], [2, 5], [4, 6], [3, 5]], 3: [[4, 6], [6, 8], [3, 4], [6, 9], [4, 10]] };
  function pickPair(r, d) { let [b, dd] = r.pick(PAIRS[d]); if (r.chance(0.5)) [b, dd] = [dd, b]; let a = r.int(1, b - 1), c = r.int(1, dd - 1); if (gcd(a, b) !== 1) a = 1; if (gcd(c, dd) !== 1) c = 1; return [a, b, c, dd]; }
  add('fr_common', 'cutbars', [1, 2, 3], (r, d) => {
    const [a, b, c, dd] = pickPair(r, d); const L = lcm(b, dd);
    return { type: 'cutbars', aspect: 'visual', prompt: 'Sprowadź ' + fr(a, b) + ' i ' + fr(c, dd) + ' do wspólnego mianownika: potnij oba paski na tyle samo równych części, a potem uzupełnij liczniki.', cut: { fr: [F(a, b), F(c, dd)].map(x => ({ n: x.n, d: x.d })), maxK: 24 }, answer: { kind: 'cut', dens: [b, dd], fr: [{ n: a, d: b }, { n: c, d: dd }] },
      hints: ['Liczba części musi dzielić się przez ' + b + ' i przez ' + dd + ' – wtedy kreski trafią w podziały obu pasków.', 'Najmniejsza taka liczba to NWW(' + b + ', ' + dd + ') = ' + L + '.', fr(a, b) + ' = ' + fr(a * L / b, L) + ': każdą część pierwszego paska tniemy na ' + L / b + '.'], sol: ['Wspólny mianownik: ' + L, fr(a, b) + ' = ' + fr(a * L / b, L), fr(c, dd) + ' = ' + fr(c * L / dd, L)] };
  });
  function addCut(r, d) {
    const [a0, b0, c0, d0] = pickPair(r, d); let [a, b, c, dd] = [a0, b0, c0, d0]; let op = d >= 2 && r.chance(0.4) ? '−' : '+';
    if (op === '−' && a / b < c / dd) [a, b, c, dd] = [c, dd, a, b]; if (op === '−' && a / b === c / dd) op = '+';
    const L = lcm(b, dd), R = op === '+' ? U.add(F(a, b), F(c, dd)) : U.sub(F(a, b), F(c, dd));
    return { type: 'cutbars', aspect: 'visual', prompt: 'Oblicz ' + fr(a, b) + ' ' + op + ' ' + fr(c, dd) + ' na paskach: potnij oba paski na tyle samo równych części, zapisz ułamki z nowym mianownikiem i ' + (op === '+' ? 'dodaj' : 'odejmij') + ' liczniki.', cut: { fr: [{ n: a, d: b }, { n: c, d: dd }], res: true, op, maxK: 24 },
      answer: { kind: 'cut', dens: [b, dd], fr: [{ n: a, d: b }, { n: c, d: dd }], res: R },
      hints: ['Kawałki pasków mają różną wielkość – najpierw potnij oba na jednakowe kawałki.', 'Liczba części musi dzielić się przez ' + b + ' i ' + dd + ', np. ' + L + '.', 'Gdy kawałki są równe, ' + (op === '+' ? 'dodajesz' : 'odejmujesz') + ' tylko liczniki: ' + a * L / b + ' ' + op + ' ' + c * L / dd + '.'],
      sol: ['Wspólny mianownik: ' + L, fr(a, b) + ' = ' + fr(a * L / b, L) + ', ' + fr(c, dd) + ' = ' + fr(c * L / dd, L), fr(a * L / b, L) + ' ' + op + ' ' + fr(c * L / dd, L) + ' = ' + fr(op === '+' ? a * L / b + c * L / dd : a * L / b - c * L / dd, L) + (eq2(R, op === '+' ? a * L / b + c * L / dd : a * L / b - c * L / dd, L) ? '' : ' = ' + fs(R))] };
  }
  const eq2 = (R, n, d) => R.n === n && R.d === d;
  add('fr_add_diff', 'cutbars', [1, 2], addCut);
  // kolejność kroków rozwiązania (rozumienie procedury)
  add('fr_add_diff', 'order', [2, 3], (r, d) => {
    const [a, b, c, dd] = pickPair(r, 2); const L = lcm(b, dd); const s1 = a * L / b, s2 = c * L / dd; const S = s1 + s2; const R = red(F(S, L));
    const steps = ['Szukam wspólnego mianownika: NWW(' + b + ', ' + dd + ') = ' + L, 'Rozszerzam ułamki: ' + fr(a, b) + ' = ' + fr(s1, L) + ', ' + fr(c, dd) + ' = ' + fr(s2, L), 'Dodaję liczniki: ' + fr(s1, L) + ' + ' + fr(s2, L) + ' = ' + fr(S, L)];
    if (R.d !== L || S > L) steps.push(S > L && R.d === L ? 'Zamieniam na liczbę mieszaną: ' + fr(S, L) + ' = ' + U.fmtF(R) : 'Skracam / zamieniam: ' + fr(S, L) + ' = ' + U.fmtF(R));
    const idx = steps.map((_, i) => i); const sh = r.shuffle(idx); if (sh.every((x, i) => x === i)) sh.reverse();
    const bad = [1, 0].concat(idx.slice(2)), bad2 = [0, 2, 1].concat(idx.slice(3));
    return { type: 'order', aspect: 'concept', prompt: 'Uczeń liczy ' + fr(a, b) + ' + ' + fr(c, dd) + '. Ułóż kroki jego rozwiązania we właściwej kolejności.', items: sh.map(i => steps[i]), answer: { kind: 'order', seq: idx.map(i => sh.indexOf(i)) }, wrongOrders: [{ seq: bad.map(i => sh.indexOf(i)), code: 'step_order' }, { seq: bad2.map(i => sh.indexOf(i)), code: 'step_order' }], unknownCode: 'step_order', orderHint: 'Przeciągnij kroki do ramki w kolejności wykonywania – albo dotykaj ich po kolei.',
      hints: ['Czego potrzeba, zanim zaczniemy rozszerzać ułamki?', 'Liczniki dodajemy dopiero wtedy, gdy kawałki są jednakowe (wspólny mianownik).', 'Skracanie lub zamiana na liczbę mieszaną jest zawsze na końcu.'], sol: steps.map((x, i) => (i + 1) + '. ' + x) };
  });
  // zadanie tekstowe: wybór danych potrzebnych do rozwiązania (transfer)
  add('fr_add_diff', 'multisel', [3], (r) => {
    const [a, b, c, dd] = pickPair(r, 2); const T = MP.th(); const nm = MP.pickKid(r, [['Ola', 'f'], ['Kuba', 'm'], ['Zosia', 'f'], ['Antek', 'm']])[0];
    const opts = ['rano: ' + fr(a, b) + ' h', 'po południu: ' + fr(c, dd) + ' h', 'cena biletu: ' + r.int(8, 25) + ' zł', 'liczba osób: ' + r.int(3, 9)];
    return { type: 'multisel', aspect: 'transfer', prompt: nm + ' w sobotę ćwiczy dwa razy: rano ' + fr(a, b) + ' godziny, a po południu ' + fr(c, dd) + ' godziny. Na basen jedzie z kolegami (' + opts[3].split(': ')[1] + ' osób), bilet kosztuje ' + opts[2].split(': ')[1] + '. <b>Ile godzin ćwiczy razem w sobotę?</b> Zaznacz tylko dane potrzebne do odpowiedzi na to pytanie.', opts, answer: { kind: 'multisel', set: [0, 1] }, extraCode: 'read', missCode: 'read', selHint: 'Zaznacz dane potrzebne do obliczenia odpowiedzi (dotknij, żeby zaznaczyć lub odznaczyć).',
      hints: ['O co pyta zadanie? O łączny czas ćwiczeń.', 'Cena biletu i liczba osób nie mówią nic o czasie.', 'Potrzebne są oba czasy: rano i po południu – potem je dodasz.'], sol: ['Potrzebne: ' + fr(a, b) + ' h i ' + fr(c, dd) + ' h', 'Razem: ' + fr(a, b) + ' + ' + fr(c, dd) + ' = ' + fs(U.add(F(a, b), F(c, dd))) + ' h'] };
  });

  // ===== segregowanie =====
  add('fr_mixed', 'bins', [1, 2], (r, d) => {
    const items = []; const bins = []; const seen = new Set();
    while (items.length < 6) { const den = r.int(2, 9), n = r.int(1, 2 * den); const k = n + '/' + den; if (seen.has(k)) continue; seen.add(k); items.push(fr(n, den)); bins.push(n < den ? 0 : 1); }
    if (!bins.includes(0) || !bins.includes(1)) { items[0] = fr(1, 3); bins[0] = 0; items[1] = fr(7, 4); bins[1] = 1; }
    return { type: 'bins', aspect: 'concept', prompt: 'Posegreguj ułamki: właściwe (mniejsze od 1) i niewłaściwe (równe 1 lub większe).', items, binNames: ['właściwe', 'niewłaściwe'], answer: { kind: 'bins', bins }, binCodes: bins.map(() => 'bin_proper'),
      hints: ['Porównaj licznik z mianownikiem.', 'Licznik mniejszy od mianownika – ułamek właściwy.', 'Licznik równy lub większy – niewłaściwy (np. 4/4 = 1).'], sol: items.map((x, i) => x + ' – ' + (bins[i] ? 'niewłaściwy' : 'właściwy')) };
  });
  add('int_compare', 'bins', [1, 2], (r) => {
    const vals = r.shuffle([-r.int(1, 9), -r.int(10, 40), r.int(1, 9), r.int(10, 60), -r.int(1, 5) - 0.5, r.int(1, 5) + 0.5].map(v => Math.round(v * 10) / 10)).filter((v, i, a) => a.indexOf(v) === i);
    const lab = (v) => (v < 0 ? '−' : '') + String(Math.abs(v)).replace('.', ',');
    return { type: 'bins', aspect: 'concept', prompt: 'Posegreguj liczby na dodatnie i ujemne.', items: vals.map(lab), binNames: ['ujemne', 'dodatnie'], answer: { kind: 'bins', bins: vals.map(v => v < 0 ? 0 : 1) }, binCodes: vals.map(() => 'bin_sign'),
      hints: ['Liczby ujemne mają znak minus.', 'Na osi liczby ujemne leżą na lewo od zera.', 'Liczba bez minusa (i różna od 0) jest dodatnia.'], sol: vals.map(v => lab(v) + ' – ' + (v < 0 ? 'ujemna' : 'dodatnia')) };
  });
  add('div_rules', 'bins', [1, 2, 3], (r, d) => {
    const k = d === 1 ? r.pick([2, 5, 10]) : r.pick([3, 9, 4]); const vals = []; while (vals.length < 6) { const v = r.int(10, d === 3 ? 9999 : 999); if (!vals.includes(v)) vals.push(v); }
    if (!vals.some(v => v % k === 0)) vals[0] = k * r.int(4, 90); if (vals.every(v => v % k === 0)) vals[1] = vals[1] + 1;
    const rule = { 2: 'ostatnia cyfra parzysta', 5: 'ostatnia cyfra 0 lub 5', 10: 'ostatnia cyfra 0', 3: 'suma cyfr dzieli się przez 3', 9: 'suma cyfr dzieli się przez 9', 4: 'liczba z dwóch ostatnich cyfr dzieli się przez 4' }[k];
    return { type: 'bins', aspect: 'concept', prompt: 'Posegreguj liczby: podzielne przez ' + k + ' i niepodzielne przez ' + k + '.', items: vals.map(String), binNames: ['podzielne przez ' + k, 'niepodzielne'], answer: { kind: 'bins', bins: vals.map(v => v % k === 0 ? 0 : 1) }, binCodes: vals.map(() => 'bin_div'),
      hints: ['Cecha podzielności przez ' + k + ': ' + rule + '.', 'Sprawdź każdą liczbę po kolei.', 'Np. ' + vals[0] + (vals[0] % k === 0 ? ' dzieli się' : ' nie dzieli się') + ' przez ' + k + '.'], sol: vals.map(v => v + (v % k === 0 ? ' – podzielna' : ' – niepodzielna (reszta ' + v % k + ')')) };
  });

  // ===== układ współrzędnych =====
  add('coord', 'point', [1, 2], (r, d) => {
    let x = r.int(-4, 4), y = r.int(-4, 4); if (d === 1) { x = Math.abs(x) || 2; y = Math.abs(y) || 3; } if (x === y) y = y === 0 ? 2 : -y; if (x === 0 && y === 0) x = 3;
    const m = (v) => v < 0 ? '−' + -v : String(v);
    return { type: 'point', aspect: 'visual', prompt: 'Zaznacz w układzie współrzędnych punkt P = (' + m(x) + ', ' + m(y) + ').', grid: 5, answer: { kind: 'point', x, y }, wrongPts: [{ x: -x, y, code: 'sign' }, { x, y: -y, code: 'sign' }],
      hints: ['Pierwsza liczba to x: idź od zera w prawo (+) lub w lewo (−).', 'Druga liczba to y: idź w górę (+) lub w dół (−).', 'x = ' + m(x) + ', y = ' + m(y) + '.'], sol: ['Od (0, 0): ' + Math.abs(x) + ' w ' + (x < 0 ? 'lewo' : 'prawo') + ' i ' + Math.abs(y) + ' w ' + (y < 0 ? 'dół' : 'górę') + '.'] };
  });
  add('sym_line', 'point', [1, 2, 3], (r, d) => {
    let x = r.int(-4, 4) || 2, y = r.int(-4, 4) || -3; if (Math.abs(x) === Math.abs(y)) y = y > 0 ? y - 1 || 2 : y + 1 || -2;
    const ax = d === 3 ? 'origin' : r.pick(['x', 'y']); const t = ax === 'x' ? [x, -y] : ax === 'y' ? [-x, y] : [-x, -y]; const m = (v) => v < 0 ? '−' + -v : String(v);
    return { type: 'point', aspect: 'visual', prompt: 'Punkt A = (' + m(x) + ', ' + m(y) + '). Zaznacz punkt A\' symetryczny do A względem ' + (ax === 'x' ? 'osi x' : ax === 'y' ? 'osi y' : 'początku układu (0, 0)') + '.', grid: 5, given: [{ x, y, label: 'A' }], ptLabel: "A'", answer: { kind: 'point', x: t[0], y: t[1] }, wrongPts: [{ x, y, code: 'sym' }, { x: ax === 'x' ? -x : x, y: ax === 'x' ? y : -y, code: 'sym' }], signCode: 'sym',
      hints: ['Punkt symetryczny leży po drugiej stronie, w tej samej odległości.', ax === 'x' ? 'Odbicie w osi x: x zostaje, y zmienia znak.' : ax === 'y' ? 'Odbicie w osi y: y zostaje, x zmienia znak.' : 'Względem (0, 0) obie współrzędne zmieniają znak.', "A' = (" + m(t[0]) + ', ' + m(t[1]) + ').'], sol: ["A' = (" + m(t[0]) + ', ' + m(t[1]) + ')'] };
  });

  // ===== prostokąt: pole i obwód =====
  const RECTS = [[3, 4], [2, 6], [2, 5], [3, 5], [4, 5], [2, 7], [3, 6], [4, 6], [2, 8], [5, 6], [3, 7]];
  add('area_rect', 'rect', [1, 2, 3], (r, d) => {
    const [a, b] = r.pick(RECTS); const P = a * b, O = 2 * (a + b);
    if (d === 1) return { type: 'rect', aspect: 'visual', live: true, prompt: 'Ustaw prostokąt o polu ' + P + ' kratek. Obserwuj, jak zmienia się pole, gdy wydłużasz boki.', rmax: 10, rmax2: 8, answer: { kind: 'rect', area: P, solA: a, solB: b },
      hints: ['Pole prostokąta = długość · szerokość.', 'Szukasz dwóch liczb, których iloczyn to ' + P + '.', 'Np. ' + a + ' · ' + b + ' = ' + P + '.'], sol: ['Np. ' + a + ' × ' + b + ': ' + a + ' · ' + b + ' = ' + P] };
    return { type: 'rect', aspect: 'visual', live: false, prompt: 'Ustaw prostokąt, który ma pole ' + P + ' i obwód ' + O + ' (bok kratki = 1).', rmax: 10, rmax2: 8, answer: { kind: 'rect', area: P, per: O, solA: Math.max(a, b), solB: Math.min(a, b) },
      hints: ['Pole = a · b, obwód = 2 · (a + b).', 'Obwód ' + O + ' oznacza, że a + b = ' + O / 2 + '.', 'Szukaj dwóch liczb o sumie ' + O / 2 + ' i iloczynie ' + P + '.'], sol: ['a + b = ' + O / 2 + ', a · b = ' + P, 'Boki: ' + a + ' i ' + b] };
  });
  add('area_units', 'cells', [1], (r) => {
    const n = r.int(5, 14); const cols = 6, rows = 4;
    return { type: 'cells', aspect: 'visual', prompt: 'Zaznacz na siatce figurę o polu ' + n + ' kratek (dowolny kształt).', cols, rows, answer: { kind: 'cells', count: n }, hints: ['Pole to liczba kratek, które zajmuje figura.', 'Policz zaznaczone kratki.', 'Potrzebujesz dokładnie ' + n + '.'], sol: ['Każda figura z ' + n + ' kratek ma pole ' + n + '.'] };
  });

  // ---------- podłączenie do umiejętności ----------
  Object.keys(extra).forEach(id => {
    const sk = MP.SK[id]; if (!sk) return;
    const orig = sk.gen.bind(sk);
    sk.gen = function (r, d, type) { const e = extra[id][type]; if (e) { const it = e.gen(r, d); if (it) return it; return orig(r, d, (sk.types[d] || ['input']).find(t => !extra[id][t]) || 'input'); } return orig(r, d, type); };
    Object.keys(extra[id]).forEach(t => extra[id][t].ds.forEach(d => { sk.types[d] = sk.types[d] || ['input']; if (!sk.types[d].includes(t)) sk.types[d].push(t); }));
  });
  MP.ixExtra = extra;
})(MP);
