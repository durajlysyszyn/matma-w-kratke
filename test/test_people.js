// imiona bliskich osób w zadaniach z treścią: poprawność, brak powtórzeń imienia w jednym zadaniu, wielka litera na początku
const path = require('path'); const A = (f) => require(path.join(__dirname, '..', 'src', f));
['core.js', 'errors.js', 'gens_a.js', 'gens_b.js', 'gens_c.js', 'gens_k2.js', 'gens_k13.js', 'gens_k4p.js', 'gens_k78.js', 'gens_ix.js', 'themes.js', 'curriculum.js', 'curriculum_more.js', 'engine.js'].forEach(A);
const U = MP.util, I = MP.items; let bad = 0, tot = 0, seen = 0;
MP.people = [{ n: 'Tymon', g: 'm' }, { n: 'babcia Ela', g: 'f' }, { n: 'pies Burek', g: 'm' }];
for (const [g, ids] of [[1, ['k1_word']], [2, ['k2_word']], [3, ['k3_word']], [6, ['fr_add_diff']]]) { MP.setGrade(g);
  for (const id of ids) for (const d of [1, 2, 3]) for (const ty of (MP.SK[id].types[d] || [])) for (let k = 0; k < 300; k++) { tot++;
    const it = MP.engine.buildItem({ skill: id, d, type: ty, th: 'szkola', seed: k * 97 + d });
    const t = U.plain(it.prompt).replace(/<[^>]+>/g, ' ');
    if (/Tymon|Ela|Burek/.test(t)) seen++;
    if (/^[a-ząćęłńóśźż]/.test(t)) { bad++; console.log('mała litera:', t.slice(0, 60)); }
    const m = t.match(/(Tymon|babcia Ela|Babcia Ela|pies Burek|Pies Burek) ma .*?, a (Tymon|babcia Ela|pies Burek)/); if (m && m[1].toLowerCase() === m[2].toLowerCase()) { bad++; console.log('dwa razy to samo imię:', t); }
    if (!['input', 'choice', 'fill'].includes(it.type)) continue;
    const a = it.answer; const ans = a.kind === 'num' ? (a.value.n < 0 ? '-' : '') + Math.abs(a.value.n) + (a.value.d > 1 ? '/' + a.value.d : '') : a.correct;
    if (!I.check(it, ans).ok) { bad++; if (bad < 5) console.log('✗', id, t); }
  } }
console.log('Zadań:', tot, 'z bliskimi osobami:', seen, 'błędów:', bad); if (bad || !seen) process.exit(1);
