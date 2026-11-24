/* curriculum.js — mapa materiału: działy → tematy → umiejętności.
   Zgodna z podstawą programową matematyki dla klas IV–VI (2017, w wersji uszczuplonej od 1.09.2024),
   która obowiązuje uczniów klasy 6 w roku szkolnym 2026/2027.
   pp: numery wymagań szczegółowych z podstawy. Umiejętności bez generatora mają planned: true. */
var MP = (typeof window !== 'undefined' ? window : globalThis).MP;
(function (MP) {
  const P = (id, name, grade, prereq) => { if (!MP.SK[id]) MP.SK[id] = { id, name, grade, planned: true, prereq: prereq || [] }; return id; };

  const D = [
    { id: 'nat', name: 'Liczby naturalne i działania', icon: 'N', pp: 'I, II', topics: [
      { id: 'nat_zap', name: 'Zapis, porównywanie i zaokrąglanie liczb', grade: '4–6', pp: 'I.1–4', skills: ['nat_round', P('nat_cmp', 'Zapis i porównywanie liczb wielocyfrowych', 4), P('nat_roman', 'System rzymski (do 3000)', 4)],
        explain: '<p>Każda cyfra w liczbie ma swoje „mieszkanie": jedności, dziesiątki, setki, tysiące… Cyfra 5 w liczbie 5 000 znaczy coś innego niż w liczbie 50.</p><p><b>Zaokrąglanie</b> to zamiana liczby na „okrągłą", bliską jej liczbę. Robimy to, gdy dokładność nie jest potrzebna – np. „na meczu było około 12 000 kibiców".</p><p>Zasada: patrzysz na cyfrę <b>za</b> miejscem, do którego zaokrąglasz. Jeśli to 0, 1, 2, 3 lub 4 – zaokrąglasz w dół. Jeśli 5, 6, 7, 8 lub 9 – w górę.</p>',
        examples: [{ t: 'Zaokrąglij 4 738 do setek', s: ['Cyfra setek to 7 (4 <b>7</b>38).', 'Za nią stoi 3 – to mniej niż 5.', 'Zaokrąglamy w dół: 4 738 ≈ 4 700.'] }, { t: 'Zaokrąglij 25 691 do tysięcy', s: ['Cyfra tysięcy to 5 (2<b>5</b> 691).', 'Za nią stoi 6 – to 5 lub więcej.', 'W górę: 25 691 ≈ 26 000.'] }],
        mistakes: ['Obcinanie zamiast zaokrąglania: 4 780 ≈ 4 700 ✗ (powinno być 4 800).', 'Patrzenie na złą cyfrę – zawsze bierz tę tuż za miejscem zaokrąglenia.'],
        summary: ['Wskazuję rząd jedności, dziesiątek, setek i tysięcy.', 'Zaokrąglam liczby do podanego rzędu.'] },
      { id: 'nat_mem', name: 'Rachunki pamięciowe i dzielenie z resztą', grade: '4–6', pp: 'II.1–5, II.15', skills: ['tabl', 'nat_div_rem', P('nat_pis', 'Działania pisemne (dodawanie, odejmowanie, mnożenie, dzielenie)', 4)],
        explain: '<p>Tabliczka mnożenia to fundament prawie całej matematyki w 6 klasie – ułamków, procentów, pól figur. Warto ją mieć „w palcach".</p><p><b>Dzielenie z resztą</b>: dzielimy, ile się da, a to, co zostaje, to reszta. Np. 23 cukierki dla 5 osób: każdy dostaje 4 (bo 5 · 4 = 20), a zostają 3. Piszemy: 23 : 5 = 4 r. 3.</p><p>Reszta zawsze musi być <b>mniejsza</b> od liczby, przez którą dzielimy.</p>',
        examples: [{ t: '47 : 6', s: ['Szukam największej wielokrotności 6, która nie przekracza 47: 6 · 7 = 42.', '47 − 42 = 5.', '47 : 6 = 7 r. 5 (5 < 6 ✓).'] }],
        mistakes: ['Reszta większa od dzielnika – znaczy, że zmieści się jeszcze jeden raz.', 'W zadaniach tekstowych zapominanie, co oznacza reszta (np. czy trzeba dodać jeszcze jeden bus).'],
        summary: ['Mnożę i dzielę w pamięci w zakresie tabliczki mnożenia.', 'Dzielę z resztą i rozumiem, co oznacza reszta w zadaniu.'] },
      { id: 'nat_ord', name: 'Kolejność wykonywania działań', grade: '4–6', pp: 'II.11, V.7', skills: ['ord_basic', 'ord_paren'],
        explain: '<p>Matematycy umówili się, w jakiej kolejności liczymy – tak jak w ruchu drogowym są przepisy, żeby wszyscy jechali tak samo.</p><ol><li><b>Nawiasy</b> – zawsze najpierw.</li><li><b>Potęgi</b>.</li><li><b>Mnożenie i dzielenie</b> – w kolejności od lewej.</li><li><b>Dodawanie i odejmowanie</b> – w kolejności od lewej.</li></ol><p>Przykład z życia: kupujesz 1 sok za 4 zł i 3 bułki po 2 zł. Płacisz 4 + 3 · 2 = 4 + 6 = 10 zł. Gdyby liczyć od lewej (4 + 3 = 7, 7 · 2 = 14) – wyszłoby, że płacisz za dużo!</p>',
        examples: [{ t: '20 − 2 · (3 + 4)', s: ['Nawias: 3 + 4 = 7.', 'Mnożenie: 2 · 7 = 14.', 'Odejmowanie: 20 − 14 = 6.'] }, { t: '5 + 2 · 3²', s: ['Potęga: 3² = 9.', 'Mnożenie: 2 · 9 = 18.', 'Dodawanie: 5 + 18 = 23.'] }],
        mistakes: ['Liczenie „po kolei od lewej", bez patrzenia na rodzaj działań.', 'Potęgowanie po mnożeniu: 2 · 3² to nie 6², tylko 2 · 9.'],
        summary: ['Znam kolejność: nawiasy → potęgi → mnożenie/dzielenie → dodawanie/odejmowanie.', 'Obliczam wartość wyrażeń z nawiasami i potęgami.'] },
      { id: 'nat_pot', name: 'Kwadraty i sześciany liczb', grade: '5–6', pp: 'II.14, V.6', skills: ['pow_nat'],
        explain: '<p>Potęga to skrócony zapis mnożenia tej samej liczby. Mała liczba u góry (wykładnik) mówi, <b>ile razy</b> mnożymy.</p><p>3² („trzy do kwadratu") = 3 · 3 = 9. Dlaczego „kwadrat"? Bo kwadrat o boku 3 ma pole 3 · 3 = 9 kratek!</p><p>2³ („dwa do sześcianu") = 2 · 2 · 2 = 8. Sześcian o krawędzi 2 składa się z 8 małych kostek.</p>',
        examples: [{ t: '5³', s: ['5³ = 5 · 5 · 5', '5 · 5 = 25', '25 · 5 = 125'] }, { t: '10⁴', s: ['10 · 10 · 10 · 10 = 10 000 (jedynka i cztery zera).'] }],
        mistakes: ['3² = 6 ✗ – to mnożenie przez wykładnik. Poprawnie 3² = 3 · 3 = 9.'],
        summary: ['Rozumiem, co oznacza kwadrat i sześcian liczby.', 'Obliczam kwadraty i sześciany liczb.'] },
      { id: 'nat_szac', name: 'Szacowanie wyników działań', grade: '5–6', pp: 'II.12', skills: [P('nat_est', 'Szacowanie wyników działań', 6)],
        explain: '<p>Szacowanie to sprytne zgadywanie wyniku „mniej więcej", np. żeby sprawdzić, czy starczy pieniędzy. 19 zł + 32 zł + 48 zł to około 20 + 30 + 50 = 100 zł.</p>', examples: [], mistakes: [], summary: ['Szacuję wyniki, zaokrąglając liczby.'] }
    ] },
    { id: 'podz', name: 'Podzielność liczb', icon: '÷', pp: 'II.7–9, II.13–16', topics: [
      { id: 'podz_cech', name: 'Cechy podzielności', grade: '5', pp: 'II.7', skills: ['div_rules'],
        explain: '<p>Cechy podzielności to „sztuczki", dzięki którym bez liczenia wiesz, czy liczba dzieli się bez reszty.</p><ul><li><b>przez 2</b> – ostatnia cyfra parzysta (0, 2, 4, 6, 8),</li><li><b>przez 5</b> – ostatnia cyfra 0 lub 5,</li><li><b>przez 10</b> – ostatnia cyfra 0,</li><li><b>przez 3</b> – suma cyfr dzieli się przez 3,</li><li><b>przez 9</b> – suma cyfr dzieli się przez 9,</li><li><b>przez 4</b> – liczba z dwóch ostatnich cyfr dzieli się przez 4.</li></ul>',
        examples: [{ t: 'Czy 2 538 dzieli się przez 3?', s: ['Suma cyfr: 2 + 5 + 3 + 8 = 18.', '18 dzieli się przez 3.', 'Tak, 2 538 dzieli się przez 3 (i nawet przez 9!).'] }],
        mistakes: ['Sprawdzanie podzielności przez 3 po ostatniej cyfrze – np. 13 kończy się na 3, ale nie dzieli się przez 3.', 'Każda parzysta dzieli się przez 4? Nie! 14 jest parzysta, ale 14 : 4 nie wychodzi równo.'],
        summary: ['Stosuję cechy podzielności przez 2, 3, 4, 5, 9 i 10.'] },
      { id: 'podz_pierw', name: 'Liczby pierwsze i złożone', grade: '5', pp: 'II.8, II.14', skills: ['prime'],
        explain: '<p><b>Liczba pierwsza</b> ma dokładnie dwa dzielniki: 1 i samą siebie (np. 2, 3, 5, 7, 11, 13). <b>Liczba złożona</b> ma więcej dzielników (np. 4, 6, 9, 15).</p><p>1 jest wyjątkowa – nie jest ani pierwsza, ani złożona.</p><p>Każdą liczbę złożoną można rozłożyć na „cegiełki" – czynniki pierwsze: 12 = 2 · 2 · 3.</p>',
        examples: [{ t: 'Rozłóż 60 na czynniki pierwsze', s: ['60 : 2 = 30', '30 : 2 = 15', '15 : 3 = 5', '5 : 5 = 1', '60 = 2 · 2 · 3 · 5'] }],
        mistakes: ['Uznanie 1 za liczbę pierwszą.', 'Myślenie, że każda nieparzysta jest pierwsza (9, 15, 21 nie są!).'],
        summary: ['Rozpoznaję liczby pierwsze i złożone.', 'Rozkładam liczby na czynniki pierwsze.'] },
      { id: 'podz_nwd', name: 'NWD i NWW', grade: '5', pp: 'II.13', skills: ['nwd', 'nww'],
        explain: '<p><b>NWD</b> – największy wspólny dzielnik: największa liczba, przez którą dzielą się obie liczby. Przydaje się przy skracaniu ułamków i dzieleniu rzeczy na jednakowe grupy.</p><p><b>NWW</b> – najmniejsza wspólna wielokrotność: najmniejsza liczba, która dzieli się przez obie. Przydaje się przy szukaniu wspólnego mianownika i przy zadaniach „kiedy znów spotkają się razem".</p>',
        examples: [{ t: 'NWD(12, 18)', s: ['Dzielniki 12: 1, 2, 3, 4, 6, 12.', 'Dzielniki 18: 1, 2, 3, 6, 9, 18.', 'Największy wspólny: 6.'] }, { t: 'NWW(4, 6)', s: ['Wielokrotności 6: 6, 12, 18…', '12 dzieli się przez 4.', 'NWW(4, 6) = 12.'] }],
        mistakes: ['Mylenie NWD (mała liczba) z NWW (duża liczba).', 'Podawanie iloczynu zamiast NWW – 4 · 6 = 24, ale NWW = 12.'],
        summary: ['Wyznaczam NWD i NWW dwóch liczb.', 'Używam NWD i NWW w zadaniach.'] }
    ] },
    { id: 'uz', name: 'Ułamki zwykłe', icon: '½', pp: 'IV.1–5, IV.7, IV.12–14', topics: [
      { id: 'uz_poj', name: 'Ułamek jako część całości', grade: '4–6', pp: 'IV.1–2', skills: ['fr_part', P('fr_line', 'Ułamki na osi liczbowej', 5)],
        explain: '<p>Ułamek mówi, jaką część całości bierzemy. Wyobraź sobie pizzę pokrojoną na 8 równych kawałków. Jeśli zjesz 3 kawałki, zjesz <span class="m">[[3/8]]</span> pizzy.</p><ul><li><b>Mianownik</b> (na dole) – na ile <b>równych</b> części podzielono całość.</li><li><b>Licznik</b> (na górze) – ile tych części bierzemy.</li></ul><p>Ułamek to też dzielenie: <span class="m">[[3/4]]</span> = 3 : 4. Gdy 3 pizze dzielisz między 4 osoby, każdy dostaje <span class="m">[[3/4]]</span> pizzy.</p>',
        examples: [{ t: 'Pasek podzielony na 5 części, zamalowane 2', s: ['Wszystkich części: 5 → mianownik.', 'Zamalowanych: 2 → licznik.', 'Zamalowano [[2/5]] paska.'] }],
        mistakes: ['Odwrócenie ułamka: [[5/2]] zamiast [[2/5]].', 'W mianowniku liczba tylko niezamalowanych części, a nie wszystkich.'],
        summary: ['Opisuję część całości ułamkiem.', 'Wiem, co oznaczają licznik i mianownik.'] },
      { id: 'uz_rozsz', name: 'Rozszerzanie i skracanie ułamków', grade: '4–6', pp: 'IV.3', skills: ['fr_expand', 'fr_simplify'],
        explain: '<p>Ten sam kawałek pizzy można opisać różnymi ułamkami. <span class="m">[[1/2]]</span> pizzy to tyle samo co <span class="m">[[2/4]]</span> albo <span class="m">[[4/8]]</span> – po prostu kroimy na mniejsze kawałki.</p><p><b>Rozszerzanie</b>: mnożymy licznik i mianownik przez tę samą liczbę. <b>Skracanie</b>: dzielimy licznik i mianownik przez tę samą liczbę.</p><p>Wartość ułamka się <b>nie zmienia</b>. Zmienia się tylko „wielkość kawałków".</p>',
        examples: [{ t: 'Rozszerz [[3/4]] do mianownika 20', s: ['4 · 5 = 20, więc mnożymy przez 5.', '3 · 5 = 15.', '[[3/4]] = [[15/20]].'] }, { t: 'Skróć [[18/24]]', s: ['NWD(18, 24) = 6.', '18 : 6 = 3, 24 : 6 = 4.', '[[18/24]] = [[3/4]].'] }],
        mistakes: ['Dodawanie zamiast mnożenia: [[2/3]] = [[4/5]] ✗.', 'Zmiana tylko mianownika bez licznika.', 'Skracanie przez odejmowanie.'],
        summary: ['Rozszerzam ułamki do podanego mianownika.', 'Skracam ułamki maksymalnie.'] },
      { id: 'uz_miesz', name: 'Liczby mieszane', grade: '4–6', pp: 'IV.5', skills: ['fr_mixed'],
        explain: '<p>Gdy kawałków jest więcej niż w jednej całości, mamy <b>ułamek niewłaściwy</b> (licznik ≥ mianownik), np. <span class="m">[[7/4]]</span>.</p><p>7 ćwiartek pizzy to 1 cała pizza (4 ćwiartki) i jeszcze 3 ćwiartki: <span class="m">[[7/4]]</span> = <span class="m">[[1 3/4]]</span>. To <b>liczba mieszana</b>.</p>',
        examples: [{ t: '[[17/5]] na liczbę mieszaną', s: ['17 : 5 = 3 r. 2', '3 całe i 2 piąte: [[3 2/5]].'] }, { t: '[[2 3/8]] na ułamek niewłaściwy', s: ['2 · 8 = 16 (kawałków w 2 całościach)', '16 + 3 = 19', '[[2 3/8]] = [[19/8]]'] }],
        mistakes: ['Mnożenie całości przez licznik zamiast przez mianownik.', 'Dodawanie całości do licznika bez mnożenia.'],
        summary: ['Zamieniam ułamki niewłaściwe na liczby mieszane i odwrotnie.'] },
      { id: 'uz_por', name: 'Porównywanie ułamków', grade: '4–6', pp: 'IV.12', skills: ['fr_compare'],
        explain: '<p><b>Te same mianowniki</b> – kawałki są równe, więc wygrywa ten, kto ma ich więcej: <span class="m">[[5/8]]</span> > <span class="m">[[3/8]]</span>.</p><p><b>Te same liczniki</b> – tyle samo kawałków, ale które są większe? Te z mniejszym mianownikiem! <span class="m">[[1/3]]</span> > <span class="m">[[1/5]]</span>, bo dzieląc na 3, każdy kawałek jest większy niż przy podziale na 5.</p><p><b>Różne liczniki i mianowniki</b> – sprowadź do wspólnego mianownika.</p>',
        examples: [{ t: '[[2/3]] i [[3/4]]', s: ['Wspólny mianownik: 12.', '[[2/3]] = [[8/12]], [[3/4]] = [[9/12]].', '[[8/12]] < [[9/12]], więc [[2/3]] < [[3/4]].'] }],
        mistakes: ['„Większy mianownik = większy ułamek" – odwrotnie!', 'Porównywanie samych liczników przy różnych mianownikach.'],
        summary: ['Porównuję ułamki o równych licznikach lub mianownikach.', 'Porównuję dowolne ułamki przez sprowadzenie do wspólnego mianownika.'] },
      { id: 'uz_wsp', name: 'Wspólny mianownik', grade: '5–6', pp: 'IV.4', skills: ['fr_common'],
        explain: '<p>Zanim dodasz połówki i ćwiartki, musisz je zamienić na kawałki tej samej wielkości. Tak jak nie dodasz 2 jabłek i 3 gruszek, żeby dostać „5 jabłek".</p><p><b>Wspólny mianownik</b> to liczba, która dzieli się przez oba mianowniki. Najwygodniejszy jest <b>najmniejszy</b> – to NWW mianowników.</p>',
        examples: [{ t: '[[5/6]] i [[3/8]]', s: ['NWW(6, 8) = 24.', '[[5/6]] = [[20/24]] (· 4).', '[[3/8]] = [[9/24]] (· 3).'] }],
        mistakes: ['Dodawanie mianowników (6 + 8 = 14) – to nie jest wspólny mianownik.', 'Zmiana mianownika bez zmiany licznika.'],
        summary: ['Znajduję najmniejszy wspólny mianownik.', 'Sprowadzam ułamki do wspólnego mianownika.'] },
      { id: 'uz_cal', name: 'Całość z części i zmiana o ułamek', grade: '5–6', pp: 'IV.13–14', skills: [P('fr_whole', 'Obliczanie całości, gdy dana jest jej część', 6, ['fr_of'])],
        explain: '<p>Jeśli <span class="m">[[1/4]]</span> klasy to 7 osób, to cała klasa ma 4 · 7 = 28 osób. Ćwiczenia z tego zagadnienia pojawiają się w temacie „Ułamek liczby" (zadania tekstowe).</p>', examples: [], mistakes: [], summary: ['Obliczam całość, gdy znam jej część.'] }
    ] },
    { id: 'duz', name: 'Działania na ułamkach zwykłych', icon: '+', pp: 'V.1, V.5–7', topics: [
      { id: 'duz_dod', name: 'Dodawanie i odejmowanie ułamków', grade: '4–6', pp: 'V.1', skills: ['fr_add_same', 'fr_add_diff', 'fr_add_mixed'],
        explain: '<p><b>Jednakowe mianowniki</b>: kawałki są tej samej wielkości, więc dodajesz (lub odejmujesz) tylko liczniki. Mianownik zostaje! <span class="m">[[2/7]]</span> + <span class="m">[[3/7]]</span> = <span class="m">[[5/7]]</span>.</p><p><b>Różne mianowniki</b>: najpierw sprowadź do wspólnego mianownika, potem dodaj liczniki.</p><p><b>Liczby mieszane</b>: dodaj osobno całości i osobno ułamki. Przy odejmowaniu, jeśli ułamek jest za mały, „pożycz" jedną całość.</p>',
        examples: [{ t: '[[1/2]] + [[1/3]]', s: ['Wspólny mianownik: 6.', '[[1/2]] = [[3/6]], [[1/3]] = [[2/6]].', '[[3/6]] + [[2/6]] = [[5/6]].'] }, { t: '[[3 1/4]] − [[1 3/4]]', s: ['[[1/4]] < [[3/4]] – pożyczam całość: [[3 1/4]] = [[2 5/4]].', '[[2 5/4]] − [[1 3/4]] = [[1 2/4]].', 'Skracam: [[1 1/2]].'] }],
        mistakes: ['Dodawanie mianowników: [[1/2]] + [[1/3]] = [[2/5]] ✗. Sprawdzian: wynik nie może być mniejszy od [[1/2]]!', 'Zapominanie o skróceniu wyniku.'],
        summary: ['Dodaję i odejmuję ułamki o jednakowych mianownikach.', 'Dodaję i odejmuję ułamki o różnych mianownikach.', 'Dodaję i odejmuję liczby mieszane.'] },
      { id: 'duz_mn', name: 'Mnożenie ułamków', grade: '5–6', pp: 'V.1', skills: ['fr_mul_int', 'fr_mul'],
        explain: '<p><b>Ułamek · liczba</b>: 3 · <span class="m">[[2/7]]</span> to trzy razy po dwie siódme = <span class="m">[[6/7]]</span>. Mnożymy tylko licznik.</p><p><b>Ułamek · ułamek</b>: licznik razy licznik, mianownik razy mianownik. <span class="m">[[1/2]]</span> · <span class="m">[[1/3]]</span> = <span class="m">[[1/6]]</span> – to połowa z jednej trzeciej.</p><p>Tu <b>nie potrzeba</b> wspólnego mianownika! Warto za to skracać „na krzyż" przed mnożeniem.</p>',
        examples: [{ t: '[[4/9]] · [[3/8]]', s: ['Skracam „na krzyż": 4 i 8 przez 4, 3 i 9 przez 3.', '[[1/3]] · [[1/2]] = [[1/6]].'] }],
        mistakes: ['Mnożenie licznika i mianownika przez liczbę: 3 · [[2/7]] = [[6/21]] ✗.', 'Szukanie wspólnego mianownika przy mnożeniu (niepotrzebne).', 'Mnożenie liczby mieszanej bez zamiany na ułamek niewłaściwy.'],
        summary: ['Mnożę ułamek przez liczbę naturalną.', 'Mnożę ułamki i liczby mieszane, skracając przed mnożeniem.'] },
      { id: 'duz_dz', name: 'Dzielenie ułamków', grade: '5–6', pp: 'V.1', skills: ['fr_div'],
        explain: '<p>Dzielenie pyta: <b>ile razy jedno mieści się w drugim?</b> Ile połówek pizzy mieści się w 3 pizzach? 6! Dlatego 3 : <span class="m">[[1/2]]</span> = 6.</p><p>Zasada: dzielenie przez ułamek zamieniamy na <b>mnożenie przez odwrotność</b>. Odwracamy tylko <b>drugi</b> ułamek (ten, przez który dzielimy).</p><p><span class="m">[[3/4]]</span> : <span class="m">[[2/5]]</span> = <span class="m">[[3/4]]</span> · <span class="m">[[5/2]]</span> = <span class="m">[[15/8]]</span> = <span class="m">[[1 7/8]]</span>.</p>',
        examples: [{ t: '[[2/3]] : 4', s: ['4 = [[4/1]], odwrotność: [[1/4]].', '[[2/3]] · [[1/4]] = [[2/12]] = [[1/6]].'] }],
        mistakes: ['Zapominanie o odwróceniu: [[3/4]] : [[2/5]] = [[6/20]] ✗.', 'Odwracanie pierwszego ułamka zamiast drugiego.'],
        summary: ['Dzielę ułamki, zamieniając dzielenie na mnożenie przez odwrotność.'] },
      { id: 'duz_cz', name: 'Ułamek danej liczby', grade: '5–6', pp: 'V.5, IV.13–14', skills: ['fr_of'],
        explain: '<p>Ile to jest <span class="m">[[3/4]]</span> z 20 cukierków? Dzielimy 20 na 4 równe kupki (po 5) i bierzemy 3 kupki: 3 · 5 = 15.</p><p>Krótko: liczbę dzielimy przez mianownik i mnożymy przez licznik. Albo mnożymy: <span class="m">[[3/4]]</span> · 20 = 15.</p>',
        examples: [{ t: '[[2/5]] z 35', s: ['35 : 5 = 7', '7 · 2 = 14'] }, { t: 'Gra za 120 zł tańsza o [[1/4]]', s: ['[[1/4]] z 120 = 30 zł (tyle obniżki)', '120 − 30 = 90 zł'] }],
        mistakes: ['Dzielenie liczby przez ułamek zamiast liczenia części.', 'Zatrzymanie się w połowie (tylko podzielenie przez mianownik).', 'Podanie obniżki zamiast nowej ceny.'],
        summary: ['Obliczam ułamek danej liczby.', 'Rozwiązuję zadania o zmianie wielkości o ułamek.'] },
      { id: 'duz_pot', name: 'Kwadraty i sześciany ułamków', grade: '5–6', pp: 'V.6', skills: ['fr_pow'],
        explain: '<p>(<span class="m">[[2/3]]</span>)² = <span class="m">[[2/3]]</span> · <span class="m">[[2/3]]</span> = <span class="m">[[4/9]]</span>. Potęgujemy i licznik, i mianownik. Liczbę mieszaną najpierw zamieniamy na ułamek niewłaściwy.</p>',
        examples: [{ t: '([[1 1/2]])²', s: ['[[1 1/2]] = [[3/2]]', '([[3/2]])² = [[9/4]] = [[2 1/4]]'] }], mistakes: ['Potęgowanie tylko licznika: ([[2/3]])² = [[4/3]] ✗.'], summary: ['Obliczam kwadraty i sześciany ułamków.'] }
    ] },
    { id: 'ud', name: 'Ułamki dziesiętne', icon: ',', pp: 'IV.6, IV.8–12', topics: [
      { id: 'ud_zap', name: 'Zapis i zamiana ułamków dziesiętnych', grade: '4–6', pp: 'IV.8–9', skills: ['dec_conv'],
        explain: '<p>Ułamki dziesiętne znasz z cen w sklepie: 3,45 zł to 3 zł i 45 groszy. Po przecinku piszemy kolejno: <b>dziesiąte</b>, <b>setne</b>, <b>tysięczne</b>.</p><p><span class="m">[[7/10]]</span> = 0,7 &nbsp;|&nbsp; <span class="m">[[7/100]]</span> = 0,07 &nbsp;|&nbsp; <span class="m">[[7/1000]]</span> = 0,007</p><p>Ułamek zwykły zamienisz na dziesiętny, rozszerzając go do mianownika 10, 100 lub 1000: <span class="m">[[3/4]]</span> = <span class="m">[[75/100]]</span> = 0,75.</p>',
        examples: [{ t: '0,35 jako ułamek zwykły', s: ['0,35 = [[35/100]]', 'Skracam przez 5: [[7/20]]'] }, { t: '[[3/8]] jako ułamek dziesiętny', s: ['8 · 125 = 1000', '[[3/8]] = [[375/1000]] = 0,375'] }],
        mistakes: ['[[7/100]] = 0,7 ✗ (to 70 setnych!).', '[[3/4]] = 0,34 ✗ – nie przepisujemy cyfr.'],
        summary: ['Zamieniam ułamki dziesiętne na zwykłe i odwrotnie.'] },
      { id: 'ud_por', name: 'Porównywanie ułamków dziesiętnych', grade: '4–6', pp: 'IV.12', skills: ['dec_compare'],
        explain: '<p>Porównuj tak jak ceny: najpierw złotówki (część całkowitą), potem dziesiątki groszy, potem grosze.</p><p>Sztuczka: dopisz zera, żeby obie liczby miały tyle samo cyfr po przecinku. 0,5 i 0,45 → 0,50 i 0,45 → teraz widać, że 0,50 > 0,45.</p>',
        examples: [{ t: '2,3 i 2,29', s: ['Całości równe (2 i 2).', '2,30 i 2,29: 30 setnych > 29 setnych.', '2,3 > 2,29.'] }],
        mistakes: ['„Więcej cyfr = większa liczba" – 0,125 nie jest większe od 0,5!'],
        summary: ['Porównuję i porządkuję ułamki dziesiętne.'] },
      { id: 'ud_zaok', name: 'Zaokrąglanie ułamków dziesiętnych', grade: '6', pp: 'IV.11', skills: ['dec_round'],
        explain: '<p>Zasada jak przy liczbach naturalnych: patrzysz na cyfrę <b>za</b> miejscem zaokrąglenia. 0–4 → w dół, 5–9 → w górę.</p><p>W praktyce zaokrąglamy np. ceny do groszy: 4,368 zł ≈ 4,37 zł.</p>',
        examples: [{ t: '3,846 do części dziesiątych', s: ['Cyfra dziesiątych: 8 (3,<b>8</b>46).', 'Za nią 4 → w dół.', '3,846 ≈ 3,8'] }],
        mistakes: ['Obcinanie: 2,67 ≈ 2,6 ✗ (powinno być 2,7).'], summary: ['Zaokrąglam ułamki dziesiętne (do dwóch miejsc po przecinku).'] },
      { id: 'ud_dwum', name: 'Wyrażenia dwumianowane', grade: '4–6', pp: 'IV.6', skills: ['dec_units'],
        explain: '<p>„2 zł 35 gr" to wyrażenie dwumianowane (dwie jednostki). Jako jedną liczbę: 2,35 zł. Uwaga na małe liczby: 3 m 5 cm = 3,05 m (bo 5 cm to 5 setnych metra).</p>',
        examples: [{ t: '4 kg 50 g w kg', s: ['1 kg = 1000 g, więc 50 g = 0,050 kg.', '4 kg 50 g = 4,05 kg'] }], mistakes: ['3 m 5 cm = 3,5 m ✗'], summary: ['Zamieniam wyrażenia dwumianowane na ułamki dziesiętne i odwrotnie.'] },
      { id: 'ud_niesk', name: 'Rozwinięcia dziesiętne nieskończone', grade: '6', pp: 'IV.10', skills: [P('dec_inf', 'Rozwinięcia dziesiętne nieskończone okresowe', 6, ['dec_div'])],
        explain: '<p>Niektóre ułamki po zamianie na dziesiętne nie kończą się: <span class="m">[[1/3]]</span> = 0,333… = 0,(3). Cyfry w nawiasie powtarzają się w nieskończoność (to okres).</p>', examples: [], mistakes: [], summary: ['Rozpoznaję rozwinięcia nieskończone okresowe.'] }
    ] },
    { id: 'dud', name: 'Działania na ułamkach dziesiętnych', icon: '×', pp: 'V.2–3, V.8', topics: [
      { id: 'dud_dod', name: 'Dodawanie i odejmowanie', grade: '4–6', pp: 'V.2', skills: ['dec_add'],
        explain: '<p>Najważniejsza zasada: <b>przecinek pod przecinkiem</b>. Wtedy dziesiąte są pod dziesiątymi, setne pod setnymi – tak jak złotówki pod złotówkami, a grosze pod groszami.</p><p>Gdy liczby mają różną liczbę cyfr po przecinku, dopisz zera: 3,5 + 1,25 → 3,50 + 1,25 = 4,75.</p>',
        examples: [{ t: '7 − 2,46', s: ['7 = 7,00', '7,00 − 2,46 = 4,54'] }], mistakes: ['Ustawianie liczb „do prawej" zamiast przecinek pod przecinkiem.', 'Odejmowanie od liczby całkowitej bez dopisania zer.'], summary: ['Dodaję i odejmuję ułamki dziesiętne pisemnie i w pamięci.'] },
      { id: 'dud_10', name: 'Mnożenie i dzielenie przez 10, 100, 1000', grade: '4–6', pp: 'V.2', skills: ['dec_shift'],
        explain: '<p>Mnożenie przez 10, 100, 1000 → przecinek idzie w <b>prawo</b> o 1, 2, 3 miejsca (liczba rośnie). Dzielenie → przecinek idzie w <b>lewo</b> (liczba maleje).</p><p>Ile miejsc? Tyle, ile zer: 3,7 · 100 = 370; 45,2 : 1000 = 0,0452.</p>',
        examples: [{ t: '0,083 · 1000', s: ['Trzy zera → przecinek 3 miejsca w prawo.', '0,083 · 1000 = 83'] }], mistakes: ['Przesunięcie w złą stronę.', 'Dopisanie zera na końcu ułamka (2,5 · 10 = 2,50 ✗).'], summary: ['Mnożę i dzielę ułamki dziesiętne przez 10, 100, 1000.'] },
      { id: 'dud_mn', name: 'Mnożenie ułamków dziesiętnych', grade: '5–6', pp: 'V.2', skills: ['dec_mul'],
        explain: '<p>Mnożysz jak liczby naturalne (bez przecinków), a potem liczysz, ile cyfr po przecinku było w <b>obu</b> czynnikach razem – tyle oddzielasz w wyniku.</p><p>Sprawdzian zdrowego rozsądku: 0,3 · 0,2 = 0,06. Mnożąc przez liczbę mniejszą od 1, wynik maleje!</p>',
        examples: [{ t: '1,25 · 0,8', s: ['125 · 8 = 1000', 'Miejsc po przecinku: 2 + 1 = 3', '1,000 = 1'] }], mistakes: ['Branie miejsc po przecinku tylko z jednej liczby.'], summary: ['Mnożę ułamki dziesiętne.'] },
      { id: 'dud_dz', name: 'Dzielenie ułamków dziesiętnych', grade: '5–6', pp: 'V.2', skills: ['dec_div'],
        explain: '<p><b>Przez liczbę naturalną</b>: dziel normalnie, a gdy dojdziesz do przecinka w dzielnej – postaw przecinek w wyniku. Jeśli zostaje reszta, dopisuj zera.</p><p><b>Przez ułamek dziesiętny</b>: przesuń przecinek w obu liczbach o tyle samo miejsc w prawo, aż dzielnik będzie liczbą całkowitą. 2,4 : 0,3 = 24 : 3 = 8.</p>',
        examples: [{ t: '7 : 4', s: ['7 : 4 = 1 r. 3 – reszty nie piszemy po przecinku!', '7,00 : 4 = 1,75'] }], mistakes: ['Zapisywanie reszty po przecinku: 7 : 4 = 1,3 ✗.', 'Przesuwanie przecinka tylko w jednej liczbie.'], summary: ['Dzielę ułamki dziesiętne przez liczby naturalne i przez ułamki dziesiętne.'] },
      { id: 'dud_mix', name: 'Działania na ułamkach zwykłych i dziesiętnych razem', grade: '5–6', pp: 'V.3, V.7–8', skills: [P('mix_ops', 'Wyrażenia z ułamkami zwykłymi i dziesiętnymi', 6, ['fr_add_diff', 'dec_conv'])],
        explain: '<p>Gdy w działaniu są i ułamki zwykłe, i dziesiętne, zamień wszystkie na jeden rodzaj – ten, który jest wygodniejszy. Np. 0,5 + <span class="m">[[1/4]]</span> = 0,5 + 0,25 = 0,75.</p>', examples: [], mistakes: [], summary: ['Obliczam wartości wyrażeń z ułamkami zwykłymi i dziesiętnymi.'] }
    ] },
    { id: 'calk', name: 'Liczby całkowite', icon: '±', pp: 'III, V.9', topics: [
      { id: 'calk_os', name: 'Liczby ujemne na osi, porównywanie, wartość bezwzględna', grade: '5–6', pp: 'III.1–4', skills: ['int_compare', 'int_abs'],
        explain: '<p>Liczby ujemne znasz z termometru (−5°C), z windy (−1 to piętro pod ziemią) i z bankowości (dług).</p><p>Na osi liczbowej: im bardziej w prawo, tym większa liczba. Dlatego −3 > −7 (−3 jest cieplej!).</p><p><b>Wartość bezwzględna</b> |x| to odległość liczby od zera. Odległość nie może być ujemna: |−5| = 5, |5| = 5.</p>',
        examples: [{ t: 'Uporządkuj: 3, −8, 0, −2', s: ['Najbardziej w lewo: −8, potem −2, 0, 3.', '−8 < −2 < 0 < 3'] }], mistakes: ['−7 > −3, bo 7 > 3 ✗.', '|−5| = −5 ✗.'], summary: ['Zaznaczam i porównuję liczby całkowite.', 'Obliczam wartość bezwzględną.'] },
      { id: 'calk_dod', name: 'Dodawanie i odejmowanie liczb całkowitych', grade: '5–6', pp: 'III.5, V.9', skills: ['int_add'],
        explain: '<p>Pomyśl o termometrze. Dodanie liczby dodatniej to ocieplenie (ruch w górę/w prawo), dodanie ujemnej – ochłodzenie.</p><p>−3 + 5: startujesz w −3 i idziesz 5 w prawo → 2.</p><p><b>Odejmowanie liczby ujemnej</b> = dodawanie przeciwnej: 4 − (−3) = 4 + 3 = 7.</p>',
        examples: [{ t: '−6 − 4', s: ['Start w −6, idę 4 w lewo.', '−6 − 4 = −10'] }, { t: '2 − (−5)', s: ['− (−5) = + 5', '2 + 5 = 7'] }], mistakes: ['−3 + 5 = −8 ✗ (to nie jest „dodaj liczby i daj minus").', '4 − (−3) = 1 ✗.'], summary: ['Dodaję i odejmuję liczby całkowite.'] },
      { id: 'calk_mn', name: 'Mnożenie i dzielenie liczb całkowitych', grade: '6', pp: 'V.9', skills: ['int_mul'],
        explain: '<p>Liczysz jak zwykle bez znaków, a potem ustalasz znak: <b>takie same znaki → plus</b>, <b>różne znaki → minus</b>.</p><p>(−3) · 4 = −12 &nbsp;|&nbsp; (−3) · (−4) = 12 &nbsp;|&nbsp; (−12) : 3 = −4</p>',
        examples: [{ t: '(−2) · (−3) · (−5)', s: ['(−2) · (−3) = 6', '6 · (−5) = −30'] }], mistakes: ['Minus razy minus = minus ✗.'], summary: ['Mnożę i dzielę liczby całkowite.'] }
    ] },
    { id: 'alg', name: 'Wyrażenia algebraiczne i równania', icon: 'x', pp: 'VI', topics: [
      { id: 'alg_wyr', name: 'Wyrażenia algebraiczne', grade: '5–6', pp: 'VI.1–2', skills: ['alg_write', 'alg_value'],
        explain: '<p>Litera w matematyce to „pudełko" na liczbę, której jeszcze nie znamy albo która może się zmieniać. Jeśli zeszyt kosztuje <i>x</i> zł, to 3 zeszyty kosztują 3<i>x</i> zł (3 · <i>x</i>).</p><ul><li>„o 5 więcej" → x + 5</li><li>„5 razy więcej" → 5x</li><li>„o 5 mniej" → x − 5</li><li>„5 razy mniej" → x : 5</li></ul><p>Między liczbą a literą stoi niewidoczny znak mnożenia: 4a = 4 · a.</p>',
        examples: [{ t: 'Wartość 3x + 2 dla x = 5', s: ['Wstawiam 5 za x: 3 · 5 + 2', '15 + 2 = 17'] }], mistakes: ['3x dla x = 4 to 34 ✗ (to 3 · 4 = 12).', 'Mylenie „o … więcej" z „… razy więcej".'], summary: ['Zapisuję treść zadania wyrażeniem algebraicznym.', 'Obliczam wartość wyrażenia dla danej liczby.'] },
      { id: 'alg_row', name: 'Równania', grade: '6', pp: 'VI.3', skills: ['eq_solve'],
        explain: '<p>Równanie to waga szalkowa w równowadze. Żeby nie przechylić wagi, z obu stron robimy to samo.</p><p>x + 7 = 15 → zdejmujemy 7 z obu szalek → x = 8.<br>3x = 21 → dzielimy obie strony przez 3 → x = 7.</p><p>Zawsze możesz <b>sprawdzić</b> wynik, wstawiając go do równania.</p>',
        examples: [{ t: '2x + 5 = 17', s: ['Odejmuję 5: 2x = 12', 'Dzielę przez 2: x = 6', 'Sprawdzenie: 2 · 6 + 5 = 17 ✓'] }], mistakes: ['Dodawanie zamiast odejmowania przy „przenoszeniu" liczby.'], summary: ['Rozwiązuję proste równania.', 'Sprawdzam rozwiązanie, wstawiając je do równania.'] }
    ] },
    { id: 'proc', name: 'Procenty', icon: '%', pp: 'XII.1–2', topics: [
      { id: 'proc_poj', name: 'Pojęcie procentu', grade: '5–6', pp: 'XII.1', skills: ['pct_frac'],
        explain: '<p>„Procent" znaczy „na sto". 1% to jedna setna całości. Cała rzecz to 100%.</p><p>Warto znać na pamięć: 50% = <span class="m">[[1/2]]</span> (połowa), 25% = <span class="m">[[1/4]]</span> (ćwierć), 75% = <span class="m">[[3/4]]</span>, 10% = <span class="m">[[1/10]]</span>, 20% = <span class="m">[[1/5]]</span>, 1% = <span class="m">[[1/100]]</span>.</p>',
        examples: [{ t: '40% jako ułamek', s: ['40% = [[40/100]]', 'Skracam przez 20: [[2/5]]'] }], mistakes: ['25% = [[1/25]] ✗.', '0,35 = 3,5% ✗ (mnożymy przez 100: 35%).'], summary: ['Zamieniam procenty na ułamki i odwrotnie.'] },
      { id: 'proc_licz', name: 'Procent danej liczby', grade: '6', pp: 'XII.2', skills: ['pct_of'],
        explain: '<p>10% z 230 zł: dzielimy przez 10 → 23 zł. 50% to połowa, 25% – ćwierć.</p><p>Ogólnie: p% z liczby = liczba : 100 · p.</p><p>Promocje: „taniej o 20%" → oblicz 20% ceny i <b>odejmij</b> od ceny.</p>',
        examples: [{ t: 'Buty za 150 zł tańsze o 20%', s: ['20% z 150 = 150 : 100 · 20 = 30 zł', '150 − 30 = 120 zł'] }], mistakes: ['Dzielenie liczby przez procent (150 : 20).', 'Podanie obniżki zamiast nowej ceny.'], summary: ['Obliczam procent danej liczby.', 'Rozwiązuję zadania o podwyżkach i obniżkach.'] }
    ] },
    { id: 'kat', name: 'Proste, odcinki i kąty', icon: '∠', pp: 'VII, VIII', topics: [
      { id: 'kat_proste', name: 'Proste, półproste, odcinki; prostopadłość i równoległość', grade: '4–6', pp: 'VII.1–5', skills: [P('lines', 'Proste prostopadłe i równoległe, odległość punktu od prostej', 4)],
        explain: '<p>Proste <b>prostopadłe</b> przecinają się pod kątem prostym (jak krawędzie zeszytu). Proste <b>równoległe</b> nigdy się nie przecinają (jak tory kolejowe). Odległość punktu od prostej mierzymy odcinkiem prostopadłym.</p>', examples: [], mistakes: [], summary: ['Rozpoznaję proste prostopadłe i równoległe.'] },
      { id: 'kat_rodz', name: 'Rodzaje kątów', grade: '4–6', pp: 'VIII.1–5', skills: ['ang_type', P('ang_measure', 'Mierzenie i rysowanie kątów kątomierzem', 4)],
        explain: '<p>Kąt prosty (90°) to róg kartki. Wszystkie inne kąty porównujemy z nim:</p><ul><li><b>ostry</b> – mniejszy od prostego (< 90°),</li><li><b>prosty</b> – dokładnie 90°,</li><li><b>rozwarty</b> – większy od prostego, ale mniejszy od półpełnego (90°–180°),</li><li><b>półpełny</b> – 180° (ramiona tworzą prostą),</li><li><b>pełny</b> – 360°.</li></ul>', examples: [], mistakes: ['Mylenie kąta rozwartego z półpełnym.'], summary: ['Rozpoznaję kąty ostre, proste, rozwarte i półpełne.'] },
      { id: 'kat_wp', name: 'Kąty przyległe i wierzchołkowe', grade: '5–6', pp: 'VIII.6', skills: ['ang_pairs'],
        explain: '<p>Gdy dwie proste się przecinają, powstają 4 kąty.</p><ul><li>Kąty <b>wierzchołkowe</b> – naprzeciw siebie – są <b>równe</b>.</li><li>Kąty <b>przyległe</b> – obok siebie – razem dają <b>180°</b>.</li></ul>', examples: [{ t: 'α = 70°, β przyległy', s: ['β = 180° − 70° = 110°'] }], mistakes: ['Mylenie, które kąty są równe, a które dają 180°.'], summary: ['Obliczam kąty przyległe i wierzchołkowe.'] },
      { id: 'kat_tr', name: 'Kąty w trójkącie', grade: '4–6', pp: 'IX.3, IX.8, XI.1', skills: ['ang_triangle'],
        explain: '<p>Suma kątów w każdym trójkącie to <b>180°</b>. Możesz to sprawdzić: oderwij trzy rogi papierowego trójkąta i złóż je razem – utworzą prostą linię!</p><p>W trójkącie <b>równoramiennym</b> kąty przy podstawie są równe. W <b>prostokątnym</b> jeden kąt ma 90°, więc dwa pozostałe razem mają 90°.</p>', examples: [{ t: 'Kąty 50° i 60°', s: ['50° + 60° = 110°', '180° − 110° = 70°'] }], mistakes: ['Odejmowanie od 360° zamiast od 180°.'], summary: ['Obliczam brakujący kąt trójkąta.', 'Wykorzystuję własności trójkąta równoramiennego.'] }
    ] },
    { id: 'wiel', name: 'Wielokąty, koła i okręgi', icon: '△', pp: 'IX', topics: [
      { id: 'wiel_tr', name: 'Trójkąty: rodzaje i nierówność trójkąta', grade: '5–6', pp: 'IX.1–2', skills: ['tri_ineq'],
        explain: '<p>Trójkąty dzielimy według boków (równoboczny, równoramienny, różnoboczny) i według kątów (ostrokątny, prostokątny, rozwartokątny).</p><p><b>Nierówność trójkąta</b>: z trzech patyczków zbudujesz trójkąt tylko wtedy, gdy dwa krótsze razem są dłuższe od najdłuższego.</p>', examples: [{ t: 'Odcinki 3, 4, 8', s: ['3 + 4 = 7', '7 < 8 → trójkąt nie powstanie'] }], mistakes: ['Zapominanie, że przy równości (3 + 5 = 8) trójkąt też nie powstanie.'], summary: ['Rozpoznaję rodzaje trójkątów.', 'Sprawdzam, czy z odcinków da się zbudować trójkąt.'] },
      { id: 'wiel_czw', name: 'Czworokąty i ich własności', grade: '4–6', pp: 'IX.4–5', skills: [P('quads', 'Własności kwadratu, prostokąta, rombu, równoległoboku, trapezu', 5)],
        explain: '<p>Kwadrat, prostokąt, romb, równoległobok i trapez różnią się bokami i kątami. Np. romb ma wszystkie boki równe, a równoległobok – dwie pary boków równoległych.</p>', examples: [], mistakes: [], summary: ['Rozpoznaję czworokąty i znam ich własności.'] },
      { id: 'wiel_kolo', name: 'Koło i okrąg', grade: '4–6', pp: 'IX.6–7', skills: ['circ_parts'],
        explain: '<p><b>Promień</b> (r) łączy środek z okręgiem. <b>Średnica</b> (d) przechodzi przez środek od brzegu do brzegu – to dwa promienie: d = 2r. <b>Cięciwa</b> to dowolny odcinek łączący dwa punkty okręgu (średnica to najdłuższa cięciwa).</p>', examples: [], mistakes: ['Mylenie promienia ze średnicą.'], summary: ['Wskazuję promień, średnicę i cięciwę; obliczam jedno z drugiego.'] }
    ] },
    { id: 'pole', name: 'Obwody i pola figur', icon: '▭', pp: 'XI.1–4', topics: [
      { id: 'pole_obw', name: 'Obwód wielokąta', grade: '4–6', pp: 'XI.1', skills: ['perim'],
        explain: '<p>Obwód to długość „płotu" dookoła figury. Dodajemy długości wszystkich boków. Prostokąt: 2 · a + 2 · b.</p>', examples: [{ t: 'Prostokąt 5 cm × 3 cm', s: ['5 + 3 + 5 + 3 = 16 cm'] }], mistakes: ['Liczenie pola zamiast obwodu.', 'Dodanie tylko dwóch boków.'], summary: ['Obliczam obwody wielokątów.'] },
      { id: 'pole_pros', name: 'Pole prostokąta i kwadratu', grade: '4–6', pp: 'XI.2, XI.4', skills: ['area_rect'],
        explain: '<p>Pole to liczba kwadracików 1 cm × 1 cm, które zmieszczą się w figurze. W prostokącie 5 × 3 są 3 rzędy po 5 kwadracików: 15 cm².</p><p>Prostokąt: P = a · b. Kwadrat: P = a · a.</p><p>Figury złożone dzielimy na prostokąty albo liczymy duży prostokąt i odejmujemy wycięty kawałek.</p>', examples: [], mistakes: ['Mylenie pola (cm²) z obwodem (cm).'], summary: ['Obliczam pole prostokąta, kwadratu i figur złożonych z prostokątów.'] },
      { id: 'pole_tr', name: 'Pole trójkąta', grade: '5–6', pp: 'XI.2', skills: ['area_tri'],
        explain: '<p>Trójkąt to połowa prostokąta lub równoległoboku o tej samej podstawie i wysokości. Dlatego <b>P = a · h : 2</b>.</p><p><b>Wysokość</b> to odcinek prostopadły do podstawy, poprowadzony z przeciwległego wierzchołka – na rysunkach często przerywany.</p>', examples: [{ t: 'a = 8 cm, h = 5 cm', s: ['8 · 5 = 40', '40 : 2 = 20 cm²'] }], mistakes: ['Zapominanie o „: 2".', 'Branie boku skośnego zamiast wysokości.'], summary: ['Obliczam pole trójkąta.', 'Obliczam wysokość, znając pole i podstawę.'] },
      { id: 'pole_rown', name: 'Pole równoległoboku i rombu', grade: '5–6', pp: 'XI.2', skills: ['area_para'],
        explain: '<p>Równoległobok możesz „przerobić" na prostokąt: odetnij trójkąt z jednej strony i doklej z drugiej. Dlatego P = a · h.</p><p>Romb to szczególny równoległobok. Jego pole policzysz też z przekątnych: P = e · f : 2.</p>', examples: [], mistakes: ['Mnożenie podstawy przez bok skośny.'], summary: ['Obliczam pole równoległoboku i rombu.'] },
      { id: 'pole_trap', name: 'Pole trapezu', grade: '5–6', pp: 'XI.2', skills: ['area_trap'],
        explain: '<p>Dwa takie same trapezy złożone „do góry nogami" tworzą równoległobok o podstawie a + b. Trapez to połowa tego równoległoboku: <b>P = (a + b) · h : 2</b>.</p>', examples: [{ t: 'a = 10, b = 6, h = 4', s: ['10 + 6 = 16', '16 · 4 = 64', '64 : 2 = 32'] }], mistakes: ['Zapominanie o „: 2".', 'Mnożenie podstaw zamiast dodawania.'], summary: ['Obliczam pole trapezu.'] },
      { id: 'pole_jedn', name: 'Jednostki pola', grade: '4–6', pp: 'XI.3', skills: ['area_units'],
        explain: '<p>1 m = 100 cm, ale 1 m² = 100 · 100 = <b>10 000 cm²</b> (kwadrat 1 m × 1 m ma 100 rzędów po 100 kwadracików).</p><p>1 ar (a) = 100 m² (kwadrat 10 m × 10 m), 1 hektar (ha) = 10 000 m² (kwadrat 100 m × 100 m).</p>', examples: [], mistakes: ['1 m² = 100 cm² ✗.'], summary: ['Zamieniam jednostki pola.'] }
    ] },
    { id: 'bryl', name: 'Bryły: objętość i pole powierzchni', icon: '⬚', pp: 'X, XI.5–6', topics: [
      { id: 'bryl_rozp', name: 'Rozpoznawanie brył i siatki', grade: '4–6', pp: 'X.1–5', skills: [P('solids', 'Rozpoznawanie graniastosłupów, ostrosłupów, walców, stożków, kul', 6), P('nets', 'Siatki prostopadłościanów i graniastosłupów', 5)],
        explain: '<p>Graniastosłup ma dwie jednakowe podstawy (np. pudełko), ostrosłup – jedną podstawę i wierzchołek (piramida), walec przypomina puszkę, stożek – rożek lodów, kula – piłkę. Siatka bryły to jej „rozłożony" karton.</p>', examples: [], mistakes: [], summary: ['Rozpoznaję bryły i ich siatki.'] },
      { id: 'bryl_obj', name: 'Objętość prostopadłościanu', grade: '5–6', pp: 'XI.5–6', skills: ['vol_box', P('vol_units', 'Jednostki objętości i pojemności (cm³, dm³, l, ml)', 5)],
        explain: '<p>Objętość to liczba sześcianików 1 cm × 1 cm × 1 cm, które zmieszczą się w środku. V = a · b · c. Sześcian: V = a³.</p><p>1 dm³ = 1 litr, 1 cm³ = 1 ml.</p>', examples: [{ t: 'Pudełko 5 × 4 × 3 cm', s: ['Na dnie: 5 · 4 = 20 kostek', '3 warstwy: 20 · 3 = 60 cm³'] }], mistakes: ['Mylenie objętości z polem powierzchni.'], summary: ['Obliczam objętość prostopadłościanu i sześcianu.'] },
      { id: 'bryl_pp', name: 'Pole powierzchni prostopadłościanu', grade: '5–6', pp: 'XI.5', skills: ['surf_box'],
        explain: '<p>Pole powierzchni to ile papieru potrzeba, żeby okleić bryłę ze wszystkich stron. Prostopadłościan ma 6 ścian – po dwie jednakowe: P = 2ab + 2ac + 2bc. Sześcian: 6 · a².</p>', examples: [], mistakes: ['Liczenie tylko 3 ścian.', 'Sześcian ma 6 ścian, nie 4.'], summary: ['Obliczam pole powierzchni prostopadłościanu i sześcianu.'] }
    ] },
    { id: 'miary', name: 'Jednostki, czas i skala', icon: '⏱', pp: 'XII.3–8', topics: [
      { id: 'miary_dl', name: 'Jednostki długości i masy', grade: '4–6', pp: 'XII.6–7', skills: ['units_len'],
        explain: '<p>Długość: 1 cm = 10 mm, 1 dm = 10 cm, 1 m = 100 cm, 1 km = 1000 m. Masa: 1 kg = 100 dag = 1000 g, 1 t = 1000 kg.</p><p>Zamieniasz na <b>mniejszą</b> jednostkę → mnożysz (liczba rośnie). Na <b>większą</b> → dzielisz.</p>', examples: [], mistakes: ['Mnożenie zamiast dzielenia przy zamianie na większą jednostkę.'], summary: ['Zamieniam jednostki długości i masy.'] },
      { id: 'miary_czas', name: 'Zegar i kalendarz', grade: '4–6', pp: 'XII.3–4', skills: ['time_calc'],
        explain: '<p>Godzina ma <b>60</b> minut, a nie 100! Dlatego liczymy „skokami" przez pełną godzinę: od 9:40 do 11:15 → 20 min do 10:00, 60 min do 11:00, 15 min do 11:15 = 95 min.</p>', examples: [], mistakes: ['Odejmowanie godzin jak ułamków dziesiętnych (11,15 − 9,40).'], summary: ['Wykonuję obliczenia zegarowe i kalendarzowe.'] },
      { id: 'miary_skala', name: 'Skala i plan', grade: '4–6', pp: 'XII.8', skills: ['scale'],
        explain: '<p>Skala 1 : 100 znaczy: 1 cm na planie to 100 cm (1 m) w rzeczywistości. Z planu do rzeczywistości – <b>mnożymy</b>, z rzeczywistości na plan – <b>dzielimy</b>. Na końcu zamieniamy jednostki.</p>', examples: [{ t: 'Mapa 1 : 50 000, odległość 4 cm', s: ['4 · 50 000 = 200 000 cm', '200 000 cm = 2 000 m = 2 km'] }], mistakes: ['Odwrotne działanie (dzielenie zamiast mnożenia).', 'Zapominanie o zamianie jednostek.'], summary: ['Obliczam odległości rzeczywiste i na planie.'] },
      { id: 'miary_temp', name: 'Temperatura', grade: '5–6', pp: 'XII.5', skills: [P('temp', 'Odczytywanie temperatury i obliczanie różnic', 5, ['int_add'])],
        explain: '<p>Różnicę temperatur liczymy jak odejmowanie liczb całkowitych: od −3°C do 5°C temperatura wzrosła o 8°C. Ćwiczenia są w dziale „Liczby całkowite".</p>', examples: [], mistakes: [], summary: ['Obliczam różnice temperatur.'] }
    ] },
    { id: 'pred', name: 'Prędkość, droga i czas', icon: '→', pp: 'XII.9', topics: [
      { id: 'pred_v', name: 'Droga, prędkość, czas', grade: '6', pp: 'XII.9', skills: ['speed', P('speed_units', 'Zamiana km/h na m/s', 6, ['speed'])],
        explain: '<p>Prędkość 60 km/h znaczy: w ciągu każdej godziny 60 km.</p><ul><li><b>Droga</b> = prędkość · czas (s = v · t)</li><li><b>Prędkość</b> = droga : czas (v = s : t)</li><li><b>Czas</b> = droga : prędkość (t = s : v)</li></ul><p>Uwaga na jednostki: przy km/h czas musi być w godzinach (30 min = <span class="m">[[1/2]]</span> h).</p>', examples: [{ t: '80 km/h przez 15 min', s: ['15 min = [[1/4]] h', '80 · [[1/4]] = 20 km'] }], mistakes: ['Mnożenie prędkości przez minuty.', 'Dzielenie w złą stronę (czas : droga).'], summary: ['Obliczam drogę, prędkość i czas.'] }
    ] },
    { id: 'stat', name: 'Dane i statystyka', icon: '▥', pp: 'XIII', topics: [
      { id: 'stat_odcz', name: 'Odczytywanie danych z diagramów i tabel', grade: '6', pp: 'XIII.2', skills: ['data_read'],
        explain: '<p>Na diagramie słupkowym wysokość słupka pokazuje wartość. Odczytujesz ją, prowadząc wzrokiem poziomą linię od czubka słupka do osi z liczbami. Zawsze sprawdź, co oznaczają słupki i jaka jest „podziałka" osi.</p>', examples: [], mistakes: ['Odczytanie złego słupka.', 'Podanie jednej wartości, gdy pytanie dotyczy różnicy lub sumy.'], summary: ['Odczytuję i interpretuję dane z diagramów i tabel.'] },
      { id: 'stat_zb', name: 'Gromadzenie i porządkowanie danych', grade: '6', pp: 'XIII.1', skills: [P('data_collect', 'Gromadzenie danych, tabele i diagramy', 6)],
        explain: '<p>Dane możesz zbierać ankietą, porządkować w tabeli i przedstawiać na diagramie.</p>', examples: [], mistakes: [], summary: ['Porządkuję dane w tabeli.'] }
    ] },
    { id: 'tekst', name: 'Zadania tekstowe', icon: '✎', pp: 'XIV', topics: [
      { id: 'tekst_wiel', name: 'Zadania wieloetapowe z życia codziennego', grade: '4–6', pp: 'XIV.1–7', skills: ['word_multi'],
        explain: '<p>Plan na każde zadanie tekstowe:</p><ol><li><b>Przeczytaj</b> zadanie dwa razy. Podkreśl liczby i pytanie.</li><li><b>Zapisz dane</b>: co wiem? O co pytają?</li><li><b>Narysuj</b> rysunek pomocniczy, jeśli się da.</li><li><b>Podziel</b> zadanie na etapy – co policzę najpierw?</li><li><b>Policz</b> każdy etap.</li><li><b>Sprawdź</b>, czy wynik ma sens (czy reszta z 20 zł może być większa niż 20 zł?).</li><li><b>Odpowiedz</b> pełnym zdaniem.</li></ol>', examples: [{ t: '3 zeszyty po 4,50 zł i długopis 2,80 zł, płacę 20 zł', s: ['Zeszyty: 3 · 4,50 = 13,50 zł', 'Razem: 13,50 + 2,80 = 16,30 zł', 'Reszta: 20 − 16,30 = 3,70 zł', 'Odpowiedź: Dostanę 3,70 zł reszty.'] }], mistakes: ['Odpowiedź na inne pytanie niż zadane.', 'Pominięcie jednego etapu.', 'Brak sprawdzenia, czy wynik ma sens.'], summary: ['Dzielę zadanie na etapy.', 'Sprawdzam sensowność wyniku.'] }
    ] }
  ];

  // ======================= KLASA 5 =======================
  // Kolejność działów wg typowego rozkładu materiału klasy 5 (podstawa 2017, np. „Matematyka z plusem 5").
  const T6 = {}; D.forEach(dz => dz.topics.forEach(t => { T6[t.id] = t; }));
  const pick = (id, skills, extra) => Object.assign({}, T6[id], skills ? { skills } : {}, extra || {});
  const D5 = [
    { id: 'nat5', name: 'Liczby i działania', icon: 'N', pp: 'I, II', topics: [
      { id: 'nat_zap5', name: 'Zapisywanie i porównywanie liczb', grade: '4–5', pp: 'I.1–4', skills: [P('nat_cmp', 'Zapis i porównywanie liczb wielocyfrowych', 4)],
        explain: '<p>Każda cyfra w liczbie ma swoje „mieszkanie": jedności, dziesiątki, setki, tysiące… W liczbie 5 382 cyfra 5 oznacza 5 tysięcy, a 3 – trzy setki.</p><p>Porównując liczby, najpierw sprawdzamy, która ma więcej cyfr. Gdy tyle samo – porównujemy cyfry od lewej.</p>', examples: [], mistakes: ['Porównywanie liczb tylko po pierwszej cyfrze, bez sprawdzenia, ile mają cyfr.'], summary: ['Odczytuję i zapisuję liczby wielocyfrowe.', 'Porównuję liczby.'] },
      pick('nat_mem', ['tabl', 'nat_div_rem']),
      { id: 'nat_pisem', name: 'Działania pisemne', grade: '4–5', pp: 'II.3–4', skills: ['nat_pis'],
        explain: '<p>Duże liczby dodajemy, odejmujemy, mnożymy i dzielimy „w słupku". Najważniejsze: <b>jedności pod jednościami, dziesiątki pod dziesiątkami</b>.</p><ul><li><b>Dodawanie</b>: od prawej; gdy w kolumnie wyjdzie 10 lub więcej – zapisz jedności, a 1 przenieś dalej.</li><li><b>Odejmowanie</b>: gdy cyfra u góry jest mniejsza – pożycz 1 z kolumny po lewej.</li><li><b>Mnożenie przez liczbę dwucyfrową</b>: najpierw przez jedności, potem przez dziesiątki (wynik przesunięty o jedno miejsce w lewo), na końcu dodaj.</li><li><b>Dzielenie</b>: od lewej, cyfra po cyfrze; sprawdzaj mnożeniem.</li></ul>',
        examples: [{ t: '4 507 − 1 829', s: ['Jedności: 7 − 9 nie da się → pożyczam: 17 − 9 = 8.', 'Dziesiątki: 0 (po pożyczce −1) – też pożyczam: 9 − 2 = 7.', 'Setki: 4 (po pożyczce) − 8 → pożyczam: 14 − 8 = 6.', 'Tysiące: 3 − 1 = 2. Wynik: 2 678.'] }, { t: '34 · 26', s: ['34 · 6 = 204', '34 · 20 = 680 (przesunięte o miejsce w lewo)', '204 + 680 = 884'] }],
        mistakes: ['Zapominanie o przeniesieniu „jedynki".', 'Odejmowanie mniejszej cyfry od większej zamiast pożyczania.', 'Brak przesunięcia przy mnożeniu przez dziesiątki.'], summary: ['Dodaję, odejmuję, mnożę i dzielę pisemnie.', 'Sprawdzam wynik działaniem odwrotnym.'] },
      pick('nat_ord'), pick('nat_pot'), pick('nat_szac'), pick('tekst_wiel')
    ] },
    { id: 'podz5', name: 'Własności liczb naturalnych', icon: '÷', pp: 'II.7–9, II.13–14', topics: [pick('podz_cech'), pick('podz_pierw'), pick('podz_nwd')] },
    { id: 'uz5', name: 'Ułamki zwykłe', icon: '½', pp: 'IV, V.1, V.5', topics: [pick('uz_poj'), pick('uz_rozsz'), pick('uz_miesz'), pick('uz_por'), pick('uz_wsp'), pick('duz_dod'), pick('duz_mn'), pick('duz_cz'), pick('duz_dz')] },
    { id: 'fig5', name: 'Figury na płaszczyźnie', icon: '∠', pp: 'VII, VIII, IX', topics: [pick('kat_proste'), pick('kat_rodz'), pick('kat_wp'), pick('wiel_tr'), pick('kat_tr'), pick('wiel_czw'),
      { id: 'sym5', name: 'Oś symetrii figury', grade: '5', pp: 'IX.5', skills: [P('symmetry', 'Oś symetrii figury', 5)], explain: '<p>Figura ma oś symetrii, jeśli po złożeniu jej wzdłuż tej prostej obie części dokładnie się pokryją – jak skrzydła motyla.</p>', examples: [], mistakes: [], summary: ['Wskazuję osie symetrii figur.'] }] },
    { id: 'ud5', name: 'Ułamki dziesiętne', icon: ',', pp: 'IV.6–9, IV.12, V.2–3, XII.1', topics: [pick('ud_zap'), pick('ud_por'), pick('ud_dwum'), pick('dud_dod'), pick('dud_10'), pick('dud_mn'), pick('dud_dz'), pick('dud_mix'), pick('proc_poj', null, { name: 'Procenty a ułamki' })] },
    { id: 'pole5', name: 'Pola figur', icon: '▭', pp: 'XI.1–4', topics: [pick('pole_obw'), pick('pole_pros'), pick('pole_jedn'), pick('pole_rown'), pick('pole_tr'), pick('pole_trap')] },
    { id: 'calk5', name: 'Liczby całkowite', icon: '±', pp: 'III, V.9', topics: [pick('calk_os', ['int_compare']), pick('calk_dod'), pick('calk_mn')] },
    { id: 'obj5', name: 'Objętość figury', icon: '⬚', pp: 'XI.5–6', topics: [pick('bryl_obj')] }
  ];

  // ======================= KLASA 2 =======================
  // Edukacja matematyczna, I etap (podstawa 2017): liczby do 100, dodawanie i odejmowanie do 100,
  // mnożenie i dzielenie do 50 (w wielu programach – do 30 w I półroczu), zadania z treścią, pieniądze, czas, miary, figury.
  const t2 = (id, name, skills, explain, examples, mistakes, summary) => ({ id, name, grade: '2', pp: 'edukacja matematyczna', skills, explain, examples: examples || [], mistakes: mistakes || [], summary: summary || [] });
  const D2 = [
    { id: 'k2_liczby', name: 'Liczby do 100', icon: '10', pp: 'edukacja matematyczna', topics: [
      t2('k2t_dj', 'Dziesiątki i jedności', ['k2_dj'], '<p>Liczby dwucyfrowe składają się z <b>dziesiątek</b> i <b>jedności</b>. Wyobraź sobie paczki po 10 cukierków i luźne cukierki.</p><p>47 to 4 paczki po 10 (czyli 40) i 7 luźnych cukierków. Pierwsza cyfra – dziesiątki, druga – jedności.</p>', [{ t: 'Liczba 63', s: ['6 dziesiątek = 60', '3 jedności = 3', '60 + 3 = 63'] }], ['Mylenie miejsc: 63 to nie 36!'], ['Wiem, ile dziesiątek i jedności ma liczba.', 'Składam liczbę z dziesiątek i jedności.']),
      t2('k2t_cmp', 'Porównywanie liczb', ['k2_cmp'], '<p>Znaki: <b>&gt;</b> „większe niż", <b>&lt;</b> „mniejsze niż", <b>=</b> „równa się". Dzióbek znaku zawsze wskazuje na mniejszą liczbę.</p><p>Najpierw porównujemy dziesiątki. Jeśli są takie same – porównujemy jedności.</p>', [{ t: '52 i 29', s: ['Dziesiątki: 5 i 2. Pięć to więcej.', '52 > 29'] }], ['Patrzenie najpierw na jedności: 29 nie jest większe od 52, choć 9 > 2.'], ['Porównuję liczby do 100 i używam znaków <, >, =.']),
      t2('k2t_par', 'Liczby parzyste i nieparzyste', ['k2_parity'], '<p>Liczbę <b>parzystą</b> da się podzielić na dwie równe części bez reszty – jak cukierki dla dwojga dzieci po równo. Liczby parzyste kończą się na 0, 2, 4, 6, 8.</p><p>Liczby <b>nieparzyste</b> kończą się na 1, 3, 5, 7, 9.</p>', [], ['Sprawdzanie pierwszej cyfry zamiast ostatniej.'], ['Rozróżniam liczby parzyste i nieparzyste.']),
      t2('k2t_seq', 'Ciągi liczbowe', ['k2_seq'], '<p>W ciągu liczby zmieniają się według reguły, np. „co 2 w górę": 4, 6, 8, 10… Żeby znaleźć następną liczbę, sprawdź, o ile zmienia się każda kolejna.</p>', [{ t: '30, 27, 24, …', s: ['Każda liczba jest o 3 mniejsza.', 'Następna: 24 − 3 = 21'] }], [], ['Odkrywam regułę ciągu i podaję następną liczbę.'])
    ] },
    { id: 'k2_dod', name: 'Dodawanie i odejmowanie', icon: '+', pp: 'edukacja matematyczna', topics: [
      t2('k2t_add', 'Dodawanie do 100', ['k2_add'], '<p>Dodając, możesz osobno dodać dziesiątki i jedności: 34 + 25 → 30 + 20 = 50 i 4 + 5 = 9, razem 59.</p><p>Gdy jedności „przekraczają dziesiątkę", najłatwiej <b>dopełnić do pełnej dziesiątki</b>: 38 + 5 = 38 + 2 + 3 = 40 + 3 = 43.</p>', [{ t: '27 + 16', s: ['27 + 10 = 37', '37 + 3 = 40', '40 + 3 = 43'] }], ['Zgubiona dziesiątka: 38 + 5 = 33 ✗.'], ['Dodaję liczby w zakresie 100, także z przekroczeniem dziesiątki.']),
      t2('k2t_sub', 'Odejmowanie do 100', ['k2_sub'], '<p>Odejmując, też możemy iść „przez pełną dziesiątkę": 42 − 5 = 42 − 2 − 3 = 40 − 3 = 37.</p><p>Wynik zawsze możesz <b>sprawdzić dodawaniem</b>: 37 + 5 = 42 ✓.</p>', [{ t: '71 − 36', s: ['71 − 30 = 41', '41 − 1 = 40', '40 − 5 = 35', 'Sprawdzenie: 35 + 36 = 71 ✓'] }], ['Odwracanie jedności: 42 − 5 = 43 ✗ (5 − 2 zamiast 12 − 5).'], ['Odejmuję w zakresie 100.', 'Sprawdzam odejmowanie dodawaniem.']),
      t2('k2t_box', 'Okienka', ['k2_box'], '<p>Okienko □ to ukryta liczba. Szukamy jej tak, żeby działanie było prawdziwe. □ + 7 = 15 → jaka liczba plus 7 daje 15? Możemy policzyć 15 − 7 = 8.</p><p>Zawsze sprawdź: wstaw liczbę w okienko i policz.</p>', [], [], ['Znajduję brakującą liczbę w działaniu.'])
    ] },
    { id: 'k2_mn', name: 'Mnożenie i dzielenie', icon: '×', pp: 'edukacja matematyczna', topics: [
      t2('k2t_mul', 'Mnożenie do 50', ['k2_mul'], '<p>Mnożenie to szybkie dodawanie tych samych liczb. 3 · 4 to „trzy razy po 4": 4 + 4 + 4 = 12.</p><p>Wyobraź sobie 3 rzędy po 4 krzesła – razem 12 krzeseł. Nieważne, czy policzysz rzędy, czy kolumny: 3 · 4 = 4 · 3.</p>', [{ t: '5 · 6', s: ['Pięć razy po 6: 6, 12, 18, 24, 30', '5 · 6 = 30'] }], ['Dodawanie zamiast mnożenia: 3 · 4 = 7 ✗.'], ['Mnożę w zakresie 50.', 'Rozumiem, że mnożenie to dodawanie tych samych liczb.']),
      t2('k2t_div', 'Dzielenie do 50', ['k2_div'], '<p>Dzielenie to <b>rozdzielanie po równo</b>: 12 cukierków dla 3 dzieci – każde dostaje 4. 12 : 3 = 4.</p><p>Dzielenie sprawdzamy mnożeniem: 4 · 3 = 12 ✓.</p>', [], ['Odejmowanie zamiast dzielenia.'], ['Dzielę w zakresie 50.', 'Sprawdzam dzielenie mnożeniem.']),
      t2('k2t_half', 'Połowa i podwojenie', ['k2_half'], '<p><b>Połowa</b> to jedna z dwóch równych części: połowa z 10 to 5. <b>Podwojenie</b> to wzięcie liczby dwa razy: podwojone 7 to 14.</p>', [], ['Mylenie połowy z podwojeniem.'], ['Obliczam połowę i podwojenie liczby.'])
    ] },
    { id: 'k2_tekst', name: 'Zadania z treścią', icon: '✎', pp: 'edukacja matematyczna', topics: [
      t2('k2t_word', 'Zadania z treścią', ['k2_word'], '<p>Jak rozwiązać zadanie z treścią?</p><ol><li>Przeczytaj uważnie – możesz dwa razy.</li><li>Zastanów się: będzie <b>więcej</b> czy <b>mniej</b>? Więcej – dodajemy albo mnożymy. Mniej – odejmujemy albo dzielimy.</li><li>Zapisz działanie i policz.</li><li>Odpowiedz pełnym zdaniem.</li></ol>', [{ t: 'Kuba miał 15 kulek, dostał 8. Ile ma teraz?', s: ['Ma więcej – dodajemy.', '15 + 8 = 23', 'Odpowiedź: Kuba ma 23 kulki.'] }], ['Wybranie złego działania – warto zapytać siebie: więcej czy mniej?'], ['Rozwiązuję zadania z treścią na dodawanie, odejmowanie, mnożenie i dzielenie.'])
    ] },
    { id: 'k2_pien', name: 'Pieniądze', icon: 'zł', pp: 'edukacja matematyczna', topics: [
      t2('k2t_money', 'Złote i grosze', ['k2_money'], '<p>Monety i banknoty mają różne wartości: 1 zł, 2 zł, 5 zł, 10 zł, 20 zł, 50 zł… <b>1 złoty to 100 groszy</b>.</p><p><b>Reszta</b> to pieniądze, które dostajesz z powrotem, gdy płacisz więcej, niż kosztuje rzecz: płacisz 10 zł za lody po 6 zł – reszta 4 zł.</p>', [{ t: 'Reszta z 20 zł przy zakupie za 13 zł', s: ['20 − 13 = 7', 'Reszta: 7 zł'] }], ['1 zł = 10 gr ✗ – naprawdę 1 zł = 100 gr.'], ['Liczę pieniądze i obliczam resztę.', 'Zamieniam złote na grosze.'])
    ] },
    { id: 'k2_czas', name: 'Czas', icon: '⏰', pp: 'edukacja matematyczna', topics: [
      t2('k2t_clock', 'Zegar', ['k2_clock'], '<p>Zegar ma dwie wskazówki: <b>małą</b> (godziny) i <b>dużą</b> (minuty).</p><ul><li>Duża na 12 → pełna godzina (np. 3:00).</li><li>Duża na 6 → pół godziny: 3:30 – „wpół do czwartej".</li><li>Duża na 3 → kwadrans po: 3:15.</li><li>Duża na 9 → za kwadrans pełna: 3:45 – „za kwadrans czwarta".</li></ul>', [], ['Mylenie wskazówek.', 'Przy 3:30 mała wskazówka jest między 3 a 4 – to wciąż godzina 3!'], ['Odczytuję pełne godziny, połówki i kwadranse.']),
      t2('k2t_cal', 'Kalendarz', ['k2_cal'], '<p>Tydzień ma 7 dni: poniedziałek, wtorek, środa, czwartek, piątek, sobota, niedziela. Rok ma 12 miesięcy: od stycznia do grudnia.</p><p>Licząc „za 3 dni", zaczynamy od jutra.</p>', [], ['Liczenie dzisiejszego dnia jako pierwszego.'], ['Znam dni tygodnia i miesiące.', 'Obliczam daty za tydzień i za kilka dni.'])
    ] },
    { id: 'k2_miary', name: 'Mierzenie', icon: '📏', pp: 'edukacja matematyczna', topics: [
      t2('k2t_len', 'Długość, masa, pojemność', ['k2_len', P('k2_temp', 'Odczytywanie temperatury na termometrze', 2)], '<p><b>Długość</b> mierzymy w centymetrach (cm) i metrach (m): 1 m = 100 cm. <b>Masę</b> – w kilogramach (kg). <b>Pojemność</b> (ile się zmieści płynu) – w litrach (l).</p>', [{ t: '2 m 30 cm', s: ['2 m = 200 cm', '200 + 30 = 230 cm'] }], ['1 m = 10 cm ✗.'], ['Zamieniam metry na centymetry.', 'Dodaję i odejmuję długości, masy i pojemności.'])
    ] },
    { id: 'k2_geo', name: 'Figury geometryczne', icon: '△', pp: 'edukacja matematyczna', topics: [
      t2('k2t_shapes', 'Figury i ich boki', ['k2_shapes', P('k2_sym', 'Figury symetryczne', 2)], '<p>Poznajemy figury: <b>trójkąt</b> (3 boki), <b>kwadrat</b> (4 równe boki), <b>prostokąt</b> (4 boki: dwa dłuższe i dwa krótsze), <b>koło</b> (nie ma boków ani rogów).</p><p>Długość wszystkich boków razem obliczamy, dodając je po kolei.</p>', [], ['Mylenie kwadratu z prostokątem.'], ['Rozpoznaję i nazywam figury.', 'Dodaję długości boków figury.'])
    ] }
  ];

  MP.CURR = { 2: D2, 5: D5, 6: D };
  MP.GRADES = { 2: { name: 'Klasa 2', short: '2', desc: 'Liczby do 100, dodawanie i odejmowanie, mnożenie do 50, zegar, pieniądze' }, 5: { name: 'Klasa 5', short: '5', desc: 'Ułamki zwykłe i dziesiętne, działania pisemne, kąty, pola figur' }, 6: { name: 'Klasa 6', short: '6', desc: 'Całe ułamki, liczby całkowite, procenty, równania, bryły, prędkość' } };
  MP.setGrade = function (g) {
    g = MP.CURR[g] ? +g : 6; MP.grade = g;
    const DD = MP.CURR[g];
    MP.DZIALY = DD; MP.TOPICS = {}; MP.SKILL_TOPIC = {}; MP.SKILL_ORDER = [];
    DD.forEach(dz => dz.topics.forEach(t => { t.dzial = dz.id; MP.TOPICS[t.id] = t; t.skills.forEach(s => { MP.SKILL_TOPIC[s] = t.id; MP.SKILL_ORDER.push(s); }); }));
  };
  MP.isReady = (id) => MP.SK[id] && !MP.SK[id].planned;
  MP.setGrade(6);
})(MP);
