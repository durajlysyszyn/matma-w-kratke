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
const DAY = E.DAY; let T = Date.UTC(2026, 10, 2, 15);

console.log('1) Uczeń, który wszystko umie: dochodzi do poziomu 4, a 5 dopiero po powtórkach w czasie');
{
  const S = E.newState(T); ['fr_add_same', 'fr_common', 'fr_expand', 'nww'].forEach(id => { const s = E.sk(S, id); s.n = 5; s.lvl = 4; s.l4At = T; s.next = T + 99 * DAY; s.hist = [1, 2, 3, 3, 2].map(d => ({ t: T, d, ok: true, h: 0, ty: 'input' })); s.maxLvl = 4; });
  let r = runSession(S, { mode: 'learn', skill: 'fr_add_diff' }, correct, T);
  const L1 = S.skills.fr_add_diff.lvl;
  const s = S.skills.fr_add_diff; let ns = 1;
  while (s.lvl < 4 && ns++ < 8) r = runSession(S, { mode: 'learn', skill: 'fr_add_diff' }, correct, r.now);
  ok(L1 < 4, 'jedna seria 5 zadań nie wystarcza do opanowania (poziom ' + L1 + ')');
  ok(s.lvl === 4 && s.mastery && s.mastery.auto, 'opanowanie bez osobnego testu po temacie – po ' + ns + ' seriach poziom 4');
  ok(E.recommend(S, r.now).kind !== 'mastery', 'system nie proponuje testu po pojedynczym temacie (' + E.recommend(S, r.now).kind + ')');
  ok(s.lvl < 5, 'jedna seria poprawnych odpowiedzi NIE daje poziomu 5');
  ok(E.topicStatus(S, MP.TOPICS.duz_dod, r.now).key !== 'done', 'temat nie jest „opanowany" bez powtórek');
  // powtórka po 1 dniu
  let t2 = s.next + 3600000; ok(E.recommend(S, t2).kind === 'review', 'po dobie system proponuje powtórkę');
  r = runSession(S, { mode: 'review', skills: ['fr_add_diff'] }, correct, t2);
  ok(s.stage >= 1 && s.lvl === 4, 'po 1. powtórce etap ' + s.stage + ', poziom ' + s.lvl);
  let t3 = s.next + 3600000; r = runSession(S, { mode: 'review', skills: ['fr_add_diff'] }, correct, t3);
  ok(s.lvl === 5, 'po 2. powtórce (≥3 dni później) poziom 5: ' + s.lvl);
  ok(s.next - r.now > 5 * DAY, 'kolejna powtórka zaplanowana za ' + Math.round((s.next - r.now) / DAY) + ' dni');
  T = r.now;
}

console.log('2) Uczeń dodaje liczniki i mianowniki: system wykrywa błąd, tłumaczy inaczej i cofa się do wspólnego mianownika');
{
  const S = E.newState(T); ['fr_add_same', 'fr_expand', 'nww'].forEach(id => { const s = E.sk(S, id); s.n = 5; s.lvl = 3; s.hist = [1, 1, 2, 2, 1].map(d => ({ t: T, d, ok: true, h: 0, ty: 'input' })); });
  const st = E.sk(S, 'fr_common'); st.n = 3; st.lvl = 2; st.hist = [{ t: T, d: 1, ok: true, h: 1, ty: 'input' }];
  const log = [];
  const student = (it, sp) => { if (sp.skill === 'fr_add_diff') { const m = misAnswer(it, 'frac_add_both'); if (m !== null) return m; return 'zła'; } return correct(it); };
  const r = runSession(S, { mode: 'learn', skill: 'fr_add_diff' }, student, T, log);
  const firstRemed = r.cards.findIndex(c => c.startsWith('remed'));
  ok(firstRemed >= 0, 'pojawia się karta wyjaśnienia (remediacja): ' + r.cards.join(', '));
  ok(r.cards.some(c => c.includes('→fr_common')), 'wskazana umiejętność do powtórki: wspólny mianownik');
  ok(log.some(l => l.detour && l.skill === 'fr_common'), 'uczeń dostaje zadania z wspólnego mianownika (objazd)');
  const idxDet = log.findIndex(l => l.detour), after = log.slice(idxDet).filter(l => !l.detour && l.skill === 'fr_add_diff');
  ok(after.length && after[0].d === 1, 'po objeździe wraca do łatwiejszych zadań (poziom trudności ' + (after[0] && after[0].d) + ')');
  ok(r.cards.some(c => c.startsWith('back')), 'karta „wracamy do tematu" po powtórce podstaw');
  const codes = S.skills.fr_add_diff.errs; ok((codes.frac_add_both || 0) >= 2, 'błąd zapisany w profilu: frac_add_both × ' + codes.frac_add_both);
  const an = E.analysis(S, r.now); ok(an.topErrors[0] && an.topErrors[0].code === 'frac_add_both', 'panel rodzica pokazuje najczęstszy błąd: ' + (an.topErrors[0] && an.topErrors[0].info.title));
  ok(S.skills.fr_add_diff.lvl <= 1, 'poziom umiejętności niski (1): ' + S.skills.fr_add_diff.lvl);
  // nie podaje w kółko tego samego: liczba zadań z tej samej umiejętności przed remediacją
  const before = log.slice(0, log.findIndex(l => l.detour)).filter(l => l.skill === 'fr_add_diff' && !l.ok).length;
  ok(before <= 3, 'remediacja po ' + before + ' błędnych odpowiedziach (nie dopiero po wielu)');
}

console.log('3) Zapominanie: błędy w opanowanym temacie → „wymaga powtórki" i ponowne ćwiczenia');
{
  const S = E.newState(T); const s = E.sk(S, 'dec_mul');
  s.n = 12; s.hist = Array.from({ length: 12 }, (_, i) => ({ t: T, d: 1 + (i % 3), ok: true, h: 0, ty: i % 2 ? 'input' : 'choice' })); s.mastery = { at: T, aspects: ['proc'] }; E.updateLevel(s, T); ok(s.lvl === 4, 'stan wyjściowy: poziom 4');
  ['dec_shift', 'tabl'].forEach(id => { const q = E.sk(S, id); q.lvl = 4; q.n = 5; q.l4At = T; q.next = T + 50 * DAY; });
  const bad = (it) => { const m = misAnswer(it, 'dec_mul_places'); return m !== null ? m : '0'; };
  let t = T + 2 * DAY;
  const r = runSession(S, { mode: 'learn', skill: 'dec_mul', max: 4 }, bad, t);
  ok(s.needsReview, 'umiejętność oznaczona jako wymagająca powtórki');
  ok(E.topicStatus(S, MP.TOPICS.dud_mn, r.now).key === 'review', 'status tematu: ' + E.topicStatus(S, MP.TOPICS.dud_mn, r.now).label);
  const rec = E.recommend(S, r.now); ok((rec.kind === 'review' && rec.skills.includes('dec_mul')) || (rec.kind === 'repair' && rec.skill === 'dec_mul'), 'rekomendacja: ' + rec.label);
  const r2 = runSession(S, { mode: 'learn', skill: 'dec_mul' }, correct, r.now + 3600000);
  ok(!s.needsReview, 'po udanych ćwiczeniach flaga zdjęta');
}

console.log('4) Nie zakładamy wiedzy z wcześniejszych tematów: sprawdzenie i krótka powtórka');
{
  const S = E.newState(T); const log = [];
  const student = (it, sp) => sp.skill === 'nww' ? (misAnswer(it, 'nww_product') ?? misAnswer(it, 'lcd_sum') ?? '1') : correct(it);
  const r = runSession(S, { mode: 'learn', skill: 'fr_common' }, student, T, log);
  ok(r.cards[0] === 'intro:fr_common', 'nowa umiejętność zaczyna się od wprowadzenia');
  ok(r.cards.some(c => c.startsWith('probe')), 'sprawdzenie prerekwizytów: ' + r.cards.filter(c => c.startsWith('probe')).join(','));
  ok(log.some(l => l.probe === 'nww' && !l.ok), 'uczeń nie zna NWW (sondowanie)');
  ok(log.some(l => l.detour && l.skill === 'nww'), 'system proponuje krótką powtórkę NWW przed tematem');
}

console.log('5) Dobór trudności: rośnie po sukcesach, maleje po błędzie; różne typy zadań');
{
  const S = E.newState(T); ['fr_part', 'tabl'].forEach(id => { const q = E.sk(S, id); q.lvl = 4; q.n = 5; q.l4At = T; q.next = T + 50 * DAY; });
  const log = []; let k = 0;
  const student = (it, sp) => (k++ === 5) ? 'zła' : correct(it);
  runSession(S, { mode: 'learn', skill: 'fr_expand', max: 12 }, student, T, log);
  const ds = log.filter(l => l.skill === 'fr_expand').map(l => l.d);
  ok(Math.max(...ds) === 3, 'trudność dochodzi do 3: ' + ds.join(''));
  const iErr = log.findIndex((l, i) => !l.ok); ok(iErr >= 0 && log[iErr + 1] && log[iErr + 1].d <= log[iErr].d, 'po błędzie trudność nie rośnie');
  const types = new Set(log.map(l => l.type)); ok(types.size >= 2, 'typy zadań: ' + [...types].join(', '));
  let rep = 0; for (let i = 1; i < log.length; i++) if (log[i].type === log[i - 1].type && log[i].skill === log[i - 1].skill) rep++;
  ok(rep <= Math.floor(log.length / 2), 'typ zadania rzadko powtarza się pod rząd (' + rep + '/' + log.length + ')');
}

console.log('6) Sprawdzian: diagnoza → plan → próbny sprawdzian z punktacją');
{
  const S = E.newState(T);
  const fixed = E.prepCreate(S, ['duz_dod', 'uz_wsp'], T);
  ok(fixed.length >= 4, 'test diagnostyczny: ' + fixed.length + ' zadań');
  const results = fixed.map(sp => { const it = E.buildItem(sp); const resp = sp.skill === 'fr_add_diff' ? (misAnswer(it, 'frac_add_both') ?? 'x') : correct(it); const res = I.check(it, resp); return { skill: sp.skill, ok: res.ok, code: res.code }; });
  const plan = E.prepMakePlan(S, results);
  ok(plan[0].status === 'todo' && plan.some(p => p.skill === 'fr_add_diff' && p.status === 'todo'), 'plan zaczyna od słabych umiejętności: ' + plan.map(p => p.skill + ':' + p.status).join(', '));
  const ex = E.examSpecs(S).map(E.buildItem);
  ok(ex.length >= 8 && new Set(ex.map(i => i.d)).size >= 2, 'próbny sprawdzian: ' + ex.length + ' zadań, różne poziomy');
  const full = E.scoreExam(ex, ex.map(correct)); ok(full.pct === 100, 'wszystko dobrze → 100% (' + full.pts + '/' + full.max + ')');
  const half = E.scoreExam(ex, ex.map((it, i) => i % 2 ? correct(it) : '')); ok(half.pct > 0 && half.pct < 100, 'część dobrze → ' + half.pct + '% – ' + E.gradeFor(half.pct));
  const part = ex.findIndex(it => it.answer.kind === 'num' && it.answer.form === 'simplest' && it.answer.value.d > 1);
  if (part >= 0) { const a = ex.map(correct); const v = ex[part].answer.value; a[part] = (v.n * 2) + '/' + (v.d * 2); const sc = E.scoreExam(ex, a); ok(sc.detail[part].got === sc.detail[part].max / 2, 'nieskrócony wynik = połowa punktów'); }
}

console.log('7) Odznaki i seria dni bez kar');
{
  const S = E.newState(T); let t = T;
  for (let d = 0; d < 3; d++) { runSession(S, { mode: 'learn', skill: 'tabl', max: 3 }, correct, t); t += DAY; }
  const st = E.streak(S, t); ok(st.current === 3 && st.best === 3, 'seria 3 dni: ' + JSON.stringify(st));
  const b = E.checkBadges(S, t); ok(b.some(x => x.id === 'seria3') && b.some(x => x.id === 'start'), 'odznaki: ' + b.map(x => x.name).join(', '));
  const st2 = E.streak(S, t + 3 * DAY); ok(st2.current === 0 && st2.best === 3, 'po przerwie najlepsza seria zostaje zapamiętana (bez kary)');
}

console.log('8) Odporność: wznowienie przerwanej lekcji z ziarna zadania');
{
  const S = E.newState(T); E.startSession(S, { mode: 'learn', skill: 'tabl' }, T);
  let st; do { st = E.nextStep(S, T); } while (st && st.kind === 'card');
  const it1 = E.buildItem(st); const json = JSON.parse(JSON.stringify(S)); const it2 = E.buildItem(st);
  ok(U.plain(it1.prompt) === U.plain(it2.prompt) && json.session && json.session.skill === 'tabl', 'zadanie odtwarza się identycznie po zapisie stanu');
}
console.log('9) Klasy 2, 5 i 6: osobne mapy materiału');
{
  for (const g of [2, 5, 6]) {
    MP.setGrade(g); const S = E.newState(T); const rec = E.recommend(S, T);
    const ready = MP.SKILL_ORDER.filter(MP.isReady);
    ok(rec.kind === 'learn' && MP.SKILL_ORDER.includes(rec.skill), 'klasa ' + g + ': start od „' + MP.SK[rec.skill].name + '", umiejętności z ćwiczeniami: ' + ready.length + '/' + MP.SKILL_ORDER.length);
    ok(E.placementSpecs().every(sp => MP.SKILL_ORDER.includes(sp.skill)), 'klasa ' + g + ': test na start tylko z materiału tej klasy (' + E.placementSpecs().length + ' zadań)');
    const tops = Object.values(MP.TOPICS); ok(tops.every(t => MP.DZIALY.some(d => d.id === t.dzial)), 'klasa ' + g + ': każdy temat ma dział');
  }
  MP.setGrade(5); ok(!MP.SKILL_ORDER.includes('eq_solve') && !MP.SKILL_ORDER.includes('pct_of') && MP.SKILL_ORDER.includes('nat_pis'), 'klasa 5 bez równań i procentu liczby, z działaniami pisemnymi');
  MP.setGrade(2); ok(MP.SKILL_ORDER.every(id => id.startsWith('k2_')), 'klasa 2 ma tylko materiał edukacji wczesnoszkolnej');
  const S2 = E.newState(T); const r = runSession(S2, { mode: 'learn', skill: 'k2_sub', max: 12 }, (it, sp) => sp.skill === 'k2_sub' ? (misAnswer(it, 'k2_borrow') ?? correct(it)) : correct(it), T);
  ok(r.cards.some(c => c.startsWith('remed')), 'klasa 2: powtarzający się błąd przy odejmowaniu wywołuje inne wyjaśnienie: ' + r.cards.join(', '));
  MP.setGrade(6);
}

console.log('10) Scenariusz 3/4 + 1/2: blokada, ścieżka naprawcza, test opanowania (mastery gate)');
{
  let t = T; const S = E.newState(t); MP.setGrade(6);
  const gate0 = E.gateBlockers(S, 'fr_add_diff'); ok(gate0.length > 0, 'bez opanowanych podstaw temat jest zablokowany: ' + gate0.join(', '));
  ok(E.recommend(S, t).skill !== 'fr_add_diff', 'rekomendacja nie proponuje zablokowanego tematu');
  // uczeń zalicza testy opanowania podstaw
  for (const id of ['fr_expand', 'nww', 'fr_common', 'fr_add_same']) { const r = runSession(S, { mode: 'mastery', skill: id }, correct, t); t = r.now; ok(r.sum.test.pass && r.sum.test.n >= 5, 'test opanowania „' + MP.SK[id].name + '" zaliczony (' + r.sum.test.n + ' zadań, aspekty: ' + Object.keys(r.sum.test.byA).join('/') + ')'); }
  ok(E.gateBlockers(S, 'fr_add_diff').length === 0, 'po opanowaniu podstaw temat się odblokowuje');
  const specs = E.masterySpecs(S, 'fr_add_diff');
  ok(specs.length >= 5 && new Set(specs.map(x => x.type)).size >= 2, 'test opanowania: ' + specs.length + ' zadań, typy: ' + [...new Set(specs.map(x => x.type))].join(', ') + ', aspekty: ' + [...new Set(specs.map(x => x.aspect))].join(', '));
  // uczeń dodaje liczniki i mianowniki
  const bad = (it, sp) => sp.skill === 'fr_add_diff' ? (misAnswer(it, 'frac_add_both') ?? 'zła') : correct(it);
  let r = runSession(S, { mode: 'learn', skill: 'fr_add_diff' }, bad, t); t = r.now;
  const st = S.skills.fr_add_diff;
  ok(st.stuck === 'frac_add_both', 'zdiagnozowany problem: ' + MP.err(st.stuck || 'unknown').title);
  ok(E.gateBlockers(S, 'fr_add_mixed').includes('fr_add_diff'), 'zależny temat (liczby mieszane) zablokowany');
  ok(!E.gateBlockers(S, 'dec_conv').includes('fr_add_diff') && !E.gateBlockers(S, 'tabl').length, 'niezależne tematy nie są blokowane przez ten problem');
  ok(E.recommend(S, t).kind === 'repair', 'rekomendacja: ' + E.recommend(S, t).label);
  // ścieżka naprawcza – uczeń zaczyna rozumieć
  r = runSession(S, { mode: 'repair', skill: 'fr_add_diff' }, correct, t); t = r.now;
  ok(r.cards.some(c => c.startsWith('repair')), 'ścieżka naprawcza zaczyna się od innego wyjaśnienia: ' + r.cards.join(','));
  const ds = r.sum.results.filter(x => !x.detour).map(x => x.d); ok(ds[0] === 1 && ds[ds.length - 1] === 3, 'trudność rośnie stopniowo: ' + ds.join('→'));
  ok(!st.stuck && E.recommend(S, t).kind !== 'repair' && E.recommend(S, t).kind !== 'mastery', 'po udanej ścieżce naprawczej blokada zdjęta bez osobnego testu: ' + E.recommend(S, t).label);
  // test z jednym błędem rachunkowym – niezaliczony, ale bez cofania do pełnego wyjaśnienia
  const firstIds = new Set(); let k = 0;
  let erred = false; const oneCalc = (it, sp) => { firstIds.add(sp.seed); k++; if (!erred && it.answer.kind === 'num') { erred = true; const v = it.answer.value; return String(v.n + 1) + (v.d > 1 ? '/' + v.d : ''); } return correct(it); };
  r = runSession(S, { mode: 'mastery', skill: 'fr_add_diff' }, oneCalc, t); t = r.now;
  ok(!r.sum.test.pass && st.stuck, 'jeden błąd = test niezaliczony (100% wymagane); powód: ' + (r.sum.test.codes.join(',') || r.sum.test.aspects.join(',')));
  E.startSession(S, { mode: 'repair', skill: 'fr_add_diff' }, t); const rk = S.session.repair.kind; E.endSession(S, t);
  ok(rk === 'calc' || rk === 'aspect' || rk === 'concept', 'rodzaj ścieżki dobrany do błędu: ' + rk);
  r = runSession(S, { mode: 'repair', skill: 'fr_add_diff' }, correct, t); t = r.now;
  const second = E.masterySpecs(S, 'fr_add_diff'); ok(second.every(x => !firstIds.has(x.seed)), 'kolejny test ma nowe warianty zadań');
  r = runSession(S, { mode: 'mastery', skill: 'fr_add_diff' }, correct, t); t = r.now;
  ok(r.sum.test.pass && !st.stuck && st.lvl === 4, 'test zaliczony → blokada zdjęta, poziom ' + st.lvl);
  ok(!E.gateBlockers(S, 'fr_add_mixed').includes('fr_add_diff'), 'zależny temat nie jest już blokowany przez dodawanie ułamków');
  ok(st.next && st.next > t, 'zaplanowana powtórka za ' + Math.round((st.next - t) / DAY) + ' dzień');
  // nierozpoznany błąd → zadanie diagnostyczne
  const S2 = E.newState(t); ['fr_add_same', 'fr_common'].forEach(id => { E.sk(S2, id).mastery = { at: t, aspects: [] }; });
  // uczeń odpowiada „dziwnie” tylko w zadaniach liczbowych (inne typy zadań losują się w sesji), więc dajemy mu do 3 lekcji
  const TY = MP.SK.fr_add_diff.types; MP.SK.fr_add_diff.types = { 1: ['input'], 2: ['input'], 3: ['input'] }; // tylko zadania z wpisywaniem wyniku
  let r3 = null; for (let i = 0; i < 1 && !(r3 && r3.cards.some(c => c.startsWith('diag'))); i++) { r3 = runSession(S2, { mode: 'learn', skill: 'fr_add_diff' }, (it) => it.answer.kind === 'num' ? '977/13' : correct(it), t); t = r3.now; }
  MP.SK.fr_add_diff.types = TY;
  ok(r3.cards.some(c => c.startsWith('diag')), 'nierozpoznany błąd → zadanie diagnostyczne zamiast zgadywania');
}

console.log('11) Tempo pracy: czas odpowiedzi vs czas orientacyjny');
{
  const T0 = Date.UTC(2026, 10, 10, 15); const S = E.newState(T0); S.profile = { grade: 6 }; MP.setGrade && MP.setGrade(6);
  ok(E.expectedSec('input', 2, 6) === 45 && E.expectedSec('choice', 1, 6) < E.expectedSec('choice', 3, 6) && E.expectedSec('input', 2, 1) > E.expectedSec('input', 2, 6), 'czas orientacyjny zależy od formy, trudności i klasy');
  for (let i = 0; i < 8; i++) S.log.push({ t: T0 + i * 1000, s: 'fr_add_diff', d: 2, ty: 'input', ok: true, a: 1, sec: 120, m: 'learn' }); // dobrze, ale 120 s zamiast ok. 45 s
  for (let i = 0; i < 8; i++) S.log.push({ t: T0 + i * 1000, s: 'tabl', d: 2, ty: 'input', ok: true, a: 1, sec: 40, m: 'learn' });
  S.log.push({ t: T0, s: 'tabl', d: 2, ty: 'input', ok: true, a: 1, sec: 3000, m: 'learn' }); // przerwa – pomijana
  S.log.push({ t: T0, s: 'tabl', d: 2, ty: 'input', ok: true, a: 2, sec: 400, m: 'learn' }); // druga próba – pomijana
  const P = E.pace(S, T0 + 5000, 30);
  ok(P.skills.fr_add_diff.slow && P.skills.fr_add_diff.ok === 100 && P.skills.fr_add_diff.med === 120, 'dodawanie ułamków: 100% dobrze, ale wolniej (mediana 120 s vs ' + P.skills.fr_add_diff.exp + ' s)');
  ok(!P.skills.tabl.slow && P.skills.tabl.n === 8, 'tabliczka w normie; przerwa > 10 min i druga próba pominięte (n=' + P.skills.tabl.n + ')');
  ok(P.dzialy.length >= 1 && P.dzialy.some(d => d.slow), 'grupowanie po działach: ' + P.dzialy.map(d => d.name + ' ×' + d.ratio).join('; '));
  const old = E.pace(S, T0 + 40 * E.DAY, 30); ok(!old.all, 'liczą się tylko ostatnie 30 dni');
}
console.log(fails ? '\nNIEUDANE: ' + fails : '\nWszystkie testy silnika przeszły.');
process.exit(fails ? 1 : 0);
