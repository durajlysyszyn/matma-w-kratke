/* gens_k13.js — generatory dla klasy 1 (edukacja matematyczna, nowa podstawa 2026: liczby do 20, dziesiątki do 100)
   i klasy 3 (podstawa 2017: liczby do 1000, mnożenie i dzielenie do 100) oraz wspólne pomocnicze funkcje MP.gx. */
var MP = (typeof window !== 'undefined' ? window : globalThis).MP;
(function (MP) {
  const U = MP.util, { F, pl } = U;
  const SK = MP.SK, def = (id, o) => { o.id = id; SK[id] = o; };
  const N = (n) => F(n, 1);
  const KIDS = [['Ola', 'f'], ['Kuba', 'm'], ['Zosia', 'f'], ['Antek', 'm'], ['Hania', 'f'], ['Staś', 'm'], ['Lena', 'f'], ['Franek', 'm'], ['Maja', 'f'], ['Tymek', 'm']];
  const vg = (g, m, f) => g === 'f' ? f : m;
  const nouns = () => (MP.th().k2t) || MP.THEMES.szkola.k2t;

  // ---------- wspólne pomocnicze ----------
  // zadanie wyboru z gotowymi etykietami (tekst, wyrażenia, π, pierwiastki…)
  function ch(r, o) {
    const seen = new Set([U.plain(o.correct)]); const opts = [{ label: o.correct, ok: true }];
    for (const [l, code] of r.shuffle(o.wrong || [])) { const p = U.plain(String(l)); if (seen.has(p)) continue; seen.add(p); opts.push({ label: String(l), code: code || 'unknown' }); if (opts.length >= (o.max || 4)) break; }
    const sh = o.keepOrder ? opts : r.shuffle(opts);
    return { type: 'choice', prompt: o.prompt, visual: o.visual, inline: o.inline, options: sh, answer: { kind: 'choice', correct: sh.findIndex(x => x.ok) }, hints: o.hints, sol: o.sol };
  }
  // porównanie dwóch wartości liczbowych znakiem <, >, =
  function cmpSign(r, a, b, la, lb, hints, sol, swapCode) {
    const c = a < b ? 0 : a > b ? 1 : 2, S = ['<', '>', '='];
    const opts = S.map((s, i) => ({ label: s, ok: i === c, code: i === c ? null : (i === 2 ? 'calc' : (swapCode || 'cmp_sign')) }));
    return { type: 'choice', prompt: 'Wstaw znak: ' + la + ' □ ' + lb, inline: true, options: opts, answer: { kind: 'choice', correct: c }, hints, sol: [la + ' ' + S[c] + ' ' + lb].concat(sol || []) };
  }
  const svgW = (w, h, body, label, style) => '<svg viewBox="0 0 ' + w + ' ' + h + '" class="vis geo"' + (style ? ' style="' + style + '"' : '') + ' role="img" aria-label="' + label + '">' + body + '</svg>';
  function frameSvg(n) { // kropki w ramkach po 5 (jak „ramka dziesiątki")
    let s = ''; const rows = Math.ceil(n / 10);
    for (let k = 0; k < n; k++) { const row = Math.floor(k / 10), col = k % 10, x = 16 + col * 26 + (col >= 5 ? 10 : 0), y = 16 + row * 28; s += '<circle cx="' + x + '" cy="' + y + '" r="10" class="barc"/>'; }
    return svgW(290, rows * 28 + 6, s, n + ' kropek', 'width:min(300px,100%)');
  }
  function tensSvg(t, u) {
    let s = ''; for (let i = 0; i < t; i++) for (let k = 0; k < 10; k++) s += '<rect x="' + (10 + i * 22) + '" y="' + (10 + k * 13) + '" width="16" height="11" rx="2" class="barc"/>';
    for (let j = 0; j < u; j++) s += '<rect x="' + (20 + t * 22 + (j % 3) * 18) + '" y="' + (106 - Math.floor(j / 3) * 18) + '" width="14" height="14" rx="2" class="sh"/>';
    return svgW(30 + t * 22 + 60, 140, s, t + ' dziesiątek i ' + u + ' jedności');
  }
  MP.gx = { ch, cmpSign, svgW, KIDS, vg, nouns };

  Object.assign(MP.ERR, {
    cmp_sign: { cat: 'zasada', title: 'Odwrócony znak nierówności', kid: 'Dzióbek znaku < lub > zawsze wskazuje mniejszą liczbę, a otwarta strona – większą.', remedy: 'k1_cmp' },
    k1_count: { cat: 'rachunek', title: 'Pomyłka w liczeniu', kid: 'Licz po kolei i dotykaj palcem każdej kropki tylko raz. Pomaga liczenie piątkami: w rzędzie są dwie piątki.', remedy: 'k1_count' },
    k1_ten: { cat: 'zasada', title: 'Błąd przy przekraczaniu dziesiątki', kid: 'Najpierw dopełnij do 10, a potem dodaj resztę: 8 + 5 = 8 + 2 + 3 = 13.', remedy: 'k1_add', alt: 'Wyobraź sobie ramkę na 10 kropek. Zapełnij ją do końca, a to, co zostało, połóż obok. Ile w pełnej ramce i obok?' },
    k1_tens: { cat: 'zasada', title: 'Pomylone dziesiątki i jedności', kid: '30 to trzy dziesiątki. 30 + 40 to 3 dziesiątki i 4 dziesiątki, czyli 7 dziesiątek = 70.', remedy: 'k1_tens' },
    k1_half: { cat: 'zasada', title: 'Pomylona połowa', kid: 'Połowa to jedna z DWÓCH równych części. Ćwiartka – jedna z CZTERECH równych części.', remedy: 'k1_half' },
    k1_hour: { cat: 'zasada', title: 'Pomylone wskazówki zegara', kid: 'Mała wskazówka pokazuje godzinę. Duża na 12 oznacza pełną godzinę.', remedy: 'k1_clock' },
    k1_len: { cat: 'zasada', title: 'Pomylone jednostki', kid: '1 metr to 100 centymetrów. Metr to mniej więcej jeden duży krok dorosłego.', remedy: 'k1_meas' },
    k1_pattern: { cat: 'zasada', title: 'Nieodkryta reguła', kid: 'Znajdź fragment, który się powtarza – jak w rytmie piosenki. Potem powtarzaj go dalej.', remedy: 'k1_pattern' },
    k3_place: { cat: 'zasada', title: 'Pomylone setki, dziesiątki i jedności', kid: 'W liczbie trzycyfrowej pierwsza cyfra to setki, druga – dziesiątki, trzecia – jedności. 405 to 4 setki, 0 dziesiątek i 5 jedności.', remedy: 'k3_num', alt: 'Wyobraź sobie banknoty: setki to stówki, dziesiątki to dziesięciozłotówki, jedności to złotówki. 405 zł to 4 stówki i 5 złotówek – dziesiątek brak, dlatego w środku jest 0.' },
    k3_box: { cat: 'zasada', title: 'Złe działanie odwrotne', kid: 'Żeby znaleźć liczbę w okienku, użyj działania odwrotnego: dodawanie ↔ odejmowanie, mnożenie ↔ dzielenie. Potem wstaw wynik i sprawdź.', remedy: 'k3_box' },
    k3_times: { cat: 'zasada', title: '„Ile razy więcej" policzone jak „o ile więcej"', kid: '„O ile więcej" – odejmujemy. „Ile razy więcej" – dzielimy.', remedy: 'k3_word' },
    k3_min: { cat: 'zasada', title: 'Godzina liczona jak 100 minut', kid: 'Godzina ma 60 minut, a nie 100. Od 8:50 do 9:10 mija 20 minut.', remedy: 'k3_clock' },
    k3_unit: { cat: 'zasada', title: 'Zły przelicznik jednostek', kid: '1 cm = 10 mm, 1 m = 100 cm, 1 km = 1000 m, 1 kg = 100 dag, 1 dag = 10 g.', remedy: 'k3_units' },
    k3_month: { cat: 'zasada', title: 'Zła liczba dni w miesiącu', kid: 'Miesiące mają 30 lub 31 dni, luty – 28 (w roku przestępnym 29). Policz na knykciach: knykieć = 31 dni.', remedy: 'k3_cal' },
    k3_gr: { cat: 'zasada', title: 'Pomylone złote i grosze', kid: '1 zł = 100 gr. Gdy groszy uzbiera się 100 lub więcej, zamień 100 gr na 1 zł.', remedy: 'k3_money' },
    roman: { cat: 'zasada', title: 'Błąd w zapisie rzymskim', kid: 'Mniejsza cyfra PRZED większą odejmuje się (IV = 5 − 1), a ZA większą – dodaje (VI = 5 + 1). Tej samej cyfry piszemy najwyżej trzy razy z rzędu.', remedy: 'nat_roman', alt: 'Czytaj od lewej i pilnuj par: jeśli cyfra jest mniejsza od następnej, odejmij ją. XIV = X + IV = 10 + 4 = 14.' },
    temp: { cat: 'zasada', title: 'Błąd przy odczycie temperatury', kid: 'Sprawdź, co ile stopni są kreski na termometrze. Poniżej zera temperatura jest ujemna (−3°C to 3 stopnie mrozu).', remedy: 'temp' },
    sym_axis: { cat: 'zasada', title: 'Źle wskazana oś symetrii', kid: 'Oś symetrii dzieli figurę na dwie części, które po złożeniu dokładnie się pokrywają – jak lustrzane odbicie.', remedy: 'symmetry' }
  });

  // ===================== KLASA 1 =====================
  def('k1_count', {
    name: 'Liczenie i zapisywanie liczb', grade: 1, mainCode: 'k1_count',
    types: { 1: ['input', 'choice'], 2: ['input', 'choice'], 3: ['input', 'choice'] },
    gen(r, d) {
      if (d < 3) { const n = d === 1 ? r.int(3, 10) : r.int(11, 20);
        return { prompt: 'Ile jest kropek?', visual: frameSvg(n), value: N(n), wrong: [{ v: N(n + 1), code: 'k1_count' }, { v: N(n - 1), code: 'k1_count' }, { v: N(n > 10 ? n - 10 : n + 5), code: 'k1_count' }],
          hints: ['Licz po kolei, dotykając każdej kropki palcem.', 'W każdym rzędzie są dwie grupy po 5 kropek.', n > 10 ? 'Pierwszy rząd to 10 kropek. Dolicz te z drugiego rzędu.' : 'Policz pełne piątki, a potem dolicz resztę.'], sol: ['Kropek jest ' + n + '.'] }; }
      const t = r.int(2, 9), u = r.int(0, 9), n = t * 10 + u;
      return { prompt: 'Ile kostek jest na rysunku? Każdy słupek to 10 kostek.', visual: tensSvg(t, u), value: N(n), wrong: [{ v: N(u * 10 + t), code: 'k1_tens' }, { v: N(t + u), code: 'k1_tens' }, { v: N(n + 10), code: 'k1_count' }],
        hints: ['Policz słupki – każdy to 10.', t + ' ' + pl(t, 'słupek', 'słupki', 'słupków') + ' to ' + t * 10 + '.', 'Dolicz pojedyncze kostki: ' + u + '.'], sol: [t + ' dziesiątek = ' + t * 10, t * 10 + ' + ' + u + ' = ' + n] };
    },
    why: [{ q: 'Dlaczego warto układać kropki w rzędy po 10?', opts: [{ t: 'Bo łatwiej je szybko policzyć – od razu widać pełną dziesiątkę', ok: true }, { t: 'Bo wtedy jest ich więcej', code: 'k1_count' }, { t: 'Nie ma to znaczenia', code: 'concept' }], expl: 'Ułożenie nie zmienia liczby kropek, ale pomaga liczyć: pełny rząd to od razu 10.' }]
  });

  def('k1_cmp', {
    name: 'Porównywanie liczb', grade: 1, mainCode: 'cmp_sign', prereq: ['k1_count'],
    types: { 1: ['choice'], 2: ['choice'], 3: ['choice'] },
    gen(r, d) {
      let a, b;
      if (d === 1) { a = r.int(1, 10); b = r.chance(0.15) ? a : r.int(1, 10); }
      else if (d === 2) { a = r.int(5, 20); b = r.chance(0.15) ? a : r.int(5, 20); }
      else { a = r.int(1, 9) * 10; b = r.chance(0.15) ? a : r.int(1, 9) * 10; }
      return cmpSign(r, a, b, String(a), String(b), ['Która liczba jest większa? Pomyśl, który zbiór ma więcej elementów.', 'Dzióbek znaku wskazuje mniejszą liczbę, a otwarta strona – większą.', a === b ? 'Liczby są takie same.' : 'Większa jest liczba ' + Math.max(a, b) + '.'], []);
    },
    why: [{ q: 'Co znaczy zapis 7 > 4?', opts: [{ t: '7 jest większe niż 4', ok: true }, { t: '7 jest mniejsze niż 4', code: 'cmp_sign' }, { t: '7 równa się 4', code: 'concept' }], expl: 'Znak > czytamy „jest większe niż". Otwarta strona znaku stoi przy większej liczbie.' }]
  });

  function addSub(r, d, sub) {
    let a, b;
    if (d === 1) { if (sub) { a = r.int(3, 10); b = r.int(1, a - 1); } else { a = r.int(1, 8); b = r.int(1, 10 - a); } }
    else if (d === 2) { if (sub) { a = r.int(13, 19); b = r.int(1, a % 10); } else { a = r.int(11, 17); b = r.int(1, 19 - a); if (a % 10 + b > 9) b = 9 - a % 10 || 1; } }
    else { if (sub) { a = r.int(11, 18); b = r.int(a % 10 + 1, 9); } else { a = r.int(3, 9); b = r.int(11 - a, 9); } }
    const v = sub ? a - b : a + b;
    const cross = d === 3;
    const hints = sub
      ? (cross ? ['Odejmij najpierw tyle, żeby dojść do 10.', a + ' − ' + (a - 10) + ' = 10.', 'Teraz odejmij resztę: 10 − ' + (b - (a - 10)) + '.'] : ['Odliczaj do tyłu od ' + a + '.', 'Możesz narysować ' + a + ' kresek i skreślić ' + b + '.', 'Sprawdź dodawaniem: wynik + ' + b + ' = ' + a + '?'])
      : (cross ? ['Dopełnij do 10: ' + a + ' + ' + (10 - a) + ' = 10.', 'Z liczby ' + b + ' zostało jeszcze ' + (b - (10 - a)) + '.', '10 + ' + (b - (10 - a)) + ' = ?'] : ['Zacznij od większej liczby i dolicz mniejszą.', 'Możesz liczyć na palcach albo na kropkach.', a + ' + ' + b + ' = ?']);
    const sol = sub ? (cross ? [a + ' − ' + (a - 10) + ' = 10', '10 − ' + (b - (a - 10)) + ' = ' + v] : [a + ' − ' + b + ' = ' + v]) : (cross ? [a + ' + ' + (10 - a) + ' = 10', '10 + ' + (b - (10 - a)) + ' = ' + v] : [a + ' + ' + b + ' = ' + v]);
    const wrong = [{ v: N(sub ? a + b : Math.abs(a - b)), code: 'op_confuse' }, { v: N(cross ? (sub ? v + 10 : v - 10) : v + 1), code: cross ? 'k1_ten' : 'calc' }];
    return { prompt: 'Oblicz: ' + a + (sub ? ' − ' : ' + ') + b, value: N(v), wrong: wrong.filter(w => w.v.n >= 0), hints, sol };
  }
  def('k1_add', {
    name: 'Dodawanie w zakresie 20', grade: 1, mainCode: 'k1_ten', prereq: ['k1_count'],
    types: { 1: ['input', 'choice'], 2: ['input', 'choice'], 3: ['input', 'choice'] },
    gen: (r, d) => addSub(r, d, false),
    why: [{ q: 'Jak najłatwiej policzyć 8 + 5?', opts: [{ t: 'Dopełnić do 10 (8 + 2), a potem dodać resztę (3)', ok: true }, { t: 'Dodać 8 i 5 jako 85', code: 'k1_tens' }, { t: 'Odjąć 5 od 8', code: 'op_confuse' }], expl: '8 + 5 = 8 + 2 + 3 = 10 + 3 = 13. Pełna dziesiątka bardzo ułatwia liczenie.' }]
  });
  def('k1_sub', {
    name: 'Odejmowanie w zakresie 20', grade: 1, mainCode: 'k1_ten', prereq: ['k1_add'],
    types: { 1: ['input', 'choice'], 2: ['input', 'choice'], 3: ['input', 'choice'] },
    gen: (r, d) => addSub(r, d, true),
    why: [{ q: 'Jak sprawdzić, że 15 − 7 = 8?', opts: [{ t: 'Dodać: 8 + 7 = 15', ok: true }, { t: 'Odjąć jeszcze raz: 8 − 7', code: 'op_confuse' }, { t: 'Nie da się sprawdzić', code: 'concept' }], expl: 'Odejmowanie sprawdzamy dodawaniem: wynik + to, co odjęliśmy = to, od czego odejmowaliśmy.' }]
  });

  def('k1_tens', {
    name: 'Dziesiątki do 100', grade: 1, mainCode: 'k1_tens', prereq: ['k1_count'],
    types: { 1: ['input', 'choice'], 2: ['input', 'choice'], 3: ['input', 'choice'] },
    gen(r, d) {
      if (d === 3) { const t = r.int(1, 9), u = r.int(1, 9);
        return { prompt: 'Jaka to liczba: ' + t + ' ' + pl(t, 'dziesiątka', 'dziesiątki', 'dziesiątek') + ' i ' + u + ' ' + pl(u, 'jedność', 'jedności', 'jedności') + '?', visual: tensSvg(t, u), value: N(t * 10 + u), wrong: [{ v: N(u * 10 + t), code: 'k1_tens' }, { v: N(t + u), code: 'k1_tens' }],
          hints: [t + ' ' + pl(t, 'dziesiątka', 'dziesiątki', 'dziesiątek') + ' to ' + t * 10 + '.', 'Do ' + t * 10 + ' dodaj ' + u + '.', 'Pierwsza cyfra liczby to dziesiątki, druga – jedności.'], sol: [t * 10 + ' + ' + u + ' = ' + (t * 10 + u)] }; }
      const sub = d === 2 && r.chance(0.5);
      let a, b; if (sub) { a = r.int(3, 10); b = r.int(1, a - 1); } else { a = r.int(1, 8); b = r.int(1, 9 - a); }
      const v = sub ? a - b : a + b;
      return { prompt: 'Oblicz: ' + a * 10 + (sub ? ' − ' : ' + ') + b * 10, value: N(v * 10), wrong: [{ v: N(v), code: 'k1_tens' }, { v: N(sub ? (a + b) * 10 : Math.abs(a - b) * 10), code: 'op_confuse' }].filter(w => w.v.n > 0),
        hints: [a * 10 + ' to ' + a + ' ' + pl(a, 'dziesiątka', 'dziesiątki', 'dziesiątek') + ', a ' + b * 10 + ' to ' + b + ' ' + pl(b, 'dziesiątka', 'dziesiątki', 'dziesiątek') + '.', 'Policz dziesiątki: ' + a + (sub ? ' − ' : ' + ') + b + ' = ' + v + '.', v + ' ' + pl(v, 'dziesiątka', 'dziesiątki', 'dziesiątek') + ' to liczba z zerem na końcu.'], sol: [a + (sub ? ' − ' : ' + ') + b + ' = ' + v + ' (dziesiątki)', a * 10 + (sub ? ' − ' : ' + ') + b * 10 + ' = ' + v * 10] };
    }
  });

  def('k1_box', {
    name: 'Okienka', grade: 1, mainCode: 'k3_box', prereq: ['k1_add', 'k1_sub'],
    types: { 1: ['fill', 'input'], 2: ['fill', 'input'], 3: ['fill', 'input'] },
    gen(r, d) {
      const max = d === 1 ? 10 : 20; const a = r.int(1, max - 2), b = r.int(1, max - a), s = a + b;
      const k = d === 1 ? r.pick([0, 1]) : r.pick([0, 1, 2, 3]);
      const forms = [[a + ' + □ = ' + s, b, [s + a, s]], ['□ + ' + b + ' = ' + s, a, [s + b, s]], [s + ' − □ = ' + a, b, [s + a, a]], ['□ − ' + b + ' = ' + a, s, [a - b, b]]];
      const [p, v, w] = forms[k];
      return { prompt: p, fill: true, value: N(v), wrong: w.filter(x => x >= 0 && x !== v).map(x => ({ v: N(x), code: 'k3_box' })),
        hints: ['Jaka liczba pasuje do okienka? Spróbuj wstawić kilka liczb.', k < 2 ? 'Możesz odjąć: ' + s + ' − ' + (k === 0 ? a : b) + '.' : k === 2 ? 'Ile trzeba zabrać z ' + s + ', żeby zostało ' + a + '?' : 'Od jakiej liczby odjęto ' + b + ' i zostało ' + a + '? Dodaj: ' + a + ' + ' + b + '.', 'Wstaw swoją liczbę w okienko i sprawdź, czy działanie się zgadza.'], sol: ['□ = ' + v, p.replace('□', String(v)) + ' ✓'] };
    }
  });

  def('k1_word', {
    name: 'Zadania z treścią do 20', grade: 1, mainCode: 'op_confuse', prereq: ['k1_add', 'k1_sub'],
    types: { 1: ['input', 'choice'], 2: ['input', 'choice'], 3: ['input', 'choice'] },
    gen(r, d) {
      const T = nouns(), [nm, g] = r.pick(KIDS), t = (n) => n + ' ' + pl(n, T[0], T[1], T[2]);
      const op = d === 1 ? 'add' : d === 2 ? r.pick(['add', 'sub']) : r.pick(['sub', 'cmp']);
      if (op === 'add') { const a = r.int(2, d === 1 ? 7 : 12), b = r.int(2, (d === 1 ? 10 : 20) - a); const s = a + b;
        return { prompt: nm + ' ' + vg(g, 'miał', 'miała') + ' ' + t(a) + '. ' + vg(g, 'Dostał', 'Dostała') + ' jeszcze ' + t(b) + '. Ile ' + T[2] + ' ma teraz?', value: N(s), wrong: [{ v: N(Math.abs(a - b)), code: 'op_confuse' }, { v: N(s + 1), code: 'calc' }], hints: ['Czy teraz ma więcej, czy mniej? Więcej – dodajemy.', 'Działanie: ' + a + ' + ' + b + '.', 'Możesz narysować kółka i je policzyć.'], sol: [a + ' + ' + b + ' = ' + s, 'Odpowiedź: ' + nm + ' ma ' + t(s) + '.'] }; }
      if (op === 'sub') { const a = r.int(8, 20), b = r.int(2, a - 2); const v = a - b;
        return { prompt: nm + ' ' + vg(g, 'miał', 'miała') + ' ' + t(a) + '. ' + vg(g, 'Oddał', 'Oddała') + ' ' + t(b) + '. Ile ' + T[2] + ' ' + vg(g, 'mu', 'jej') + ' zostało?', value: N(v), wrong: [{ v: N(a + b), code: 'op_confuse' }, { v: N(v + 1), code: 'calc' }], hints: ['Zostało więcej czy mniej? Mniej – odejmujemy.', 'Działanie: ' + a + ' − ' + b + '.', 'Sprawdź: wynik + ' + b + ' = ' + a + '?'], sol: [a + ' − ' + b + ' = ' + v, 'Odpowiedź: zostało ' + t(v) + '.'] }; }
      const [nm2] = r.pick(KIDS.filter(k => k[0] !== nm)); const a = r.int(9, 20), b = r.int(2, a - 2);
      return { prompt: nm + ' ma ' + t(a) + ', a ' + nm2 + ' – ' + t(b) + '. O ile więcej ' + T[2] + ' ma ' + nm + '?', value: N(a - b), wrong: [{ v: N(a + b), code: 'op_confuse' }, { v: N(a), code: 'read' }], hints: ['„O ile więcej" – sprawdzamy różnicę, czyli odejmujemy.', 'Działanie: ' + a + ' − ' + b + '.', 'Ile trzeba dodać do ' + b + ', żeby było ' + a + '?'], sol: [a + ' − ' + b + ' = ' + (a - b), 'Odpowiedź: o ' + (a - b) + '.'] };
    }
  });

  def('k1_half', {
    name: 'Połowa i ćwiartka', grade: 1, mainCode: 'k1_half', prereq: ['k1_count'],
    types: { 1: ['input', 'choice'], 2: ['input', 'choice'], 3: ['input', 'choice'] },
    gen(r, d) {
      const T = nouns();
      if (d < 3) { const n = 2 * r.int(d === 1 ? 1 : 3, d === 1 ? 5 : 10);
        return { prompt: 'Podziel ' + n + ' ' + pl(n, T[0], T[1], T[2]) + ' na pół, po równo dla dwojga dzieci. Ile dostanie każde dziecko?', visual: frameSvg(n), value: N(n / 2), wrong: [{ v: N(n * 2), code: 'k1_half' }, { v: N(n - 2), code: 'k1_half' }, { v: N(n / 2 + 1), code: 'calc' }],
          hints: ['Połowa to jedna z dwóch równych części.', 'Rozdzielaj po jednym: jeden dla pierwszego dziecka, jeden dla drugiego…', 'Jaka liczba dodana do siebie daje ' + n + '?'], sol: [n / 2 + ' + ' + n / 2 + ' = ' + n, 'Połowa z ' + n + ' to ' + n / 2 + '.'] }; }
      const n = 4 * r.int(1, 5);
      return { prompt: 'Ile to jest ćwiartka (jedna czwarta) z ' + n + '?', visual: frameSvg(n), value: N(n / 4), wrong: [{ v: N(n / 2), code: 'k1_half' }, { v: N(n - 4), code: 'k1_half' }], hints: ['Ćwiartka to jedna z CZTERECH równych części.', 'Podziel na pół, a potem jeszcze raz na pół.', 'Połowa z ' + n + ' to ' + n / 2 + ', a połowa z ' + n / 2 + ' to…'], sol: ['Połowa: ' + n / 2, 'Połowa połowy: ' + n / 4, 'Ćwiartka z ' + n + ' to ' + n / 4 + '.'] };
    }
  });

  def('k1_money', {
    name: 'Pieniądze: monety i banknoty', grade: 1, mainCode: 'k2_zlgr', prereq: ['k1_add'],
    types: { 1: ['input', 'choice'], 2: ['input', 'choice'], 3: ['input', 'choice'] },
    gen(r, d) {
      if (d === 1) { const c = Array.from({ length: r.int(2, 4) }, () => r.pick([1, 2, 5])); const s = c.reduce((a, b) => a + b, 0);
        return { visual: MP.moneySvg(c.map(v => ({ v, u: 'zł' }))), prompt: 'W portfelu są monety: ' + c.map(x => x + ' zł').join(', ') + '. Ile to razem złotych?', value: N(s), wrong: [{ v: N(c.length), code: 'read' }, { v: N(s + 1), code: 'calc' }], hints: ['Dodaj wartości monet, a nie liczbę monet.', 'Zacznij od największej monety.', c.join(' + ') + ' = ?'], sol: [c.join(' + ') + ' = ' + s + ' zł'] }; }
      if (d === 2) { const T = nouns(); const pay = r.pick([10, 20]), price = r.int(2, pay - 1);
        return { visual: MP.moneySvg([{ v: pay, u: 'zł' }]), prompt: 'Kupujesz ' + T[0] + ' za ' + price + ' zł i płacisz banknotem ' + pay + ' zł. Ile reszty dostaniesz?', value: N(pay - price), wrong: [{ v: N(pay + price), code: 'op_confuse' }, { v: N(price), code: 'read' }], hints: ['Reszta to to, co zostanie z banknotu.', 'Działanie: ' + pay + ' − ' + price + '.', 'Sprawdź: ' + price + ' + reszta = ' + pay + '.'], sol: [pay + ' − ' + price + ' = ' + (pay - price) + ' zł'] }; }
      const z = r.int(1, 5);
      return { visual: MP.moneySvg(Array.from({ length: z }, () => ({ v: 1, u: 'zł' }))), prompt: 'Ile groszy to ' + z + ' ' + pl(z, 'złoty', 'złote', 'złotych') + '?', value: N(z * 100), wrong: [{ v: N(z * 10), code: 'k2_zlgr' }, { v: N(z), code: 'k2_zlgr' }], hints: ['1 zł = 100 gr.', z + ' razy po 100 groszy.', z > 1 ? Array(z).fill(100).join(' + ') + ' = ?' : 'To dokładnie 100 gr.'], sol: [z + ' zł = ' + z * 100 + ' gr'] };
    }
  });

  def('k1_clock', {
    name: 'Zegar: pełne godziny', grade: 1, mainCode: 'k1_hour',
    types: { 1: ['choice'], 2: ['input', 'choice'], 3: ['input', 'choice'] },
    gen(r, d, type) {
      const h = r.int(1, 12), clock = MP.draw.clockSvg;
      if (d === 3) { const add = r.int(1, 4), nh = (h + add - 1) % 12 + 1;
        return { prompt: 'Jest godzina ' + h + ':00. Która będzie za ' + add + ' ' + pl(add, 'godzinę', 'godziny', 'godzin') + '? (wpisz samą godzinę)', visual: clock(h, 0), value: N(nh), wrong: [{ v: N(((h - add - 1) % 12 + 12) % 12 + 1), code: 'op_confuse' }, { v: N(h + add), code: 'k2_clock12' }].filter(w => w.v.n !== nh), hints: ['Przesuń w myślach małą wskazówkę o ' + add + ' do przodu.', 'Po 12 na zegarze jest znowu 1.', h + ' + ' + add + ' = ' + (h + add) + (h + add > 12 ? ' → na zegarze ' + nh : '') + '.'], sol: ['Za ' + add + ' h będzie godzina ' + nh + '.'] }; }
      if (type === 'choice') { const ws = [[(h % 12) + 1, 'k1_hour'], [((h + 10) % 12) + 1, 'k1_hour'], [12 === h ? 6 : 12, 'k1_hour']];
        return ch(r, { prompt: 'Którą godzinę pokazuje zegar?', visual: clock(h, 0), correct: h + ':00', wrong: ws.filter(w => w[0] !== h).map(w => [w[0] + ':00', w[1]]), hints: ['Duża wskazówka stoi na 12 – to pełna godzina.', 'Spójrz, na którą liczbę wskazuje mała wskazówka.', 'Mała wskazówka pokazuje ' + h + '.'], sol: ['Mała wskazówka na ' + h + ', duża na 12: godzina ' + h + ':00.'] }); }
      return { prompt: 'Którą godzinę pokazuje zegar? (wpisz samą godzinę)', visual: clock(h, 0), value: N(h), wrong: [{ v: N(12), code: 'k1_hour' }].filter(w => w.v.n !== h), hints: ['Duża wskazówka na 12 – pełna godzina.', 'Odczytaj liczbę, na którą wskazuje MAŁA wskazówka.', 'Mała wskazówka jest przy liczbie ' + h + '.'], sol: ['Godzina ' + h + ':00.'] };
    }
  });

  def('k1_meas', {
    name: 'Mierzenie: długość, masa, pojemność', grade: 1, mainCode: 'k1_len',
    types: { 1: ['choice'], 2: ['input', 'choice'], 3: ['input', 'choice'] },
    gen(r, d) {
      if (d === 1) { const L = [['ołówek', 'pl'], ['zeszyt', 'pl'], ['gumka', 'pl']]; const a = r.int(3, 19); let b = r.int(3, 19); if (b === a) b = a + 2; const s = r.chance(0.5) ? 'dłuższa' : 'krótsza';
        const right = s === 'dłuższa' ? Math.max(a, b) : Math.min(a, b), wrongV = s === 'dłuższa' ? Math.min(a, b) : Math.max(a, b);
        const vis = svgW(300, 80, '<rect x="10" y="12" width="' + a * 14 + '" height="18" rx="4" class="barc"/><text x="' + (a * 14 + 16) + '" y="26" class="lb">A</text><rect x="10" y="48" width="' + b * 14 + '" height="18" rx="4" class="sh"/><text x="' + (b * 14 + 16) + '" y="62" class="lb">B</text>', 'dwie wstążki');
        return ch(r, { prompt: 'Wstążka A ma ' + a + ' cm, a wstążka B – ' + b + ' cm. Która wstążka jest ' + s + '?', visual: vis, correct: right === a ? 'wstążka A' : 'wstążka B', wrong: [[right === a ? 'wstążka B' : 'wstążka A', 'cmp_sign'], ['są równe', 'read']], hints: ['Porównaj liczby centymetrów.', 'Większa liczba cm – dłuższa wstążka.', 'Szukamy wstążki ' + (s === 'dłuższa' ? 'dłuższej' : 'krótszej') + ': ' + right + ' cm.'], sol: [Math.max(a, b) + ' cm > ' + Math.min(a, b) + ' cm', 'Odpowiedź: ' + (right === a ? 'wstążka A' : 'wstążka B') + '.'] }); }
      if (d === 2) { const kind = r.pick(['cm', 'kg', 'l']); const a = r.int(2, 12), b = r.int(1, 20 - a); const what = { cm: ['Sznurek ma', 'cm. Dołożono kawałek', 'cm. Ile centymetrów ma teraz?'], kg: ['W koszyku jest', 'kg jabłek. Dosypano', 'kg. Ile kilogramów jest teraz?'], l: ['W baniaku było', 'l wody. Dolano', 'l. Ile litrów jest teraz?'] }[kind];
        return { prompt: what[0] + ' ' + a + ' ' + what[1] + ' ' + b + ' ' + what[2], value: N(a + b), unit: kind, wrong: [{ v: N(Math.abs(a - b)), code: 'op_confuse' }, { v: N(a + b + 1), code: 'calc' }], hints: ['Przybyło – dodajemy.', 'Działanie: ' + a + ' + ' + b + '.', 'Jednostka zostaje ta sama: ' + kind + '.'], sol: [a + ' + ' + b + ' = ' + (a + b) + ' ' + kind] }; }
      const m = r.int(1, 3), c = r.pick([0, 0, 20, 50]);
      return { prompt: 'Ile centymetrów to ' + m + ' m' + (c ? ' ' + c + ' cm' : '') + '?', value: N(m * 100 + c), unit: 'cm', wrong: [{ v: N(m * 10 + c), code: 'k1_len' }, { v: N(m + c), code: 'k1_len' }], hints: ['1 m = 100 cm.', m + ' m = ' + m * 100 + ' cm.', c ? 'Dodaj jeszcze ' + c + ' cm.' : 'To już cała odpowiedź.'], sol: [m + ' m = ' + m * 100 + ' cm'].concat(c ? [m * 100 + ' + ' + c + ' = ' + (m * 100 + c) + ' cm'] : []) };
    }
  });

  const SH1 = { 'koło': '<circle cx="90" cy="80" r="60" class="shape"/>', 'kwadrat': '<rect x="35" y="25" width="110" height="110" class="shape"/>', 'prostokąt': '<rect x="15" y="45" width="160" height="80" class="shape"/>', 'trójkąt': '<polygon points="20,130 160,130 90,20" class="shape"/>' };
  function mini(k, x, y, s) { s = s || 1; const T = { 'koło': '<circle cx="' + (x + 18 * s) + '" cy="' + (y + 18 * s) + '" r="' + 16 * s + '" class="shape"/>', 'kwadrat': '<rect x="' + (x + 3) + '" y="' + (y + 3) + '" width="' + 30 * s + '" height="' + 30 * s + '" class="shape"/>', 'prostokąt': '<rect x="' + x + '" y="' + (y + 8) + '" width="' + 40 * s + '" height="' + 20 * s + '" class="shape"/>', 'trójkąt': '<polygon points="' + x + ',' + (y + 34 * s) + ' ' + (x + 36 * s) + ',' + (y + 34 * s) + ' ' + (x + 18 * s) + ',' + y + '" class="shape"/>' }; return T[k]; }
  def('k1_shapes', {
    name: 'Figury: koło, kwadrat, prostokąt, trójkąt', grade: 1, mainCode: 'k2_shape',
    types: { 1: ['choice'], 2: ['input', 'choice'], 3: ['input', 'choice'] },
    gen(r, d) {
      const K = Object.keys(SH1);
      if (d === 1) { const k = r.pick(K);
        return ch(r, { prompt: 'Jak nazywa się ta figura?', visual: svgW(180, 160, SH1[k], 'figura'), correct: k, wrong: K.filter(x => x !== k).map(x => [x, 'k2_shape']), hints: ['Policz rogi figury.', k === 'koło' ? 'Ta figura nie ma rogów.' : 'Ma ' + (k === 'trójkąt' ? 3 : 4) + ' rogi.', k === 'kwadrat' ? 'Wszystkie boki są równe.' : k === 'prostokąt' ? 'Dwa boki są dłuższe, dwa krótsze.' : 'Dopasuj nazwę.'], sol: ['To ' + k + '.'] }); }
      const n = 7 + r.int(0, 3), seq = Array.from({ length: n }, () => r.pick(K)); const target = r.pick(K.filter(k => seq.includes(k)));
      let body = ''; seq.forEach((k, i) => { body += mini(k, 10 + (i % 5) * 54, 10 + Math.floor(i / 5) * 50); });
      const cnt = seq.filter(k => k === target).length;
      const near = target === 'kwadrat' ? seq.filter(k => k === 'kwadrat' || k === 'prostokąt').length : target === 'prostokąt' ? seq.filter(k => k === 'prostokąt' || k === 'kwadrat').length : cnt + 1;
      const name = { 'koło': ['koło', 'koła', 'kół'], 'kwadrat': ['kwadrat', 'kwadraty', 'kwadratów'], 'prostokąt': ['prostokąt', 'prostokąty', 'prostokątów'], 'trójkąt': ['trójkąt', 'trójkąty', 'trójkątów'] }[target];
      return { prompt: 'Ile ' + name[2] + ' jest na rysunku?' + (target === 'prostokąt' ? ' (kwadratów nie licz)' : ''), visual: svgW(280, 112, body, 'figury'), value: N(cnt), wrong: [{ v: N(near), code: 'k2_shape' }, { v: N(n), code: 'read' }].filter(w => w.v.n !== cnt), hints: ['Szukaj tylko jednej figury: ' + name[0] + '.', target === 'kwadrat' ? 'Kwadrat ma wszystkie boki równe – nie myl go z prostokątem.' : target === 'trójkąt' ? 'Trójkąt ma 3 rogi.' : target === 'koło' ? 'Koło nie ma rogów.' : 'Prostokąt ma dwa dłuższe i dwa krótsze boki.', 'Licz po kolei: wiersz po wierszu.'], sol: ['Na rysunku ' + pl(cnt, 'jest', 'są', 'jest') + ' ' + cnt + ' ' + pl(cnt, name[0], name[1], name[2]) + '.'] };
    }
  });

  def('k1_pattern', {
    name: 'Rytmy i sekwencje', grade: 1, mainCode: 'k1_pattern',
    types: { 1: ['choice'], 2: ['choice'], 3: ['input', 'choice'] },
    gen(r, d) {
      if (d === 3) { const st = r.pick([2, 5, 10]), down = r.chance(0.3); const a0 = down ? st * r.int(4, st === 2 ? 10 : st === 5 ? 8 : 10) : (st === 2 ? r.int(0, 10) : st * r.int(0, 5)); const seq = [0, 1, 2, 3].map(k => a0 + (down ? -1 : 1) * st * k); const nx = a0 + (down ? -1 : 1) * st * 4;
        return { prompt: 'Jaka liczba będzie następna? ' + seq.join(', ') + ', …', value: N(nx), wrong: [{ v: N(nx + (down ? -1 : 1)), code: 'k1_pattern' }, { v: N(seq[3] + (down ? -1 : 1)), code: 'k1_pattern' }], hints: ['O ile zmienia się każda kolejna liczba?', 'Każda liczba jest o ' + st + (down ? ' mniejsza' : ' większa') + '.', seq[3] + (down ? ' − ' : ' + ') + st + ' = ?'], sol: ['Reguła: ' + (down ? '−' : '+') + st, seq[3] + (down ? ' − ' : ' + ') + st + ' = ' + nx] }; }
      const S = ['🔴', '🔵', '🟡', '🟢', '⭐', '🔺'];
      const len = d === 1 ? 2 : 3; const base = r.shuffle(S).slice(0, len); if (d === 2 && r.chance(0.5)) base[2] = base[0];
      const shown = 2 * base.length + r.int(0, base.length - 1); const seq = Array.from({ length: shown }, (_, i) => base[i % base.length]); const nx = base[shown % base.length];
      const others = S.filter(s => s !== nx);
      return ch(r, { prompt: 'Co będzie dalej? ' + seq.join(' ') + ' …', correct: nx, wrong: [[base[(shown + 1) % base.length], 'k1_pattern'], [seq[shown - 1], 'k1_pattern']].concat(others.map(o => [o, 'k1_pattern'])), hints: ['Znajdź kawałek, który się powtarza.', 'Powtarza się: ' + base.join(' ') + '.', 'Po ' + seq[shown - 1] + ' w tym rytmie jest…'], sol: ['Powtarza się ' + base.join(' ') + ', więc dalej jest ' + nx + '.'] });
    }
  });

  // ===================== KLASA 3 =====================
  def('k3_num', {
    name: 'Liczby do 1000', grade: 3, mainCode: 'k3_place',
    types: { 1: ['multi'], 2: ['input', 'choice'], 3: ['choice'] },
    gen(r, d, type) {
      if (d === 1) { const s = r.int(1, 9), t = r.int(0, 9), u = r.int(0, 9), n = s * 100 + t * 10 + u;
        return { type: 'multi', prompt: 'Ile setek, dziesiątek i jedności ma liczba <b>' + n + '</b>?', labels: ['setki', 'dziesiątki', 'jedności'], answer: { kind: 'multi', values: [N(s), N(t), N(u)] }, multiCodes: ['k3_place', 'k3_place', 'k3_place'], hints: ['Pierwsza cyfra – setki.', 'Środkowa cyfra – dziesiątki.', 'Ostatnia cyfra – jedności.'], sol: [n + ' = ' + s * 100 + ' + ' + t * 10 + ' + ' + u] }; }
      if (d === 2) { const s = r.int(1, 9), t = r.chance(0.3) ? 0 : r.int(1, 9), u = r.int(0, 9), n = s * 100 + t * 10 + u;
        return { prompt: 'Zapisz cyframi liczbę: ' + s + ' ' + pl(s, 'setka', 'setki', 'setek') + ', ' + t + ' ' + pl(t, 'dziesiątka', 'dziesiątki', 'dziesiątek') + ' i ' + u + ' ' + pl(u, 'jedność', 'jedności', 'jedności') + '.', value: N(n), wrong: [{ v: N(s * 100 + u * 10 + t), code: 'k3_place' }, { v: N(s * 10 + u), code: 'k3_place' }, { v: N(s + t + u), code: 'k3_place' }].filter(w => w.v.n !== n),
          hints: [s + ' ' + pl(s, 'setka', 'setki', 'setek') + ' = ' + s * 100 + '.', t + ' ' + pl(t, 'dziesiątka', 'dziesiątki', 'dziesiątek') + ' = ' + t * 10 + '.', s * 100 + ' + ' + t * 10 + ' + ' + u + ' = ?'], sol: [s * 100 + ' + ' + t * 10 + ' + ' + u + ' = ' + n] }; }
      const a = r.int(100, 999); let b; const k = r.int(0, 2); if (k === 0) b = Math.floor(a / 100) * 100 + (a % 10) * 10 + Math.floor(a / 10) % 10; else if (k === 1) b = (a % 10) * 100 + Math.floor(a / 10) % 10 * 10 + Math.floor(a / 100); else b = r.chance(0.2) ? a : r.int(100, 999);
      if (b < 100) b = a + 10;
      return cmpSign(r, a, b, String(a), String(b), ['Najpierw porównaj setki.', 'Gdy setki są równe – porównaj dziesiątki, potem jedności.', 'Dzióbek znaku wskazuje mniejszą liczbę.'], [], 'k3_place');
    },
    why: [{ q: 'Dlaczego w liczbie 305 jest zero?', opts: [{ t: 'Bo nie ma żadnych dziesiątek, a zero „trzyma miejsce"', ok: true }, { t: 'Bo zero niczego nie zmienia i można je pominąć', code: 'k3_place' }, { t: 'Bo jest 0 setek', code: 'k3_place' }], expl: '305 to 3 setki, 0 dziesiątek i 5 jedności. Bez zera mielibyśmy 35 – zupełnie inną liczbę.' }]
  });

  def('k3_add', {
    name: 'Dodawanie i odejmowanie do 1000', grade: 3, mainCode: 'calc', prereq: ['k3_num', 'k2_add', 'k2_sub'],
    types: { 1: ['input', 'choice'], 2: ['input', 'choice'], 3: ['input', 'choice'] },
    gen(r, d) {
      const sub = r.chance(0.5); let a, b;
      if (d === 1) { a = r.int(1, 8) * 100 + (r.chance(0.5) ? r.int(1, 9) * 10 : 0); b = r.int(1, 9 - Math.floor(a / 100) || 1) * 100; if (sub) { a = a + b; } }
      else if (d === 2) { if (sub) { a = r.int(31, 99); b = r.int(12, a - 6); } else { a = r.int(15, 80); b = r.int(11, 99 - a); } }
      else if (sub) { a = r.int(400, 999); b = r.int(110, a - 50); }
      else { a = r.int(200, 780); b = r.int(110, 989 - a); }
      const v = sub ? a - b : a + b; const op = sub ? ' − ' : ' + ';
      const H = Math.floor(b / 100) * 100, T = Math.floor(b % 100 / 10) * 10, J = b % 10;
      const steps = []; let cur = a; [[H, 'setki'], [T, 'dziesiątki'], [J, 'jedności']].forEach(([x]) => { if (x) { const nx = sub ? cur - x : cur + x; steps.push(cur + op + x + ' = ' + nx); cur = nx; } });
      const story = d < 3 && MP.storyAS ? MP.storyAS(r, a, b, sub) : null;
      return { prompt: story || 'Oblicz: ' + a + op + b, value: N(v), wrong: [{ v: N(sub ? a + b : Math.abs(a - b)), code: 'op_confuse' }, { v: N(sub ? v + 10 : v - 10), code: 'calc' }, { v: N(sub ? v - 100 : v + 100), code: 'k3_place' }].filter(w => w.v.n >= 0 && w.v.n !== v),
        hints: ['Rozłóż drugą liczbę na setki, dziesiątki i jedności: ' + [H, T, J].filter(Boolean).join(' + ') + '.', sub ? 'Odejmuj po kolei: najpierw setki, potem dziesiątki, na końcu jedności.' : 'Dodawaj po kolei: najpierw setki, potem dziesiątki, na końcu jedności.', steps[0] ? 'Pierwszy krok: ' + steps[0] + '.' : 'Policz.'], sol: steps.length ? steps : [a + op + b + ' = ' + v] };
    }
  });

  def('k3_box', {
    name: 'Okienka i proste równania', grade: 3, mainCode: 'k3_box', prereq: ['k3_add', 'tabl'],
    types: { 1: ['fill', 'input'], 2: ['fill', 'input'], 3: ['fill', 'input'] },
    gen(r, d) {
      if (d === 1) { const a = r.int(12, 60), b = r.int(8, 39), s = a + b; const k = r.int(0, 2); const F3 = [[a + ' + □ = ' + s, b, [s + a]], [s + ' − □ = ' + a, b, [s + a]], ['□ − ' + b + ' = ' + a, s, [a - b]]][k];
        return { prompt: F3[0], fill: true, value: N(F3[1]), wrong: F3[2].filter(x => x > 0 && x !== F3[1]).map(x => ({ v: N(x), code: 'k3_box' })), hints: ['Jakie działanie odwrotne pomoże?', k === 0 ? 'Odejmij: ' + s + ' − ' + a + '.' : k === 1 ? 'Odejmij: ' + s + ' − ' + a + '.' : 'Dodaj: ' + a + ' + ' + b + '.', 'Wstaw wynik w okienko i sprawdź.'], sol: ['□ = ' + F3[1], F3[0].replace('□', String(F3[1])) + ' ✓'] }; }
      const a = r.int(2, 9), b = r.int(2, 9), p = a * b; const k = d === 2 ? r.int(0, 1) : r.int(2, 3);
      const F4 = [['□ · ' + b + ' = ' + p, a, [p - b, p + b]], [a + ' · □ = ' + p, b, [p - a, p + a]], [p + ' : □ = ' + a, b, [p * a, p - a]], ['□ : ' + b + ' = ' + a, p, [a + b, a]]][k];
      return { prompt: F4[0], fill: true, value: N(F4[1]), wrong: F4[2].filter(x => x > 0 && x !== F4[1]).map(x => ({ v: N(x), code: 'k3_box' })), hints: [k < 2 ? 'Jaka liczba pomnożona daje ' + p + '? Pomyśl o tabliczce mnożenia.' : k === 2 ? 'Przez jaką liczbę trzeba podzielić ' + p + ', żeby wyszło ' + a + '?' : 'Jaką liczbę dzielimy przez ' + b + ', żeby wyszło ' + a + '? Pomnóż.', k < 2 ? 'Podziel: ' + p + ' : ' + (k === 0 ? b : a) + '.' : k === 2 ? 'Podziel: ' + p + ' : ' + a + '.' : a + ' · ' + b + ' = ?', 'Wstaw wynik w okienko i sprawdź.'], sol: ['□ = ' + F4[1], F4[0].replace('□', String(F4[1])) + ' ✓'] };
    }
  });

  def('k3_word', {
    name: 'Zadania z treścią (jedno- i dwudziałaniowe)', grade: 3, mainCode: 'read', prereq: ['k3_add', 'tabl'],
    types: { 1: ['input', 'choice'], 2: ['input', 'choice'], 3: ['input', 'choice'] },
    gen(r, d) {
      const T = nouns(), [nm, g] = r.pick(KIDS), [nm2] = r.pick(KIDS.filter(k => k[0] !== nm)), t = (n) => n + ' ' + pl(n, T[0], T[1], T[2]);
      if (d === 1) { const b = r.int(3, 9), k = r.int(2, 6), a = b * k;
        if (r.chance(0.5)) return { prompt: nm + ' ma ' + t(a) + ', a ' + nm2 + ' – ' + t(b) + '. Ile razy więcej ' + T[2] + ' ma ' + nm + '?', value: N(k), wrong: [{ v: N(a - b), code: 'k3_times' }, { v: N(a + b), code: 'op_confuse' }], hints: ['„Ile razy więcej" – dzielimy większą liczbę przez mniejszą.', 'Działanie: ' + a + ' : ' + b + '.', 'Ile razy ' + b + ' mieści się w ' + a + '?'], sol: [a + ' : ' + b + ' = ' + k, 'Odpowiedź: ' + k + ' razy więcej.'] };
        return { prompt: nm + ' ma ' + t(b) + ', a ' + nm2 + ' ma ' + k + ' razy więcej. Ile ' + T[2] + ' ma ' + nm2 + '?', value: N(a), wrong: [{ v: N(b + k), code: 'k3_times' }, { v: N(b), code: 'read' }], hints: ['„' + k + ' razy więcej" – mnożymy.', 'Działanie: ' + b + ' · ' + k + '.', 'Policz z tabliczki mnożenia.'], sol: [b + ' · ' + k + ' = ' + a, 'Odpowiedź: ' + nm2 + ' ma ' + t(a) + '.'] }; }
      if (d === 2) { const n = r.int(3, 8), p = r.int(3, 9), extra = r.int(5, 30);
        return { prompt: nm + ' ' + vg(g, 'kupił', 'kupiła') + ' ' + n + ' paczek po ' + p + ' ' + pl(p, T[0], T[1], T[2]) + ' i jeszcze ' + t(extra) + ' osobno. Ile ' + T[2] + ' ' + vg(g, 'kupił', 'kupiła') + ' razem?', value: N(n * p + extra), wrong: [{ v: N(n + p + extra), code: 'op_confuse' }, { v: N(n * p), code: 'read' }, { v: N(n * (p + extra)), code: 'order_ltr' }], hints: ['Najpierw policz, ile jest w paczkach.', n + ' · ' + p + ' = ' + n * p + '.', 'Dodaj te osobno: ' + n * p + ' + ' + extra + '.'], sol: [n + ' · ' + p + ' = ' + n * p, n * p + ' + ' + extra + ' = ' + (n * p + extra), 'Odpowiedź: razem ' + t(n * p + extra) + '.'] }; }
      const price = r.int(3, 9), n = r.int(2, 6), pay = [20, 50, 100].find(x => x > price * n);
      return { prompt: nm + ' ' + vg(g, 'kupił', 'kupiła') + ' ' + n + ' ' + pl(n, T[0], T[1], T[2]) + ' po ' + price + ' zł. ' + vg(g, 'Zapłacił', 'Zapłaciła') + ' banknotem ' + pay + ' zł. Ile reszty ' + vg(g, 'dostał', 'dostała') + '?', value: N(pay - n * price), wrong: [{ v: N(pay - n - price), code: 'op_confuse' }, { v: N(n * price), code: 'read' }, { v: N(pay - price), code: 'read' }], hints: ['Najpierw: ile kosztowały wszystkie?', n + ' · ' + price + ' = ' + n * price + ' zł.', 'Reszta: ' + pay + ' − ' + n * price + '.'], sol: [n + ' · ' + price + ' = ' + n * price + ' zł', pay + ' − ' + n * price + ' = ' + (pay - n * price) + ' zł', 'Odpowiedź: ' + (pay - n * price) + ' zł reszty.'] };
    }
  });

  def('k3_money', {
    name: 'Obliczenia pieniężne', grade: 3, mainCode: 'k3_gr', prereq: ['k3_add'],
    types: { 1: ['input', 'choice'], 2: ['input', 'choice'], 3: ['input', 'choice'] },
    gen(r, d) {
      if (d === 1) { const z = r.int(1, 9), g = r.pick([10, 20, 50, 80, 5]); return { visual: MP.moneySvg(MP.moneyList(z, g)), prompt: 'Ile groszy to ' + z + ' zł ' + g + ' gr?', value: N(z * 100 + g), unit: 'gr', wrong: [{ v: N(z * 10 + g), code: 'k3_gr' }, { v: N(z + g), code: 'k3_gr' }], hints: ['1 zł = 100 gr.', z + ' zł = ' + z * 100 + ' gr.', z * 100 + ' + ' + g + ' = ?'], sol: [z + ' zł = ' + z * 100 + ' gr', z * 100 + ' + ' + g + ' = ' + (z * 100 + g) + ' gr'] }; }
      if (d === 2) { const a = r.int(1, 4) * 100 + r.pick([50, 60, 70, 80]), b = r.int(1, 3) * 100 + r.pick([40, 50, 60, 70]); const s = a + b; const z = Math.floor(s / 100), g = s % 100;
        return { prompt: 'Lizak kosztuje ' + U.money(a) + ' zł, a sok ' + U.money(b) + ' zł. Ile groszy kosztują razem?', value: N(s), unit: 'gr', wrong: [{ v: N(Math.floor(a / 100) * 100 + Math.floor(b / 100) * 100 + (a % 100 + b % 100) % 100), code: 'k3_gr' }, { v: N(s + 100), code: 'calc' }], hints: ['Zamień ceny na grosze: ' + U.money(a) + ' zł = ' + a + ' gr.', U.money(b) + ' zł = ' + b + ' gr.', a + ' + ' + b + ' = ?'], sol: [a + ' gr + ' + b + ' gr = ' + s + ' gr', s + ' gr = ' + z + ' zł ' + g + ' gr'] }; }
      const price = r.int(2, 8) * 100 + r.pick([20, 40, 50, 70, 90]), pay = [500, 1000, 2000].find(x => x > price);
      return { visual: MP.moneySvg([{ v: pay / 100, u: 'zł' }]), prompt: 'Zeszyt kosztuje ' + U.money(price) + ' zł. Płacisz ' + pay / 100 + ' zł. Ile groszy reszty dostaniesz?', value: N(pay - price), unit: 'gr', wrong: [{ v: N(pay / 100 * 100 - Math.floor(price / 100) * 100 - (100 - price % 100)), code: 'calc' }, { v: N(Math.abs(pay - price - 100)), code: 'k3_gr' }, { v: N(price), code: 'read' }].filter(w => w.v.n > 0 && w.v.n !== pay - price), hints: ['Zamień wszystko na grosze.', pay / 100 + ' zł = ' + pay + ' gr, ' + U.money(price) + ' zł = ' + price + ' gr.', pay + ' − ' + price + ' = ?'], sol: [pay + ' − ' + price + ' = ' + (pay - price) + ' gr', 'To ' + U.money(pay - price) + ' zł.'] };
    }
  });

  const tm = (h, m) => h + ':' + String(m).padStart(2, '0');
  def('k3_clock', {
    name: 'Zegar: godziny i minuty', grade: 3, mainCode: 'k3_min', prereq: ['k2_clock'],
    types: { 1: ['choice'], 2: ['input', 'choice'], 3: ['input', 'choice'] },
    gen(r, d) {
      if (d === 1) { const h = r.int(1, 12), m = r.int(1, 11) * 5; const wrongs = [[tm(h, (m + 30) % 60), 'k1_hour'], [tm(h % 12 + 1, m), 'k1_hour'], [tm(h, m / 5), 'k3_min'], [tm(m / 5 || 12, h * 5 % 60), 'k1_hour']];
        return ch(r, { prompt: 'Którą godzinę pokazuje zegar?', visual: MP.draw.clockSvg(h, m), correct: tm(h, m), wrong: wrongs.filter(w => w[0] !== tm(h, m)), hints: ['Mała wskazówka – godziny, duża – minuty.', 'Każda liczba na tarczy to 5 minut dla dużej wskazówki.', 'Duża wskazówka stoi przy ' + (m / 5) + ' → ' + (m / 5) + ' · 5 = ' + m + ' minut.'], sol: ['Godzina ' + h + ', minut ' + m + ': ' + tm(h, m)] }); }
      if (d === 2) { const h = r.int(7, 18), m1 = r.int(0, 9) * 5, dm = r.int(3, 11) * 5; let h2 = h, m2 = m1 + dm; if (m2 >= 60) { h2++; m2 -= 60; }
        return { prompt: 'Film zaczął się o ' + tm(h, m1) + ' i skończył o ' + tm(h2, m2) + '. Ile minut trwał?', value: N(dm), unit: 'min', wrong: [{ v: N(h2 * 100 + m2 - (h * 100 + m1)), code: 'k3_min' }, { v: N(dm + 10), code: 'calc' }].filter(w => w.v.n !== dm), hints: ['Licz minuty od ' + tm(h, m1) + ' do ' + tm(h2, m2) + '.', h2 > h ? 'Najpierw do pełnej godziny: do ' + tm(h2, 0) + ' brakuje ' + (60 - m1) + ' min.' : 'To ta sama godzina – odejmij minuty.', h2 > h ? 'Potem jeszcze ' + m2 + ' min. Dodaj.' : m2 + ' − ' + m1 + ' = ?'], sol: h2 > h ? [(60 - m1) + ' min do ' + tm(h2, 0), (60 - m1) + ' + ' + m2 + ' = ' + dm + ' min'] : [m2 + ' − ' + m1 + ' = ' + dm + ' min'] }; }
      const h = r.int(13, 23);
      return { prompt: 'Zegar elektroniczny pokazuje ' + tm(h, 0) + '. Która to godzina na zwykłym zegarze ze wskazówkami (od 1 do 12)?', value: N(h - 12), wrong: [{ v: N(h - 10), code: 'k2_clock12' }, { v: N(h % 10), code: 'k2_clock12' }].filter(w => w.v.n !== h - 12 && w.v.n > 0), hints: ['Doba ma 24 godziny, a tarcza zegara – 12.', 'Po południu od godziny odejmujemy 12.', h + ' − 12 = ?'], sol: [h + ' − 12 = ' + (h - 12), tm(h, 0) + ' to godzina ' + (h - 12) + ' po południu.'] };
    }
  });

  const MIES = ['styczeń', 'luty', 'marzec', 'kwiecień', 'maj', 'czerwiec', 'lipiec', 'sierpień', 'wrzesień', 'październik', 'listopad', 'grudzień'];
  const MGEN = ['stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca', 'lipca', 'sierpnia', 'września', 'października', 'listopada', 'grudnia'];
  const DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  def('k3_cal', {
    name: 'Kalendarz: daty i upływ dni', grade: 3, mainCode: 'k3_month', prereq: ['k2_cal'],
    types: { 1: ['choice'], 2: ['input', 'choice'], 3: ['input', 'choice'] },
    gen(r, d) {
      if (d === 1) { const i = r.int(0, 11); const v = DAYS[i];
        return ch(r, { prompt: 'Ile dni ma ' + MIES[i] + (i === 1 ? ' w roku, który nie jest przestępny' : '') + '?', correct: String(v), wrong: [30, 31, 28, 29].filter(x => x !== v).map(x => [String(x), 'k3_month']), hints: ['Policz na knykciach: styczeń na knykciu, luty w dołku, marzec na knykciu…', 'Na knykciu – 31 dni, w dołku – 30 (luty: 28 lub 29).', 'Lipiec i sierpień oba mają 31 dni.'], sol: [MIES[i] + ' ma ' + v + ' dni.'] }); }
      if (d === 2) { const i = r.int(0, 11), a = r.int(1, 12), b = r.int(a + 3, Math.min(DAYS[i], a + 20));
        return { prompt: 'Wycieczka trwała od ' + a + ' do ' + b + ' ' + MGEN[i] + ' (oba dni liczymy). Ile dni trwała?', value: N(b - a + 1), unit: 'dni', wrong: [{ v: N(b - a), code: 'k2_cal' }, { v: N(b - a + 2), code: 'k2_cal' }], hints: ['Od ' + a + ' do ' + b + ' to ' + (b - a) + ' dni różnicy.', 'Ale liczymy też pierwszy dzień!', (b - a) + ' + 1 = ?'], sol: [b + ' − ' + a + ' = ' + (b - a), (b - a) + ' + 1 = ' + (b - a + 1) + ' dni'] }; }
      const i = r.int(0, 11), day = r.int(DAYS[i] - 6, DAYS[i]), add = r.int(DAYS[i] - day + 1, DAYS[i] - day + 8); const nd = day + add - DAYS[i];
      return { prompt: 'Dziś jest ' + day + ' ' + MGEN[i] + '. Którego dnia ' + MGEN[(i + 1) % 12] + ' będzie za ' + add + ' dni? (wpisz numer dnia)', value: N(nd), wrong: [{ v: N(day + add - 30 === nd ? day + add - 31 : day + add - 30), code: 'k3_month' }, { v: N(nd + 1), code: 'k2_cal' }].filter(w => w.v.n > 0 && w.v.n !== nd), hints: [MIES[i] + ' ma ' + DAYS[i] + ' dni.', 'Do końca miesiąca zostało ' + (DAYS[i] - day) + ' dni.', 'Reszta dni (' + add + ' − ' + (DAYS[i] - day) + ') przypada na ' + MIES[(i + 1) % 12] + '.'], sol: [add + ' − ' + (DAYS[i] - day) + ' = ' + nd, 'To będzie ' + nd + ' ' + MGEN[(i + 1) % 12] + '.'] };
    }
  });

  def('k3_units', {
    name: 'Jednostki: długość, masa, pojemność', grade: 3, mainCode: 'k3_unit', prereq: ['k2_len'],
    types: { 1: ['input', 'choice'], 2: ['input', 'choice'], 3: ['input', 'choice'] },
    gen(r, d) {
      const P = [['cm', 'mm', 10], ['m', 'cm', 100], ['km', 'm', 1000], ['kg', 'dag', 100], ['dag', 'g', 10], ['kg', 'g', 1000]];
      if (d < 3) { const [big, small, k] = d === 1 ? r.pick(P.slice(0, 2).concat([P[3]])) : r.pick(P); const n = r.int(2, 9); const rest = d === 2 ? r.int(1, k / (k >= 100 ? 10 : 2) - 1) * (k >= 100 ? 10 : 1) % k : 0;
        const v = n * k + rest; const alt = P.find(p => p[1] === small && p[2] !== k);
        return { prompt: n + ' ' + big + (rest ? ' ' + rest + ' ' + small : '') + ' = □ ' + small, fill: true, value: N(v), wrong: [{ v: N(n * (k === 10 ? 100 : 10) + rest), code: 'k3_unit' }, { v: N(n + rest), code: 'k3_unit' }].concat(alt ? [{ v: N(n * alt[2] + rest), code: 'k3_unit' }] : []).filter(w => w.v.n !== v), hints: ['1 ' + big + ' = ' + k + ' ' + small + '.', n + ' ' + big + ' = ' + n * k + ' ' + small + '.', rest ? 'Dodaj jeszcze ' + rest + ' ' + small + '.' : 'To cała odpowiedź.'], sol: [n + ' · ' + k + ' = ' + n * k + ' ' + small].concat(rest ? [n * k + ' + ' + rest + ' = ' + v + ' ' + small] : []) }; }
      const half = r.chance(0.5); const L = r.int(2, 6), take = half ? 'pół litra' : 'ćwierć litra'; const cups = half ? L * 2 : L * 4;
      return { prompt: 'Ile szklanek po ' + take + ' można napełnić ' + L + ' litrami soku?', value: N(cups), wrong: [{ v: N(half ? L * 4 : L * 2), code: 'k1_half' }, { v: N(L), code: 'k3_unit' }], hints: ['1 litr to ' + (half ? '2 razy po pół litra' : '4 razy po ćwierć litra') + '.', 'Z 1 litra są ' + (half ? 2 : 4) + ' szklanki.', L + ' · ' + (half ? 2 : 4) + ' = ?'], sol: ['1 l = ' + (half ? '2 · ½ l' : '4 · ¼ l'), L + ' · ' + (half ? 2 : 4) + ' = ' + cups + ' szklanek'] };
    }
  });

  // ---------- system rzymski (kl. 3: do XII, kl. 4: do XXXIX, kl. 8: do MMM) ----------
  function roman(n) { const V = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']]; let s = ''; for (const [v, l] of V) while (n >= v) { s += l; n -= v; } return s; }
  function badRoman(n) { // typowe błędne zapisy
    const out = []; const s = roman(n);
    if (s.includes('IV')) out.push(s.replace('IV', 'IIII')); if (s.includes('IX')) out.push(s.replace('IX', 'VIIII'));
    if (s.includes('XL')) out.push(s.replace('XL', 'XXXX')); if (s.includes('XC')) out.push(s.replace('XC', 'LXXXX')); if (s.includes('CD')) out.push(s.replace('CD', 'CCCC')); if (s.includes('CM')) out.push(s.replace('CM', 'DCCCC'));
    if (s.includes('VI')) out.push(s.replace('VI', 'IV')); if (s.includes('XI')) out.push(s.replace('XI', 'IX'));
    if (s.includes('IV')) out.push(s.replace('IV', 'VI')); if (s.includes('IX')) out.push(s.replace('IX', 'XI'));
    return out.filter(x => x !== s);
  }
  MP.gx.roman = roman;
  def('nat_roman', {
    name: 'System rzymski', grade: 4, mainCode: 'roman',
    types: { 1: ['input', 'choice'], 2: ['choice', 'input'], 3: ['input', 'choice'] },
    gen(r, d, type) {
      const G = MP.grade || 6, max = G <= 3 ? 12 : G <= 5 ? (d === 3 ? 39 : 20) : (d === 1 ? 39 : d === 2 ? 400 : 3000);
      let n = r.int(G <= 3 ? 1 : 4, max); if (d >= 2 && !/IV|IX|XL|XC|CD|CM/.test(roman(n))) n = r.int(G <= 3 ? 1 : 4, max);
      const s = roman(n);
      const parts = []; { let x = n; [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']].forEach(([v, l]) => { while (x >= v) { parts.push(l + ' = ' + v); x -= v; } }); }
      const hints = ['Znaki: I = 1, V = 5, X = 10, L = 50, C = 100, D = 500, M = 1000.', 'Mniejszy znak przed większym odejmujemy (IV = 4, IX = 9), za większym – dodajemy.', 'Rozbij: ' + parts.slice(0, 3).join(', ') + (parts.length > 3 ? '…' : '') + '.'];
      if (type === 'choice' || d === 2) return ch(r, { prompt: 'Jak zapisać liczbę <b>' + n + '</b> w systemie rzymskim?', correct: s, wrong: badRoman(n).map(x => [x, 'roman']).concat([[roman(n + 1), 'calc'], [roman(Math.max(1, n - 1)), 'calc'], [roman(n + 10), 'calc']]), hints, sol: parts.concat([n + ' = ' + s]) });
      const wv = []; if (s.includes('IV')) wv.push(n + 2); if (s.includes('IX')) wv.push(n + 2); if (s.includes('XL')) wv.push(n + 20); if (s.includes('XC')) wv.push(n + 20); if (s.includes('CD')) wv.push(n + 200); if (s.includes('CM')) wv.push(n + 200);
      return { prompt: 'Jaką liczbę oznacza zapis <b>' + s + '</b>?', value: N(n), wrong: wv.map(x => ({ v: N(x), code: 'roman' })).concat([{ v: N(s.length), code: 'roman' }]).filter(w => w.v.n !== n), hints, sol: parts.concat([s + ' = ' + n]) };
    },
    why: [{ q: 'Dlaczego IX to 9, a XI to 11?', opts: [{ t: 'I przed X odejmujemy (10 − 1), a I za X dodajemy (10 + 1)', ok: true }, { t: 'Kolejność znaków nie ma znaczenia', code: 'roman' }, { t: 'Zawsze dodajemy wszystkie znaki', code: 'roman' }], expl: 'Mniejszy znak przed większym odejmujemy, a za większym – dodajemy.' }]
  });

  // ---------- temperatura (kl. 2–3 bez ujemnych, od kl. 4 także poniżej zera) ----------
  function thermoSvg(t, lo, hi, step) {
    const H = 220, y = (v) => 200 - (v - lo) / (hi - lo) * 180; let s = '<rect x="58" y="12" width="24" height="196" rx="12" class="un"/><circle cx="70" cy="210" r="16" style="fill:var(--coral)"/>';
    s += '<rect x="64" y="' + y(t).toFixed(1) + '" width="12" height="' + (210 - y(t)).toFixed(1) + '" style="fill:var(--coral)"/>';
    for (let v = lo; v <= hi; v += step) { const yy = y(v).toFixed(1); s += '<line x1="82" y1="' + yy + '" x2="' + (v % (step === 1 ? 5 : 10) === 0 ? 96 : 90) + '" y2="' + yy + '" class="tick"/>'; if (v % (step === 1 ? 5 : 10) === 0) s += '<text x="100" y="' + (+yy + 4) + '" class="ax">' + (v < 0 ? '−' + -v : v) + '°</text>'; }
    return svgW(140, H + 12, s, 'termometr', 'width:150px');
  }
  const deg = (v) => (v < 0 ? '−' + -v : v) + '°C';
  function tempGen(r, d, neg) {
    const step = d === 1 ? 2 : r.pick([1, 2]), lo = neg ? -20 : 0, hi = neg ? 20 : 30;
    if (d < 3 || !neg) { const t = (neg ? r.int(-8, 9) : r.int(2, 14)) * step;
      if (d === 3) { const t2 = t + r.int(2, 8) * step; return { prompt: 'Rano było ' + deg(t) + ', a w południe ' + deg(t2) + '. O ile stopni się ociepliło?', value: N(t2 - t), unit: '°', wrong: [{ v: N(t2 + t), code: 'op_confuse' }, { v: N(t2), code: 'read' }].filter(w => w.v.n !== t2 - t), hints: ['„O ile" – odejmujemy.', t2 + ' − ' + t + ' = ?', 'Możesz liczyć kreski na termometrze.'], sol: [t2 + ' − ' + t + ' = ' + (t2 - t) + ' stopni'] }; }
      return { prompt: 'Jaką temperaturę pokazuje termometr? (wpisz liczbę stopni' + (neg ? '; mróz zapisz z minusem' : '') + ')', visual: thermoSvg(t, lo, hi, step), value: N(t), allowNeg: neg, wrong: [{ v: N(t + step), code: 'temp' }].concat(neg && t ? [{ v: N(-t), code: 'temp' }] : []).concat([ { v: N(t + (step === 1 ? 1 : -1)), code: 'temp' }]).filter(w => w.v.n !== t), hints: ['Sprawdź, co ile stopni są kreski: co ' + step + '°.', 'Znajdź najbliższą podpisaną kreskę pod czerwonym słupkiem.', neg ? 'Poniżej zera temperatura jest ujemna.' : 'Policz kreski w górę od tej liczby.'], sol: ['Termometr pokazuje ' + deg(t) + '.'] }; }
    const a = r.int(-9, -1), b = r.int(1, 9), up = r.chance(0.5);
    if (up) return { prompt: 'W nocy było ' + deg(a) + ', a w dzień ' + deg(b) + '. O ile stopni wzrosła temperatura?', value: N(b - a), unit: '°', wrong: [{ v: N(b + a), code: 'temp' }, { v: N(Math.abs(b + a)), code: 'temp' }].filter(w => w.v.n !== b - a), hints: ['Od ' + deg(a) + ' do 0°C to ' + -a + ' stopni.', 'Od 0°C do ' + deg(b) + ' to ' + b + ' stopni.', -a + ' + ' + b + ' = ?'], sol: [b + ' − (' + a + ') = ' + b + ' + ' + -a + ' = ' + (b - a)] };
    return { prompt: 'Było ' + deg(b) + '. Temperatura spadła o ' + (b - a) + ' stopni. Ile stopni jest teraz?', value: N(a), allowNeg: true, wrong: [{ v: N(-a), code: 'temp' }, { v: N(b + (b - a)), code: 'op_confuse' }], hints: ['Spadek – odejmujemy.', 'Od ' + deg(b) + ' do 0°C spada o ' + b + '.', 'Zostało jeszcze ' + (-a) + ' stopni poniżej zera.'], sol: [b + ' − ' + (b - a) + ' = ' + a, 'Teraz jest ' + deg(a) + '.'] };
  }
  def('temp', { name: 'Odczytywanie temperatury i obliczanie różnic', grade: 4, mainCode: 'temp', types: { 1: ['input', 'choice'], 2: ['input', 'choice'], 3: ['input', 'choice'] }, gen: (r, d) => tempGen(r, d, (MP.grade || 6) >= 4) });
  def('k2_temp', { name: 'Odczytywanie temperatury na termometrze', grade: 2, mainCode: 'temp', types: { 1: ['input', 'choice'], 2: ['input', 'choice'], 3: ['input', 'choice'] }, gen: (r, d) => tempGen(r, d, false) });

  // ---------- symetria (oś symetrii) ----------
  const SYMF = [ // [nazwa, svg, liczba osi]
    ['kwadrat', '<rect x="45" y="20" width="110" height="110" class="shape"/>', 4], ['prostokąt', '<rect x="20" y="40" width="160" height="80" class="shape"/>', 2],
    ['trójkąt równoboczny', '<polygon points="100,18 165,130 35,130" class="shape"/>', 3], ['trójkąt równoramienny', '<polygon points="100,15 145,135 55,135" class="shape"/>', 1],
    ['romb', '<polygon points="100,15 160,75 100,135 40,75" class="shape"/>', 2], ['trapez równoramienny', '<polygon points="65,30 135,30 175,125 25,125" class="shape"/>', 1],
    ['równoległobok', '<polygon points="60,35 180,35 140,120 20,120" class="shape"/>', 0], ['trójkąt różnoboczny', '<polygon points="30,130 175,130 70,25" class="shape"/>', 0],
    ['sześciokąt foremny', '<polygon points="60,20 140,20 180,75 140,130 60,130 20,75" class="shape"/>', 6], ['serce', '<path d="M100 135 C 20 80 30 20 75 25 C 92 28 100 45 100 55 C 100 45 108 28 125 25 C 170 20 180 80 100 135 Z" class="shape"/>', 1]
  ];
  function symGen(r, d, young) {
    const pool = young ? SYMF.filter(f => ['kwadrat', 'prostokąt', 'serce', 'trójkąt równoramienny', 'równoległobok', 'trójkąt różnoboczny'].includes(f[0])) : SYMF;
    if (d === 1 || young) { const f = r.pick(pool); const has = f[2] > 0;
      return ch(r, { prompt: 'Czy ta figura (' + f[0] + ') ma oś symetrii?', visual: svgW(200, 150, f[1], f[0]), correct: has ? 'tak' : 'nie', wrong: [[has ? 'nie' : 'tak', 'sym_axis']], keepOrder: true, hints: ['Wyobraź sobie, że składasz figurę na pół.', 'Czy obie połówki dokładnie by się pokryły?', has ? 'Spróbuj złożyć pionowo przez środek.' : 'Spróbuj złożyć na różne sposoby – części się nie pokrywają.'], sol: [has ? 'Tak – np. prosta przez środek dzieli ją na dwie pasujące połowy.' : 'Nie – żadne złożenie nie daje dwóch pokrywających się części.'] }); }
    const f = r.pick(pool.filter(x => x[0] !== 'serce'));
    return { prompt: 'Ile osi symetrii ma ' + f[0] + '?', visual: svgW(200, 150, f[1], f[0]), value: N(f[2]), wrong: [{ v: N(f[2] + 2), code: 'sym_axis' }, { v: N(f[2] === 0 ? 2 : f[2] / 2 | 0), code: 'sym_axis' }, { v: N(f[2] + 1), code: 'sym_axis' }].filter(w => w.v.n !== f[2]), hints: ['Oś symetrii dzieli figurę na dwie lustrzane połowy.', 'Sprawdź proste pionowe, poziome i ukośne (przekątne).', f[0] === 'równoległobok' ? 'Uwaga: przekątne równoległoboku NIE są osiami symetrii.' : f[0] === 'prostokąt' ? 'Przekątne prostokąta nie są osiami symetrii.' : 'Policz wszystkie możliwe złożenia.'], sol: [f[0] + ' ma ' + f[2] + ' ' + pl(f[2], 'oś', 'osie', 'osi') + ' symetrii.'] };
  }
  def('symmetry', { name: 'Oś symetrii figury', grade: 5, mainCode: 'sym_axis', types: { 1: ['choice'], 2: ['input', 'choice'], 3: ['input', 'choice'] }, gen: (r, d) => symGen(r, d, false),
    why: [{ q: 'Czy przekątna prostokąta (który nie jest kwadratem) jest jego osią symetrii?', opts: [{ t: 'Nie – po złożeniu wzdłuż przekątnej rogi nie trafiają na siebie', ok: true }, { t: 'Tak – każda przekątna jest osią symetrii', code: 'sym_axis' }, { t: 'Tak, ale tylko jedna', code: 'sym_axis' }], expl: 'Prostokąt ma tylko 2 osie symetrii: pionową i poziomą przez środek. Przekątne są osiami tylko w kwadracie.' }] });
  def('k2_sym', { name: 'Figury symetryczne', grade: 2, mainCode: 'sym_axis', types: { 1: ['choice'], 2: ['choice'], 3: ['choice'] }, gen: (r, d) => symGen(r, d, true) });
})(MP);
