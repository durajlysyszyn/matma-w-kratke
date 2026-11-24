/* curriculum_more.js — mapa materiału dla klas 1, 3, 4, 7 i 8.
   Rok szkolny 2026/2027: klasy 1 i 4 uczą się według nowej podstawy programowej (rozporządzenie MEN z 11 marca 2026),
   klasy 2, 3, 5–8 – według podstawy z 2017 r. Numery w polu pp odnoszą się do działów tych podstaw. */
var MP = (typeof window !== 'undefined' ? window : globalThis).MP;
(function (MP) {
  const T6 = {}; MP.CURR[6].forEach(dz => dz.topics.forEach(t => { T6[t.id] = t; }));
  const T5 = {}; MP.CURR[5].forEach(dz => dz.topics.forEach(t => { T5[t.id] = t; }));
  const pick = (id, skills, extra) => Object.assign({}, T6[id] || T5[id], skills ? { skills } : {}, extra || {});
  const t = (grade, pp) => (id, name, skills, explain, examples, mistakes, summary) => ({ id, name, grade, pp, skills, explain, examples: examples || [], mistakes: mistakes || [], summary: summary || [] });

  // ======================= KLASA 1 (nowa podstawa 2026) =======================
  const t1 = t('1', 'edukacja matematyczna (nowa podstawa 2026)');
  const D1 = [
    { id: 'k1_liczby', name: 'Liczby do 20 i dziesiątki do 100', icon: '20', pp: 'liczby', topics: [
      t1('k1t_count', 'Liczenie i zapisywanie liczb', ['k1_count'], '<p>Liczymy po kolei i dotykamy każdej rzeczy tylko raz. Gdy rzeczy jest dużo, układamy je w <b>piątki</b> i <b>dziesiątki</b> – wtedy liczy się szybciej.</p><p>Pełny rząd kropek to 10. Liczba 14 to pełna dziesiątka i 4 kropki.</p>', [{ t: 'Ile to kropek: pełny rząd i 3?', s: ['Pełny rząd = 10', '10 + 3 = 13'] }], ['Liczenie tej samej kropki dwa razy.'], ['Liczę przedmioty do 20.', 'Zapisuję liczby cyframi.']),
      t1('k1t_cmp', 'Porównywanie liczb', ['k1_cmp'], '<p>Znak <b>&gt;</b> czytamy „jest większe niż", <b>&lt;</b> – „jest mniejsze niż", <b>=</b> – „równa się".</p><p>Dzióbek znaku wskazuje mniejszą liczbę, a otwarta strona patrzy na większą – jakby krokodyl chciał zjeść więcej.</p>', [{ t: '12 □ 9', s: ['12 to więcej niż 9', '12 > 9'] }], ['Odwrócenie znaku.'], ['Porównuję liczby i używam znaków <, >, =.']),
      t1('k1t_tens', 'Dziesiątki do 100', ['k1_tens'], '<p>Liczymy dziesiątkami: 10, 20, 30, … 100. Liczba 40 to <b>4 dziesiątki</b>.</p><p>Dodając dziesiątki, dodajemy jak zwykłe liczby i dopisujemy zero: 30 + 20 → 3 + 2 = 5 → 50.</p>', [{ t: '60 − 20', s: ['6 dziesiątek − 2 dziesiątki = 4 dziesiątki', '60 − 20 = 40'] }], ['30 + 20 = 5 – zapomniane zero.'], ['Liczę dziesiątkami do 100.', 'Wiem, co znaczy cyfra dziesiątek i cyfra jedności.'])
    ] },
    { id: 'k1_dzial', name: 'Dodawanie i odejmowanie do 20', icon: '+', pp: 'liczby', topics: [
      t1('k1t_add', 'Dodawanie', ['k1_add'], '<p>Dodawanie to dokładanie. Najłatwiej zacząć od większej liczby i doliczyć mniejszą.</p><p>Gdy przekraczamy 10, najpierw <b>dopełniamy do 10</b>: 8 + 5 → 8 + 2 = 10, zostały jeszcze 3 → 13.</p>', [{ t: '7 + 6', s: ['7 + 3 = 10', 'zostały 3', '10 + 3 = 13'] }], ['Pomyłka o jeden przy liczeniu na palcach.'], ['Dodaję w zakresie 20.', 'Dopełniam do 10.']),
      t1('k1t_sub', 'Odejmowanie', ['k1_sub'], '<p>Odejmowanie to zabieranie. Możesz liczyć w tył albo iść <b>przez 10</b>: 13 − 5 → 13 − 3 = 10, potem jeszcze − 2 = 8.</p><p>Wynik sprawdzisz dodawaniem: 8 + 5 = 13 ✓.</p>', [{ t: '15 − 7', s: ['15 − 5 = 10', '10 − 2 = 8'] }], ['Dodawanie zamiast odejmowania.'], ['Odejmuję w zakresie 20.', 'Sprawdzam dodawaniem.']),
      t1('k1t_box', 'Okienka', ['k1_box'], '<p>Okienko □ chowa liczbę. Szukamy takiej, żeby działanie było prawdziwe.</p><p>7 + □ = 12 → ile trzeba dołożyć do 7, żeby było 12? Liczymy: 8, 9, 10, 11, 12 – to 5.</p>', [], [], ['Znajduję brakującą liczbę.'])
    ] },
    { id: 'k1_zad', name: 'Zadania z treścią', icon: '✎', pp: 'sytuacje problemowe', topics: [
      t1('k1t_word', 'Zadania z treścią', ['k1_word'], '<p>Czytamy zadanie (albo słuchamy, gdy ktoś czyta) i pytamy siebie: <b>będzie więcej czy mniej?</b> Więcej – dodajemy. Mniej – odejmujemy.</p><p>Możesz narysować kółka – rysunek bardzo pomaga.</p>', [{ t: 'Ola miała 9 naklejek, dostała 4.', s: ['Ma więcej – dodajemy', '9 + 4 = 13'] }], ['Wybór złego działania.'], ['Rozwiązuję proste zadania z treścią.']),
      t1('k1t_half', 'Połowa i ćwiartka', ['k1_half'], '<p><b>Połowa</b> to jedna z dwóch równych części – jak pół jabłka. Połowa z 8 to 4, bo 4 + 4 = 8.</p><p><b>Ćwiartka</b> to jedna z czterech równych części – jak kawałek pizzy pokrojonej na 4.</p>', [], ['Mylenie połowy z ćwiartką.'], ['Dzielę na połowy i ćwiartki.'])
    ] },
    { id: 'k1_miary', name: 'Pieniądze, czas i mierzenie', icon: '⏰', pp: 'miary', topics: [
      t1('k1t_money', 'Pieniądze', ['k1_money'], '<p>Monety: 1 gr, 2 gr, 5 gr, 10 gr, 20 gr, 50 gr, 1 zł, 2 zł, 5 zł. Banknoty: 10 zł, 20 zł, 50 zł, 100 zł…</p><p><b>1 zł = 100 gr.</b> Liczymy wartość monet, a nie ich liczbę: 5 zł + 2 zł to 7 zł, choć monety są tylko dwie.</p>', [], ['Liczenie monet zamiast ich wartości.'], ['Rozpoznaję monety i banknoty.', 'Liczę pieniądze i resztę.']),
      t1('k1t_clock', 'Zegar', ['k1_clock'], '<p>Zegar ma dwie wskazówki. <b>Mała</b> pokazuje godzinę, <b>duża</b> – minuty. Gdy duża stoi na 12, jest pełna godzina, np. 3:00.</p>', [], ['Mylenie wskazówek.'], ['Odczytuję pełne godziny.']),
      t1('k1t_cal', 'Dni tygodnia i miesiące', ['k2_cal'], '<p>Tydzień ma 7 dni: poniedziałek, wtorek, środa, czwartek, piątek, sobota, niedziela. Rok ma 12 miesięcy: styczeń, luty, marzec, kwiecień, maj, czerwiec, lipiec, sierpień, wrzesień, październik, listopad, grudzień.</p>', [], ['Liczenie dziś jako pierwszego dnia „za 2 dni".'], ['Nazywam dni tygodnia i miesiące.']),
      t1('k1t_meas', 'Długość, masa, pojemność', ['k1_meas'], '<p><b>Długość</b> mierzymy linijką w centymetrach (cm); 100 cm to 1 metr (m). <b>Masę</b> – na wadze w kilogramach (kg). <b>Płyny</b> – w litrach (l).</p>', [], ['1 m = 10 cm ✗.'], ['Mierzę i porównuję długości.', 'Liczę w cm, kg i l.'])
    ] },
    { id: 'k1_geo', name: 'Figury i rytmy', icon: '△', pp: 'figury, dane', topics: [
      t1('k1t_shapes', 'Figury geometryczne', ['k1_shapes', 'k2_sym'], '<p>Poznajemy cztery figury: <b>koło</b> (bez rogów), <b>trójkąt</b> (3 rogi), <b>kwadrat</b> (4 rogi, wszystkie boki równe) i <b>prostokąt</b> (4 rogi, dwa boki dłuższe, dwa krótsze).</p><p>Figura jest <b>symetryczna</b>, gdy po złożeniu na pół obie części dokładnie się pokrywają – jak skrzydła motyla.</p>', [], ['Mylenie kwadratu z prostokątem.'], ['Rozpoznaję i nazywam figury.', 'Dostrzegam symetrię.']),
      t1('k1t_pattern', 'Rytmy i sekwencje', ['k1_pattern'], '<p>Rytm to coś, co się powtarza: 🔴🔵🔴🔵… Znajdź kawałek, który się powtarza, i powtarzaj go dalej.</p><p>Liczby też mogą tworzyć rytm: 2, 4, 6, 8… (co 2).</p>', [], [], ['Kontynuuję rytmy i sekwencje.'])
    ] }
  ];

  // ======================= KLASA 3 (podstawa 2017) =======================
  const t3 = t('3', 'edukacja matematyczna');
  const D3 = [
    { id: 'k3_liczby', name: 'Liczby do 1000', icon: '1000', pp: 'rozumienie liczb', topics: [
      t3('k3t_num', 'Setki, dziesiątki, jedności', ['k3_num'], '<p>Liczby trzycyfrowe mają <b>setki</b>, <b>dziesiątki</b> i <b>jedności</b>. 347 = 3 setki + 4 dziesiątki + 7 jedności = 300 + 40 + 7.</p><p>Zero „trzyma miejsce": 405 to 4 setki, 0 dziesiątek i 5 jedności.</p><p>Porównujemy od lewej: najpierw setki, potem dziesiątki, na końcu jedności.</p>', [{ t: '508 i 580', s: ['Setki: 5 i 5 – równe', 'Dziesiątki: 0 i 8', '508 < 580'] }], ['Pominięcie zera: 4 setki i 5 jedności to 405, nie 45.'], ['Odczytuję i zapisuję liczby do 1000.', 'Porównuję liczby do 1000.']),
      t3('k3t_roman', 'Liczby rzymskie (I–XII)', ['nat_roman'], '<p>Rzymianie używali liter: <b>I = 1, V = 5, X = 10</b>. Znak mniejszy przed większym odejmujemy (IV = 4, IX = 9), za większym – dodajemy (VI = 6, XI = 11).</p><p>Liczby rzymskie spotkasz na zegarach i przy oznaczaniu miesięcy.</p>', [{ t: 'VIII', s: ['V = 5', 'III = 3', '5 + 3 = 8'] }], ['IV czytane jako 6.'], ['Odczytuję i zapisuję liczby rzymskie od I do XII.'])
    ] },
    { id: 'k3_dzial', name: 'Działania', icon: '±', pp: 'działania', topics: [
      t3('k3t_add', 'Dodawanie i odejmowanie', ['k2_add', 'k2_sub', 'k3_add'], '<p>Dodając i odejmując duże liczby, rozkładamy jedną z nich na setki, dziesiątki i jedności: 356 + 230 = 356 + 200 + 30 = 586.</p><p>Odejmowanie zawsze możesz sprawdzić dodawaniem.</p>', [{ t: '720 − 350', s: ['720 − 300 = 420', '420 − 50 = 370'] }], ['Dodanie setek do dziesiątek.'], ['Dodaję i odejmuję w zakresie 100 i proste przykłady do 1000.']),
      t3('k3t_mul', 'Tabliczka mnożenia do 100', ['tabl'], '<p>Mnożenie to szybkie dodawanie tych samych liczb: 6 · 7 = 7 + 7 + 7 + 7 + 7 + 7 = 42.</p><p>Dzielenie sprawdzamy mnożeniem: 42 : 6 = 7, bo 6 · 7 = 42. Trudne iloczyny możesz rozłożyć: 8 · 7 = 8 · 5 + 8 · 2 = 40 + 16 = 56.</p>', [], ['Mylenie 6 · 8 i 7 · 8.'], ['Mnożę i dzielę w zakresie tabliczki mnożenia.']),
      t3('k3t_box', 'Okienka i równania', ['k3_box'], '<p>Aby znaleźć liczbę w okienku, użyj <b>działania odwrotnego</b>: dodawanie ↔ odejmowanie, mnożenie ↔ dzielenie.</p><p>□ · 6 = 42 → □ = 42 : 6 = 7. Zawsze sprawdź: 7 · 6 = 42 ✓.</p>', [], ['Mnożenie zamiast dzielenia przy szukaniu okienka.'], ['Rozwiązuję proste równania z okienkiem.'])
    ] },
    { id: 'k3_zad', name: 'Zadania z treścią', icon: '✎', pp: 'czytanie tekstów matematycznych', topics: [
      t3('k3t_word', 'Zadania jedno- i dwudziałaniowe', ['k3_word'], '<p>Uważaj na słowa: <b>„o ile więcej"</b> – odejmujemy, <b>„ile razy więcej"</b> – dzielimy, <b>„3 razy więcej niż"</b> – mnożymy.</p><p>W zadaniach dwudziałaniowych najpierw ustal, co trzeba policzyć <b>najpierw</b>, a co potem.</p>', [{ t: '4 paczki po 6 kredek i 5 osobno', s: ['4 · 6 = 24', '24 + 5 = 29'] }], ['Mylenie „o ile" z „ile razy".'], ['Rozwiązuję zadania jedno- i dwudziałaniowe.'])
    ] },
    { id: 'k3_obl', name: 'Pieniądze, czas, miary', icon: '⏰', pp: 'obliczenia praktyczne', topics: [
      t3('k3t_money', 'Złote i grosze', ['k3_money'], '<p><b>1 zł = 100 gr.</b> Licząc ceny z groszami, najprościej zamienić wszystko na grosze, policzyć, a potem zamienić z powrotem: 350 gr = 3 zł 50 gr.</p>', [], ['1 zł = 10 gr ✗.'], ['Liczę pieniądze w złotych i groszach.']),
      t3('k3t_clock', 'Zegar i upływ czasu', ['k3_clock'], '<p>Duża wskazówka pokazuje minuty – każda liczba na tarczy to 5 minut. <b>Godzina ma 60 minut</b>, a doba – 24 godziny (po południu 3:00 to 15:00).</p><p>Upływ czasu licz przez pełną godzinę: od 8:40 do 9:15 → 20 min do 9:00 i 15 min → 35 min.</p>', [], ['Liczenie godziny jako 100 minut.'], ['Odczytuję godziny i minuty.', 'Obliczam upływ czasu.']),
      t3('k3t_cal', 'Kalendarz', ['k3_cal'], '<p>Miesiące mają 30 lub 31 dni, a luty – 28 (w roku przestępnym 29). Policz na knykciach: knykieć – 31 dni, dołek – 30 (luty mniej).</p>', [], ['Zła liczba dni w miesiącu.'], ['Korzystam z kalendarza i liczę dni.']),
      t3('k3t_units', 'Długość, masa, pojemność', ['k3_units'], '<p><b>Długość:</b> 1 cm = 10 mm, 1 m = 100 cm, 1 km = 1000 m.<br><b>Masa:</b> 1 kg = 100 dag, 1 dag = 10 g.<br><b>Pojemność:</b> 1 l = 2 · pół litra = 4 · ćwierć litra.</p>', [], ['Mylenie przeliczników.'], ['Zamieniam jednostki długości, masy i pojemności.']),
      t3('k3t_temp', 'Temperatura', ['temp'], '<p>Termometr ma podziałkę – sprawdź, co ile stopni są kreski. Temperatura rośnie, gdy czerwony słupek idzie w górę.</p>', [], ['Odczyt bez sprawdzenia podziałki.'], ['Odczytuję temperaturę.'])
    ] },
    { id: 'k3_geo', name: 'Geometria', icon: '▭', pp: 'pojęcia geometryczne', topics: [
      t3('k3t_perim', 'Obwody figur', ['perim'], '<p><b>Obwód</b> to długość wszystkich boków razem – jakbyś obchodził figurę dookoła.</p><p>Prostokąt: dwa boki dłuższe i dwa krótsze: 5 + 3 + 5 + 3 = 16 cm. Kwadrat: 4 równe boki: 4 · bok.</p>', [], ['Dodanie tylko dwóch boków.'], ['Obliczam obwód trójkąta, prostokąta i kwadratu.']),
      t3('k3t_sym', 'Symetria', ['k2_sym'], '<p>Figura jest symetryczna, gdy po złożeniu na pół obie części dokładnie się pokrywają. Linia złożenia to <b>oś symetrii</b>.</p>', [], [], ['Rozpoznaję figury symetryczne.'])
    ] }
  ];

  // ======================= KLASA 4 (nowa podstawa 2026) =======================
  const t4 = t('4', 'nowa podstawa 2026');
  const D4 = [
    { id: 'k4_liczby', name: 'Liczby naturalne', icon: 'N', pp: 'liczby naturalne', topics: [
      t4('k4t_zap', 'Liczby wielocyfrowe', ['nat_cmp'], '<p>Cyfry duże liczby czytamy grupami po trzy od prawej: <b>jedności, tysiące, miliony</b>. 45 382 to „czterdzieści pięć tysięcy trzysta osiemdziesiąt dwa".</p><p>Porównując, najpierw sprawdź liczbę cyfr; przy tej samej – porównuj od lewej.</p>', [], ['Porównanie tylko pierwszych cyfr.'], ['Zapisuję i porównuję liczby wielocyfrowe.']),
      t4('k4t_os', 'Oś liczbowa', ['nat_axis'], '<p>Na osi liczbowej działki są równe. Najpierw ustal, ile wynosi <b>jedna działka</b>: różnicę dwóch podpisanych liczb podziel przez liczbę działek między nimi.</p>', [{ t: 'Od 100 do 200 jest 5 działek', s: ['200 − 100 = 100', '100 : 5 = 20 – jedna działka'] }], ['Przyjęcie, że działka to zawsze 1.'], ['Ustalam podziałkę i odczytuję liczby z osi.']),
      t4('k4t_rzym', 'System rzymski', ['nat_roman'], '<p>Znaki: I = 1, V = 5, X = 10, L = 50, C = 100. Mniejszy przed większym odejmujemy (IV = 4, IX = 9, XL = 40), za większym – dodajemy.</p><p>Wiek zapisujemy cyframi rzymskimi: rok 1410 to XV wiek.</p>', [], ['IIII zamiast IV.'], ['Odczytuję i zapisuję liczby rzymskie do XXXIX.'])
    ] },
    { id: 'k4_dzial', name: 'Działania na liczbach naturalnych', icon: '+', pp: 'działania', topics: [
      t4('k4t_pam', 'Rachunek pamięciowy', ['nat_mental', 'tabl', 'nat_div_rem'], '<p>Liczymy sprytnie: dopełniamy do pełnych dziesiątek i setek (1000 − 365 → 365 + 5 = 370, 370 + 30 = 400, 400 + 600 = 1000 → 635), rozkładamy liczby (34 · 6 = 30 · 6 + 4 · 6) i zmieniamy kolejność czynników (25 · 7 · 4 = 100 · 7).</p>', [], ['Zgubione przeniesienie przy liczeniu w pamięci.'], ['Liczę w pamięci, wybierając sprytną strategię.']),
      t4('k4t_szac', 'Szacowanie', ['nat_round', 'nat_est'], '<p>Szacujemy, zaokrąglając liczby: 398 + 512 ≈ 400 + 500 = 900. Szacowanie pozwala sprawdzić, czy dokładny wynik ma sens.</p>', [], ['Szacowanie dalekie od wyniku przez złe zaokrąglenie.'], ['Szacuję wyniki i oceniam ich sensowność.']),
      pick('nat_mem', ['nat_pis'], { name: 'Działania pisemne', grade: '4' }),
      pick('nat_ord', null, { grade: '4' }), pick('nat_pot', null, { grade: '4' })
    ] },
    { id: 'k4_podz', name: 'Podzielność', icon: '÷', pp: 'podzielność', topics: [
      t4('k4t_dziel', 'Dzielniki liczby', ['divisors'], '<p>Dzielnik liczby to liczba, przez którą dzieli się ona bez reszty. Szukaj ich parami: 12 = 1 · 12 = 2 · 6 = 3 · 4 → dzielniki: 1, 2, 3, 4, 6, 12.</p>', [], ['Pominięcie 1 albo samej liczby.'], ['Wypisuję dzielniki liczb dwucyfrowych.']),
      pick('podz_cech', null, { grade: '4' })
    ] },
    { id: 'k4_tekst', name: 'Zadania tekstowe', icon: '✎', pp: 'rozwiązywanie zadań', topics: [
      t4('k4t_tekst', 'Zadania wielodziałaniowe', ['k3_word'], '<p>Wypisz <b>dane</b> i <b>szukane</b>, zrób rysunek lub krótką notatkę i zaplanuj kolejne kroki. Po rozwiązaniu sprawdź, czy wynik ma sens.</p>', [], ['Odpowiedź na inne pytanie niż zadane.'], ['Planuję rozwiązanie zadania w kilku krokach.'])
    ] },
    { id: 'k4_geo', name: 'Figury geometryczne', icon: '∠', pp: 'geometria', topics: [
      t4('k4t_pod', 'Punkt, odcinek, prosta, półprosta', ['geo_basic'], '<p><b>Odcinek</b> ma dwa końce. <b>Półprosta</b> ma początek, ale biegnie bez końca w jedną stronę. <b>Prosta</b> biegnie bez końca w obie strony.</p><p>W wielokącie wyróżniamy boki, wierzchołki, kąty i przekątne (łączą wierzchołki niesąsiednie).</p>', [], ['Nazwanie boku przekątną.'], ['Rozpoznaję i nazywam figury.', 'Liczę przekątne wielokąta.']),
      t4('k4t_rown', 'Proste prostopadłe i równoległe', ['lines'], '<p>Proste <b>równoległe</b> nigdy się nie przetną (jak tory). Proste <b>prostopadłe</b> przecinają się pod kątem prostym (jak róg kartki).</p><p>Odległość punktu od prostej mierzymy odcinkiem prostopadłym.</p>', [], ['Mylenie równoległych z prostopadłymi.'], ['Rozpoznaję proste prostopadłe i równoległe.']),
      t4('k4t_katy', 'Kąty', ['ang_type', 'ang_measure'], '<p>Kąt ostry – mniejszy niż prosty (90°), prosty – 90°, rozwarty – większy niż 90°, ale mniejszy niż 180°, półpełny – 180°.</p><p>Kąty mierzymy kątomierzem w stopniach.</p>', [], ['Odczyt z niewłaściwej skali kątomierza.'], ['Rozpoznaję rodzaje kątów i szacuję ich miary.']),
      pick('miary_skala', null, { grade: '4' })
    ] },
    { id: 'k4_miary', name: 'Miary, obwody, pola, objętość', icon: '▭', pp: 'miary', topics: [
      pick('miary_dl', null, { grade: '4' }), pick('miary_czas', null, { grade: '4' }), pick('pole_obw', null, { grade: '4' }), pick('pole_pros', null, { grade: '4' }),
      t4('k4t_obj', 'Objętość i pojemność', ['vol_units', 'vol_box'], '<p>Objętość prostopadłościanu: a · b · c. Pojemność płynów mierzymy w litrach i mililitrach: <b>1 l = 1 dm³ = 1000 ml</b>, 1 ml = 1 cm³.</p>', [], ['1 l = 100 ml ✗.'], ['Zamieniam jednostki objętości i pojemności.'])
    ] },
    { id: 'k4_uz', name: 'Ułamki zwykłe', icon: '½', pp: 'ułamki (poziom rozszerzony)', topics: [pick('uz_poj', null, { grade: '4' }), pick('uz_rozsz', null, { grade: '4' }), pick('uz_por', null, { grade: '4' }), pick('uz_miesz', null, { grade: '4' }), pick('duz_dod', ['fr_add_same'], { grade: '4' })] }
  ];

  // ======================= KLASA 7 (podstawa 2017) =======================
  const t7 = (pp) => t('7', pp);
  const D7 = [
    { id: 'k7_liczby', name: 'Liczby i działania', icon: 'ℚ', pp: 'kl. 4–6: I–V', topics: [pick('ud_niesk', null, { grade: '7' }), pick('ud_zaok', null, { grade: '7' }),
      t7('kl. 4–6: III, V')('k7t_wym', 'Działania na liczbach dodatnich i ujemnych', ['int_add', 'int_mul', 'rat_ops'], '<p>Znaki przy mnożeniu i dzieleniu: <b>plus · plus = plus</b>, <b>minus · minus = plus</b>, <b>plus · minus = minus</b>. Odejmowanie liczby ujemnej to dodawanie liczby przeciwnej: 3 − (−2) = 3 + 2.</p><p>Ułamki dziesiętne i zwykłe w jednym działaniu zamień na jeden zapis.</p>', [{ t: '−0,5 · 3/4', s: ['−1/2 · 3/4', '= −3/8'] }], ['−3 − 2 = −1 ✗ (powinno −5).'], ['Wykonuję działania na liczbach wymiernych.']),
      pick('dud_mix', null, { grade: '7' })] },
    { id: 'k7_proc', name: 'Procenty', icon: '%', pp: 'V', topics: [pick('proc_poj', null, { grade: '7' }), pick('proc_licz', null, { grade: '7' }),
      t7('V.1–2')('k7t_jaki', 'Jaki to procent?', ['pct_what'], '<p>Jaką częścią liczby b jest a? Zapisz ułamek a/b i zamień go na procenty (pomnóż przez 100%).</p>', [{ t: '12 z 40', s: ['12/40 = 3/10', '3/10 = 30%'] }], ['Dzielenie odwrotnie (b : a).'], ['Obliczam, jakim procentem jednej liczby jest druga.']),
      t7('V.3')('k7t_calosc', 'Liczba z jej procentu', ['pct_whole'], '<p>Znamy część (np. 30%), szukamy całości (100%). Policz 1% i pomnóż przez 100. Po podwyżce o 20% nowa cena to 120% starej – starą cenę dostaniesz, dzieląc przez 1,2.</p>', [], ['Odjęcie 20% od nowej ceny zamiast dzielenia przez 1,2.'], ['Obliczam liczbę, gdy znam jej procent.']),
      t7('V.4')('k7t_zmiana', 'Podwyżki i obniżki', ['pct_change'], '<p>Podwyżka o p%: nowa cena = stara · (100 + p)%. Obniżka: stara · (100 − p)%. Kolejne zmiany liczymy zawsze od <b>nowej</b> wartości.</p>', [], ['+20% i −20% to nie zero zmian – to −4%.'], ['Obliczam ceny po podwyżkach i obniżkach.']),
      t7('V.5')('k7t_pp', 'Punkty procentowe', ['pct_points'], '<p>Z 20% na 25%: wzrost o <b>5 punktów procentowych</b> (różnica), ale o <b>25 procent</b> (bo 5 to 25% z 20).</p>', [], [], ['Odróżniam procenty od punktów procentowych.'])] },
    { id: 'k7_fig', name: 'Figury na płaszczyźnie', icon: '△', pp: 'VIII, IX, X', topics: [pick('kat_wp', null, { grade: '7' }), pick('kat_tr', null, { grade: '7' }), pick('wiel_tr', null, { grade: '7' }),
      t7('VIII.4')('k7t_przyst', 'Przystawanie trójkątów', ['tri_cong'], '<p>Trójkąty przystające to trójkąty identyczne. Wystarczy sprawdzić jedną z cech: <b>bbb</b> (trzy boki), <b>bkb</b> (dwa boki i kąt między nimi), <b>kbk</b> (bok i dwa kąty przy nim).</p>', [], ['Uznanie trójkątów o równych kątach za przystające.'], ['Stosuję cechy przystawania trójkątów.']),
      pick('wiel_czw', null, { grade: '7' }),
      t7('IX.1–3')('k7t_forem', 'Wielokąty foremne', ['poly_reg'], '<p>Suma kątów n-kąta to <b>(n − 2) · 180°</b>. W wielokącie foremnym wszystkie boki i kąty są równe, więc jeden kąt to suma : n.</p>', [{ t: 'Sześciokąt foremny', s: ['(6 − 2) · 180° = 720°', '720° : 6 = 120°'] }], ['n · 180° zamiast (n − 2) · 180°.'], ['Obliczam kąty wielokątów foremnych.']),
      pick('pole_pros', null, { grade: '7' }), pick('pole_tr', null, { grade: '7' }), pick('pole_rown', null, { grade: '7' }), pick('pole_trap', null, { grade: '7' }), pick('pole_jedn', null, { grade: '7' }),
      t7('X.1–3')('k7t_uklad', 'Układ współrzędnych', ['coord'], '<p>Punkt ma dwie współrzędne (x, y): <b>x</b> – o ile w prawo (+) lub w lewo (−) od początku układu, <b>y</b> – o ile w górę (+) lub w dół (−).</p>', [], ['Zamiana x z y.'], ['Odczytuję i zaznaczam punkty w układzie współrzędnych.'])] },
    { id: 'k7_alg', name: 'Wyrażenia algebraiczne', icon: 'x', pp: 'III, IV', topics: [pick('alg_wyr', null, { grade: '7' }),
      t7('IV.1')('k7t_red', 'Redukcja wyrazów podobnych', ['alg_like'], '<p>Wyrazy podobne mają tę samą literę w tej samej potędze: 3x i −5x są podobne, a 3x i 3x² – nie. Dodajemy tylko współczynniki: 3x + 5x = 8x.</p>', [{ t: '2a + 3b − a + 4b', s: ['a: 2 − 1 = 1', 'b: 3 + 4 = 7', '= a + 7b'] }], ['3x + 2 = 5x ✗.'], ['Redukuję wyrazy podobne.']),
      t7('IV.2–3')('k7t_nawias', 'Mnożenie przez sumę', ['alg_mul'], '<p>Liczbę przed nawiasem mnożymy przez <b>każdy</b> wyraz w nawiasie: 3(2x − 5) = 6x − 15. Minus przed nawiasem zmienia znaki wszystkich wyrazów: −(x − 4) = −x + 4.</p>', [], ['3(x − 5) = 3x − 5 ✗.'], ['Opuszczam nawiasy.']),
      t7('IV.4')('k7t_sumy', 'Mnożenie sum algebraicznych', ['alg_binom'], '<p>(a + b)(c + d) = ac + ad + bc + bd – każdy wyraz z pierwszego nawiasu razy każdy z drugiego. Potem redukujemy wyrazy podobne.</p>', [{ t: '(x + 3)(x − 2)', s: ['x² − 2x + 3x − 6', '= x² + x − 6'] }], ['(x + 3)(x − 2) = x² − 6 ✗.'], ['Mnożę sumy algebraiczne.'])] },
    { id: 'k7_row', name: 'Równania', icon: '=', pp: 'VI', topics: [pick('alg_row', null, { grade: '7' }),
      t7('VI.2–3')('k7t_rown', 'Równania z nawiasami i ułamkami', ['eq_lin'], '<p>Kolejność: opuść nawiasy → wyrazy z x na jedną stronę, liczby na drugą (zmieniając znak) → zredukuj → podziel przez współczynnik przy x. Na końcu <b>sprawdź</b>, wstawiając wynik.</p>', [{ t: '3(x − 2) = x + 4', s: ['3x − 6 = x + 4', '2x = 10', 'x = 5'] }], ['Przeniesienie wyrazu bez zmiany znaku.'], ['Rozwiązuję równania pierwszego stopnia.']),
      t7('VI.4')('k7t_rzad', 'Zadania tekstowe z równaniami', ['eq_word'], '<p>Oznacz niewiadomą literą (co to jest x?), zapisz zależności z treści jako równanie, rozwiąż je i odpowiedz na pytanie z zadania.</p>', [], ['Rozwiązanie równania, ale odpowiedź na inne pytanie.'], ['Rozwiązuję zadania tekstowe za pomocą równań.']),
      t7('VI.5')('k7t_wzory', 'Przekształcanie wzorów', ['formula'], '<p>Wzór traktujemy jak równanie: chcemy, żeby szukana wielkość została sama po jednej stronie. Wykonujemy te same działania po obu stronach.</p>', [{ t: 'P = a · h : 2, wyznacz h', s: ['2P = a · h', 'h = 2P : a'] }], [], ['Wyznaczam wielkość ze wzoru.'])] },
    { id: 'k7_pot', name: 'Potęgi i pierwiastki', icon: 'xⁿ', pp: 'I, II', topics: [pick('nat_pot', ['pow_nat'], { grade: '7' }),
      t7('I.2–4')('k7t_dzpot', 'Działania na potęgach', ['pow_rules'], '<p>Dla tej samej podstawy: <b>aᵐ · aⁿ = aᵐ⁺ⁿ</b>, <b>aᵐ : aⁿ = aᵐ⁻ⁿ</b>, <b>(aᵐ)ⁿ = aᵐ·ⁿ</b>.</p>', [], ['2³ · 2² = 2⁶ ✗.'], ['Mnożę, dzielę i potęguję potęgi.']),
      t7('I.5')('k7t_notacja', 'Notacja wykładnicza', ['pow_sci'], '<p>Bardzo duże i bardzo małe liczby zapisujemy jako a · 10ⁿ, gdzie 1 ≤ a < 10. 45 000 = 4,5 · 10⁴; 0,0032 = 3,2 · 10⁻³.</p>', [], ['Zły znak wykładnika.'], ['Zapisuję liczby w notacji wykładniczej.']),
      t7('II.1–2')('k7t_pierw', 'Pierwiastki', ['root'], '<p>√a to liczba nieujemna, której kwadrat to a: √49 = 7. ∛a – liczba, której sześcian to a: ∛(−8) = −2.</p>', [], ['√36 = 18 ✗.'], ['Obliczam pierwiastki kwadratowe i sześcienne.']),
      t7('II.3–4')('k7t_dzpierw', 'Działania na pierwiastkach', ['root_ops'], '<p><b>√a · √b = √(ab)</b>, √a : √b = √(a : b). Czynnik wyłączamy przed pierwiastek: √50 = √(25 · 2) = 5√2. Pierwiastków NIE dodajemy: √9 + √16 ≠ √25.</p>', [], ['√(9 + 16) = 3 + 4 ✗.'], ['Mnożę pierwiastki i wyłączam czynnik przed pierwiastek.'])] },
    { id: 'k7_pit', name: 'Twierdzenie Pitagorasa', icon: '⊿', pp: 'VIII.7', topics: [
      t7('VIII.7')('k7t_pit', 'Twierdzenie Pitagorasa', ['pyth'], '<p>W trójkącie prostokątnym: <b>a² + b² = c²</b>, gdzie c to przeciwprostokątna (najdłuższy bok, naprzeciw kąta prostego).</p><p>Szukasz przeciwprostokątnej – dodaj kwadraty. Szukasz przyprostokątnej – odejmij.</p>', [{ t: 'a = 6, b = 8', s: ['36 + 64 = 100', 'c = √100 = 10'] }], ['Dodanie boków zamiast kwadratów.'], ['Stosuję twierdzenie Pitagorasa.']),
      t7('IX.4')('k7t_spec', 'Przekątna kwadratu, wysokość trójkąta równobocznego', ['pyth_special'], '<p>Przekątna kwadratu o boku a: <b>a√2</b>. Wysokość trójkąta równobocznego o boku a: <b>a√3 / 2</b>. W trójkącie 30–60–90 przeciwprostokątna jest 2 razy dłuższa od krótszej przyprostokątnej.</p>', [], [], ['Korzystam z zależności w trójkątach 45–45–90 i 30–60–90.'])] },
    { id: 'k7_stat', name: 'Statystyka i prawdopodobieństwo', icon: '📊', pp: 'XII, XIII', topics: [pick('stat_odcz', null, { grade: '7' }),
      t7('XIII.3')('k7t_sred', 'Średnia arytmetyczna', ['mean'], '<p>Średnia = suma danych : liczba danych. Jeśli znasz średnią, sumę policzysz odwrotnie: suma = średnia · liczba danych.</p>', [], ['Dzielenie przez złą liczbę danych.'], ['Obliczam średnią arytmetyczną.']),
      t7('XII.1–2')('k7t_zdarz', 'Zdarzenia losowe', ['prob_basic'], '<p>Prawdopodobieństwo = liczba wyników sprzyjających : liczba wszystkich wyników. Kostka ma 6 wyników, moneta – 2.</p>', [{ t: 'Parzysta liczba oczek', s: ['Sprzyjające: 2, 4, 6', 'P = 3/6 = 1/2'] }], [], ['Obliczam prawdopodobieństwo prostych zdarzeń.']), pick('stat_zb', null, { grade: '7' })] }
  ];

  // ======================= KLASA 8 (podstawa 2017) =======================
  const t8 = (pp) => t('8', pp);
  const D8 = [
    { id: 'k8_liczby', name: 'Liczby i działania', icon: 'N', pp: 'I, II, kl. 4–6', topics: [
      t8('kl. 4–6: I.4')('k8t_rzym', 'System rzymski', ['nat_roman'], '<p>Znaki: I = 1, V = 5, X = 10, L = 50, C = 100, D = 500, M = 1000. Mniejszy znak przed większym odejmujemy: IV = 4, XC = 90, CM = 900. Tego samego znaku piszemy najwyżej 3 razy z rzędu.</p>', [{ t: 'MCMXCIV', s: ['M = 1000', 'CM = 900', 'XC = 90', 'IV = 4', '= 1994'] }], ['CCCC zamiast CD.'], ['Zapisuję i odczytuję liczby rzymskie do 3000.']),
      pick('podz_cech', null, { grade: '8' }), pick('podz_pierw', null, { grade: '8' }), pick('podz_nwd', null, { grade: '8' }),
      t8('I, II')('k8t_potpierw', 'Działania na potęgach i pierwiastkach', ['pow_rules', 'pow_sci', 'root_ops'], '<p>Powtórka: aᵐ · aⁿ = aᵐ⁺ⁿ, (aᵐ)ⁿ = aᵐ·ⁿ, √a · √b = √(ab). W notacji wykładniczej 1 ≤ a < 10.</p>', [], ['Dodawanie pierwiastków jak liczb pod nimi.'], ['Sprawnie działam na potęgach i pierwiastkach.'])] },
    { id: 'k8_alg', name: 'Wyrażenia algebraiczne i równania', icon: 'x', pp: 'IV, VI, VII', topics: [
      t8('IV')('k8t_przekszt', 'Przekształcenia algebraiczne', ['alg_mul', 'alg_binom'], '<p>Opuszczamy nawiasy (mnożymy każdy wyraz) i redukujemy wyrazy podobne. Uważaj na minus przed nawiasem.</p>', [], [], ['Upraszczam wyrażenia algebraiczne.']),
      t8('VI')('k8t_rown', 'Równania i wzory', ['eq_lin', 'formula'], '<p>Równanie rozwiązujemy, wykonując te same działania po obu stronach. Wzór przekształcamy tak samo – aż szukana zostanie sama.</p>', [], [], ['Rozwiązuję równania i przekształcam wzory.']),
      t8('VII.1')('k8t_prop', 'Proporcje', ['proportion'], '<p>Proporcja a : b = c : d jest prawdziwa, gdy <b>a · d = b · c</b> (iloczyn skrajnych = iloczyn środkowych).</p>', [{ t: '3 : 5 = 12 : x', s: ['3x = 60', 'x = 20'] }], [], ['Rozwiązuję proporcje.']),
      t8('VII.2')('k8t_wprost', 'Wielkości wprost proporcjonalne', ['direct_prop'], '<p>Dwie wielkości są wprost proporcjonalne, gdy ile razy wzrośnie jedna, tyle razy wzrośnie druga – ich iloraz jest stały (y = k · x).</p>', [], ['Dodawanie różnicy zamiast mnożenia.'], ['Rozpoznaję i wykorzystuję proporcjonalność prostą.'])] },
    { id: 'k8_fig', name: 'Figury na płaszczyźnie', icon: '⊿', pp: 'VIII, IX, X', topics: [
      t8('VIII.7')('k8t_pit', 'Twierdzenie Pitagorasa – zastosowania', ['pyth', 'pyth_special'], '<p>a² + b² = c². Przekątna kwadratu: a√2, wysokość trójkąta równobocznego: a√3/2.</p>', [], [], ['Stosuję twierdzenie Pitagorasa w zadaniach.']),
      t8('X.4–6')('k8t_odc', 'Odcinki w układzie współrzędnych', ['coord_seg'], '<p>Długość odcinka AB: narysuj trójkąt prostokątny o bokach poziomym i pionowym i użyj Pitagorasa. Środek odcinka: średnie współrzędnych końców.</p>', [{ t: 'A = (1, 2), B = (4, 6)', s: ['poziomo 3, pionowo 4', '|AB| = √(9 + 16) = 5'] }], [], ['Obliczam długość i środek odcinka.'])] },
    { id: 'k8_zast', name: 'Zastosowania matematyki', icon: '%', pp: 'V, XII, XIII', topics: [
      t8('V')('k8t_proc', 'Obliczenia procentowe', ['pct_what', 'pct_whole', 'pct_change'], '<p>Trzy typy zadań: procent liczby (p% · x), jaki to procent (a : b · 100%), liczba z jej procentu (a : p%).</p>', [], [], ['Rozwiązuję zadania procentowe.']),
      t8('V.6')('k8t_lokaty', 'Lokaty bankowe', ['pct_deposit'], '<p>Odsetki po roku = kapitał · oprocentowanie. Przy kapitalizacji rocznej w kolejnym roku procent liczymy od kapitału razem z odsetkami. Od odsetek pobiera się 19% podatku.</p>', [], ['Doliczenie odsetek z 1. roku jeszcze raz w 2. roku od kapitału początkowego.'], ['Obliczam odsetki z lokat.']),
      t8('V.6')('k8t_vat', 'VAT i inne podatki', ['vat'], '<p>Cena brutto = cena netto + VAT. Przy stawce 23%: brutto = netto · 1,23, a netto = brutto : 1,23 (nie odejmuj 23% od brutto!).</p>', [], ['Odejmowanie 23% od ceny brutto.'], ['Obliczam ceny netto, brutto i VAT.']),
      t8('VII.3')('k8t_podzial', 'Podział proporcjonalny', ['prop_div'], '<p>Podział w stosunku 2 : 3 to podział na 2 + 3 = 5 równych części. Jedna część = całość : 5.</p>', [], [], ['Dzielę wielkości w danym stosunku.']),
      t8('XIII')('k8t_wykr', 'Diagramy, wykresy, mediana', ['data_read', 'graph_read', 'median'], '<p>Na wykresie oś pozioma to zwykle czas, pionowa – wartość. <b>Mediana</b> to środkowa wartość uporządkowanych danych.</p>', [], ['Mediana policzona bez uporządkowania danych.'], ['Odczytuję dane z wykresów.', 'Obliczam medianę.'])] },
    { id: 'k8_bryly', name: 'Graniastosłupy i ostrosłupy', icon: '⬚', pp: 'XI', topics: [pick('bryl_rozp', ['solids', 'nets'], { grade: '8' }),
      t8('XI.2')('k8t_gran', 'Graniastosłupy: objętość i pole powierzchni', ['prism_vol', 'prism_surf'], '<p><b>V = Pp · H</b> (pole podstawy razy wysokość bryły). Pole powierzchni: 2 · Pp + pole boczne; pole boczne graniastosłupa prostego = obwód podstawy · H.</p>', [], ['Objętość = suma krawędzi ✗.'], ['Obliczam objętość i pole powierzchni graniastosłupa.']),
      t8('XI.2–3')('k8t_ostr', 'Ostrosłupy: objętość i pole powierzchni', ['pyr_vol', 'pyr_surf'], '<p><b>V = ⅓ · Pp · H</b>. Pole powierzchni: Pp + pola ścian bocznych (trójkątów). Wysokość ściany bocznej i wysokość bryły to różne odcinki – łączy je twierdzenie Pitagorasa.</p>', [], ['Zapomniane ⅓.', 'Użycie wysokości bryły zamiast wysokości ściany.'], ['Obliczam objętość i pole powierzchni ostrosłupa.'])] },
    { id: 'k8_sym', name: 'Symetrie', icon: '⇋', pp: 'XV', topics: [
      t8('XV.1–2')('k8t_osiowa', 'Symetria względem prostej', ['sym_line', 'symmetry'], '<p>Względem osi x: (x, y) → (x, −y). Względem osi y: (x, y) → (−x, y). Oś symetrii figury dzieli ją na dwie lustrzane części.</p>', [], ['Zmiana znaku niewłaściwej współrzędnej.'], ['Wyznaczam punkty symetryczne względem prostej.']),
      t8('XV.3–4')('k8t_srodk', 'Symetria względem punktu', ['sym_point'], '<p>Względem (0, 0): (x, y) → (−x, −y). Środek symetrii figury: po obrocie o 180° figura pokrywa się sama ze sobą.</p>', [], [], ['Wyznaczam punkty symetryczne względem punktu.'])] },
    { id: 'k8_kola', name: 'Koła i okręgi', icon: '◯', pp: 'XIV, VIII', topics: [
      t8('XIV.1–2')('k8t_dl', 'Liczba π. Długość okręgu', ['circle_len'], '<p><b>L = 2πr</b> (= πd). π ≈ 3,14. Jeśli zadanie nie każe przybliżać, zostaw π w wyniku: r = 5 → L = 10π.</p>', [], ['Użycie średnicy zamiast promienia.'], ['Obliczam długość okręgu.']),
      t8('XIV.3–4')('k8t_pole', 'Pole koła', ['circle_area'], '<p><b>P = πr²</b>. Najpierw promień do kwadratu, potem razy π. Pierścień: pole dużego koła − pole małego.</p>', [], ['πr² liczone jako 2πr.'], ['Obliczam pole koła i pierścienia.']),
      t8('VIII.6')('k8t_styczna', 'Styczna, położenie okręgów', ['circle_pos'], '<p>Prosta w odległości d od środka okręgu o promieniu r: d > r – rozłączna, d = r – <b>styczna</b>, d < r – sieczna. Dwa okręgi: porównaj odległość środków z sumą i różnicą promieni.</p>', [], [], ['Określam położenie prostej i okręgów.'])] },
    { id: 'k8_prawd', name: 'Rachunek prawdopodobieństwa', icon: '🎲', pp: 'XII', topics: [
      t8('XII.1')('k8t_komb', 'Ile jest możliwości?', ['combin'], '<p><b>Reguła mnożenia</b>: jeśli wybór składa się z etapów, mnożymy liczby możliwości. Pary bez kolejności (mecze, uściski dłoni): n · (n − 1) : 2.</p>', [], ['Dodawanie zamiast mnożenia.'], ['Zliczam możliwości.']),
      t8('XII.2')('k8t_prawd', 'Obliczanie prawdopodobieństw', ['prob'], '<p>P = sprzyjające : wszystkie. Przy dwóch rzutach kostką wszystkich wyników jest 6 · 6 = 36, a pary (1, 2) i (2, 1) to różne wyniki.</p>', [], ['Policzenie (1, 2) i (2, 1) jako jednego wyniku.'], ['Obliczam prawdopodobieństwo w doświadczeniach dwuetapowych.'])] }
  ];

  Object.assign(MP.CURR, { 1: D1, 3: D3, 4: D4, 7: D7, 8: D8 });
  MP.GRADES = {
    1: { name: 'Klasa 1', short: '1', desc: 'Liczby do 20, dziesiątki do 100, dodawanie i odejmowanie, zegar, pieniądze' },
    2: MP.GRADES[2],
    3: { name: 'Klasa 3', short: '3', desc: 'Liczby do 1000, tabliczka mnożenia, zadania dwudziałaniowe, czas, miary' },
    4: { name: 'Klasa 4', short: '4', desc: 'Liczby wielocyfrowe, działania pisemne, kąty, pola, początki ułamków' },
    5: MP.GRADES[5], 6: MP.GRADES[6],
    7: { name: 'Klasa 7', short: '7', desc: 'Procenty, wyrażenia algebraiczne, równania, potęgi, pierwiastki, Pitagoras' },
    8: { name: 'Klasa 8', short: '8', desc: 'Bryły, symetrie, koła, prawdopodobieństwo, zastosowania procentów' }
  };
  MP.setGrade(6);
})(MP);
