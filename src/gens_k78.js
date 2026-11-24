/* gens_k78.js — klasy 7 i 8 (podstawa 2017, w roku 2026/27 nadal obowiązuje w tych klasach). */
var MP = (typeof window !== 'undefined' ? window : globalThis).MP;
(function (MP) {
  const U = MP.util, { F, pl, red, fromDec, fmtDec, fmtF, gcd } = U;
  const SK = MP.SK, def = (id, o) => { o.id = id; SK[id] = o; };
  const N = (n) => F(n, 1); const { ch, svgW } = MP.gx;
  const sp = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  const sup = (n) => '<sup>' + String(n).replace('-', '−') + '</sup>';
  const mn = (n) => (n < 0 ? '−' + -n : String(n));
  const pn = (n) => (n < 0 ? '(−' + -n + ')' : String(n));
  const dec = (x) => U.plain(fmtDec(x));
  const frs = (x) => fmtF(red(x));
  // wielomian: [[wsp, potęga]] dla jednej zmiennej
  function poly(terms, v) {
    v = v || 'x'; const t = terms.filter(([c]) => c !== 0).sort((a, b) => b[1] - a[1]); if (!t.length) return '0';
    return t.map(([c, p], i) => { const a = Math.abs(c), sg = c < 0 ? (i ? ' − ' : '−') : (i ? ' + ' : ''); const body = p === 0 ? String(a) : (a === 1 ? '' : a) + v + (p > 1 ? sup(p) : ''); return sg + body; }).join('');
  }
  // suma dwóch zmiennych: [[wsp, 'a'],[wsp,'b']]
  const lin2 = (terms) => { const t = terms.filter(([c]) => c !== 0); if (!t.length) return '0'; return t.map(([c, v], i) => { const a = Math.abs(c); return (c < 0 ? (i ? ' − ' : '−') : (i ? ' + ' : '')) + (v ? (a === 1 ? '' : a) + v : a); }).join(''); };

  Object.assign(MP.ERR, {
    pct_base: { cat: 'zasada', title: 'Zła podstawa procentu', kid: 'Procent liczymy zawsze OD czegoś. „Jaki procent liczby b stanowi a" → a : b · 100%.', remedy: 'pct_what' },
    pct_back: { cat: 'zasada', title: 'Procent od nowej ceny zamiast od starej', kid: 'Jeśli cena po podwyżce o 20% to 120% starej ceny, to starą cenę znajdziesz, dzieląc przez 1,2 – a nie odejmując 20% od nowej.', remedy: 'pct_whole' },
    pct_pp: { cat: 'zasada', title: 'Pomylone procenty i punkty procentowe', kid: 'Zmiana z 20% na 25% to wzrost o 5 punktów procentowych, ale o 25% (bo 5 to 25% z 20).', remedy: 'pct_points' },
    pct_chain: { cat: 'zasada', title: 'Kolejne zmiany procentowe dodane', kid: 'Druga zmiana liczy się od NOWEJ wartości. +20%, a potem −20% to ·1,2·0,8 = 0,96, czyli o 4% mniej.', remedy: 'pct_change' },
    alg_like: { cat: 'zasada', title: 'Łączenie wyrazów niepodobnych', kid: 'Dodawać można tylko wyrazy podobne – z tą samą literą w tej samej potędze. 3x + 2 to nie 5x.', remedy: 'alg_like', alt: 'Myśl o literach jak o owocach: 3 jabłka + 2 jabłka = 5 jabłek, ale 3 jabłka + 2 gruszki zostają osobno.' },
    alg_dist: { cat: 'zasada', title: 'Mnożenie tylko pierwszego wyrazu nawiasu', kid: 'Liczbę przed nawiasem mnożymy przez KAŻDY wyraz w nawiasie: 3(x − 5) = 3x − 15.', remedy: 'alg_mul' },
    alg_sign: { cat: 'zasada', title: 'Błąd znaku przy opuszczaniu nawiasu', kid: 'Minus przed nawiasem zmienia znaki wszystkich wyrazów w nawiasie: −(x − 3) = −x + 3.', remedy: 'alg_mul' },
    alg_binom: { cat: 'zasada', title: 'Niepełne mnożenie sum', kid: 'Każdy wyraz pierwszego nawiasu mnożymy przez każdy wyraz drugiego – powstają 4 iloczyny.', remedy: 'alg_binom' },
    eq_move: { cat: 'zasada', title: 'Błąd przy przenoszeniu wyrazów', kid: 'Przenosząc wyraz na drugą stronę równania, zmieniamy jego znak. Dzieląc, dzielimy obie strony przez tę samą liczbę.', remedy: 'eq_solve' },
    formula: { cat: 'zasada', title: 'Złe przekształcenie wzoru', kid: 'Przekształcasz wzór jak równanie: wykonuj te same działania po obu stronach, aż szukana zostanie sama.', remedy: 'formula' },
    pow_add: { cat: 'zasada', title: 'Pomylone działania na wykładnikach', kid: 'Mnożąc potęgi o tej samej podstawie, wykładniki DODAJEMY; dzieląc – odejmujemy; potęgę potęgi – MNOŻYMY wykładniki.', remedy: 'pow_rules', alt: 'Rozpisz: 2³ · 2² = (2·2·2)·(2·2) – to pięć dwójek, więc 2⁵. A (2³)² = 2³ · 2³ – sześć dwójek, więc 2⁶.' },
    sci: { cat: 'zasada', title: 'Zły wykładnik w notacji wykładniczej', kid: 'W notacji wykładniczej pierwsza liczba jest od 1 do 10. Wykładnik to liczba miejsc, o które przesuwasz przecinek (w lewo – dodatni, w prawo – ujemny).', remedy: 'pow_sci' },
    root: { cat: 'zasada', title: 'Pierwiastek pomylony z dzieleniem przez 2', kid: 'Pierwiastek kwadratowy z a to liczba, która podniesiona do kwadratu daje a. √36 = 6, bo 6² = 36 (a nie 36 : 2).', remedy: 'root' },
    root_sum: { cat: 'zasada', title: 'Pierwiastek z sumy jak suma pierwiastków', kid: 'Pierwiastki można mnożyć i dzielić, ale nie dodawać: √(9 + 16) = √25 = 5, a nie 3 + 4.', remedy: 'root_ops' },
    pyth: { cat: 'zasada', title: 'Źle zastosowane twierdzenie Pitagorasa', kid: 'a² + b² = c², gdzie c to przeciwprostokątna (najdłuższy bok, naprzeciw kąta prostego). Szukając przyprostokątnej, ODEJMUJ kwadraty.', remedy: 'pyth', alt: 'Zbuduj kwadraty na bokach trójkąta prostokątnego. Dwa mniejsze kwadraty razem mają tyle samo pola co największy.' },
    pyth_nosq: { cat: 'zasada', title: 'Dodane boki zamiast kwadratów', kid: 'W twierdzeniu Pitagorasa dodajemy KWADRATY boków, a na końcu wyciągamy pierwiastek.', remedy: 'pyth' },
    coord_swap: { cat: 'zasada', title: 'Zamienione współrzędne', kid: 'Pierwsza współrzędna to x (w prawo/lewo), druga to y (w górę/dół). Zapis (x, y).', remedy: 'coord' },
    poly_ang: { cat: 'zasada', title: 'Zła suma kątów wielokąta', kid: 'Suma kątów n-kąta to (n − 2) · 180°, bo da się go podzielić na n − 2 trójkąty.', remedy: 'poly_reg' },
    cong: { cat: 'zasada', title: 'Zła cecha przystawania', kid: 'Cechy przystawania: bbb (trzy boki), bkb (dwa boki i kąt MIĘDZY nimi), kbk (bok i dwa kąty przy nim). Równe kąty nie wystarczą.', remedy: 'tri_cong' },
    mean: { cat: 'zasada', title: 'Źle obliczona średnia', kid: 'Średnia = suma wszystkich danych : liczba danych.', remedy: 'mean' },
    median: { cat: 'zasada', title: 'Mediana bez uporządkowania', kid: 'Najpierw uporządkuj dane rosnąco. Mediana to wartość środkowa (przy parzystej liczbie danych – średnia dwóch środkowych).', remedy: 'median' },
    prob: { cat: 'zasada', title: 'Źle policzone prawdopodobieństwo', kid: 'P = liczba wyników sprzyjających : liczba wszystkich możliwych wyników.', remedy: 'prob_basic' },
    prop: { cat: 'zasada', title: 'Zła proporcja', kid: 'W proporcji a : b = c : d iloczyn wyrazów skrajnych równa się iloczynowi środkowych: a · d = b · c.', remedy: 'proportion' },
    ratio: { cat: 'zasada', title: 'Zły podział w stosunku', kid: 'Stosunek 2 : 3 oznacza 2 + 3 = 5 równych części. Jedna część to całość : 5.', remedy: 'prop_div' },
    vat: { cat: 'zasada', title: 'VAT liczony od ceny brutto', kid: 'VAT dolicza się do ceny netto. Cena brutto = netto · 1,23. Żeby odzyskać netto, dziel przez 1,23.', remedy: 'vat' },
    deposit: { cat: 'zasada', title: 'Błąd przy oprocentowaniu', kid: 'Po roku odsetki = kapitał · p%. Przy kapitalizacji w drugim roku procent liczymy od kapitału razem z odsetkami.', remedy: 'pct_deposit' },
    combin: { cat: 'zasada', title: 'Źle policzone możliwości', kid: 'Gdy wybór składa się z kilku etapów, mnożymy liczby możliwości w każdym etapie. Przy parach bez kolejności dzielimy przez 2.', remedy: 'combin' },
    vol_pyr: { cat: 'zasada', title: 'Objętość ostrosłupa bez 1/3', kid: 'Objętość ostrosłupa to 1/3 · Pp · H – trzy takie ostrosłupy mieszczą się w graniastosłupie o tej samej podstawie i wysokości.', remedy: 'pyr_vol' },
    vol_base: { cat: 'zasada', title: 'Złe pole podstawy', kid: 'Objętość graniastosłupa to pole podstawy · wysokość bryły. Najpierw policz pole podstawy (np. trójkąta: a · h : 2).', remedy: 'prism_vol' },
    slant: { cat: 'zasada', title: 'Pomylona wysokość ostrosłupa z wysokością ściany', kid: 'Wysokość ostrosłupa H idzie od wierzchołka do podstawy. Do pola ściany bocznej potrzebna jest wysokość ŚCIANY h – oblicz ją z Pitagorasa.', remedy: 'pyr_surf' },
    sym: { cat: 'zasada', title: 'Zły punkt symetryczny', kid: 'Symetria względem osi x zmienia znak y, względem osi y – znak x, względem początku układu – oba znaki.', remedy: 'sym_line' },
    circ_pi: { cat: 'zasada', title: 'Pomylone wzory na koło', kid: 'Długość okręgu: L = 2πr. Pole koła: P = πr². Uważaj na średnicę – r to połowa średnicy.', remedy: 'circle_len' },
    circ_pos: { cat: 'zasada', title: 'Złe położenie okręgów', kid: 'Porównaj odległość środków d z sumą i różnicą promieni: d = r₁ + r₂ – styczne zewnętrznie, d = |r₁ − r₂| – styczne wewnętrznie.', remedy: 'circle_pos' }
  });

  // ===================== LICZBY WYMIERNE (kl. 7) =====================
  def('rat_ops', {
    name: 'Działania na liczbach dodatnich i ujemnych', grade: 7, mainCode: 'int_sign_add', prereq: ['int_add', 'int_mul', 'mix_ops'], allowNeg: true,
    types: { 1: ['input', 'choice'], 2: ['input', 'choice'], 3: ['input', 'choice'] },
    gen(r, d) {
      const A = r.pick([[-1, 2], [-3, 4], [-1, 4], [-5, 2], [-7, 10], [-3, 5]]), B = r.pick([[1, 4], [3, 2], [2, 5], [1, 2], [6, 5]]); const a = F(A[0], A[1]), b = F(B[0], B[1]);
      if (d === 1) { const v = U.add(a, b); return { prompt: 'Oblicz: ' + dec(a) + ' + ' + frs(b), value: v, form: 'any', allowNeg: true, wrong: [{ v: U.sub(b, a), code: 'int_sign_add' }, { v: U.mul(N(-1), v), code: 'sign' }].filter(w => !U.eq(w.v, v)), hints: ['Zamień oba składniki na ten sam zapis (np. ułamki zwykłe).', 'Dodając liczby o różnych znakach, odejmij wartości bezwzględne.', 'Znak wyniku – taki jak liczby o większej wartości bezwzględnej.'], sol: [dec(a) + ' = ' + frs(a), frs(a) + ' + ' + frs(b) + ' = ' + frs(v)] }; }
      if (d === 2) { const v = U.mul(a, b); return { prompt: 'Oblicz: ' + dec(a) + ' · ' + frs(b), value: v, form: 'any', allowNeg: true, wrong: [{ v: U.mul(N(-1), v), code: 'int_mul_sign' }, { v: U.add(a, b), code: 'op_confuse' }].filter(w => !U.eq(w.v, v)), hints: ['Najpierw ustal znak: minus · plus = minus.', 'Zamień ' + dec(a) + ' na ułamek zwykły: ' + frs(a) + '.', 'Pomnóż liczniki i mianowniki.'], sol: [frs(a) + ' · ' + frs(b) + ' = ' + frs(v)] }; }
      const c = r.int(2, 5); const v = U.sub(U.mul(a, N(c)), U.mul(b, N(-1)));
      return { prompt: 'Oblicz: ' + c + ' · (' + dec(a) + ') − (−' + frs(b) + ')', value: v, form: 'any', allowNeg: true, wrong: [{ v: U.sub(U.mul(a, N(c)), b), code: 'int_sub_neg' }, { v: U.mul(N(-1), v), code: 'sign' }].filter(w => !U.eq(w.v, v)), hints: ['Najpierw mnożenie: ' + c + ' · (' + dec(a) + ') = ' + frs(U.mul(a, N(c))) + '.', 'Odejmowanie liczby ujemnej to dodawanie liczby przeciwnej.', frs(U.mul(a, N(c))) + ' + ' + frs(b) + ' = ?'], sol: [c + ' · (' + dec(a) + ') = ' + frs(U.mul(a, N(c))), frs(U.mul(a, N(c))) + ' + ' + frs(b) + ' = ' + frs(v)] };
    }
  });

  // ===================== PROCENTY (kl. 7–8) =====================
  def('pct_what', {
    name: 'Jaki to procent?', grade: 7, mainCode: 'pct_base', prereq: ['pct_frac'],
    types: { 1: ['input', 'choice'], 2: ['input', 'choice'], 3: ['input', 'choice'] },
    gen(r, d) {
      const p = d === 1 ? r.pick([10, 20, 25, 50, 75]) : d === 2 ? r.pick([5, 15, 30, 40, 60, 80, 35, 45]) : r.pick([12, 24, 36, 64, 85, 125, 150]); const b = d === 1 ? r.pick([20, 40, 80, 200]) : r.pick([20, 40, 60, 80, 120, 200, 400]); const a = b * p / 100; if (!Number.isInteger(a)) return this.gen(r, d === 3 ? 2 : 1);
      const T = MP.th(); const ctx = d === 3 ? 'W klasie jest ' + b + ' uczniów' : '';
      return { prompt: d === 3 ? 'Na wycieczkę zapisało się ' + a + ' z ' + b + ' osób. Jaki to procent wszystkich osób?' : 'Jakim procentem liczby ' + b + ' jest liczba ' + a + '?', value: N(p), unit: '%', wrong: [{ v: F(b * 100, a), code: 'pct_base' }, { v: N(a), code: 'pct_mul100' }, { v: F(a, b), code: 'pct_mul100' }].filter(w => !U.eq(w.v, N(p))), hints: ['Zapisz, jaką częścią jest ' + a + ' z ' + b + ': ' + a + '/' + b + '.', 'Skróć lub rozszerz ułamek do mianownika 100.', a + '/' + b + ' · 100% = ?'], sol: [a + '/' + b + ' = ' + frs(F(a, b)), frs(F(a, b)) + ' · 100% = ' + p + '%'] };
    }
  });

  def('pct_whole', {
    name: 'Obliczanie liczby, gdy dany jest jej procent', grade: 7, mainCode: 'pct_back', prereq: ['pct_of'],
    types: { 1: ['input', 'choice'], 2: ['input', 'choice'], 3: ['input', 'choice'] },
    gen(r, d) {
      if (d < 3) { const p = d === 1 ? r.pick([10, 20, 25, 50]) : r.pick([5, 15, 30, 40, 60, 75, 80]); const x = r.int(2, 30) * (100 / gcd(p, 100)); const a = x * p / 100;
        return { prompt: p + '% pewnej liczby to ' + a + '. Jaka to liczba?', value: N(x), wrong: [{ v: F(a * p, 100), code: 'pct_back' }, { v: N(a + p), code: 'concept' }, { v: F(a * 100, 100 - p), code: 'pct_back' }].filter(w => !U.eq(w.v, N(x))), hints: ['Szukamy całości (100%), a znamy ' + p + '%.', '1% to ' + a + ' : ' + p + ' = ' + frs(F(a, p)) + '.', '100% to 100 razy więcej.'], sol: [a + ' : ' + p + ' = ' + frs(F(a, p)) + ' (1%)', frs(F(a, p)) + ' · 100 = ' + x] }; }
      const p = r.pick([10, 20, 25, 50]), up = r.chance(0.5); const old = r.int(4, 40) * 20; const nw = old * (up ? 100 + p : 100 - p) / 100;
      return { prompt: 'Po ' + (up ? 'podwyżce' : 'obniżce') + ' o ' + p + '% bilet kosztuje ' + nw + ' zł. Ile kosztował przed ' + (up ? 'podwyżką' : 'obniżką') + '?', value: N(old), unit: 'zł', wrong: [{ v: F(nw * (up ? 100 - p : 100 + p), 100), code: 'pct_back' }, { v: N(nw), code: 'read' }].filter(w => !U.eq(w.v, N(old))), hints: ['Nowa cena to ' + (up ? 100 + p : 100 - p) + '% starej ceny.', 'Czyli ' + nw + ' zł = ' + (up ? 100 + p : 100 - p) + '% · stara cena.', 'Podziel: ' + nw + ' : ' + dec(F(up ? 100 + p : 100 - p, 100)) + '.'], sol: [nw + ' : ' + dec(F(up ? 100 + p : 100 - p, 100)) + ' = ' + old + ' zł'] };
    }
  });

  def('pct_change', {
    name: 'Podwyżki i obniżki', grade: 7, mainCode: 'pct_chain', prereq: ['pct_of'],
    types: { 1: ['input', 'choice'], 2: ['input', 'choice'], 3: ['input', 'choice'] },
    gen(r, d) {
      if (d < 3) { const p = d === 1 ? r.pick([10, 20, 25, 50]) : r.pick([5, 15, 30, 12, 8, 35]); const up = r.chance(0.5); const x = r.int(2, 40) * (100 / gcd(p, 100)); const v = x * (up ? 100 + p : 100 - p) / 100;
        return { prompt: 'Cena ' + sp(x) + ' zł ' + (up ? 'wzrosła' : 'spadła') + ' o ' + p + '%. Jaka jest nowa cena?', value: fromDec(Math.round(v * 100), 2), dec: true, unit: 'zł', wrong: [{ v: N(x * p / 100), code: 'read' }, { v: N(up ? x + p : x - p), code: 'pct_mul100' }, { v: fromDec(Math.round(x * (up ? 100 - p : 100 + p)), 2), code: 'op_confuse' }].filter(w => !U.eq(w.v, fromDec(Math.round(v * 100), 2)) && U.val(w.v) > 0), hints: [p + '% z ' + sp(x) + ' to ' + dec(F(x * p, 100)) + ' zł.', up ? 'Podwyżka – dodaj.' : 'Obniżka – odejmij.', 'Albo od razu: ' + sp(x) + ' · ' + dec(F(up ? 100 + p : 100 - p, 100)) + '.'], sol: [p + '% · ' + sp(x) + ' = ' + dec(F(x * p, 100)) + ' zł', sp(x) + (up ? ' + ' : ' − ') + dec(F(x * p, 100)) + ' = ' + dec(F(Math.round(v * 100), 100)) + ' zł'] }; }
      const p = r.pick([10, 20, 25, 50]), q = r.pick([10, 20, 25, 50]); const res = (100 + p) * (100 - q) / 100 - 100;
      return { prompt: 'Cenę najpierw podniesiono o ' + p + '%, a potem obniżono o ' + q + '%. O ile procent zmieniła się cena w stosunku do początkowej? (wzrost wpisz dodatni, spadek – z minusem)', value: fromDec(Math.round(res * 100), 2), allowNeg: true, unit: '%', wrong: [{ v: N(p - q), code: 'pct_chain' }, { v: fromDec(Math.round(-res * 100), 2), code: 'sign' }].filter(w => !U.eq(w.v, fromDec(Math.round(res * 100), 2))), hints: ['Przyjmij, że cena wynosiła 100 zł.', 'Po podwyżce: ' + (100 + p) + ' zł. Obniżkę liczymy od ' + (100 + p) + ' zł!', (100 + p) + ' · ' + dec(F(100 - q, 100)) + ' = ' + dec(F((100 + p) * (100 - q), 100)) + ' zł. Porównaj ze 100 zł.'], sol: ['100 → ' + (100 + p) + ' → ' + dec(F((100 + p) * (100 - q), 100)), 'Zmiana: ' + dec(F(Math.round(res * 100), 100)) + '%'] };
    }
  });

  def('pct_points', {
    name: 'Punkty procentowe', grade: 7, mainCode: 'pct_pp', prereq: ['pct_what'],
    types: { 1: ['input', 'choice'], 2: ['input', 'choice'], 3: ['input', 'choice'] },
    gen(r, d) {
      const a = r.pick([10, 20, 25, 40, 50]), b = a + r.pick([5, 10, 15, 20]); const pp = b - a, rel = 100 * pp / a; if (!Number.isInteger(rel * 100)) return this.gen(r, 1);
      if (d === 1) return { prompt: 'Poparcie dla pomysłu wzrosło z ' + a + '% do ' + b + '%. O ile <b>punktów procentowych</b> wzrosło?', value: N(pp), wrong: [{ v: fromDec(Math.round(rel * 100), 2), code: 'pct_pp' }, { v: N(b), code: 'read' }].filter(w => !U.eq(w.v, N(pp))), hints: ['Punkty procentowe to zwykła różnica procentów.', b + ' − ' + a + ' = ?', 'Nie licz tu procentu od procentu.'], sol: [b + '% − ' + a + '% = ' + pp + ' p.p.'] };
      return { prompt: 'Poparcie dla pomysłu wzrosło z ' + a + '% do ' + b + '%. O ile <b>procent</b> wzrosło poparcie?', value: fromDec(Math.round(rel * 100), 2), unit: '%', wrong: [{ v: N(pp), code: 'pct_pp' }, { v: fromDec(Math.round(100 * pp / b * 100), 2), code: 'pct_base' }].filter(w => !U.eq(w.v, fromDec(Math.round(rel * 100), 2))), hints: ['Wzrost wynosi ' + pp + ' punktów procentowych.', 'Teraz sprawdź, jakim procentem POCZĄTKOWEJ wartości (' + a + ') jest ' + pp + '.', pp + ' : ' + a + ' · 100% = ?'], sol: [b + ' − ' + a + ' = ' + pp + ' p.p.', pp + ' : ' + a + ' · 100% = ' + dec(F(Math.round(rel * 100), 100)) + '%'] };
    }
  });

  def('pct_deposit', {
    name: 'Lokaty bankowe', grade: 8, mainCode: 'deposit', prereq: ['pct_change'],
    types: { 1: ['input', 'choice'], 2: ['input', 'choice'], 3: ['input', 'choice'] },
    gen(r, d) {
      const K = r.pick([1000, 2000, 5000, 4000, 10000, 2500]), p = r.pick([2, 3, 4, 5, 6]);
      if (d === 1) return { prompt: 'Wpłacono ' + sp(K) + ' zł na roczną lokatę oprocentowaną ' + p + '% w skali roku. Ile wyniosą odsetki po roku (bez podatku)?', value: N(K * p / 100), unit: 'zł', wrong: [{ v: N(K + K * p / 100), code: 'read' }, { v: N(K * p / 10), code: 'pct_mul100' }], hints: ['Odsetki = ' + p + '% kapitału.', p + '% = ' + dec(F(p, 100)) + '.', sp(K) + ' · ' + dec(F(p, 100)) + ' = ?'], sol: [sp(K) + ' · ' + dec(F(p, 100)) + ' = ' + K * p / 100 + ' zł'] };
      if (d === 2) { const y1 = K * (100 + p) / 100, y2 = Math.round(y1 * (100 + p)); // grosze
        return { prompt: 'Wpłacono ' + sp(K) + ' zł na lokatę ' + p + '% w skali roku z roczną kapitalizacją odsetek. Ile złotych będzie na lokacie po 2 latach (bez podatku)?', value: fromDec(y2, 2), dec: true, unit: 'zł', wrong: [{ v: N(K + 2 * K * p / 100), code: 'deposit' }, { v: N(y1), code: 'read' }].filter(w => !U.eq(w.v, fromDec(y2, 2))), hints: ['Po 1 roku: ' + sp(K) + ' · ' + dec(F(100 + p, 100)) + ' = ' + dec(F(y1 * 100, 100)) + ' zł.', 'W 2. roku procent liczymy od ' + dec(F(y1 * 100, 100)) + ' zł.', dec(F(y1 * 100, 100)) + ' · ' + dec(F(100 + p, 100)) + ' = ?'], sol: ['Po 1 roku: ' + dec(F(y1 * 100, 100)) + ' zł', 'Po 2 latach: ' + dec(fromDec(y2, 2)) + ' zł'] }; }
      const I = K * p / 100; const tax = I * 19 / 100;
      return { prompt: 'Lokata roczna: ' + sp(K) + ' zł, oprocentowanie ' + p + '%. Od odsetek pobiera się 19% podatku. Ile złotych odsetek dostanie klient na rękę?', value: fromDec(Math.round((I - tax) * 100), 2), dec: true, unit: 'zł', wrong: [{ v: N(I), code: 'read' }, { v: fromDec(Math.round((I - 19) * 100), 2), code: 'pct_mul100' }].filter(w => U.val(w.v) > 0 && !U.eq(w.v, fromDec(Math.round((I - tax) * 100), 2))), hints: ['Odsetki: ' + sp(K) + ' · ' + p + '% = ' + I + ' zł.', 'Podatek: 19% z ' + I + ' = ' + dec(fromDec(Math.round(tax * 100), 2)) + ' zł.', 'Odejmij podatek od odsetek.'], sol: ['Odsetki: ' + I + ' zł', 'Podatek: ' + dec(fromDec(Math.round(tax * 100), 2)) + ' zł', 'Na rękę: ' + dec(fromDec(Math.round((I - tax) * 100), 2)) + ' zł'] };
    }
  });

  def('vat', {
    name: 'VAT i inne podatki', grade: 8, mainCode: 'vat', prereq: ['pct_change'],
    types: { 1: ['input', 'choice'], 2: ['input', 'choice'], 3: ['input', 'choice'] },
    gen(r, d) {
      const rate = r.pick([23, 8]); const net = r.int(2, 60) * 100;
      const gross = net * (100 + rate) / 100;
      if (d === 1) return { prompt: 'Cena netto roweru wynosi ' + sp(net) + ' zł. VAT wynosi ' + rate + '%. Jaka jest cena brutto?', value: N(gross), unit: 'zł', wrong: [{ v: N(net * rate / 100), code: 'read' }, { v: N(net + rate), code: 'pct_mul100' }], hints: ['Cena brutto = netto + VAT.', 'VAT: ' + rate + '% z ' + sp(net) + ' = ' + net * rate / 100 + ' zł.', sp(net) + ' + ' + net * rate / 100 + ' = ?'], sol: [sp(net) + ' · ' + dec(F(100 + rate, 100)) + ' = ' + sp(gross) + ' zł'] };
      if (d === 2) return { prompt: 'Cena brutto (z ' + rate + '% VAT) wynosi ' + sp(gross) + ' zł. Jaka jest cena netto?', value: N(net), unit: 'zł', wrong: [{ v: fromDec(Math.round(gross * (100 - rate)), 2), code: 'vat' }, { v: N(gross), code: 'read' }].filter(w => !U.eq(w.v, N(net))), hints: ['Cena brutto to ' + (100 + rate) + '% ceny netto.', 'Nie odejmuj ' + rate + '% od brutto – podziel przez ' + dec(F(100 + rate, 100)) + '.', sp(gross) + ' : ' + dec(F(100 + rate, 100)) + ' = ?'], sol: [sp(gross) + ' : ' + dec(F(100 + rate, 100)) + ' = ' + sp(net) + ' zł'] };
      return { prompt: 'Cena brutto (z ' + rate + '% VAT) to ' + sp(gross) + ' zł. Ile złotych w tej cenie stanowi podatek VAT?', value: N(gross - net), unit: 'zł', wrong: [{ v: fromDec(Math.round(gross * rate), 2), code: 'vat' }, { v: N(net), code: 'read' }].filter(w => !U.eq(w.v, N(gross - net))), hints: ['Najpierw znajdź cenę netto: ' + sp(gross) + ' : ' + dec(F(100 + rate, 100)) + '.', 'Netto = ' + sp(net) + ' zł.', 'VAT = brutto − netto.'], sol: ['Netto: ' + sp(net) + ' zł', 'VAT: ' + sp(gross) + ' − ' + sp(net) + ' = ' + sp(gross - net) + ' zł'] };
    }
  });

  // ===================== FIGURY (kl. 7) =====================
  function gridSvg(pts, labels, R) { R = R || 5; const s = 22, c = 10 + R * s, X = (x) => c + x * s, Y = (y) => c - y * s; let b = '';
    for (let i = -R; i <= R; i++) { b += '<line x1="' + X(i) + '" y1="' + Y(R) + '" x2="' + X(i) + '" y2="' + Y(-R) + '" class="grid"/><line x1="' + X(-R) + '" y1="' + Y(i) + '" x2="' + X(R) + '" y2="' + Y(i) + '" class="grid"/>'; }
    b += '<line x1="' + X(-R) + '" y1="' + c + '" x2="' + X(R) + '" y2="' + c + '" class="ln" style="stroke-width:1.5"/><line x1="' + c + '" y1="' + Y(R) + '" x2="' + c + '" y2="' + Y(-R) + '" class="ln" style="stroke-width:1.5"/>';
    b += '<text x="' + (X(R) - 8) + '" y="' + (c - 6) + '" class="ax">x</text><text x="' + (c + 6) + '" y="' + (Y(R) + 10) + '" class="ax">y</text><text x="' + (X(1) - 3) + '" y="' + (c + 14) + '" class="ax">1</text><text x="' + (c - 12) + '" y="' + (Y(1) + 4) + '" class="ax">1</text>';
    pts.forEach((p, i) => { b += '<circle cx="' + X(p[0]) + '" cy="' + Y(p[1]) + '" r="5" style="fill:var(--coral)"/>'; if (labels) b += '<text x="' + (X(p[0]) + 7) + '" y="' + (Y(p[1]) - 7) + '" class="lb">' + labels[i] + '</text>'; });
    return svgW(2 * c, 2 * c, b, 'układ współrzędnych', 'width:min(300px,100%)'); }
  const pt = (x, y) => '(' + mn(x) + ', ' + mn(y) + ')';
  def('coord', {
    name: 'Układ współrzędnych', grade: 7, mainCode: 'coord_swap', prereq: ['int_compare'],
    types: { 1: ['choice'], 2: ['choice'], 3: ['input', 'choice'] },
    gen(r, d) {
      if (d < 3) { let x = r.int(-4, 4), y = r.int(-4, 4); if (d === 1) { x = Math.abs(x) || 2; y = Math.abs(y) || 3; } if (x === y) y = -y || 1; if (x === 0) x = 3;
        return ch(r, { prompt: 'Jakie współrzędne ma punkt A?', visual: gridSvg([[x, y]], ['A']), correct: pt(x, y), wrong: [[pt(y, x), 'coord_swap'], [pt(-x, y), 'sign'], [pt(x, -y), 'sign'], [pt(-y, -x), 'coord_swap']], hints: ['Pierwsza współrzędna (x): o ile w prawo (+) lub w lewo (−) od zera.', 'Druga współrzędna (y): o ile w górę (+) lub w dół (−).', 'Punkt A: x = ' + mn(x) + '.'], sol: ['A = ' + pt(x, y)] }); }
      const x1 = r.int(-4, 0), y1 = r.int(-4, 0), w = r.int(2, 5), h = r.int(2, 4); const P = [[x1, y1], [x1 + w, y1], [x1 + w, y1 + h], [x1, y1 + h]];
      return { prompt: 'Prostokąt ma wierzchołki ' + P.map(p => pt(p[0], p[1])).join(', ') + '. Oblicz jego pole (bok kratki = 1).', visual: gridSvg(P, ['A', 'B', 'C', 'D']), value: N(w * h), wrong: [{ v: N(2 * (w + h)), code: 'area_perim' }, { v: N((w + 1) * (h + 1)), code: 'calc' }], hints: ['Długość boku AB to różnica współrzędnych x: ' + mn(x1 + w) + ' − ' + pn(x1) + ' = ' + w + '.', 'Długość boku BC to różnica współrzędnych y: ' + h + '.', 'Pole = ' + w + ' · ' + h + '.'], sol: ['|AB| = ' + w + ', |BC| = ' + h, 'P = ' + w + ' · ' + h + ' = ' + w * h] };
    }
  });

  def('poly_reg', {
    name: 'Kąty w wielokątach, wielokąty foremne', grade: 7, mainCode: 'poly_ang', prereq: ['ang_triangle'],
    types: { 1: ['input', 'choice'], 2: ['input', 'choice'], 3: ['input', 'choice'] },
    gen(r, d) {
      const NG = { 5: 'pięciokąta', 6: 'sześciokąta', 8: 'ośmiokąta', 9: 'dziewięciokąta', 10: 'dziesięciokąta', 12: 'dwunastokąta', 4: 'czworokąta', 7: 'siedmiokąta' };
      const n = r.pick(d === 3 ? [5, 6, 8, 9, 10, 12] : [4, 5, 6, 7, 8, 10]); const S = (n - 2) * 180;
      if (d === 1) return { prompt: 'Ile wynosi suma miar kątów wewnętrznych ' + NG[n] + '?', value: N(S), unit: '°', wrong: [{ v: N(n * 180), code: 'poly_ang' }, { v: N(360), code: 'poly_ang' }, { v: N((n - 1) * 180), code: 'poly_ang' }].filter(w => w.v.n !== S), hints: ['Z jednego wierzchołka poprowadź wszystkie przekątne.', 'Powstanie ' + (n - 2) + ' trójkątów.', (n - 2) + ' · 180° = ?'], sol: ['(' + n + ' − 2) · 180° = ' + S + '°'] };
      if (d === 2) { if (!Number.isInteger(S / n)) return this.gen(r, 1); return { prompt: 'Ile stopni ma każdy kąt wewnętrzny ' + NG[n] + ' foremnego?', value: N(S / n), unit: '°', wrong: [{ v: N(360 / n), code: 'poly_ang' }, { v: N(180 - S / n), code: 'poly_ang' }].filter(w => w.v.n !== S / n), hints: ['Suma kątów: (' + n + ' − 2) · 180° = ' + S + '°.', 'W wielokącie foremnym wszystkie kąty są równe.', S + ' : ' + n + ' = ?'], sol: [S + '° : ' + n + ' = ' + S / n + '°'] }; }
      const ang = 180 - 360 / n;
      return { prompt: 'Kąt wewnętrzny wielokąta foremnego ma ' + ang + '°. Ile boków ma ten wielokąt?', value: N(n), wrong: [{ v: N(360 / ang), code: 'poly_ang' }, { v: N(Math.round(180 / (180 - ang))), code: 'poly_ang' }].filter(w => Number.isInteger(w.v.n) && w.v.n !== n), hints: ['Kąt zewnętrzny (przyległy) ma 180° − ' + ang + '° = ' + (180 - ang) + '°.', 'Suma kątów zewnętrznych każdego wielokąta to 360°.', '360 : ' + (180 - ang) + ' = ?'], sol: ['180 − ' + ang + ' = ' + (180 - ang) + '°', '360 : ' + (180 - ang) + ' = ' + n] };
    }
  });

  def('tri_cong', {
    name: 'Przystawanie trójkątów', grade: 7, mainCode: 'cong', prereq: ['tri_ineq'],
    types: { 1: ['choice'], 2: ['choice'], 3: ['choice'] },
    gen(r, d) {
      const C = [['mają wszystkie trzy boki odpowiednio równe: ' + r.int(4, 9) + ' cm, ' + r.int(5, 10) + ' cm i ' + r.int(6, 11) + ' cm', 'tak – cecha bbb'], ['mają równe dwa boki (6 cm i 8 cm) i równy kąt <b>między</b> nimi (50°)', 'tak – cecha bkb'], ['mają równy bok 7 cm i równe oba kąty <b>przy tym boku</b> (40° i 65°)', 'tak – cecha kbk'], ['mają wszystkie kąty równe: 50°, 60° i 70°', 'nie wiadomo'], ['mają równe dwa boki (5 cm i 9 cm) i równy kąt 30°, który <b>nie leży</b> między nimi', 'nie wiadomo']];
      const c = d === 1 ? r.pick(C.slice(0, 3)) : r.pick(C);
      return ch(r, { prompt: 'Dwa trójkąty ' + c[0] + '. Czy na pewno są przystające?', correct: c[1], wrong: ['tak – cecha bbb', 'tak – cecha bkb', 'tak – cecha kbk', 'nie wiadomo'].filter(x => x !== c[1]).map(x => [x, 'cong']), max: 4, hints: ['Przystające = identyczne (można je na siebie nałożyć).', 'Cechy: bbb – trzy boki; bkb – dwa boki i kąt MIĘDZY nimi; kbk – bok i dwa kąty PRZY nim.', 'Równe kąty nie wystarczą: trójkąty mogą mieć ten sam kształt, a różną wielkość.'], sol: [c[1] === 'nie wiadomo' ? 'Te dane nie wyznaczają trójkąta jednoznacznie – nie da się stwierdzić przystawania.' : 'Spełniona jest ' + c[1].replace('tak – ', '') + '.'] });
    }
  });

  // ===================== WYRAŻENIA ALGEBRAICZNE I RÓWNANIA (kl. 7) =====================
  def('alg_like', {
    name: 'Redukcja wyrazów podobnych', grade: 7, mainCode: 'alg_like', prereq: ['alg_value'],
    types: { 1: ['input', 'choice'], 2: ['choice'], 3: ['choice'] },
    gen(r, d, type) {
      if (d === 1) { const a = r.int(2, 9), b = r.int(2, 9), c = r.int(1, 9); const v = a + b - c;
        if (type !== 'choice') return { prompt: 'Uprość: ' + a + 'x + ' + b + 'x − ' + c + 'x. Ile wynosi współczynnik przy x?', value: N(v), allowNeg: true, wrong: [{ v: N(a + b + c), code: 'alg_sign' }, { v: N(a * b - c), code: 'concept' }].filter(w => w.v.n !== v), hints: ['Wszystkie wyrazy mają x – są podobne.', 'Dodaj i odejmij same współczynniki: ' + a + ' + ' + b + ' − ' + c + '.', 'Wynik: (…)x.'], sol: [a + ' + ' + b + ' − ' + c + ' = ' + v, 'Wynik: ' + poly([[v, 1]])] };
        return ch(r, { prompt: 'Uprość: ' + a + 'x + ' + b + 'x − ' + c + 'x', correct: poly([[v, 1]]), wrong: [[poly([[a + b + c, 1]]), 'alg_sign'], [poly([[v, 3]]), 'alg_like'], [String(v), 'alg_like']], hints: ['Wszystkie wyrazy mają x.', 'Policz współczynniki: ' + a + ' + ' + b + ' − ' + c + '.', 'Litera zostaje bez zmian.'], sol: [a + ' + ' + b + ' − ' + c + ' = ' + v, poly([[v, 1]])] }); }
      const a = r.int(2, 7), b = r.int(2, 7), c = r.int(1, 6), e = r.int(2, 8), f = r.int(1, 9);
      if (d === 2) { const ca = a - c, cb = b + e; return ch(r, { prompt: 'Uprość: ' + a + 'a + ' + b + 'b − ' + c + 'a + ' + e + 'b', correct: lin2([[ca, 'a'], [cb, 'b']]), wrong: [[String(ca + cb) + 'ab', 'alg_like'], [lin2([[a + c, 'a'], [cb, 'b']]), 'alg_sign'], [lin2([[ca + cb, 'a']]), 'alg_like']], hints: ['Wyrazy z „a" łączymy z „a", z „b" – z „b".', 'Przy a: ' + a + ' − ' + c + ' = ' + ca + '.', 'Przy b: ' + b + ' + ' + e + ' = ' + cb + '.'], sol: ['(' + a + ' − ' + c + ')a + (' + b + ' + ' + e + ')b = ' + lin2([[ca, 'a'], [cb, 'b']])] }); }
      const P = [[a, 2], [b, 1], [-f, 0], [-c, 2], [e, 1]]; const res = [[a - c, 2], [b + e, 1], [-f, 0]];
      return ch(r, { prompt: 'Uprość: ' + a + 'x' + sup(2) + ' + ' + b + 'x − ' + f + ' − ' + c + 'x' + sup(2) + ' + ' + e + 'x', correct: poly(res), wrong: [[poly([[a - c + b + e, 2], [-f, 0]]), 'alg_like'], [poly([[a + c, 2], [b + e, 1], [-f, 0]]), 'alg_sign'], [poly([[a - c, 2], [b + e - f, 1]]), 'alg_like']], hints: ['x² i x to NIE są wyrazy podobne.', 'x²: ' + a + ' − ' + c + ' = ' + (a - c) + '; x: ' + b + ' + ' + e + ' = ' + (b + e) + '.', 'Wyraz wolny (bez x): −' + f + '.'], sol: [poly(res)] });
    },
    why: [{ q: 'Dlaczego 3x + 2 nie równa się 5x?', opts: [{ t: 'Bo 3x i 2 nie są wyrazami podobnymi – np. dla x = 10: 32 ≠ 50', ok: true }, { t: 'Bo trzeba najpierw pomnożyć', code: 'concept' }, { t: 'Równa się 5x', code: 'alg_like' }], expl: 'Wstaw dowolną liczbę za x i sprawdź: 3x + 2 i 5x dają różne wyniki. Łączyć można tylko wyrazy z tą samą literą w tej samej potędze.' }]
  });

  def('alg_mul', {
    name: 'Mnożenie jednomianu przez sumę algebraiczną', grade: 7, mainCode: 'alg_dist', prereq: ['alg_like'],
    types: { 1: ['choice'], 2: ['choice'], 3: ['choice'] },
    gen(r, d) {
      const k = r.int(2, 6), a = r.int(1, 5), b = r.int(1, 9), neg = d >= 2 && r.chance(0.5); const kk = neg ? -k : k;
      if (d < 3) { const res = [[kk * a, 1], [-kk * b, 0]];
        return ch(r, { prompt: 'Opuść nawias: ' + (neg ? '−' : '') + k + '(' + poly([[a, 1], [-b, 0]]) + ')', correct: poly(res), wrong: [[poly([[kk * a, 1], [-b, 0]]), 'alg_dist'], [poly([[kk * a, 1], [kk * b, 0]]), 'alg_sign'], [poly([[-kk * a, 1], [-kk * b, 0]]), 'alg_sign']], hints: ['Pomnóż ' + (neg ? '−' : '') + k + ' przez KAŻDY wyraz w nawiasie.', (neg ? '−' : '') + k + ' · ' + poly([[a, 1]]) + ' = ' + poly([[kk * a, 1]]) + '.', (neg ? '−' : '') + k + ' · (−' + b + ') = ' + mn(-kk * b) + '.'], sol: [poly(res)] }); }
      const c = r.int(2, 5); const res = [[kk * a + c, 1], [-kk * b, 0]];
      return ch(r, { prompt: 'Uprość: ' + (neg ? '−' : '') + k + '(' + poly([[a, 1], [-b, 0]]) + ') + ' + c + 'x', correct: poly(res), wrong: [[poly([[kk * a + c, 1], [-b, 0]]), 'alg_dist'], [poly([[kk * a + c, 1], [kk * b, 0]]), 'alg_sign'], [poly([[kk * (a + c), 1], [-kk * b, 0]]), 'order_ltr']], hints: ['Najpierw opuść nawias.', (neg ? '−' : '') + k + '(' + poly([[a, 1], [-b, 0]]) + ') = ' + poly([[kk * a, 1], [-kk * b, 0]]) + '.', 'Dodaj ' + c + 'x do wyrazu z x.'], sol: [poly([[kk * a, 1], [-kk * b, 0]]) + ' + ' + c + 'x = ' + poly(res)] });
    }
  });

  def('alg_binom', {
    name: 'Mnożenie sum algebraicznych', grade: 7, mainCode: 'alg_binom', prereq: ['alg_mul'],
    types: { 1: ['choice'], 2: ['choice'], 3: ['choice'] },
    gen(r, d) {
      const p = r.int(1, 7) * (d >= 2 && r.chance(0.5) ? -1 : 1), q = r.int(1, 7) * (d >= 2 ? (r.chance(0.5) ? -1 : 1) : 1), a = d === 3 ? r.int(2, 3) : 1;
      const res = [[a, 2], [a * q + p, 1], [p * q, 0]];
      const f1 = poly([[1, 1], [p, 0]]), f2 = poly([[a, 1], [q, 0]]);
      return ch(r, { prompt: 'Pomnóż: (' + f1 + ')(' + f2 + ')', correct: poly(res), wrong: [[poly([[a, 2], [p * q, 0]]), 'alg_binom'], [poly([[a, 2], [a * q + p, 1], [-p * q, 0]]), 'alg_sign'], [poly([[a, 2], [p + q, 1], [p * q, 0]]), 'alg_binom'], [poly([[a + 1, 1], [p + q, 0]]), 'alg_like']], hints: ['Każdy wyraz z pierwszego nawiasu razy każdy z drugiego: 4 iloczyny.', 'x · ' + poly([[a, 1]]) + ' = ' + poly([[a, 2]]) + ', x · ' + mn(q) + ' = ' + poly([[q, 1]]) + ', ' + mn(p) + ' · ' + poly([[a, 1]]) + ' = ' + poly([[a * p, 1]]) + ', ' + mn(p) + ' · ' + mn(q) + ' = ' + mn(p * q) + '.', 'Zredukuj wyrazy z x.'], sol: [poly([[a, 2]]) + ' ' + (q < 0 ? '− ' + poly([[-q, 1]]) : '+ ' + poly([[q, 1]])) + ' ' + (a * p < 0 ? '− ' + poly([[-a * p, 1]]) : '+ ' + poly([[a * p, 1]])) + ' ' + (p * q < 0 ? '− ' + -p * q : '+ ' + p * q), '= ' + poly(res)] });
    }
  });

  def('eq_lin', {
    name: 'Równania z nawiasami i ułamkami', grade: 7, mainCode: 'eq_move', prereq: ['eq_solve', 'alg_mul'], allowNeg: true,
    types: { 1: ['input', 'choice'], 2: ['input', 'choice'], 3: ['input', 'choice'] },
    gen(r, d) {
      const x = r.int(-6, 9) || 4;
      if (d === 1) { const a = r.int(2, 7), c = r.int(1, a - 1 || 1); const b = r.int(-9, 9), e = (a - c) * x + b; if (a === c) return this.gen(r, 2);
        return { prompt: 'Rozwiąż równanie: ' + poly([[a, 1], [b, 0]]) + ' = ' + poly([[c, 1], [e, 0]]), value: N(x), allowNeg: true, wrong: [{ v: F(e + b, a - c), code: 'eq_move' }, { v: F(e - b, a + c), code: 'eq_move' }].filter(w => !U.eq(w.v, N(x))), hints: ['Wyrazy z x przenieś na lewą stronę, liczby – na prawą (zmieniając znak).', poly([[a, 1]]) + ' − ' + poly([[c, 1]]) + ' = ' + mn(e) + ' − ' + pn(b) + '.', poly([[a - c, 1]]) + ' = ' + (e - b) + ' → podziel przez ' + (a - c) + '.'], sol: [poly([[a - c, 1]]) + ' = ' + (e - b), 'x = ' + x] }; }
      if (d === 2) { const k = r.int(2, 5), b = r.int(1, 6), c = r.int(1, k - 1 || 1), e = k * (x - b) - c * x; if (k === c) return this.gen(r, 1);
        return { prompt: 'Rozwiąż równanie: ' + k + '(x − ' + b + ') = ' + poly([[c, 1], [e, 0]]), value: N(x), allowNeg: true, wrong: [{ v: F(e + b, k - c), code: 'alg_dist' }, { v: F(e - k * b, k - c), code: 'eq_move' }].filter(w => !U.eq(w.v, N(x))), hints: ['Opuść nawias: ' + k + '(x − ' + b + ') = ' + poly([[k, 1], [-k * b, 0]]) + '.', 'Przenieś: ' + poly([[k, 1]]) + ' − ' + poly([[c, 1]]) + ' = ' + mn(e) + ' + ' + k * b + '.', poly([[k - c, 1]]) + ' = ' + (e + k * b) + '.'], sol: [poly([[k, 1], [-k * b, 0]]) + ' = ' + poly([[c, 1], [e, 0]]), poly([[k - c, 1]]) + ' = ' + (e + k * b), 'x = ' + x] }; }
      const m = r.pick([2, 3, 4, 5]), xx = m * r.int(-3, 6), b = r.int(1, 8), rhs = xx / m + b;
      return { prompt: 'Rozwiąż równanie: [[x/' + m + ']] + ' + b + ' = ' + mn(rhs), value: N(xx), allowNeg: true, wrong: [{ v: F(rhs - b, m), code: 'eq_inverse' }, { v: N(m * rhs - b), code: 'eq_move' }].filter(w => !U.eq(w.v, N(xx))), hints: ['Najpierw odejmij ' + b + ' od obu stron.', '[[x/' + m + ']] = ' + mn(rhs - b) + '.', 'Pomnóż obie strony przez ' + m + '.'], sol: ['[[x/' + m + ']] = ' + mn(rhs - b), 'x = ' + mn(rhs - b) + ' · ' + m + ' = ' + mn(xx)] };
    }
  });

  def('eq_word', {
    name: 'Zadania tekstowe rozwiązywane równaniami', grade: 7, mainCode: 'read', prereq: ['eq_lin'],
    types: { 1: ['input', 'choice'], 2: ['input', 'choice'], 3: ['input', 'choice'] },
    gen(r, d) {
      if (d === 1) { const x = r.int(5, 40), k = r.pick([3, 4, 5]); const S = k * x + (k * (k - 1)) / 2;
        return { prompt: 'Suma ' + k + ' kolejnych liczb naturalnych wynosi ' + S + '. Jaka jest najmniejsza z nich?', value: N(x), wrong: [{ v: N(S / k), code: 'read' }, { v: N(x + k - 1), code: 'read' }].filter(w => Number.isInteger(w.v.n) && w.v.n !== x), hints: ['Oznacz najmniejszą liczbę jako x. Kolejne: x + 1, x + 2' + (k > 3 ? ', …' : '') + '.', 'Równanie: ' + [...Array(k).keys()].map(i => i ? 'x + ' + i : 'x').join(' + ') + ' = ' + S + '.', k + 'x + ' + k * (k - 1) / 2 + ' = ' + S + '.'], sol: [k + 'x + ' + k * (k - 1) / 2 + ' = ' + S, k + 'x = ' + (S - k * (k - 1) / 2), 'x = ' + x] }; }
      if (d === 2) { const y = r.int(4, 14), k = r.pick([2, 3, 4]), s = y * (k + 1);
        return { prompt: 'Mama jest ' + k + ' razy starsza od Oli. Razem mają ' + s + ' lat. Ile lat ma Ola?', value: N(y), wrong: [{ v: N(s / k), code: 'read' }, { v: N(k * y), code: 'read' }].filter(w => Number.isInteger(w.v.n) && w.v.n !== y), hints: ['Wiek Oli: x. Wiek mamy: ' + k + 'x.', 'Równanie: x + ' + k + 'x = ' + s + '.', (k + 1) + 'x = ' + s + '.'], sol: ['x + ' + k + 'x = ' + s, (k + 1) + 'x = ' + s, 'x = ' + y] }; }
      const w = r.int(3, 12), l = w + r.int(2, 9), P = 2 * (w + l);
      return { prompt: 'Prostokąt ma obwód ' + P + ' cm. Jeden bok jest o ' + (l - w) + ' cm dłuższy od drugiego. Ile centymetrów ma krótszy bok?', value: N(w), unit: 'cm', wrong: [{ v: N((P - (l - w)) / 2), code: 'perim_half' }, { v: N(l), code: 'read' }].filter(w2 => Number.isInteger(w2.v.n) && w2.v.n !== w), hints: ['Krótszy bok: x, dłuższy: x + ' + (l - w) + '.', 'Obwód: 2x + 2(x + ' + (l - w) + ') = ' + P + '.', '4x + ' + 2 * (l - w) + ' = ' + P + '.'], sol: ['4x + ' + 2 * (l - w) + ' = ' + P, '4x = ' + (P - 2 * (l - w)), 'x = ' + w + ' cm'] };
    }
  });

  def('formula', {
    name: 'Przekształcanie wzorów', grade: 7, mainCode: 'formula', prereq: ['eq_lin'],
    types: { 1: ['input', 'choice'], 2: ['choice'], 3: ['choice'] },
    gen(r, d) {
      if (d === 1) { const v = r.int(4, 18) * 5, t = r.int(2, 6); return { prompt: 'Ze wzoru v = [[s/t]] oblicz czas t, jeśli s = ' + v * t + ' km i v = ' + v + ' km/h.', value: N(t), unit: 'h', wrong: [{ v: N(v * t * v), code: 'formula' }, { v: F(v, v * t), code: 'formula' }], hints: ['Pomnóż obie strony przez t: v · t = s.', 'Podziel obie strony przez v: t = [[s/v]].', 't = ' + v * t + ' : ' + v + '.'], sol: ['t = [[s/v]] = ' + v * t + ' : ' + v + ' = ' + t + ' h'] }; }
      const Fm = d === 2 ? r.pick([['P = [[a·h/2]]', 'h', 'h = [[2P/a]]', [['h = [[P/2a]]'], ['h = 2P · a'], ['h = [[a/2P]]']]], ['P = a · b', 'b', 'b = [[P/a]]', [['b = P · a'], ['b = P − a'], ['b = [[a/P]]']]], ['Obw = 2a + 2b', 'b', 'b = [[(Obw − 2a)/2]]', [['b = Obw − 2a'], ['b = [[Obw/2]] − 2a'], ['b = [[(Obw + 2a)/2]]']]], ['V = a · b · c', 'c', 'c = [[V/ab]]', [['c = V − ab'], ['c = V · ab'], ['c = [[ab/V]]']]]])
        : r.pick([['P = [[(a + b)·h/2]]', 'h', 'h = [[2P/(a + b)]]', [['h = [[P/2(a + b)]]'], ['h = 2P − (a + b)'], ['h = [[2P/a]] + b']]], ['P = [[(a + b)·h/2]]', 'a', 'a = [[2P/h]] − b', [['a = [[2P/h]] + b'], ['a = [[P/2h]] − b'], ['a = 2P − h − b']]], ['V = [[1/3]]Pp · H', 'H', 'H = [[3V/Pp]]', [['H = [[V/3Pp]]'], ['H = 3V · Pp'], ['H = [[Pp/3V]]']]], ['s = v · t + 5', 't', 't = [[(s − 5)/v]]', [['t = [[s/v]] − 5'], ['t = [[(s + 5)/v]]'], ['t = (s − 5) · v']]]]);
      return ch(r, { prompt: 'Wyznacz ' + Fm[1] + ' ze wzoru ' + Fm[0] + '.', correct: Fm[2], wrong: Fm[3].map(x => [x[0], 'formula']), hints: ['Traktuj wzór jak równanie z niewiadomą ' + Fm[1] + '.', 'Pozbądź się najpierw dzielenia (pomnóż obie strony), potem dodawania/odejmowania.', 'Na końcu podziel przez to, co mnoży ' + Fm[1] + '.'], sol: [Fm[2]] });
    }
  });

  // ===================== POTĘGI I PIERWIASTKI (kl. 7) =====================
  def('pow_rules', {
    name: 'Działania na potęgach', grade: 7, mainCode: 'pow_add', prereq: ['pow_nat'],
    types: { 1: ['fill', 'input'], 2: ['fill', 'input'], 3: ['fill', 'input'] },
    gen(r, d) {
      const b = r.pick([2, 3, 5, 7, 10, 'a', 'x']); const m = r.int(2, 9), n = r.int(2, 9);
      if (d === 1) { const mul = r.chance(0.5); if (!mul && m <= n) return this.gen(r, 2); const v = mul ? m + n : m - n;
        return { prompt: b + sup(m) + (mul ? ' · ' : ' : ') + b + sup(n) + ' = ' + b + '<sup>□</sup>', fill: true, value: N(v), wrong: [{ v: N(mul ? m * n : Math.round(m / n) === m / n ? m / n : m + n), code: 'pow_add' }, { v: N(mul ? m - n : m + n), code: 'pow_add' }].filter(w => w.v.n !== v && w.v.n > 0), hints: [mul ? 'Mnożąc potęgi o tej samej podstawie, wykładniki dodajemy.' : 'Dzieląc potęgi o tej samej podstawie, wykładniki odejmujemy.', 'Rozpisz w myślach: ' + b + sup(m) + ' to ' + m + ' czynników ' + b + '.', m + (mul ? ' + ' : ' − ') + n + ' = ?'], sol: [b + sup(m) + (mul ? ' · ' : ' : ') + b + sup(n) + ' = ' + b + sup(v)] }; }
      if (d === 2) { const m2 = r.int(2, 5), n2 = r.int(2, 5); return { prompt: '(' + b + sup(m2) + ')' + sup(n2) + ' = ' + b + '<sup>□</sup>', fill: true, value: N(m2 * n2), wrong: [{ v: N(m2 + n2), code: 'pow_add' }, { v: N(Math.pow(m2, n2)), code: 'pow_add' }].filter(w => w.v.n !== m2 * n2), hints: ['Potęgując potęgę, wykładniki mnożymy.', '(' + b + sup(m2) + ')' + sup(n2) + ' = ' + Array(n2).fill(b + sup(m2)).join(' · ') + '.', m2 + ' · ' + n2 + ' = ?'], sol: ['(' + b + sup(m2) + ')' + sup(n2) + ' = ' + b + sup(m2 * n2)] }; }
      const p = r.int(2, 4), q = r.int(2, 3), s = r.int(2, 6), t = r.int(2, 6); const v = p * q + s - t; if (v <= 0) return this.gen(r, 2);
      return { prompt: '(' + b + sup(p) + ')' + sup(q) + ' · ' + b + sup(s) + ' : ' + b + sup(t) + ' = ' + b + '<sup>□</sup>', fill: true, value: N(v), wrong: [{ v: N(p + q + s - t), code: 'pow_add' }, { v: N(p * q * s / t), code: 'pow_add' }].filter(w => Number.isInteger(w.v.n) && w.v.n !== v && w.v.n > 0), hints: ['Najpierw potęga potęgi: (' + b + sup(p) + ')' + sup(q) + ' = ' + b + sup(p * q) + '.', 'Mnożenie: ' + b + sup(p * q) + ' · ' + b + sup(s) + ' = ' + b + sup(p * q + s) + '.', 'Dzielenie: odejmij ' + t + '.'], sol: [b + sup(p * q) + ' · ' + b + sup(s) + ' : ' + b + sup(t) + ' = ' + b + sup(v)] };
    },
    why: [{ q: 'Dlaczego 2³ · 2² = 2⁵, a nie 2⁶?', opts: [{ t: 'Bo to (2·2·2)·(2·2) – razem pięć dwójek', ok: true }, { t: 'Bo wykładniki się mnoży: 3 · 2', code: 'pow_add' }, { t: 'Bo podstawy się dodaje', code: 'concept' }], expl: 'Wykładnik mówi, ile razy podstawa jest czynnikiem. Trzy dwójki i dwie dwójki to razem pięć dwójek.' }]
  });

  def('pow_sci', {
    name: 'Notacja wykładnicza', grade: 7, mainCode: 'sci', prereq: ['pow_rules', 'dec_shift'], allowNeg: true,
    types: { 1: ['fill', 'input'], 2: ['fill', 'input'], 3: ['fill', 'input'] },
    gen(r, d) {
      const m = r.int(11, 99); const ms = String(m)[0] + ',' + String(m)[1];
      if (d === 1) { const e = r.int(3, 8); const n = m * Math.pow(10, e - 1);
        return { prompt: sp(n) + ' = ' + ms + ' · 10<sup>□</sup>', fill: true, value: N(e), wrong: [{ v: N(e - 1), code: 'sci' }, { v: N(e + 1), code: 'sci' }, { v: N(String(n).length), code: 'sci' }].filter(w => w.v.n !== e), hints: ['Przecinek przesuwamy tak, żeby przed nim była jedna cyfra: ' + ms + '.', 'Policz, o ile miejsc przesunął się przecinek w lewo.', 'Liczba ma ' + String(n).length + ' cyfr, więc wykładnik to ' + String(n).length + ' − 1.'], sol: [sp(n) + ' = ' + ms + ' · 10' + sup(e)] }; }
      if (d === 2) { const e = r.int(2, 6); const s = '0,' + '0'.repeat(e - 1) + String(m).replace(/0$/, '');
        return { prompt: s + ' = ' + ms + ' · 10<sup>□</sup>', fill: true, value: N(-e), allowNeg: true, wrong: [{ v: N(e), code: 'sci' }, { v: N(-e + 1), code: 'sci' }, { v: N(-e - 1), code: 'sci' }], hints: ['Liczba jest mniejsza od 1 – wykładnik będzie ujemny.', 'Przesuń przecinek w prawo, aż przed nim będzie jedna cyfra różna od zera.', 'Przesunięcie o ' + e + ' miejsc w prawo → 10' + sup(-e) + '.'], sol: [s + ' = ' + ms + ' · 10' + sup(-e)] }; }
      const a = r.int(2, 4), b = r.int(2, 4), p = r.int(2, 6), q = r.int(2, 6); const prod = a * b, e = p + q + (prod >= 10 ? 1 : 0); const lead = prod >= 10 ? String(prod)[0] + ',' + String(prod)[1] : String(prod);
      return { prompt: '(' + a + ' · 10' + sup(p) + ') · (' + b + ' · 10' + sup(q) + ') = ' + lead.replace(/,0$/, '') + ' · 10<sup>□</sup>', fill: true, value: N(e), wrong: [{ v: N(p * q), code: 'pow_add' }, { v: N(p + q + (prod >= 10 ? 0 : 1)), code: 'sci' }].filter(w => w.v.n !== e), hints: ['Pomnóż osobno liczby: ' + a + ' · ' + b + ' = ' + prod + '.', 'i potęgi: 10' + sup(p) + ' · 10' + sup(q) + ' = 10' + sup(p + q) + '.', prod >= 10 ? prod + ' = ' + lead + ' · 10 – dodaj 1 do wykładnika.' : 'Gotowe – ' + prod + ' jest już między 1 a 10.'], sol: [prod + ' · 10' + sup(p + q) + (prod >= 10 ? ' = ' + lead + ' · 10' + sup(e) : '')] };
    }
  });

  def('root', {
    name: 'Pierwiastki kwadratowe i sześcienne', grade: 7, mainCode: 'root', prereq: ['pow_nat'], allowNeg: true,
    types: { 1: ['input', 'choice'], 2: ['input', 'choice'], 3: ['choice'] },
    gen(r, d) {
      if (d === 1) { const cube = r.chance(0.35); const a = cube ? r.int(2, 6) : r.int(2, 15); const n = cube ? a * a * a : a * a;
        return { prompt: 'Oblicz: ' + (cube ? '<sup>3</sup>√' : '√') + n, value: N(a), wrong: [{ v: F(n, cube ? 3 : 2), code: 'root' }, { v: N(a + 1), code: 'calc' }].filter(w => !U.eq(w.v, N(a))), hints: [cube ? 'Szukasz liczby, która podniesiona do sześcianu da ' + n + '.' : 'Szukasz liczby, która podniesiona do kwadratu da ' + n + '.', 'Sprawdzaj: ' + (a - 1) + (cube ? '³ = ' + Math.pow(a - 1, 3) : '² = ' + (a - 1) * (a - 1)) + ', …', 'Pierwiastek z liczby dodatniej jest dodatni.'], sol: [a + (cube ? '³ = ' : '² = ') + n + ', więc ' + (cube ? '∛' : '√') + n + ' = ' + a] }; }
      if (d === 2) { const k = r.int(0, 2);
        if (k === 0) { const a = r.int(2, 5); return { prompt: 'Oblicz: <sup>3</sup>√(−' + a * a * a + ')', value: N(-a), allowNeg: true, wrong: [{ v: N(a), code: 'sign' }], hints: ['Pierwiastek sześcienny z liczby ujemnej istnieje.', '(−' + a + ')³ = −' + a * a * a + '.', 'Wynik jest ujemny.'], sol: ['(−' + a + ')³ = −' + a * a * a + ', więc ∛(−' + a * a * a + ') = −' + a] }; }
        if (k === 1) { const p = r.int(1, 9), q = r.int(p + 1, 12); if (gcd(p, q) !== 1) return this.gen(r, 1); return { prompt: 'Oblicz: √[[' + p * p + '/' + q * q + ']]', value: F(p, q), form: 'any', wrong: [{ v: F(p * p, q), code: 'root' }, { v: F(p * p, 2 * q * q), code: 'root' }], hints: ['Pierwiastek z ułamka = pierwiastek z licznika przez pierwiastek z mianownika.', '√' + p * p + ' = ' + p + '.', '√' + q * q + ' = ' + q + '.'], sol: ['√[[' + p * p + '/' + q * q + ']] = [[' + p + '/' + q + ']]'] }; }
        const a = r.int(2, 9); return { prompt: 'Oblicz: √0,' + String(a * a).padStart(2, '0'), value: fromDec(a, 1), dec: true, wrong: [{ v: fromDec(a, 2), code: 'root' }, { v: fromDec(a * a, 3), code: 'root' }], hints: ['0,' + String(a * a).padStart(2, '0') + ' = [[' + a * a + '/100]].', '√[[' + a * a + '/100]] = [[' + a + '/10]].', 'Zapisz jako ułamek dziesiętny.'], sol: ['√0,' + String(a * a).padStart(2, '0') + ' = 0,' + a] }; }
      const n = r.int(3, 120); const lo = Math.floor(Math.sqrt(n)); if (lo * lo === n) return this.gen(r, 1);
      return ch(r, { prompt: 'Między którymi kolejnymi liczbami całkowitymi leży √' + n + '?', correct: lo + ' i ' + (lo + 1), wrong: [[(lo - 1) + ' i ' + lo, 'calc'], [(lo + 1) + ' i ' + (lo + 2), 'calc'], [Math.floor(n / 2) + ' i ' + (Math.floor(n / 2) + 1), 'root']], hints: ['Znajdź kwadraty liczb naturalnych najbliższe ' + n + '.', lo + '² = ' + lo * lo + ', ' + (lo + 1) + '² = ' + (lo + 1) * (lo + 1) + '.', lo * lo + ' < ' + n + ' < ' + (lo + 1) * (lo + 1) + '.'], sol: ['√' + lo * lo + ' < √' + n + ' < √' + (lo + 1) * (lo + 1), lo + ' < √' + n + ' < ' + (lo + 1)] });
    }
  });

  def('root_ops', {
    name: 'Działania na pierwiastkach', grade: 7, mainCode: 'root_sum', prereq: ['root'],
    types: { 1: ['input', 'choice'], 2: ['choice'], 3: ['input', 'choice'] },
    gen(r, d) {
      if (d === 1) { const [a, b] = r.pick([[2, 8], [3, 12], [2, 18], [5, 20], [3, 27], [2, 32], [6, 24], [7, 28]]); const v = Math.round(Math.sqrt(a * b));
        return { prompt: 'Oblicz: √' + a + ' · √' + b, value: N(v), wrong: [{ v: N(a * b), code: 'root' }, { v: N(Math.round(Math.sqrt(a + b))), code: 'root_sum' }].filter(w => w.v.n !== v), hints: ['√a · √b = √(a · b).', '√' + a + ' · √' + b + ' = √' + a * b + '.', 'Jaka liczba do kwadratu daje ' + a * b + '?'], sol: ['√' + a + ' · √' + b + ' = √' + a * b + ' = ' + v] }; }
      if (d === 2) { const k = r.int(2, 6), m = r.pick([2, 3, 5]); const n = k * k * m;
        return ch(r, { prompt: 'Wyłącz czynnik przed znak pierwiastka: √' + n, correct: k + '√' + m, wrong: [[m + '√' + k, 'root'], [k * k + '√' + m, 'root'], ...(n % 2 === 0 ? [[(n / 2) + '√2', 'root']] : []), [k + '√' + (m * k), 'root']], hints: ['Rozłóż ' + n + ' na iloczyn, w którym jeden czynnik jest kwadratem: ' + n + ' = ' + k * k + ' · ' + m + '.', '√' + n + ' = √' + k * k + ' · √' + m + '.', '√' + k * k + ' = ' + k + '.'], sol: ['√' + n + ' = √(' + k * k + ' · ' + m + ') = ' + k + '√' + m] }); }
      const [a, b] = r.pick([[3, 4], [6, 8], [5, 12], [8, 15]]); const c = Math.round(Math.sqrt(a * a + b * b));
      return { prompt: 'Oblicz: √(' + a * a + ' + ' + b * b + ')', value: N(c), wrong: [{ v: N(a + b), code: 'root_sum' }, { v: N(a * a + b * b), code: 'root' }], hints: ['Najpierw działanie pod pierwiastkiem.', a * a + ' + ' + b * b + ' = ' + (a * a + b * b) + '.', '√' + (a * a + b * b) + ' = ?'], sol: ['√' + (a * a + b * b) + ' = ' + c, 'Uwaga: √' + a * a + ' + √' + b * b + ' = ' + (a + b) + ' – to inny wynik!'] };
    }
  });

  // ===================== TWIERDZENIE PITAGORASA (kl. 7–8) =====================
  const TRIP = [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [6, 8, 10], [9, 12, 15], [20, 21, 29], [9, 40, 41]];
  function rtSvg(a, b, la, lb, lc) { const sc = 150 / Math.max(a, b), A = a * sc, B = b * sc; const body = '<polygon points="20,' + (20 + B) + ' ' + (20 + A) + ',' + (20 + B) + ' 20,20" class="shape"/><path d="M20 ' + (20 + B - 14) + ' H34 V' + (20 + B) + '" class="arc"/><text x="' + (20 + A / 2) + '" y="' + (38 + B) + '" text-anchor="middle" class="lb">' + la + '</text><text x="6" y="' + (24 + B / 2) + '" text-anchor="end" class="lb">' + lb + '</text><text x="' + (28 + A / 2) + '" y="' + (16 + B / 2) + '" class="lb">' + lc + '</text>';
    return svgW(Math.max(220, A + 80), B + 50, body, 'trójkąt prostokątny', 'width:min(260px,100%)'); }
  def('pyth', {
    name: 'Twierdzenie Pitagorasa', grade: 7, mainCode: 'pyth', prereq: ['root'],
    types: { 1: ['input', 'choice'], 2: ['input', 'choice'], 3: ['input', 'choice'] },
    gen(r, d) {
      const [a, b, c] = r.pick(TRIP);
      if (d === 1) return { prompt: 'Przyprostokątne trójkąta prostokątnego mają ' + a + ' cm i ' + b + ' cm. Oblicz przeciwprostokątną.', visual: rtSvg(b, a, b + ' cm', a + ' cm', 'c'), value: N(c), unit: 'cm', wrong: [{ v: N(a + b), code: 'pyth_nosq' }, { v: N(a * a + b * b), code: 'root' }], hints: ['a² + b² = c².', a + '² + ' + b + '² = ' + a * a + ' + ' + b * b + ' = ' + (a * a + b * b) + '.', 'c = √' + (a * a + b * b) + '.'], sol: [a * a + ' + ' + b * b + ' = ' + c * c, 'c = √' + c * c + ' = ' + c + ' cm'] };
      if (d === 2) return { prompt: 'Przeciwprostokątna ma ' + c + ' cm, a jedna przyprostokątna ' + a + ' cm. Oblicz drugą przyprostokątną.', visual: rtSvg(b, a, 'x', a + ' cm', c + ' cm'), value: N(b), unit: 'cm', wrong: [{ v: N(c - a), code: 'pyth_nosq' }, { v: N(Math.round(Math.sqrt(c * c + a * a) * 100) / 100 === Math.sqrt(c * c + a * a) ? Math.sqrt(c * c + a * a) : c + a), code: 'pyth' }].filter(w => Number.isInteger(w.v.n) && w.v.n !== b), hints: ['Najdłuższy bok (' + c + ') to przeciwprostokątna: x² + ' + a + '² = ' + c + '².', 'x² = ' + c * c + ' − ' + a * a + ' = ' + b * b + '.', 'x = √' + b * b + '.'], sol: ['x² = ' + c * c + ' − ' + a * a + ' = ' + b * b, 'x = ' + b + ' cm'] };
      const k = r.int(1, 3); const [A, B, C] = [a * k, b * k, c * k];
      return { prompt: 'Drabina o długości ' + C + ' dm oparta jest o ścianę. Jej dolny koniec jest ' + A + ' dm od ściany. Na jakiej wysokości drabina dotyka ściany?', value: N(B), unit: 'dm', wrong: [{ v: N(C - A), code: 'pyth_nosq' }, { v: N(C + A), code: 'pyth' }], hints: ['Ściana, ziemia i drabina tworzą trójkąt prostokątny. Drabina to przeciwprostokątna.', 'h² + ' + A + '² = ' + C + '².', 'h² = ' + C * C + ' − ' + A * A + ' = ' + B * B + '.'], sol: ['h² = ' + C * C + ' − ' + A * A + ' = ' + B * B, 'h = ' + B + ' dm'] };
    },
    why: [{ q: 'Który bok jest przeciwprostokątną?', opts: [{ t: 'Najdłuższy bok, leżący naprzeciw kąta prostego', ok: true }, { t: 'Dowolny bok przy kącie prostym', code: 'pyth' }, { t: 'Najkrótszy bok', code: 'pyth' }], expl: 'Przeciwprostokątna leży naprzeciw kąta prostego i jest zawsze najdłuższa. W a² + b² = c² to c.' }]
  });

  def('pyth_special', {
    name: 'Przekątna kwadratu, wysokość trójkąta równobocznego, trójkąty 45–45–90 i 30–60–90', grade: 7, mainCode: 'pyth', prereq: ['pyth', 'root_ops'],
    types: { 1: ['choice'], 2: ['choice'], 3: ['choice'] },
    gen(r, d) {
      const a = r.int(2, 12);
      if (d === 1) return ch(r, { prompt: 'Bok kwadratu ma ' + a + ' cm. Ile wynosi długość jego przekątnej?', correct: a + '√2 cm', wrong: [[2 * a + ' cm', 'pyth_nosq'], [a + '√3 cm', 'pyth'], [a * a + ' cm', 'pyth'], [a * 2 + '√2 cm', 'calc']], hints: ['Przekątna dzieli kwadrat na dwa trójkąty prostokątne.', 'd² = ' + a + '² + ' + a + '² = ' + 2 * a * a + '.', 'Przekątna kwadratu: d = a√2.'], sol: ['d = a√2 = ' + a + '√2 cm'] });
      if (d === 2) { const ev = 2 * r.int(1, 8); return ch(r, { prompt: 'Bok trójkąta równobocznego ma ' + ev + ' cm. Ile wynosi jego wysokość?', correct: (ev / 2 === 1 ? '' : ev / 2) + '√3 cm', wrong: [[ev + '√3 cm', 'pyth'], [(ev / 2 === 1 ? '' : ev / 2) + '√2 cm', 'pyth'], [ev / 2 + ' cm', 'pyth'], [ev + '√2 cm', 'pyth']], hints: ['Wysokość dzieli trójkąt równoboczny na dwa trójkąty 30–60–90.', 'h² = ' + ev + '² − ' + ev / 2 + '².', 'Wzór: h = [[a√3/2]].'], sol: ['h = [[a√3/2]] = [[' + ev + '√3/2]] = ' + (ev / 2 === 1 ? '' : ev / 2) + '√3 cm'] }); }
      const x = r.int(2, 9);
      return ch(r, { prompt: 'W trójkącie prostokątnym o kątach 30°, 60° i 90° krótsza przyprostokątna (naprzeciw kąta 30°) ma ' + x + ' cm. Ile wynosi przeciwprostokątna?', correct: 2 * x + ' cm', wrong: [[x + '√3 cm', 'pyth'], [x + '√2 cm', 'pyth'], [x * 3 + ' cm', 'calc']], hints: ['Trójkąt 30–60–90 to połowa trójkąta równobocznego.', 'Krótsza przyprostokątna to połowa boku tego trójkąta równobocznego.', 'Przeciwprostokątna = bok trójkąta równobocznego = 2 · ' + x + '.'], sol: ['c = 2 · ' + x + ' = ' + 2 * x + ' cm', 'Druga przyprostokątna: ' + x + '√3 cm'] });
    }
  });

  def('coord_seg', {
    name: 'Odcinki w układzie współrzędnych', grade: 8, mainCode: 'pyth', prereq: ['coord', 'pyth'], allowNeg: true,
    types: { 1: ['input', 'choice'], 2: ['input', 'choice'], 3: ['choice'] },
    gen(r, d) {
      if (d === 1) { const [a, b, c] = r.pick(TRIP.slice(0, 1).concat([[6, 8, 10]])); const x1 = r.int(-4, 0), y1 = r.int(-4, 0); const [dx, dy] = r.chance(0.5) ? [a, b] : [b, a]; if (Math.max(dx, dy) > 8) return this.gen(r, 2);
        return { prompt: 'Oblicz długość odcinka AB, gdzie A = ' + pt(x1, y1) + ', B = ' + pt(x1 + dx, y1 + dy) + '.', value: N(c), wrong: [{ v: N(dx + dy), code: 'pyth_nosq' }, { v: N(dx * dx + dy * dy), code: 'root' }], hints: ['Narysuj trójkąt prostokątny: poziomo ' + dx + ', pionowo ' + dy + '.', '|AB|² = ' + dx + '² + ' + dy + '².', '|AB| = √' + (dx * dx + dy * dy) + '.'], sol: ['|AB|² = ' + dx * dx + ' + ' + dy * dy + ' = ' + c * c, '|AB| = ' + c] }; }
      if (d === 2) { const x1 = r.int(-6, 6), y1 = r.int(-6, 6), x2 = x1 + 2 * r.int(-4, 4), y2 = y1 + 2 * r.int(-4, 4); const which = r.pick(['x', 'y']); const v = which === 'x' ? (x1 + x2) / 2 : (y1 + y2) / 2;
        return { prompt: 'Środek odcinka o końcach ' + pt(x1, y1) + ' i ' + pt(x2, y2) + ' ma współrzędne (x, y). Ile wynosi ' + which + '?', value: N(v), allowNeg: true, wrong: [{ v: N(which === 'x' ? (x2 - x1) / 2 : (y2 - y1) / 2), code: 'coord_swap' }, { v: N(which === 'x' ? x1 + x2 : y1 + y2), code: 'concept' }].filter(w => w.v.n !== v), hints: ['Współrzędna środka to średnia współrzędnych końców.', which + ' = (' + mn(which === 'x' ? x1 : y1) + ' + ' + pn(which === 'x' ? x2 : y2) + ') : 2.', 'Policz.'], sol: [which + ' = (' + mn(which === 'x' ? x1 : y1) + ' + ' + pn(which === 'x' ? x2 : y2) + ') : 2 = ' + mn(v)] }; }
      const dx = r.int(1, 4), dy = r.int(1, 4); if (dx === dy && r.chance(0.5)) return this.gen(r, 2); const s = dx * dx + dy * dy; const sq = Math.round(Math.sqrt(s)); const exact = sq * sq === s;
      let lbl = exact ? String(sq) : '√' + s; for (let k = 2; k * k <= s; k++) if (!exact && s % (k * k) === 0) lbl = k + '√' + s / (k * k);
      return ch(r, { prompt: 'Jaką długość ma odcinek o końcach (0, 0) i ' + pt(dx, dy) + '?', correct: lbl, wrong: [[String(dx + dy), 'pyth_nosq'], ['√' + (dx + dy), 'pyth_nosq'], [String(s), 'root']], hints: ['Użyj twierdzenia Pitagorasa.', '|AB|² = ' + dx + '² + ' + dy + '² = ' + s + '.', 'Wyciągnij pierwiastek (jeśli się da, wyłącz czynnik przed pierwiastek).'], sol: ['|AB| = √' + s + (lbl !== '√' + s ? ' = ' + lbl : '')] });
    }
  });

  // ===================== STATYSTYKA I PRAWDOPODOBIEŃSTWO =====================
  def('mean', {
    name: 'Średnia arytmetyczna', grade: 7, mainCode: 'mean', prereq: ['data_read'],
    types: { 1: ['input', 'choice'], 2: ['input', 'choice'], 3: ['input', 'choice'] },
    gen(r, d) {
      const n = r.int(4, 6); let vals = Array.from({ length: n }, () => r.int(2, 6)); const s0 = vals.reduce((a, b) => a + b, 0); vals[0] += (n - s0 % n) % n; const S = vals.reduce((a, b) => a + b, 0); const m = S / n;
      if (d === 1) return { prompt: 'Oceny Kuby z matematyki: ' + vals.join(', ') + '. Oblicz średnią.', value: N(m), wrong: [{ v: N(S), code: 'mean' }, { v: F(S, n - 1), code: 'mean' }].filter(w => !U.eq(w.v, N(m))), hints: ['Dodaj wszystkie oceny.', 'Suma: ' + S + '.', 'Podziel przez liczbę ocen: ' + n + '.'], sol: [vals.join(' + ') + ' = ' + S, S + ' : ' + n + ' = ' + m] };
      if (d === 2) { const target = r.int(3, 5), k = r.int(3, 5); const known = Array.from({ length: k }, () => r.int(2, 6)); const x = target * (k + 1) - known.reduce((a, b) => a + b, 0); if (x < 1 || x > 6) return this.gen(r, 1);
        return { prompt: 'Ola ma oceny ' + known.join(', ') + '. Jaką ocenę musi dostać, żeby średnia wynosiła dokładnie ' + target + '?', value: N(x), wrong: [{ v: N(target), code: 'mean' }, { v: N(target * k - known.reduce((a, b) => a + b, 0)), code: 'mean' }].filter(w => w.v.n !== x), hints: ['Po nowej ocenie będzie ' + (k + 1) + ' ocen.', 'Ich suma musi wynosić ' + target + ' · ' + (k + 1) + ' = ' + target * (k + 1) + '.', 'Odejmij sumę dotychczasowych ocen.'], sol: ['Potrzebna suma: ' + target * (k + 1), 'x = ' + target * (k + 1) + ' − ' + known.reduce((a, b) => a + b, 0) + ' = ' + x] }; }
      const add = r.int(1, 10) + m; return { prompt: 'Średnia ' + n + ' liczb wynosi ' + m + '. Dopisano liczbę ' + add + '. Jaka jest nowa średnia?', value: F(S + add, n + 1), form: 'any', wrong: [{ v: F(m + add, 2), code: 'mean' }, { v: F(S + add, n), code: 'mean' }].filter(w => !U.eq(w.v, F(S + add, n + 1))), hints: ['Suma ' + n + ' liczb = średnia · liczba = ' + m + ' · ' + n + ' = ' + S + '.', 'Nowa suma: ' + S + ' + ' + add + ' = ' + (S + add) + '.', 'Podziel przez ' + (n + 1) + '.'], sol: [S + ' + ' + add + ' = ' + (S + add), (S + add) + ' : ' + (n + 1) + ' = ' + frs(F(S + add, n + 1))] };
    }
  });

  def('median', {
    name: 'Mediana', grade: 8, mainCode: 'median', prereq: ['mean'],
    types: { 1: ['input', 'choice'], 2: ['input', 'choice'], 3: ['input', 'choice'] },
    gen(r, d) {
      const n = d === 1 ? r.pick([5, 7]) : d === 2 ? r.pick([6, 8]) : r.pick([5, 6, 7]); const vals = Array.from({ length: n }, () => r.int(1, 30)); const s = vals.slice().sort((a, b) => a - b);
      const med = n % 2 ? F(s[(n - 1) / 2], 1) : F(s[n / 2 - 1] + s[n / 2], 2);
      const unsorted = n % 2 ? N(vals[(n - 1) / 2]) : F(vals[n / 2 - 1] + vals[n / 2], 2);
      return { prompt: 'Oblicz medianę danych: ' + vals.join(', ') + '.', value: med, form: 'any', dec: true, wrong: [{ v: unsorted, code: 'median' }, { v: F(vals.reduce((a, b) => a + b, 0), n), code: 'mean' }].filter(w => !U.eq(w.v, med)), hints: ['Najpierw uporządkuj dane rosnąco.', 'Uporządkowane: ' + s.join(', ') + '.', n % 2 ? 'Liczba danych nieparzysta – weź środkową (' + ((n + 1) / 2) + '.).' : 'Liczba danych parzysta – policz średnią dwóch środkowych.'], sol: ['Uporządkowane: ' + s.join(', '), n % 2 ? 'Mediana = ' + s[(n - 1) / 2] : 'Mediana = (' + s[n / 2 - 1] + ' + ' + s[n / 2] + ') : 2 = ' + dec(med)] };
    }
  });

  def('prob_basic', {
    name: 'Zdarzenia losowe i prawdopodobieństwo', grade: 7, mainCode: 'prob',
    types: { 1: ['input', 'choice'], 2: ['input', 'choice'], 3: ['input', 'choice'] },
    gen(r, d) {
      if (d === 1) { const E = r.pick([['parzystą liczbę oczek', 3], ['liczbę oczek większą niż 4', 2], ['szóstkę', 1], ['liczbę pierwszą', 3], ['liczbę oczek podzielną przez 3', 2], ['co najmniej 2 oczka', 5]]);
        return { prompt: 'Rzucamy zwykłą kostką do gry. Jakie jest prawdopodobieństwo, że wypadnie ' + E[0] + '? (wpisz ułamek)', value: F(E[1], 6), form: 'any', wrong: [{ v: F(E[1], 5), code: 'prob' }, { v: F(6 - E[1], 6), code: 'prob' }].filter(w => !U.eq(w.v, F(E[1], 6))), hints: ['Wszystkich wyników jest 6.', 'Wypisz wyniki sprzyjające.', 'Jest ich ' + E[1] + '. P = ' + E[1] + '/6.'], sol: ['P = [[' + E[1] + '/6]] = ' + frs(F(E[1], 6))] }; }
      const T = MP.th(); const c = [['czerwonych', r.int(2, 8)], ['niebieskich', r.int(2, 8)], ['zielonych', r.int(1, 6)]]; const tot = c.reduce((a, b) => a + b[1], 0); const k = r.int(0, 2);
      if (d === 2) return { prompt: 'W woreczku jest ' + c.map(x => x[1] + ' ' + x[0]).join(', ') + ' kul. Losujemy jedną. Jakie jest prawdopodobieństwo wylosowania kuli ' + c[k][0].replace(/ych$/, 'ej') + '?', value: F(c[k][1], tot), form: 'any', wrong: [{ v: F(c[k][1], tot - c[k][1]), code: 'prob' }, { v: F(1, 3), code: 'prob' }].filter(w => !U.eq(w.v, F(c[k][1], tot))), hints: ['Wszystkich kul: ' + c.map(x => x[1]).join(' + ') + ' = ' + tot + '.', 'Sprzyjających: ' + c[k][1] + '.', 'P = sprzyjające : wszystkie.'], sol: ['P = [[' + c[k][1] + '/' + tot + ']]' + (gcd(c[k][1], tot) > 1 ? ' = ' + frs(F(c[k][1], tot)) : '')] };
      return { prompt: 'W woreczku jest ' + c.map(x => x[1] + ' ' + x[0]).join(', ') + ' kul. Jakie jest prawdopodobieństwo, że wylosowana kula <b>nie będzie</b> ' + c[k][0].replace(/ych$/, 'a') + '?', value: F(tot - c[k][1], tot), form: 'any', wrong: [{ v: F(c[k][1], tot), code: 'prob' }, { v: F(tot - c[k][1], c[k][1]), code: 'prob' }].filter(w => !U.eq(w.v, F(tot - c[k][1], tot))), hints: ['Wszystkich kul: ' + tot + '.', 'Kul innego koloru: ' + tot + ' − ' + c[k][1] + ' = ' + (tot - c[k][1]) + '.', 'P = ' + (tot - c[k][1]) + '/' + tot + '.'], sol: ['P = [[' + (tot - c[k][1]) + '/' + tot + ']]'] };
    }
  });

  def('combin', {
    name: 'Ile jest możliwości? (kombinatoryka)', grade: 8, mainCode: 'combin',
    types: { 1: ['input', 'choice'], 2: ['input', 'choice'], 3: ['input', 'choice'] },
    gen(r, d) {
      if (d === 1) { const a = r.int(2, 6), b = r.int(2, 5), c = r.chance(0.5) ? r.int(2, 4) : 0; const v = a * b * (c || 1);
        return { prompt: 'Zestaw obiadowy: ' + a + ' zupy do wyboru, ' + b + ' drugie dania' + (c ? ' i ' + c + ' desery' : '') + '. Ile różnych zestawów można ułożyć (po jednym z każdej grupy)?', value: N(v), wrong: [{ v: N(a + b + c), code: 'combin' }, { v: N(a * b), code: 'read' }].filter(w => w.v.n !== v), hints: ['Do każdej zupy można dobrać każde drugie danie.', 'Liczby możliwości w kolejnych wyborach mnożymy.', [a, b, c].filter(Boolean).join(' · ') + ' = ?'], sol: [[a, b, c].filter(Boolean).join(' · ') + ' = ' + v] }; }
      if (d === 2) { const digs = r.pick([[1, 2, 3], [1, 3, 5, 7], [2, 4, 6, 8], [1, 2, 3, 4, 5]]); const rep = r.chance(0.5); const n = digs.length; const v = rep ? n * n : n * (n - 1);
        return { prompt: 'Ile liczb dwucyfrowych można zapisać za pomocą cyfr ' + digs.join(', ') + (rep ? ' (cyfry mogą się powtarzać)?' : ', jeśli cyfry nie mogą się powtarzać?'), value: N(v), wrong: [{ v: N(rep ? n * (n - 1) : n * n), code: 'combin' }, { v: N(2 * n), code: 'combin' }], hints: ['Cyfra dziesiątek: ' + n + ' możliwości.', rep ? 'Cyfra jedności: znowu ' + n + ' możliwości.' : 'Cyfra jedności: o jedną mniej, bo nie może się powtórzyć.', n + ' · ' + (rep ? n : n - 1) + ' = ?'], sol: [n + ' · ' + (rep ? n : n - 1) + ' = ' + v] }; }
      const n = r.int(4, 10); const v = n * (n - 1) / 2;
      return { prompt: 'W turnieju szachowym gra ' + n + ' zawodników. Każdy gra z każdym dokładnie jeden mecz. Ile meczów zostanie rozegranych?', value: N(v), wrong: [{ v: N(n * (n - 1)), code: 'combin' }, { v: N(n * n), code: 'combin' }], hints: ['Każdy zawodnik gra z ' + (n - 1) + ' innymi.', n + ' · ' + (n - 1) + ' = ' + n * (n - 1) + ' – ale każdy mecz policzyliśmy dwa razy (A z B i B z A).', 'Podziel przez 2.'], sol: [n + ' · ' + (n - 1) + ' : 2 = ' + v] };
    }
  });

  def('prob', {
    name: 'Obliczanie prawdopodobieństw (dwa doświadczenia)', grade: 8, mainCode: 'prob', prereq: ['prob_basic', 'combin'],
    types: { 1: ['input', 'choice'], 2: ['input', 'choice'], 3: ['input', 'choice'] },
    gen(r, d) {
      if (d === 1) { const n = r.pick([20, 30, 40, 50]), k = r.pick([3, 4, 5, 6]); const c = Math.floor(n / k);
        return { prompt: 'Z liczb od 1 do ' + n + ' losujemy jedną. Jakie jest prawdopodobieństwo, że będzie podzielna przez ' + k + '?', value: F(c, n), form: 'any', wrong: [{ v: F(1, k + 1), code: 'prob' }, { v: F(c + 1, n), code: 'calc' }].filter(w => !U.eq(w.v, F(c, n))), hints: ['Wszystkich liczb: ' + n + '.', 'Podzielne przez ' + k + ': ' + k + ', ' + 2 * k + ', …, ' + c * k + '.', 'Jest ich ' + n + ' : ' + k + ' = ' + c + ' (pełnych).'], sol: ['P = [[' + c + '/' + n + ']] = ' + frs(F(c, n))] }; }
      if (d === 2) { const s = r.int(3, 11); let f = 0; for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) if (a + b === s) f++;
        return { prompt: 'Rzucamy dwa razy kostką. Jakie jest prawdopodobieństwo, że suma oczek wyniesie ' + s + '?', value: F(f, 36), form: 'any', wrong: [{ v: F(1, 11), code: 'prob' }, { v: F(f, 12), code: 'prob' }, { v: F(Math.ceil(f / 2), 36), code: 'combin' }].filter(w => !U.eq(w.v, F(f, 36))), hints: ['Wszystkich wyników jest 6 · 6 = 36 (pary: pierwszy rzut, drugi rzut).', 'Wypisz pary o sumie ' + s + ', np. (' + Math.max(1, s - 6) + ', ' + (s - Math.max(1, s - 6)) + ').', 'Pary (1, 2) i (2, 1) to dwa różne wyniki.'], sol: ['Sprzyjających: ' + f, 'P = [[' + f + '/36]]' + (gcd(f, 36) > 1 ? ' = ' + frs(F(f, 36)) : '')] }; }
      const n = r.int(2, 3);
      return { prompt: 'Rzucamy ' + n + ' razy monetą. Jakie jest prawdopodobieństwo, że za każdym razem wypadnie orzeł?', value: F(1, Math.pow(2, n)), form: 'any', wrong: [{ v: F(1, 2 * n), code: 'combin' }, { v: F(1, 2), code: 'prob' }, { v: F(n, Math.pow(2, n)), code: 'prob' }].filter(w => !U.eq(w.v, F(1, Math.pow(2, n)))), hints: ['Każdy rzut ma 2 wyniki.', 'Wszystkich wyników: ' + Array(n).fill(2).join(' · ') + ' = ' + Math.pow(2, n) + '.', 'Sprzyjający jest tylko jeden: ' + Array(n).fill('O').join('') + '.'], sol: ['P = [[1/' + Math.pow(2, n) + ']]'] };
    }
  });

  def('graph_read', {
    name: 'Odczytywanie wykresów', grade: 8, mainCode: 'read', prereq: ['coord'],
    types: { 1: ['input', 'choice'], 2: ['input', 'choice'], 3: ['input', 'choice'] },
    gen(r, d) {
      const hrs = [6, 8, 10, 12, 14, 16, 18]; const T = hrs.map(() => r.int(-1, 12) * 2); const W = 320, H = 200, x = (i) => 40 + i * 44, y = (v) => 170 - (v + 4) * 5;
      let s = ''; for (let v = -4; v <= 26; v += 2) s += '<line x1="40" y1="' + y(v) + '" x2="' + x(6) + '" y2="' + y(v) + '" class="grid"/>' + (v % 4 === 0 ? '<text x="34" y="' + (y(v) + 4) + '" text-anchor="end" class="ax">' + mn(v) + '</text>' : '');
      hrs.forEach((h, i) => { s += '<text x="' + x(i) + '" y="190" text-anchor="middle" class="ax">' + h + ':00</text>'; });
      s += '<polyline points="' + T.map((v, i) => x(i) + ',' + y(v)).join(' ') + '" style="fill:none;stroke:var(--pen);stroke-width:3"/>'; T.forEach((v, i) => { s += '<circle cx="' + x(i) + '" cy="' + y(v) + '" r="4" class="barc"/>'; });
      const vis = svgW(W, H, s, 'wykres temperatury', 'width:min(340px,100%)'); const i = r.int(0, 6);
      if (d === 1) return { prompt: 'Wykres pokazuje temperaturę (°C) w ciągu dnia. Jaka była temperatura o godzinie ' + hrs[i] + ':00?', visual: vis, value: N(T[i]), allowNeg: true, wrong: [{ v: N(T[i] + 2), code: 'read' }, { v: N(T[(i + 1) % 7]), code: 'read' }].filter(w => w.v.n !== T[i]), hints: ['Znajdź godzinę ' + hrs[i] + ':00 na osi poziomej.', 'Idź w górę do punktu wykresu.', 'Odczytaj wartość na osi pionowej (linie co 2°).'], sol: ['O ' + hrs[i] + ':00 było ' + mn(T[i]) + '°C.'] };
      const mx = Math.max(...T), mi = Math.min(...T);
      if (d === 2) return { prompt: 'Wykres pokazuje temperaturę (°C) w ciągu dnia. O ile stopni najwyższa temperatura była wyższa od najniższej?', visual: vis, value: N(mx - mi), wrong: [{ v: N(mx), code: 'read' }, { v: N(mx + mi), code: 'int_sub_neg' }].filter(w => w.v.n !== mx - mi), hints: ['Najwyższy punkt wykresu: ' + mn(mx) + '°C.', 'Najniższy: ' + mn(mi) + '°C.', mn(mx) + ' − ' + pn(mi) + ' = ?'], sol: [mn(mx) + ' − ' + pn(mi) + ' = ' + (mx - mi)] };
      let bi = 0, bd = -99; for (let k = 0; k < 6; k++) if (T[k + 1] - T[k] > bd) { bd = T[k + 1] - T[k]; bi = k; } if (T.slice(0, 6).filter((_, k) => T[k + 1] - T[k] === bd).length > 1 || bd <= 0) return this.gen(r, 2);
      return ch(r, { prompt: 'Wykres pokazuje temperaturę (°C) w ciągu dnia. W którym przedziale czasu temperatura wzrosła najbardziej?', visual: vis, correct: hrs[bi] + ':00–' + hrs[bi + 1] + ':00', wrong: [0, 1, 2, 3, 4, 5].filter(k => k !== bi).map(k => [hrs[k] + ':00–' + hrs[k + 1] + ':00', 'read']), hints: ['Szukaj najbardziej stromego odcinka idącego w górę.', 'Policz różnice temperatur między sąsiednimi godzinami.', 'Największy wzrost: ' + bd + ' stopni.'], sol: ['Od ' + hrs[bi] + ':00 do ' + hrs[bi + 1] + ':00 wzrost o ' + bd + '°C.'] });
    }
  });

  // ===================== PROPORCJONALNOŚĆ (kl. 8) =====================
  def('proportion', {
    name: 'Proporcje', grade: 8, mainCode: 'prop', prereq: ['eq_solve'],
    types: { 1: ['input', 'choice'], 2: ['input', 'choice'], 3: ['input', 'choice'] },
    gen(r, d) {
      const a = r.int(2, 9), b = r.int(2, 9), k = r.int(2, 6); const c = a * k, x = b * k;
      if (d < 3) { const form = d === 1 ? a + ' : ' + b + ' = ' + c + ' : x' : '[[' + a + '/' + b + ']] = [[' + c + '/x]]';
        return { prompt: 'Rozwiąż proporcję: ' + form, value: N(x), wrong: [{ v: F(a * c, b), code: 'prop' }, { v: N(c + b - a), code: 'prop' }].filter(w => !U.eq(w.v, N(x)) && U.val(w.v) > 0), hints: ['Iloczyn wyrazów skrajnych = iloczyn wyrazów środkowych.', a + ' · x = ' + b + ' · ' + c + '.', 'x = ' + b * c + ' : ' + a + '.'], sol: [a + 'x = ' + b * c, 'x = ' + x] }; }
      const m = r.int(2, 5) * 100, sugar = r.int(1, 4) * 50, nm = m * r.pick([2, 3]) / 2; const xs = sugar * nm / m;
      return { prompt: 'Na ciasto z ' + m + ' g mąki potrzeba ' + sugar + ' g cukru. Ile gramów cukru potrzeba na ' + nm + ' g mąki (przy tych samych proporcjach)?', value: F(sugar * nm, m), form: 'any', dec: true, unit: 'g', wrong: [{ v: N(sugar + nm - m), code: 'prop' }, { v: F(m * nm, sugar), code: 'prop' }].filter(w => !U.eq(w.v, F(sugar * nm, m))), hints: ['Ułóż proporcję: ' + m + ' : ' + sugar + ' = ' + nm + ' : x.', m + ' · x = ' + sugar + ' · ' + nm + '.', 'x = ' + sugar * nm + ' : ' + m + '.'], sol: [m + 'x = ' + sugar * nm, 'x = ' + dec(F(sugar * nm, m)) + ' g'] };
    }
  });

  def('direct_prop', {
    name: 'Wielkości wprost proporcjonalne', grade: 8, mainCode: 'prop', prereq: ['proportion'],
    types: { 1: ['input', 'choice'], 2: ['input', 'choice'], 3: ['choice'] },
    gen(r, d) {
      if (d < 3) { const price = d === 1 ? r.int(2, 9) : r.pick([150, 250, 350, 450]); const a = r.int(2, 6), b = r.int(7, 12); const pa = price * a;
        const unit = d === 1 ? 'zł' : 'gr'; return { prompt: a + ' kg jabłek kosztuje ' + (d === 1 ? pa + ' zł' : U.money(pa) + ' zł') + '. Ile kosztuje ' + b + ' kg' + (d === 1 ? '? (w zł)' : '? (podaj w złotych)'), value: d === 1 ? N(price * b) : fromDec(price * b, 2), dec: d !== 1, unit: 'zł', wrong: [{ v: d === 1 ? N(pa + b - a) : fromDec(pa + (b - a) * 100, 2), code: 'prop' }, { v: d === 1 ? N(pa * b) : fromDec(pa * b, 2), code: 'prop' }].filter(w => !U.eq(w.v, d === 1 ? N(price * b) : fromDec(price * b, 2))), hints: ['Cena jest wprost proporcjonalna do masy: ile razy więcej kg, tyle razy więcej złotych.', '1 kg kosztuje ' + (d === 1 ? pa + ' : ' + a + ' = ' + price + ' zł' : U.money(pa) + ' : ' + a + ' = ' + U.money(price) + ' zł') + '.', 'Pomnóż przez ' + b + '.'], sol: ['1 kg: ' + U.money(price * (d === 1 ? 100 : 1)) + ' zł', b + ' kg: ' + (d === 1 ? price * b : U.money(price * b)) + ' zł'] }; }
      const k = r.int(2, 5); const xs = [1, 2, 3, 4].map(x => x * r.int(1, 2)); const good = r.chance(0.5); const ys = xs.map((x, i) => k * x + (good ? 0 : (i === 2 ? 1 : 0)));
      return ch(r, { prompt: 'Czy wielkości x i y są wprost proporcjonalne? x: ' + xs.join(', ') + '; y: ' + ys.join(', ') + '.', correct: good ? 'tak' : 'nie', wrong: [[good ? 'nie' : 'tak', 'prop']], keepOrder: true, hints: ['Wielkości są wprost proporcjonalne, gdy iloraz y : x jest zawsze taki sam.', 'Policz y : x dla każdej pary.', 'Ilorazy: ' + xs.map((x, i) => frs(F(ys[i], x))).join(', ') + '.'], sol: [good ? 'Iloraz zawsze równy ' + k + ' – tak.' : 'Ilorazy są różne – nie.'] });
    }
  });

  def('prop_div', {
    name: 'Podział proporcjonalny', grade: 8, mainCode: 'ratio', prereq: ['proportion'],
    types: { 1: ['input', 'choice'], 2: ['input', 'choice'], 3: ['input', 'choice'] },
    gen(r, d) {
      const p = r.int(1, 5), q = r.int(p + 1, 7), parts = d === 3 ? [p, q, r.int(1, 4)] : [p, q]; const sum = parts.reduce((a, b) => a + b, 0); const u = r.int(3, 20) * (d === 1 ? 1 : 5); const tot = u * sum;
      const ask = d === 3 ? 2 : 1; const v = u * parts[ask];
      return { prompt: (d === 3 ? 'Troje rodzeństwa podzieliło ' + tot + ' zł w stosunku ' + parts.join(' : ') + '. Ile złotych dostało trzecie z nich?' : 'Podziel ' + tot + ' w stosunku ' + p + ' : ' + q + '. Ile wynosi większa część?'), value: N(v), wrong: [{ v: F(tot * parts[ask], sum + 1), code: 'ratio' }, { v: F(tot, parts.length), code: 'ratio' }, { v: N(tot - u * parts[0]), code: 'read' }].filter(w => !U.eq(w.v, N(v))), hints: ['Wszystkich części: ' + parts.join(' + ') + ' = ' + sum + '.', 'Jedna część: ' + tot + ' : ' + sum + ' = ' + u + '.', 'Szukana: ' + parts[ask] + ' · ' + u + '.'], sol: [tot + ' : ' + sum + ' = ' + u, parts[ask] + ' · ' + u + ' = ' + v] };
    }
  });

  // ===================== GRANIASTOSŁUPY I OSTROSŁUPY (kl. 8) =====================
  def('prism_vol', {
    name: 'Objętość graniastosłupa', grade: 8, mainCode: 'vol_base', prereq: ['vol_box', 'area_tri', 'area_trap'],
    types: { 1: ['input', 'choice'], 2: ['input', 'choice'], 3: ['input', 'choice'] },
    gen(r, d) {
      const H = r.int(3, 15);
      if (d === 1) { const Pp = r.int(6, 40); return { prompt: 'Pole podstawy graniastosłupa wynosi ' + Pp + ' cm², a jego wysokość ' + H + ' cm. Oblicz objętość.', value: N(Pp * H), unit: 'cm³', wrong: [{ v: N(Pp + H), code: 'vol_base' }, { v: F(Pp * H, 3), code: 'vol_pyr' }].filter(w => !U.eq(w.v, N(Pp * H))), hints: ['V = Pp · H.', Pp + ' · ' + H + ' = ?', 'Jednostka: cm³.'], sol: ['V = ' + Pp + ' · ' + H + ' = ' + Pp * H + ' cm³'] }; }
      if (d === 2) { const a = r.int(3, 10), b = 2 * r.int(2, 6); return { prompt: 'Podstawą graniastosłupa prostego jest trójkąt prostokątny o przyprostokątnych ' + a + ' cm i ' + b + ' cm. Wysokość graniastosłupa: ' + H + ' cm. Oblicz objętość.', value: N(a * b / 2 * H), unit: 'cm³', wrong: [{ v: N(a * b * H), code: 'tri_no_half' }, { v: N((a + b) * H), code: 'vol_base' }], hints: ['Najpierw pole podstawy – trójkąta: a · b : 2.', 'Pp = ' + a + ' · ' + b + ' : 2 = ' + a * b / 2 + ' cm².', 'V = Pp · H = ' + a * b / 2 + ' · ' + H + '.'], sol: ['Pp = ' + a * b / 2 + ' cm²', 'V = ' + a * b / 2 + ' · ' + H + ' = ' + a * b / 2 * H + ' cm³'] }; }
      const a = r.int(6, 12), b = r.int(2, a - 2), h = 2 * r.int(1, 4); const Pp = (a + b) * h / 2;
      return { prompt: 'Podstawą graniastosłupa prostego jest trapez o podstawach ' + a + ' cm i ' + b + ' cm oraz wysokości ' + h + ' cm. Wysokość bryły: ' + H + ' cm. Oblicz objętość.', value: N(Pp * H), unit: 'cm³', wrong: [{ v: N((a + b) * h * H), code: 'trap_formula' }, { v: N(Pp * h), code: 'vol_base' }].filter(w => w.v.n !== Pp * H), hints: ['Pole trapezu: (a + b) · h : 2.', 'Pp = (' + a + ' + ' + b + ') · ' + h + ' : 2 = ' + Pp + ' cm².', 'V = ' + Pp + ' · ' + H + '.'], sol: ['Pp = ' + Pp + ' cm²', 'V = ' + Pp * H + ' cm³'] };
    }
  });

  def('prism_surf', {
    name: 'Pole powierzchni graniastosłupa', grade: 8, mainCode: 'surf_faces', prereq: ['surf_box', 'pyth'],
    types: { 1: ['input', 'choice'], 2: ['input', 'choice'], 3: ['input', 'choice'] },
    gen(r, d) {
      const H = r.int(4, 12);
      if (d === 1) { const a = r.int(2, 9); return { prompt: 'Graniastosłup prawidłowy czworokątny ma krawędź podstawy ' + a + ' cm i wysokość ' + H + ' cm. Oblicz pole powierzchni całkowitej.', value: N(2 * a * a + 4 * a * H), unit: 'cm²', wrong: [{ v: N(a * a + 4 * a * H), code: 'surf_half' }, { v: N(4 * a * H), code: 'surf_faces' }, { v: N(a * a * H), code: 'vol_surf' }], hints: ['Podstawy: 2 kwadraty ' + a + ' × ' + a + '.', 'Ściany boczne: 4 prostokąty ' + a + ' × ' + H + '.', '2 · ' + a * a + ' + 4 · ' + a * H + ' = ?'], sol: ['2 · ' + a * a + ' + 4 · ' + a * H + ' = ' + (2 * a * a + 4 * a * H) + ' cm²'] }; }
      const [p, q, c] = r.pick(TRIP.slice(0, 2).concat([[6, 8, 10]]));
      const Pb = (p + q + c) * H, Pp = p * q / 2;
      if (d === 2) return { prompt: 'Podstawą graniastosłupa prostego jest trójkąt prostokątny o bokach ' + p + ', ' + q + ' i ' + c + ' cm. Wysokość bryły: ' + H + ' cm. Oblicz pole powierzchni bocznej.', value: N(Pb), unit: 'cm²', wrong: [{ v: N((p + q) * H), code: 'surf_faces' }, { v: N(Pb + 2 * Pp), code: 'read' }], hints: ['Powierzchnia boczna to 3 prostokąty – każdy ma wysokość ' + H + ' cm.', 'Pb = (obwód podstawy) · H.', '(' + p + ' + ' + q + ' + ' + c + ') · ' + H + ' = ?'], sol: ['Pb = ' + (p + q + c) + ' · ' + H + ' = ' + Pb + ' cm²'] };
      return { prompt: 'Podstawą graniastosłupa prostego jest trójkąt prostokątny o przyprostokątnych ' + p + ' cm i ' + q + ' cm. Wysokość bryły: ' + H + ' cm. Oblicz pole powierzchni całkowitej.', value: N(Pb + 2 * Pp), unit: 'cm²', wrong: [{ v: N((p + q) * H + 2 * Pp), code: 'pyth' }, { v: N(Pb + Pp), code: 'surf_half' }, { v: N(Pb + 4 * Pp), code: 'tri_no_half' }], hints: ['Przeciwprostokątna z Pitagorasa: √(' + p + '² + ' + q + '²) = ' + c + ' cm.', 'Pb = (' + p + ' + ' + q + ' + ' + c + ') · ' + H + ' = ' + Pb + ' cm².', '2 podstawy: 2 · ' + p + ' · ' + q + ' : 2 = ' + 2 * Pp + ' cm².'], sol: ['c = ' + c + ' cm', 'Pc = ' + Pb + ' + ' + 2 * Pp + ' = ' + (Pb + 2 * Pp) + ' cm²'] };
    }
  });

  def('pyr_vol', {
    name: 'Objętość ostrosłupa', grade: 8, mainCode: 'vol_pyr', prereq: ['prism_vol'],
    types: { 1: ['input', 'choice'], 2: ['input', 'choice'], 3: ['input', 'choice'] },
    gen(r, d) {
      if (d === 1) { const Pp = 3 * r.int(2, 15), H = r.int(2, 12); return { prompt: 'Pole podstawy ostrosłupa wynosi ' + Pp + ' cm², a wysokość ' + H + ' cm. Oblicz objętość.', value: N(Pp * H / 3), unit: 'cm³', wrong: [{ v: N(Pp * H), code: 'vol_pyr' }, { v: F(Pp * H, 2), code: 'vol_pyr' }], hints: ['V = ⅓ · Pp · H.', Pp + ' · ' + H + ' = ' + Pp * H + '.', 'Podziel przez 3.'], sol: ['V = ⅓ · ' + Pp + ' · ' + H + ' = ' + Pp * H / 3 + ' cm³'] }; }
      const a = r.int(2, 10), H = d === 2 ? 3 * r.int(1, 5) : null;
      if (d === 2) return { prompt: 'Ostrosłup prawidłowy czworokątny ma krawędź podstawy ' + a + ' cm i wysokość ' + H + ' cm. Oblicz objętość.', value: N(a * a * H / 3), unit: 'cm³', wrong: [{ v: N(a * a * H), code: 'vol_pyr' }, { v: N(a * H), code: 'vol_base' }].filter(w => w.v.n !== a * a * H / 3), hints: ['Podstawa to kwadrat: Pp = ' + a + '² = ' + a * a + ' cm².', 'V = ⅓ · ' + a * a + ' · ' + H + '.', a * a * H + ' : 3 = ?'], sol: ['Pp = ' + a * a, 'V = ' + a * a * H / 3 + ' cm³'] };
      const [h0, half, sl] = r.pick([[4, 3, 5], [12, 5, 13], [8, 6, 10], [15, 8, 17]]); const A = 2 * half;
      return { prompt: 'Ostrosłup prawidłowy czworokątny ma krawędź podstawy ' + A + ' cm, a wysokość ściany bocznej (opuszczona na krawędź podstawy) wynosi ' + sl + ' cm. Oblicz objętość ostrosłupa.', value: F(A * A * h0, 3), form: 'any', dec: true, unit: 'cm³', wrong: [{ v: F(A * A * sl, 3), code: 'slant' }, { v: N(A * A * h0), code: 'vol_pyr' }].filter(w => !U.eq(w.v, F(A * A * h0, 3))), hints: ['Wysokość bryły H, połowa krawędzi podstawy i wysokość ściany tworzą trójkąt prostokątny.', 'H² + ' + half + '² = ' + sl + '² → H = ' + h0 + ' cm.', 'V = ⅓ · ' + A * A + ' · ' + h0 + '.'], sol: ['H = √(' + sl * sl + ' − ' + half * half + ') = ' + h0 + ' cm', 'V = ⅓ · ' + A * A + ' · ' + h0 + ' = ' + frs(F(A * A * h0, 3)) + ' cm³'] };
    }
  });

  def('pyr_surf', {
    name: 'Pole powierzchni ostrosłupa', grade: 8, mainCode: 'slant', prereq: ['pyr_vol', 'pyth'],
    types: { 1: ['input', 'choice'], 2: ['input', 'choice'], 3: ['input', 'choice'] },
    gen(r, d) {
      if (d < 3) { const a = r.int(2, 10), h = r.int(3, 12); const Pb = 4 * a * h / 2; const Pc = a * a + Pb;
        return { prompt: 'Ostrosłup prawidłowy czworokątny: krawędź podstawy ' + a + ' cm, wysokość ściany bocznej ' + h + ' cm. Oblicz pole powierzchni ' + (d === 1 ? 'bocznej.' : 'całkowitej.'), value: N(d === 1 ? Pb : Pc), unit: 'cm²', wrong: [{ v: N(4 * a * h), code: 'tri_no_half' }, { v: N(d === 1 ? Pc : Pb), code: 'read' }, { v: N(a * a + a * h), code: 'surf_faces' }].filter(w => w.v.n !== (d === 1 ? Pb : Pc)), hints: ['Ściana boczna to trójkąt: ' + a + ' · ' + h + ' : 2 = ' + a * h / 2 + ' cm².', 'Ścian bocznych są 4: Pb = ' + Pb + ' cm².', d === 1 ? 'To już pole boczne.' : 'Dodaj podstawę: ' + a + '² = ' + a * a + '.'], sol: ['Pb = 4 · ' + a * h / 2 + ' = ' + Pb + ' cm²'].concat(d === 1 ? [] : ['Pc = ' + a * a + ' + ' + Pb + ' = ' + Pc + ' cm²']) }; }
      const [H, half, sl] = r.pick([[4, 3, 5], [12, 5, 13], [8, 6, 10], [15, 8, 17]]); const A = 2 * half; const Pc = A * A + 2 * A * sl;
      return { prompt: 'Ostrosłup prawidłowy czworokątny ma krawędź podstawy ' + A + ' cm i wysokość (bryły) ' + H + ' cm. Oblicz pole powierzchni całkowitej.', value: N(Pc), unit: 'cm²', wrong: [{ v: N(A * A + 2 * A * H), code: 'slant' }, { v: N(2 * A * sl), code: 'read' }, { v: N(A * A + 4 * A * sl), code: 'tri_no_half' }], hints: ['Potrzebna jest wysokość ŚCIANY h, nie bryły.', 'h² = ' + H + '² + ' + half + '² → h = ' + sl + ' cm.', 'Pc = ' + A + '² + 4 · ' + A + ' · ' + sl + ' : 2.'], sol: ['h = √(' + H * H + ' + ' + half * half + ') = ' + sl, 'Pc = ' + A * A + ' + ' + 2 * A * sl + ' = ' + Pc + ' cm²'] };
    }
  });

  // ===================== SYMETRIE (kl. 8) =====================
  def('sym_line', {
    name: 'Symetria względem prostej', grade: 8, mainCode: 'sym', prereq: ['coord', 'symmetry'],
    types: { 1: ['choice'], 2: ['choice'], 3: ['input', 'choice'] },
    gen(r, d) {
      let x = r.int(-5, 5) || 2, y = r.int(-5, 5) || -3; if (Math.abs(x) === Math.abs(y)) y = y > 0 ? y - 1 || 2 : y + 1 || -2;
      if (d < 3) { const ax = r.pick(['osi x', 'osi y']); const c = ax === 'osi x' ? [x, -y] : [-x, y];
        return ch(r, { prompt: 'Punkt A = ' + pt(x, y) + '. Jakie współrzędne ma punkt A\' symetryczny do A względem ' + ax + '?', visual: d === 1 ? gridSvg([[x, y]], ['A'], 6) : undefined, correct: pt(c[0], c[1]), wrong: [[pt(ax === 'osi x' ? -x : x, ax === 'osi x' ? y : -y), 'sym'], [pt(-x, -y), 'sym'], [pt(y, x), 'coord_swap']], hints: ['Symetria względem ' + ax + ' to „odbicie lustrzane" w tej osi.', ax === 'osi x' ? 'x zostaje, y zmienia znak.' : 'y zostaje, x zmienia znak.', 'A\' = ' + pt(c[0], c[1]) + '.'], sol: ['A\' = ' + pt(c[0], c[1])] }); }
      const k = r.int(-3, 3); const yy = 2 * k - y;
      return { prompt: 'Punkt A = ' + pt(x, y) + ' odbito symetrycznie względem prostej y = ' + mn(k) + '. Ile wynosi druga współrzędna (y) obrazu?', value: N(yy), allowNeg: true, wrong: [{ v: N(-y), code: 'sym' }, { v: N(y + k), code: 'sym' }].filter(w => w.v.n !== yy), hints: ['Prosta y = ' + mn(k) + ' jest pozioma; x się nie zmienia.', 'Odległość A od prostej: |' + mn(y) + ' − ' + pn(k) + '| = ' + Math.abs(y - k) + '.', 'Obraz leży tyle samo po drugiej stronie: y = ' + mn(k) + (y > k ? ' − ' : ' + ') + Math.abs(y - k) + '.'], sol: ['y\' = 2 · ' + pn(k) + ' − ' + pn(y) + ' = ' + mn(yy)] };
    }
  });

  def('sym_point', {
    name: 'Symetria względem punktu', grade: 8, mainCode: 'sym', prereq: ['sym_line'],
    types: { 1: ['choice'], 2: ['choice'], 3: ['choice'] },
    gen(r, d) {
      const x = r.int(-5, 5) || 3, y = r.int(-5, 5) || -2;
      if (d === 1) return ch(r, { prompt: 'Jakie współrzędne ma punkt symetryczny do ' + pt(x, y) + ' względem początku układu współrzędnych (0, 0)?', correct: pt(-x, -y), wrong: [[pt(x, -y), 'sym'], [pt(-x, y), 'sym'], [pt(-y, -x), 'coord_swap']], hints: ['Symetria środkowa względem (0, 0) to obrót o 180°.', 'Obie współrzędne zmieniają znak.', pt(x, y) + ' → ' + pt(-x, -y) + '.'], sol: [pt(-x, -y)] });
      if (d === 2) { const F2 = r.pick([['odcinek', 'tak'], ['kwadrat', 'tak'], ['trójkąt równoboczny', 'nie'], ['równoległobok', 'tak'], ['trapez równoramienny', 'nie'], ['okrąg', 'tak'], ['pięciokąt foremny', 'nie'], ['sześciokąt foremny', 'tak']]);
        return ch(r, { prompt: 'Czy ' + F2[0] + ' ma środek symetrii?', correct: F2[1], wrong: [[F2[1] === 'tak' ? 'nie' : 'tak', 'sym']], keepOrder: true, hints: ['Środek symetrii: po obrocie figury o 180° wokół tego punktu figura pokrywa się sama ze sobą.', 'Sprawdź, czy każdy punkt ma „przeciwnika" po drugiej stronie środka w tej samej odległości.', 'Wielokąty foremne o nieparzystej liczbie boków nie mają środka symetrii.'], sol: [F2[0] + ': ' + (F2[1] === 'tak' ? 'ma środek symetrii.' : 'nie ma środka symetrii.')] }); }
      const sx = r.int(-3, 3), sy = r.int(-3, 3);
      return ch(r, { prompt: 'Punkt A = ' + pt(x, y) + '. Jakie współrzędne ma punkt symetryczny do A względem punktu S = ' + pt(sx, sy) + '?', correct: pt(2 * sx - x, 2 * sy - y), wrong: [[pt(-x, -y), 'sym'], [pt(sx - x, sy - y), 'sym'], [pt(x + sx, y + sy), 'sym']], hints: ['S jest środkiem odcinka AA\'.', 'x\' = 2 · ' + pn(sx) + ' − ' + pn(x) + '.', 'y\' = 2 · ' + pn(sy) + ' − ' + pn(y) + '.'], sol: ['A\' = ' + pt(2 * sx - x, 2 * sy - y)] });
    }
  });

  // ===================== KOŁA I OKRĘGI (kl. 8) =====================
  const pi = F(314, 100);
  def('circle_len', {
    name: 'Liczba π. Długość okręgu', grade: 8, mainCode: 'circ_pi', prereq: ['circ_parts'],
    types: { 1: ['input', 'choice'], 2: ['input', 'choice'], 3: ['choice'] },
    gen(r, d) {
      const rr = r.int(2, 15);
      if (d < 3) { const byD = d === 2; const L = U.mul(pi, N(2 * rr));
        return { prompt: 'Oblicz długość okręgu o ' + (byD ? 'średnicy ' + 2 * rr : 'promieniu ' + rr) + ' cm. Przyjmij π ≈ 3,14.', value: L, dec: true, unit: 'cm', wrong: [{ v: U.mul(pi, N(rr)), code: 'circ_pi' }, { v: U.mul(pi, N(rr * rr)), code: 'circ_pi' }, { v: U.mul(pi, N(4 * rr)), code: 'circ_rd' }].filter(w => !U.eq(w.v, L)), hints: ['L = 2πr (albo π · d).', byD ? 'Średnica d = ' + 2 * rr + ' cm, więc r = ' + rr + ' cm.' : 'r = ' + rr + ' cm.', '2 · 3,14 · ' + rr + ' = ?'], sol: ['L = 2 · 3,14 · ' + rr + ' = ' + dec(L) + ' cm'] }; }
      return ch(r, { prompt: 'Okrąg ma promień ' + rr + ' cm. Podaj dokładną długość okręgu.', correct: 2 * rr + 'π cm', wrong: [[rr + 'π cm', 'circ_pi'], [rr * rr + 'π cm', 'circ_pi'], [4 * rr + 'π cm', 'circ_rd']], hints: ['L = 2πr.', 'Nie podstawiaj przybliżenia π – zostaw π w wyniku.', '2 · ' + rr + ' = ' + 2 * rr + '.'], sol: ['L = 2π · ' + rr + ' = ' + 2 * rr + 'π cm'] });
    }
  });

  def('circle_area', {
    name: 'Pole koła', grade: 8, mainCode: 'circ_pi', prereq: ['circle_len'],
    types: { 1: ['input', 'choice'], 2: ['choice'], 3: ['choice'] },
    gen(r, d) {
      const rr = r.int(2, 12);
      if (d === 1) { const P = U.mul(pi, N(rr * rr)); return { prompt: 'Oblicz pole koła o promieniu ' + rr + ' cm. Przyjmij π ≈ 3,14.', value: P, dec: true, unit: 'cm²', wrong: [{ v: U.mul(pi, N(2 * rr)), code: 'circ_pi' }, { v: U.mul(pi, N(2 * rr * rr)), code: 'pow_mult' }].filter(w => !U.eq(w.v, P)), hints: ['P = πr².', 'r² = ' + rr + ' · ' + rr + ' = ' + rr * rr + '.', '3,14 · ' + rr * rr + ' = ?'], sol: ['P = 3,14 · ' + rr * rr + ' = ' + dec(P) + ' cm²'] }; }
      if (d === 2) { const dd = 2 * rr; return ch(r, { prompt: 'Koło ma średnicę ' + dd + ' cm. Ile wynosi jego pole?', correct: rr * rr + 'π cm²', wrong: [[dd * dd + 'π cm²', 'circ_rd'], [dd + 'π cm²', 'circ_pi'], [2 * rr * rr + 'π cm²', 'pow_mult']], hints: ['Wzór P = πr² używa promienia, nie średnicy.', 'r = ' + dd + ' : 2 = ' + rr + ' cm.', 'r² = ' + rr * rr + '.'], sol: ['P = π · ' + rr + '² = ' + rr * rr + 'π cm²'] }); }
      const R2 = rr + r.int(1, 5); return ch(r, { prompt: 'Oblicz pole pierścienia między okręgami o promieniach ' + R2 + ' cm i ' + rr + ' cm.', correct: (R2 * R2 - rr * rr) + 'π cm²', wrong: [[(R2 - rr) * (R2 - rr) + 'π cm²', 'circ_pi'], [(R2 * R2 + rr * rr) + 'π cm²', 'op_confuse'], [2 * (R2 - rr) + 'π cm²', 'circ_pi']], hints: ['Pole pierścienia = pole dużego koła − pole małego koła.', 'π · ' + R2 + '² − π · ' + rr + '².', R2 * R2 + 'π − ' + rr * rr + 'π = ?'], sol: [(R2 * R2) + 'π − ' + rr * rr + 'π = ' + (R2 * R2 - rr * rr) + 'π cm²'] });
    }
  });

  def('circle_pos', {
    name: 'Styczna do okręgu, wzajemne położenie okręgów', grade: 8, mainCode: 'circ_pos', prereq: ['circ_parts'],
    types: { 1: ['choice'], 2: ['choice'], 3: ['choice'] },
    gen(r, d) {
      if (d === 1) { const rr = r.int(3, 9); const k = r.int(0, 2); const dist = [rr + r.int(1, 4), rr, rr - r.int(1, rr - 1)][k]; const A = ['rozłączna z okręgiem', 'styczna do okręgu', 'sieczna okręgu'];
        return ch(r, { prompt: 'Okrąg ma promień ' + rr + ' cm. Prosta jest odległa od jego środka o ' + dist + ' cm. Jaka to prosta?', correct: A[k], wrong: A.filter((x, i) => i !== k).map(x => [x, 'circ_pos']), hints: ['Porównaj odległość prostej od środka z promieniem.', 'd > r – prosta omija okrąg; d = r – dotyka w jednym punkcie; d < r – przecina w dwóch.', dist + (dist > rr ? ' > ' : dist === rr ? ' = ' : ' < ') + rr + '.'], sol: [dist + (dist > rr ? ' > ' : dist === rr ? ' = ' : ' < ') + rr + ' → ' + A[k]] }); }
      const r1 = r.int(2, 8), r2 = r.int(2, 8); const k = d === 2 ? r.int(0, 2) : r.int(0, 4); const big = Math.max(r1, r2), sm = Math.min(r1, r2);
      if (k >= 3 && big === sm) return this.gen(r, 2);
      const dist = [r1 + r2 + r.int(1, 4), r1 + r2, r1 + r2 - 1 > big - sm ? r.int(big - sm + 1, r1 + r2 - 1) : r1 + r2 + 5, big - sm, big - sm > 1 ? r.int(0, big - sm - 1) : 0][k];
      const A = ['rozłączne zewnętrznie', 'styczne zewnętrznie', 'przecinające się (2 punkty wspólne)', 'styczne wewnętrznie', 'jeden wewnątrz drugiego (rozłączne wewnętrznie)'];
      const real = dist > r1 + r2 ? 0 : dist === r1 + r2 ? 1 : dist > big - sm ? 2 : dist === big - sm ? 3 : 4;
      return ch(r, { prompt: 'Okręgi mają promienie ' + r1 + ' cm i ' + r2 + ' cm, a odległość ich środków wynosi ' + dist + ' cm. Jak są położone?', correct: A[real], wrong: A.filter((x, i) => i !== real).map(x => [x, 'circ_pos']), hints: ['Policz sumę promieni: ' + (r1 + r2) + ' i różnicę: ' + (big - sm) + '.', 'd = suma → styczne zewnętrznie; d = różnica → styczne wewnętrznie.', 'Porównaj d = ' + dist + ' z tymi liczbami.'], sol: ['r₁ + r₂ = ' + (r1 + r2) + ', |r₁ − r₂| = ' + (big - sm) + ', d = ' + dist, A[real]] });
    }
  });
})(MP);
