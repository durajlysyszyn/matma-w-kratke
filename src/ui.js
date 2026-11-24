/* ui.js — interfejs: panel ucznia, działy, tematy, lekcje z podpowiedziami, sprawdzian, panel rodzica. */
(function () {
  'use strict';
  const MP = window.MP, E = MP.engine, U = MP.util, I = MP.items, SK = MP.SK;
  const now = () => Date.now();
  // ---------- konta dzieci ----------
  let IDX = MP.store.loadIndex();   // lista dzieci na tym komputerze / koncie
  let CID = null, S = null;          // aktywne dziecko i jego postępy
  function fixState(st) {
    ['settings', 'stats', 'badges', 'days', 'skills'].forEach(k => { if (!st[k]) st[k] = E.newState(now())[k]; });
    st.writeups = st.writeups || []; st.exams = st.exams || []; st.log = st.log || []; E.migrate(st); return st;
  }
  function syncIdxEntry() {
    const e = IDX.profiles.find(p => p.id === CID); if (!e || !S || !S.profile) return;
    const P = S.profile; const sig = (x) => JSON.stringify([x.name, x.grade, x.av, x.interests]);
    if (sig(e) !== sig(P)) { Object.assign(e, { name: P.name, grade: P.grade, av: P.av, interests: P.interests, updated: now() }); MP.store.saveIndex(IDX); }
  }
  let PEND = null, DIRTY = false; // zapis dziecka jest właśnie pobierany z konta – do tego czasu nie nadpisujemy konta starszym/pustym stanem
  const save = () => { if (S && CID) { if (PEND === CID) { DIRTY = true; MP.store.saveLocal(S, CID); } else MP.store.save(S, CID); syncIdxEntry(); } };
  const applyProfile = () => { MP.interests = (S && S.profile && S.profile.interests) || []; MP.setGrade((S && S.profile && S.profile.grade) || 6); };
  function activate(id, quiet) {
    const e = IDX.profiles.find(p => p.id === id); if (!e) return false;
    CID = id; S = MP.store.loadProfile(id);
    if (!S || !S.v) { S = E.newState(now()); S.updated = 0; S.profile = { name: e.name, av: e.av, grade: e.grade || 6, interests: e.interests || [] }; }
    fixState(S); if (!S.profile.grade) S.profile.grade = e.grade || 6;
    applyProfile(); IDX.last = id; MP.store.saveIndex(IDX); parentOpen = false;
    refreshFromCloud(id, quiet);
    return true;
  }
  function refreshFromCloud(id, quiet, tries) {
    if (!MP.store.online()) return;
    PEND = id; DIRTY = false;
    MP.store.fetchProfile(id).then(r => {
      if (PEND !== id) return; PEND = null;
      if (CID !== id) return;
      if (r && r.v && (r.updated || 0) > (S.updated || 0)) { S = fixState(r); applyProfile(); syncIdxEntry(); MP.store.saveLocal(S, id); if (view.name !== 'lesson' && view.name !== 'exam') render(); if (!quiet) toast('Wczytano najnowsze postępy z konta.'); }
      else if (DIRTY || !S.updated) save();
    }, () => {
      // nie udało się sprawdzić konta – nowe urządzenie czeka i próbuje ponownie, zamiast nadpisać konto pustym stanem
      if (PEND !== id) return;
      if (CID === id && !S.updated && (tries || 0) < 5) return setTimeout(() => { if (CID === id) refreshFromCloud(id, quiet, (tries || 0) + 1); }, 4000);
      PEND = null; if (DIRTY) save();
    });
  }
  // panel rodzica: dociągnij z konta postępy dzieci, które ćwiczą na własnych urządzeniach
  let kidsAt = 0;
  function refreshKids() {
    if (!MP.store.online() || MP.store.isChild() || Date.now() - kidsAt < 20000) return; kidsAt = Date.now();
    Promise.all(IDX.profiles.filter(p => p.id !== CID).map(p => MP.store.fetchProfile(p.id).then(r => { const loc = MP.store.loadProfile(p.id); if (r && r.v && (r.updated || 0) > ((loc && loc.updated) || 0)) { MP.store.saveLocal(r, p.id); return true; } }, () => false)))
      .then(ch => { if (ch.some(Boolean) && view.name === 'rodzic') render(); });
    if (CID) refreshFromCloud(CID, true);
  }
  let draft = null; // edytowany profil (powitanie / „Mój profil")
  const NM = () => (S && S.profile && S.profile.name) ? S.profile.name : '';
  const $app = document.getElementById('app');
  let view = { name: 'start' }, parentOpen = false, examTimer = null, linkOpen = null, linkDone = null;
  if (IDX.profiles.length === 1) activate(IDX.profiles[0].id, true);
  else if (IDX.profiles.length > 1) view = { name: 'who' };

  // ---------- pomocnicze ----------
  const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  // ---------- zapis matematyczny (KaTeX, z zapasowym zapisem HTML) ----------
  const KCACHE = new Map();
  function toTex(x) {
    return String(x).replace(/\s+/g, ' ').trim()
      .replace(/−/g, '-').replace(/□/g, '\\square ').replace(/·/g, '\\cdot ').replace(/×/g, '\\times ')
      .replace(/√\(([^)]*)\)/g, '\\sqrt{$1}').replace(/√([0-9a-z]+)/gi, '\\sqrt{$1}')
      .replace(/\\?[A-Za-ząćęłńóśźżĄĆĘŁŃÓŚŹŻ]{2,}/g, (w) => w[0] === '\\' ? w : '\\mathrm{' + w + '}')
      .replace(/%/g, '\\%');
  }
  function kx(tex, fallback) {
    if (!(window.katex && window.katex.renderToString)) return fallback;
    if (KCACHE.has(tex)) return KCACHE.get(tex);
    let out; try { out = window.katex.renderToString(tex, { throwOnError: false, output: 'html' }); } catch (e) { out = fallback; }
    KCACHE.set(tex, out); return out;
  }
  const fracHTML = (n, d) => '<span class="fr"><span class="nu">' + n + '</span><span class="de">' + d + '</span></span>';
  const mixedK = (sg, w, n, d) => kx(sg + w + '\\dfrac{' + toTex(n) + '}{' + toTex(d) + '}', (sg ? '−' : '') + '<span class="mx">' + w + '</span>' + fracHTML(n, d));
  const fracK = (sg, n, d) => kx(sg + '\\dfrac{' + toTex(n) + '}{' + toTex(d) + '}', (sg ? '−' : '') + fracHTML(n, d));
  function mathText(t) { // zwykły tekst bez znaczników HTML
    return t.replace(/(\d)\.(\d)/g, '$1,$2') // polski zapis dziesiętny (przecinek)
      .replace(/\[\[(\d+) (\d+|□)\/(\d+|□)\]\]/g, (m, w, n, d) => mixedK('', w, n, d))
      .replace(/\[\[([^\]\/]+)\/([^\]]+)\]\]/g, (m, n, d) => fracK('', n, d))
      .replace(/(^|[\s(=+\-−·:≈<>≤≥,;])(\d+) (\d+)\/(\d+)(?![\d\/\w,])/g, (m, pre, w, n, d) => pre + mixedK('', w, n, d))
      .replace(/(^|[^\w\/,.\d])(\d+)\/(\d+)(?![\d\/\wąćęłńóśźż,])/g, (m, pre, n, d) => pre + fracK('', n, d))
      .replace(/(\d*)√\(([^)]*)\)/g, (m, k, x) => kx(k + '\\sqrt{' + toTex(x) + '}', m))
      .replace(/(\d*)√(\d+|[a-z])/g, (m, k, x) => kx(k + '\\sqrt{' + x + '}', m))
      .replace(/∛\(?(−?\d+)\)?/g, (m, x) => kx('\\sqrt[3]{' + x.replace('−', '-') + '}', m));
  }
  MP.mathHTML = (s) => M(s);
  function M(s) {
    s = String(s == null ? '' : s).replace(/<sup>3<\/sup>√\(?(−?\d+)\)?/g, '∛($1)');
    return s.split(/(<[^>]+>)/).map(part => part.startsWith('<') ? part : mathText(part)).join('');
  }
  const skName = (id) => SK[id] ? SK[id].name : id;
  const topicOf = (id) => MP.TOPICS[MP.SKILL_TOPIC[id]];
  const lvlDots = (l) => '<span class="lvl" aria-label="poziom ' + l + ' z 5">' + [1, 2, 3, 4, 5].map(i => '<i class="' + (i <= l ? 'f' : '') + '"></i>').join('') + '</span>';
  const meter = (p) => '<div class="meter"><i style="width:' + Math.max(0, Math.min(100, p)) + '%"></i></div>';
  const ASPN = { concept: 'Rozumienie', visual: 'Rysunek', proc: 'Obliczenia', transfer: 'Zadania z treścią' };
  const aspChips = (sid, full) => { const s = S.skills[sid]; return '<span class="asps">' + E.ASPECTS.map(a => { const st = E.aspectState(s, a); return '<span class="asp ' + st + '" title="' + esc(E.ASPECT_NAMES[a]) + ': ' + (st === 'ok' ? 'opanowane' : st === 'work' ? 'wymaga dalszej praktyki' : 'jeszcze nie sprawdzone') + '">' + (st === 'ok' ? '✓ ' : st === 'work' ? '• ' : '') + (full ? E.ASPECT_NAMES[a] : ASPN[a]) + '</span>'; }).join('') + '</span>'; };
  const skState = (sid) => { const s = S.skills[sid]; const blk = E.gateBlockers(S, sid); if (s && s.stuck) return { k: 'stuck', l: s.repairDone ? 'Gotowe do ponownego testu' : 'Ścieżka naprawcza' }; if (blk.length && !(s && (s.mastery || s.l4At))) return { k: 'locked', l: 'Zablokowane', root: E.gateRoot(S, sid) || blk[0] }; if (s && s.testReady && !s.mastery) return { k: 'test', l: 'Gotowe do testu opanowania' }; if (s && s.mastery) return { k: 'mast', l: 'Test opanowania zaliczony' }; return { k: '', l: '' }; };
  const chip = (st) => '<span class="chip ' + st.key + '">' + st.label + '</span>';
  const fmtMin = (sec) => { const m = Math.round(sec / 60); return m < 60 ? m + ' min' : Math.floor(m / 60) + ' h ' + (m % 60) + ' min'; };
  const ago = (t) => { if (!t) return '—'; const d = Math.floor((now() - t) / E.DAY); return d <= 0 ? 'dziś' : d === 1 ? 'wczoraj' : d + ' dni temu'; };
  function toast(html, ms) { const t = document.getElementById('toast'); t.innerHTML = '<div class="toast" role="status">' + html + '</div>'; clearTimeout(toast.t); toast.t = setTimeout(() => { t.innerHTML = ''; }, ms || 3500); }
  function badgesCheck(quiet) { const fresh = E.checkBadges(S, now()); if (fresh.length) save(); if (quiet) return fresh; if (fresh.length) { toast('<b>Nowa odznaka:</b> ' + fresh.map(b => esc(b.name)).join(', '), 4500); } }
  const PRAISE = ['Świetnie!', 'Dokładnie tak!', 'Brawo!', 'Super, to jest to!', 'Tak jest!', 'Bardzo dobrze!'];
  const praise = () => { const p = PRAISE[Math.floor(Math.random() * PRAISE.length)]; return NM() && Math.random() < 0.45 ? p.replace(/!$/, ', ' + esc(NM()) + '!') : p; };

  // ---------- nawigacja ----------
  const TOP = { start: 'start', sprawdzian: 'sprawdzian', dzieci: 'dzieci', pustaw: 'pustaw', profil: 'profil' };
  function go(name, params) {
    if (name === 'dzialy') name = 'start';
    if (name === 'rodzic') name = 'dzieci';
    if ((name === 'profil' && view.name !== 'profil') || (name === 'pustaw' && (!params || params.tab !== view.tab))) draft = null;
    view = Object.assign({ name }, params || {});
    if (TOP[name] && location.hash !== '#' + name) { try { history.replaceState(null, '', '#' + name); } catch (e) { } }
    render(); window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', () => { const h = location.hash.slice(1); if (TOP[h] && view.name !== h) go(h); });
  document.querySelector('header.top').addEventListener('click', (e) => {
    const b = e.target.closest('[data-go],[data-nact]'); if (!b) return;
    if (b.dataset.nact) return navAct(b.dataset.nact);
    go(b.dataset.go);
  });
  function doLogout() { return modal(MP.store.isChild() ? 'Wylogować się? Postępy zostaną na Twoim koncie – po ponownym zalogowaniu wszystko będzie na miejscu.' : 'Wylogować z tego komputera? Postępy zostaną na koncie Google, a z tej przeglądarki zostaną usunięte.', () => { MP.store.auth.signOut().then(() => { MP.store.clearLocal(); IDX = MP.store.loadIndex(); CID = null; S = null; parentOpen = false; try { localStorage.removeItem('mp_skip_login'); sessionStorage.removeItem('mp_role'); } catch (er) { } view = { name: 'role' }; render(); }); }); }
  function navAct(a) {
    if (a === 'glogout') return doLogout();
    if (a === 'endpractice') { parentOpen = false; return go('dzieci'); }
    if (a === 'closeparent') { parentOpen = false; return go(S ? 'start' : 'who'); }
  }
  // menu główne: rodzic – Dzieci · Ustawienia · Wyloguj; uczeń – Start · Sprawdzian · Ustawienia · Wyloguj (lub Zakończ naukę na urządzeniu rodzica)
  function navItems() {
    const who = MP.store.who(), child = MP.store.isChild();
    if (isParentView() && !child) return [['dzieci', 'Dzieci', ['dzieci', 'postepy']], ['pustaw', 'Ustawienia', ['pustaw']], who ? ['@glogout', 'Wyloguj', []] : ['@closeparent', 'Zamknij panel', []]];
    const last = child ? ['@glogout', 'Wyloguj', []] : who ? ['@endpractice', 'Zakończ naukę', []] : ['dzieci', 'Panel rodzica', []];
    return [['start', 'Start', ['start', 'dzial', 'topic', 'locked']], ['sprawdzian', 'Sprawdzian', ['sprawdzian', 'exam', 'examres']], ['profil', 'Ustawienia', ['profil']], last];
  }
  function setNav() {
    const nav = document.querySelector('header.top nav'); if (!nav) return;
    const top = view.name === 'lesson' || view.name === 'summary' ? (view.from === 'dzialy' ? 'start' : (view.from || 'start')) : view.name;
    const items = navItems();
    nav.innerHTML = items.map(it => '<button ' + (it[0][0] === '@' ? 'data-nact="' + it[0].slice(1) + '" class="navout"' : 'data-go="' + it[0] + '"') + ' aria-current="' + ((it[2].includes(top) || it[0] === top) ? 'page' : 'false') + '">' + it[1] + '</button>').join('');
    const me = document.getElementById('me'); if (me) me.hidden = true;
    const bare = ['onboard', 'who', 'login', 'auth', 'pwelcome', 'role', 'plogin', 'slogin', 'plink', 'plinked'].includes(view.name);
    nav.style.visibility = bare || (!S && !isParentView()) ? 'hidden' : '';
    const br = document.querySelector('header.top .brand'); if (br) br.dataset.go = isParentView() ? 'dzieci' : 'start';
  }
  function render() {
    document.querySelectorAll('.chipx.ghost').forEach(g => g.remove());
    clearInterval(examTimer); examTimer = null;
    setNav();
    document.body.classList.toggle('authmode', ['role', 'plogin', 'slogin', 'pwelcome', 'plink', 'plinked', 'auth'].includes(view.name));
    const AV = MP.authViews;
    if (view.name === 'auth') { $app.innerHTML = AV.loading(view.text || 'Sprawdzam konto…'); return; }
    if (view.name === 'login' || view.name === 'role') { view = { name: 'role', msg: view.msg }; $app.innerHTML = AV.role({ msg: view.msg, localCount: MP.store.who() ? 0 : IDX.profiles.length }); return; }
    if (view.name === 'plogin') { $app.innerHTML = AV.parent(view); focusFirst(); return; }
    if (view.name === 'slogin') { $app.innerHTML = AV.student(view); focusFirst(); return; }
    if (view.name === 'plink') { const k = IDX.profiles.find(p => p.id === view.kid); if (k) { $app.innerHTML = AV.plink(Object.assign({}, view, { kid: k })); focusFirst(); return; } view = { name: 'rodzic' }; }
    if (view.name === 'plinked') { const k = IDX.profiles.find(p => p.id === view.kid); if (k) { $app.innerHTML = AV.plinked({ kid: k }); return; } view = { name: 'rodzic' }; }
    const parentNoKids = () => !IDX.profiles.length && MP.store.who() && !MP.store.isChild();
    if (view.name === 'pwelcome' && !parentNoKids()) view = { name: 'start' };
    if (view.name === 'dzialy') view = { name: 'start' };
    if (view.name === 'rodzic') view = Object.assign({}, view, { name: 'dzieci' });
    if (!S && view.name !== 'onboard' && view.name !== 'who' && view.name !== 'pwelcome' && !(isParentView() && IDX.profiles.length)) view = IDX.profiles.length ? { name: 'who' } : parentNoKids() ? { name: 'pwelcome' } : { name: 'onboard', step: 0, isNew: true };
    if (view.name === 'pwelcome') { $app.innerHTML = AV.pwelcome({ who: MP.store.who(), verified: MP.store.auth.verified(), viaGoogle: MP.store.auth.viaGoogle(), kids: IDX.profiles, msg: view.msg }); return; }
    if (S && !S.profile && view.name !== 'onboard' && !isParentView()) view = { name: 'onboard', step: 0 };
    if (MP.store.isChild() && ['rodzic', 'who', 'onboard', 'dzieci', 'postepy', 'pustaw'].includes(view.name)) view = { name: 'start' };
    setNav();
    const v = view.name;
    if (v === 'who') $app.innerHTML = vWho();
    else if (v === 'onboard') { $app.innerHTML = vOnboard(); afterProfileRender(); }
    else if (v === 'profil') { $app.innerHTML = vProfil(); afterProfileRender(); }
    else if (v === 'start') $app.innerHTML = vHome();
    else if (v === 'dzial') $app.innerHTML = vDzial(view.id);
    else if (v === 'topic') $app.innerHTML = vTopic(view.id);
    else if (v === 'lesson') { $app.innerHTML = vLesson(); afterLessonRender(); }
    else if (v === 'summary') $app.innerHTML = vSummary();
    else if (v === 'locked') $app.innerHTML = vLocked();
    else if (v === 'sprawdzian') $app.innerHTML = vPrep();
    else if (v === 'exam') { $app.innerHTML = vExam(); afterExamRender(); }
    else if (v === 'examres') $app.innerHTML = vExamRes(view.idx);
    else if (isParentView()) { $app.innerHTML = parentGate(); if (view.name === 'pustaw' && view.tab && view.tab !== 'og') afterProfileRender(); refreshKids(); if (view.sec) { const el = document.getElementById('sec-' + view.sec); if (el) el.scrollIntoView({ block: 'start' }); view.sec = null; } }
    $app.insertAdjacentHTML('beforeend', '<p class="foot">' + storageLine() + '</p>');
  }
  function storageLine() {
    const s = MP.store.status();
    const who = MP.store.who();
    const where = who && MP.store.isChild() ? 'Zalogowano jako ' + esc(who) + '. Postępy zapisują się na Twoim koncie.' : who ? 'Postępy zapisują się na koncie rodzica (' + esc(who) + ') i w tej przeglądarce.' : s === 'cloud' ? 'Postępy zapisują się na Twoim koncie i w tej przeglądarce.' : s === 'memory' ? 'Uwaga: ta przeglądarka nie pozwala zapisywać danych – postępy znikną po zamknięciu strony. Użyj „Kodu postępów" w panelu rodzica.' : 'Postępy zapisują się w tej przeglądarce.';
    return where + ' Bez reklam, bez śledzenia, bez danych osobowych.';
  }
  MP.store.onStatus(() => { const f = $app.querySelector('.foot'); if (f) f.textContent = storageLine(); });

  // ---------- STRONA GŁÓWNA ----------
  function vHome() {
    const t = now(), rec = E.recommend(S, t), st = E.streak(S, t), wk = E.weekDays(S, t);
    const ready = MP.SKILL_ORDER.filter(MP.isReady);
    const L = (id) => (S.skills[id] || {}).lvl || 0;
    const mastered = ready.filter(id => L(id) === 5).length, almost = ready.filter(id => L(id) === 4).length, prog = ready.filter(id => L(id) >= 1 && L(id) <= 3).length;
    const due = E.dueSkills(S, t);
    const todayN = (S.days[E.dayKey(t)] || {}).n || 0;
    let h = '';
    const hr = new Date(t).getHours(), hi = hr < 10 ? 'Dzień dobry' : hr >= 19 ? 'Dobry wieczór' : 'Cześć';
    if (S.profile && (S.stats.items || S.placement || S.welcomed)) h += '<div class="hello">' + MP.avatar.svg(S.profile.av, 64) + MP.helpers.svg(myHelper(), 'idle', 64) + '<div><h1>' + hi + ', ' + esc(NM()) + '!</h1><span class="chip" style="margin-right:8px">' + (MP.GRADES[MP.grade] || {}).name + '</span><span class="muted">' + (st.today ? 'Dziś już ćwiczysz – super.' : st.current ? 'Masz serię ' + st.current + ' ' + U.pl(st.current, 'dnia', 'dni', 'dni') + '. Kontynuujemy?' : 'Dobrze Cię widzieć. Zrobimy dziś kawałek matematyki?') + '</span></div></div>';
    if (!S.stats.items && !S.placement && !S.welcomed) {
      h += '<section class="bigcard" style="margin-bottom:16px"><div class="hello">' + (S.profile ? MP.avatar.svg(S.profile.av, 72) : '') + '<h1>Cześć, ' + esc(NM()) + '! Tu uczymy się matematyki krok po kroku.</h1></div><p>Tu nie ma ocen za błędy. Pomyłki pokazują, co warto jeszcze przećwiczyć – i to jest w porządku. Każde zadanie ma wskazówki, a jeśli coś będzie trudne, wrócimy do podstaw i wytłumaczę to inaczej.</p><p>Od czego zaczniemy?</p><div class="row"><button class="btn pri" data-act="placement">Krótki test na start (' + E.placementSpecs().length + ' ' + U.pl(E.placementSpecs().length, 'zadanie', 'zadania', 'zadań') + ')</button><button class="btn" data-act="welcomed">Zacznę od pierwszego tematu</button></div><p class="small muted" style="margin-top:12px">Test na start nie jest oceniany. Pomaga wybrać, od czego zacząć, żeby nie nudzić się tym, co już umiesz.</p></section>';
    }
    // przerwana lekcja – pasek na całą szerokość nad zeszytem
    if (S.session && !S.session.done && !E.sessionStarted(S.session)) { S.session = null; save(); } // lekcja otwarta, ale bez żadnej odpowiedzi – nic do wznawiania
    if (rec.kind === 'resume' && S.session) {
      const ss = S.session, tpR = ss.skill ? topicOf(ss.skill) : null, dzR = tpR ? MP.DZIALY.find(d => d.id === tpR.dzial) : null;
      const what = ss.mode === 'review' ? 'Powtórka: ' + ss.skills.map(skName).join(', ') : ss.mode === 'placement' ? 'Test na start' : ss.mode === 'diag' ? 'Test diagnostyczny przed sprawdzianem' : skName(ss.skill);
      const where = [dzR && dzR.name, tpR && tpR.name !== skName(ss.skill) ? tpR.name : null].filter(Boolean).join(' › ');
      const done = ss.fixed ? (ss.step || 0) : (ss.results || []).length;
      h += '<section class="resume" role="region" aria-label="Przerwana lekcja"><div class="rtxt"><span class="lbl">Przerwana lekcja – zapisałem, gdzie skończyliśmy</span><h2>' + esc(what) + '</h2><span>' + (where ? esc(where) + ' · ' : '') + (ss.fixed ? 'zrobione ' + done + ' z ' + ss.max + ' ' + U.pl(ss.max, 'zadania', 'zadań', 'zadań') : 'zrobione ' + done + ' ' + U.pl(done, 'zadanie', 'zadania', 'zadań') + ' – wszystkie odpowiedzi są zapisane') + '</span></div><button class="btn" data-act="rec">Kontynuuj lekcję →</button></section>';
    }
    // następny krok – zawsze jeden wyraźny przycisk
    if (rec.kind !== 'resume' && (S.stats.items || S.placement || S.welcomed)) {
      let lbl = 'Twój następny krok', h2 = '', sub = '', btn = 'Zaczynamy →';
      if (rec.kind === 'repair') { lbl = 'Zanim pójdziemy dalej'; h2 = skName(rec.skill); sub = 'Pojawił się kłopot – poćwiczymy to inaczej, krok po kroku.'; btn = 'Ćwiczę →'; }
      else if (rec.kind === 'chtest') { const dz0 = MP.DZIALY.find(x => x.id === rec.dz) || { name: '' }; lbl = 'Dział przećwiczony!'; h2 = 'Test działu: ' + dz0.name; sub = 'Zdaj test, a dział będzie w pełni zaliczony.'; btn = 'Zaczynam test →'; }
      else if (rec.kind === 'review') { h2 = 'Krótka powtórka'; sub = rec.skills.map(skName).join(', '); }
      else if (rec.kind === 'learn') { const tp0 = topicOf(rec.skill), dz0 = tp0 ? MP.DZIALY.find(x => x.id === tp0.dzial) : null; h2 = skName(rec.skill); sub = [dz0 && dz0.name, tp0 && tp0.name !== skName(rec.skill) ? tp0.name : null].filter(Boolean).join(' › '); }
      else { lbl = 'Brawo!'; h2 = 'Wszystko opanowane'; sub = 'Możesz wybrać dowolny dział i poćwiczyć jeszcze.'; btn = ''; }
      h += '<section class="nextstep" role="region" aria-label="Twój następny krok"><div><span class="lbl">' + esc(lbl) + '</span><h2>' + esc(h2) + '</h2>' + (sub ? '<span class="small">' + esc(sub) + '</span>' : '') + '</div>' + (btn ? '<button class="btn" data-act="rec">' + btn + '</button>' : '') + '</section>';
    }
    // zeszyt w kratkę – bez numerów poziomów: nowe / ćwiczę / opanowane
    const known = (s0) => !!(s0 && (s0.mastery || s0.l4At) && !s0.stuck);
    const simple = (id) => { const s0 = S.skills[id]; return !s0 || !s0.n ? 0 : known(s0) ? 5 : 3; };
    const SIMPLE = { 0: 'nowe', 3: 'ćwiczę', 5: 'opanowane' };
    const masteredN = ready.filter(id => known(S.skills[id])).length;
    h += '<section class="map big"><div class="row" style="justify-content:space-between;align-items:baseline"><h2 style="margin:0">Twój zeszyt w kratkę</h2>' + (masteredN ? '<span class="muted">opanowane: ' + masteredN + '</span>' : '') + '</div><p class="small muted" style="margin:6px 0 4px">Każdy kwadracik to jedna umiejętność. Pełny kolor – opanowana.</p><p class="dzhint"><span aria-hidden="true">👆</span> <span><b>Kliknij nazwę działu</b>, żeby zobaczyć jego tematy i wybrać, co ćwiczyć.</span></p><div class="cells">';
    MP.DZIALY.forEach(dz => {
      const cells = []; let dOk = 0, dAll = 0;
      dz.topics.forEach(tp => tp.skills.forEach(id => {
        const s = S.skills[id]; const tip = dz.name + '\n' + tp.name + (tp.name !== skName(id) ? '\n• ' + skName(id) : '');
        if (!MP.isReady(id)) { cells.push('<i class="cell plan" data-tip="' + esc(tip + '\nćwiczenia w przygotowaniu') + '"></i>'); return; }
        dAll++; if (known(s)) dOk++;
        const ks = skState(id), sl = simple(id);
        cells.push('<button class="cell l' + sl + (s && (s.needsReview || E.isDue(s, t)) ? ' rv' : '') + (ks.k === 'locked' ? ' lk' : ks.k === 'stuck' ? ' st' : '') + '" data-topic="' + tp.id + '" data-tip="' + esc(tip + '\n' + SIMPLE[sl] + (ks.k === 'locked' ? '\n🔒 najpierw: ' + skName(ks.root) : ks.k === 'stuck' ? '\nćwiczymy to inaczej' : '') + (s && (s.needsReview || E.isDue(s, t)) ? ' · czeka na powtórkę' : '')) + '" aria-label="' + esc(dz.name + ', ' + skName(id) + ', ' + SIMPLE[sl]) + '"></button>');
      }));
      const dt = E.dzialTest(S, dz);
      h += '<div class="drow"><button type="button" class="dn" data-dzial="' + dz.id + '" aria-label="Otwórz dział: ' + esc(dz.name) + ' (opanowane ' + dOk + ' z ' + dAll + ')"><span class="dnw"><span class="dnt">' + esc(dz.name) + '</span>' + (dt.passed ? '<span class="dzbadge ok">✓ zaliczony</span>' : dt.ready ? '<span class="dzbadge rd">gotowy do testu</span>' : '') + '</span><span class="arr" aria-hidden="true">›</span><small>' + dOk + '/' + dAll + '</small></button><div class="sq">' + cells.join('') + '</div></div>';
    });
    h += '</div><div class="legend"><span><i style="background:var(--l0)"></i>nowe</span><span><i style="background:var(--l3)"></i>ćwiczę</span><span><i style="background:var(--l5)"></i>opanowane</span><span><i style="outline:2px solid var(--coral)"></i>czeka na powtórkę</span><span><i class="lkl"></i>zablokowane – najpierw podstawy</span></div></section>';
    // tydzień jak w kalendarzu: od poniedziałku do niedzieli
    const DN = ['pn', 'wt', 'śr', 'cz', 'pt', 'sb', 'nd'], dow = (new Date(t).getDay() + 6) % 7;
    const cw = DN.map((nm, i) => { const tt = t + (i - dow) * E.DAY, k = E.dayKey(tt); return { nm, k, n: (S.days[k] || {}).n || 0, today: i === dow, fut: i > dow }; });
    const todayUp = ready.filter(id => { const s0 = S.skills[id]; return s0 && s0.mastery && E.dayKey(s0.mastery.at) === E.dayKey(t); }).length;
    h += '<section class="grid3" style="margin-top:16px">';
    h += '<div class="card stat"><b>' + todayN + '</b><span>' + U.pl(todayN, 'zadanie', 'zadania', 'zadań') + ' dzisiaj</span><span class="small">' + (todayUp ? 'dziś opanowane: ' + todayUp + ' 🎉' : todayN ? 'każde zadanie się liczy' : 'zaczniemy?') + '</span></div>';
    h += '<div class="card stat"><b>' + masteredN + '</b><span>' + U.pl(masteredN, 'umiejętność opanowana', 'umiejętności opanowane', 'umiejętności opanowanych') + '</span><span class="small">' + (prog ? 'w trakcie: ' + prog : '') + (due.length ? (prog ? ' · ' : '') + 'do powtórki: ' + due.length : '') + '</span></div>';
    h += '<div class="card stat"><b>' + st.current + ' ' + U.pl(st.current, 'dzień', 'dni', 'dni') + '</b><span>seria nauki' + (st.best > st.current ? ' (najdłuższa: ' + st.best + ')' : '') + '</span><div class="week2" aria-label="ten tydzień">' + cw.map(d => '<i class="' + (d.n ? 'on ' : '') + (d.today ? 'today ' : '') + (d.fut ? 'fut' : '') + '" title="' + (d.today ? 'dziś' : d.k) + ': ' + d.n + ' ' + U.pl(d.n, 'zadanie', 'zadania', 'zadań') + '">' + d.nm + '</i>').join('') + '</div><span class="small muted">Cel: 3 dni nauki w tygodniu (' + Math.min(3, cw.filter(d => d.n).length) + '/3)</span></div>';
    h += '</section>';
    // do pracy – te same dane co przycisk „następny krok”
    const needWork = ready.filter(id => { const s = S.skills[id]; return s && (s.stuck || s.needsReview || (s.n >= 3 && s.lvl <= 2)); }).sort((a, b) => (S.skills[b].stuck ? 1 : 0) - (S.skills[a].stuck ? 1 : 0)).slice(0, 5);
    h += '<section class="grid2" style="margin-top:16px"><div class="card"><h3>Wymaga dodatkowej pracy</h3>' + (needWork.length ? '<div class="list">' + needWork.map(id => skillRow(id)).join('') + '</div>' : '<p class="muted">Na razie nic. Jeśli coś będzie sprawiać trudność, pojawi się tutaj – i razem to rozpracujemy.</p>') + '</div>';
    h += '<div class="card"><h3>Warto wrócić</h3>' + (due.length ? '<div class="list">' + due.slice(0, 5).map(id => skillRow(id, true)).join('') + '</div>' : '<p class="muted">Gdy coś opanujesz, za jakiś czas poproszę o krótką powtórkę – tak wiedza zostaje na dłużej.</p>') + '</div></section>';
    // odznaki
    const earned = E.BADGES.filter(b => S.badges[b.id]), locked = E.BADGES.filter(b => !S.badges[b.id]).slice(0, 4);
    h += '<section class="card" style="margin-top:16px"><h3>Odznaki</h3><div class="badges">' + earned.map(b => '<span class="badge" title="' + esc(b.desc) + '"><span class="ico">★</span>' + esc(b.name) + '</span>').join('') + locked.map(b => '<span class="badge off" title="' + esc(b.desc) + '"><span class="ico">?</span>' + esc(b.desc) + '</span>').join('') + '</div></section>';
    return h;
  }
  function skillRow(id, review) {
    const s = S.skills[id] || { lvl: 0 }; const tp = topicOf(id);
    return '<button class="li" data-learn="' + id + '"' + (review ? ' data-mode="review"' : '') + '><span class="t"><b>' + esc(skName(id)) + '</b><small>' + esc(tp ? tp.name : '') + ' · ' + skillStatusTxt(id) + (s.needsReview ? ' · były ostatnio pomyłki' : '') + '</small></span><span class="arr" aria-hidden="true">→</span></button>';
  }

  // ---------- DZIAŁY ----------
  function vDzialy() {
    const rec = E.recommend(S, now()); const recDz = rec.skill && topicOf(rec.skill) ? topicOf(rec.skill).dzial : null;
    let h = '<h1>Działy – ' + MP.GRADES[MP.grade].name.toLowerCase() + '</h1><p class="muted">' + ({ 1: 'Edukacja matematyczna w klasie 1 według nowej podstawy programowej (od 2026/2027).', 2: 'Edukacja matematyczna w klasie 2 według podstawy programowej.', 3: 'Edukacja matematyczna w klasie 3 według podstawy programowej.', 4: 'Matematyka w klasie 4 według nowej podstawy programowej (od 2026/2027), z przypomnieniami z klas 1–3.', 5: 'Materiał klasy 5 według podstawy programowej, z przypomnieniami z klasy 4.', 6: 'Materiał klasy 6 według podstawy programowej, z potrzebnymi przypomnieniami z klas 4–5.', 7: 'Materiał klasy 7 według podstawy programowej, z przypomnieniami z klas 4–6.', 8: 'Materiał klasy 8 według podstawy programowej – także przygotowanie do egzaminu ósmoklasisty.' })[MP.grade] + ' Możesz wybrać dowolny dział – podświetlony jest ten, od którego proponuję zacząć.</p><div class="dz">';
    MP.DZIALY.forEach(dz => {
      const st = E.dzialStatus(S, dz, now());
      h += '<button class="dzc' + (dz.id === recDz ? ' rec' : '') + '" data-dzial="' + dz.id + '"><span class="row"><span class="ic">' + esc(dz.icon) + '</span><b style="flex:1">' + esc(dz.name) + '</b></span>' + meter(st.pct) + '<span class="small muted">' + dz.topics.length + ' ' + U.pl(dz.topics.length, 'temat', 'tematy', 'tematów') + (st.ready < st.total ? ' · ćwiczenia w ' + st.ready + ' z nich' : '') + (st.done ? ' · opanowane: ' + st.done : '') + '</span>' + (st.review ? '<span class="chip review">coś czeka na powtórkę</span>' : '') + (dz.id === recDz ? '<span class="chip progress">polecany następny krok</span>' : '') + '</button>';
    });
    return h + '</div>';
  }
  function vDzial(id) {
    const dz = MP.DZIALY.find(d => d.id === id); const rec = E.recommend(S, now()); const recT = rec.skill ? MP.SKILL_TOPIC[rec.skill] : null;
    const dt = E.dzialTest(S, dz);
    let h = '<div class="crumbs"><button data-go2="start">← Strona główna</button></div><h1>' + esc(dz.name) + '</h1><p class="small muted">Podstawa programowa: ' + dz.pp + '</p>';
    if (dt.passed) h += '<div class="fb ok" style="margin-bottom:12px"><b>✓ Dział zaliczony</b>' + (dt.last && dt.last.pct && !dt.last.legacy ? ' – test działu: ' + dt.last.pct + '%' : '') + '.</div>';
    else if (dt.ready) h += '<section class="nextstep"><div><span class="lbl">Wszystko przećwiczone</span><h2>Test działu</h2><span class="small">Bez zdanego testu dział nie jest jeszcze w pełni zaliczony.</span></div><button class="btn" data-act="chtest" data-dz="' + dz.id + '">Zaczynam test →</button></section>';
    else h += '<p class="small muted">Na koniec działu czeka krótki test z całości – pojawi się, gdy wszystkie umiejętności będą przećwiczone.</p>';
    h += '<div class="list">';
    dz.topics.forEach((tp, i) => {
      const st = E.topicStatus(S, tp, now());
      const pills = tp.skills.filter(MP.isReady).map(sid => '<button class="pill" data-learn="' + sid + '">' + (skillStatusTxt(sid) === 'opanowane ✓' ? '✓ ' : '') + esc(skName(sid)) + ' <span aria-hidden="true">→</span></button>').join('');
      h += '<div class="tblock' + (tp.id === recT ? ' rec' : '') + '"><button class="li" data-topicgo="' + tp.id + '"><span class="t"><b>' + (i + 1) + '. ' + esc(tp.name) + '</b><small>klasa ' + tp.grade + ' · ' + tp.skills.length + ' ' + U.pl(tp.skills.length, 'umiejętność', 'umiejętności', 'umiejętności') + (tp.id === recT ? ' · <b style="display:inline">polecany następny krok</b>' : '') + '</small></span>' + chip(st) + '<span style="width:90px">' + meter(st.pct) + '</span></button>' + (pills ? '<div class="pills"><span class="small muted">Ćwicz:</span>' + pills + '</div>' : '') + '</div>';
    });
    return h + '</div>';
  }

  // ---------- TEMAT ----------
  function vTopic(id) {
    const tp = MP.TOPICS[id], dz = MP.DZIALY.find(d => d.id === tp.dzial), st = E.topicStatus(S, tp, now());
    const ready = tp.skills.filter(MP.isReady);
    let h = '<div class="crumbs"><button data-go2="start">Strona główna</button> › <button data-dzial="' + dz.id + '">' + esc(dz.name) + '</button> ›</div>';
    h += '<div class="row" style="justify-content:space-between"><h1 style="margin:0">' + esc(tp.name) + '</h1>' + chip(st) + '</div><p class="small muted">Klasa ' + tp.grade + ' · podstawa programowa: ' + tp.pp + '</p>';
    // --- wyróżniony pas: umiejętności do ćwiczenia ---
    const lv = (sid) => ((S.skills[sid] || {}).lvl || 0);
    const doneN = ready.filter(x => lv(x) >= 4).length;
    h += '<section class="skband" aria-labelledby="skh"><div class="skhead"><div><span class="sklbl">Ćwiczenia</span><h2 id="skh">Umiejętności w tym temacie</h2></div>' + (ready.length ? '<span class="skcount">opanowane: ' + doneN + ' z ' + ready.length + '</span>' : '') + '</div><div class="skgrid">';
    tp.skills.forEach((sid, i) => {
      const s = S.skills[sid] || { lvl: 0 };
      if (!MP.isReady(sid)) { h += '<div class="skcard soon"><span class="sknum">' + (i + 1) + '</span><b>' + esc(skName(sid)) + '</b><span class="small muted">Ćwiczenia do tej umiejętności są jeszcze w przygotowaniu.</span><span class="chip soon">wkrótce</span></div>'; return; }
      const due = s.l4At && (E.isDue(s, now()) || s.needsReview);
      const ks = skState(sid);
      if (ks.k === 'locked') { h += '<div class="skcard locked"><span class="sknum">🔒</span><b>' + esc(skName(sid)) + '</b><span class="small">Najpierw przećwicz: <b>' + esc(skName(ks.root)) + '</b></span><span class="row" style="gap:6px"><button class="btn sm pri" data-learn="' + ks.root + '">Ćwicz podstawę</button></span></div>'; return; }
      if (ks.k === 'stuck') { h += '<div class="skcard stuck"><span class="sknum">↺</span><b>' + esc(skName(sid)) + '</b><span class="small muted">Ćwiczymy to inaczej, zanim pójdziemy dalej.</span><span class="row" style="gap:6px"><button class="btn sm hl" data-act="repair" data-skill="' + sid + '">Ćwiczę →</button></span></div>'; return; }
      const label = !s.n ? 'Zacznij' : due ? 'Powtórz' : (s.mastery || s.l4At) ? 'Poćwicz jeszcze' : 'Ćwicz dalej';
      const note = s.needsReview ? 'były ostatnio pomyłki – warto powtórzyć' : s.next && s.l4At ? 'powtórka ' + (s.next <= now() ? 'teraz' : 'za ' + Math.ceil((s.next - now()) / E.DAY) + ' dni') : (s.n ? 'rozwiązanych zadań: ' + s.n : 'jeszcze nie ćwiczone');
      h += '<button class="skcard' + (due ? ' due' : '') + (s.lvl >= 5 ? ' done' : '') + '" data-learn="' + sid + '"' + (due ? ' data-mode="review"' : '') + '><span class="sknum">' + ((s.mastery || s.l4At) ? '✓' : i + 1) + '</span><b>' + esc(skName(sid)) + '</b><span class="sklev"><span>' + skillStatusTxt(sid) + '</span></span><span class="small muted">' + note + '</span><span class="btn ' + (due ? 'hl' : 'pri') + ' sm skgo">' + label + ' →</span></button>';
    });
    h += '</div>';
    if (ready.length) h += '<div class="skfoot"><button class="btn hl" data-act="check" data-topic-id="' + tp.id + '">Sprawdź się – bez podpowiedzi</button><span class="small">Zadania w różnych wariantach, bez wskazówek – pokazują, czy rozumiesz temat, a nie tylko pamiętasz jedno zadanie.</span></div>';
    h += '</section>';
    // --- teoria ---
    h += '<div class="grid2" style="margin-top:20px"><div class="stack"><section class="card"><h2>Na czym to polega</h2>' + M(tp.explain) + '</section>';
    if (tp.examples && tp.examples.length) h += '<section class="card"><h2>Przykłady krok po kroku</h2>' + tp.examples.map((ex, i) => '<div class="ex" data-ex="' + i + '"><b>' + M(ex.t) + '</b><ol>' + ex.s.map((x, j) => '<li class="' + (j ? 'hid' : '') + '">' + M(x) + '</li>').join('') + '</ol>' + (ex.s.length > 1 ? '<button class="btn sm" data-act="exstep">Pokaż kolejny krok</button>' : '') + '</div>').join('') + '</section>';
    h += '</div><div class="stack">';
    if (tp.mistakes && tp.mistakes.length) h += '<section class="card"><h2>Na co uważać</h2><ul class="mist">' + tp.mistakes.map(m => '<li>' + M(m) + '</li>').join('') + '</ul></section>';
    h += '<section class="card"><h2>Po tym temacie umiesz</h2><ul class="mist">' + tp.summary.map((x, i) => { const sid = ready[i]; const ok = sid && lv(sid) >= 4; return '<li>' + (ok ? '✓ ' : '') + M(x) + '</li>'; }).join('') + '</ul></section></div></div>';
    return h;
  }

  // ---------- LEKCJA ----------
  function startLesson(opts, from) {
    if (opts.mode === 'learn' && opts.skill) {
      const st = S.skills[opts.skill];
      if (st && st.stuck) opts = { mode: 'repair', skill: opts.skill };
      else if (E.gateBlockers(S, opts.skill).length && !(st && (st.mastery || st.l4At))) return go('locked', { skill: opts.skill, from: from || view.name });
    }
    if (S.session && !S.session.done) E.endSession(S, now());
    E.startSession(S, opts, now()); S.session.cur = null; S.session.from = from || view.name;
    advance(); save();
    if (!S.session) return render();
    go('lesson', { from: TOP[from] ? from : (from === 'sprawdzian' ? 'sprawdzian' : 'start') });
  }
  function startChtest(dzId) {
    const dz = MP.DZIALY.find(x => x.id === dzId); if (!dz) return;
    const specs = E.chtestSpecs(S, dzId); if (!specs.length) return;
    startLesson({ mode: 'chtest', fixed: specs, dz: dzId, title: 'Test działu: ' + dz.name }, 'start');
    if (S.session) { S.session.dz = dzId; S.session.queue.unshift({ kind: 'card', card: 'chtest', dz: dzId, n: specs.length }); advance(); save(); render(); }
  }
  function advance() {
    const s = S.session; if (!s) return;
    const spec = E.nextStep(S, now());
    if (!spec) { s.cur = null; return finishSession(); }
    if (spec.kind === 'card') { s.cur = { card: spec }; }
    else { s.cur = { spec, attempts: 0, hints: 0, solShown: false, t0: now(), tl: now(), resp: null, fb: null, recorded: false, done: false }; }
  }
  function finishSession() {
    const s = S.session; const mode = s.mode; const prepPhase = S.prep && S.prep.phase;
    const sum = E.endSession(S, now());
    if (mode === 'placement') { E.applyPlacement(S, sum.results); S.welcomed = true; }
    if (mode === 'mastery') sum.test = E.masteryResult(S, sum.results, now());
    if (mode === 'repair') sum.repair = E.repairResult(S, sum.results, now());
    if (mode === 'chtest') { sum.dz = s.dz; sum.ch = E.chtestResult(S, s.dz, sum.results, now()); }
    if (mode === 'diag' && S.prep) { E.prepMakePlan(S, sum.results); }
    if (mode === 'prep' && S.prep) E.prepAfterSession(S, sum);
    if (mode === 'check' && S.prep && s.prepCheck) { S.prep.checks.push({ t: now(), pct: Math.round(sum.ok / Math.max(1, sum.n) * 100) }); }
    save(); sum.badges = badgesCheck(true).map(b => b.name);
    view = { name: 'summary', from: view.from, sum };
  }
  function curItem() { const c = S.session && S.session.cur; if (!c || !c.spec) return null; if (!c._item) Object.defineProperty(c, '_item', { value: E.buildItem(c.spec), enumerable: false, writable: true }); return c._item; }
  function modeTag(s, spec) {
    if (spec && spec.analog) return 'Podobne zadanie – spróbuj jeszcze raz';
    if (spec && spec.probe) return 'Szybkie przypomnienie';
    if (spec && spec.detour) return 'Powtórka podstaw';
    if (spec && spec.interleave) return 'Krótka powtórka';
    if (spec && spec.diag) return 'Zadanie diagnostyczne';
    return { chtest: 'Test działu – bez podpowiedzi', mastery: 'Test opanowania – bez podpowiedzi', repair: 'Ścieżka naprawcza', learn: 'Nauka', review: 'Powtórka', check: 'Sprawdź się – bez podpowiedzi', diag: 'Test diagnostyczny', placement: 'Test na start', prep: 'Przygotowanie do sprawdzianu', mixed: 'Powtórka' }[s.mode] || '';
  }
  function vLesson() {
    const s = S.session;
    if (!s) return '<p>Brak aktywnej lekcji.</p><button class="btn pri" data-go2="start">Na start</button>';
    if (!s.cur) advance();
    if (!S.session) return vSummary();
    const c = s.cur;
    const total = s.fixed ? s.fixed.length : s.max;
    const counted = s.results.filter(r => !r.detour && !r.probe && !r.analog);
    const pendingAnalog = (s.queue || []).some(q => q.analog) || !!(c && c.spec && c.spec.analog && !c.done);
    const doneN = Math.max(0, counted.length - (pendingAnalog ? 1 : 0));
    const dots = Array.from({ length: total }, (_, i) => '<i class="' + (i < doneN ? 'ok' : i === doneN ? 'cur' : '') + '"></i>').join('');
    let h = '<div class="lesson"><div class="lhead"><button class="btn sm ghost" data-act="pause" title="Postęp zostanie zapisany">✕ Przerwij</button><div class="dots" aria-label="postęp lekcji">' + (s.fixed && (s.mode === 'diag' || s.mode === 'placement') ? Array.from({ length: total }, (_, i) => '<i class="' + (i < s.step ? 'ok' : i === s.step ? 'cur' : '') + '"></i>').join('') : dots) + '</div></div>';
    if (c.pauseAsk) { const n = s.results.length; return h + '<section class="bigcard"><h2>Chcesz zrobić przerwę?</h2><p>' + (s.fixed ? 'Odpowiedzi są zapisane – dokończysz test później w tym samym miejscu.' : 'Twoje odpowiedzi (' + n + ') są już zapisane i liczą się do postępów – niczego nie tracisz.') + '</p><div class="bar2"><button class="btn pri" data-act="pauselater">Dokończę później</button>' + (s.fixed ? '' : '<button class="btn" data-act="pausefinish">Zakończ lekcję teraz</button>') + '<button class="btn ghost" data-act="pausecancel">Wracam do zadania</button></div><p class="small muted">„Dokończę później” – na ekranie głównym pojawi się przycisk, żeby wrócić w to samo miejsce. „Zakończ lekcję teraz” – zobaczysz podsumowanie tego, co już zrobione.</p></section></div>'; }
    if (c.card) return h + vCard(c.card) + '</div>';
    const it = curItem(), spec = c.spec;
    h += '<section class="card task"><div class="tag"><span class="chip">' + esc(modeTag(s, spec)) + '</span><span>' + esc(skName(spec.skill)) + '</span><span title="trudność zadania">' + '●'.repeat(spec.d) + '○'.repeat(3 - spec.d) + '</span>' + (it.theme ? '<span class="chip thchip">' + MP.THEMES[it.theme].ico + ' ' + esc(MP.THEMES[it.theme].name) + '</span>' : '') + (MP.grade <= 3 && window.speechSynthesis ? '<button class="btn sm ghost speak" data-act="speak" aria-label="Przeczytaj polecenie na głos">🔊 Przeczytaj</button>' : '') + '</div>';
    h += '<div class="q">' + M(it.prompt) + '</div>' + (it.visual || '');
    if (it.type === 'error') h += '<ol class="steps">' + it.steps.map(x => '<li>' + M(x) + '</li>').join('') + '</ol>';
    h += '<div class="answer" id="ans">' + answerWidget(it, c) + '</div>';
    if (it.writeUp && !c.done) h += '<details style="margin-top:12px"><summary>Zapisz swoje rozwiązanie (nieobowiązkowe)</summary><p class="small muted">Napisz, jak liczysz – krok po kroku. Komputer sprawdza wynik, a rodzic może przeczytać Twój sposób.</p><textarea id="wu" placeholder="Np. Najpierw liczę… potem…">' + esc(c.wu || '') + '</textarea></details>';
    h += '<div class="bar2">' + lessonButtons(it, c, s) + '</div>';
    if (c.hints && s.hintsAllowed) h += helperSay('<div class="hints">' + it.hints.slice(0, Math.min(c.hints, 3)).map((x, i) => '<div class="hint"><b>Wskazówka ' + (i + 1) + ':</b> ' + M(x) + '</div>').join('') + '</div>', 'think', true);
    if (c.solShown) h += '<div class="sol" style="margin-top:12px"><b>Rozwiązanie krok po kroku</b><ol>' + it.sol.map(x => '<li>' + M(x) + '</li>').join('') + '</ol></div>';
    if (c.fb) h += fbWithHelper(c.fb);
    h += '</section></div>';
    return h;
  }
  function lessonButtons(it, c, s) {
    if (c.done) return '<button class="btn pri" data-act="next" id="nextbtn">Dalej →</button>';
    let b = '';
    const needCheck = ['input', 'fill', 'multi', 'choice', 'why', 'error'].includes(it.type) || MP.ix.has(it.type);
    if (needCheck) b += '<button class="btn pri" data-act="checkans">Sprawdź</button>';
    if (s.hintsAllowed) {
      if (c.hints < 3) b += '<button class="btn" data-act="hint">Wskazówka ' + (c.hints + 1) + ' z 3</button>';
      else if (!c.solShown) b += '<button class="btn" data-act="showsol">Pokaż rozwiązanie</button>';
      b += '<button class="btn ghost" data-act="dontknow">' + (c.solShown ? 'Dalej →' : 'Nie wiem – pokaż mi') + '</button>';
    } else if (['check', 'diag', 'placement', 'chtest'].includes(s.mode)) b += '<button class="btn ghost" data-act="dontknow">Nie wiem</button>';
    return b;
  }
  function answerWidget(it, c, examMode, examVal) {
    const disabled = !examMode && c && c.done ? ' disabled' : '';
    const val = examMode ? examVal : (c ? (c.draft != null && !c.done ? c.draft : c.resp) : null);
    if (it.type === 'input' || it.type === 'fill') {
      const stt = !examMode && c ? (c.done ? (c.ok ? 'ok' : 'shown') : (c.wrongNow ? 'no' : '')) : '';
      return MP.mf.render(val || '', Object.assign({ disabled: !!disabled, unit: it.unit, state: stt }, fieldOpts(it)));
    }
    if (it.type === 'choice' || it.type === 'why' || it.type === 'error') {
      return '<div class="opts">' + it.options.map((o, i) => {
        let cls = 'opt'; if (examMode && +val === i) cls += ' sel';
        if (!examMode && c && !c.done && c.sel === i) cls += ' sel';
        if (!examMode && c && c.picked) { if (c.picked.includes(i)) cls += i === it.answer.correct ? ' right' : ' wrong'; if (c.done && i === it.answer.correct) cls += ' right'; }
        return '<button class="' + cls + '" data-opt="' + i + '" aria-pressed="' + (!examMode && c ? c.sel === i : +val === i) + '"' + (!examMode && c && (c.done || (c.picked || []).includes(i)) ? ' disabled' : '') + '>' + M(o.label) + '</button>';
      }).join('') + '</div>';
    }
    if (MP.ix.has(it.type)) {
      const stt = !examMode && c ? (c.done ? (c.ok ? 'ok' : 'shown') : (c.wrongNow ? 'no' : '')) : '';
      return MP.ix.render(it, val, { disabled: !!disabled, state: stt });
    }
    if (it.type === 'order') {
      const seq = val || [];
      return '<p class="small muted">Dotknij po kolei. Aby cofnąć, dotknij elementu w ramce.</p><div class="seq" id="seq">' + (seq.length ? seq.map((k, j) => '<button data-unseq="' + j + '"' + disabled + '>' + M(it.items[k]) + '</button>').join('<span class="muted">→</span>') : '<span class="muted small">tu pojawi się Twoja kolejność</span>') + '</div><div class="ord">' + it.items.map((x, k) => '<button data-seq="' + k + '" class="' + (seq.includes(k) ? 'used' : '') + '"' + (seq.includes(k) ? ' disabled' : disabled) + '>' + M(x) + '</button>').join('') + '</div>';
    }
    if (it.type === 'match') {
      const m = val || {};
      return it.left.map((l, i) => '<div class="mrow"><div class="q" style="font-size:20px">' + M(l) + ' =</div><select data-match="' + i + '"' + disabled + '><option value="">wybierz…</option>' + it.right.map((r, j) => '<option value="' + j + '"' + (m[i] === j ? ' selected' : '') + '>' + U.plain(r) + '</option>').join('') + '</select></div>').join('');
    }
    if (it.type === 'multi') {
      const v = val || [];
      const lens = (it.answer.values || []).map(x => U.plain(U.fmtNum(x)).length);
      if (it.labels.every(l => String(l).length <= 12) && lens.length && lens.every(n => n <= 4)) { // krótkie pola obok siebie, jak tabelka: „dziesiątki | jedności”
        return '<div class="multi tbl" style="max-width:' + (it.labels.length * 112) + 'px">' + it.labels.map((l, i) => '<label><span class="th">' + esc(l) + '</span><input data-multi="' + i + '" inputmode="numeric" autocomplete="off" size="' + Math.max(2, (lens[i] || 2) + 1) + '" data-len="' + (lens[i] || 0) + '" value="' + esc(v[i] || '') + '"' + disabled + '></label>').join('') + '</div>';
      }
      return '<div class="multi">' + it.labels.map((l, i) => '<label>' + esc(l) + '<input data-multi="' + i + '" autocomplete="off" value="' + esc(v[i] || '') + '"' + disabled + '></label>').join('') + '</div>';
    }
    return '';
  }
  // pole odpowiedzi: szerokość i klawisze zależne od tego, czego oczekujemy (bez zdradzania odpowiedzi w klasach 4–8)
  function fieldOpts(it) {
    const a = it.answer || {}, v = a.kind === 'num' ? a.value : null, g = MP.grade || 6;
    const dec = a.form === 'decimal' || !!it.dec, intAns = !!(v && v.d === 1 && Number.isInteger(v.n));
    const fracNeed = !!(v && !intAns && !dec);
    return {
      narrow: intAns && String(Math.abs(v.n)).length <= 5,
      placeholder: intAns && String(Math.abs(v.n)).length <= 5 ? '?' : g <= 3 ? 'wpisz liczbę' : 'wpisz wynik',
      keys: { frac: g >= 4 || fracNeed, mixed: g >= 4 || fracNeed, comma: g >= 5 || dec || !!(v && !Number.isInteger(v.n)), neg: g >= 6 || !!(v && v.n < 0) || !!it.allowNeg }
    };
  }
  function readResp(it) {
    if (it.type === 'input' || it.type === 'fill') return MP.mf.read($app);
    if (MP.ix.has(it.type)) { const s = S.session && S.session.cur; return s ? (s.draft != null ? s.draft : s.resp) : null; }
    if (it.type === 'match') { const o = {}; $app.querySelectorAll('[data-match]').forEach(sel => { if (sel.value !== '') o[+sel.dataset.match] = +sel.value; }); return o; }
    if (it.type === 'multi') return [...$app.querySelectorAll('[data-multi]')].map(x => x.value);
    if (it.type === 'order') return (S.session.cur.resp || []).slice();
    return null;
  }
  function afterLessonRender() {
    const inp = document.getElementById('inp');
    if (inp && !inp.disabled) {
      const pv = document.getElementById('pv');
      MP.mf.bind($app, (v) => { if (S.session && S.session.cur) S.session.cur.draft = v; }, () => onCheck(), (v) => { pv.innerHTML = previewHTML(v); });
    }
    const it = S.session && S.session.cur && S.session.cur.spec ? curItem() : null;
    if (it && MP.ix.has(it.type) && !S.session.cur.done) { const c = S.session.cur; MP.ix.bind($app, it, () => (c.draft != null ? c.draft : c.resp), (v) => { c.draft = v; c.wrongNow = false; const f = $app.querySelector('.fb.info'); if (f) f.remove(); }); }
    const mi = [...$app.querySelectorAll('.multi.tbl [data-multi]')];
    mi.forEach((x, i) => x.addEventListener('input', () => { x.value = x.value.replace(/[^\d,\-−\/ ]/g, ''); const L = +x.dataset.len; if (L && x.value.replace(/\D/g, '').length >= L && mi[i + 1]) mi[i + 1].focus(); }));
    const nb = document.getElementById('nextbtn'); if (nb) nb.focus();
    const wu = document.getElementById('wu'); if (wu) wu.addEventListener('input', () => { S.session.cur.wu = wu.value; });
  }
  function previewHTML(v) {
    if (!String(v).trim() || v === '-') return '';
    if (/\/$|^-?\/|\/$/.test(v) || /\/\s*$/.test(v)) return '<span class="muted">Uzupełnij licznik i mianownik.</span>';
    const p = U.parseNum(v);
    if (!p) return '<span class="muted">Wpisz liczbę, np. 12 albo 0,25 – ułamek zbudujesz przyciskiem ułamka.</span>';
    const sg = p.v.n < 0 ? '−' : '';
    const body = p.kind === 'mixed' ? sg + '[[' + Math.floor(Math.abs(p.v.n) / p.v.d) + ' ' + p.num + '/' + p.den + ']]' : p.kind === 'frac' ? sg + '[[' + p.num + '/' + p.den + ']]' : U.plain(p.raw).replace('.', ',').replace('-', '−');
    return 'Twoja odpowiedź: <b>' + M(body) + '</b>';
  }
  function vCard(card) {
    const tp = card.skill ? topicOf(card.skill) : null;
    if (card.card === 'intro') {
      const ex = tp && tp.examples && tp.examples[0];
      return '<section class="bigcard"><span class="chip">Nowa umiejętność</span><h1 style="margin-top:10px">' + esc(skName(card.skill)) + '</h1>' + (tp ? M(tp.explain) : '') + (ex ? '<div class="ex"><b>Przykład: ' + M(ex.t) + '</b><ol>' + ex.s.map(x => '<li>' + M(x) + '</li>').join('') + '</ol></div>' : '') + '<p class="muted">Zaczniemy od łatwych zadań. W każdej chwili możesz poprosić o wskazówkę.</p><button class="btn pri" data-act="cardnext">Zaczynamy ćwiczenia →</button></section>';
    }
    if (card.card === 'probe') return '<section class="bigcard"><h2>Zanim zaczniemy – krótkie przypomnienie</h2><p>Ten temat korzysta z tego, co było wcześniej: <b>' + card.skills.map(x => esc(skName(x))).join('</b> i <b>') + '</b>. Zrobimy 1–2 zadania, żebym wiedział, czy warto to najpierw powtórzyć. To nie jest test.</p><button class="btn pri" data-act="cardnext">Dobrze →</button></section>';
    if (card.card === 'back') return '<section class="bigcard"><span class="chip done">Podstawy powtórzone</span><h2 style="margin-top:10px">Wracamy do: ' + esc(skName(card.skill)) + '</h2><p>Teraz, gdy mamy przećwiczone <b>' + esc(skName(card.from)) + '</b>, zaczniemy od łatwiejszego zadania i będziemy stopniowo podnosić poziom.</p><button class="btn pri" data-act="cardnext">Jedziemy dalej →</button></section>';
    if (card.card === 'mtest') {
      return '<section class="bigcard"><span class="chip">Test opanowania</span><h1 style="margin-top:10px">' + esc(skName(card.skill)) + '</h1><p>Sprawdzimy, czy naprawdę rozumiesz tę umiejętność – nie tylko jeden rodzaj zadania. Będzie <b>' + card.n + ' ' + U.pl(card.n, 'zadanie', 'zadania', 'zadań') + '</b> w różnych formach:</p><ul class="mist">' + card.aspects.map(a => '<li>' + esc(E.ASPECT_NAMES[a]) + '</li>').join('') + '</ul><p>Bez wskazówek i bez podglądu wyniku – wynik zobaczysz na końcu. Żeby zaliczyć, wszystkie odpowiedzi muszą być dobre. Jeśli coś nie wyjdzie, nic się nie dzieje: pokażę, co poćwiczyć, i spróbujemy jeszcze raz na nowych zadaniach.</p><button class="btn pri" data-act="cardnext">Zaczynam test →</button></section>';
    }
    if (card.card === 'chtest') { const dz = MP.DZIALY.find(x => x.id === card.dz) || { name: '' }; return '<section class="bigcard"><span class="chip">Test działu</span><h1 style="margin-top:10px">' + esc(dz.name) + '</h1><p>Wszystko z tego działu jest już przećwiczone. Teraz krótki test: <b>' + card.n + ' ' + U.pl(card.n, 'zadanie', 'zadania', 'zadań') + '</b> z całego działu, bez wskazówek. Jeśli czegoś nie wiesz, kliknij „Nie wiem”.</p><p>Na końcu zobaczysz swoje odpowiedzi. Po zdanym teście dział jest w pełni zaliczony. A jeśli coś nie wyjdzie, powtórzymy to i spróbujesz jeszcze raz.</p><button class="btn pri" data-act="cardnext">Zaczynam test →</button></section>'; }
    if (card.card === 'diag') return '<section class="bigcard"><h2>Sprawdźmy, gdzie jest kłopot</h2><p>Twoje ostatnie odpowiedzi trudno mi zrozumieć – nie chcę zgadywać, co poszło nie tak. W następnym zadaniu wybierz odpowiedź z kilku. Każda błędna odpowiedź odpowiada innej pomyłce, więc po niej będę wiedział, jak Ci pomóc.</p><button class="btn pri" data-act="cardnext">Dobrze →</button></section>';
    if (card.card === 'repair') {
      const er = card.code ? MP.err(card.code) : null; const it0 = (() => { try { return E.buildItem(E.makeSpec(card.skill, 1, (SK[card.skill].types[1] || ['input'])[0])); } catch (e) { return null; } })();
      let h = '<section class="bigcard remed"><span class="chip">Ścieżka naprawcza · runda ' + card.round + '</span><h2 style="margin-top:10px">' + esc(skName(card.skill)) + '</h2>';
      if (card.rkind === 'calc') h += '<p><b>Zasadę rozumiesz</b> – kłopot był w samym liczeniu. Nie wracamy do tłumaczenia. Zrobimy kilka zadań rachunkowych w spokojnym tempie. Rada: zapisuj każdy krok i na końcu sprawdź wynik działaniem odwrotnym.</p>';
      else if (card.rkind === 'read') h += '<p>Kłopot był w <b>czytaniu polecenia</b>. Przy każdym zadaniu: przeczytaj je dwa razy, podkreśl, o co pytają, i na końcu sprawdź, czy odpowiedź pasuje do pytania.</p>';
      else if (card.rkind === 'aspect' && card.target) h += '<p>Obliczenia idą Ci dobrze, ale trudniej było w zadaniach typu: <b>' + esc(E.ASPECT_NAMES[card.target]) + '</b>. Poćwiczymy właśnie takie.</p>';
      else {
        h += '<p>Wracamy do tej umiejętności, bo pojawił się kłopot: <b>' + esc(er ? er.title.toLowerCase() : 'trudność z zasadą') + '</b>. Tym razem spróbujemy inaczej.</p>';
        // strategia zależna od rundy: 1 – inne wyjaśnienie + rysunek; 2 – rozwiązany przykład krok po kroku + inna reprezentacja; 3+ – powrót do podstaw
        if (card.round === 1) { if (er && (er.alt || er.kid)) h += '<div class="fb info"><b>Inaczej:</b> ' + M(er.alt || er.kid) + '</div>'; const vz = it0 ? MP.viz.forItem(it0, card.code) : null; if (vz) h += '<div class="fbviz"><b>Zobacz to na rysunku</b>' + vz.html + '</div>'; }
        else { if (it0) h += '<div class="ex"><b>Rozwiązany przykład – krok po kroku:</b><div class="q" style="font-size:20px">' + M(it0.prompt) + '</div>' + (it0.visual || '') + '<ol>' + it0.sol.map((x, j) => '<li class="' + (j ? 'hid' : '') + '">' + M(x) + '</li>').join('') + '</ol>' + (it0.sol.length > 1 ? '<button class="btn sm" data-act="exstep">Pokaż kolejny krok</button>' : '') + '</div>'; const vz = it0 ? MP.viz.forItem(it0, card.code, 'line') : null; if (vz) h += '<div class="fbviz"><b>Ta sama zasada na osi liczbowej</b>' + vz.html + '</div>'; }
        if (card.round >= 2 && er && er.remedy && er.remedy !== card.skill) h += '<p>Najpierw kilka zadań z podstawy: <b>' + esc(skName(er.remedy)) + '</b>.</p>';
      }
      h += '<p class="small muted">Plan: najpierw łatwe zadania (ze wskazówkami), potem trudniejsze – aż zaczną wychodzić samodzielnie.</p>';
      return h + '<button class="btn pri" data-act="cardnext">Zaczynamy →</button></section>';
    }
    if (card.card === 'remed') {
      const er = MP.err(card.code || 'unknown');
      let h = '<section class="bigcard remed"><h2>Zatrzymajmy się na chwilę</h2>';
      if (card.reason === 'probe') h += '<p>Ten temat korzysta z umiejętności <b>' + esc(skName(card.skill)) + '</b>. Zróbmy kilka zadań na rozgrzewkę – to ułatwi resztę lekcji.</p>';
      else h += '<p>' + (NM() ? esc(NM()) + ', w' : 'W') + 'idzę, że kilka razy pojawił się ten sam kłopot: <b>' + esc(er.title.toLowerCase()) + '</b>. To bardzo częsta pomyłka – spróbujmy spojrzeć na to inaczej.</p>';
      const altTxt = er.alt || (card.reason === 'probe' && tp ? null : er.kid);
      if (altTxt) h += '<div class="fb info"><b>Inaczej:</b> ' + M(altTxt) + '</div>';
      if (card.reason === 'probe' && tp) h += '<div class="ex">' + M(tp.explain) + '</div>';
      // przykład krok po kroku wygenerowany na nowo (łatwy)
      const exSkill = card.reason === 'probe' ? card.skill : card.skill;
      try {
        const sp = E.makeSpec(exSkill, 1, (SK[exSkill].types[1] || ['input'])[0]); const ex = E.buildItem(sp);
        h += '<div class="ex"><b>Zobacz na przykładzie:</b><div class="q" style="font-size:18px">' + M(ex.prompt) + '</div>' + (ex.visual || '') + '<ol>' + ex.sol.map((x, j) => '<li class="' + (j ? 'hid' : '') + '">' + M(x) + '</li>').join('') + '</ol>' + (ex.sol.length > 1 ? '<button class="btn sm" data-act="exstep">Pokaż kolejny krok</button>' : '') + '</div>';
      } catch (e) { }
      if (card.remedy) h += '<p>Najpierw krótko przećwiczymy <b>' + esc(skName(card.remedy)) + '</b> – to podstawa tego tematu. Potem wrócimy, zaczynając od łatwiejszych zadań.</p>';
      else if (card.reason !== 'probe') h += '<p>Teraz kilka łatwiejszych zadań, a potem stopniowo trudniejsze.</p>';
      return h + '<button class="btn pri" data-act="cardnext">Dobrze, ćwiczymy →</button></section>';
    }
    return '<button class="btn pri" data-act="cardnext">Dalej</button>';
  }

  function noteResult(c, resp) { const s = S.session; const r = s && s.results[s.results.length - 1]; if (r && !r.spec) { r.spec = { skill: c.spec.skill, d: c.spec.d, type: c.spec.type, seed: c.spec.seed, th: c.spec.th }; r.resp = resp; } }
  // odczytanie intencji: „22, 24, 26” (wypisane liczby zamiast ich liczby), „… czyli 5”, „5 zł”, „pięć”
  const NUMW = { zero: 0, jeden: 1, jedna: 1, dwa: 2, dwie: 2, trzy: 3, cztery: 4, 'pięć': 5, 'sześć': 6, siedem: 7, osiem: 8, 'dziewięć': 9, 'dziesięć': 10, jedenaście: 11, dwanaście: 12, trzynaście: 13, czternaście: 14, 'piętnaście': 15, szesnaście: 16, siedemnaście: 17, osiemnaście: 18, 'dziewiętnaście': 19, dwadzieścia: 20, trzydzieści: 30, czterdzieści: 40, 'pięćdziesiąt': 50, 'sześćdziesiąt': 60, siedemdziesiąt: 70, osiemdziesiąt: 80, 'dziewięćdziesiąt': 90, sto: 100 };
  function intent(it, raw) {
    let t = String(raw || '').toLowerCase().replace(/−/g, '-').trim(); if (!t) return { raw };
    const words = t.match(/[a-ząćęłńóśźż]+/g) || [];
    const m = t.match(/(?:czyli|razem|=|to)\s*(-?[\d\s,\/]+|[a-ząćęłńóśźż ]+)\s*$/); // „… czyli 5”
    if (m) return { raw: intent(it, m[1]).raw, via: 'czyli' };
    if (words.length && words.every(w => NUMW[w] !== undefined)) { const n = words.reduce((a, w) => a + NUMW[w], 0); return { raw: String(n), via: 'słownie' }; }
    t = t.replace(/\s*(zł|gr|cm|mm|dm|m|km|kg|g|l|ml|min|h|°c|°|szt|zadań|liczb|razy)\.?$/, ''); // jednostka po liczbie
    const nums = t.split(/,\s+|\s+|;|,(?=\d+,)/).filter(Boolean);
    const isList = (nums.length >= 2 && nums.every(x => /^-?\d+$/.test(x)) && (/,\s|\s/.test(t) || (t.match(/,/g) || []).length >= 2));
    if (isList) return { raw: t, list: nums.map(Number) };
    return { raw: t };
  }
  function onCheck(optIdx) {
    const s = S.session, c = s && s.cur; if (!c || !c.spec || c.done) return;
    const it = curItem();
    if (optIdx === undefined && ['choice', 'why', 'error'].includes(it.type)) { if (c.sel === undefined || c.sel === null) { c.fb = '<div class="fb info">Zaznacz odpowiedź, a potem kliknij „Sprawdź".</div>'; return rerenderLesson(); } optIdx = c.sel; }
    let resp = optIdx !== undefined ? optIdx : readResp(it);
    if (optIdx === undefined && (it.type === 'input' || it.type === 'fill') && it.answer && it.answer.kind === 'num') {
      const ii = intent(it, resp);
      if (ii.list) { // dziecko wypisało liczby zamiast podać ich liczbę – to dobry krok, nie błąd
        const want = it.answer.value, isCount = /^\s*(ile|policz)/i.test(U.plain(it.prompt)) && want && want.d === 1;
        const good = isCount && (it.countOf ? ii.list.length === it.countOf.length && ii.list.every(x => it.countOf.includes(x)) : ii.list.length === want.n);
        c.resp = resp; c.fb = '<div class="fb info">' + (good ? '<b>Dobrze wypisane!</b> A ile ich jest? Policz je i wpisz jedną liczbę.' : isCount ? 'Wpisz jedną liczbę – <b>ile</b> ich jest.' : 'Wpisz tylko jedną liczbę – wynik.') + '</div>'; return rerenderLesson();
      }
      if (ii.via) resp = ii.raw;
    }
    if (MP.ix.has(it.type) && optIdx === undefined) { const msg = MP.ix.incomplete(it, resp); if (msg) { c.fb = '<div class="fb info">' + msg + ' Potem kliknij „Sprawdź".</div>'; return rerenderLesson(); } c.draft = null; }
    if (it.type === 'multi' && resp.some(x => !String(x).trim())) { c.resp = resp; c.fb = '<div class="fb info">Uzupełnij wszystkie pola.</div>'; return rerenderLesson(); }
    const res = I.check(it, resp);
    c.resp = optIdx !== undefined ? c.resp : resp;
    if (res.code === 'format' && (it.type === 'input' || it.type === 'fill')) { const fo = fieldOpts(it); const v = it.answer && it.answer.value; c.fb = '<div class="fb info">' + (fo.narrow ? 'Wpisz jedną liczbę, samymi cyframi.' : v && v.d > 1 && !(it.answer.form === 'decimal' || it.dec) ? 'Wpisz liczbę. Ułamek zbudujesz przyciskiem z kreską ułamkową.' : 'Wpisz jedną liczbę.') + '</div>'; return rerenderLesson(); }
    c.attempts++;
    if (optIdx !== undefined) { c.picked = (c.picked || []).concat([optIdx]); }
    const t = now(); const sec = Math.round((t - c.tl) / 1000); c.tl = t;
    const meta = { skill: c.spec.skill, d: c.spec.d, type: it.type, hints: c.hints, attempt: c.attempts, sec, mode: s.mode, solShown: c.solShown, id: c.spec.skill + '#' + c.spec.type + '#' + c.spec.seed, resp: typeof resp === 'object' && resp !== null ? JSON.stringify(resp).slice(0, 60) : String(resp == null ? '' : resp).slice(0, 40), aspect: it.aspect || E.aspectOf(it) };
    const rec = E.record(S, meta, res, t);
    if (c.attempts === 1) { E.afterAnswer(S, c.spec, rec, t); noteResult(c, meta.resp); }
    if (it.writeUp && c.wu && c.wu.trim()) { S.writeups.push({ t, skill: c.spec.skill, prompt: U.plain(it.prompt).replace(/<[^>]+>/g, ' '), text: c.wu.trim().slice(0, 1500), ok: !!res.ok }); if (S.writeups.length > 60) S.writeups.shift(); c.wu = ''; }
    const fixed = !!s.fixed;
    if (fixed && (s.mode === 'mastery' || s.mode === 'chtest')) { c.done = true; c.fb = '<div class="fb info">Zapisane. Wynik całego testu zobaczysz na końcu.</div>'; save(); return rerenderLesson(); }
    if (fixed) { c.done = true; c.fb = '<div class="fb info">Zapisane. ' + (res.ok ? 'Dobrze!' : 'Do tego wrócimy w planie powtórki.') + '</div>'; save(); return rerenderLesson(); }
    c.wrongNow = !res.ok;
    if (res.ok) {
      c.done = true; c.ok = true;
      const lvlUp = rec.levelAfter > rec.levelBefore && rec.first;
      let fb = '<div class="fb ok"><div class="fbh"><span class="fbi" aria-hidden="true">✓</span><h3>' + (c.solShown ? 'Dobrze przepisane. Teraz już wiesz, jak to zrobić – następne spróbuj samodzielnie.' : c.attempts === 1 && !c.hints ? praise() + ' Samodzielnie!' : c.attempts === 1 && c.hints >= 3 ? 'Jest! Z pomocą wskazówek się udało.' : c.attempts === 1 ? praise() + ' Wskazówka pomogła – i o to chodzi.' : 'Jest! Poprawione – świetnie, że się nie poddajesz.') + '</h3></div>';
      if (rec.review === 'passed') fb += '<p>Pamiętasz to także po przerwie – to najlepszy znak, że naprawdę rozumiesz.</p>';
      if (lvlUp && rec.levelAfter >= 4 && rec.levelBefore < 4) fb += '<p><b>Ta umiejętność jest już opanowana!</b></p>';
      if (it.expl) fb += '<p>' + M(it.expl) + '</p>';
      if (it.why) fb += '<p><b>Dlaczego?</b> ' + M(it.why) + '</p>';
      if (!c.solShown && it.sol && it.sol.length > 1) fb += '<details><summary>Dlaczego tak? Rozwiązanie krok po kroku</summary><ol>' + it.sol.map(x => '<li>' + M(x) + '</li>').join('') + '</ol></details>';
      c.fb = fb + '</div>';
    } else {
      const code = res.code || 'unknown', er = MP.err(code);
      const twoOpt = (it.type === 'choice' || it.type === 'why') && it.options.length - (c.picked || []).length <= 1;
      // eskalacja: ile różnych zadań w tej lekcji miało ten sam błąd
      s.errItems = s.errItems || {}; const iid = c.spec.skill + '#' + c.spec.seed; const lst = s.errItems[code] || (s.errItems[code] = []); if (!lst.includes(iid)) lst.push(iid);
      const level = lst.length; const conceptual = ['zasada', 'wczesniej', 'polecenie'].includes(er.cat) && code !== 'unknown';
      const calc = er.cat === 'rachunek';
      let fb = '<div class="fb no"><div class="fbh"><span class="fbi" aria-hidden="true">↺</span><h3>' + (res.partial ? 'Prawie! Został jeden szczegół.' : 'Jeszcze nie – spróbuj jeszcze raz.') + '</h3></div>';
      fb += '<p>' + M(calc && it.type !== 'input' && it.type !== 'fill' ? 'Przyjrzyj się jeszcze raz – policz krok po kroku.' : calc ? 'Sposób wygląda dobrze – sprawdź jeszcze raz obliczenia.' : er.kid) + '</p>';
      if (it.type === 'match' && res.bad) fb += '<p>Do poprawy: ' + res.bad + ' ' + U.pl(res.bad, 'para', 'pary', 'par') + '.</p>';
      if (it.type === 'multi' && res.fields) fb += '<p>Sprawdź pole: <b>' + it.labels[res.fields.findIndex(x => !x)] + '</b>.</p>';
      if (res.fieldsBad) fb += '<p>' + res.fieldsBad + '</p>';
      const analogMode = !res.partial && !['check', 'placement', 'diag', 'mastery'].includes(s.mode) && !c.spec.probe && !c.spec.diag;
      if (analogMode) {
        // zła odpowiedź: od razu poprawna odpowiedź z wyjaśnieniem, a jako następne – analogiczne zadanie z innymi danymi
        c.done = true; c.solShown = true;
        const queued = E.queueAnalog(S, c.spec);
        const corr = correctLabel(it);
        fb = '<div class="fb no"><div class="fbh"><span class="fbi" aria-hidden="true">✗</span><h3>Tym razem nie wyszło' + (NM() ? ', ' + esc(NM()) : '') + ' – nic się nie stało.</h3></div>';
        if (corr) fb += '<p class="corr">Poprawna odpowiedź: <b>' + corr + '</b></p>';
        fb += shortTxt(calc ? 'Sposób był dobry – zawiodło liczenie. Zobacz obliczenia krok po kroku poniżej.' : er.kid);
        if (it.type === 'error' && it.errorWhy) fb += '<p><b>Błąd był w kroku ' + (it.answer.correct + 1) + ':</b> ' + M(it.errorWhy) + '</p>';
        if (it.expl) fb += '<p>' + M(it.expl) + '</p>';
        if (conceptual && level >= 2) { const vz = MP.viz.forItem(it, code); if (vz) fb += '<div class="fbviz"><b>Zobacz to na rysunku</b>' + vz.html + '</div>'; }
        if (conceptual && level >= 3) fb += '<p><b>Ten sam kłopot pojawia się już kolejny raz.</b> Za chwilę pokażę rozwiązany przykład krok po kroku i kilka łatwiejszych zadań.</p>';
        if (queued) fb += '<p class="small"><b>Następne zadanie będzie podobne</b> – z innymi liczbami. Spróbuj tym samym sposobem.</p>';
      } else if (c.attempts >= 3 || twoOpt || s.mode === 'check' || s.mode === 'mastery') {
        c.done = true; c.solShown = s.mode !== 'mastery';
        if (it.type === 'error' && it.errorWhy) fb += '<p><b>Błąd był w kroku ' + (it.answer.correct + 1) + ':</b> ' + M(it.errorWhy) + '</p>';
        if (it.expl) fb += '<p>' + M(it.expl) + '</p>';
        if (s.mode !== 'mastery') fb += '<p class="small">Poniżej rozwiązanie. Podobne zadanie jeszcze się pojawi – wtedy pójdzie łatwiej.</p>';
      } else {
        // 1. wskazówka tekstowa (od razu, bez klikania)
        if (s.hintsAllowed && c.hints < 1) { c.hints = 1; fb += '<p class="small">Pod zadaniem jest pierwsza wskazówka.</p>'; }
        // 2. ten sam błąd po raz drugi – wizualizacja
        if (conceptual && level === 2 && s.hintsAllowed) { const vz = MP.viz.forItem(it, code); if (vz) fb += '<div class="fbviz"><b>Zobacz to na rysunku</b>' + vz.html + '</div>'; }
        // 3. po raz trzeci – zapowiedź rozwiązanego przykładu i łatwiejszych zadań (karta w kolejce lekcji)
        if (conceptual && level >= 3) fb += '<p><b>Ten sam kłopot pojawia się już kolejny raz.</b> Po tym zadaniu pokażę rozwiązany przykład krok po kroku i dam kilka łatwiejszych zadań.</p>';
        fb += '<p class="small muted">Próba ' + c.attempts + ' z 3.</p>';
      }
      c.fb = fb + '</div>';
      if (!c.done && (it.type === 'input' || it.type === 'fill')) c.resp = resp;
    }
    save(); rerenderLesson();
  }
  function shortTxt(t) { // pierwsze zdanie od razu, reszta po kliknięciu „Więcej”
    t = String(t || ''); const i = t.search(/[.!?](\s|$)/);
    if (i < 0 || i + 1 >= t.trim().length || t.length < 90) return '<p>' + M(t) + '</p>';
    return '<p>' + M(t.slice(0, i + 1)) + '</p><details class="more"><summary>Więcej</summary><p>' + M(t.slice(i + 1).trim()) + '</p></details>';
  }
  function rerenderLesson() { document.querySelectorAll('.chipx.ghost').forEach(g => g.remove()); if (view.name === 'lesson') { $app.innerHTML = vLesson(); afterLessonRender(); $app.insertAdjacentHTML('beforeend', '<p class="foot">' + storageLine() + '</p>'); const fb = $app.querySelector('.fb'); if (fb && fb.scrollIntoView) fb.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } }

  // ---------- PODSUMOWANIE LEKCJI ----------
  // lista odpowiedzi z testu: ✓ albo poprawna odpowiedź obok – bez czerwieni
  function answersList(results) {
    const rs = (results || []).filter(r => r.spec && !r.probe);
    if (!rs.length) return '';
    return '<h3>Twoje odpowiedzi</h3><ol class="anslist">' + rs.map(r => { let it; try { it = E.buildItem(r.spec); } catch (e) { return ''; }
      const mine = r.resp === '—' || r.resp == null || r.resp === '' ? 'nie wiem' : respLabel(it, typeof r.resp === 'string' && /^[\[{]/.test(r.resp) ? (() => { try { return JSON.parse(r.resp); } catch (e) { return r.resp; } })() : r.resp);
      return '<li class="' + (r.ok ? 'good' : 'fix') + '"><div class="aq">' + M(it.prompt) + '</div><div class="aa">' + (r.ok ? '<span class="tick">✓</span> ' + mine : 'Twoja odpowiedź: ' + mine + ' · <b>poprawna: ' + (correctLabel(it) || '—') + '</b>') + '</div></li>'; }).join('') + '</ol>';
  }
  function skillStatusTxt(id) { const s0 = S.skills[id] || {}; return s0.stuck ? 'ćwiczymy to inaczej' : (s0.mastery || s0.l4At) ? 'opanowane ✓' : s0.n ? 'ćwiczymy dalej' : 'nowe'; }
  function vSummary() {
    const sum = view.sum || S.lastSummary; if (!sum) { return '<button class="btn pri" data-go2="start">Na start</button>'; }
    const rec = E.recommend(S, now());
    const pct = sum.n ? Math.round(sum.ok / sum.n * 100) : 0;
    const nm = NM() ? ', ' + esc(NM()) : '';
    if (sum.mode === 'mastery' && sum.test) return vMasteryRes(sum);
    const isTest = ['placement', 'diag', 'check', 'chtest'].includes(sum.mode);
    const main = sum.skill && S.skills[sum.skill];
    const goesRepair = rec.kind === 'repair' && rec.skill === sum.skill;
    let title;
    if (sum.mode === 'placement') title = 'Dziękuję' + nm + '! Wiem już, od czego zacząć.';
    else if (sum.mode === 'diag') title = 'Test diagnostyczny zakończony';
    else if (sum.mode === 'chtest') title = sum.ch && sum.ch.pass ? 'Dział zaliczony' + nm + '! 🎉' : 'Dobra próba' + nm + ' – jeszcze trochę ćwiczeń';
    else if (sum.mode === 'repair' && sum.repair) title = sum.repair.good ? 'Udało się' + nm + '! Teraz już wychodzi.' : 'Dobra praca' + nm + ' – poćwiczymy jeszcze trochę';
    else if (goesRepair) title = 'Dobra praca' + nm + '. To jeszcze poćwiczymy inaczej.';
    else title = pct >= 80 ? 'Świetna robota' + nm + '!' : 'Seria zrobiona' + nm + '!';
    let h = '<div class="lesson"><section class="bigcard"><div class="hello">' + (S.profile ? MP.avatar.svg(S.profile.av, 64) + MP.helpers.svg(myHelper(), pct >= 80 || (sum.ch && sum.ch.pass) ? 'party' : 'happy', 64) : '') + '<h1>' + title + '</h1></div>';
    if (sum.mode === 'chtest' && sum.ch) { const dz = MP.DZIALY.find(x => x.id === sum.dz) || { name: '' }; h += '<p>' + (sum.ch.pass ? '<b>' + esc(dz.name) + '</b> – dział jest w pełni zaliczony. Za jakiś czas poproszę o krótkie powtórki, żeby wiedza została na dłużej.' : 'Dobrze poszło ' + sum.ch.ok + ' z ' + sum.ch.n + '. Do zaliczenia działu potrzeba ok. 8 na 10. Powtórzymy kilka rzeczy i spróbujesz jeszcze raz.') + '</p>'; }
    if (sum.mode === 'repair' && sum.repair) h += '<p>' + (sum.repair.good ? 'Ostatnie zadania poszły samodzielnie i bezbłędnie. Możesz iść dalej.' : 'Ostatnie zadania jeszcze sprawiały kłopot. Zrobimy kolejną rundę – z innym wyjaśnieniem.') + '</p>';
    if (sum.badges && sum.badges.length) h += '<p class="newbadge"><span class="ico">★</span> Nowa odznaka: <b>' + sum.badges.map(esc).join(', ') + '</b></p>';
    if (isTest) h += answersList(sum.results);
    else {
      h += '<p>Zrobione zadania: <b>' + sum.n + '</b></p>';
      const lv = Object.keys(sum.levels).filter(id => MP.isReady(id) && sum.results.some(r => r.skill === id));
      if (lv.length) h += '<div class="list">' + lv.map(id => { const l = sum.levels[id]; const done = l.to >= 4 && l.from < 4; return '<div class="li" style="cursor:default"><span class="t"><b>' + esc(skName(id)) + '</b><small>' + (done ? '<b style="display:inline;color:var(--ok)">opanowane! ✓</b>' : skillStatusTxt(id)) + '</small></span></div>'; }).join('') + '</div>';
      if (sum.detours.length) h += '<p style="margin-top:12px">Po drodze powtórzyliśmy podstawy: <b>' + sum.detours.map(x => esc(skName(x))).join(', ') + '</b>. To był dobry ruch.</p>';
      const errs = Object.keys(sum.errors).filter(c => !['calc', 'unknown', 'format', 'error_spot'].includes(c)).sort((a, b) => sum.errors[b] - sum.errors[a]).slice(0, 1);
      if (errs.length) h += '<h3 style="margin-top:14px">Na co uważać następnym razem</h3>' + errs.map(c => '<div class="fb info" style="margin-top:6px"><b>' + esc(MP.err(c).title) + '.</b> ' + shortTxt(MP.err(c).kid).replace(/^<p>|<\/p>$/g, '') + '</div>').join('');
    }
    h += '<div class="bar2">';
    const canMore = ['learn', 'prep'].includes(sum.mode) && main && !main.stuck && !(main.mastery || main.l4At) && !goesRepair;
    if (S.prep && (sum.mode === 'diag' || sum.mode === 'prep' || sum.prepId || sum.mode === 'check')) h += '<button class="btn pri" data-go2="sprawdzian">Wróć do planu przygotowań →</button>';
    else if (canMore) h += '<button class="btn pri" data-act="more5" data-skill="' + sum.skill + '">Jeszcze ' + (S.settings.seriesLen || 5) + ' zadań →</button>' + (rec.kind !== 'none' && rec.skill !== sum.skill && rec.kind !== 'resume' ? '<button class="btn" data-act="rec">' + esc(recLabel(rec)) + ' →</button>' : '');
    else if (rec.kind !== 'none' && rec.kind !== 'resume') h += '<button class="btn pri" data-act="rec">' + esc(recLabel(rec)) + ' →</button>';
    h += '<button class="btn" data-go2="start">' + (canMore ? 'Na dziś koniec' : 'Na start') + '</button></div></section></div>';
    return h;
  }
  function recLabel(rec) { return rec.kind === 'chtest' ? rec.label : rec.kind === 'repair' ? 'Ćwiczymy inaczej: ' + skName(rec.skill) : rec.kind === 'review' ? 'Powtórka: ' + skName(rec.skill) : 'Następny krok: ' + skName(rec.skill); }

  function vMasteryRes(sum) {
    const T = sum.test, sid = sum.skill, nm = NM() ? ', ' + esc(NM()) : '';
    let h = '<div class="lesson"><section class="bigcard"><div class="hello">' + (S.profile ? MP.avatar.svg(S.profile.av, 64) + MP.helpers.svg(myHelper(), T.pass ? 'party' : 'oops', 64) : '') + '<h1>' + (T.pass ? 'Test opanowania zaliczony' + nm + '!' : 'Jeszcze nie tym razem' + nm) + '</h1></div>';
    h += '<p><b>' + esc(skName(sid)) + '</b> – ' + (T.pass ? 'wszystkie odpowiedzi dobre, bez wskazówek. Ta umiejętność jest odblokowana, a tematy, które z niej korzystają, możesz już ćwiczyć. Za jakiś czas poproszę o krótką powtórkę – tak wiedza zostaje na dłużej.' : 'do zaliczenia potrzebne są wszystkie dobre odpowiedzi. To nie porażka – wiem teraz dokładnie, co poćwiczyć.') + '</p>';
    h += '<h3>Co sprawdziliśmy</h3><div class="list">' + Object.keys(T.byA).map(a => '<div class="li" style="cursor:default"><span class="t"><b>' + esc(E.ASPECT_NAMES[a]) + '</b></span><span class="asp ' + (T.byA[a] ? 'ok' : 'work') + '">' + (T.byA[a] ? '✓ opanowane' : 'wymaga dalszej praktyki') + '</span></div>').join('') + '</div>';
    if (!T.pass) {
      const c = T.codes[0]; const er = c ? MP.err(c) : null;
      h += '<h3 style="margin-top:14px">Co poszło nie tak</h3><div class="fb info">' + (er ? '<b>' + esc(er.title) + '.</b> ' + M(er.kid) + (er.cat === 'rachunek' ? ' <br>To pomyłka w liczeniu, a nie w zasadzie – poćwiczymy dokładność, bez ponownego tłumaczenia tematu.' : '') : 'Kłopot był w zadaniach typu: ' + esc(T.aspects.map(a => E.ASPECT_NAMES[a]).join(', ')) + '.') + '</div>';
      h += '<p>Następny krok: <b>ścieżka naprawcza</b>, a potem nowy test – z innymi zadaniami.</p>';
    }
    h += '<div class="bar2">' + (T.pass ? '<button class="btn pri" data-act="rec">Następny krok →</button>' : '<button class="btn pri" data-act="repair" data-skill="' + sid + '">Ścieżka naprawcza →</button>') + '<button class="btn" data-go2="start">Na start</button></div></section></div>';
    return h;
  }
  function vLocked() {
    const sid = view.skill, root = E.gateRoot(S, sid) || E.gateBlockers(S, sid)[0], blk = E.gateBlockers(S, sid);
    const rs = root && S.skills[root];
    let h = '<div class="lesson"><section class="bigcard"><span class="chip">🔒 Najpierw podstawy</span><h1 style="margin-top:10px">' + esc(skName(sid)) + '</h1>';
    h += '<p>Ten temat korzysta z umiejętności, które trzeba najpierw przećwiczyć: <b>' + blk.map(x => esc(skName(x))).join('</b>, <b>') + '</b>. Gdybyśmy poszli dalej, trudno byłoby zrozumieć nowy materiał – dlatego najpierw podstawy.</p>';
    if (root) h += '<p>Zacznij od: <b>' + esc(skName(root)) + '</b>' + (rs && rs.stuck ? ' (trwa ścieżka naprawcza)' : '') + '.</p><div class="bar2"><button class="btn pri" data-learn="' + root + '">Ćwicz: ' + esc(skName(root)) + ' →</button>' + '</div>';
    h += '<p class="small muted" style="margin-top:12px">Inne tematy, które nie wymagają tych umiejętności, możesz ćwiczyć normalnie.</p><button class="btn ghost" data-go2="start">Wróć do strony głównej</button></section></div>';
    return h;
  }

  // ---------- SPRAWDZIAN ----------
  function vPrep() {
    const P = S.prep;
    if (!P) {
      let h = '<h1>Przygotuj się do sprawdzianu</h1><p>Wybierz tematy, z których masz sprawdzian. Najpierw zrobimy krótki test diagnostyczny, potem ułożę plan powtórki, a na koniec próbny sprawdzian z limitem czasu.</p><form id="prepform" class="stack">';
      MP.DZIALY.forEach(dz => { const tps = dz.topics.filter(t => t.skills.some(MP.isReady)); if (!tps.length) return; h += '<details' + (dz.id === 'duz' ? ' open' : '') + '><summary>' + esc(dz.name) + ' <label class="small" style="margin-left:8px;font-weight:400" onclick="event.stopPropagation()"><input type="checkbox" class="alldz"> cały dział</label></summary><div class="list" style="margin-top:8px">' + tps.map(t => '<label class="check"><input type="checkbox" name="t" value="' + t.id + '"><span><b>' + esc(t.name) + '</b><br><span class="small muted">' + t.skills.filter(MP.isReady).map(skName).join(' · ') + '</span></span></label>').join('') + '</div></details>'; });
      h += '<div><button class="btn pri" type="submit">Zaczynamy przygotowania →</button></div></form>';
      if (S.exams.length) h += '<section class="card" style="margin-top:16px"><h3>Poprzednie próbne sprawdziany</h3><div class="list">' + S.exams.slice().reverse().map((x, i) => '<button class="li" data-examres="' + (S.exams.length - 1 - i) + '"><span class="t"><b>' + new Date(x.t).toLocaleDateString('pl-PL') + ' · ' + x.pct + '%</b><small>' + x.topics.map(t => MP.TOPICS[t] ? MP.TOPICS[t].name : t).join(', ') + '</small></span></button>').join('') + '</div></section>';
      return h;
    }
    let h = '<h1>Przygotowanie do sprawdzianu</h1><p class="muted">Tematy: ' + P.topics.map(t => esc(MP.TOPICS[t].name)).join(', ') + '</p>';
    const steps = [['diag', 'Test diagnostyczny'], ['practice', 'Plan powtórki i ćwiczenia'], ['exam', 'Próbny sprawdzian']];
    const pi = P.phase === 'diag' ? 0 : P.phase === 'practice' ? 1 : 2;
    h += '<div class="row" style="margin-bottom:14px">' + steps.map((s, i) => '<span class="chip ' + (i < pi ? 'done' : i === pi ? 'progress' : 'new') + '">' + (i + 1) + '. ' + s[1] + '</span>').join('') + '</div>';
    if (P.phase === 'diag') {
      h += '<section class="bigcard"><h2>Krok 1: krótki test diagnostyczny</h2><p>' + (P.diagSpecs ? P.diagSpecs.length + ' ' + U.pl(P.diagSpecs.length, 'zadanie', 'zadania', 'zadań') : 'Kilka zadań') + ' bez podpowiedzi. Nie chodzi o ocenę – sprawdzam, co już umiesz, a co warto powtórzyć.</p><button class="btn pri" data-act="prepdiag">Rozpocznij test →</button> <button class="btn ghost" data-act="prepcancel">Anuluj przygotowania</button></section>';
      return h;
    }
    const todo = P.plan.filter(p => p.status !== 'ok');
    h += '<section class="card"><h2>Krok 2: Twój plan powtórki</h2>' + (todo.length ? '<p>Na podstawie testu proponuję przećwiczyć ' + todo.length + ' ' + U.pl(todo.length, 'umiejętność', 'umiejętności', 'umiejętności') + '. Zacznij od góry – najpierw są podstawy.</p>' : '<p>Wszystkie umiejętności z planu wyglądają dobrze. Możesz zrobić próbny sprawdzian.</p>') + '<div class="list">';
    P.plan.forEach(p => { const s = S.skills[p.skill] || { lvl: 0 }; h += '<button class="li" data-preplearn="' + p.skill + '"><span class="t"><b>' + esc(skName(p.skill)) + '</b><small>' + esc(p.reason) + (p.lastAcc !== undefined ? ' · ostatnio ' + p.lastAcc + '% dobrze' : '') + '</small></span>' + '<span class="chip ' + (p.status === 'ok' ? 'done' : p.status === 'work' ? 'progress' : 'review') + '">' + (p.status === 'ok' ? 'gotowe' : p.status === 'work' ? 'jeszcze poćwicz' : 'do zrobienia') + '</span></button>'; });
    h += '</div><div class="bar2"><button class="btn" data-act="prepcheck">Sprawdź postępy (6 zadań)</button></div>' + (P.checks.length ? '<p class="small muted">Sprawdziany postępów: ' + P.checks.map(c => c.pct + '%').join(' → ') + '</p>' : '') + '</section>';
    const n = E.examSpecs(S).length;
    h += '<section class="card" style="margin-top:16px"><h2>Krok 3: próbny sprawdzian</h2><p>' + n + ' ' + U.pl(n, 'zadanie', 'zadania', 'zadań') + ' o różnej trudności, bez podpowiedzi. Każde zadanie ma podaną liczbę punktów (1–3, zależnie od trudności). Wynik nieskrócony lub w złej postaci = połowa punktów. Po zakończeniu dostaniesz szczegółową analizę.</p><div class="row"><label for="tl">Limit czasu:</label><select id="tl" class="btn sm">' + [10, 15, 20, 25, 30, 40, 45, 60].map(m => '<option value="' + m + '"' + (m === nearest(P.timeLimit) ? ' selected' : '') + '>' + m + ' min</option>').join('') + '</select><button class="btn pri" data-act="examstart">Rozpocznij próbny sprawdzian →</button></div>' + (todo.length ? '<p class="small muted">Wskazówka: lepiej najpierw przejść plan powtórki – ale decyzja należy do Ciebie.</p>' : '') + '</section>';
    h += '<p style="margin-top:16px"><button class="btn ghost" data-act="prepcancel">Zakończ przygotowania</button></p>';
    return h;
  }
  const nearest = (m) => [10, 15, 20, 25, 30, 40, 45, 60].reduce((a, b) => Math.abs(b - m) < Math.abs(a - m) ? b : a, 10);
  function vExam() {
    const X = S.prep && S.prep.exam; if (!X) return '<p>Brak sprawdzianu.</p>';
    const i = X.cur || 0; const it = E.buildItem(X.specs[i]);
    let h = '<div class="lesson"><div class="lhead"><span class="timer" id="timer">--:--</span><div class="qnav" style="flex:1">' + X.specs.map((sp, j) => '<button data-qn="' + j + '" class="' + (X.answers[j] !== undefined && X.answers[j] !== '' ? 'a ' : '') + (j === i ? 'c' : '') + '">' + (j + 1) + '</button>').join('') + '</div></div>';
    h += '<section class="card task"><div class="tag"><span class="chip">Zadanie ' + (i + 1) + ' z ' + X.specs.length + '</span><span>' + X.specs[i].d + ' ' + U.pl(X.specs[i].d, 'punkt', 'punkty', 'punktów') + '</span></div><div class="q">' + M(it.prompt) + '</div>' + (it.visual || '');
    if (it.type === 'error') h += '<ol class="steps">' + it.steps.map(x => '<li>' + M(x) + '</li>').join('') + '</ol>';
    h += '<div class="answer" id="ans">' + answerWidget(it, null, true, X.answers[i]) + '</div><div class="bar2">' + (i > 0 ? '<button class="btn" data-act="exprev">← Poprzednie</button>' : '') + (i < X.specs.length - 1 ? '<button class="btn pri" data-act="exnext">Następne →</button>' : '') + '<button class="btn ' + (i === X.specs.length - 1 ? 'pri' : 'ghost') + '" data-act="exfinish">Zakończ i sprawdź</button></div></section></div>';
    return h;
  }
  function examSaveCur() {
    const X = S.prep.exam; const i = X.cur || 0; const it = E.buildItem(X.specs[i]);
    if (it.type === 'input' || it.type === 'fill' || it.type === 'multi') X.answers[i] = readResp(it);
    save();
  }
  function afterExamRender() {
    const X = S.prep.exam; const tEl = document.getElementById('timer');
    const tick = () => { const left = X.start + X.limit * 60000 - now(); if (left <= 0) { clearInterval(examTimer); examSaveCur(); finishExam(true); return; } const m = Math.floor(left / 60000), s = Math.floor(left / 1000) % 60; tEl.textContent = m + ':' + String(s).padStart(2, '0'); tEl.className = 'timer' + (left < 120000 ? ' low' : ''); };
    tick(); examTimer = setInterval(tick, 1000);
    const inp = document.getElementById('inp'); if (inp) { const pv = document.getElementById('pv'); MP.mf.bind($app, (v) => { X.answers[X.cur || 0] = v; }, null, (v) => { if (pv) pv.innerHTML = previewHTML(v); }); }
    $app.querySelectorAll('[data-multi]').forEach(x => x.addEventListener('input', () => { X.answers[X.cur || 0] = [...$app.querySelectorAll('[data-multi]')].map(y => y.value); }));
    const xi = E.buildItem(X.specs[X.cur || 0]); if (MP.ix.has(xi.type)) MP.ix.bind($app, xi, () => X.answers[X.cur || 0], (v) => { X.answers[X.cur || 0] = v; });
  }
  function finishExam(auto) {
    const P = S.prep, X = P.exam; clearInterval(examTimer);
    const items = X.specs.map(E.buildItem);
    const sc = E.scoreExam(items, X.specs.map((_, i) => X.answers[i]));
    const t = now();
    items.forEach((it, i) => { const d = sc.detail[i]; E.record(S, { skill: it.skill, d: it.d, type: it.type, hints: 0, attempt: 1, sec: 0, mode: 'exam' }, { ok: d.ok, code: d.code === 'empty' ? 'unknown' : d.code }, t); });
    const res = { t, topics: P.topics.slice(), pct: sc.pct, pts: sc.pts, max: sc.max, dur: Math.round((t - X.start) / 1000), limit: X.limit, auto: !!auto, specs: X.specs, answers: X.answers, detail: sc.detail };
    S.exams.push(res); if (S.exams.length > 20) S.exams.shift();
    P.exam = null; P.phase = 'practice'; P.lastExam = S.exams.length - 1;
    save(); badgesCheck();
    go('examres', { idx: S.exams.length - 1 });
  }
  function respLabel(it, a) {
    if (a === undefined || a === null || a === '' || (Array.isArray(a) && !a.length)) return '<i class="muted">brak odpowiedzi</i>';
    if (it.type === 'choice' || it.type === 'why' || it.type === 'error') return M(it.options[+a] ? it.options[+a].label : '?');
    if (it.type === 'order') return a.map(k => M(it.items[k])).join(' → ');
    if (it.type === 'match') return it.left.map((l, i) => M(l) + ' = ' + (a[i] !== undefined ? M(it.right[a[i]]) : '?')).join('; ');
    if (it.type === 'multi') return a.map(esc).join(' · ');
    if (typeof a === 'object') return 'odpowiedź na rysunku';
    return M(esc(a));
  }
  function correctLabel(it) {
    const A = it.answer;
    if (A.kind === 'num') return M(it.fmt ? it.fmt(A.value) : (it.dec || A.form === 'decimal') ? U.fmtNum(A.value) : U.fmtF(A.value));
    if (A.kind === 'choice') return M(it.options[A.correct].label);
    if (A.kind === 'order') return A.seq.map(k => M(it.items[k])).join(' → ');
    if (A.kind === 'match') return it.left.map((l, i) => M(l) + ' = ' + M(it.right[A.pairs[i]])).join('; ');
    if (A.kind === 'multi') return A.values.map(v => M(U.fmtNum(v))).join(' · ');
    const sg = (v) => v < 0 ? '−' + -v : String(v);
    if (A.kind === 'pos') return M(it.axis && it.axis.labelFn === 'frac' ? U.fmtF(A.value) : U.fmtNum(A.value)) + ' (znacznik w tym miejscu osi)';
    if (A.kind === 'point') return '(' + sg(A.x) + ', ' + sg(A.y) + ')';
    if (A.kind === 'rect') return A.per != null ? 'boki ' + A.solA + ' i ' + A.solB : 'np. ' + A.solA + ' × ' + A.solB;
    if (A.kind === 'shade') { const k = A.value.n * A.parts / A.value.d; return 'zamalowane ' + k + ' z ' + A.parts + ' części'; }
    if (A.kind === 'cells') return A.count + ' ' + U.pl(A.count, 'kratka', 'kratki', 'kratek');
    if (A.kind === 'cut') { const L = A.dens.reduce((x, y) => U.lcm(x, y)); return A.fr.map(f => M('[[' + f.n * L / f.d + '/' + L + ']]')).join(', ') + (A.res ? ' → ' + M(U.fmtF(A.res)) : ''); }
    if (A.kind === 'bins') return it.binNames.map((bn, j) => esc(bn) + ': ' + it.items.filter((x, i) => A.bins[i] === j).map(M).join(', ')).join('; ');
    if (A.kind === 'multisel') return A.set.map(i => M(it.opts[i])).join(', ');
    return '';
  }
  function vExamRes(idx) {
    const x = S.exams[idx]; if (!x) return '<p>Brak wyniku.</p>';
    const items = x.specs.map(E.buildItem);
    let h = '<div class="crumbs"><button data-go2="sprawdzian">Sprawdzian</button> ›</div><h1>Wynik próbnego sprawdzianu</h1>';
    h += '<section class="grid3"><div class="card stat"><b>' + x.pts + ' / ' + x.max + ' pkt</b><span>' + x.pct + '%</span></div><div class="card stat"><b>' + fmtMin(x.dur) + '</b><span>czas (limit ' + x.limit + ' min)' + (x.auto ? ' – czas minął' : '') + '</span></div>' + (S.settings.showGrade ? '<div class="card stat"><b style="font-size:20px">' + E.gradeFor(x.pct) + '</b><span>orientacyjnie, wg progów: 30% / 50% / 75% / 90% / 98%. Twoja szkoła może mieć inne progi.</span></div>' : '') + '</section>';
    const bySkill = {}; x.detail.forEach((d, i) => { const k = d.skill; bySkill[k] = bySkill[k] || { got: 0, max: 0, codes: [] }; bySkill[k].got += d.got; bySkill[k].max += d.max; if (!d.ok && d.code && d.code !== 'empty') bySkill[k].codes.push(d.code); });
    const weak = Object.keys(bySkill).filter(k => bySkill[k].got < bySkill[k].max);
    h += '<section class="card" style="margin-top:16px"><h2>Co jeszcze warto powtórzyć</h2>' + (weak.length ? '<div class="list">' + weak.map(k => '<div class="li" style="cursor:default"><span class="t"><b>' + esc(skName(k)) + '</b><small>' + bySkill[k].got + ' z ' + bySkill[k].max + ' pkt' + (bySkill[k].codes.length ? ' · ' + bySkill[k].codes.map(c => MP.err(c).title).filter((v, i, a) => a.indexOf(v) === i).join(', ') : '') + '</small></span></div>').join('') + '</div><div class="bar2"><button class="btn pri" data-act="reviewweak" data-skills="' + weak.join(',') + '">Powtórz te umiejętności →</button></div>' : '<p>Wszystko na maksa – możesz iść na sprawdzian spokojnie!</p>') + '</section>';
    h += '<section class="card" style="margin-top:16px"><h2>Analiza zadań</h2><div class="list">';
    items.forEach((it, i) => { const d = x.detail[i]; h += '<details' + (d.ok ? '' : ' open') + '><summary>Zadanie ' + (i + 1) + ': ' + d.got + '/' + d.max + ' pkt ' + (d.ok ? '✓' : '') + '</summary><div class="q" style="font-size:18px">' + M(it.prompt) + '</div>' + (it.visual || '') + '<p>Twoja odpowiedź: ' + respLabel(it, x.answers[i]) + '<br>Poprawna odpowiedź: <b>' + correctLabel(it) + '</b></p>' + (!d.ok && d.code && d.code !== 'empty' ? '<div class="fb no"><b>' + esc(MP.err(d.code).title) + '.</b> ' + M(MP.err(d.code).kid) + '</div>' : '') + '<div class="sol"><ol>' + it.sol.map(s => '<li>' + M(s) + '</li>').join('') + '</ol></div></details>'; });
    h += '</div></section>';
    return h;
  }

  // ---------- PANEL RODZICA ----------
  const hash = (s) => { let h = 5381; for (const c of String(s)) h = ((h << 5) + h + c.charCodeAt(0)) >>> 0; return 'h' + h.toString(36); };
  const linkForm = (pr) => '<form id="linkform" data-id="' + pr.id + '" class="card" style="margin:6px 0 10px;background:var(--paper2,#f6f7fb)"><label for="lem"><b>Adres Gmail / konta Google dziecka (' + esc(pr.name) + ')</b></label><p class="small muted" style="margin:4px 0 8px">Dziecko zaloguje się tym kontem na tej stronie i zobaczy tylko swoje lekcje – bez panelu rodzica i bez innych dzieci. Postępy będą widoczne tutaj.</p><div class="row"><input id="lem" type="email" autocomplete="off" value="' + esc(pr.email || '') + '" placeholder="np. kuba.nowak@gmail.com" style="flex:1;min-width:200px"><button class="btn sm pri" type="submit">Zapisz</button>' + (pr.email ? '<button class="btn sm ghost" type="button" data-punlink="' + pr.id + '">Odłącz konto</button>' : '') + '<button class="btn sm ghost" type="button" data-act="linkcancel">Anuluj</button></div><p class="small" id="lemmsg" role="status"></p></form>';
  function kidSettingsLearnHTML() {
    let h = '';
    h += '<section class="card" style="margin-top:16px"><h2>Nauka i dane</h2><div class="stack"><label class="row">Zadań w jednej serii: <select id="slen" class="btn sm">' + [3, 5, 8, 10].map(n => '<option' + ((S.settings.seriesLen || 5) === n ? ' selected' : '') + '>' + n + '</option>').join('') + '</select></label><p class="small muted" style="margin:-6px 0 0">Po serii dziecko wybiera: jeszcze jedna seria albo koniec. Ile serii potrzeba do opanowania, zależy od tego, jak dziecku idzie.</p><label class="check"><input type="checkbox" id="sgrade"' + (S.settings.showGrade ? ' checked' : '') + '><span>Pokazuj orientacyjną ocenę szkolną po próbnym sprawdzianie</span></label>';
    h += '<details><summary>Kod postępów (kopia zapasowa / przeniesienie na inne urządzenie)</summary><p class="small muted">Skopiuj kod i zachowaj go. Na innym urządzeniu wklej go poniżej i kliknij „Wczytaj". Kod zawiera tylko postępy w nauce.</p><textarea id="code" readonly></textarea><div class="bar2"><button class="btn sm" data-act="mkcode">Pokaż kod</button><button class="btn sm" data-act="copycode">Kopiuj</button></div><textarea id="incode" placeholder="Wklej tu kod postępów"></textarea><div class="bar2"><button class="btn sm" data-act="loadcode">Wczytaj kod</button></div><p id="codemsg" class="small"></p></details>';
    h += '<div><button class="btn sm ghost" data-act="reset">Wyczyść wszystkie postępy…</button></div></div></section>';
    return h;
  }
  function aboutHTML() {
    const ready = MP.SKILL_ORDER.filter(MP.isReady); let h = '';
    const planned = MP.SKILL_ORDER.filter(id => !MP.isReady(id));
    h += '<section class="card" style="margin-top:16px"><h2>Co już działa, a co jest w przygotowaniu</h2><p>Mapa materiału (' + MP.GRADES[MP.grade].name.toLowerCase() + ') obejmuje ' + MP.DZIALY.length + ' działów, ' + Object.keys(MP.TOPICS).length + ' tematów i ' + MP.SKILL_ORDER.length + ' umiejętności (' + (MP.grade === 1 ? 'nowa podstawa programowa edukacji wczesnoszkolnej, obowiązująca w klasie 1 od 1.09.2026' : MP.grade === 4 ? 'nowa podstawa programowa matematyki, obowiązująca w klasie 4 od 1.09.2026' : MP.grade <= 3 ? 'podstawa programowa edukacji wczesnoszkolnej z 2017 r., która w roku 2026/2027 nadal obowiązuje w klasach 2–3' : 'podstawa programowa z 2017 r. w wersji uszczuplonej od 1.09.2024, która w roku 2026/2027 nadal obowiązuje w klasach 5–8') + '). Pełne ćwiczenia z generatorem zadań, kluczem odpowiedzi i diagnozą błędów ma <b>' + ready.length + '</b> umiejętności.</p>' + (planned.length ? '<details><summary>Umiejętności bez ćwiczeń (' + planned.length + ')</summary><ul class="small">' + planned.map(id => '<li>' + esc(SK[id].name) + ' – ' + esc(topicOf(id) ? topicOf(id).name : '') + '</li>').join('') + '</ul></details>' : '<p>Każda umiejętność z mapy ma ćwiczenia z generatorem zadań. Uwaga: zadania sprawdzają wynik liczbowy lub wybór odpowiedzi – rysowania (np. konstrukcji cyrklem) i pisania uzasadnień aplikacja nie ocenia.</p>') + '<p class="small muted">Wszystkie odpowiedzi są sprawdzane deterministycznie (dokładne obliczenia na ułamkach), bez sztucznej inteligencji. Zapisane opisy rozwiązań nie są oceniane automatycznie.</p></section>';
    return h;
  }

  // ---------- PANEL RODZICA: Dzieci (pulpit) i Ustawienia ----------
  const PARENT_VIEWS = ['dzieci', 'postepy', 'pustaw', 'rodzic'];
  const isParentView = () => PARENT_VIEWS.includes(view.name);
  function kidSummary(pr) {
    const st = pr.id === CID ? S : MP.store.loadProfile(pr.id); const t = now();
    const r = { items: 0, pct: null, week: 0, last: null, tags: [] };
    if (!st || !st.stats) return r;
    r.items = st.stats.items || 0; r.pct = st.stats.items ? Math.round(st.stats.ok / st.stats.items * 100) : null;
    try { r.week = E.weekDays(st, t).reduce((a, d) => a + d.sec, 0); } catch (e) { }
    r.last = st.days ? Object.keys(st.days).sort().pop() : null;
    const sk = Object.values(st.skills || {});
    const due = sk.filter(s => s.needsReview || (s.lvl >= 1 && E.isDue(s, t))).length, stuck = sk.filter(s => s.stuck).length, test = sk.filter(s => s.testReady && !s.stuck).length;
    if (stuck) r.tags.push(['r', stuck + ' ' + U.pl(stuck, 'ścieżka naprawcza', 'ścieżki naprawcze', 'ścieżek naprawczych')]);
    if (due) r.tags.push(['w', due + ' ' + U.pl(due, 'temat', 'tematy', 'tematów') + ' do powtórki']);
    if (test) r.tags.push(['a', 'gotowe do testu: ' + test]);
    try { const P = E.pace(st, t, 30); const slow = Object.keys(P.skills).filter(id => P.skills[id].slow); if (slow.length) r.tags.push(['w', 'dłużej niż orientacyjnie: ' + slow.slice(0, 2).map(skName).join(', ') + (slow.length > 2 ? ' i inne' : '')]); } catch (e) { }
    if (!r.tags.length && r.items) r.tags.push(['g', 'idzie dobrze']);
    return r;
  }
  function vKids() {
    const acct = MP.store.who();
    let h = '<div class="row" style="justify-content:space-between;align-items:flex-end;flex-wrap:wrap;gap:10px;margin-bottom:14px"><div><h1 style="margin:0">Dzieci</h1><div class="muted small">' + (acct ? 'Zalogowano jako rodzic: ' + esc(acct) : 'Profile dzieci zapisane na tym urządzeniu') + '</div></div></div><div class="kidgrid">';
    IDX.profiles.forEach(pr => {
      const k = kidSummary(pr); const linked = !!pr.email;
      h += '<section class="card kidc" aria-label="' + esc(pr.name) + '"><details class="kmenu"><summary aria-label="Więcej opcji: ' + esc(pr.name) + '">⋯</summary><div class="kmenu-in"><button data-pset="' + pr.id + '">Ustawienia dziecka</button>' + (acct && !linked ? '<button data-pset="' + pr.id + '" data-sec="login">Połącz konto Google</button>' : '') + '<button data-pdel="' + pr.id + '" class="danger">Usuń konto dziecka</button></div></details>' +
        '<div class="row" style="gap:12px;flex-wrap:nowrap">' + MP.avatar.svg(pr.av, 56) + '<div style="min-width:0"><b style="font-size:19px">' + esc(pr.name) + '</b> <span class="small muted">· ' + (MP.GRADES[pr.grade] ? MP.GRADES[pr.grade].name.toLowerCase() : '') + '</span><div class="small muted">' + (linked ? 'Loguje się samo: ' + esc(pr.email) : acct ? 'Ćwiczy na Twoim urządzeniu' : 'Profil na tym urządzeniu') + '</div></div></div>' +
        '<div class="kstats"><span><b>' + fmtMin(k.week) + '</b>ten tydzień</span><span><b>' + k.items + '</b>zadań</span><span><b>' + (k.pct === null ? '—' : k.pct + '%') + '</b>dobrze za 1. razem</span></div>' +
        (k.tags.length ? '<div class="ktags">' + k.tags.map(x => '<span class="ktag ' + x[0] + '">' + esc(x[1]) + '</span>').join('') + '</div>' : '') +
        '<div class="small muted">Ostatnio: ' + (k.last || 'jeszcze nie ćwiczył(a)') + '</div>' +
        '<div class="bar2" style="margin-top:auto"><button class="btn pri" data-pkid="' + pr.id + '">Zobacz postępy →</button>' + (!linked ? '<button class="btn stu" data-practice="' + pr.id + '">▶ Zacznij naukę</button>' : '') + '</div></section>';
    });
    h += '<button class="kidadd" data-act="addchild"><span class="plus" aria-hidden="true">＋</span><b>Dodaj dziecko</b><span class="small muted">' + (acct ? 'Profil i połączenie konta Google' : 'Imię, klasa, awatar') + '</span></button></div>';
    return h;
  }
  function vPSettings() {
    const tab = view.tab || 'og';
    let side = '<nav class="sside" aria-label="Sekcje ustawień"><span class="slbl">Ogólne</span><button data-ptab="og"' + (tab === 'og' ? ' aria-current="page"' : '') + '>Konto i aplikacja</button><span class="slbl">Dzieci</span>' +
      IDX.profiles.map(pr => '<button data-pset="' + pr.id + '"' + (tab === pr.id ? ' aria-current="page"' : '') + '>' + MP.avatar.svg(pr.av, 26) + esc(pr.name) + '</button>').join('') + '<button data-act="addchild" class="sadd">＋ Dodaj dziecko</button></nav>';
    let body = '';
    if (tab === 'og') {
      const who = MP.store.who(), viaG = MP.store.auth.viaGoogle();
      body = '<h1>Ustawienia ogólne</h1><p class="muted">Dotyczą całego konta rodzica i wszystkich dzieci.</p>';
      if (MP.store.auth.configured()) body += '<section class="card sset"><h2>Konto rodzica</h2>' + (who ? '<div class="srow"><div class="st">' + esc(who) + '<small>' + (viaG ? 'Logowanie kontem Google' : 'Logowanie e-mailem i hasłem' + (MP.store.auth.verified() ? ' · adres potwierdzony' : ' · adres niepotwierdzony')) + '</small></div></div>' + (viaG ? '' : '<div class="srow"><div class="st">Hasło<small>Wyślemy link do ustawienia nowego hasła na ' + esc(who) + '.</small></div><button class="btn sm" data-act="pwreset">Zmień hasło</button></div>') + '<div class="srow"><div class="st">Wyloguj z tego urządzenia<small>Postępy zostaną na koncie.</small></div><button class="btn sm" data-act="glogout">Wyloguj</button></div>' : '<div class="srow"><div class="st">Nie zalogowano – postępy są tylko w tej przeglądarce.</div><button class="btn sm pri" data-act="gloginp">Zaloguj się jako rodzic</button></div>') + '</section>';
      body += '<section class="card sset"><h2>PIN rodzica</h2><p class="small muted">PIN chroni panel rodzica, gdy dziecko ćwiczy na Twoim urządzeniu (przycisk „Zakończ naukę” wymaga wtedy PIN-u).</p>' + '<div class="row"><input id="newpin" class="inp" style="max-width:200px;font-size:18px" inputmode="numeric" maxlength="8" placeholder="nowy PIN"><button class="btn sm" data-act="setpin">' + (IDX.pin ? 'Zmień PIN' : 'Ustaw PIN') + '</button>' + (IDX.pin ? '<button class="btn sm ghost" data-act="delpin">Usuń PIN</button>' : '') + '</div>' + '</section>';
      body += '<section class="card sset"><h2>Prywatność</h2><p>Aplikacja zapisuje tylko imię lub ksywkę dziecka, klasę, awatar, zainteresowania i postępy w nauce. Bez reklam, bez śledzenia, bez danych osobowych.</p></section>';
      body += aboutHTML();
    } else {
      const pr = IDX.profiles.find(x => x.id === tab); if (!pr) { view.tab = 'og'; return vPSettings(); }
      ensureDraft();
      body = '<div class="row" style="gap:12px;flex-wrap:nowrap;margin-bottom:6px">' + MP.avatar.svg(pr.av, 52) + '<div><h1 style="margin:0">' + esc(pr.name) + '</h1><div class="muted small">Ustawienia tego dziecka</div></div><span style="flex:1"></span><button class="btn sm" data-pkid="' + pr.id + '">Zobacz postępy →</button></div>';
      body += '<section class="card sset"><h2>Profil</h2>' + nameBlock() + '<h3 style="margin-top:16px">Klasa</h3><p class="muted small">Zmiana klasy zmienia listę działów. Postępy w umiejętnościach wspólnych dla klas zostają.</p>' + gradeBlock() + '<h3 style="margin-top:16px">Awatar</h3>' + avatarBlock() + '<h3 style="margin-top:16px">Pomocnik</h3>' + helperBlock() + '<h3 style="margin-top:16px">Zainteresowania</h3><p class="muted small">Zadania z treścią będą dotyczyć tych tematów.</p>' + interestsBlock() + '<p class="small muted" id="intmsg" style="margin-top:10px">Wybrane: ' + draft.interests.length + '</p><div class="bar2"><button class="btn pri" data-act="saveprof">Zapisz profil</button></div></section>';
      if (MP.store.who()) body += '<section class="card sset" id="sec-login"><h2>Logowanie dziecka</h2>' + (pr.email && linkOpen !== pr.id ? '<div class="srow"><div class="st">Konto Google: ' + esc(pr.email) + '<small>' + esc(pr.name) + ' loguje się samo: „Jestem uczniem” → „Zaloguj się jako uczeń”.</small></div><button class="btn sm" data-plink="' + pr.id + '">Zmień</button><button class="btn sm ghost" data-punlink="' + pr.id + '">Odłącz</button></div>' : (linkOpen === pr.id || !pr.email ? linkForm(pr) : '')) + (linkDone === pr.id ? '<div class="fb ok" role="status"><b>Konto dziecka zostało połączone. Może już zalogować się do aplikacji.</b></div>' : '') + '</section>';
      body += kidSettingsLearnHTML();
      body += '<section class="card sset dzone"><h2>Usuwanie</h2><div class="srow"><div class="st">Usuń konto dziecka<small>Usuwa profil, wszystkie postępy' + (pr.email ? ' i połączenie z kontem Google' : '') + '. Tego nie da się cofnąć.</small></div><button class="btn sm danger" data-pdel="' + pr.id + '">Usuń konto</button></div></section>';
    }
    return '<div class="psett">' + side + '<div class="pbody">' + body + '</div></div>';
  }
  function parentGate() {
    if (IDX.pin && !parentOpen) return '<section class="card" style="max-width:420px;margin:30px auto"><h2>Panel rodzica</h2><p class="small muted">Wpisz PIN rodzica.</p><form id="pinform"><input id="pin" class="inp pin" inputmode="numeric" maxlength="8" autocomplete="off" aria-label="PIN"><div class="bar2"><button class="btn pri" type="submit">Otwórz</button></div><p id="pinmsg" class="small"></p></form><p class="small muted">PIN chroni panel przed przypadkowym otwarciem przez dziecko. Nie jest to zabezpieczenie przed kimś, kto zna się na komputerach. Zapomniany PIN: w ustawieniach przeglądarki usuń dane tej strony (to skasuje też postępy w tej przeglądarce).</p></section>';
    if (!S && IDX.profiles.length) activate(IDX.last && IDX.profiles.some(p => p.id === IDX.last) ? IDX.last : IDX.profiles[0].id, true), parentOpen = true;
    if (view.name === 'pustaw') return vPSettings();
    if (view.name === 'postepy' && S) return vParent();
    return vKids();
  }

  // tempo pracy: czas odpowiedzi dziecka vs orientacyjny czas dla takich zadań
  function paceHTML(t) {
    const P = E.pace(S, t, 30);
    let h = '<section class="card" style="margin-top:16px"><h2>Tempo pracy <span class="small muted" style="font-weight:400">– ostatnie 30 dni</span></h2>';
    if (!P.all || P.all.n < 5) return h + '<p class="muted">Za mało zadań, żeby ocenić tempo. Wynik pojawi się po kilku lekcjach.</p></section>';
    const fmtS = (x) => x >= 90 ? (Math.round(x / 6) / 10).toString().replace('.', ',') + ' min' : Math.round(x) + ' s';
    const badge = (r) => r.n < 5 ? '<span class="pbadge q">mało danych</span>' : r.slow ? '<span class="pbadge s">dłużej niż orientacyjnie</span>' : r.fast ? '<span class="pbadge f">szybko</span>' : '<span class="pbadge n">w normie</span>';
    const bar = (r) => '<span class="pbar" aria-hidden="true"><i class="' + (r.n >= 5 && r.slow ? 's' : r.n >= 5 && r.fast ? 'f' : 'n') + '" style="width:' + Math.min(100, Math.round(r.ratio / 2 * 100)) + '%"></i><b></b></span>';
    const row = (name, r, sub) => '<div class="prow' + (sub ? ' sub' : '') + '"><span class="pn">' + esc(name) + '</span>' + bar(r) + '<span class="pv">' + fmtS(r.med) + ' <span class="muted">/ ok. ' + fmtS(r.exp) + '</span></span><span class="pok">' + r.ok + '% dobrze · ' + r.n + ' ' + U.pl(r.n, 'zadanie', 'zadania', 'zadań') + '</span>' + badge(r) + '</div>';
    const slowGood = P.dzialy.filter(d => d.slow && d.ok >= 75);
    h += '<p class="small muted">Typowy (mediana) czas pierwszej odpowiedzi na zadanie w porównaniu z <b>orientacyjnym czasem</b> dla takich zadań. Orientacyjny czas to nasz szacunek zależny od formy zadania (wpisywanie, wybór, przeciąganie…), trudności i klasy – nie norma szkolna. Kreska na pasku = czas orientacyjny. Pominięte: sprawdziany na czas i przerwy dłuższe niż 10 minut.</p>';
    if (slowGood.length) h += '<div class="fb info" style="margin:8px 0 12px"><b>Dobre wyniki, ale dłuższy czas:</b> ' + slowGood.map(d => esc(d.name)).join(', ') + '. Dziecko odpowiada poprawnie, ale zajmuje mu to wyraźnie dłużej (co najmniej 1,5 raza), niż zwykle trwają takie zadania – to bywa znak, że liczy „na piechotę” albo jeszcze nie ma wprawy. Warto zapytać, jak liczy, i poćwiczyć te tematy w krótkich seriach.</div>';
    h += '<div class="ptable">' + row('Wszystkie zadania', P.all) + P.dzialy.map(d => '<details class="pdz"><summary>' + row(d.name, d) + '</summary>' + d.skills.map(id => row(skName(id), P.skills[id], true)).join('') + '</details>').join('') + '</div>';
    return h + '</section>';
  }
  const LVLHELP = '<details class="lvlhelp card"><summary>Jak działają poziomy?</summary>' +
    '<p>Każda umiejętność, np. „Dodawanie ułamków o różnych mianownikach”, ma poziom od 0 do 5. Poziom wynika z tego, jak dziecko rozwiązuje zadania: czy dobrze, czy samodzielnie, czy radzi sobie z trudniejszymi i różnymi rodzajami zadań, w jakim tempie i czy pamięta po kilku dniach. To nie jest ocena szkolna. Dziecko poziomów nie widzi.</p><dl>' +
    '<dt>0</dt><dd><b>Jeszcze nie sprawdzono</b> – dziecko nie rozwiązywało zadań z tej umiejętności.</dd>' +
    '<dt>1</dt><dd><b>Uczy się od podstaw</b> – jeszcze nie było dobrej odpowiedzi albo ostatnio mniej niż 4 na 10 były dobre. Aplikacja tłumaczy krok po kroku i daje łatwe zadania.</dd>' +
    '<dt>2</dt><dd><b>Zaczyna rozumieć</b> – są dobre odpowiedzi, ale jeszcze nie samodzielne albo nie regularne. Do poziomu 3 trzeba co najmniej 3 dobrych odpowiedzi bez wskazówek i ok. 6 na 10 dobrze.</dd>' +
    '<dt>3</dt><dd><b>Rozwiązuje proste zadania</b> – samodzielnie radzi sobie z łatwymi i średnimi zadaniami. Do poziomu 4 trzeba: zadań trudniejszych bez wskazówek, co najmniej dwóch różnych form zadań, ok. 8 na 10 dobrze, co najmniej 2 odpowiedzi wpisanych (nie wybranych z listy) i normalnego tempa.</dd>' +
    '<dt>4</dt><dd><b>Radzi sobie z różnymi zadaniami</b> – umiejętność jest opanowana. Gdy wszystkie umiejętności działu są opanowane, dziecko dostaje test na koniec działu. Bez zdanego testu dział nie jest w pełni zaliczony.</dd>' +
    '<dt>5</dt><dd><b>Pewnie i samodzielnie</b> – dziecko pamięta po czasie: zaliczyło krótkie powtórki po 1 i po 3 dniach. Kolejne powtórki pojawiają się coraz rzadziej (po 7, 14, 30 i 60 dniach).</dd></dl>' +
    '<p><b>Czy poziom może spaść?</b> Tak, i to normalne. Jeśli w opanowanej umiejętności pojawią się błędy (2 z ostatnich 4 zadań), poziom spada do 3, a aplikacja planuje powtórkę. Wraca po 3 dobrych, samodzielnych odpowiedziach z rzędu.</p>' +
    '<p><b>Dlaczego wskazówki i zadania z wyborem liczą się słabiej?</b> Wskazówka pomaga się nauczyć, ale nie pokazuje, że dziecko umie samo. W zadaniu z 4 odpowiedziami da się też zgadnąć w 1 przypadku na 4. Dlatego do wyższych poziomów potrzebne są odpowiedzi samodzielne, a część z nich musi być wpisana.</p>' +
    '<p><b>Dlaczego dobre wyniki mogą nie wystarczyć?</b> Jeśli dziecko odpowiada dobrze, ale wyraźnie wolniej niż orientacyjny czas (co najmniej 1,5 raza), aplikacja daje jeszcze kilka zadań. Zwykle oznacza to liczenie „na piechotę”, a nie pewną wiedzę.</p></details>';
  function vParent() {
    const t = now(), A = E.analysis(S, t);
    const ready = MP.SKILL_ORDER.filter(MP.isReady);
    const touched = ready.filter(id => S.skills[id] && S.skills[id].n);
    const wk = E.weekDays(S, t); const weekSec = wk.reduce((a, d) => a + d.sec, 0);
    const okAll = S.stats.items ? Math.round(S.stats.ok / S.stats.items * 100) : 0;
    const intsTxt = S.profile ? (S.profile.interests || []).map(k => MP.THEMES[k] ? MP.THEMES[k].ico + ' ' + MP.THEMES[k].name : k).join(', ') : '—';
    let h = '<button class="aback2" data-go2="dzieci">← Dzieci</button><div class="row" style="justify-content:space-between;flex-wrap:wrap;gap:10px;margin:4px 0 12px"><div class="kswitch" role="group" aria-label="Wybierz dziecko">' + IDX.profiles.map(pr => '<button data-pkid="' + pr.id + '" aria-pressed="' + (pr.id === CID) + '">' + MP.avatar.svg(pr.av, 30) + esc(pr.name) + '</button>').join('') + '</div><button class="btn sm" data-pset="' + CID + '">Ustawienia: ' + esc(S.profile ? S.profile.name : '') + '</button></div><h1>Postępy: ' + esc(S.profile ? S.profile.name : '') + '</h1><p class="muted">' + (MP.GRADES[S.profile.grade] ? MP.GRADES[S.profile.grade].name : '') + ' · Zainteresowania: ' + esc(intsTxt) + '</p><p class="muted small">Tu widać nie tylko wyniki, ale przede wszystkim to, co dziecko już rozumie, a nad czym warto popracować. Poziomy opanowania (0–5) widzi tylko rodzic – dziecko widzi „nowe”, „ćwiczę” albo „opanowane”.</p>' + LVLHELP;
    h += '<section class="grid3"><div class="card stat"><b>' + fmtMin(A.totalSec) + '</b><span>łączny czas nauki</span><span class="small">ostatnie 7 dni: ' + fmtMin(weekSec) + '</span></div><div class="card stat"><b>' + S.stats.items + '</b><span>rozwiązanych zadań</span><span class="small">' + okAll + '% dobrze za pierwszym razem</span></div><div class="card stat"><b>' + ready.filter(id => (S.skills[id] || {}).lvl >= 4).length + ' / ' + ready.length + '</b><span>umiejętności na poziomie 4–5</span><span class="small">ćwiczonych: ' + touched.length + '</span></div></section>';
    h += paceHTML(t);
    // rekomendacje
    const rec = E.recommend(S, t);
    h += '<section class="card" style="margin-top:16px"><h2>Co system rekomenduje</h2><ul class="mist">';
    if (A.due.length) h += '<li><b>Powtórzyć:</b> ' + A.due.map(id => esc(skName(id)) + (S.skills[id].needsReview ? ' (ostatnio pomyłki)' : ' (termin powtórki)')).join(', ') + '</li>';
    if (A.hard.length) h += '<li><b>Popracować nad:</b> ' + A.hard.map(x => esc(skName(x.id)) + ' (' + Math.round(x.acc * 100) + '% dobrze w ostatnich zadaniach)').join(', ') + '</li>';
    if (rec.kind === 'learn') h += '<li><b>Następny krok:</b> ' + esc(skName(rec.skill)) + '</li>';
    if (!A.due.length && !A.hard.length && rec.kind !== 'learn') h += '<li>Brak pilnych rekomendacji.</li>';
    h += '</ul></section>';
    // błędy
    h += '<section class="grid2" style="margin-top:16px"><div class="card"><h2>Najczęstsze błędy</h2>' + (A.topErrors.length ? A.topErrors.map(e => '<details><summary>' + esc(e.info.title) + ' <span class="muted">× ' + e.n + '</span></summary><p class="small"><b>Rodzaj:</b> ' + MP.ERRCAT[e.info.cat] + '<br><b>W umiejętnościach:</b> ' + e.skills.map(skName).map(esc).join(', ') + '<br><b>Co to znaczy:</b> ' + M(e.info.kid) + (e.info.remedy && MP.isReady(e.info.remedy) ? '<br><b>Podstawa do powtórki:</b> ' + esc(skName(e.info.remedy)) : '') + '</p></details>').join('') : '<p class="muted">Jeszcze brak danych.</p>') + '</div>';
    const catTot = Object.values(A.cats).reduce((a, b) => a + b, 0) || 1;
    h += '<div class="card"><h2>Skąd biorą się błędy</h2>' + Object.keys(MP.ERRCAT).map(k => '<div class="hbar"><span>' + MP.ERRCAT[k] + '</span>' + meter((A.cats[k] || 0) / catTot * 100) + '<span class="n small">' + (A.cats[k] || 0) + '</span></div>').join('') + '<p class="small muted">„Niezrozumienie zasady" i „brak wiedzy z wcześniejszego tematu" system leczy powrotem do podstaw i innym wyjaśnieniem. „Pomyłka rachunkowa" to zwykle nieuwaga.</p>';
    h += '<h3 style="margin-top:14px">Wyniki w czasie</h3>' + A.weeks.map(w => '<div class="hbar"><span class="small">' + w.label + '</span>' + meter(w.pct || 0) + '<span class="n small">' + (w.pct === null ? '—' : w.pct + '%') + '</span></div>').join('') + '<p class="small muted">Procent zadań rozwiązanych dobrze za pierwszym razem, tydzień po tygodniu.</p>';
    h += '<h3 style="margin-top:14px">Czas nauki – ostatnie 7 dni</h3>' + wk.map(d => '<div class="hbar"><span class="small">' + d.k.slice(5) + '</span>' + meter(Math.min(100, d.sec / 1800 * 100)) + '<span class="n small">' + Math.round(d.sec / 60) + ' min</span></div>').join('') + '</div></section>';
    // umiejętności
    h += '<section class="card" style="margin-top:16px"><h2>Umiejętności – szczegóły</h2><div class="scroll"><table class="stack2"><thead><tr><th>Umiejętność</th><th>Poziom</th><th>Zadań</th><th>Ostatnie 10</th><th>Ostatnio</th><th>Aspekty rozumienia</th><th>Uwagi</th></tr></thead><tbody>';
    MP.DZIALY.forEach(dz => { const ids = []; dz.topics.forEach(tp => tp.skills.filter(MP.isReady).forEach(id => ids.push(id))); const tch = ids.filter(id => S.skills[id] && S.skills[id].n); if (!tch.length) return; h += '<tr><td colspan="7"><b>' + esc(dz.name) + '</b></td></tr>'; tch.forEach(id => { const s = S.skills[id]; const h10 = s.hist.slice(-10); const errTop = Object.keys(s.errs).filter(c => c !== 'calc' && c !== 'format').sort((a, b) => s.errs[b] - s.errs[a])[0]; h += '<tr><td data-l="Umiejętność">' + esc(skName(id)) + '</td><td data-l="Poziom">' + lvlDots(s.lvl) + ' ' + s.lvl + '</td><td class="n" data-l="Zadań">' + s.n + '</td><td class="n" data-l="Ostatnie 10">' + (h10.length ? Math.round(h10.filter(x => x.ok).length / h10.length * 100) + '%' : '—') + '</td><td data-l="Ostatnio">' + ago(s.lastT) + '</td><td data-l="Aspekty">' + aspChips(id, true) + '</td><td data-l="Uwagi" class="small">' + (s.stuck ? '<b>ścieżka naprawcza</b> (' + esc(s.stuck.indexOf('_') === 0 ? 'aspekt: ' + E.ASPECT_NAMES[s.stuck.slice(1)] : MP.err(s.stuck).title.toLowerCase()) + '); ' : '') + (s.mastery && !s.mastery.legacy ? 'test opanowania zaliczony ' + new Date(s.mastery.at).toLocaleDateString('pl-PL') + '; ' : '') + (s.lastTest && !s.lastTest.pass ? 'ostatni test niezaliczony; ' : '') + (s.tests ? 'testów: ' + s.tests + '; ' : '') + (s.needsReview ? 'wymaga powtórki; ' : '') + (s.placedOk && s.n <= 1 ? 'zaliczone w teście na start; ' : '') + (errTop ? 'najczęściej: ' + esc(MP.err(errTop).title.toLowerCase()) : '') + '</td></tr>'; }); });
    h += '</tbody></table></div>' + (touched.length ? '' : '<p class="muted">Jeszcze nic nie ćwiczono.</p>') + '</section>';
    // zapisane rozwiązania
    if (S.writeups.length) h += '<section class="card" style="margin-top:16px"><h2>Rozwiązania zapisane przez dziecko</h2><p class="small muted">Te opisy nie są oceniane automatycznie – sprawdzany jest tylko wynik. Warto je przeczytać razem.</p><div class="list">' + S.writeups.slice().reverse().slice(0, 15).map(w => '<details><summary>' + new Date(w.t).toLocaleDateString('pl-PL') + ' · ' + esc(skName(w.skill)) + ' · wynik ' + (w.ok ? 'dobry' : 'do poprawy') + '</summary><p class="small">' + M(w.prompt) + '</p><p style="white-space:pre-wrap">' + esc(w.text) + '</p></details>').join('') + '</div></section>';
    if (S.exams.length) h += '<section class="card" style="margin-top:16px"><h2>Próbne sprawdziany</h2><div class="list">' + S.exams.slice().reverse().map((x, i) => '<button class="li" data-examres="' + (S.exams.length - 1 - i) + '"><span class="t"><b>' + new Date(x.t).toLocaleDateString('pl-PL') + ': ' + x.pts + '/' + x.max + ' pkt (' + x.pct + '%)</b><small>' + x.topics.map(tid => MP.TOPICS[tid] ? MP.TOPICS[tid].name : tid).join(', ') + '</small></span></button>').join('') + '</div></section>';
    return h;
  }

  // ---------- PROFIL: imię, awatar, zainteresowania ----------
  function ensureDraft() { if (!draft) { const P = (view.name === 'onboard' && view.isNew) || !S ? {} : (S.profile || {}); draft = { name: P.name || '', grade: P.grade || null, av: Object.assign({}, MP.avatar.DEF, P.av || MP.avatar.random()), interests: (P.interests || []).slice(), helper: MP.helpers.id(P.helper) }; } return draft; }
  function nameBlock() { return '<label for="nm" class="small muted">Imię albo ksywka (wystarczy samo imię)</label><input id="nm" class="inp" maxlength="20" autocomplete="off" value="' + esc(draft.name) + '" placeholder="np. Kuba">'; }
  function avatarBlock() {
    const A = MP.avatar, av = draft.av;
    let h = '<div class="avb"><div class="pv" id="avpv">' + A.svg(av, 180, 'Twój awatar') + '<button class="btn sm" data-act="avrand">Wylosuj</button></div><div>';
    ['bg', 'skin', 'shirt', 'hairC'].forEach(k => { h += '<div class="avrow"><span>' + A.LBL[k] + '</span><div class="sw">' + A.O[k].map((c, i) => '<button style="background:' + c + '" data-avsw="' + k + '" data-idx="' + i + '" aria-pressed="' + (av[k] === i) + '" aria-label="' + A.LBL[k] + ' ' + (i + 1) + '"></button>').join('') + '</div></div>'; });
    ['hair', 'eyes', 'mouth', 'acc'].forEach(k => { h += '<div class="avrow"><span>' + A.LBL[k] + '</span><div class="cyc"><button data-avk="' + k + '" data-avd="-1" aria-label="poprzedni">‹</button><span>' + A.O[k][av[k]] + '</span><button data-avk="' + k + '" data-avd="1" aria-label="następny">›</button></div></div>'; });
    return h + '</div></div>';
  }
  function helperBlock() {
    const H = MP.helpers, cur = H.id(draft.helper);
    return '<div class="hpick">' + H.ORDER.map(id => { const h = H.C[id]; return '<button type="button" class="int hp" data-helper="' + id + '" aria-pressed="' + (id === cur) + '">' + H.svg(id, id === cur ? 'happy' : 'idle', 84) + '<b>' + esc(h.name) + '</b><span class="small" style="font-weight:400">' + esc(h.kind) + '</span></button>'; }).join('') + '</div>';
  }
  const myHelper = () => MP.helpers.id(S && S.profile && S.profile.helper);
  // komunikat po odpowiedzi „mówi” pomocnik: dobra odpowiedź – radość, zła – łagodne „nic się nie stało”, wskazówka – zastanawia się
  function helperSay(html, state, small) {
    const H = MP.helpers, id = myHelper(), h = H.get(id);
    return '<div class="hfb hfb-' + state + (small ? ' sm' : '') + '">' + '<div class="hfig">' + H.svg(id, state, small ? 56 : 76) + '<span class="hname">' + esc(h.name) + '</span></div><div class="hbub">' + ((state === 'happy' || state === 'party') ? '<span class="hsound">' + esc(h.sound) + '</span>' : '') + html + '</div></div>';
  }
  function fbWithHelper(fb) {
    const st = /class="fb ok/.test(fb) ? (/Awans|zaliczon/.test(fb) ? 'party' : 'happy') : /class="fb no/.test(fb) ? 'oops' : 'think';
    return helperSay(fb, st);
  }
  function interestsBlock() {
    return '<div class="ints">' + MP.THEME_LIST.map(k => { const t = MP.THEMES[k]; return '<button class="int" data-int="' + k + '" aria-pressed="' + draft.interests.includes(k) + '"><span class="e" aria-hidden="true">' + t.ico + '</span>' + esc(t.name) + '</button>'; }).join('') + '</div>';
  }
  function gradeBlock() {
    return '<div class="ints" style="grid-template-columns:repeat(auto-fill,minmax(200px,1fr))">' + Object.keys(MP.GRADES).map(g => '<button class="int" data-grade="' + g + '" aria-pressed="' + (+draft.grade === +g) + '"><span class="e" style="font-weight:700">' + g + '</span><b>' + MP.GRADES[g].name + '</b><span class="small" style="font-weight:400">' + esc(MP.GRADES[g].desc) + '</span></button>').join('') + '</div>';
  }
  function vWho() {
    let h = '<div class="lesson"><section class="bigcard"><h1>Kto dziś ćwiczy?</h1><p class="muted">Każde dziecko ma swoje postępy, odznaki i zadania. Wybierz siebie.</p><div class="ints" style="grid-template-columns:repeat(auto-fill,minmax(160px,1fr))">';
    IDX.profiles.forEach(p => { h += '<button class="int" data-who="' + p.id + '">' + MP.avatar.svg(p.av, 84, esc(p.name)) + '<b>' + esc(p.name) + '</b><span class="small" style="font-weight:400">' + (MP.GRADES[p.grade] ? MP.GRADES[p.grade].name : '') + '</span></button>'; });
    h += '<button class="int" data-act="addchild"><span class="e" aria-hidden="true">＋</span><b>Dodaj dziecko</b><span class="small" style="font-weight:400">nowe konto</span></button></div></section><p class="small muted" style="text-align:center;margin-top:12px">Konto dziecka to tylko imię, klasa i awatar – bez haseł i danych osobowych. Postępy każdego dziecka zapisują się osobno.</p>' + (IDX.profiles.length ? '<p style="text-align:center;margin-top:8px"><button class="btn sm ghost" data-act="toparent">Jestem rodzicem – otwórz panel rodzica</button></p>' : '') + '</div>';
    return h;
  }
  function vOnboard() {
    ensureDraft(); const st = view.step || 0, steps = 5;
    let h = '<div class="lesson"><div class="steps3">' + Array.from({ length: steps }, (_, i) => '<i class="' + (i <= st ? 'on' : '') + '"></i>').join('') + '</div><section class="bigcard">';
    const cancel = view.isNew && (IDX.profiles.length || view.fromParent) ? '<button class="btn ghost" data-act="cancelnew">Anuluj</button>' : '';
    if (st === 0) h += (view.fromParent ? '<h1>Nowe konto dziecka</h1><p>Wpisz imię lub ksywkę dziecka – aplikacja będzie się do niego tak zwracać. Kolejne kroki (klasa, awatar, zainteresowania) najlepiej wybrać razem z dzieckiem.</p>' : '<h1>Cześć! Jak masz na imię?</h1><p>Będę się do Ciebie zwracać po imieniu. Imię zostaje tylko w tej przeglądarce i na koncie, na którym otwarto aplikację.</p>') + nameBlock() + '<div class="bar2"><button class="btn pri" data-ob="1">Dalej →</button>' + cancel + '</div>';
    if (st === 1) h += '<h1>Do której klasy chodzisz' + (draft.name ? ', ' + esc(draft.name) : '') + '?</h1><p class="muted">Dobiorę materiał do Twojej klasy. Zawsze możesz to zmienić w profilu.</p>' + gradeBlock() + '<div class="bar2"><button class="btn" data-ob="0">← Wstecz</button><button class="btn pri" data-ob="2">Dalej →</button></div>';
    if (st === 2) h += '<h1>Zrób swój awatar</h1><p class="muted">Wybierz kolory, fryzurę i dodatki. Zawsze możesz to zmienić później.</p>' + avatarBlock() + '<div class="bar2"><button class="btn" data-ob="1">← Wstecz</button><button class="btn pri" data-ob="3">Dalej →</button></div>';
    if (st === 3) h += '<h1>Wybierz swojego pomocnika</h1><p class="muted">Pomocnik będzie z Tobą w czasie nauki: powie, czy odpowiedź jest dobra, pocieszy, gdy coś nie wyjdzie, i podpowie, gdy poprosisz o wskazówkę. Możesz go później zmienić w ustawieniach.</p>' + helperBlock() + '<div class="bar2"><button class="btn" data-ob="2">← Wstecz</button><button class="btn pri" data-ob="4">Dalej →</button></div>';
    if (st === 4) h += '<h1>Co Cię interesuje?</h1><p>Zaznacz tyle tematów, ile chcesz (najlepiej co najmniej 3). Zadania z treścią będą o tym, co lubisz – np. o rakietach, rybach albo meczach.</p>' + interestsBlock() + '<p class="small muted" id="intmsg" style="margin-top:10px">' + (draft.interests.length ? 'Wybrane: ' + draft.interests.length : 'Nic jeszcze nie wybrano.') + '</p><div class="bar2"><button class="btn" data-ob="3">← Wstecz</button><button class="btn pri" data-ob="done">Gotowe – zaczynamy!</button></div>';
    return h + '</section></div>';
  }
  function vProfil() {
    ensureDraft();
    const child = MP.store.isChild(), who = MP.store.who(), local = !who;
    let acct = '';
    if (child) acct = '<div class="srow"><div class="st">Zalogowano: ' + esc(who) + '<small>Twoje postępy zapisują się na Twoim koncie.</small></div><button class="btn sm danger" data-act="glogout">Wyloguj</button></div>';
    else if (who) acct = '<div class="srow"><div class="st">Ćwiczysz na urządzeniu rodzica<small>Gdy skończysz, oddaj urządzenie rodzicowi.</small></div><button class="btn sm" data-nact2="endpractice">Zakończ naukę</button></div>';
    else acct = '<div class="srow"><div class="st">Profil na tym urządzeniu<small>Inna osoba chce poćwiczyć? Zmień profil.</small></div><button class="btn sm" data-act="switchchild">Zmień osobę</button></div>';
    return '<div class="lesson"><h1 style="margin:0 0 4px">Ustawienia</h1><p class="muted" style="margin-top:0">Twój profil w Matmie w kratkę.</p>' +
      '<section class="card sset"><h2>Awatar</h2>' + avatarBlock() + '</section>' +
      '<section class="card sset"><h2>Imię lub ksywka</h2>' + nameBlock() + '</section>' +
      '<section class="card sset"><h2>Mój pomocnik</h2><p class="muted small">Pomocnik mówi Ci, czy odpowiedź jest dobra, i podpowiada. Wybór zapisuje się od razu.</p>' + helperBlock() + '</section>' +
      '<section class="card sset"><h2>Zainteresowania</h2><p class="muted small">Zadania z treścią będą dotyczyć tych tematów.</p>' + interestsBlock() + '<p class="small muted" id="intmsg" style="margin-top:10px">Wybrane: ' + draft.interests.length + '</p></section>' +
      (local ? '<section class="card sset"><h2>Klasa</h2><p class="muted small">Zmiana klasy zmienia listę działów. Postępy w umiejętnościach wspólnych dla klas zostają.</p>' + gradeBlock() + '</section>' : '<section class="card sset"><h2>Klasa</h2><p>' + (MP.GRADES[S.profile.grade] ? MP.GRADES[S.profile.grade].name : '') + '</p><p class="muted small">Klasę zmienia rodzic w swoich ustawieniach.</p></section>') +
      '<div class="bar2" style="margin:0 0 16px"><button class="btn pri" data-act="saveprof">Zapisz zmiany</button><button class="btn" data-act="cancelprof">Anuluj</button></div>' +
      '<section class="card sset"><h2>Konto</h2>' + acct + '</section></div>';
  }

  function afterProfileRender() {
    const nm = document.getElementById('nm');
    if (nm) { nm.addEventListener('input', () => { draft.name = nm.value; }); nm.addEventListener('keydown', (e) => { if (e.key === 'Enter' && view.name === 'onboard') { e.preventDefault(); obGo('1'); } }); if (view.name === 'onboard') nm.focus(); }
  }
  function cleanName(n) { return String(n || '').replace(/[<>"]/g, '').replace(/\s+/g, ' ').trim().slice(0, 20); }
  function obGo(to) {
    if (to === '1' && !cleanName(draft.name)) { toast('Wpisz imię albo ksywkę – wystarczy jedno słowo.'); return; }
    if (to === '2' && !draft.grade) { toast('Wybierz klasę.'); return; }
    if (to === 'done') {
      if (!draft.interests.length) { toast('Wybierz przynajmniej jeden temat.'); return; }
      const prof = { name: cleanName(draft.name), grade: +draft.grade, av: draft.av, interests: draft.interests.slice(), helper: MP.helpers.id(draft.helper) };
      if (view.isNew || !S) {
        const id = MP.store.newId();
        IDX.profiles.push(Object.assign({ id, created: now(), updated: now() }, prof)); MP.store.saveIndex(IDX);
        CID = id; S = fixState(E.newState(now())); S.profile = prof; IDX.last = id;
      } else { S.profile = prof; }
      draft = null; applyProfile(); save(); MP.store.saveIndex(IDX);
      if (view.fromParent) { parentOpen = true; if (MP.store.who() && !MP.store.isChild()) { view = { name: 'plink', kid: CID }; return render(); } toast('Dodano konto: ' + esc(prof.name) + '.', 5000); return go('rodzic'); }
      toast('Miło Cię poznać, ' + esc(prof.name) + '!'); return go('start');
    }
    view.step = +to; render();
  }
  function rerenderProfile() { const y = window.scrollY; render(); window.scrollTo(0, y); }

  // ---------- obsługa zdarzeń ----------
  $app.addEventListener('submit', (e) => {
    e.preventDefault();
    if (e.target.id === 'prepform') {
      const tps = [...e.target.querySelectorAll('input[name=t]:checked')].map(x => x.value);
      if (!tps.length) return toast('Zaznacz przynajmniej jeden temat.');
      const specs = E.prepCreate(S, tps, now()); S.prep.diagSpecs = specs; save(); render();
    }
    if (e.target.id === 'linkform') {
      const id = e.target.dataset.id, p = IDX.profiles.find(x => x.id === id), msg = document.getElementById('lemmsg');
      const em = document.getElementById('lem').value.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) { msg.textContent = 'To nie wygląda na adres e-mail.'; return; }
      if (em === String(MP.store.who() || '').toLowerCase()) { msg.textContent = 'To Twój adres – dziecko potrzebuje własnego konta Google.'; return; }
      if (IDX.profiles.some(x => x.id !== id && x.email === em)) { msg.textContent = 'Ten adres jest już przypisany innemu dziecku.'; return; }
      const onb = e.target.dataset.flow === 'onb';
      if (p.email === em) { linkOpen = null; if (onb) { view = { name: 'plinked', kid: id }; } return render(); }
      if (!MP.store.auth.verified() && !MP.store.auth.viaGoogle()) { msg.innerHTML = '<b>Najpierw potwierdź swój adres e-mail</b> – link wysłaliśmy na ' + esc(MP.store.who()) + '. <button type="button" class="alink" data-auth="pverified">Już potwierdziłem(-am)</button> · <button type="button" class="alink" data-auth="presend">Wyślij ponownie</button>'; msg.className = 'small aerrbox'; return; }
      msg.textContent = 'Łączę konto…'; const sb = e.target.querySelector('[type=submit]'); if (sb) { sb.disabled = true; sb.setAttribute('aria-busy', 'true'); }
      const old = p.email;
      MP.store.linkChild(p, em).then(() => { if (old) MP.store.unlinkChild(old).catch(() => { }); p.email = em; p.updated = now(); MP.store.saveIndex(IDX); linkOpen = null; if (onb) { view = { name: 'plinked', kid: id }; return render(); } linkDone = id; render(); },
        (er) => { if (sb) { sb.disabled = false; sb.removeAttribute('aria-busy'); } msg.className = 'small aerrbox'; msg.textContent = er && er.code === 'permission-denied' ? (MP.store.auth.verified() || MP.store.auth.viaGoogle() ? 'Tego adresu nie da się połączyć – jest już połączony z kontem innego rodzica.' : 'Najpierw potwierdź swój adres e-mail (link w skrzynce), potem spróbuj ponownie.') : 'Nie udało się połączyć. Sprawdź połączenie z internetem i spróbuj ponownie.'; });
      return;
    }
    if (e.target.id === 'pform') return parentSubmit(e.target);
    if (e.target.id === 'sform') return studentSubmit(e.target);
    if (e.target.id === 'pinform') { const v = document.getElementById('pin').value; if (hash(v) === IDX.pin) { parentOpen = true; render(); } else document.getElementById('pinmsg').textContent = 'To nie ten PIN.'; }
  });
  $app.addEventListener('change', (e) => {
    if (e.target.id === 'slen') { S.settings.seriesLen = +e.target.value; save(); }
    if (e.target.classList && e.target.classList.contains('alldz')) { const dd = e.target.closest('details'); dd.open = true; dd.querySelectorAll('input[name=t]').forEach(x => { x.checked = e.target.checked; }); }
    if (e.target.id === 'sgrade') { S.settings.showGrade = e.target.checked; save(); }
    if (e.target.id === 'tl' && S.prep) { S.prep.timeLimit = +e.target.value; save(); }
    if (e.target.dataset.match !== undefined && view.name === 'lesson') { const c = S.session.cur; c.resp = c.resp || {}; c.resp[+e.target.dataset.match] = e.target.value === '' ? undefined : +e.target.value; }
  });
  $app.addEventListener('click', (e) => {
    const b = e.target.closest('button, [data-learn], [data-topic], [data-topicgo], [data-dzial]'); if (!b || b.disabled) return;
    if (b.closest('.ix')) return; // interaktywne komponenty obsługują się same (interact.js)
    const d = b.dataset;
    if (d.ob !== undefined) return obGo(d.ob);
    if (d.act === 'glogin') { b.disabled = true; return MP.store.auth.signIn().catch(er => { b.disabled = false; toast('Nie udało się zalogować' + (er && er.code ? ' (' + er.code + ')' : '') + '.', 5000); }); }
    if (d.act === 'skiplogin') { try { localStorage.setItem('mp_skip_login', '1'); } catch (er) { } view = S ? { name: 'start' } : IDX.profiles.length ? { name: 'who' } : { name: 'onboard', step: 0, isNew: true }; return render(); }
    if (d.act === 'glogout') return doLogout();
    if (d.act === 'gloginp') { try { localStorage.removeItem('mp_skip_login'); } catch (er) { } view = { name: 'plogin', mode: 'login' }; return render(); }
    if (d.nact2) return navAct(d.nact2);
    if (d.auth !== undefined) return authAction(d.auth, b);
    if (d.peek !== undefined) { const inp = document.getElementById(d.peek); const show = inp.type === 'password'; inp.type = show ? 'text' : 'password'; b.textContent = show ? 'Ukryj' : 'Pokaż'; b.setAttribute('aria-pressed', show); b.setAttribute('aria-label', show ? 'Ukryj hasło' : 'Pokaż hasło'); return; }
    if (d.grade) { draft.grade = +d.grade; return rerenderProfile(); }
    if (d.who) { activate(d.who); return go('start'); }
    if (d.act === 'addchild') { draft = null; view = { name: 'onboard', step: 0, isNew: true, fromParent: isParentView() }; return render(); }
    if (d.act === 'toparent') { const id = IDX.last && IDX.profiles.some(p => p.id === IDX.last) ? IDX.last : IDX.profiles[0].id; activate(id, true); return go('rodzic'); }
    if (d.act === 'addchildp') { draft = null; view = { name: 'onboard', step: 0, isNew: true, fromParent: true }; return render(); }
    if (d.act === 'switchchild') { draft = null; return go('who'); }
    if (d.act === 'cancelnew') { const fp = view.fromParent; draft = null; if (fp && S) { parentOpen = true; return go('rodzic'); } return go(S ? 'start' : IDX.profiles.length ? 'who' : 'pwelcome'); }
    if (d.plink) { linkDone = null; linkOpen = linkOpen === d.plink ? null : d.plink; render(); const el = document.getElementById('lem'); if (el) el.focus(); return; }
    if (d.act === 'linkcancel') { linkOpen = null; return render(); }
    if (d.punlink) { const p = IDX.profiles.find(x => x.id === d.punlink); return modal('Odłączyć konto ' + p.email + '? ' + p.name + ' nie będzie mógł/mogła logować się sam(a). Postępy zostają.', () => { MP.store.unlinkChild(p.email).then(() => { delete p.email; p.updated = now(); MP.store.saveIndex(IDX); linkOpen = null; toast('Odłączono konto.'); render(); }, () => toast('Nie udało się odłączyć konta. Sprawdź połączenie z internetem.', 5000)); }); }
    if (d.pchild) { activate(d.pchild, true); parentOpen = true; return go('dzieci'); }
    if (d.pkid) { if (CID !== d.pkid) activate(d.pkid, true); parentOpen = true; return go('postepy'); }
    if (d.pset) { if (CID !== d.pset) activate(d.pset, true); parentOpen = true; draft = null; linkDone = null; const pr = IDX.profiles.find(x => x.id === d.pset); linkOpen = d.sec === 'login' && pr && !pr.email ? d.pset : null; return go('pustaw', { tab: d.pset, sec: d.sec || null }); }
    if (d.ptab) { draft = null; return go('pustaw', { tab: d.ptab }); }
    if (d.practice) { activate(d.practice, true); parentOpen = false; return go('start'); }
    if (d.act === 'pwreset') { b.disabled = true; return MP.store.auth.resetPassword(MP.store.who()).then(() => { b.disabled = false; toast('Wysłaliśmy link do zmiany hasła na ' + esc(MP.store.who()) + '.', 5000); }, () => { b.disabled = false; toast('Nie udało się wysłać wiadomości. Spróbuj ponownie.'); }); }
    if (d.pdel) { const p = IDX.profiles.find(x => x.id === d.pdel); return modal('Usunąć konto „' + p.name + '" razem z wszystkimi postępami? Tego nie da się cofnąć.', () => { if (p.email) MP.store.unlinkChild(p.email).catch(() => { }); MP.store.deleteProfile(IDX, d.pdel); if (CID === d.pdel) { CID = null; S = null; } if (!S && IDX.profiles.length) activate(IDX.profiles[0].id, true); parentOpen = true; toast('Usunięto konto.'); go(IDX.profiles.length ? 'dzieci' : (MP.store.who() ? 'pwelcome' : 'start')); }); }
    if (d.avk) { const k = d.avk, n = MP.avatar.O[k].length; draft.av[k] = (draft.av[k] + (+d.avd) + n) % n; return rerenderProfile(); }
    if (d.avsw) { draft.av[d.avsw] = +d.idx; return rerenderProfile(); }
    if (d.helper) { draft.helper = d.helper; if (view.name === 'profil' && S && S.profile) { S.profile.helper = d.helper; save(); toast('Twój pomocnik: ' + esc(MP.helpers.C[d.helper].name) + ' 👋', 2000); } return rerenderProfile(); }
    if (d.int) { const i = draft.interests.indexOf(d.int); if (i >= 0) draft.interests.splice(i, 1); else draft.interests.push(d.int); b.setAttribute('aria-pressed', i < 0); const m = document.getElementById('intmsg'); if (m) m.textContent = draft.interests.length ? 'Wybrane: ' + draft.interests.length : 'Nic jeszcze nie wybrano.'; return; }
    if (d.act === 'avrand') { draft.av = MP.avatar.random(); return rerenderProfile(); }
    if (d.act === 'saveprof') { if (!cleanName(draft.name)) return toast('Wpisz imię.'); if (!draft.interests.length) return toast('Wybierz przynajmniej jeden temat.'); S.profile = { name: cleanName(draft.name), grade: +draft.grade || S.profile.grade || 6, av: draft.av, interests: draft.interests.slice(), helper: MP.helpers.id(draft.helper) }; draft = null; applyProfile(); save(); toast('Zapisano.'); return render(); }
    if (d.act === 'cancelprof') { draft = null; return go('start'); }
    if (d.go2) return go(d.go2);
    if (d.dzial) return go('dzial', { id: d.dzial });
    if (d.topicgo || d.topic) return go('topic', { id: d.topicgo || d.topic });
    if (d.learn) { const sid = d.learn; return d.mode === 'review' ? startLesson({ mode: 'review', skills: [sid] }, view.name) : startLesson({ mode: 'learn', skill: sid }, view.name); }
    if (d.preplearn) return startLesson({ mode: 'prep', skill: d.preplearn, prepId: S.prep.id }, 'sprawdzian');
    if (d.examres !== undefined) return go('examres', { idx: +d.examres });
    // (stare przyciski znaków zastąpione klawiaturą matematyczną – mathinput.js)
    if (d.opt !== undefined) {
      if (view.name === 'exam') { S.prep.exam.answers[S.prep.exam.cur || 0] = +d.opt; save(); $app.innerHTML = vExam(); afterExamRender(); return; }
      { const c = S.session && S.session.cur; if (!c || c.done) return; c.sel = +d.opt; if (c.fb && /fb info/.test(c.fb)) c.fb = null; rerenderLesson(); const cb = $app.querySelector('[data-act=checkans]'); if (cb) cb.focus({ preventScroll: true }); return; }
    }
    if (d.seq !== undefined || d.unseq !== undefined) {
      const tgt = view.name === 'exam' ? S.prep.exam.answers : null; const ei = view.name === 'exam' ? (S.prep.exam.cur || 0) : null;
      let seq = (view.name === 'exam' ? tgt[ei] : S.session.cur.resp) || [];
      seq = seq.slice(); if (d.seq !== undefined) seq.push(+d.seq); else seq.splice(+d.unseq, 1);
      if (view.name === 'exam') { tgt[ei] = seq; save(); $app.innerHTML = vExam(); afterExamRender(); } else { S.session.cur.resp = seq; S.session.cur.fb = null; rerenderLesson(); }
      return;
    }
    if (d.qn !== undefined) { examSaveCur(); S.prep.exam.cur = +d.qn; save(); $app.innerHTML = vExam(); afterExamRender(); return; }
    const act = d.act; if (!act) return;
    if (act === 'rec') { const r = E.recommend(S, now()); if (r.kind === 'resume') { return go('lesson', { from: 'start' }); } if (r.kind === 'review') return startLesson({ mode: 'review', skills: r.skills }, 'start'); if (r.kind === 'learn') return startLesson({ mode: 'learn', skill: r.skill }, 'start'); if (r.kind === 'chtest') return startChtest(r.dz); if (r.kind === 'repair') return startLesson({ mode: 'repair', skill: r.skill }, 'start'); return; }
    if (act === 'chtest') return startChtest(d.dz);
    if (act === 'more5') { const sk0 = d.skill; return startLesson({ mode: 'learn', skill: sk0 }, 'start'); }
    if (act === 'speak') { try { const it = curItem(); const u = new SpeechSynthesisUtterance(U.plain(it.prompt).replace(/<[^>]+>/g, ' ').replace(/□/g, ' ile? ').replace(/·/g, ' razy ').replace(/\s+/g, ' ')); u.lang = 'pl-PL'; u.rate = 0.9; speechSynthesis.cancel(); speechSynthesis.speak(u); } catch (er) { } return; }
    if (act === 'mtest') return startLesson({ mode: 'mastery', skill: d.skill }, view.name);
    if (act === 'repair') return startLesson({ mode: 'repair', skill: d.skill }, view.name);
    if (act === 'placement') return startLesson({ mode: 'placement', fixed: E.placementSpecs() }, 'start');
    if (act === 'welcomed') { S.welcomed = true; save(); return render(); }
    if (act === 'exstep') { const ex = b.closest('.ex'); const hid = ex.querySelector('li.hid'); if (hid) hid.classList.remove('hid'); if (!ex.querySelector('li.hid')) b.remove(); return; }
    if (act === 'check') { const tp = MP.TOPICS[d.topicId]; const ids = tp.skills.filter(MP.isReady); return startLesson({ mode: 'check', skills: ids, max: Math.max(5, Math.min(8, ids.length * 2)) }, 'dzialy'); }
    if (act === 'cardnext') { advance(); save(); return rerenderLesson(); }
    if (act === 'next') { advance(); save(); if (view.name === 'summary') return render(); return rerenderLesson(); }
    if (act === 'checkans') return onCheck();
    if (act === 'hint') { const c = S.session.cur; const it = curItem(); if (it.type === 'input' || it.type === 'fill' || it.type === 'multi' || it.type === 'match') c.resp = readResp(it); c.hints++; save(); return rerenderLesson(); }
    if (act === 'showsol' || act === 'dontknow') {
      const c = S.session.cur; const it = curItem();
      if (act === 'dontknow' && !c.attempts) { const rec = E.record(S, { skill: c.spec.skill, d: c.spec.d, type: it.type, hints: 3, attempt: 1, sec: Math.round((now() - c.tl) / 1000), mode: S.session.mode, solShown: true }, { ok: false, code: 'unknown' }, now()); E.afterAnswer(S, c.spec, rec, now()); noteResult(c, '—'); c.attempts = 1; }
      if (act === 'dontknow') { const wasDone = c.done; c.done = true; c.wrongNow = false; if (!wasDone && !S.session.fixed && !c.spec.analog) E.queueAnalog(S, c.spec);
        const corr = correctLabel(it); c.fb = '<div class="fb info">' + (S.session.fixed ? 'Nic nie szkodzi – zapisane.' : 'Nic nie szkodzi. ' + (corr ? 'Poprawna odpowiedź: <b>' + corr + '</b>. ' : '') + 'Zobacz rozwiązanie poniżej – następne zadanie będzie podobne.') + '</div>'; }
      c.solShown = !S.session.fixed || act === 'showsol';
      save(); return rerenderLesson();
    }
    if (act === 'pause') {
      const ss = S.session; if (!ss) return go('start');
      const n = (ss.results || []).length;
      if (!n) { E.endSession(S, now()); S.session = null; save(); return go(ss.from === 'sprawdzian' ? 'sprawdzian' : 'start'); } // nic jeszcze nie zrobiono – po prostu wychodzimy
      ss.cur && (ss.cur.pauseAsk = true); return rerenderLesson();
    }
    if (act === 'pausecancel') { if (S.session && S.session.cur) S.session.cur.pauseAsk = false; return rerenderLesson(); }
    if (act === 'pauselater') { if (S.session && S.session.cur) S.session.cur.pauseAsk = false; save(); toast('Zapisałem, gdzie skończyliśmy. Dokończysz z ekranu głównego.', 4000); return go(S.session && S.session.from === 'sprawdzian' ? 'sprawdzian' : 'start'); }
    if (act === 'pausefinish') { if (S.session && S.session.cur) S.session.cur.pauseAsk = false; finishSession(); window.scrollTo(0, 0); return render(); }
    if (act === 'prepdiag') return startLesson({ mode: 'diag', fixed: S.prep.diagSpecs, title: 'Test diagnostyczny' }, 'sprawdzian');
    if (act === 'prepcancel') return modal('Zakończyć przygotowania? Plan zostanie usunięty, wyniki próbnych sprawdzianów zostaną zachowane.', () => { S.prep = null; save(); render(); });
    if (act === 'prepcheck') { const ids = S.prep.plan.map(p => p.skill); startLesson({ mode: 'check', skills: ids, max: 6 }, 'sprawdzian'); S.session.prepCheck = true; save(); return; }
    if (act === 'examstart') { const tl = +(document.getElementById('tl') || {}).value || S.prep.timeLimit; S.prep.exam = { specs: E.examSpecs(S), answers: {}, start: now(), limit: tl, cur: 0 }; S.prep.phase = 'exam'; save(); return go('exam'); }
    if (act === 'exnext' || act === 'exprev') { examSaveCur(); S.prep.exam.cur += act === 'exnext' ? 1 : -1; save(); $app.innerHTML = vExam(); afterExamRender(); return; }
    if (act === 'exfinish') { examSaveCur(); const X = S.prep.exam; const empty = X.specs.filter((_, i) => X.answers[i] === undefined || X.answers[i] === '').length; return modal(empty ? 'Masz ' + empty + ' ' + U.pl(empty, 'zadanie', 'zadania', 'zadań') + ' bez odpowiedzi. Zakończyć sprawdzian?' : 'Zakończyć sprawdzian i zobaczyć wynik?', () => finishExam(false)); }
    if (act === 'reviewweak') { const ids = d.skills.split(',').filter(MP.isReady); return startLesson({ mode: 'mixed', skills: ids, max: Math.min(10, ids.length * 3) }, 'sprawdzian'); }
    if (act === 'setpin') { const v = document.getElementById('newpin').value.trim(); if (!/^\d{4,8}$/.test(v)) return toast('PIN: 4–8 cyfr.'); IDX.pin = hash(v); parentOpen = true; MP.store.saveIndex(IDX); toast('PIN ustawiony.'); return render(); }
    if (act === 'delpin') { IDX.pin = null; MP.store.saveIndex(IDX); return render(); }
    if (act === 'mkcode') { document.getElementById('code').value = MP.store.exportCode(S); return; }
    if (act === 'copycode') { const el = document.getElementById('code'); if (!el.value) el.value = MP.store.exportCode(S); el.select(); try { navigator.clipboard.writeText(el.value).then(() => toast('Skopiowano kod.'), () => toast('Zaznaczyłem kod – skopiuj go ręcznie (Ctrl+C).')); } catch (er) { toast('Zaznaczyłem kod – skopiuj go ręcznie.'); } return; }
    if (act === 'loadcode') { try { const ns = MP.store.importCode(document.getElementById('incode').value.trim()); modal('Wczytać postępy z kodu? Obecne postępy w tej przeglądarce zostaną zastąpione.', () => { const prof = S.profile; S = fixState(ns); if (!S.profile) S.profile = prof; save(); applyProfile(); toast('Wczytano postępy.'); render(); }); } catch (er) { document.getElementById('codemsg').textContent = 'Nie udało się odczytać kodu. Sprawdź, czy kod jest wklejony w całości.'; } return; }
    if (act === 'reset') return modal('Na pewno wyczyścić wszystkie postępy? Tego nie da się cofnąć (chyba że masz zapisany kod postępów).', () => { const prof = S.profile; S = E.newState(now()); S.profile = prof; save(); toast('Postępy wyczyszczone.'); go('start'); });
  });
  function modal(text, onYes) {
    const m = document.createElement('div'); m.className = 'modal'; m.innerHTML = '<div class="card" role="dialog" aria-modal="true"><p>' + esc(text) + '</p><div class="bar2"><button class="btn pri" data-y>Tak</button><button class="btn" data-n>Anuluj</button></div></div>';
    document.body.appendChild(m); m.querySelector('[data-n]').focus();
    m.addEventListener('click', (e) => { if (e.target.closest('[data-y]')) { m.remove(); onYes(); } else if (e.target.closest('[data-n]') || e.target === m) m.remove(); });
  }

  // ---------- start ----------
  const h0 = location.hash.slice(1); if (TOP[h0]) view = { name: h0 };
  if (S && S.prep && S.prep.exam && view.name === 'sprawdzian') view = { name: 'exam' };
  render();
  function onMerged(merged) {
    IDX = merged;
    if (CID && !IDX.profiles.some(p => p.id === CID)) { CID = null; S = null; }
    if (!CID && IDX.profiles.length === 1) activate(IDX.profiles[0].id, true);
    if (!CID && view.name !== 'onboard') view = { name: 'who' };
    if (view.name !== 'lesson' && view.name !== 'exam') render();
  }
  const A = MP.store.auth;
  // ---------- wejście: wybór roli, konto rodzica, logowanie ucznia ----------
  const setIntent = (r) => { try { if (r) sessionStorage.setItem('mp_role', r); else sessionStorage.removeItem('mp_role'); } catch (e) { } };
  const getIntent = () => { try { return sessionStorage.getItem('mp_role'); } catch (e) { return null; } };
  let lastIsNew = false;
  function focusFirst() { setTimeout(() => { const f = $app.querySelector('[aria-invalid=true]') || $app.querySelector('.acard input:not([type=checkbox])'); if (f && !('ontouchstart' in window)) f.focus(); }, 30); }
  function readParentForm(f) { return { email: (f.querySelector('#pem') || {}).value || '', pw: (f.querySelector('#ppw') || {}).value || '', pw2: (f.querySelector('#ppw2') || {}).value || '', ok: !!(f.querySelector('#pok') || {}).checked }; }
  function parentSubmit(f) {
    const mode = f.dataset.mode, v = readParentForm(f), errs = MP.authViews.validateParent(mode, v);
    const base = { name: 'plogin', mode, email: v.email.trim(), okChecked: v.ok };
    if (Object.keys(errs).length) { view = Object.assign(base, { errs }); return render(); }
    view = Object.assign({}, base, { busy: true }); render();
    const em = v.email.trim();
    if (mode === 'reset') return A.resetPassword(em).then(() => { view = { name: 'plogin', mode: 'resetsent', email: em }; render(); }, (er) => { const c = String(er && er.code || ''); if (/user-not-found/.test(c)) { view = { name: 'plogin', mode: 'resetsent', email: em }; return render(); } view = Object.assign({}, base, { msg: { html: MP.authViews.errText(c, 'wysłać wiadomości') } }); render(); });
    setIntent('parent');
    const p = mode === 'register' ? A.register(em, v.pw) : A.signInEmail(em, v.pw);
    p.then((r) => { lastIsNew = !!(r && r.isNew); /* dalej: onAuthStateChanged */ }, (er) => { setIntent(null); view = Object.assign({}, base, { msg: { html: MP.authViews.errText(er && er.code, mode === 'register' ? 'założyć konta' : 'zalogować') } }); render(); });
  }
  function studentSubmit(f) {
    const em = ((f.querySelector('#sem') || {}).value || '').trim().toLowerCase();
    if (!em) { view = { name: 'slogin', email: em, err: 'Wpisz adres e-mail swojego konta Google.' }; return render(); }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(em)) { view = { name: 'slogin', email: em, err: 'Sprawdź adres – powinien wyglądać np. tak: kuba.nowak@gmail.com' }; return render(); }
    setIntent('student'); view = { name: 'slogin', email: em, busy: true }; render();
    A.signIn(em).then((r) => { lastIsNew = !!(r && r.isNew); }, (er) => { setIntent(null); const c = String(er && er.code || ''); view = { name: 'slogin', email: em, msg: /popup-closed|cancelled-popup/.test(c) ? { kind: 'info', html: 'Okienko Google zostało zamknięte. Kliknij „Zaloguj się”, żeby spróbować jeszcze raz.' } : { html: MP.authViews.errText(c) } }; render(); });
  }
  function authAction(a, b) {
    if (a === 'role') { setIntent(null); view = { name: 'role' }; return render(); }
    if (a === 'preg') { view = { name: 'plogin', mode: 'register', email: view.email || '' }; return render(); }
    if (a === 'plog') { view = { name: 'plogin', mode: 'login', email: view.email || '' }; return render(); }
    if (a === 'preset') { view = { name: 'plogin', mode: 'reset', email: view.email || '' }; return render(); }
    if (a === 'slog') { view = { name: 'slogin' }; return render(); }
    if (a === 'pgoogle') { setIntent('parent'); const v0 = view; view = Object.assign({}, v0, { busy: true, msg: null }); render(); return A.signIn().then((r) => { lastIsNew = !!(r && r.isNew); }, (er) => { setIntent(null); const c = String(er && er.code || ''); view = Object.assign({}, v0, { busy: false, msg: /popup-closed|cancelled-popup/.test(c) ? null : { html: MP.authViews.errText(c) } }); render(); }); }
    if (a === 'sretry') { const em = view.who || ''; return A.signOut().catch(() => { }).then(() => { setIntent(null); view = { name: 'slogin', email: em }; render(); }); }
    if (a === 'toparentacct') { setIntent('parent'); view = { name: 'auth' }; render(); return enterParent(true); }
    if (a === 'presend') { b.disabled = true; return A.resendVerification().then(() => { toast('Wysłaliśmy nowy link na ' + esc(MP.store.who()) + '.', 5000); b.disabled = false; }, (er) => { b.disabled = false; toast(MP.authViews.errText(er && er.code, 'wysłać wiadomości'), 6000); }); }
    if (a === 'pverified') { b.disabled = true; return A.refreshVerified().then((ok) => { b.disabled = false; if (view.name === 'pwelcome') { view = { name: 'pwelcome', msg: ok ? { kind: 'ok', html: 'Adres e-mail potwierdzony. Możesz połączyć konto dziecka.' } : { kind: 'info', html: 'Adres nie jest jeszcze potwierdzony. Kliknij link w wiadomości od Matmy w kratkę (sprawdź też „Spam”), a potem wróć tutaj.' } }; return render(); } toast(ok ? 'Adres potwierdzony – możesz połączyć konto dziecka.' : 'Adres nie jest jeszcze potwierdzony – kliknij link w wiadomości e-mail.', 5000); const m = document.getElementById('lemmsg'); if (ok && m) { m.textContent = ''; m.className = 'small'; } }, () => { b.disabled = false; toast('Nie udało się sprawdzić. Spróbuj ponownie.'); }); }
    if (a === 'plinkskip') { parentOpen = true; return go('rodzic'); }
    if (a === 'topanel') { parentOpen = true; linkDone = null; return go('rodzic'); }
  }
  // rodzic: dane z jego konta; na start panel rodzica (albo wprowadzenie, gdy nie ma jeszcze dzieci)
  function enterParent(explicit) {
    const entering = ['auth', 'login', 'role', 'plogin', 'slogin'].includes(view.name);
    return MP.store.connectGoogle(() => IDX, onMerged).then(() => {
      if (CID) refreshFromCloud(CID, true);
      if (!entering || ['lesson', 'exam'].includes(view.name)) return render();
      if (!IDX.profiles.length) view = { name: 'pwelcome' };
      else if (explicit) { if (!CID) activate(IDX.last && IDX.profiles.some(p => p.id === IDX.last) ? IDX.last : IDX.profiles[0].id, true); parentOpen = !IDX.pin; view = { name: 'dzieci' }; }
      else view = homeView();
      render();
    });
  }
  function homeView() { if (MP.store.who() && !MP.store.isChild()) return IDX.profiles.length ? { name: 'dzieci' } : { name: 'pwelcome' }; return S ? { name: 'start' } : IDX.profiles.length ? { name: 'who' } : MP.store.who() ? { name: 'pwelcome' } : { name: 'onboard', step: 0, isNew: true }; }
  if (A.configured()) {
    // wersja na własnym serwerze: Firebase Authentication (Google + e-mail/hasło rodzica)
    if (!['lesson', 'exam'].includes(view.name)) { view = { name: 'auth' }; render(); }
    A.init((u, st) => {
      if (u) {
        const intent = getIntent(); const em = (u.email || '').toLowerCase();
        if (['plogin', 'slogin', 'role'].includes(view.name)) { view = { name: 'auth', text: intent === 'student' ? 'Sprawdzam, czy konto jest połączone…' : 'Otwieram konto rodzica…' }; render(); }
        MP.store.findInviteStrict().then(inv => {
          if (inv) { setIntent(null); if (intent === 'parent') toast('To konto jest połączone jako konto ucznia – otwieram lekcje ucznia.', 6000); return enterChild(inv); }
          if (intent === 'student') {
            // uczeń bez połączenia: nie tworzymy konta. Konto rodzica rozpoznajemy po istniejących danych.
            return MP.store.hasParentData().then(has => {
              if (has && !lastIsNew) { view = { name: 'slogin', state: 'parentacct', who: em }; return render(); }
              const done = () => { setIntent(null); view = { name: 'slogin', state: 'notlinked', who: em, email: em }; render(); };
              return (lastIsNew ? A.discardNew() : A.signOut()).then(done, done);
            });
          }
          setIntent(null); return enterParent(intent === 'parent');
        }, (er) => {
          // nie wiadomo, czy konto jest połączone (np. brak internetu) – nie zgadujemy
          if (intent === 'student') { setIntent(null); A.signOut().catch(() => { }); view = { name: 'slogin', email: em, msg: { html: MP.authViews.errText(er && er.code === 'permission-denied' ? 'unknownperm' : (er && er.code) || 'timeout', 'sprawdzić konta') } }; return render(); }
          setIntent(null); return enterParent(intent === 'parent');
        });
      } else {
        let skip = false; try { skip = localStorage.getItem('mp_skip_login') === '1'; } catch (e) { }
        if (['plogin', 'slogin'].includes(view.name) && !view.busy) return render();
        if (['plogin', 'slogin'].includes(view.name)) return; // trwa logowanie
        if (st === 'error') { view = skip ? homeView() : { name: 'role', msg: { html: 'Nie udało się połączyć z usługą logowania. Sprawdź internet i odśwież stronę.' } }; return render(); }
        view = skip ? homeView() : { name: 'role' };
        render();
      }
    });
    // dziecko zalogowane własnym kontem: tylko jego profil, bez panelu rodzica i bez innych dzieci
    function enterChild(inv) {
      const loc = MP.store.loadIndex();
      if (loc.profiles.some(p => p.id !== inv.pid)) MP.store.clearLocal();
      MP.store.connectChild(inv);
      const old = (MP.store.loadIndex().profiles || []).find(p => p.id === inv.pid);
      IDX = { v: 2, profiles: [Object.assign({ id: inv.pid, name: inv.name, grade: inv.grade || 6, av: inv.av || null, interests: inv.interests || [], created: inv.created || now(), updated: 0 }, old || {})], deleted: [], last: inv.pid, pin: null, updated: now() };
      MP.store.saveIndex(IDX); CID = null; S = null; parentOpen = false;
      activate(inv.pid, true);
      if (!['lesson', 'exam'].includes(view.name)) view = { name: 'start' };
      render();
    }
  } else {
    MP.store.connect(() => IDX, onMerged).then(() => { if (CID) refreshFromCloud(CID, false); });
  }
  window.__mp = { get S() { return S; }, get IDX() { return IDX; }, get CID() { return CID; }, go, render, activate };
})();
