/* gens_k4p.js — klasa 4 (nowa podstawa 2026) oraz umiejętności kl. 4–6, które wcześniej były tylko zaplanowane. */
var MP = (typeof window !== 'undefined' ? window : globalThis).MP;
(function (MP) {
  const U = MP.util, { F, pl, red, fromDec, fmtDec, fmtF } = U;
  const SK = MP.SK, def = (id, o) => { o.id = id; SK[id] = o; };
  const N = (n) => F(n, 1); const { ch, cmpSign, svgW } = MP.gx;
  const sp = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); // 12 500
  const dz = (k, p) => U.fmtDecK(k, p);

  Object.assign(MP.ERR, {
    place_big: { cat: 'zasada', title: 'Pomylone rzędy w dużej liczbie', kid: 'Odczytuj liczbę od prawej grupami po trzy cyfry: jedności, tysiące, miliony. W 45 382 jest 45 pełnych tysięcy.', remedy: 'nat_cmp' },
    est: { cat: 'zasada', title: 'Złe szacowanie', kid: 'Zaokrąglij liczby do pełnych setek lub dziesiątek i policz w pamięci. Wynik szacowania ma być blisko prawdziwego.', remedy: 'nat_round' },
    axis_unit: { cat: 'zasada', title: 'Zła podziałka osi', kid: 'Najpierw ustal, ile wynosi jedna działka: podziel różnicę podpisanych liczb przez liczbę działek między nimi.', remedy: 'nat_axis', alt: 'Policz kroki między dwiema podpisanymi kreskami. Jeśli od 100 do 200 jest 5 kroków, to jeden krok to 100 : 5 = 20.' },
    divisor: { cat: 'zasada', title: 'Pominięty dzielnik', kid: 'Dzielniki szukaj parami: 1 i liczba, 2 i połowa… Nie zapomnij o 1 i o samej liczbie.', remedy: 'divisors' },
    geo_term: { cat: 'zasada', title: 'Pomylone pojęcia geometryczne', kid: 'Odcinek ma dwa końce. Półprosta ma początek, ale nie ma końca. Prosta nie ma ani początku, ani końca.', remedy: 'geo_basic' },
    diag: { cat: 'zasada', title: 'Źle policzone przekątne', kid: 'Przekątna łączy dwa wierzchołki, które NIE są sąsiednie. Boki nie są przekątnymi.', remedy: 'geo_basic' },
    lines_rel: { cat: 'zasada', title: 'Pomylone proste równoległe i prostopadłe', kid: 'Równoległe nigdy się nie przetną (jak tory). Prostopadłe przecinają się pod kątem prostym (jak róg kartki).', remedy: 'lines' },
    ang_est: { cat: 'zasada', title: 'Złe oszacowanie kąta', kid: 'Porównaj kąt z kątem prostym (90°): mniejszy – ostry, większy – rozwarty. Połowa prostego to 45°.', remedy: 'ang_measure' },
    vol_unit: { cat: 'zasada', title: 'Zły przelicznik jednostek objętości', kid: '1 l = 1 dm³ = 1000 cm³ = 1000 ml. 1 m³ = 1000 dm³.', remedy: 'vol_units' },
    frline: { cat: 'zasada', title: 'Źle odczytany ułamek na osi', kid: 'Policz, na ile równych części podzielono odcinek od 0 do 1 – to mianownik. Licznik to liczba kroków od zera.', remedy: 'fr_line' },
    quad_prop: { cat: 'zasada', title: 'Pomylone własności czworokątów', kid: 'Kwadrat to szczególny prostokąt i szczególny romb. Równoległobok ma dwie pary boków równoległych, trapez – co najmniej jedną.', remedy: 'quads' },
    net: { cat: 'zasada', title: 'Zła wizualizacja siatki', kid: 'Wyobraź sobie zaginanie siatki krok po kroku. W pasku 4 kwadratów co drugi kwadrat jest naprzeciwko siebie.', remedy: 'nets' },
    solid: { cat: 'zasada', title: 'Pomylone bryły', kid: 'Graniastosłup ma dwie jednakowe podstawy, ostrosłup – jedną podstawę i wierzchołek. Walec, stożek i kula mają powierzchnie zakrzywione.', remedy: 'solids' },
    whole: { cat: 'zasada', title: 'Ułamek liczby zamiast całości', kid: 'Znamy CZĘŚĆ, szukamy CAŁOŚCI. Jeśli 1/4 to 12, to cała liczba jest 4 razy większa – nie mniejsza.', remedy: 'fr_whole', alt: 'Narysuj pasek podzielony na części. Wpisz znaną wartość w zamalowane części i policz, ile przypada na jedną część. Potem pomnóż przez wszystkie części.' },
    period: { cat: 'zasada', title: 'Błąd w rozwinięciu okresowym', kid: 'Okres to grupa cyfr, która powtarza się bez końca. Wykonaj dzielenie pisemne, aż reszta się powtórzy.', remedy: 'dec_inf' },
    kmh: { cat: 'zasada', title: 'Zły przelicznik km/h i m/s', kid: '1 m/s = 3,6 km/h. Z km/h na m/s dzielimy przez 3,6, z m/s na km/h – mnożymy.', remedy: 'speed_units' },
    tally: { cat: 'rachunek', title: 'Źle policzone kreski', kid: 'Każda przekreślona grupa to 5. Licz piątkami, a potem dolicz pojedyncze kreski.', remedy: 'data_collect' }
  });

  // ===================== LICZBY NATURALNE (kl. 4) =====================
  def('nat_cmp', {
    name: 'Zapis i porównywanie liczb wielocyfrowych', grade: 4, mainCode: 'place_big',
    types: { 1: ['input', 'choice'], 2: ['input', 'choice'], 3: ['choice'] },
    gen(r, d) {
      if (d === 1) { const n = r.int(10000, 999999), k = r.pick([['tysięcy', 1000], ['setek', 100], ['dziesiątek tysięcy', 10000]]); const v = Math.floor(n / k[1]);
        return { prompt: 'Ile pełnych ' + k[0] + ' jest w liczbie ' + sp(n) + '?', value: N(v), wrong: [{ v: N(Math.floor(n / k[1]) % 10), code: 'place_big' }, { v: N(Math.floor(n / (k[1] * 10))), code: 'place_big' }, { v: N(Math.floor(n / (k[1] / 10))), code: 'place_big' }].filter(w => w.v.n !== v), hints: ['Pytamy o PEŁNE ' + k[0] + ', a nie o jedną cyfrę.', 'Odetnij od prawej tyle cyfr, ile ma ' + sp(k[1]) + ' zer: ' + (String(k[1]).length - 1) + '.', 'To, co zostało z lewej, to odpowiedź.'], sol: [sp(n) + ' : ' + sp(k[1]) + ' = ' + sp(v) + ' (reszta ' + sp(n % k[1]) + ')'] }; }
      if (d === 2) { const t = r.int(1, 99), s = r.chance(0.4) ? 0 : r.int(1, 9), dd = r.chance(0.5) ? 0 : r.int(1, 9), j = r.int(0, 9); const n = t * 1000 + s * 100 + dd * 10 + j;
        const words = t + ' ' + pl(t, 'tysiąc', 'tysiące', 'tysięcy') + (s ? ', ' + s + ' ' + pl(s, 'setka', 'setki', 'setek') : '') + (dd ? ', ' + dd + ' ' + pl(dd, 'dziesiątka', 'dziesiątki', 'dziesiątek') : '') + (j ? ' i ' + j + ' ' + pl(j, 'jedność', 'jedności', 'jedności') : '');
        return { prompt: 'Zapisz cyframi liczbę: ' + words + '.', value: N(n), wrong: [{ v: N(+(String(t) + (s || '') + (dd || '') + (j || ''))), code: 'place_big' }, { v: N(t * 100 + s * 10 + dd + j), code: 'place_big' }].filter(w => w.v.n !== n && w.v.n > 0), hints: ['Każdy rząd musi mieć swoje miejsce – brakujące rzędy wypełnij zerami.', t + ' ' + pl(t, 'tysiąc', 'tysiące', 'tysięcy') + ' = ' + sp(t * 1000) + '.', 'Dodaj: ' + sp(t * 1000) + ' + ' + (s * 100) + ' + ' + (dd * 10) + ' + ' + j + '.'], sol: [sp(t * 1000) + ' + ' + s * 100 + ' + ' + dd * 10 + ' + ' + j + ' = ' + sp(n)] }; }
      const a = r.int(10000, 999999); const k = r.int(0, 2); let b = k === 0 ? +String(a).slice(0, -1) * (r.chance(0.5) ? 1 : 1) : k === 1 ? a + r.pick([-1, 1]) * Math.pow(10, r.int(1, 4)) : +String(a).split('').reverse().join(''); if (b === a) b = a + 1;
      return cmpSign(r, a, b, sp(a), sp(b), ['Najpierw sprawdź, która liczba ma więcej cyfr.', 'Przy tej samej liczbie cyfr porównuj od lewej, cyfra po cyfrze.', 'Dzióbek znaku wskazuje mniejszą liczbę.'], [], 'place_big');
    }
  });

  def('nat_est', {
    name: 'Szacowanie wyników działań', grade: 4, mainCode: 'est', prereq: ['nat_round'],
    types: { 1: ['choice'], 2: ['choice'], 3: ['choice'] },
    gen(r, d) {
      if (d < 3) { const a = d === 1 ? r.int(11, 89) * 10 + r.int(1, 9) : r.int(101, 899) * 10 + r.int(1, 9), b = d === 1 ? r.int(11, 89) * 10 + r.int(1, 9) : r.int(101, 899) * 10 + r.int(1, 9); const sub = r.chance(0.4) && a > b; const st = d === 1 ? 100 : 1000;
        const ra = Math.round(a / st) * st, rb = Math.round(b / st) * st, est = sub ? ra - rb : ra + rb;
        return ch(r, { prompt: 'Który wynik jest najbliższy wartości ' + sp(a) + (sub ? ' − ' : ' + ') + sp(b) + '? Oszacuj bez dokładnego liczenia.', correct: sp(est), wrong: [[sp(est + st), 'est'], [sp(Math.max(st, est - st)), 'est'], [sp(est * 10), 'est'], [sp(sub ? ra + rb : Math.abs(ra - rb) || st), 'op_confuse']], hints: ['Zaokrąglij obie liczby do pełnych ' + (st === 100 ? 'setek' : 'tysięcy') + '.', sp(a) + ' ≈ ' + sp(ra) + ', ' + sp(b) + ' ≈ ' + sp(rb) + '.', 'Policz w pamięci: ' + sp(ra) + (sub ? ' − ' : ' + ') + sp(rb) + '.'], sol: [sp(ra) + (sub ? ' − ' : ' + ') + sp(rb) + ' = ' + sp(est), 'Dokładnie: ' + sp(sub ? a - b : a + b) + ' – blisko oszacowania.'] }); }
      const price = r.int(12, 48) * 10 + r.pick([5, 9, 8]), n = r.int(3, 7), have = Math.round(price * n / 100) * 100 + r.pick([-100, 100]); const enough = price * n <= have;
      return ch(r, { prompt: 'Rower na wycieczkę kosztuje ' + price + ' zł za osobę. Jedzie ' + n + ' osób. Czy wystarczy ' + sp(have) + ' zł? Oszacuj.', correct: enough ? 'tak, wystarczy' : 'nie, zabraknie', wrong: [[enough ? 'nie, zabraknie' : 'tak, wystarczy', 'est']], keepOrder: true, hints: ['Zaokrąglij cenę: ' + price + ' ≈ ' + Math.round(price / 10) * 10 + ' zł.', 'Pomnóż przez ' + n + ': około ' + Math.round(price / 10) * 10 * n + ' zł.', 'Porównaj z kwotą ' + sp(have) + ' zł – a jeśli jest blisko, policz dokładnie.'], sol: ['Dokładnie: ' + n + ' · ' + price + ' = ' + sp(price * n) + ' zł', sp(price * n) + (enough ? ' ≤ ' : ' > ') + sp(have) + ' → ' + (enough ? 'wystarczy.' : 'zabraknie.')] });
    }
  });

  function axisSvg(start, unit, labelsAt, arrowAt, ticks) {
    const W = 340, x = (i) => 20 + i * (300 / ticks); let s = '<line x1="10" y1="40" x2="332" y2="40" class="ln"/><polygon points="332,35 340,40 332,45" style="fill:var(--ink)"/>';
    for (let i = 0; i <= ticks; i++) s += '<line x1="' + x(i) + '" y1="32" x2="' + x(i) + '" y2="48" class="tick"/>';
    labelsAt.forEach(i => { s += '<text x="' + x(i) + '" y="68" text-anchor="middle" class="lb">' + U.plain(String(start + i * unit)).replace('-', '−') + '</text>'; });
    s += '<polygon points="' + (x(arrowAt) - 7) + ',8 ' + (x(arrowAt) + 7) + ',8 ' + x(arrowAt) + ',24" style="fill:var(--coral)"/><text x="' + x(arrowAt) + '" y="6" text-anchor="middle" class="lb" style="fill:var(--coral)">?</text>';
    return svgW(W, 76, s, 'oś liczbowa', 'width:min(360px,100%)');
  }
  def('nat_axis', {
    name: 'Oś liczbowa i podziałka', grade: 4, mainCode: 'axis_unit',
    types: { 1: ['input', 'choice'], 2: ['input', 'choice'], 3: ['input', 'choice'] },
    gen(r, d) {
      const unit = d === 1 ? r.pick([1, 2, 5, 10]) : d === 2 ? r.pick([5, 20, 25, 50]) : r.pick([25, 50, 200, 250, 500]); const ticks = 10; const start = unit * r.int(0, 20);
      const l1 = d === 3 ? r.int(0, 2) : 0, l2 = d === 3 ? l1 + r.int(4, 6) : (d === 1 ? 1 : r.int(2, 5)); let arrow = r.int(1, ticks); if (arrow === l1 || arrow === l2) arrow = (arrow % ticks) + 1;
      const v = start + arrow * unit, wrongUnit = (l2 - l1) === 1 ? 1 : 1;
      return { prompt: 'Jaka liczba odpowiada strzałce na osi?', visual: axisSvg(start, unit, [l1, l2], arrow, ticks), value: N(v), wrong: [{ v: N(start + l1 * unit + (arrow - l1) * wrongUnit), code: 'axis_unit' }, { v: N(start + l1 * unit + (arrow - l1) * ((l2 - l1) * unit)), code: 'axis_unit' }, { v: N(v + unit), code: 'calc' }].filter(w => w.v.n !== v && w.v.n >= 0),
        hints: ['Między liczbami ' + (start + l1 * unit) + ' i ' + (start + l2 * unit) + ' jest ' + (l2 - l1) + ' ' + pl(l2 - l1, 'działka', 'działki', 'działek') + '.', 'Jedna działka to ' + ((l2 - l1) * unit) + ' : ' + (l2 - l1) + ' = ' + unit + '.', 'Od ' + (start + l1 * unit) + ' do strzałki jest ' + Math.abs(arrow - l1) + ' ' + pl(Math.abs(arrow - l1), 'działka', 'działki', 'działek') + (arrow < l1 ? ' w lewo' : '') + '.'], sol: ['1 działka = ' + unit, (start + l1 * unit) + ' + ' + (arrow - l1) + ' · ' + unit + ' = ' + v] };
    }
  });

  def('nat_mental', {
    name: 'Rachunek pamięciowy na dużych liczbach', grade: 4, mainCode: 'calc', prereq: ['k3_add'],
    types: { 1: ['input', 'choice'], 2: ['input', 'choice'], 3: ['input', 'choice'] },
    gen(r, d) {
      if (d === 1) { const a = r.int(12, 89) * 10, b = r.int(12, 89) * 10, sub = r.chance(0.5) && a !== b; const [x, y] = sub ? [Math.max(a, b), Math.min(a, b)] : [a, b]; const v = sub ? x - y : x + y;
        return { prompt: 'Oblicz w pamięci: ' + x + (sub ? ' − ' : ' + ') + y, value: N(v), wrong: [{ v: N(sub ? v + 100 : v - 100), code: 'calc' }, { v: N(sub ? x + y : Math.abs(x - y)), code: 'op_confuse' }].filter(w => w.v.n > 0 && w.v.n !== v), hints: ['Licz na dziesiątkach: ' + x / 10 + (sub ? ' − ' : ' + ') + y / 10 + ' dziesiątek.', x / 10 + (sub ? ' − ' : ' + ') + y / 10 + ' = ' + v / 10 + '.', 'Dopisz zero na końcu.'], sol: [x / 10 + (sub ? ' − ' : ' + ') + y / 10 + ' = ' + v / 10, x + (sub ? ' − ' : ' + ') + y + ' = ' + v] }; }
      if (d === 2) { const T = r.pick([100, 1000]), b = T === 100 ? r.int(11, 89) : r.int(101, 899);
        return { prompt: 'Oblicz w pamięci: ' + sp(T) + ' − ' + b, value: N(T - b), wrong: [{ v: N(T - b + 10), code: 'pis_borrow' }, { v: N(T - b - 10), code: 'calc' }], hints: ['Ile brakuje do ' + sp(T) + '? Dopełnij liczbę ' + b + '.', 'Najpierw do pełnej dziesiątki: ' + b + ' + ' + (10 - b % 10) % 10 + ' = ' + (b + (10 - b % 10) % 10) + '.', 'Potem do ' + sp(T) + ': ' + sp(T) + ' − ' + (b + (10 - b % 10) % 10) + ' = ' + (T - b - (10 - b % 10) % 10) + '. Dodaj oba kawałki.'], sol: [sp(T) + ' − ' + b + ' = ' + (T - b), 'Sprawdzenie: ' + b + ' + ' + (T - b) + ' = ' + sp(T)] }; }
      const k = r.int(0, 2);
      if (k === 0) { const m = r.int(3, 9), p = r.pick([[25, 4], [50, 2], [20, 5], [125, 8]]); return { prompt: 'Oblicz sprytnie: ' + p[0] + ' · ' + m + ' · ' + p[1], value: N(p[0] * p[1] * m), wrong: [{ v: N(p[0] * m + p[1]), code: 'order_ltr' }, { v: N(p[0] * p[1] * m + p[0]), code: 'calc' }], hints: ['Kolejność czynników w mnożeniu można zmieniać.', 'Pomnóż najpierw ' + p[0] + ' · ' + p[1] + ' = ' + p[0] * p[1] + '.', p[0] * p[1] + ' · ' + m + ' = ?'], sol: [p[0] + ' · ' + p[1] + ' = ' + p[0] * p[1], p[0] * p[1] + ' · ' + m + ' = ' + p[0] * p[1] * m] }; }
      if (k === 1) { const m = r.int(3, 9), a = r.pick([99, 98, 101, 49, 51]), base = Math.round(a / 50) * 50, dlt = a - base; return { prompt: 'Oblicz sprytnie: ' + a + ' · ' + m, value: N(a * m), wrong: [{ v: N(base * m + dlt), code: 'calc' }, { v: N(base * m - dlt), code: 'calc' }].filter(w => w.v.n !== a * m), hints: [a + ' = ' + base + (dlt > 0 ? ' + ' : ' − ') + Math.abs(dlt) + '.', 'Pomnóż osobno: ' + base + ' · ' + m + ' i ' + Math.abs(dlt) + ' · ' + m + '.', base * m + (dlt > 0 ? ' + ' : ' − ') + Math.abs(dlt) * m + ' = ?'], sol: [a + ' · ' + m + ' = ' + base + ' · ' + m + (dlt > 0 ? ' + ' : ' − ') + Math.abs(dlt) + ' · ' + m, '= ' + base * m + (dlt > 0 ? ' + ' : ' − ') + Math.abs(dlt) * m + ' = ' + a * m] }; }
      const a = r.int(2, 9) * 10 + r.int(1, 9), m = r.int(3, 9); return { prompt: 'Oblicz w pamięci: ' + a + ' · ' + m, value: N(a * m), wrong: [{ v: N(Math.floor(a / 10) * 10 * m + a % 10), code: 'calc' }, { v: N(Math.floor(a / 10) * m * 10 + (a % 10) * m + 10), code: 'calc' }], hints: ['Rozłóż: ' + a + ' = ' + Math.floor(a / 10) * 10 + ' + ' + a % 10 + '.', Math.floor(a / 10) * 10 + ' · ' + m + ' = ' + Math.floor(a / 10) * 10 * m + ', ' + a % 10 + ' · ' + m + ' = ' + (a % 10) * m + '.', 'Dodaj oba wyniki.'], sol: [Math.floor(a / 10) * 10 * m + ' + ' + (a % 10) * m + ' = ' + a * m] };
    }
  });

  const divs = (n) => { const o = []; for (let i = 1; i <= n; i++) if (n % i === 0) o.push(i); return o; };
  def('divisors', {
    name: 'Dzielniki liczby', grade: 4, mainCode: 'divisor', prereq: ['tabl'],
    types: { 1: ['input', 'choice'], 2: ['choice'], 3: ['input', 'choice'] },
    gen(r, d) {
      const n = r.pick(d === 1 ? [6, 8, 10, 12, 14, 15, 16, 18, 20, 21] : [24, 28, 30, 32, 36, 40, 42, 45, 48, 54, 60, 64, 72, 80, 84, 90, 96]); const D = divs(n);
      if (d === 2) { const non = r.shuffle([...Array(n - 1).keys()].map(x => x + 2).filter(x => n % x !== 0 && x < n && x <= 20)); const bad = non[0];
        return ch(r, { prompt: 'Która z liczb <b>nie jest</b> dzielnikiem liczby ' + n + '?', correct: String(bad), wrong: r.shuffle(D.filter(x => x > 1 && x < n)).slice(0, 3).map(x => [String(x), 'divisor']), hints: ['Dzielnik to liczba, przez którą ' + n + ' dzieli się bez reszty.', 'Sprawdź każdą odpowiedź: ' + n + ' : liczba = ? Czy jest reszta?', n + ' : ' + bad + ' daje resztę ' + n % bad + '.'], sol: ['Dzielniki ' + n + ': ' + D.join(', '), bad + ' nie jest dzielnikiem, bo ' + n + ' : ' + bad + ' = ' + Math.floor(n / bad) + ' r. ' + n % bad + '.'] }); }
      if (d === 3) { const lim = r.int(30, 90), k = r.pick([2, 5, 10, 3]); const cnt = Math.floor((lim - 1) / k) - Math.floor(9 / k);
        return { prompt: 'Ile jest liczb dwucyfrowych mniejszych od ' + lim + ', które dzielą się przez ' + k + '?', value: N(cnt), wrong: [{ v: N(cnt + 1), code: 'divisor' }, { v: N(Math.floor(lim / k)), code: 'divisor' }].filter(w => w.v.n !== cnt), hints: ['Liczby dwucyfrowe zaczynają się od 10.', 'Wypisz: ' + [...Array(4).keys()].map(i => (Math.ceil(10 / k) + i) * k).join(', ') + ', …', 'Ostatnia mniejsza od ' + lim + ' to ' + Math.floor((lim - 1) / k) * k + '. Policz wszystkie.'], sol: ['Od ' + Math.ceil(10 / k) * k + ' do ' + Math.floor((lim - 1) / k) * k + ' co ' + k + ': ' + cnt + ' ' + pl(cnt, 'liczba', 'liczby', 'liczb')] }; }
      return { prompt: 'Ile dzielników ma liczba ' + n + '?', value: N(D.length), wrong: [{ v: N(D.length - 2), code: 'divisor' }, { v: N(D.length - 1), code: 'divisor' }], hints: ['Szukaj par: 1 · ' + n + ', 2 · …', 'Nie zapomnij o 1 i o samej liczbie ' + n + '.', 'Pary: ' + D.filter(x => x * x <= n).map(x => x + '·' + n / x).join(', ') + '.'], sol: ['Dzielniki: ' + D.join(', '), 'Razem: ' + D.length] };
    }
  });

  // ===================== GEOMETRIA (kl. 4) =====================
  const P = (pts) => pts.map(p => p.join(',')).join(' ');
  function polySvg(n, diags) { const pts = [...Array(n).keys()].map(i => [100 + 70 * Math.sin(2 * Math.PI * i / n), 85 - 70 * Math.cos(2 * Math.PI * i / n)].map(v => +v.toFixed(1)));
    let s = '<polygon points="' + P(pts) + '" class="shape"/>'; if (diags) for (let j = 2; j < n - 1; j++) s += '<line x1="' + pts[0][0] + '" y1="' + pts[0][1] + '" x2="' + pts[j][0] + '" y2="' + pts[j][1] + '" class="dash"/>';
    pts.forEach(p => { s += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="3.5" style="fill:var(--ink)"/>'; }); return svgW(200, 170, s, n + '-kąt'); }
  const NG = { 3: 'trójkąt', 4: 'czworokąt', 5: 'pięciokąt', 6: 'sześciokąt', 7: 'siedmiokąt', 8: 'ośmiokąt' }; const NGgen = { 3: 'trójkąta', 4: 'czworokąta', 5: 'pięciokąta', 6: 'sześciokąta', 7: 'siedmiokąta', 8: 'ośmiokąta' };
  def('geo_basic', {
    name: 'Punkt, odcinek, prosta, półprosta; elementy wielokątów', grade: 4, mainCode: 'geo_term',
    types: { 1: ['choice'], 2: ['input', 'choice'], 3: ['input', 'choice'] },
    gen(r, d) {
      if (d === 1) { const k = r.pick(['odcinek', 'prosta', 'półprosta']); const dot = (x) => '<circle cx="' + x + '" cy="40" r="5" style="fill:var(--ink)"/>', arr = (x, dir) => '<polygon points="' + x + ',33 ' + (x + 12 * dir) + ',40 ' + x + ',47" style="fill:var(--ink)"/>';
        const body = '<line x1="' + (k === 'prosta' ? 20 : 60) + '" y1="40" x2="' + (k === 'odcinek' ? 240 : 270) + '" y2="40" class="ln"/>' + (k === 'odcinek' ? dot(60) + dot(240) : k === 'półprosta' ? dot(60) + arr(270, 1) : arr(20, -1) + arr(270, 1));
        return ch(r, { prompt: 'Co przedstawia rysunek? (strzałka oznacza, że linia biegnie dalej bez końca)', visual: svgW(300, 80, body, k), correct: k, wrong: ['odcinek', 'prosta', 'półprosta', 'punkt'].filter(x => x !== k).map(x => [x, 'geo_term']), hints: ['Sprawdź końce linii: kropka to koniec, strzałka – brak końca.', 'Odcinek ma dwa końce, półprosta – jeden, prosta – żadnego.', 'Ile końców widzisz na rysunku?'], sol: [k === 'odcinek' ? 'Dwa końce – to odcinek.' : k === 'półprosta' ? 'Jeden koniec (początek) – to półprosta.' : 'Brak końców – to prosta.'] }); }
      const n = r.int(4, d === 2 ? 7 : 8);
      if (d === 2) return { prompt: 'Ile przekątnych wychodzi z jednego wierzchołka ' + NGgen[n] + '?', visual: polySvg(n, false), value: N(n - 3), wrong: [{ v: N(n - 1), code: 'diag' }, { v: N(n - 2), code: 'diag' }, { v: N(n), code: 'diag' }], hints: ['Przekątna łączy wierzchołek z innym, NIESĄSIEDNIM wierzchołkiem.', 'Wierzchołek nie łączy się przekątną sam ze sobą ani z dwoma sąsiadami.', n + ' − 3 = ?'], sol: ['Z jednego wierzchołka: ' + n + ' − 3 = ' + (n - 3) + ' ' + pl(n - 3, 'przekątna', 'przekątne', 'przekątnych')] };
      const tot = n * (n - 3) / 2;
      return { prompt: 'Ile przekątnych ma ' + NG[n] + '? (na rysunku – przekątne z jednego wierzchołka)', visual: polySvg(n, true), value: N(tot), wrong: [{ v: N(n * (n - 3)), code: 'diag' }, { v: N(n - 3), code: 'diag' }, { v: N(n * (n - 1) / 2), code: 'diag' }], hints: ['Z każdego wierzchołka wychodzi ' + (n - 3) + ' ' + pl(n - 3, 'przekątna', 'przekątne', 'przekątnych') + '.', n + ' wierzchołków · ' + (n - 3) + ' = ' + n * (n - 3) + ', ale każdą przekątną policzyliśmy dwa razy (z obu końców).', n * (n - 3) + ' : 2 = ?'], sol: [n + ' · ' + (n - 3) + ' : 2 = ' + tot] };
    }
  });

  def('lines', {
    name: 'Proste prostopadłe i równoległe, odległość punktu od prostej', grade: 4, mainCode: 'lines_rel',
    types: { 1: ['choice'], 2: ['choice'], 3: ['input', 'choice'] },
    gen(r, d) {
      if (d < 3) { const k = r.pick(['równoległe', 'prostopadłe', 'ani równoległe, ani prostopadłe']); const ang = r.pick([0, 20, 35, 60]); const rot = (x, y, a) => { const t = a * Math.PI / 180; return [(150 + (x - 150) * Math.cos(t) - (y - 75) * Math.sin(t)).toFixed(1), (75 + (x - 150) * Math.sin(t) + (y - 75) * Math.cos(t)).toFixed(1)]; };
        const L = (x1, y1, x2, y2) => { const a = rot(x1, y1, ang), b = rot(x2, y2, ang); return '<line x1="' + a[0] + '" y1="' + a[1] + '" x2="' + b[0] + '" y2="' + b[1] + '" class="ln"/>'; };
        let body = k === 'równoległe' ? L(30, 50, 270, 50) + L(30, 105, 270, 105) : k === 'prostopadłe' ? L(30, 75, 270, 75) + L(150, -20, 150, 170) : L(30, 75, 270, 75) + L(110, -10, 200, 160);
        if (k === 'prostopadłe') { const c = rot(150, 75, ang), p1 = rot(165, 75, ang), p2 = rot(165, 60, ang), p3 = rot(150, 60, ang); body += '<path d="M' + p1.join(' ') + ' L' + p2.join(' ') + ' L' + p3.join(' ') + '" class="arc"/>'; }
        return ch(r, { prompt: 'Jakie są te proste?', visual: svgW(300, 150, body, 'dwie proste'), correct: k, wrong: ['równoległe', 'prostopadłe', 'ani równoległe, ani prostopadłe'].filter(x => x !== k).map(x => [x, 'lines_rel']), hints: ['Czy proste się przecinają (lub przecięłyby się po przedłużeniu)?', 'Równoległe nigdy się nie przetną.', 'Prostopadłe tworzą kąt prosty – zaznaczony małym kwadracikiem.'], sol: ['Te proste są ' + k + '.'] }); }
      const gx = r.int(1, 8), gy = r.int(1, 5), ly = r.chance(0.5) ? 0 : 6; const dist = Math.abs(gy - ly);
      let body = ''; for (let i = 0; i <= 10; i++) body += '<line x1="' + (10 + i * 25) + '" y1="10" x2="' + (10 + i * 25) + '" y2="160" class="grid"/>'; for (let j = 0; j <= 6; j++) body += '<line x1="10" y1="' + (10 + j * 25) + '" x2="260" y2="' + (10 + j * 25) + '" class="grid"/>';
      body += '<line x1="10" y1="' + (160 - ly * 25) + '" x2="260" y2="' + (160 - ly * 25) + '" class="ln"/><circle cx="' + (10 + gx * 25) + '" cy="' + (160 - gy * 25) + '" r="5" style="fill:var(--coral)"/><text x="' + (18 + gx * 25) + '" y="' + (155 - gy * 25) + '" class="lb">A</text>';
      return { prompt: 'Jaka jest odległość punktu A od prostej, jeśli bok kratki ma 1 cm? (w cm)', visual: svgW(270, 170, body, 'kratka z prostą i punktem'), value: N(dist), unit: 'cm', wrong: [{ v: N(dist + 1), code: 'calc' }, { v: N(gx), code: 'lines_rel' }].filter(w => w.v.n !== dist), hints: ['Odległość punktu od prostej mierzymy wzdłuż odcinka PROSTOPADŁEGO do prostej.', 'Prosta jest pozioma, więc idziemy pionowo w ' + (ly > gy ? 'górę' : 'dół') + '.', 'Policz kratki od A do prostej.'], sol: ['Odcinek prostopadły ma ' + dist + ' ' + pl(dist, 'kratkę', 'kratki', 'kratek') + ' = ' + dist + ' cm.'] };
    }
  });

  def('ang_measure', {
    name: 'Mierzenie i szacowanie kątów', grade: 4, mainCode: 'ang_est', prereq: ['ang_type'],
    types: { 1: ['choice'], 2: ['choice'], 3: ['input', 'choice'] },
    gen(r, d) {
      if (d < 3) { const a = d === 1 ? r.pick([30, 45, 90, 120, 150, 60]) : r.int(2, 34) * 5; const near = d === 1 ? [a + 60, a - 60, 180 - a, a + 90] : [a + 20, a - 20, 180 - a, a + 40];
        return ch(r, { prompt: 'Jaką miarę ma kąt na rysunku? Oszacuj.', visual: MP.draw.angleSvg(a), correct: a + '°', wrong: near.filter(x => x > 0 && x < 180 && x !== a).map(x => [x + '°', 'ang_est']), hints: ['Porównaj z kątem prostym (90°) – jak róg kartki.', a < 90 ? 'Ten kąt jest ostry – mniejszy niż 90°.' : a > 90 ? 'Ten kąt jest rozwarty – większy niż 90°.' : 'To kąt prosty.', a < 90 ? 'Czy to bliżej połowy prostego (45°), czy prawie prosty?' : a > 90 ? 'O ile więcej niż prosty?' : 'Prosty to 90°.'], sol: ['Kąt ma ' + a + '°.'] }); }
      const a = r.int(2, 17) * 5, to = r.pick([90, 180]); if (a >= to) return this.gen(r, 2);
      return { prompt: 'Kąt ma ' + a + '°. Ile stopni brakuje mu do kąta ' + (to === 90 ? 'prostego' : 'półpełnego') + '?', value: N(to - a), unit: '°', wrong: [{ v: N(to === 90 ? 180 - a : 90 - a), code: 'ang_type' }, { v: N(to + a), code: 'op_confuse' }].filter(w => w.v.n > 0 && w.v.n !== to - a), hints: ['Kąt ' + (to === 90 ? 'prosty' : 'półpełny') + ' ma ' + to + '°.', 'Brakuje: ' + to + ' − ' + a + '.', 'Policz.'], sol: [to + ' − ' + a + ' = ' + (to - a) + '°'] };
    }
  });

  def('vol_units', {
    name: 'Jednostki objętości i pojemności', grade: 4, mainCode: 'vol_unit', prereq: ['vol_box'],
    types: { 1: ['input', 'choice'], 2: ['input', 'choice'], 3: ['input', 'choice'] },
    gen(r, d) {
      if (d === 1) { const k = r.int(0, 2); const n = r.int(2, 9); const Q = [[n + ' l = □ ml', n * 1000, [n * 100, n * 10]], [n + ' dm³ = □ l', n, [n * 1000, n * 10]], [n * 1000 + ' cm³ = □ l', n, [n * 100, n * 10]]][k];
        return { prompt: Q[0], fill: true, value: N(Q[1]), wrong: Q[2].map(x => ({ v: N(x), code: 'vol_unit' })), hints: ['1 l = 1 dm³ = 1000 cm³ = 1000 ml.', k === 0 ? 'Pomnóż przez 1000.' : k === 1 ? 'Litr i decymetr sześcienny to to samo.' : 'Podziel przez 1000.', 'Sprawdź, czy wynik ma sens.'], sol: [Q[0].replace('□', String(Q[1]))] }; }
      if (d === 2) { const n = r.int(2, 9), half = r.pick([0, 500, 250]);
        return { prompt: n + ' m³ = □ dm³', fill: true, value: N(n * 1000), wrong: [{ v: N(n * 100), code: 'vol_unit' }, { v: N(n * 10), code: 'vol_unit' }], hints: ['1 m = 10 dm.', '1 m³ = 10 · 10 · 10 dm³ = 1000 dm³.', n + ' · 1000 = ?'], sol: [n + ' m³ = ' + n * 1000 + ' dm³' + (half ? '' : '')] }; }
      const a = r.pick([30, 40, 50, 60]), b = r.pick([20, 25, 30, 40]), c = r.pick([20, 30, 40]); const ccm = a * b * c;
      return { prompt: 'Akwarium ma wymiary ' + a + ' cm × ' + b + ' cm × ' + c + ' cm. Ile litrów wody się w nim zmieści?', value: fromDec(ccm, 3), dec: true, unit: 'l', wrong: [{ v: N(ccm), code: 'vol_unit' }, { v: F(ccm, 100), code: 'vol_unit' }], hints: ['Objętość: ' + a + ' · ' + b + ' · ' + c + ' cm³.', a + ' · ' + b + ' · ' + c + ' = ' + sp(ccm) + ' cm³.', '1 l = 1000 cm³ – podziel przez 1000.'], sol: [a + ' · ' + b + ' · ' + c + ' = ' + sp(ccm) + ' cm³', sp(ccm) + ' : 1000 = ' + dz(ccm, 3) + ' l'] };
    }
  });

  // ===================== UŁAMKI (kl. 5–6) =====================
  function fracAxis(den, maxW, k) {
    const W = 340, x = (t) => 20 + t * (300 / (den * maxW)); let s = '<line x1="10" y1="40" x2="332" y2="40" class="ln"/>';
    for (let i = 0; i <= den * maxW; i++) s += '<line x1="' + x(i) + '" y1="' + (i % den ? 34 : 28) + '" x2="' + x(i) + '" y2="' + (i % den ? 46 : 52) + '" class="tick"/>';
    for (let w = 0; w <= maxW; w++) s += '<text x="' + x(w * den) + '" y="70" text-anchor="middle" class="lb">' + w + '</text>';
    s += '<polygon points="' + (x(k) - 7) + ',8 ' + (x(k) + 7) + ',8 ' + x(k) + ',24" style="fill:var(--coral)"/>';
    return svgW(W, 76, s, 'oś liczbowa z ułamkami', 'width:min(360px,100%)');
  }
  def('fr_line', {
    name: 'Ułamki na osi liczbowej', grade: 5, mainCode: 'frline', prereq: ['fr_part'],
    types: { 1: ['input', 'choice'], 2: ['input', 'choice'], 3: ['input', 'choice'] },
    gen(r, d) {
      const den = r.pick(d === 1 ? [2, 3, 4, 5] : [4, 5, 6, 8, 10]), maxW = d === 3 ? r.int(2, 3) : 1; let k = r.int(1, den * maxW - 1); if (d === 3 && k < den) k += den;
      const v = red(F(k, den));
      return { prompt: 'Jaką liczbę wskazuje strzałka? (możesz wpisać ułamek, np. 3/4' + (d === 3 ? ', albo liczbę mieszaną, np. 1 1/2' : '') + ')', visual: fracAxis(den, maxW, k), value: v, form: 'any', wrong: [{ v: red(F(k, den * maxW)), code: 'frline' }, { v: red(F(k, den + 1)), code: 'frline' }, { v: red(F(k + 1, den)), code: 'calc' }].filter(w => !U.eq(w.v, v)),
        hints: ['Na ile równych części podzielono odcinek od 0 do 1? To mianownik: ' + den + '.', 'Policz małe kroki od zera do strzałki: ' + k + '.', 'Strzałka wskazuje ' + k + '/' + den + (k > den ? ' = ' + Math.floor(k / den) + ' ' + (k % den) + '/' + den : '') + '.'], sol: ['Jedna działka = 1/' + den, k + ' ' + pl(k, 'działka', 'działki', 'działek') + ' → ' + k + '/' + den + (k % den === 0 ? ' = ' + k / den : k > den ? ' = ' + Math.floor(k / den) + ' ' + k % den + '/' + den : '')] };
    }
  });

  def('fr_whole', {
    name: 'Obliczanie całości, gdy dana jest jej część', grade: 6, mainCode: 'whole', prereq: ['fr_of'],
    types: { 1: ['input', 'choice'], 2: ['input', 'choice'], 3: ['input', 'choice'] },
    gen(r, d) {
      const den = r.int(2, 8), num = d === 1 ? 1 : r.int(2, den - 1 || 1) || 1; const unit = r.int(2, 12); const part = unit * num, whole = unit * den;
      if (U.gcd(num, den) !== 1) return this.gen(r, 1);
      const fr = U.fracM(num, den);
      const prompt = d === 3 ? 'Przeczytałem już ' + fr + ' książki, czyli ' + part * 10 + ' stron. Ile stron ma cała książka?' : fr + ' pewnej liczby to ' + part + '. Jaka to liczba?';
      const W = d === 3 ? whole * 10 : whole, Pt = d === 3 ? part * 10 : part, Un = d === 3 ? unit * 10 : unit;
      return { prompt, value: N(W), wrong: [{ v: red(F(Pt * num, den)), code: 'whole' }, { v: N(Pt * den), code: 'whole' }, { v: N(Pt + den), code: 'concept' }].filter(w => !U.eq(w.v, N(W))), hints: ['Znamy część (' + fr + '), szukamy całości – całość jest WIĘKSZA.', num > 1 ? 'Najpierw policz 1/' + den + ': ' + Pt + ' : ' + num + ' = ' + Un + '.' : '1/' + den + ' to ' + Pt + '.', 'Cała liczba to ' + den + ' takich części: ' + Un + ' · ' + den + '.'], sol: (num > 1 ? [Pt + ' : ' + num + ' = ' + Un + ' (to 1/' + den + ')'] : []).concat([Un + ' · ' + den + ' = ' + W]) };
    }
  });

  function longDivPeriod(n, dd) { // zwraca [część całkowita, cyfry przed okresem, okres]
    const ip = Math.floor(n / dd); let rem = n % dd; const seen = {}; let digits = ''; while (rem && !(rem in seen)) { seen[rem] = digits.length; rem *= 10; digits += Math.floor(rem / dd); rem %= dd; }
    if (!rem) return [ip, digits, '']; const st = seen[rem]; return [ip, digits.slice(0, st), digits.slice(st)];
  }
  const perStr = (n, d) => { const [ip, pre, per] = longDivPeriod(n, d); return ip + ',' + pre + (per ? '(' + per + ')' : ''); };
  def('dec_inf', {
    name: 'Rozwinięcia dziesiętne nieskończone okresowe', grade: 6, mainCode: 'period', prereq: ['dec_conv'],
    types: { 1: ['choice'], 2: ['choice'], 3: ['input', 'choice'] },
    gen(r, d) {
      if (d === 1) { const [n, dd] = r.pick([[1, 3], [2, 3], [1, 9], [4, 9], [1, 6], [5, 6], [1, 11], [7, 12], [5, 3], [7, 9]]); const s = perStr(n, dd); const [ip, pre, per] = longDivPeriod(n, dd);
        return ch(r, { prompt: 'Zapisz ' + U.fracM(n, dd) + ' w postaci ułamka dziesiętnego okresowego.', correct: s, wrong: [[ip + ',' + pre + per, 'period'], [ip + ',(' + pre + per + ')', 'period'], [ip + ',' + (pre + per).slice(0, 2), 'period'], ['0,' + n + dd, 'concept']], hints: ['Podziel licznik przez mianownik: ' + n + ' : ' + dd + '.', 'Dziel pisemnie, aż reszta zacznie się powtarzać.', 'Powtarzające się cyfry zapisz w nawiasie.'], sol: [n + ' : ' + dd + ' = ' + ip + ',' + pre + per + per + per + '…', '= ' + s] }); }
      if (d === 2) { const fin = r.pick([[3, 8], [7, 20], [9, 25], [3, 16], [11, 40], [1, 5]]); const inf = r.shuffle([[1, 3], [5, 6], [2, 7], [4, 15], [7, 12], [1, 9], [5, 11]]).slice(0, 3);
        return ch(r, { prompt: 'Który ułamek ma rozwinięcie dziesiętne <b>skończone</b>?', correct: U.fracM(fin[0], fin[1]), wrong: inf.map(f => [U.fracM(f[0], f[1]), 'period']), hints: ['Skróć ułamek i rozłóż mianownik na czynniki pierwsze.', 'Rozwinięcie jest skończone tylko wtedy, gdy w mianowniku są same dwójki i piątki.', fin[1] + ' = ' + (() => { let x = fin[1]; const f = []; while (x % 2 === 0) { f.push(2); x /= 2; } while (x % 5 === 0) { f.push(5); x /= 5; } return f.join(' · '); })() + '.'], sol: [U.fracM(fin[0], fin[1]) + ' = ' + fmtDec(F(fin[0], fin[1]))] }); }
      const [n, dd] = r.pick([[3, 11], [5, 11], [1, 7], [2, 7], [4, 33], [1, 27], [7, 11]]); const [ip, pre, per] = longDivPeriod(n, dd); const pos = r.int(8, 25); const dig = +per[(pos - 1 - pre.length) % per.length];
      return { prompt: 'Jaka cyfra stoi na ' + pos + '. miejscu po przecinku w rozwinięciu ' + U.fracM(n, dd) + ' = ' + perStr(n, dd) + '?', value: N(dig), wrong: [{ v: N(+per[pos % per.length]), code: 'period' }, { v: N(+per[0]), code: 'period' }].filter(w => w.v.n !== dig), hints: ['Okres ma ' + per.length + ' ' + pl(per.length, 'cyfrę', 'cyfry', 'cyfr') + ': ' + per + '.', 'Podziel ' + pos + ' przez ' + per.length + ' i spójrz na resztę.', 'Reszta ' + pos % per.length + (pos % per.length === 0 ? ' oznacza ostatnią cyfrę okresu' : ' oznacza ' + pos % per.length + '. cyfrę okresu') + '.'], sol: [pos + ' : ' + per.length + ' = ' + Math.floor(pos / per.length) + ' r. ' + pos % per.length, 'Cyfra: ' + dig] };
    }
  });

  def('mix_ops', {
    name: 'Wyrażenia z ułamkami zwykłymi i dziesiętnymi', grade: 6, mainCode: 'calc', prereq: ['dec_conv', 'fr_add_diff', 'fr_mul'],
    types: { 1: ['input', 'choice'], 2: ['input', 'choice'], 3: ['input', 'choice'] },
    gen(r, d) {
      const DEC = [[1, 2, '0,5'], [1, 4, '0,25'], [3, 4, '0,75'], [1, 5, '0,2'], [2, 5, '0,4'], [1, 10, '0,1'], [3, 10, '0,3'], [1, 8, '0,125']];
      const A = r.pick(DEC), B = r.pick([[1, 3], [2, 3], [1, 6], [5, 6], [1, 2], [3, 4], [1, 4]]); const a = F(A[0], A[1]), b = F(B[0], B[1]);
      if (d === 1) { const sub = r.chance(0.4) && U.val(a) > U.val(b); const v = sub ? U.sub(a, b) : U.add(a, b);
        return { prompt: 'Oblicz: ' + A[2] + (sub ? ' − ' : ' + ') + U.fracM(B[0], B[1]), value: v, form: 'any', wrong: [{ v: sub ? U.add(a, b) : U.sub(a, b), code: 'op_confuse' }, { v: red(F(A[0] + B[0], A[1] + B[1])), code: 'frac_add_both' }].filter(w => !U.eq(w.v, v)), hints: ['Zamień ułamek dziesiętny na zwykły: ' + A[2] + ' = ' + A[0] + '/' + A[1] + '.', 'Sprowadź do wspólnego mianownika.', 'Wynik możesz podać jako ułamek zwykły.'], sol: [A[2] + ' = ' + A[0] + '/' + A[1], fmtF(a) + (sub ? ' − ' : ' + ') + fmtF(b) + ' = ' + fmtF(v)] }; }
      if (d === 2) { const k = r.pick([2, 3, 4, 6, 12]); const v = U.mul(U.add(a, b), N(k));
        return { prompt: 'Oblicz: (' + A[2] + ' + ' + U.fracM(B[0], B[1]) + ') · ' + k, value: v, form: 'any', wrong: [{ v: U.add(a, U.mul(b, N(k))), code: 'order_ltr' }, { v: U.add(U.mul(a, N(k)), b), code: 'order_ltr' }].filter(w => !U.eq(w.v, v)), hints: ['Najpierw nawias.', A[2] + ' + ' + fmtF(b) + ' = ' + fmtF(U.add(a, b)) + '.', 'Teraz pomnóż przez ' + k + '.'], sol: [A[2] + ' + ' + fmtF(b) + ' = ' + fmtF(U.add(a, b)), fmtF(U.add(a, b)) + ' · ' + k + ' = ' + fmtF(v)] }; }
      const c = r.pick([[12, 10, '1,2'], [15, 10, '1,5'], [6, 10, '0,6'], [24, 10, '2,4'], [9, 10, '0,9']]); const C = F(c[0], c[1]); const q = r.pick([[3, 5], [3, 4], [2, 3], [1, 2], [3, 10]]); const Q = F(q[0], q[1]);
      const v = U.sub(U.div(C, Q), a); if (U.val(v) < 0) return this.gen(r, 2);
      return { prompt: 'Oblicz: ' + c[2] + ' : ' + U.fracM(q[0], q[1]) + ' − ' + A[2], value: v, form: 'any', wrong: [{ v: U.sub(U.mul(C, Q), a), code: 'frac_div_noinv' }, { v: U.eq(Q, a) ? U.add(v, N(1)) : U.div(C, U.sub(Q, a)), code: 'order_ltr' }].filter(w => !U.eq(w.v, v) && isFinite(U.val(w.v))), hints: ['Najpierw dzielenie, potem odejmowanie.', 'Dzielenie przez ułamek = mnożenie przez odwrotność: ' + c[2] + ' · ' + q[1] + '/' + q[0] + '.', c[2] + ' : ' + fmtF(Q) + ' = ' + fmtF(U.div(C, Q)) + '. Teraz odejmij ' + A[2] + '.'], sol: [c[2] + ' : ' + fmtF(Q) + ' = ' + fmtF(U.div(C, Q)), fmtF(U.div(C, Q)) + ' − ' + A[2] + ' = ' + fmtF(v)] };
    }
  });

  // ===================== CZWOROKĄTY, SIATKI, BRYŁY =====================
  def('quads', {
    name: 'Własności czworokątów', grade: 5, mainCode: 'quad_prop', prereq: ['ang_pairs'],
    types: { 1: ['choice'], 2: ['input', 'choice'], 3: ['input', 'choice'] },
    gen(r, d) {
      if (d === 1) { const Q = r.pick([['Każdy kwadrat jest prostokątem.', true], ['Każdy prostokąt jest kwadratem.', false], ['Każdy romb jest równoległobokiem.', true], ['Każdy kwadrat jest rombem.', true], ['Każdy trapez jest równoległobokiem.', false], ['Każdy równoległobok jest trapezem.', true], ['Każdy romb jest kwadratem.', false], ['Przekątne prostokąta mają równe długości.', true], ['Przekątne każdego rombu mają równe długości.', false]]);
        return ch(r, { prompt: 'Prawda czy fałsz? ' + Q[0], correct: Q[1] ? 'prawda' : 'fałsz', wrong: [[Q[1] ? 'fałsz' : 'prawda', 'quad_prop']], keepOrder: true, hints: ['Przypomnij sobie definicje: prostokąt ma 4 kąty proste, romb – 4 równe boki.', 'Kwadrat ma OBIE cechy – jest i prostokątem, i rombem.', 'Szukaj kontrprzykładu: jeśli znajdziesz jeden, zdanie „każdy…" jest fałszywe.'], sol: [Q[1] ? 'Prawda.' : 'Fałsz – istnieje kontrprzykład.'] }); }
      if (d === 2) { const a = r.int(7, 17) * 5;
        return { prompt: 'W równoległoboku jeden kąt ma ' + a + '°. Ile stopni ma kąt sąsiedni (przy tym samym boku)?', value: N(180 - a), unit: '°', wrong: [{ v: N(a), code: 'quad_prop' }, { v: N(360 - a), code: 'quad_prop' }, { v: N(90 - a > 0 ? 90 - a : 90 + a), code: 'quad_prop' }], hints: ['W równoległoboku kąty przy jednym boku są „przyległe" do siebie.', 'Suma kątów przy jednym boku równoległoboku to 180°.', '180 − ' + a + ' = ?'], sol: ['180° − ' + a + '° = ' + (180 - a) + '°'] }; }
      const a = r.int(50, 85), b = r.int(95, 130), c = r.int(60, 120); const dd = 360 - a - b - c; if (dd <= 20 || dd >= 180) return this.gen(r, 2);
      return { prompt: 'Trzy kąty czworokąta mają ' + a + '°, ' + b + '° i ' + c + '°. Ile stopni ma czwarty kąt?', value: N(dd), unit: '°', wrong: [{ v: N(180 - a - b - c > 0 ? 180 - a - b - c : 540 - a - b - c), code: 'ang_triangle' }, { v: N(dd + 10), code: 'calc' }], hints: ['Suma kątów w każdym czworokącie to 360°.', a + ' + ' + b + ' + ' + c + ' = ' + (a + b + c) + '°.', '360 − ' + (a + b + c) + ' = ?'], sol: [a + ' + ' + b + ' + ' + c + ' = ' + (a + b + c), '360 − ' + (a + b + c) + ' = ' + dd + '°'] };
    }
  });

  const NETS = { ok: [[[1, 0], [0, 1], [1, 1], [2, 1], [3, 1], [1, 2]], [[0, 0], [0, 1], [1, 1], [2, 1], [3, 1], [3, 2]], [[0, 0], [0, 1], [1, 1], [2, 1], [3, 1], [2, 2]], [[0, 0], [1, 0], [2, 0], [2, 1], [3, 1], [4, 1]], [[0, 0], [1, 0], [1, 1], [2, 1], [2, 2], [3, 2]], [[2, 0], [0, 1], [1, 1], [2, 1], [3, 1], [1, 2]]],
    bad: [[[0, 0], [1, 0], [2, 0], [0, 1], [1, 1], [2, 1]], [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [0, 1]], [[0, 0], [1, 0], [0, 1], [1, 1], [2, 1], [3, 1]], [[0, 0], [2, 0], [0, 1], [1, 1], [2, 1], [3, 1]], [[1, 0], [0, 1], [1, 1], [2, 1], [1, 2], [1, 3], ]].map(x => x.filter(Boolean)) };
  // ostatni „zły" to krzyż 3x? – sprawdzamy: [[1,0],[0,1],[1,1],[2,1],[1,2],[1,3]] to poprawna siatka (krzyż z dłuższym ramieniem) – dlatego przenosimy ją do poprawnych
  NETS.ok.push(NETS.bad.pop());
  function netSvg(cells, labels) { const s = 34; let b = ''; cells.forEach(([x, y], i) => { b += '<rect x="' + (8 + x * s) + '" y="' + (8 + y * s) + '" width="' + s + '" height="' + s + '" class="shape"/>'; if (labels) b += '<text x="' + (8 + x * s + s / 2) + '" y="' + (8 + y * s + s / 2 + 5) + '" text-anchor="middle" class="lb">' + labels[i] + '</text>'; });
    const w = Math.max(...cells.map(c => c[0])) + 1, h = Math.max(...cells.map(c => c[1])) + 1; return svgW(16 + w * s, 16 + h * s, b, 'siatka', 'width:' + Math.min(320, 40 + w * 44) + 'px'); }
  def('nets', {
    name: 'Siatki sześcianów i prostopadłościanów', grade: 5, mainCode: 'net', prereq: ['vol_box'],
    types: { 1: ['input', 'choice'], 2: ['choice'], 3: ['choice'] },
    gen(r, d) {
      if (d === 1) { const n = r.int(3, 8), what = r.pick([['ścian', n + 2], ['krawędzi', 3 * n], ['wierzchołków', 2 * n]]); const nm = { 3: 'trójkątny', 4: 'czworokątny', 5: 'pięciokątny', 6: 'sześciokątny', 7: 'siedmiokątny', 8: 'ośmiokątny' }[n];
        return { prompt: 'Ile ' + what[0] + ' ma graniastosłup ' + nm + '?', value: N(what[1]), wrong: [{ v: N(n), code: 'solid' }, { v: N(n + 1), code: 'solid' }, { v: N(2 * n + 2 === what[1] ? 3 * n : 2 * n + 2), code: 'solid' }].filter(w => w.v.n !== what[1]), hints: ['Graniastosłup ma dwie podstawy – ' + n + '-kąty.', what[0] === 'ścian' ? 'Ściany: 2 podstawy + ' + n + ' ścian bocznych.' : what[0] === 'krawędzi' ? 'Krawędzie: po ' + n + ' w każdej podstawie i ' + n + ' bocznych.' : 'Wierzchołki: po ' + n + ' w każdej podstawie.', 'Policz.'], sol: [what[0] === 'ścian' ? '2 + ' + n + ' = ' + (n + 2) : what[0] === 'krawędzi' ? n + ' + ' + n + ' + ' + n + ' = ' + 3 * n : n + ' + ' + n + ' = ' + 2 * n] }; }
      if (d === 2) { const ok = r.chance(0.55); const cells = r.pick(ok ? NETS.ok : NETS.bad);
        return ch(r, { prompt: 'Czy z tej siatki można złożyć sześcian?', visual: netSvg(cells), correct: ok ? 'tak' : 'nie', wrong: [[ok ? 'nie' : 'tak', 'net']], keepOrder: true, hints: ['Sześcian ma 6 ścian – siatka ma 6 kwadratów, ale to nie wystarczy.', 'Wybierz jeden kwadrat na dno i w myślach zaginaj pozostałe do góry.', 'Sprawdź, czy dwa kwadraty nie trafią na to samo miejsce (np. dwa wieczka).'], sol: [ok ? 'Tak – po zagięciu każda ściana trafia na inne miejsce.' : 'Nie – dwie ściany nachodzą na siebie, a jednej brakuje.'] }); }
      const cells = r.pick(NETS.ok.slice(0, 3).concat([NETS.ok[5]])); const L = 'ABCDEF'.split(''); const row = cells.filter(c => c[1] === 1).sort((a, b) => a[0] - b[0]); const flaps = cells.filter(c => c[1] !== 1);
      const idx = (c) => cells.indexOf(c); const opp = {}; opp[idx(row[0])] = idx(row[2]); opp[idx(row[2])] = idx(row[0]); opp[idx(row[1])] = idx(row[3]); opp[idx(row[3])] = idx(row[1]); opp[idx(flaps[0])] = idx(flaps[1]); opp[idx(flaps[1])] = idx(flaps[0]);
      const q = r.int(0, 5); const ans = L[opp[q]]; const others = L.filter((l, i) => i !== q && l !== ans);
      return ch(r, { prompt: 'Z siatki złożono sześcian. Która ściana będzie naprzeciwko ściany <b>' + L[q] + '</b>?', visual: netSvg(cells, L), correct: ans, wrong: others.map(o => [o, 'net']), hints: ['W pasku czterech kwadratów ściany co drugą są naprzeciwko siebie.', 'Dwa kwadraty poza paskiem (nad i pod nim) też są naprzeciwko siebie.', 'Ściana sąsiednia (stykająca się bokiem na siatce) nigdy nie jest naprzeciwko.'], sol: ['Naprzeciwko ' + L[q] + ' jest ściana ' + ans + '.'] });
    }
  });

  def('solids', {
    name: 'Rozpoznawanie brył', grade: 6, mainCode: 'solid', prereq: ['nets'],
    types: { 1: ['choice'], 2: ['input', 'choice'], 3: ['input', 'choice'] },
    gen(r, d) {
      if (d === 1) { const S = r.pick([['ma dwie podstawy w kształcie koła i powierzchnię boczną zakrzywioną', 'walec'], ['ma jedną podstawę w kształcie koła i wierzchołek', 'stożek'], ['nie ma żadnych krawędzi ani wierzchołków – każdy punkt powierzchni jest tak samo odległy od środka', 'kula'], ['ma dwie jednakowe podstawy-wielokąty i ściany boczne będące prostokątami', 'graniastosłup'], ['ma jedną podstawę-wielokąt, a ściany boczne są trójkątami o wspólnym wierzchołku', 'ostrosłup']]);
        return ch(r, { prompt: 'Jaka to bryła? Bryła ' + S[0] + '.', correct: S[1], wrong: ['walec', 'stożek', 'kula', 'graniastosłup', 'ostrosłup'].filter(x => x !== S[1]).map(x => [x, 'solid']), hints: ['Bryły „obrotowe" (walec, stożek, kula) mają powierzchnie zakrzywione.', 'Graniastosłup – dwie podstawy; ostrosłup – jedna podstawa i wierzchołek.', 'Dopasuj opis krok po kroku.'], sol: ['To ' + S[1] + '.'] }); }
      const n = r.int(3, 8), what = r.pick([['ścian', n + 1], ['krawędzi', 2 * n], ['wierzchołków', n + 1]]); const nm = { 3: 'trójkątny', 4: 'czworokątny', 5: 'pięciokątny', 6: 'sześciokątny', 7: 'siedmiokątny', 8: 'ośmiokątny' }[n];
      if (d === 2) return { prompt: 'Ile ' + what[0] + ' ma ostrosłup ' + nm + '?', value: N(what[1]), wrong: [{ v: N(what[0] === 'krawędzi' ? 3 * n : n + 2), code: 'solid' }, { v: N(n), code: 'solid' }].filter(w => w.v.n !== what[1]), hints: ['Ostrosłup ma JEDNĄ podstawę (' + n + '-kąt) i wierzchołek.', what[0] === 'ścian' ? 'Ściany: podstawa + ' + n + ' trójkątów.' : what[0] === 'krawędzi' ? 'Krawędzie: ' + n + ' w podstawie i ' + n + ' bocznych.' : 'Wierzchołki: ' + n + ' w podstawie i 1 na górze.', 'Policz.'], sol: [what[0] === 'krawędzi' ? n + ' + ' + n + ' = ' + 2 * n : n + ' + 1 = ' + (n + 1)] };
      const k = r.pick([[6, 'graniastosłup', 4], [8, 'ostrosłup', 4], [9, 'graniastosłup', 3], [12, 'graniastosłup', 4], [10, 'ostrosłup', 5], [18, 'graniastosłup', 6], [12, 'ostrosłup', 6]]);
      const isP = k[1] === 'graniastosłup';
      return { prompt: k[1].charAt(0).toUpperCase() + k[1].slice(1) + ' ma ' + k[0] + ' krawędzi. Ile wierzchołków ma jego podstawa?', value: N(k[2]), wrong: [{ v: N(isP ? k[0] / 2 : k[0] / 3), code: 'solid' }, { v: N(k[0]), code: 'read' }].filter(w => Number.isInteger(w.v.n) && w.v.n !== k[2]), hints: [isP ? 'Graniastosłup n-kątny ma 3n krawędzi.' : 'Ostrosłup n-kątny ma 2n krawędzi.', isP ? k[0] + ' : 3 = ?' : k[0] + ' : 2 = ?', 'Tyle ma wierzchołków podstawa.'], sol: [(isP ? k[0] + ' : 3 = ' : k[0] + ' : 2 = ') + k[2]] };
    }
  });

  // ===================== PRĘDKOŚĆ, DANE =====================
  def('speed_units', {
    name: 'Zamiana km/h na m/s', grade: 6, mainCode: 'kmh', prereq: ['speed'],
    types: { 1: ['input', 'choice'], 2: ['input', 'choice'], 3: ['input', 'choice'] },
    gen(r, d) {
      if (d === 1) { const v = r.pick([6, 12, 30, 60, 90, 120]);
        return { prompt: 'Samochód jedzie z prędkością ' + v + ' km/h. Ile metrów przejeżdża w ciągu 1 minuty?', value: N(v * 1000 / 60), unit: 'm', wrong: [{ v: N(v * 1000), code: 'kmh' }, { v: N(v / 60 * 100), code: 'units' }].filter(w => Number.isInteger(w.v.n)), hints: ['1 km = 1000 m, 1 h = 60 min.', 'W godzinę: ' + v + ' km = ' + sp(v * 1000) + ' m.', sp(v * 1000) + ' : 60 = ?'], sol: [v + ' km/h = ' + sp(v * 1000) + ' m na 60 min', sp(v * 1000) + ' : 60 = ' + v * 1000 / 60 + ' m/min'] }; }
      if (d === 2) { const ms = r.int(1, 8) * 5; const kmh = ms * 3.6; const k10 = Math.round(kmh * 10);
        return { prompt: 'Zamień ' + dz(k10, 1) + ' km/h na m/s.', value: N(ms), unit: 'm/s', wrong: [{ v: fromDec(Math.round(kmh * 36), 1), code: 'kmh' }, { v: fromDec(Math.round(kmh * 100 / 6), 1), code: 'kmh' }].filter(w => !U.eq(w.v, N(ms))), hints: ['1 km/h = 1000 m : 3600 s.', 'Z km/h na m/s dzielimy przez 3,6.', dz(k10, 1) + ' : 3,6 = ?'], sol: [dz(k10, 1) + ' : 3,6 = ' + ms + ' m/s'] }; }
      const ms = r.int(2, 30);
      return { prompt: 'Biegacz biegnie z prędkością ' + ms + ' m/s. Ile to km/h?', value: fromDec(ms * 36, 1), dec: true, unit: 'km/h', wrong: [{ v: fromDec(Math.round(ms * 100 / 3.6), 2), code: 'kmh' }, { v: N(ms * 60), code: 'kmh' }], hints: ['W 1 s – ' + ms + ' m, w 1 h (3600 s) – ' + ms + ' · 3600 m.', 'Z m/s na km/h mnożymy przez 3,6.', ms + ' · 3,6 = ?'], sol: [ms + ' · 3,6 = ' + dz(ms * 36, 1) + ' km/h'] };
    }
  });

  function tallySvg(rows) { // [[etykieta, liczba]]
    let s = ''; rows.forEach(([l, n], i) => { const y = 24 + i * 34; s += '<text x="8" y="' + (y + 5) + '" class="lb">' + l + '</text>'; let x = 120; for (let g = 0; g < Math.floor(n / 5); g++) { for (let k = 0; k < 4; k++) s += '<line x1="' + (x + k * 7) + '" y1="' + (y - 11) + '" x2="' + (x + k * 7) + '" y2="' + (y + 11) + '" class="ln"/>'; s += '<line x1="' + (x - 4) + '" y1="' + (y + 8) + '" x2="' + (x + 25) + '" y2="' + (y - 8) + '" class="ln"/>'; x += 42; } for (let k = 0; k < n % 5; k++) s += '<line x1="' + (x + k * 7) + '" y1="' + (y - 11) + '" x2="' + (x + k * 7) + '" y2="' + (y + 11) + '" class="ln"/>'; });
    return svgW(340, 20 + rows.length * 34, s, 'tabela z kreskami', 'width:min(360px,100%)'); }
  def('data_collect', {
    name: 'Gromadzenie danych, tabele i diagramy', grade: 6, mainCode: 'tally', prereq: ['data_read'],
    types: { 1: ['input', 'choice'], 2: ['input', 'choice'], 3: ['input', 'choice'] },
    gen(r, d) {
      const ctx = MP.th().chart; const labs = ctx.l.slice(0, 4); const vals = labs.map(() => r.int(3, 17)); const rows = labs.map((l, i) => [l, vals[i]]); const vis = tallySvg(rows);
      const i = r.int(0, labs.length - 1); const what = ctx.t.replace(/^Diagram pokazuje,?\s*/, '').replace(/\.$/, ''); const intro = 'W tabeli zapisano kreskami' + (/^ile/.test(what) ? ', ' : ' ') + what + ' (każda przekreślona grupa to 5). ';
      if (d === 1) return { prompt: intro + 'Ile kresek jest w wierszu „' + labs[i] + '"?', visual: vis, value: N(vals[i]), wrong: [{ v: N(Math.floor(vals[i] / 5) * 4 + vals[i] % 5), code: 'tally' }, { v: N(Math.floor(vals[i] / 5) + vals[i] % 5), code: 'tally' }].filter(w => w.v.n !== vals[i]), hints: ['Każda grupa z przekreśleniem to 5 głosów.', 'Policz grupy i pomnóż przez 5.', 'Dolicz pojedyncze kreski.'], sol: [Math.floor(vals[i] / 5) + ' · 5 + ' + vals[i] % 5 + ' = ' + vals[i]] };
      const tot = vals.reduce((a, b) => a + b, 0);
      if (d === 2) return { prompt: intro + 'Ile kresek jest razem we wszystkich wierszach?', visual: vis, value: N(tot), wrong: [{ v: N(tot - vals[0]), code: 'read' }, { v: N(labs.length), code: 'read' }], hints: ['Policz głosy w każdym wierszu.', 'Głosy: ' + vals.slice(0, 2).join(', ') + '…', 'Dodaj wszystkie wiersze.'], sol: [vals.join(' + ') + ' = ' + tot] };
      const mx = Math.max(...vals); const top = vals.indexOf(mx); const second = Math.max(...vals.filter((v, k) => k !== top));
      return { prompt: intro + 'O ile więcej kresek jest w wierszu z największym wynikiem („' + labs[top] + '") niż w wierszu z drugim wynikiem?', visual: vis, value: N(mx - second), wrong: [{ v: N(mx), code: 'read' }, { v: N(mx - Math.min(...vals)), code: 'read' }].filter(w => w.v.n !== mx - second), hints: ['Policz głosy w każdym wierszu.', 'Najwięcej: ' + mx + '. Drugi wynik: ' + second + '.', mx + ' − ' + second + ' = ?'], sol: [mx + ' − ' + second + ' = ' + (mx - second)] };
    }
  });
})(MP);
