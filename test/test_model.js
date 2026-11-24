// Symulacje ucznia: sprawdzamy, czy silnik zachowuje się jak dobry korepetytor.
const path = require('path');
['core.js', 'errors.js', 'gens_a.js', 'gens_b.js', 'gens_c.js', 'gens_k2.js', 'gens_k13.js', 'gens_k4p.js', 'gens_k78.js', 'gens_ix.js', 'themes.js', 'curriculum.js', 'curriculum_more.js', 'engine.js'].forEach(f => require(path.join(__dirname, '..', 'src', f)));
const E = MP.engine, I = MP.items, U = MP.util;
let fails = 0; const ok = (c, m) => { if (!c) { fails++; console.log('  ✗', m); } else console.log('  ✓', m); };
const correct = (it) => { const a = it.answer; if (a.kind === 'num') return (a.value.n < 0 ? '-' : '') + Math.abs(a.value.n) + (a.value.d > 1 ? '/' + a.value.d : ''); if (a.kind === 'choice') return a.correct; if (a.kind === 'order') return a.seq; if (a.kind === 'match') return Object.assign({}, a.pairs); if (a.kind === 'multi') return a.values.map(v => v.n + (v.d > 1 ? '/' + v.d : ''));
  if (a.kind === 'pos') return U.val(a.value); if (a.kind === 'shade') return Array.from({ length: a.value.n * a.parts / a.value.d }, (_, i) => i);
  if (a.kind === 'cut') { const k = a.dens.reduce((x, y) => U.lcm(x, y)); return { k, n: a.fr.map(f => f.n * k / f.d), s: a.res ? a.res.n * k / a.res.d : undefined }; }
  if (a.kind === 'bins') return Object.assign({}, a.bins); if (a.kind === 'point') return { x: a.x, y: a.y }; if (a.kind === 'rect') return { a: a.solA, b: a.solB };
  if (a.kind === 'cells') return Array.from({ length: a.count }, (_, i) => i); if (a.kind === 'multisel') return a.set.slice(); };
function misAnswer(it, code) {
  if (it.answer.kind === 'num') { const w = (it.wrong || []).find(w => w.code === code && w.v && !U.eq(w.v, it.answer.value)); if (w) return w.v.n + (w.v.d > 1 ? '/' + w.v.d : ''); }
  if (it.answer.kind === 'choice') { const i = (it.options || []).findIndex(o => o.code === code); if (i >= 0) return i; }
  return null;
}
// pętla jednej sesji; student(it, spec) -> odpowiedź
function runSession(S, opts, student, now, log) {
  E.startSession(S, opts, now);
  let steps = 0, cards = [];
  while (steps++ < 80) {
    const st = E.nextStep(S, now); if (!st) break;
    if (st.kind === 'card') { cards.push(st.card + ':' + (st.skill || '') + (st.remedy ? '→' + st.remedy : '')); continue; }
    const it = E.buildItem(st);
    const resp = student(it, st);
    const res = I.check(it, resp);
    const rec = E.record(S, { skill: st.skill, d: st.d, type: it.type, hints: 0, attempt: 1, sec: 20, mode: S.session.mode, id: st.skill + '#' + st.type + '#' + st.seed, aspect: it.aspect }, res, now);
    E.afterAnswer(S, st, rec, now);
    if (log) log.push({ skill: st.skill, d: st.d, type: it.type, ok: rec.ok, code: rec.code, detour: !!st.detour, probe: st.probe });
    now += 30000;
  }
  const mode = S.session.mode; const sum = E.endSession(S, now);
  if (mode === 'mastery') sum.test = E.masteryResult(S, sum.results, now);
  if (mode === 'repair') sum.repair = E.repairResult(S, sum.results, now);
  return { sum, cards, now };
}
const DAY = E.DAY; let T = Date.UTC(2026, 10, 2, 15); MP.setGrade(6);
const H = (n, o) => Array.from({ length: n }, (_, i) => Object.assign({ t: T, d: 1 + (i % 3), ok: true, h: 0, ty: i % 2 ? 'fill' : 'input', s: 20 }, o || {}));
console.log('A) Ile zadań: ABCD i tempo');
{ const S = E.newState(T); const s = E.sk(S, 'fr_add_same'); s.n = 10; s.hist = H(10, { ty: 'choice' }); ok(E.rawLevel(s) === 3, 'same trafienia w ABCD nie dają opanowania (poziom ' + E.rawLevel(s) + ')');
  s.hist = H(8, { ty: 'choice' }).concat(H(3, { ty: 'input', d: 3 })); ok(E.rawLevel(s) === 4, 'ABCD + co najmniej 2 wpisane samodzielnie → poziom 4');
  s.hist = H(10).map(x => Object.assign(x, { s: 400 })); ok(E.rawLevel(s) === 3, 'dobrze, ale bardzo wolno (≥1,5× czasu orientacyjnego) → jeszcze nie opanowane');
  s.hist = H(10); ok(E.rawLevel(s) === 4, 'dobrze i w normalnym tempie → poziom 4');
  const s2 = E.sk(S, 'k2_parity'); MP.setGrade(2); s2.n = 10; s2.hist = H(10, { ty: 'choice' }); ok(E.rawLevel(s2) >= 3, 'umiejętność z zadaniami otwartymi wymaga ich: poziom ' + E.rawLevel(s2)); MP.setGrade(6); }
console.log('B) Test działu');
{ MP.setGrade(2); const S = E.newState(T); const dz = MP.DZIALY[0]; const ids = E.dzSkills(dz);
  ok(!E.dzialTest(S, dz).ready, 'nowy uczeń: dział nie jest gotowy do testu');
  ids.forEach(id => { const s = E.sk(S, id); s.n = 10; s.hist = H(10); E.updateLevel(s, T); });
  ok(E.dzialTest(S, dz).ready && !E.dzialTest(S, dz).passed, 'wszystkie umiejętności opanowane → „gotowy do testu”, ale nie zaliczony');
  const rec = E.recommend(S, T); ok(rec.kind === 'chtest' && rec.dz === dz.id, 'rekomendacja: ' + rec.label);
  const specs = E.chtestSpecs(S, dz.id); ok(specs.length >= 6 && specs.length <= 14, 'test działu: ' + specs.length + ' zadań, umiejętności: ' + new Set(specs.map(x => x.skill)).size);
  let r = E.chtestResult(S, dz.id, specs.map((sp, i) => ({ skill: sp.skill, ok: i > 2 })), T); ok(!r.pass && S.chTests[dz.id].tries === 1 && r.weak.length, 'niezdany (' + r.pct + '%) → do powtórki: ' + r.weak.join(', '));
  ok(S.skills[r.weak[0]].needsReview, 'słabe umiejętności trafiają do powtórki');
  r = E.chtestResult(S, dz.id, specs.map(sp => ({ skill: sp.skill, ok: true })), T + DAY); ok(r.pass && E.dzialTest(S, dz).passed, 'zdany → dział w pełni zaliczony'); MP.setGrade(6); }
console.log('C) Migracja istniejących postępów');
{ const S = E.newState(T); const a = E.sk(S, 'fr_add_same'); a.n = 12; a.ok = 11; a.lvl = 3; a.testReady = true; a.hist = H(10);
  const b = E.sk(S, 'nww'); b.n = 8; b.stuck = 'lcm_product'; b.repairDone = true; b.lvl = 2;
  const c = E.sk(S, 'fr_expand'); c.n = 9; c.lvl = 5; c.l4At = T - 9 * DAY; c.stage = 3; c.mastery = { at: T - 9 * DAY, aspects: ['proc'] };
  S.stats.items = 29; S.session = { mode: 'mastery', skill: 'fr_add_same', results: [{ ok: true }] };
  const before = JSON.stringify({ items: S.stats.items, n: [a.n, b.n, c.n], hist: a.hist.length, c5: c.lvl });
  E.migrate(S);
  ok(a.mastery && a.mastery.auto && !a.testReady, '„gotowe do testu” → opanowane (bez utraty)');
  ok(!b.stuck, 'zrobiona ścieżka naprawcza → blokada zdjęta');
  ok(c.lvl === 5 && c.mastery && !c.mastery.auto, 'poziom 5 i zaliczony test zostają');
  ok(JSON.stringify({ items: S.stats.items, n: [a.n, b.n, c.n], hist: a.hist.length, c5: c.lvl }) === before, 'liczby zadań, historia i poziomy bez zmian');
  ok(S.session === null && S.settings.seriesLen === 5 && S.chTests, 'przerwany test pojedynczej umiejętności usunięty, nowe ustawienia dodane');
  E.migrate(S); ok(a.mastery.auto && c.lvl === 5, 'migracja jest bezpieczna przy ponownym uruchomieniu'); }
console.log(fails ? '\nNIEUDANE: ' + fails : '\nWszystkie testy modelu przeszły.');
