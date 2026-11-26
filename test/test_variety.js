// różnorodność zadań z treścią kl. 1–3: w serii 5 zadań nie powtarza się ten sam przedmiot i ta sama sytuacja w kółko
const path = require('path'); const A = (f) => require(path.join(__dirname, '..', 'src', f));
['core.js', 'errors.js', 'gens_a.js', 'gens_b.js', 'gens_c.js', 'gens_k2.js', 'gens_k13.js', 'gens_k4p.js', 'gens_k78.js', 'gens_ix.js', 'themes.js', 'curriculum.js', 'curriculum_more.js', 'engine.js'].forEach(A);
let bad = 0;
const ok = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) bad++; };
ok(Object.keys(MP.THEMES).every(k => (MP.THEMES[k].k2n || []).length >= 5), 'każde zainteresowanie ma co najmniej 5 przedmiotów do zadań');
for (const [g, id] of [[1, 'k1_word'], [2, 'k2_word'], [3, 'k3_word']]) { MP.setGrade(g); MP.interests = ['gry'];
  let rep = 0, runs = 200, starts = 0;
  for (let k = 0; k < runs; k++) { const P = []; for (let i = 0; i < 5; i++) { const it = MP.engine.buildItem(MP.engine.makeSpec(id, 1 + (i % 3), 'input')); P.push(MP.util.plain(it.prompt)); }
    const head = P.map(t => t.replace(/\d+/g, '#').split(' ').slice(1, 6).join(' ')); if (new Set(head).size <= 2) rep++;
    const nouns = P.map(t => (t.match(/(monet|diament|skrzyn|kart|figur)/) || [''])[0]); if (new Set(nouns).size >= 3) starts++; }
  ok(rep / runs < 0.1, `kl. ${g}: serie z prawie identycznymi zadaniami: ${Math.round(rep / runs * 100)}%`);
  ok(starts / runs > 0.5, `kl. ${g} (zainteresowanie „gry”): serie z co najmniej 3 różnymi przedmiotami: ${Math.round(starts / runs * 100)}%`); }
console.log(bad ? 'BŁĘDY: ' + bad : 'Różnorodność OK'); if (bad) process.exit(1);
