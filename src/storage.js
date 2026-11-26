/* storage.js — konta dzieci i zapis postępów.
   Każde dziecko ma własny profil i własny zapis postępów:
   - w przeglądarce (localStorage): indeks profili + osobny zapis każdego dziecka,
   - na koncie Claude osoby, która otworzyła aplikację (prywatne dokumenty data/users/<id>/…),
   - albo – na własnym serwerze – na koncie Google rodzica w Firebase (users/<uid>/docs/…);
     dziecko z przypisanym adresem Google widzi i zapisuje tylko swój dokument p_<id>.
   Bez danych osobowych poza imieniem/ksywką, bez reklam i śledzenia. */
var MP = window.MP;
(function (MP) {
  const KEY_I = 'mp_index_v2', KEY_P = (id) => 'mp_p_' + id, OLD = 'mp6_state_v1';
  let base = null, status = 'local', childMode = false;
  const listeners = [], writers = {};
  const setStatus = (s) => { status = s; listeners.forEach(f => f(s)); };
  const lget = (k) => { try { const r = localStorage.getItem(k); return r ? JSON.parse(r) : null; } catch (e) { return null; } };
  const lset = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } };
  const ldel = (k) => { try { localStorage.removeItem(k); } catch (e) { } };
  const newId = () => 'c' + Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36);
  const emptyIndex = () => ({ v: 2, profiles: [], deleted: [], last: null, pin: null, updated: 0 });

  // jeden zapis naraz na dokument, z dociąganiem ostatniej wersji
  function cloudWrite(name, getData) {
    if (!base) return;
    const w = writers[name] || (writers[name] = { busy: false, again: false, timer: null });
    clearTimeout(w.timer);
    w.timer = setTimeout(async function run() {
      if (w.busy) { w.again = true; return; }
      w.busy = true;
      try { const data = getData(); if (data) { await base.doc(name).set({ json: JSON.stringify(data), updated: data.updated || Date.now() }); setStatus('cloud'); } }
      catch (e) { setStatus(e && e.code === 'quota_exceeded' ? 'quota' : 'local'); }
      w.busy = false;
      if (w.again) { w.again = false; run(); }
    }, 1200);
  }
  async function cloudRead(name) {
    if (!base) return null;
    try {
      const snap = await Promise.race([base.doc(name).get(), new Promise(r => setTimeout(() => r('timeout'), 10000))]);
      if (snap === 'timeout' || !snap.exists) return null;
      return JSON.parse(snap.data().json);
    } catch (e) { return null; }
  }
  // jak cloudRead, ale błąd/brak połączenia zgłasza wyjątkiem (żeby nie pomylić „brak zapisu" z „nie udało się sprawdzić")
  async function cloudReadStrict(name) {
    if (!base) return null;
    const snap = await Promise.race([base.doc(name).get(), new Promise((r, j) => setTimeout(() => j(new Error('timeout')), 10000))]);
    return snap.exists ? JSON.parse(snap.data().json) : null;
  }
  function mergeIndex(a, b) { // łączy listy dzieci z dwóch urządzeń
    const out = emptyIndex(); out.deleted = [...new Set([...(a.deleted || []), ...(b.deleted || [])])];
    const by = {};
    [...(a.profiles || []), ...(b.profiles || [])].forEach(p => { if (out.deleted.includes(p.id)) return; if (!by[p.id] || (p.updated || 0) > (by[p.id].updated || 0)) by[p.id] = p; });
    out.profiles = Object.values(by).sort((x, y) => (x.created || 0) - (y.created || 0));
    const newer = (a.updated || 0) >= (b.updated || 0) ? a : b;
    out.pin = newer.pin !== undefined ? newer.pin : (a.pin || b.pin || null); out.last = a.last || b.last; out.updated = Math.max(a.updated || 0, b.updated || 0);
    return out;
  }

  async function syncIndex(getIndex, onIndex) {
    const remote = await cloudRead('index');
    const local = getIndex();
    if (remote) {
      const merged = mergeIndex(local, remote);
      const changed = JSON.stringify(merged.profiles.map(p => p.id + p.updated)) !== JSON.stringify(local.profiles.map(p => p.id + p.updated)) || merged.pin !== local.pin;
      lset(KEY_I, merged);
      if (changed) onIndex(merged);
      cloudWrite('index', () => merged);
    } else cloudWrite('index', () => getIndex());
    setStatus('cloud');
    // wyślij na konto zapisy dzieci, których tam jeszcze nie ma albo są starsze
    for (const pr of getIndex().profiles) {
      const loc = lget(KEY_P(pr.id)); if (!loc) continue;
      const rem = await cloudRead('p_' + pr.id);
      if (!rem || (loc.updated || 0) > (rem.updated || 0)) cloudWrite('p_' + pr.id, () => lget(KEY_P(pr.id)));
    }
  }
  // ---------- logowanie Google (Firebase) – tylko gdy podano konfigurację w firebase-config.js ----------
  const FBV = '10.12.2';
  let fbUser = null;
  const fbConfig = () => (window.MWK_FIREBASE && window.MWK_FIREBASE.apiKey) ? window.MWK_FIREBASE : null;
  const loadScript = (src) => new Promise((res, rej) => { const el = document.createElement('script'); el.src = src; el.onload = res; el.onerror = rej; document.head.appendChild(el); });
  async function fbInit() {
    if (!fbConfig()) return false;
    if (!window.firebase) for (const m of ['app', 'auth', 'firestore']) await loadScript('https://www.gstatic.com/firebasejs/' + FBV + '/firebase-' + m + '-compat.js');
    if (!window.firebase.apps.length) window.firebase.initializeApp(fbConfig());
    return true;
  }

  MP.store = {
    newId,
    status: () => status,
    who: () => fbUser ? (fbUser.email || fbUser.displayName || 'konto Google') : null,
    onStatus: (f) => listeners.push(f),
    loadIndex() {
      let idx = lget(KEY_I);
      if (!idx) {
        idx = emptyIndex();
        const old = lget(OLD); // migracja z wersji jednoosobowej
        if (old && old.v) {
          const id = newId(); const P = old.profile || { name: 'Uczeń', av: null, interests: [] };
          P.grade = P.grade || 6; old.profile = P;
          idx.profiles.push({ id, name: P.name, av: P.av, grade: P.grade, created: old.created || Date.now(), updated: Date.now() });
          if (old.settings && old.settings.pin) idx.pin = old.settings.pin;
          lset(KEY_P(id), old); idx.last = id; ldel(OLD);
          idx.updated = Date.now(); lset(KEY_I, idx); // zapisujemy tylko po migracji – pusty indeks nie zostaje w przeglądarce (np. po wylogowaniu)
        } else idx.updated = 0;
      }
      return idx;
    },
    saveIndex(idx) { idx.updated = Date.now(); lset(KEY_I, idx); if (!childMode) cloudWrite('index', () => idx); },
    loadProfile: (id) => lget(KEY_P(id)),
    save(state, id) {
      state.updated = Date.now();
      const ok = lset(KEY_P(id), state);
      if (!ok && !base) setStatus('memory');
      cloudWrite('p_' + id, () => state);
    },
    saveLocal(state, id) { lset(KEY_P(id), state); },
    online: () => !!base,
    deleteProfile(idx, id) {
      idx.profiles = idx.profiles.filter(p => p.id !== id); idx.deleted = [...new Set([...(idx.deleted || []), id])];
      if (idx.last === id) idx.last = null;
      ldel(KEY_P(id)); this.saveIndex(idx);
      if (base) base.doc('p_' + id).delete().catch(() => { });
    },
    // nowszy zapis dziecka z konta (np. gdy uczyło się na innym komputerze)
    async fetchProfile(id) { return cloudReadStrict('p_' + id); },
    // podłączenie konta Claude (gdy aplikacja działa na claude.ai)
    async connect(getIndex, onIndex) {
      try {
        if (fbConfig()) return; // na własnym serwerze używamy logowania Google
        for (let i = 0; i < 20 && !(window.claude && window.claude.use); i++) await new Promise(r => setTimeout(r, 150));
        if (!window.claude || !window.claude.use) return;
        const db = await window.claude.use('db'); const user = await window.claude.use('user');
        if (!db || !user) return;
        const uid = await user.id(); if (!uid) return;
        base = db.collection('data/users/' + uid);
        await syncIndex(getIndex, onIndex);
      } catch (e) { setStatus('local'); }
    },
    // podłączenie konta Google (Firebase) – po zalogowaniu
    async connectGoogle(getIndex, onIndex) {
      if (!fbUser) return;
      const fs = window.firebase.firestore();
      base = { doc: (name) => fs.collection('users').doc(fbUser.uid).collection('docs').doc(name) };
      try { await syncIndex(getIndex, onIndex); } catch (e) { setStatus('local'); }
    },
    // ----- konta dzieci (logowanie dziecka własnym kontem Google) -----
    // Rodzic przypisuje dziecku adres Google → dokument invites/<adres> wskazuje konto rodzica i profil dziecka.
    isChild: () => childMode,
    async findInvite() { try { return await this.findInviteStrict(); } catch (e) { return null; } },
    // jak findInvite, ale błąd sieci / odmowę dostępu zgłasza wyjątkiem (żeby nie uznać dziecka za „niepołączone" przez chwilowy brak internetu)
    async findInviteStrict() {
      if (!fbUser || !fbUser.email) return null;
      const snap = await Promise.race([window.firebase.firestore().collection('invites').doc(fbUser.email.toLowerCase()).get(), new Promise((r, j) => setTimeout(() => j(Object.assign(new Error('timeout'), { code: 'timeout' })), 10000))]);
      const d = snap.exists ? snap.data() : null;
      return d && d.parent && d.pid ? d : null;
    },
    // czy to konto ma już własne dane rodzica (lista dzieci) – odróżnia konto rodzica od nowego, niepołączonego konta ucznia
    async hasParentData() {
      if (!fbUser) return false;
      try { const snap = await window.firebase.firestore().collection('users').doc(fbUser.uid).collection('docs').doc('index').get(); return snap.exists; } catch (e) { return false; }
    },
    connectChild(inv) {
      const fs = window.firebase.firestore(); childMode = true;
      base = { doc: (name) => fs.collection('users').doc(inv.parent).collection('docs').doc(name) };
      setStatus('cloud');
    },
    async linkChild(entry, email) {
      const fs = window.firebase.firestore(); const em = email.toLowerCase();
      await fs.collection('invites').doc(em).set({ parent: fbUser.uid, pid: entry.id, name: entry.name, grade: entry.grade || 6, av: entry.av || null, interests: entry.interests || [], created: Date.now() });
    },
    async unlinkChild(email) { if (!email || !fbUser) return; await window.firebase.firestore().collection('invites').doc(email.toLowerCase()).delete(); },
    clearLocal() { try { Object.keys(localStorage).filter(k => k === KEY_I || k.startsWith('mp_p_')).forEach(k => localStorage.removeItem(k)); } catch (e) { } base = null; },
    auth: {
      configured: () => !!fbConfig(),
      user: () => fbUser,
      init(cb) {
        fbInit().then(ok => { if (!ok) return cb(null, 'none'); window.firebase.auth().onAuthStateChanged(u => { fbUser = u; cb(u, 'ready'); }); }).catch(() => cb(null, 'error'));
      },
      // Google (rodzic albo uczeń). hint = adres podpowiadany w okienku Google. Zwraca {isNew}.
      async signIn(hint) {
        const prov = new window.firebase.auth.GoogleAuthProvider(); const cp = { prompt: 'select_account' }; if (hint) cp.login_hint = hint; prov.setCustomParameters(cp);
        try { const r = await window.firebase.auth().signInWithPopup(prov); return { isNew: !!(r && r.additionalUserInfo && r.additionalUserInfo.isNewUser) }; }
        catch (e) { if (e && /popup-blocked|operation-not-supported/.test(e.code || '')) { await window.firebase.auth().signInWithRedirect(prov); return { redirect: true }; } throw e; }
      },
      // konto rodzica: e-mail i hasło (Firebase Authentication – hasło nigdy nie trafia do bazy aplikacji)
      async register(email, pass) {
        const a = window.firebase.auth(); a.languageCode = 'pl';
        const r = await a.createUserWithEmailAndPassword(email, pass);
        try { await r.user.sendEmailVerification(); } catch (e) { }
        return { isNew: true };
      },
      async signInEmail(email, pass) { await window.firebase.auth().signInWithEmailAndPassword(email, pass); return { isNew: false }; },
      async resetPassword(email) { const a = window.firebase.auth(); a.languageCode = 'pl'; await a.sendPasswordResetEmail(email); },
      async resendVerification() { const u = window.firebase.auth().currentUser; if (!u) return; window.firebase.auth().languageCode = 'pl'; await u.sendEmailVerification(); },
      // po kliknięciu linku w e-mailu: odśwież konto i token (reguły bazy sprawdzają email_verified w tokenie)
      async refreshVerified() { const u = window.firebase.auth().currentUser; if (!u) return false; await u.reload(); if (u.emailVerified) await u.getIdToken(true); fbUser = window.firebase.auth().currentUser; return !!u.emailVerified; },
      verified: () => !!(fbUser && fbUser.emailVerified),
      viaGoogle: () => !!(fbUser && (fbUser.providerData || []).some(p => p && p.providerId === 'google.com')),
      // uczeń bez połączonego konta: usuń świeżo utworzone konto logowania (uczeń nie zakłada kont sam)
      async discardNew() { const u = window.firebase.auth().currentUser; try { if (u) await u.delete(); } catch (e) { } try { await window.firebase.auth().signOut(); } catch (e) { } fbUser = null; base = null; childMode = false; },
      async signOut() { await window.firebase.auth().signOut(); fbUser = null; base = null; childMode = false; }
    },
    exportCode: (state) => JSON.stringify(state),
    importCode(text) { const s = JSON.parse(text); if (!s || !s.skills || !s.v) throw new Error('To nie jest kod postępów.'); return s; }
  };
})(MP);
