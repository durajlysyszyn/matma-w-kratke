/* Minigry – nagroda po opanowaniu tematu. Etap 1: silnik „Łapanie” (dotknij spadających poprawnych odpowiedzi).
   Zasady: zawsze można pominąć, gra trwa 40 s i kończy się sama, brak kar za pomyłki, nic nie jest wysyłane poza zapis postępów. */
(function () {
  const MP = window.MP = window.MP || {};
  const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const fr = (a, b) => '<span class="gfr"><i>' + a + '</i><i>' + b + '</i></span>';
  const isPrime = (n) => { if (n < 2) return false; for (let d = 2; d * d <= n; d++) if (n % d === 0) return false; return true; };

  // Każda gra: id, nazwa, polecenie, item() -> { html, ok, why } (why – krótkie wyjaśnienie po złym dotknięciu)
  const DEFS = {
    1: () => ({ id: 'g1_10', name: 'Łap dziesiątkę', goal: 'Łap działania, które dają <b>10</b>.', short: 'wynik 10',
      item() { const ok = Math.random() < 0.5; let a, b; if (ok) { a = rnd(1, 9); b = 10 - a; } else { do { a = rnd(1, 9); b = rnd(1, 9); } while (a + b === 10 || Math.abs(a + b - 10) > 3); }
        return { html: a + ' + ' + b, ok, why: a + ' + ' + b + ' = ' + (a + b) }; } }),
    2: () => { const even = Math.random() < 0.5; return { id: 'g2_par', name: even ? 'Łapanie parzystych' : 'Łapanie nieparzystych', goal: 'Łap liczby <b>' + (even ? 'parzyste' : 'nieparzyste') + '</b>.', short: even ? 'parzyste' : 'nieparzyste',
      item() { const n = rnd(1, 99); return { html: String(n), ok: (n % 2 === 0) === even, why: n + ' jest ' + (n % 2 === 0 ? 'parzysta' : 'nieparzysta') }; } }; },
    3: () => { const N = rnd(3, 9); return { id: 'g3_mul', name: 'Łapanie wyników ×' + N, goal: 'Łap liczby, które są wynikiem mnożenia <b>przez ' + N + '</b> (np. ' + N * 2 + ', ' + N * 3 + ').', short: 'wyniki ×' + N,
      item() { if (Math.random() < 0.5) { const k = rnd(1, 10); return { html: String(N * k), ok: true }; } let n; do { n = rnd(N, N * 10); } while (n % N === 0); return { html: String(n), ok: false, why: n + ' nie jest w tabliczce ×' + N }; } }; },
    4: () => { const d = pick([3, 5, 9]); return { id: 'g4_div', name: 'Sito podzielności', goal: 'Łap liczby <b>podzielne przez ' + d + '</b>.', short: 'podzielne przez ' + d,
      item() { const ok = Math.random() < 0.5; let n; do { n = rnd(10, 300); } while ((n % d === 0) !== ok); return { html: String(n), ok, why: d === 5 ? 'ostatnia cyfra to nie 0 ani 5' : 'suma cyfr ' + String(n).split('').reduce((s, c) => s + +c, 0) + ' nie dzieli się przez ' + d }; } }; },
    5: () => ({ id: 'g5_prime', name: 'Pierwsze na celowniku', goal: 'Łap <b>liczby pierwsze</b> (dzielą się tylko przez 1 i przez siebie).', short: 'liczby pierwsze',
      item() { const ok = Math.random() < 0.5; let n; do { n = rnd(2, 70); } while (isPrime(n) !== ok || (!ok && n % 2 === 0 && Math.random() < 0.6)); let why = ''; if (!ok) { for (let d = 2; d < n; d++) if (n % d === 0) { why = n + ' = ' + d + ' · ' + n / d; break; } } return { html: String(n), ok, why }; } }),
    6: () => { const T = pick([[1, 2], [1, 3], [1, 4], [3, 4]]); const tv = T[0] / T[1]; return { id: 'g6_frac', name: 'Łapanie ułamków', goal: 'Łap ułamki <b>równe ' + fr(T[0], T[1]) + '</b>' + (T[1] === 2 || T[1] === 4 ? ' (także w postaci dziesiętnej)' : '') + '.', short: 'równe ' + T[0] + '/' + T[1],
      item() { if (Math.random() < 0.5) { if ((T[1] === 2 || T[1] === 4) && Math.random() < 0.25) return { html: String(tv).replace('.', ','), ok: true }; const k = rnd(2, 8); return { html: fr(T[0] * k, T[1] * k), ok: true }; }
        let a, b; do { b = rnd(2, 16); a = rnd(1, b - 1); } while (Math.abs(a / b - tv) < 1e-9); return { html: fr(a, b), ok: false, why: a + '/' + b + (a / b > tv ? ' to więcej' : ' to mniej') + ' niż ' + T[0] + '/' + T[1] }; } }; },
    7: () => { const v = pick(['x', 'a', 'y']); const o = v === 'x' ? 'y' : 'x'; return { id: 'g7_like', name: 'Zbieracz wyrazów podobnych', goal: 'Łap wyrazy <b>podobne do 3' + v + '</b>.', short: 'podobne do 3' + v,
      item() { const k = pick([-5, -4, -3, -2, -1, 2, 4, 5, 6, 7, 8, 9]); const c = k === -1 ? '−' : String(k).replace('-', '−');
        if (Math.random() < 0.5) return { html: c + v, ok: true };
        const w = pick([[c + v + '²', 'inna potęga'], [c + o, 'inna litera'], [String(Math.abs(k) + 1), 'brak litery'], [c + v + o, 'dwie litery']]); return { html: w[0], ok: false, why: w[1] }; } }; },
    8: () => ({ id: 'g8_irr', name: 'Łapanie niewymiernych', goal: 'Łap liczby <b>niewymierne</b> (nie da się ich zapisać jako ułamek).', short: 'niewymierne',
      item() { if (Math.random() < 0.5) return { html: pick(['√2', '√3', '√5', '√6', '√7', '√8', '√10', '√11', 'π', '2√3', '3√2', '1 + √2']), ok: true };
        const w = pick([['√4', '√4 = 2'], ['√9', '√9 = 3'], ['√16', '√16 = 4'], ['√25', '√25 = 5'], ['0,5', '0,5 = 1/2'], ['0,(3)', '0,(3) = 1/3'], ['−7', 'liczba całkowita'], ['√49', '√49 = 7'], ['3,14', '3,14 = 314/100'], ['√100', '√100 = 10']]); return { html: w[0], ok: false, why: w[1] }; } }),
  };
  MP.games = {
    pick(grade) { const f = DEFS[grade] || DEFS[6]; return f(); },
    DURATION: 40,
    // wyświetla grę w kontenerze el; onEnd({score, skipped, gid})
    mount(el, def, opt) {
      opt = opt || {}; const grade = opt.grade || 6;
      const fall = grade <= 3 ? 6.5 : grade <= 6 ? 5.2 : 4.6; // sekundy na przelot
      const every = grade <= 3 ? 1.15 : 0.95;
      const best = opt.best || 0;
      let started = false, score = 0, miss = 0, t = 0, spawnT = 0.3, last = 0, raf = 0, running = false, ended = false;
      const items = [];
      el.innerHTML = '<div class="game" role="region" aria-label="Minigra: ' + def.name + '"><div class="ghead"><b>' + def.name + '</b><button class="btn sm ghost" data-g="skip">Pomiń grę</button></div>' +
        '<div class="gintro"><p class="ggoal">' + def.goal + '</p><p class="small muted">Dotykaj tylko tego, co pasuje. Pomyłki nie odbierają punktów. Gra trwa ' + MP.games.DURATION + ' sekund.</p><div class="bar2"><button class="btn pri" data-g="go">Start!</button><button class="btn ghost" data-g="skip">Nie teraz</button></div></div>' +
        '<div class="gplay" hidden><div class="gbar"><span class="gsc" aria-live="polite">0</span><span class="gtgt">' + def.short + '</span><span class="gtime"><i></i></span></div><div class="garea"></div><p class="gwhy" aria-live="polite"></p></div>' +
        '<div class="gend" hidden></div></div>';
      const root = el.querySelector('.game'), area = el.querySelector('.garea'), sc = el.querySelector('.gsc'), tm = el.querySelector('.gtime i'), why = el.querySelector('.gwhy');
      const end = (skipped) => {
        if (ended) return; ended = true; running = false; cancelAnimationFrame(raf); document.removeEventListener('visibilitychange', vis);
        if (skipped) { opt.onEnd && opt.onEnd({ score, skipped: true, gid: def.id }); return; }
        el.querySelector('.gplay').hidden = true; const ge = el.querySelector('.gend'); ge.hidden = false;
        const rec = score > best && best > 0;
        ge.innerHTML = '<p class="gbig">' + (score >= 10 ? '🎉' : score >= 5 ? '👏' : '🙂') + ' Złapane: <b>' + score + '</b></p>' + (rec ? '<p><b>Nowy rekord!</b> Poprzednio: ' + best + '.</p>' : best ? '<p class="small muted">Twój rekord: ' + Math.max(best, score) + '</p>' : '') + '<div class="bar2"><button class="btn pri" data-g="done">Wracam do nauki →</button></div>';
        ge.querySelector('[data-g=done]').focus();
      };
      const vis = () => { if (document.hidden) { running = false; cancelAnimationFrame(raf); } else if (!ended && !el.querySelector('.gplay').hidden) { running = true; last = performance.now(); raf = requestAnimationFrame(loop); } };
      function spawn() {
        const it = def.item(); const b = document.createElement('button'); b.type = 'button'; b.className = 'gitem'; b.innerHTML = it.html;
        const W = area.clientWidth || 320; const x = 8 + Math.random() * Math.max(10, W - 110);
        b.style.left = x + 'px'; const o = { el: b, it, y: -60, hit: false }; items.push(o); area.appendChild(b);
        b.addEventListener('pointerdown', (e) => { e.preventDefault(); tap(o); });
        b.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tap(o); } });
      }
      function tap(o) {
        if (o.hit || ended) return; o.hit = true;
        if (o.it.ok) { score++; sc.textContent = score; o.el.classList.add('gok'); o.el.innerHTML += ' <small>+1</small>'; why.textContent = ''; }
        else { miss++; o.el.classList.add('gno'); why.textContent = 'Nie ta' + (o.it.why ? ': ' + o.it.why.replace(/<[^>]+>/g, '') : '') + '. Szukamy: ' + def.short.replace(/<[^>]+>/g, '') + '.'; }
        setTimeout(() => { o.el.remove(); }, 380);
      }
      function loop(ts) {
        if (!running) return; const dt = Math.min(0.1, (ts - last) / 1000); last = ts; t += dt;
        const H = area.clientHeight || 360;
        spawnT -= dt; if (spawnT <= 0) { spawn(); spawnT = every * (0.8 + Math.random() * 0.4); }
        for (let i = items.length - 1; i >= 0; i--) { const o = items[i]; if (o.hit) { items.splice(i, 1); continue; } o.y += (H + 60) / fall * dt; o.el.style.transform = 'translateY(' + o.y + 'px)'; if (o.y > H) { o.el.remove(); items.splice(i, 1); } }
        tm.style.width = Math.max(0, 100 - t / MP.games.DURATION * 100) + '%';
        if (t >= MP.games.DURATION) return end(false);
        raf = requestAnimationFrame(loop);
      }
      root.addEventListener('click', (e) => {
        const b = e.target.closest('[data-g]'); if (!b) return;
        if (b.dataset.g === 'skip') return end(!started);
        if (b.dataset.g === 'done') return opt.onEnd && opt.onEnd({ score, skipped: false, gid: def.id });
        if (b.dataset.g === 'go') { started = true; el.querySelector('.gintro').hidden = true; el.querySelector('.gplay').hidden = false; el.querySelectorAll('.ghead [data-g=skip]').forEach(x => x.textContent = 'Zakończ'); running = true; last = performance.now(); document.addEventListener('visibilitychange', vis); raf = requestAnimationFrame(loop); }
      });
      // test/podgląd: przyspieszenie czasu
      return { end, state: () => ({ score, miss, t, running, ended, items: items.length }), _tick: (sec) => { t += sec; } };
    }
  };
})();
