/* engine.js — model ucznia, poziomy opanowania (mastery 0–5), powtórki rozłożone w czasie,
   adaptacyjny dobór zadań, remediacja (cofanie do podstaw), tryb sprawdzianu, odznaki.
   Czas jest wstrzykiwany (now) – dzięki temu logikę można testować symulacjami. */
var MP = (typeof window !== 'undefined' ? window : globalThis).MP;
(function (MP) {
  'use strict';
  const DAY = 86400000;
  const INTERVALS = [1, 3, 7, 14, 30, 60]; // dni między powtórkami
  const LEVELS = ['Jeszcze nie sprawdzono', 'Uczymy się od podstaw', 'Zaczynam rozumieć', 'Rozwiązuję proste zadania', 'Radzę sobie z różnymi zadaniami', 'Pewnie i samodzielnie'];
  const HIST_CAP = 30, LOG_CAP = 700;
  const ready = (id) => MP.isReady(id);

  // ---------- stan ----------
  function newState(now) {
    return { v: 1, created: now, updated: now, settings: { pin: null, showGrade: true, sessionLen: 10 }, skills: {}, days: {}, badges: {}, log: [], writeups: [], session: null, prep: null, exams: [], stats: { items: 0, ok: 0, hintsUsed: 0, afterHint: 0, errFound: 0, remed: 0, noHintRun: 0 }, placement: null };
  }
  function sk(state, id) {
    if (state.skills[id] && !state.skills[id].id) state.skills[id].id = id;
    return state.skills[id] || (state.skills[id] = { id, n: 0, ok: 0, hist: [], lvl: 0, l4At: null, stage: 0, next: null, rev: [], needsReview: false, errs: {}, lastT: null, maxLvl: 0 });
  }
  const dayKey = (t) => { const d = new Date(t); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };

  // ---------- poziom opanowania ----------
  function rawLevel(s) {
    if (!s.n) return 0;
    const h = s.hist, recent = h.slice(-8);
    const okR = recent.filter(x => x.ok).length / Math.max(1, recent.length);
    // odpowiedź z wyboru (ABCD) waży połowę – można ją zgadnąć; wpisana albo zrobiona samodzielnie waży całość
    const GUESS = ['choice', 'why'];
    const w = (x) => GUESS.includes(x.ty) ? 0.5 : 1;
    const indep = (minD) => h.filter(x => x.ok && x.h === 0 && x.d >= minD).reduce((a, x) => a + w(x), 0);
    const anyOk = h.some(x => x.ok);
    if (!anyOk || (recent.length >= 3 && okR < 0.4)) return 1;
    const last6 = h.slice(-6), acc6 = last6.filter(x => x.ok).length / last6.length;
    if (!(indep(1) >= 3 && acc6 >= 0.6)) return 2;
    const types = new Set(h.filter(x => x.ok && x.h === 0).map(x => x.ty));
    const last5 = h.slice(-5), acc5 = last5.filter(x => x.ok).length / last5.length;
    if (!(indep(2) >= 3 && indep(3) >= 2 && types.size >= 2 && acc5 >= 0.8)) return 3;
    // do opanowania potrzebne są co najmniej 2 samodzielne odpowiedzi otwarte (jeśli umiejętność ma takie zadania)
    const sk0 = s.id && MP.SK[s.id]; const hasOpen = !sk0 || [1, 2, 3].some(d => (sk0.types[d] || []).some(t => !GUESS.includes(t)));
    if (hasOpen && h.filter(x => x.ok && x.h === 0 && x.d >= 2 && !GUESS.includes(x.ty)).length < 2) return 3;
    // tempo: dobre, ale wyraźnie wolne odpowiedzi (≥ 1,5 × orientacyjny czas) = jeszcze kilka zadań
    const timed = h.filter(x => x.ok && x.h === 0 && x.s > 0).slice(-5);
    if (timed.length >= 3) { const r = timed.map(x => x.s / expectedSec(x.ty, x.d, MP.grade)).sort((a, b) => a - b); if (r[Math.floor(r.length / 2)] >= 1.5) return 3; }
    return 4;
  }
  function updateLevel(s, now) {
    if (s.l4At && !s.mastery) s.mastery = { at: s.l4At, legacy: true, aspects: [] }; // postępy sprzed testów opanowania
    let L = rawLevel(s);
    // regresja: błędy w wcześniej opanowanej umiejętności
    const last4 = s.hist.slice(-4);
    if (s.l4At && last4.length >= 3 && last4.filter(x => !x.ok).length >= 2 && !s.needsReview) { s.needsReview = true; s.stage = Math.max(0, s.stage - 1); }
    if (s.needsReview) {
      const tail = s.hist.slice(-3);
      if (tail.length === 3 && tail.every(x => x.ok && x.h === 0 && x.d >= 2)) { s.needsReview = false; s.next = now + INTERVALS[s.stage] * DAY; }
    }
    if (L >= 4 && !s.mastery) { s.mastery = { at: now, auto: true, aspects: [] }; s.testReady = false; }
    if (L >= 4 && !s.l4At) { s.l4At = now; s.stage = 0; s.next = now + INTERVALS[0] * DAY; }
    if (s.l4At && !s.needsReview) L = Math.max(L, 4);
    if (s.l4At && !s.needsReview && s.stage >= 2) L = 5;
    if (s.needsReview) L = Math.min(L, 3);
    s.lvl = L; s.maxLvl = Math.max(s.maxLvl || 0, L);
    if (L === 5 && !s.masteredAt) s.masteredAt = now;
    return L;
  }
  const isDue = (s, now) => !!(s && s.l4At && s.next && now >= s.next);

  // ---------- aspekty rozumienia (A pojęcie, B reprezentacja wizualna, C obliczenia, D zastosowanie/transfer) ----------
  const ASPECTS = ['concept', 'visual', 'proc', 'transfer'];
  const ASPECT_NAMES = { concept: 'Rozumienie pojęcia', visual: 'Reprezentacja wizualna', proc: 'Samodzielne obliczenia', transfer: 'Zastosowanie w nowym kontekście' };
  const VISUAL_TYPES = ['shade', 'nline', 'cutbars', 'point', 'rect', 'cells', 'bins'];
  function aspectOf(it) {
    if (!it) return 'proc';
    if (it.aspect) return it.aspect;
    if (it.type === 'why' || it.type === 'error') return 'concept';
    if (VISUAL_TYPES.includes(it.type)) return 'visual';
    const t = MP.util.plain(it.prompt || '').replace(/<[^>]+>/g, ' ');
    if (it.visual && !/^Oblicz/.test(t)) return 'visual';
    if (t.length > 75 && /\?/.test(t) && !/^(Oblicz|Uprość|Rozwiąż|Zapisz|Wstaw|Pomnóż|Opuść|Zamień|Wyłącz)/.test(t)) return 'transfer';
    return 'proc';
  }
  function aspStat(s, a) { s.asp = s.asp || {}; return s.asp[a] || (s.asp[a] = { n: 0, ok: 0, last: [] }); }
  // stan aspektu: 'ok' (zaliczony w teście opanowania lub 2 ostatnie samodzielnie dobrze), 'work', 'none'
  function aspectState(s, a) {
    if (!s || !s.asp || !s.asp[a] || !s.asp[a].n) return (s && s.mastery && s.mastery.aspects && s.mastery.aspects.includes(a)) ? 'ok' : 'none';
    const st = s.asp[a]; const L = st.last.slice(-3);
    if (L.length && !L[L.length - 1]) return 'work';
    if ((s.mastery && s.mastery.aspects && s.mastery.aspects.includes(a)) || (L.length >= 2 && L.slice(-2).every(Boolean))) return 'ok';
    return 'work';
  }
  // ---------- blokada (mastery gate) ----------
  const inGrade = (id) => (MP.SKILL_ORDER || []).includes(id);
  const masteryOk = (s) => !!(s && (s.mastery || s.placedOk || s.l4At) && !s.stuck);
  function gateBlockers(state, id) {
    const sk0 = MP.SK[id]; if (!sk0) return [];
    return (sk0.prereq || []).filter(p => ready(p) && inGrade(p) && p !== id && !masteryOk(state.skills[p]));
  }
  // wszystkie (pośrednie) wymagania, które blokują – idąc w dół do pierwszej nieopanowanej podstawy
  function gateRoot(state, id, seen) {
    seen = seen || {}; if (seen[id]) return null; seen[id] = 1;
    const b = gateBlockers(state, id); if (!b.length) return null;
    for (const p of b) { const deeper = gateRoot(state, p, seen); if (deeper) return deeper; }
    return b[0];
  }

  // ---------- zapis odpowiedzi ----------
  // meta: {skill, d, type, hints, attempt, sec, mode, solShown, probe}
  function record(state, meta, res, now) {
    const s = sk(state, meta.skill);
    const first = meta.attempt === 1;
    const ok = !!res.ok && first && !meta.solShown;
    const code = res.ok ? null : (res.code || 'unknown');
    if (code) s.errs[code] = (s.errs[code] || 0) + 1;
    const asp = meta.aspect || 'proc';
    state.log.push({ t: now, s: meta.skill, id: meta.id || null, r: meta.resp != null ? String(meta.resp).slice(0, 40) : null, d: meta.d, ty: meta.type, asp, ok: !!res.ok, a: meta.attempt, h: meta.hints, sec: meta.sec || 0, e: code, cat: code ? MP.err(code).cat : null, lvl: s.lvl, m: meta.mode });
    if (state.log.length > LOG_CAP) state.log.splice(0, state.log.length - LOG_CAP);
    const dk = dayKey(now); const day = state.days[dk] || (state.days[dk] = { sec: 0, n: 0, ok: 0 });
    day.sec += Math.min(meta.sec || 0, 180);
    let out = { ok, first, code, review: null, levelBefore: s.lvl, levelAfter: s.lvl, aspect: meta.aspect || null };
    if (!first) { return out; }
    day.n++; if (ok) day.ok++;
    state.stats.items++; if (ok) state.stats.ok++;
    if (meta.hints > 0) { state.stats.hintsUsed++; if (res.ok) state.stats.afterHint++; }
    if (ok && meta.hints === 0) state.stats.noHintRun++; else state.stats.noHintRun = 0;
    if (ok && meta.type === 'error') state.stats.errFound++;
    // powtórka rozłożona w czasie
    if (isDue(s, now) && meta.mode !== 'exam') {
      if (ok && meta.hints === 0 && meta.d >= 2) { s.stage = Math.min(s.stage + 1, INTERVALS.length - 1); s.rev.push(now); s.next = now + INTERVALS[s.stage] * DAY; out.review = 'passed'; }
      else if (!res.ok || meta.hints > 1) { s.stage = Math.max(0, s.stage - 1); s.next = now + DAY; s.needsReview = true; out.review = 'failed'; }
    }
    { const A = aspStat(s, asp); A.n++; if (ok) A.ok++; A.last.push(ok && !meta.hints); if (A.last.length > 6) A.last.shift(); }
    // błąd koncepcyjny w umiejętności już zaliczonej → obniżona pewność
    if (!res.ok && code && s.mastery && ['zasada', 'wczesniej'].includes(MP.err(code).cat) && meta.mode !== 'mastery') { s.mconf = Math.max(0, (s.mconf == null ? 3 : s.mconf) - 1); }
    s.n++; if (ok) s.ok++; s.lastT = now; if (['learn', 'prep', 'review', 'mixed'].includes(meta.mode)) s.lastLearnT = now;
    s.hist.push({ t: now, d: meta.d, ok, h: meta.hints, ty: meta.type, e: code, a: asp, s: Math.min(meta.sec || 0, 600) });
    if (s.hist.length > HIST_CAP) s.hist.splice(0, s.hist.length - HIST_CAP);
    updateLevel(s, now);
    out.levelAfter = s.lvl;
    if (s.errHeavy === undefined) s.errHeavy = 0;
    if (!ok) s.errHeavy++;
    state.updated = now;
    return out;
  }

  // ---------- status tematu ----------
  function topicStatus(state, topic, now) {
    const ids = topic.skills.filter(ready);
    if (!ids.length) return { key: 'soon', label: 'Ćwiczenia w przygotowaniu', pct: 0 };
    const S = ids.map(id => state.skills[id]);
    const pct = Math.round(ids.reduce((a, id) => a + ((state.skills[id] || {}).lvl || 0), 0) / (ids.length * 5) * 100);
    if (S.every(s => !s || !s.n)) return { key: 'new', label: 'Nie rozpoczęto', pct };
    if (S.some(s => s && (s.needsReview || isDue(s, now)))) return { key: 'review', label: 'Wymaga powtórki', pct };
    if (S.every(s => s && s.lvl === 5)) return { key: 'done', label: 'Opanowany', pct };
    if (S.every(s => s && s.lvl >= 4)) return { key: 'almost', label: 'Prawie opanowany – czeka na powtórkę', pct };
    return { key: 'progress', label: 'W trakcie nauki', pct };
  }
  function dzialStatus(state, dz, now) {
    const ts = dz.topics.map(t => topicStatus(state, t, now)).filter(s => s.key !== 'soon');
    if (!ts.length) return { pct: 0, ready: 0, total: dz.topics.length };
    return { pct: Math.round(ts.reduce((a, s) => a + s.pct, 0) / ts.length), done: ts.filter(s => s.key === 'done').length, ready: ts.length, total: dz.topics.length, review: ts.some(s => s.key === 'review') };
  }

  // ---------- test na koniec działu ----------
  const dzSkills = (dz) => dz.topics.flatMap(t => t.skills).filter((id, i, a) => ready(id) && a.indexOf(id) === i);
  const skillKnown = (s) => !!(s && (s.mastery || s.l4At || s.placedOk) && !s.stuck);
  function dzialTest(state, dz) {
    state.chTests = state.chTests || {};
    const ids = dzSkills(dz); const rec = state.chTests[dz.id] || null;
    // gotowy do testu dopiero, gdy każda umiejętność jest naprawdę przećwiczona (sam dobry wynik w teście na start nie wystarcza)
    const ready0 = ids.length > 0 && ids.every(id => { const s = state.skills[id]; return s && (s.mastery || s.l4At) && !s.stuck; });
    // dział zaliczony wcześniej testami opanowania każdej umiejętności – zaliczony bez nowego testu (postęp się nie gubi)
    if (!rec && ids.length && ids.every(id => { const s = state.skills[id]; return s && s.mastery && !s.mastery.auto && !s.mastery.legacy && !s.stuck; })) { state.chTests[dz.id] = { at: Date.now(), pass: true, legacy: true, pct: 100 }; }
    const r = state.chTests[dz.id] || null;
    return { ready: ready0, passed: !!(r && r.pass), last: r, n: ids.length };
  }
  function chtestSpecs(state, dzId) {
    const dz = (MP.DZIALY || []).find(d => d.id === dzId); if (!dz) return [];
    const ids = dzSkills(dz); const per = ids.length <= 4 ? 3 : ids.length <= 8 ? 2 : 1; const out = [];
    ids.forEach(id => { const S0 = MP.SK[id]; for (let i = 0; i < per; i++) { const d = i === 0 ? 2 : (S0.types[3] ? 3 : 2); const tys = (S0.types[d] || S0.types[2] || S0.types[1] || ['input']); const open = tys.filter(t => t !== 'choice'); const ty = open.length && (i === 0 || Math.random() < 0.7) ? open[Math.floor(Math.random() * open.length)] : tys[Math.floor(Math.random() * tys.length)]; out.push(makeSpec(id, d, ty, { chtest: dzId })); } });
    return out.slice(0, 14);
  }
  function chtestResult(state, dzId, results, now) {
    const res = results.filter(r => !r.probe && !r.detour); const ok = res.filter(r => r.ok).length; const pct = res.length ? Math.round(ok / res.length * 100) : 0;
    const pass = res.length > 0 && pct >= 80;
    const weak = [...new Set(res.filter(r => !r.ok).map(r => r.skill))];
    if (!pass) weak.forEach(id => { const s = sk(state, id); s.needsReview = true; s.next = now; });
    state.chTests = state.chTests || {}; const prev = state.chTests[dzId];
    state.chTests[dzId] = { at: now, pass: pass || !!(prev && prev.pass), pct, n: res.length, ok, weak, tries: ((prev && prev.tries) || 0) + 1 };
    return { pass, pct, ok, n: res.length, weak };
  }
  // ---------- migracja zapisanych postępów do nowego modelu (bez utraty danych) ----------
  function migrate(state) {
    if (!state || !state.skills) return state;
    state.settings = state.settings || {}; if (!state.settings.seriesLen) state.settings.seriesLen = 5;
    state.chTests = state.chTests || {};
    Object.keys(state.skills).forEach(id => { const s = state.skills[id]; if (!s) return; s.id = s.id || id;
      if (s.stuck && s.repairDone) { s.stuck = null; s.repairDone = false; } // ścieżka naprawcza już zrobiona – nie czekamy na osobny test
      if (s.testReady && !s.mastery) { s.mastery = { at: Date.now(), auto: true, aspects: [] }; s.testReady = false; } // „gotowe do testu” = opanowane
    });
    if (state.session && state.session.mode === 'mastery') state.session = null; // przerwany test pojedynczej umiejętności – już nie istnieje
    state.mv = 2; return state;
  }

  // ---------- rekomendacja kolejnego kroku ----------
  function prereqOk(state, id) { return (MP.SK[id].prereq || []).filter(ready).every(p => { const s = state.skills[p]; return s && (s.lvl >= 3 || s.placedOk); }); }
  function dueSkills(state, now) { return Object.keys(state.skills).filter(id => ready(id) && (isDue(state.skills[id], now) || state.skills[id].needsReview)).sort((a, b) => (state.skills[b].needsReview ? 1 : 0) - (state.skills[a].needsReview ? 1 : 0) || (state.skills[a].next || 0) - (state.skills[b].next || 0)); }
  const sessionStarted = (ss) => !!ss && (((ss.results || []).length > 0) || (ss.step || 0) > 0 || !!(ss.cur && ss.cur.attempts));
  function recommend(state, now) {
    // przerwana lekcja – tylko gdy uczeń naprawdę coś w niej zrobił (co najmniej jedna odpowiedź)
    if (state.session && !state.session.done && sessionStarted(state.session)) return { kind: 'resume', skill: state.session.skill, label: 'Dokończ przerwaną lekcję' };
    const inG = (MP.SKILL_ORDER || []).filter(ready);
    // ścieżka naprawcza ma pierwszeństwo – nie idziemy dalej z niezrozumianym tematem
    const stuck = inG.filter(id => state.skills[id] && state.skills[id].stuck);
    if (stuck.length) { const id = stuck[0]; return { kind: 'repair', skill: id, label: 'Ćwiczymy to inaczej' }; }
    const due = dueSkills(state, now);
    // dział przećwiczony – test na koniec działu (bez niego dział nie jest w pełni zaliczony)
    const chReady = (MP.DZIALY || []).find(dz => { const st = dzialTest(state, dz); return st.ready && !st.passed && !(st.last && now - st.last.at < DAY / 2 && !due.length); });
    if (chReady && !due.some(id => state.skills[id].needsReview)) return { kind: 'chtest', dz: chReady.id, skill: null, label: 'Test działu: ' + chReady.name };
    if (due.length) return { kind: 'review', skills: due.slice(0, 3), skill: due[0], label: due.some(id => state.skills[id].needsReview) ? 'Wróćmy na chwilę do tego, co sprawiało trudność' : 'Krótka powtórka – sprawdźmy, czy pamiętasz' };
    const order = MP.SKILL_ORDER.filter(ready);
    const prog = order.filter(id => { const s = state.skills[id]; return s && s.n > 0 && s.lvl < 4 && !s.placedOk && !gateBlockers(state, id).length; });
    if (prog.length) {
      const recentT = (id) => state.skills[id].lastLearnT || 0;
      prog.sort((a, b) => recentT(b) - recentT(a) || order.indexOf(a) - order.indexOf(b));
      const id = prog[0];
      return { kind: 'learn', skill: id, label: 'Ćwiczymy dalej' };
    }
    const nextNew = order.find(id => { const s = state.skills[id]; return (!s || !s.n) && !gateBlockers(state, id).length && !(s && s.placedOk); });
    if (nextNew) return { kind: 'learn', skill: nextNew, label: 'Nowa umiejętność', isNew: true };
    const weakest = order.filter(id => state.skills[id] && state.skills[id].lvl < 5 && !gateBlockers(state, id).length).sort((a, b) => state.skills[a].lvl - state.skills[b].lvl)[0];
    if (weakest) return { kind: 'learn', skill: weakest, label: 'Doszlifujmy' };
    return { kind: 'none', label: 'Wszystko opanowane – brawo!' };
  }

  // ---------- dobór zadania ----------
  const START_D = [1, 1, 1, 2, 2, 3];
  function chooseType(skill, d, session, lvl, R) {
    let list = (skill.types && skill.types[d]) || ['input'];
    const pool = list.slice();
    if (skill.why && lvl >= 2 && R() < 0.15) pool.push('why');
    let cands = pool.filter(t => t !== session.lastType);
    if (!cands.length) cands = pool;
    if (lvl <= 1 && cands.includes('choice') && R() < 0.5) return 'choice';
    if (session.mode === 'check' || session.mode === 'exam') { const strong = cands.filter(t => t !== 'choice'); if (strong.length && R() < 0.75) return strong[Math.floor(R() * strong.length)]; }
    return cands[Math.floor(R() * cands.length)];
  }
  function makeSpec(skillId, d, type, extra) {
    const ints = (MP.interests || []).filter(k => MP.THEMES && MP.THEMES[k]);
    const th = ints.length ? ints[Math.floor(Math.random() * ints.length)] : 'szkola';
    return Object.assign({ kind: 'item', skill: skillId, d, type, th, seed: Math.floor(Math.random() * 2 ** 31) }, extra || {});
  }
  // budowa zadania z ziarna (deterministycznie – można odtworzyć po przerwie)
  function buildItem(spec) {
    const skill = MP.SK[spec.skill];
    const r = MP.util.rng(spec.seed);
    MP.curTheme = (MP.THEMES && MP.THEMES[spec.th]) || (MP.THEMES && MP.THEMES.szkola); MP.themeUsed = false;
    let it = null;
    if (spec.type === 'why') it = MP.items.asWhy(r, skill);
    if (!it) {
      try { it = MP.items.build(r, skill, spec.d, spec.type); } catch (e) { it = null; }
      if (!it) { const r2 = MP.util.rng(spec.seed + 1); it = MP.items.build(r2, skill, spec.d, (skill.types[spec.d] || ['input'])[0]); }
    }
    it.skill = spec.skill; it.d = spec.d; if (!it.aspect) it.aspect = aspectOf(it);
    it.theme = MP.themeUsed && spec.th && spec.th !== 'szkola' ? spec.th : null;
    return it;
  }

  // ---------- sesje ----------
  function startSession(state, opts, now) {
    const R = Math.random;
    const mode = opts.mode || 'learn';
    const s = { id: now.toString(36), mode, skill: opts.skill || null, skills: opts.skills || (opts.skill ? [opts.skill] : []), step: 0, max: opts.max || (['learn', 'prep'].includes(mode) ? (state.settings.seriesLen || 5) : (state.settings.sessionLen || 10)), queue: [], detour: null, d: 1, streak: 0, lastType: null, results: [], startedAt: now, startLevels: {}, cur: null, remedDone: {}, probes: {}, hintsAllowed: mode !== 'check' && mode !== 'exam' && mode !== 'diag', done: false, prepId: opts.prepId || null, title: opts.title || '' };
    s.skills.forEach(id => { s.startLevels[id] = sk(state, id).lvl; });
    if (s.skill) { const L = sk(state, s.skill).lvl; s.d = START_D[L]; if (sk(state, s.skill).needsReview) s.d = Math.max(1, s.d - 1); }
    if (mode === 'learn' || mode === 'prep') {
      const main = MP.SK[s.skill];
      if (!state.skills[s.skill] || !state.skills[s.skill].n) s.queue.push({ kind: 'card', card: 'intro', skill: s.skill });
      // sprawdzenie wiedzy z wcześniejszych tematów
      const pre = (main.prereq || []).filter(ready).filter(p => { const ps = state.skills[p]; return !ps || !ps.n || ps.needsReview || (ps.lvl <= 1); }).slice(0, 2);
      if (pre.length) {
        s.queue.push({ kind: 'card', card: 'probe', skills: pre });
        pre.forEach(p => { s.queue.push(makeSpec(p, 1, (MP.SK[p].types[1] || ['input'])[0], { probe: p })); s.queue.push(makeSpec(p, 2, (MP.SK[p].types[2] || ['input'])[0], { probe: p })); });
      }
    }
    if (mode === 'mastery') { s.fixed = masterySpecs(state, s.skill); s.max = s.fixed.length; s.hintsAllowed = false; s.queue = [{ kind: 'card', card: 'mtest', skill: s.skill, n: s.fixed.length, aspects: s.fixed.map(x => x.aspect).filter((v, i, a) => a.indexOf(v) === i) }]; }
    if (mode === 'repair') {
      const st = sk(state, s.skill); st.repairRound = (st.repairRound || 0) + 1;
      const fail = st.lastTest && !st.lastTest.pass ? st.lastTest : null;
      const code = st.stuck && st.stuck.indexOf('_') !== 0 ? st.stuck : (fail && fail.codes && fail.codes[0]) || null;
      const kind = code ? (MP.err(code).cat === 'rachunek' ? 'calc' : MP.err(code).cat === 'polecenie' ? 'read' : 'concept') : (fail && fail.aspects && fail.aspects.length ? 'aspect' : 'concept');
      s.repair = { round: st.repairRound, code, kind, target: fail && fail.aspects ? fail.aspects[0] : null };
      s.queue.push({ kind: 'card', card: 'repair', skill: s.skill, code, round: st.repairRound, rkind: kind, target: s.repair.target });
      const E0 = code ? MP.err(code) : null;
      if (kind === 'concept' && st.repairRound >= 2 && E0 && E0.remedy && E0.remedy !== s.skill && ready(E0.remedy) && sk(state, E0.remedy).lvl < 4) s.detour = { skill: E0.remedy, left: 3, reason: code };
      s.plan = kind === 'calc' ? [2, 2, 2, 3, 3] : kind === 'read' ? [1, 2, 2, 3] : [1, 1, 2, 2, 3];
      s.max = s.plan.length; s.d = 1;
    }
    if (mode === 'check') { s.max = opts.max || 6; }
    if (mode === 'review') { s.max = Math.min(8, s.skills.length * 3); }
    if (mode === 'diag' || mode === 'exam' || mode === 'placement' || mode === 'chtest') {
      s.fixed = opts.fixed; s.max = opts.fixed.length; s.hintsAllowed = false;
    }
    state.session = s;
    return s;
  }

  // bez powtórek w jednej lekcji: to samo zadanie (treść + odpowiedź) nie może pojawić się drugi raz
  function itemKey(spec) { try { const it = buildItem(spec); return (MP.util.plain(it.prompt || '') + '|' + JSON.stringify(it.answer || '') + '|' + (it.visual ? it.visual.length : 0)).slice(0, 300); } catch (e) { return null; } }
  function dedupe(s, spec) {
    if (!s || s.fixed || !spec || spec.kind !== 'item') return spec;
    s.seen = s.seen || [];
    let k = itemKey(spec), g = 0;
    while (k && s.seen.includes(k) && g++ < 12) { spec.seed = Math.floor(Math.random() * 2 ** 31); k = itemKey(spec); }
    if (k) { s.seen.push(k); if (s.seen.length > 60) s.seen.shift(); }
    return spec;
  }
  function nextStep(state, now) { const sp = nextStep0(state, now); return dedupe(state.session, sp); }
  function nextStep0(state, now) {
    const s = state.session; if (!s || s.done) return null;
    if (s.queue.length) { const q = s.queue.shift(); if (q.kind === 'item') s.lastType = q.type; return q; }
    if (s.fixed) { if (s.step >= s.fixed.length) { s.done = true; return null; } return s.fixed[s.step]; }
    // objazd do podstaw (remediacja)
    if (s.detour && s.detour.left > 0) {
      const dt = s.detour; const L = sk(state, dt.skill).lvl; const skill = MP.SK[dt.skill];
      const d = dt.left > 2 ? 1 : Math.min(2, Math.max(1, START_D[L]));
      dt.left--;
      const spec = makeSpec(dt.skill, d, chooseType(skill, d, s, L, Math.random), { detour: true });
      s.lastType = spec.type; return spec;
    }
    if (s.detour && s.detour.left === 0) { const dt = s.detour; s.detour = null; s.d = 1; s.streak = 0; return { kind: 'card', card: 'back', skill: s.skill, from: dt.skill }; }
    const counted = s.results.filter(r => !r.detour && !r.probe && !r.analog).length; // zadania „analogiczne” (po błędzie) nie skracają lekcji
    if (counted >= s.max) { s.done = true; return null; }
    if (s.results.length > s.max + 24) { s.done = true; return null; }
    let skillId = s.skill, d = s.d;
    if (s.mode === 'repair') {
      d = s.plan[Math.min(counted, s.plan.length - 1)];
      const rp = s.repair || {}; const want = rp.kind === 'calc' ? 'proc' : rp.kind === 'read' ? 'transfer' : rp.target || (counted === 0 ? 'visual' : null);
      const spec = want ? findAspectSpec(state, s.skill, d, want, s) : null;
      const sp = spec || makeSpec(s.skill, d, chooseType(MP.SK[s.skill], d, s, sk(state, s.skill).lvl, Math.random));
      s.lastType = sp.type; return sp;
    }
    if (s.mode === 'check' || s.mode === 'review' || s.mode === 'mixed') {
      skillId = s.skills[counted % s.skills.length];
      const L = sk(state, skillId).lvl; d = s.mode === 'check' ? (counted % 3 === 0 ? 2 : 3) : (counted < s.skills.length ? 2 : 3);
      if (s.mode === 'review' && L <= 2) d = 1 + (counted >= s.skills.length ? 1 : 0);
    } else if ((s.mode === 'learn' || s.mode === 'prep') && counted > 0 && counted % 4 === 3) {
      // przeplatanie: krótka powtórka innej umiejętności, której termin minął
      const due = dueSkills(state, now).filter(id => id !== s.skill);
      if (due.length) { skillId = due[0]; d = 2; }
    }
    const skill = MP.SK[skillId];
    const spec = makeSpec(skillId, d, chooseType(skill, d, s, sk(state, skillId).lvl, Math.random), { interleave: skillId !== s.skill && s.mode === 'learn' });
    s.lastType = spec.type;
    return spec;
  }

  // Po błędnej odpowiedzi: analogiczne zadanie (ta sama umiejętność, typ i trudność, inne dane) jako następne
  function queueAnalog(state, spec) {
    const s = state.session; if (!s || s.fixed || spec.probe || spec.diag || ['check', 'placement', 'diag', 'mastery', 'chtest'].includes(s.mode)) return false;
    if (s.queue.some(q => q.analog)) return false;
    if (spec.analog && (spec.chain || 1) >= 2) return false; // po dwóch podobnych zadaniach idziemy dalej
    const a = makeSpec(spec.skill, spec.d, spec.type, { analog: true, chain: spec.analog ? (spec.chain || 1) + 1 : 1, detour: spec.detour || undefined, interleave: spec.interleave || undefined });
    s.queue.unshift(a); return true;
  }
  // Po odpowiedzi: aktualizacja trudności, wykrywanie powtarzających się błędów, plan remediacji
  function afterAnswer(state, spec, rec, now) {
    const s = state.session; if (!s) return { actions: [] };
    const actions = [];
    s.results.push({ skill: spec.skill, ok: rec.ok, code: rec.code, d: spec.d, detour: !!spec.detour, probe: spec.probe || null, analog: !!spec.analog, type: spec.type, aspect: rec.aspect || spec.aspect || null });
    if (s.fixed) { s.step++; return { actions }; }
    // sondowanie wcześniejszego tematu
    if (spec.probe) {
      if (!rec.ok && !s.probes[spec.probe]) {
        s.probes[spec.probe] = 'fail';
        // usuń drugie sondowanie tej samej umiejętności i zaplanuj objazd
        s.queue = s.queue.filter(q => q.probe !== spec.probe);
        s.queue.unshift({ kind: 'card', card: 'remed', skill: spec.probe, code: rec.code, reason: 'probe', parent: s.skill });
        s.detour = { skill: spec.probe, left: 4, reason: 'probe' };
        actions.push('detour');
      }
      return { actions };
    }
    if (spec.detour) return { actions };
    const main = spec.skill === s.skill;
    if (main) {
      if (rec.ok) { s.streak++; const L = sk(state, s.skill).lvl; const maxD = L <= 1 ? 2 : 3; if (s.streak >= 2 && s.d < maxD) { s.d++; s.streak = 0; actions.push('harder'); } }
      else { s.streak = 0; const cat = rec.code ? MP.err(rec.code).cat : null; if (s.d > 1 && cat !== 'rachunek') { s.d--; actions.push('easier'); } }
    }
    if (!rec.ok && rec.code && main) {
      const E = MP.err(rec.code);
      const ss = sk(state, spec.skill);
      const window = ss.hist.slice(-8);
      const same = window.filter(h => h.e === rec.code).length;
      const recentWrong = ss.hist.slice(-4).filter(h => !h.ok).length;
      const conceptual = E.cat === 'zasada' || E.cat === 'wczesniej' || E.cat === 'polecenie';
      const key = rec.code;
      if (conceptual && same >= 2 && !s.remedDone[key]) {
        s.remedDone[key] = true;
        // problem zidentyfikowany: umiejętność „zablokowana" do czasu zaliczenia testu opanowania
        ss.stuck = rec.code; ss.repairDone = false; ss.stuckAt = now;
        const remedy = E.remedy && E.remedy !== spec.skill && ready(E.remedy) ? E.remedy : null;
        s.queue.push({ kind: 'card', card: 'remed', skill: spec.skill, code: rec.code, remedy, reason: 'repeat' });
        if (remedy && sk(state, remedy).lvl < 4) s.detour = { skill: remedy, left: 4, reason: rec.code };
        s.d = 1; s.streak = 0;
        state.stats.remed++;
        actions.push('remed');
      } else if (recentWrong >= 3 && !s.remedDone['_struggle']) {
        s.remedDone['_struggle'] = true;
        const pre = (MP.SK[spec.skill].prereq || []).filter(ready).sort((a, b) => sk(state, a).lvl - sk(state, b).lvl)[0];
        s.queue.push({ kind: 'card', card: 'remed', skill: spec.skill, code: rec.code, remedy: pre && sk(state, pre).lvl < 3 ? pre : null, reason: 'struggle' });
        if (pre && sk(state, pre).lvl < 3) s.detour = { skill: pre, left: 4, reason: 'struggle' };
        s.d = 1; s.streak = 0; state.stats.remed++;
        actions.push('remed');
      }
    }
    // nierozpoznany błąd dwa razy z rzędu – zamiast zgadywać, krótkie zadanie diagnostyczne (wybór z błędnymi odpowiedziami o znanych przyczynach)
    if (!rec.ok && rec.code === 'unknown' && main && !s.diagAsked) {
      const prev = s.results.filter(r => r.skill === s.skill && !r.detour && !r.probe).slice(-3);
      if (prev.filter(r => r.code === 'unknown').length >= 2) {
        const dd = Math.max(1, spec.d - 1); const ty = [1, 2, 3].map(x => MP.SK[s.skill].types[x] || []).flat().includes('choice') ? 'choice' : (MP.SK[s.skill].why ? 'why' : null);
        if (ty) { s.diagAsked = true; s.queue.push({ kind: 'card', card: 'diag', skill: s.skill }); s.queue.push(makeSpec(s.skill, dd, ty, { diag: true })); actions.push('diag'); }
      }
    }
    // po remediacji: sprawdzenie zrozumienia (pytanie „dlaczego") przy pierwszym sukcesie
    if (rec.ok && main && Object.keys(s.remedDone).length && !s.whyAsked && MP.SK[s.skill].why) {
      s.whyAsked = true; s.queue.push(makeSpec(s.skill, s.d, 'why'));
    }
    return { actions };
  }


  // ---------- tempo pracy ----------
  // Orientacyjny czas na zadanie (sekundy). To NASZE szacunki (nie norma ani badanie): czas, w jakim uczeń, który zna
  // już daną umiejętność, zwykle czyta polecenie i odpowiada. Zależy od formy zadania, trudności i wieku.
  const BASE_SEC = { input: 45, fill: 40, choice: 25, why: 35, error: 50, multi: 100, order: 45, match: 55,
    nline: 30, shade: 30, cutbars: 95, bins: 55, point: 25, rect: 50, cells: 35, multisel: 45 };
  const D_MULT = { 1: 0.7, 2: 1, 3: 1.5 };
  function expectedSec(type, d, grade) {
    const g = grade || 6; const age = g <= 1 ? 1.5 : g <= 3 ? 1.3 : g <= 5 ? 1.1 : 1;
    return Math.round((BASE_SEC[type] || 45) * (D_MULT[d] || 1) * age);
  }
  const median = (a) => { if (!a.length) return null; const b = a.slice().sort((x, y) => x - y), m = b.length >> 1; return b.length % 2 ? b[m] : (b[m - 1] + b[m]) / 2; };
  // pace(state, now, days): czasy pierwszych odpowiedzi (bez sprawdzianów i przerw > 10 min) zgrupowane po działach i umiejętnościach
  function pace(state, now, days) {
    const since = now - (days || 30) * DAY, g = (state.profile && state.profile.grade) || 6;
    const rows = (state.log || []).filter(l => l.t >= since && l.a === 1 && l.sec >= 3 && l.sec <= 600 && l.m !== 'exam' && l.s && l.ty);
    const agg = (list) => { const r = list.map(l => l.sec / expectedSec(l.ty, l.d, g)); const sec = list.map(l => l.sec); const ex = list.map(l => expectedSec(l.ty, l.d, g));
      const ratio = median(r); return { n: list.length, med: Math.round(median(sec)), exp: Math.round(median(ex)), ratio: ratio === null ? null : Math.round(ratio * 100) / 100, ok: Math.round(list.filter(l => l.ok).length / Math.max(1, list.length) * 100),
        slow: list.length >= 5 && ratio >= 1.5, fast: list.length >= 5 && ratio <= 0.5 }; };
    const bySkill = {}; rows.forEach(l => { (bySkill[l.s] = bySkill[l.s] || []).push(l); });
    const skills = {}; Object.keys(bySkill).forEach(id => { skills[id] = agg(bySkill[id]); });
    const dz = (MP.DZIALY || []).map(d => { const ids = []; d.topics.forEach(tp => tp.skills.forEach(id => ids.push(id))); const list = rows.filter(l => ids.includes(l.s));
      return list.length ? Object.assign({ id: d.id, name: d.name, skills: ids.filter(id => skills[id]) }, agg(list)) : null; }).filter(Boolean);
    return { all: rows.length ? agg(rows) : null, dzialy: dz, skills, days: days || 30 };
  }
  // ---------- test opanowania (Mastery Assessment) ----------
  const seenIds = (state, id) => { const o = {}; state.log.forEach(l => { if (l.s === id && l.id) o[l.id] = 1; }); return o; };
  function candidateTypes(skill, d) { const t = (skill.types[d] || []).slice(); return t; }
  function findAspectSpec(state, id, d, aspect, sess) {
    const skill = MP.SK[id]; const seen = seenIds(state, id); const ds = [d, d === 1 ? 2 : d - 1, 3, 2, 1].filter((v, i, a) => a.indexOf(v) === i && skill.types[v]);
    const types = [];
    ds.forEach(dd => candidateTypes(skill, dd).forEach(t => types.push([dd, t])));
    if (skill.why) types.push([d, 'why']);
    for (let k = 0; k < 24; k++) {
      const [dd, t] = types[k % types.length]; const sp = makeSpec(id, dd, t, { aspect: aspect });
      if (seen[id + '#' + t + '#' + sp.seed]) continue;
      let it; try { it = buildItem(sp); } catch (e) { continue; }
      if (it.aspect === aspect) { sp.aspect = aspect; return sp; }
    }
    return null;
  }
  function masterySpecs(state, id) {
    const skill = MP.SK[id]; const seen = seenIds(state, id);
    const bucket = {}; const prompts = {};
    const combos = [];
    [2, 3, 1].forEach(d => (skill.types[d] || []).forEach(t => combos.push([d, t])));
    if (skill.why) combos.push([2, 'why']);
    for (let k = 0; k < 90; k++) {
      const [d, t] = combos[k % combos.length]; const sp = makeSpec(id, d, t, { mastery: true });
      if (seen[id + '#' + t + '#' + sp.seed]) continue;
      let it; try { it = buildItem(sp); } catch (e) { continue; }
      const key = MP.util.plain(it.prompt || '') + '|' + t; if (prompts[key]) continue; prompts[key] = 1;
      sp.aspect = it.aspect; (bucket[it.aspect] = bucket[it.aspect] || []).push(sp);
    }
    const out = [];
    ASPECTS.forEach(a => { const b = bucket[a]; if (b && b.length) { b.sort((x, y) => (y.d >= 2) - (x.d >= 2)); out.push(b.shift()); } });
    // uzupełnienie do ≥ 5 zadań: najpierw obliczenia i zastosowanie na wyższym poziomie, różne typy
    const rest = [].concat(bucket.proc || [], bucket.transfer || [], bucket.visual || [], bucket.concept || []).sort((x, y) => y.d - x.d);
    while (out.length < 5 && rest.length) { const types = new Set(out.map(x => x.type)); const i = rest.findIndex(x => !types.has(x.type)); out.push(rest.splice(i >= 0 && types.size < 2 ? i : 0, 1)[0]); }
    // co najmniej dwa różne sposoby prezentacji
    if (new Set(out.map(x => x.type)).size < 2) { const alt = rest.find(x => x.type !== out[0].type); if (alt) out.push(alt); }
    return out.slice(0, 6);
  }
  function masteryResult(state, results, now) {
    const res = results.filter(r => !r.probe && !r.detour);
    const id = res.length ? res[0].skill : null; if (!id) return null;
    const st = sk(state, id);
    const byA = {}; res.forEach(r => { const a = r.aspect || 'proc'; byA[a] = byA[a] === false ? false : !!r.ok; });
    const pass = res.length >= 5 && res.every(r => r.ok);
    const codes = res.filter(r => !r.ok && r.code).map(r => r.code);
    const freq = {}; codes.forEach(c => { freq[c] = (freq[c] || 0) + 1; });
    const ordered = Object.keys(freq).sort((a, b) => (MP.err(b).cat === 'zasada') - (MP.err(a).cat === 'zasada') || freq[b] - freq[a]);
    const failedAspects = Object.keys(byA).filter(a => !byA[a]);
    st.lastTest = { at: now, pass, aspects: failedAspects, codes: ordered, byA, n: res.length };
    st.tests = (st.tests || 0) + 1;
    if (pass) {
      st.mastery = { at: now, aspects: Object.keys(byA), n: res.length }; st.testReady = false; st.stuck = null; st.repairDone = false; st.repairRound = 0; st.mconf = 3;
      if (!st.l4At) { st.l4At = now; st.stage = 0; st.next = now + INTERVALS[0] * DAY; }
      st.needsReview = false; updateLevel(st, now);
    } else {
      const c = ordered[0] || null;
      st.stuck = c && c !== 'unknown' ? c : '_' + (failedAspects[0] || 'proc'); st.repairDone = false; st.testReady = true;
    }
    return st.lastTest;
  }
  function repairResult(state, results, now) {
    const res = results.filter(r => !r.probe && !r.detour); if (!res.length) return null;
    const st = sk(state, res[0].skill); const tail = res.slice(-3);
    const good = tail.length >= 3 && tail.every(r => r.ok);
    if (good) { st.stuck = null; st.repairDone = false; st.repairRound = 0; st.testReady = false; st.needsReview = false; updateLevel(st, now); }
    else st.repairDone = false;
    return { good };
  }

  function endSession(state, now) {
    const s = state.session; if (!s) return null;
    const res = s.results;
    const summary = { mode: s.mode, skill: s.skill, skills: s.skills, n: res.filter(r => !r.probe).length, ok: res.filter(r => r.ok).length, levels: {}, errors: {}, detours: res.filter(r => r.detour).map(r => r.skill).filter((v, i, a) => a.indexOf(v) === i), dur: now - s.startedAt, prepId: s.prepId, results: res.slice(), title: s.title };
    const ids = new Set(res.map(r => r.skill).concat(s.skills));
    ids.forEach(id => { summary.levels[id] = { from: s.startLevels[id] !== undefined ? s.startLevels[id] : (state.skills[id] ? state.skills[id].lvl : 0), to: state.skills[id] ? state.skills[id].lvl : 0 }; });
    res.forEach(r => { if (r.code) summary.errors[r.code] = (summary.errors[r.code] || 0) + 1; });
    state.session = null;
    state.lastSummary = summary;
    return summary;
  }

  // ---------- test na start (placement) ----------
  const PLACEMENTS = { 6: ['tabl', 'ord_basic', 'div_rules', 'nww', 'fr_part', 'fr_expand', 'fr_simplify', 'fr_mixed', 'fr_add_same', 'fr_add_diff', 'dec_conv', 'dec_add', 'int_compare', 'perim', 'area_rect'], 5: ['tabl', 'nat_pis', 'ord_basic', 'div_rules', 'fr_part', 'fr_expand', 'fr_simplify', 'fr_mixed', 'fr_add_same', 'ang_type', 'perim', 'area_rect', 'dec_units', 'dec_conv'], 2: ['k2_dj', 'k2_cmp', 'k2_add', 'k2_sub', 'k2_mul', 'k2_div', 'k2_money', 'k2_clock', 'k2_shapes'],
    1: ['k1_count', 'k1_cmp', 'k1_add', 'k1_sub', 'k1_tens', 'k1_box', 'k1_half', 'k1_money', 'k1_clock', 'k1_shapes'],
    3: ['k2_add', 'k2_sub', 'k3_num', 'k3_add', 'tabl', 'k3_box', 'k3_word', 'k3_money', 'k3_clock', 'k3_units', 'perim'],
    4: ['tabl', 'k3_add', 'nat_cmp', 'nat_mental', 'nat_pis', 'nat_div_rem', 'ord_basic', 'nat_axis', 'ang_type', 'perim', 'units_len', 'time_calc', 'fr_part'],
    7: ['fr_add_diff', 'fr_mul', 'dec_mul', 'int_add', 'int_mul', 'pct_frac', 'pct_of', 'alg_value', 'eq_solve', 'ang_triangle', 'area_tri', 'pow_nat'],
    8: ['rat_ops', 'pct_change', 'pct_what', 'alg_like', 'alg_mul', 'eq_lin', 'pow_rules', 'root', 'pyth', 'coord', 'mean', 'prob_basic'] };
  const PLACEMENT = PLACEMENTS[6];
  function placementSpecs() { return (PLACEMENTS[MP.grade] || PLACEMENT).filter(ready).map(id => { const t = MP.SK[id].types[2] || MP.SK[id].types[1]; return makeSpec(id, 2, t.includes('input') ? 'input' : t[0], { placement: true }); }); }
  function applyPlacement(state, results) {
    results.forEach(r => { const s = sk(state, r.skill); if (r.ok) s.placedOk = true; });
    state.placement = { t: Date.now(), ok: results.filter(r => r.ok).length, n: results.length };
  }

  // ---------- przygotowanie do sprawdzianu ----------
  function prepCreate(state, topicIds, now) {
    const skills = []; topicIds.forEach(t => MP.TOPICS[t].skills.filter(ready).forEach(id => { if (!skills.includes(id)) skills.push(id); }));
    const per = skills.length > 8 ? 1 : skills.length <= 2 ? 3 : 2; // co najmniej ok. 6 zadań, żeby było z czego wnioskować
    const fixed = [];
    skills.forEach(id => { const sk2 = MP.SK[id]; for (let i = 0; i < per; i++) { const d = i === 0 ? 2 : i === 1 ? (sk2.types[3] ? 3 : 2) : 1; const t = sk2.types[d] || sk2.types[1]; fixed.push(makeSpec(id, d, t.includes('input') ? 'input' : t[0])); } });
    state.prep = { id: now.toString(36), created: now, topics: topicIds, skills, phase: 'diag', diag: null, plan: [], checks: [], exam: null, timeLimit: Math.max(10, Math.min(45, Math.round(skills.length * 3))) };
    return fixed;
  }
  function prepMakePlan(state, diagResults) {
    const P = state.prep; P.diag = diagResults.map(r => ({ skill: r.skill, ok: r.ok, code: r.code }));
    const bad = {};
    diagResults.forEach(r => { if (!r.ok) { bad[r.skill] = bad[r.skill] || []; bad[r.skill].push(r.code); } });
    const plan = [];
    Object.keys(bad).forEach(id => {
      bad[id].forEach(c => { const rem = MP.err(c).remedy; if (rem && ready(rem) && rem !== id && !P.skills.includes(rem) && sk(state, rem).lvl < 3 && !plan.some(p => p.skill === rem)) plan.push({ skill: rem, status: 'todo', reason: 'Podstawa potrzebna do: ' + MP.SK[id].name, extra: true }); });
      plan.push({ skill: id, status: 'todo', reason: bad[id].map(c => MP.err(c).title).filter((v, i, a) => a.indexOf(v) === i).join(', ') });
    });
    P.skills.forEach(id => { if (!bad[id]) plan.push({ skill: id, status: 'ok', reason: 'Poszło dobrze w teście diagnostycznym' }); });
    const ord = (id) => MP.SKILL_ORDER.indexOf(id);
    plan.sort((a, b) => (a.status === 'ok') - (b.status === 'ok') || ord(a.skill) - ord(b.skill));
    P.plan = plan; P.phase = 'practice';
    return plan;
  }
  function prepAfterSession(state, summary) {
    const P = state.prep; if (!P) return;
    const item = P.plan.find(p => p.skill === summary.skill); if (!item) return;
    const main = summary.results.filter(r => r.skill === summary.skill && !r.detour && !r.probe);
    const acc = main.filter(r => r.ok).length / Math.max(1, main.length);
    const tail = main.slice(-3);
    item.sessions = (item.sessions || 0) + 1; item.lastAcc = Math.round(acc * 100);
    if (acc >= 0.7 && tail.length === 3 && tail.filter(r => r.ok).length >= 2) item.status = 'ok';
    else item.status = 'work';
  }
  function examSpecs(state) {
    const P = state.prep; const fixed = [];
    const skills = P.skills; const n = Math.max(8, Math.min(16, skills.length * 2));
    for (let i = 0; i < n; i++) {
      const id = skills[i % skills.length]; const sk2 = MP.SK[id];
      const d = i % 4 === 0 ? 1 : i % 4 === 3 ? 3 : 2;
      const types = (sk2.types[d] || sk2.types[1]).filter(t => t !== 'why');
      fixed.push(makeSpec(id, d, types[i % types.length], { pts: d }));
    }
    return fixed.sort((a, b) => a.d - b.d);
  }
  function scoreExam(items, answers) {
    let pts = 0, max = 0; const detail = [];
    items.forEach((it, i) => {
      const p = it.d; max += p;
      const a = answers[i];
      let res = (a === undefined || a === null || a === '') ? { ok: false, code: 'empty' } : MP.items.check(it, a);
      let got = res.ok ? p : 0;
      if (!res.ok && res.partial) got = p / 2;
      if (!res.ok && it.answer.kind === 'multi' && res.fields) got = Math.floor(p * res.fields.filter(Boolean).length / res.fields.length * 2) / 2;
      pts += got; detail.push({ skill: it.skill, ok: res.ok, code: res.code || null, got, max: p });
    });
    return { pts, max, pct: Math.round(pts / max * 100), detail };
  }
  const GRADES = [[98, 'celujący (6)'], [90, 'bardzo dobry (5)'], [75, 'dobry (4)'], [50, 'dostateczny (3)'], [30, 'dopuszczający (2)'], [0, 'jeszcze do poprawy']];
  const gradeFor = (pct) => GRADES.find(g => pct >= g[0])[1];

  // ---------- statystyki, seria, odznaki ----------
  function streak(state, now) {
    let n = 0, t = now; const has = (k) => state.days[k] && state.days[k].n > 0;
    if (!has(dayKey(t))) t -= DAY;
    while (has(dayKey(t))) { n++; t -= DAY; }
    let best = 0, cur = 0; const keys = Object.keys(state.days).filter(k => state.days[k].n > 0).sort();
    let prev = null; keys.forEach(k => { const d = new Date(k + 'T12:00:00').getTime(); cur = prev && Math.round((d - prev) / DAY) === 1 ? cur + 1 : 1; best = Math.max(best, cur); prev = d; });
    return { current: n, best: Math.max(best, n), today: has(dayKey(now)) };
  }
  function weekDays(state, now) { const out = []; for (let i = 6; i >= 0; i--) { const k = dayKey(now - i * DAY); out.push({ k, n: state.days[k] ? state.days[k].n : 0, sec: state.days[k] ? state.days[k].sec : 0, wd: new Date(now - i * DAY).getDay() }); } return out; }
  const BADGES = [
    { id: 'start', name: 'Pierwszy krok', desc: 'Pierwsze dobrze rozwiązane zadanie', test: (S) => S.stats.ok >= 1 },
    { id: 'z25', name: 'Rozgrzewka', desc: '25 rozwiązanych zadań', test: (S) => S.stats.items >= 25 },
    { id: 'z100', name: 'Wytrwałość', desc: '100 rozwiązanych zadań', test: (S) => S.stats.items >= 100 },
    { id: 'z300', name: 'Maratończyk', desc: '300 rozwiązanych zadań', test: (S) => S.stats.items >= 300 },
    { id: 'seria3', name: 'Trzy dni z rzędu', desc: 'Nauka przez 3 kolejne dni', test: (S, now) => streak(S, now).best >= 3 },
    { id: 'seria7', name: 'Tydzień systematyczności', desc: 'Nauka przez 7 kolejnych dni', test: (S, now) => streak(S, now).best >= 7 },
    { id: 'tydz3', name: 'Rytm tygodnia', desc: '3 dni nauki w ciągu jednego tygodnia', test: (S, now) => weekDays(S, now).filter(d => d.n > 0).length >= 3 },
    { id: 'samo5', name: 'Samodzielnie!', desc: '5 dobrych odpowiedzi z rzędu bez podpowiedzi', test: (S) => S.stats.noHintRun >= 5 },
    { id: 'pomoc', name: 'Odwaga pytania', desc: '10 zadań rozwiązanych po skorzystaniu ze wskazówki', test: (S) => S.stats.afterHint >= 10 },
    { id: 'detektyw', name: 'Detektyw błędów', desc: '5 wykrytych błędów w cudzych rozwiązaniach', test: (S) => S.stats.errFound >= 5 },
    { id: 'wstecz', name: 'Krok wstecz, dwa do przodu', desc: 'Powrót do podstaw, żeby lepiej zrozumieć temat', test: (S) => S.stats.remed >= 1 },
    { id: 'poziom4', name: 'Nowa umiejętność', desc: 'Pierwsza umiejętność na poziomie 4', test: (S) => Object.values(S.skills).some(s => s.maxLvl >= 4) },
    { id: 'trudnosc', name: 'Pokonana trudność', desc: 'Poziom 4 w umiejętności, w której było dużo pomyłek', test: (S) => Object.values(S.skills).some(s => s.maxLvl >= 4 && (s.errHeavy || 0) >= 4) },
    { id: 'pamiec', name: 'Dobra pamięć', desc: 'Udana powtórka po przerwie', test: (S) => Object.values(S.skills).some(s => s.rev && s.rev.length >= 1) },
    { id: 'mistrz', name: 'Opanowane!', desc: 'Pierwsza umiejętność na poziomie 5', test: (S) => Object.values(S.skills).some(s => s.lvl === 5) },
    { id: 'probny', name: 'Gotowość', desc: 'Ukończony próbny sprawdzian', test: (S) => S.exams.length >= 1 }
  ];
  function checkBadges(state, now) {
    const fresh = [];
    BADGES.forEach(b => { if (!state.badges[b.id] && b.test(state, now)) { state.badges[b.id] = now; fresh.push(b); } });
    return fresh;
  }

  // ---------- analiza dla rodzica ----------
  function analysis(state, now) {
    const ids = Object.keys(state.skills).filter(ready);
    const errTotals = {}; const errBySkill = {};
    state.log.forEach(l => { if (l.e) { errTotals[l.e] = (errTotals[l.e] || 0) + 1; (errBySkill[l.e] = errBySkill[l.e] || {})[l.s] = 1; } });
    const topErrors = Object.keys(errTotals).filter(c => c !== 'format' && c !== 'unknown').sort((a, b) => errTotals[b] - errTotals[a]).slice(0, 8).map(c => ({ code: c, n: errTotals[c], skills: Object.keys(errBySkill[c]), info: MP.err(c) }));
    const cats = {}; Object.keys(errTotals).forEach(c => { const k = MP.err(c).cat; cats[k] = (cats[k] || 0) + errTotals[c]; });
    const hard = ids.filter(id => state.skills[id].n >= 3).map(id => { const s = state.skills[id]; const h = s.hist.slice(-10); return { id, acc: h.filter(x => x.ok).length / h.length, lvl: s.lvl, n: s.n }; }).filter(x => x.lvl <= 3).sort((a, b) => a.acc - b.acc).slice(0, 6);
    // przebieg wyników tygodniowo (ostatnie 8 tygodni)
    const weeks = []; for (let w = 7; w >= 0; w--) { const start = now - (w + 1) * 7 * DAY, end = now - w * 7 * DAY; const L = state.log.filter(l => l.a === 1 && l.t >= start && l.t < end); weeks.push({ label: w === 0 ? 'ten tydz.' : w + ' tyg. temu', n: L.length, ok: L.filter(l => l.ok).length, pct: L.length ? Math.round(L.filter(l => l.ok).length / L.length * 100) : null }); }
    const totalSec = Object.values(state.days).reduce((a, d) => a + d.sec, 0);
    return { topErrors, cats, hard, weeks, totalSec, due: dueSkills(state, now) };
  }

  MP.engine = { dzialTest, chtestSpecs, chtestResult, migrate, dzSkills, ASPECTS, ASPECT_NAMES, aspectOf, aspectState, gateBlockers, gateRoot, masteryOk, masterySpecs, masteryResult, repairResult, findAspectSpec, DAY, INTERVALS, LEVELS, newState, sk, dayKey, rawLevel, updateLevel, isDue, record, topicStatus, dzialStatus, recommend, dueSkills, chooseType, makeSpec, buildItem, startSession, nextStep, afterAnswer, queueAnalog, endSession, sessionStarted, expectedSec, pace, placementSpecs, applyPlacement, prepCreate, prepMakePlan, prepAfterSession, examSpecs, scoreExam, gradeFor, GRADES, streak, weekDays, BADGES, checkBadges, analysis, PLACEMENT, PLACEMENTS };
})(MP);
