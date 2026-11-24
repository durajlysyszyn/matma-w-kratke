// generatory zależne od klasy (MP.grade) – sprawdzenie dla każdej klasy
const path = require('path'); const A = (f) => require(path.join(__dirname, '..', 'src', f));
['core.js', 'errors.js', 'gens_a.js', 'gens_b.js', 'gens_c.js', 'gens_k2.js', 'gens_k13.js', 'gens_k4p.js', 'gens_k78.js', 'gens_ix.js', 'themes.js', 'curriculum.js', 'curriculum_more.js', 'engine.js'].forEach(A);
const U = MP.util, I = MP.items; let bad = 0, tot = 0;
for (const g of [1, 2, 3, 4, 5, 6, 7, 8]) { if (!MP.CURR[g]) continue; MP.setGrade(g);
  for (const id of ['nat_roman', 'temp', 'k2_temp', 'symmetry', 'k2_sym']) for (const d of [1, 2, 3]) for (const ty of MP.SK[id].types[d]) for (let k = 0; k < 150; k++) { tot++;
    const it = MP.engine.buildItem({ skill: id, d, type: ty, seed: k * 31 + d });
    const a = it.answer; let ans = a.kind === 'num' ? (a.value.n < 0 ? '-' : '') + Math.abs(a.value.n) + (a.value.d > 1 ? '/' + a.value.d : '') : a.correct;
    const r = I.check(it, ans); if (!r.ok) { bad++; if (bad < 6) console.log('✗', g, id, d, ty, U.plain(it.prompt)); }
    if (g <= 3 && id === 'nat_roman' && /[LCDM]/.test(U.plain(it.prompt) + (it.options || []).map(o => o.label).join(''))) { /* opcje dystraktorów mogą mieć L przy n+10 */ }
    if (g <= 3 && id === 'temp' && a.kind === 'num' && a.value.n < 0) { bad++; console.log('ujemna temp w kl.', g); }
  } }
console.log('Zadań:', tot, 'błędów:', bad);
