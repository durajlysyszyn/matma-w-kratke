/* authviews.js — ekrany wejścia: wybór roli („Kim jesteś?"), konto rodzica (rejestracja, logowanie, odzyskiwanie hasła),
   logowanie ucznia oraz wprowadzenie rodzica (dodanie i połączenie konta Google dziecka).
   Uczeń NIE zakłada konta sam – loguje się kontem Google, które rodzic wcześniej połączył w swoim panelu.
   Same widoki (HTML); obsługa zdarzeń i logowania jest w ui.js / storage.js. */
var MP = window.MP;
(function (MP) {
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const G = '<svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.6-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.6-.4-3.5z"/></svg>';
  // proste ikony ról (bez postaci z bajek)
  const ICO_P = '<svg viewBox="0 0 64 64" width="56" height="56" aria-hidden="true"><rect x="4" y="4" width="56" height="56" rx="16" class="ib"/><circle cx="26" cy="24" r="7" class="if"/><path d="M14 47c0-7 5.5-12 12-12s12 5 12 12" class="if"/><circle cx="43" cy="30" r="5" class="if2"/><path d="M35 48c0-5 3.6-9 8-9s8 4 8 9" class="if2"/></svg>';
  const ICO_S = '<svg viewBox="0 0 64 64" width="56" height="56" aria-hidden="true"><rect x="4" y="4" width="56" height="56" rx="16" class="ib"/><rect x="15" y="15" width="30" height="36" rx="4" class="if"/><path d="M15 27h30M15 39h30M25 15v36M35 15v36" class="il"/><path d="M40 47l10-18 4 2.3-10 18-4.6 2.3z" class="ip"/></svg>';
  const back = '<button type="button" class="aback" data-auth="role"><span aria-hidden="true">←</span> Wróć do wyboru: rodzic czy uczeń</button>';
  const brand = '<div class="abrand"><span class="logo" aria-hidden="true"><i></i><i></i><i></i><i></i></span><b>Matma w kratkę</b></div>';
  const msg = (m) => m ? '<div class="fb ' + (m.kind || 'no') + ' amsg" role="' + (m.kind === 'ok' || m.kind === 'info' ? 'status' : 'alert') + '">' + m.html + '</div>' : '<div class="amsg" role="status" aria-live="polite"></div>';

  function role(st) {
    st = st || {};
    return '<div class="authwrap">' + brand + '<header class="ahead"><h1>Kim jesteś?</h1><p>Wybierz, jak chcesz wejść do aplikacji.</p></header>' + (st.msg ? msg(st.msg) : '') +
      '<div class="roles">' +
      '<section class="role rp" aria-labelledby="r1"><div class="rtop">' + ICO_P + '<span class="rtag">Rodzic lub opiekun</span></div><h2 id="r1">Jestem rodzicem</h2><p>Załóż konto, dodaj dziecko i monitoruj jego postępy w nauce.</p>' +
      '<div class="ract"><button type="button" class="btn pri big" data-auth="preg">Załóż konto rodzica</button><button type="button" class="alink" data-auth="plog">Masz już konto? <b>Zaloguj się</b></button></div></section>' +
      '<section class="role rs" aria-labelledby="r2"><div class="rtop">' + ICO_S + '<span class="rtag">Uczeń</span></div><h2 id="r2">Jestem uczniem</h2><p>Zaloguj się na konto utworzone i przygotowane przez rodzica.</p>' +
      '<div class="ract"><button type="button" class="btn stu big" data-auth="slog">Zaloguj się jako uczeń</button><p class="rnote">Nie masz jeszcze konta? Poproś rodzica o jego utworzenie.</p></div></section>' +
      '</div><footer class="afoot"><p>Bez reklam i bez śledzenia. Aplikacja zapisuje tylko imię lub ksywkę dziecka, awatar i postępy w nauce.</p>' + (st.localCount ? '<p><button type="button" class="alink" data-act="skiplogin">Kontynuuj bez logowania na tym urządzeniu</button> <span class="muted">(zapisane tu profile: ' + st.localCount + ')</span></p>' : '<p><button type="button" class="alink" data-act="skiplogin">Rodzicu, chcesz najpierw tylko wypróbować? Otwórz bez konta</button> <span class="muted">– postępy zostaną wyłącznie na tym urządzeniu.</span></p>') + '</footer></div>';
  }

  function field(id, label, type, val, extra, hint, err) {
    return '<div class="afield' + (err ? ' bad' : '') + '"><label for="' + id + '">' + label + '</label>' + (hint ? '<span class="ahint" id="' + id + '-h">' + hint + '</span>' : '') +
      '<div class="ainp"><input id="' + id + '" name="' + id + '" type="' + type + '" value="' + esc(val || '') + '"' + (extra || '') + (hint || err ? ' aria-describedby="' + (hint ? id + '-h ' : '') + (err ? id + '-e' : '') + '"' : '') + (err ? ' aria-invalid="true"' : '') + '>' +
      (type === 'password' ? '<button type="button" class="apeek" data-peek="' + id + '" aria-label="Pokaż hasło" aria-pressed="false">Pokaż</button>' : '') + '</div>' +
      (err ? '<span class="aerr" id="' + id + '-e">' + err + '</span>' : '') + '</div>';
  }

  // st: {mode: 'register'|'login'|'reset'|'resetsent', email, errs:{}, msg, busy}
  function parent(st) {
    const m = st.mode || 'register', e = st.errs || {}, busy = st.busy ? ' disabled aria-busy="true"' : '';
    let h = '<div class="authwrap narrow">' + brand + back + '<section class="acard rp"><span class="rtag">Konto rodzica</span>';
    if (m === 'reset' || m === 'resetsent') {
      h += '<h1>Odzyskaj hasło rodzica</h1>';
      if (m === 'resetsent') return h + '<div class="fb ok" role="status"><b>Sprawdź skrzynkę ' + esc(st.email) + '.</b><br>Jeśli na ten adres jest konto rodzica, wysłaliśmy wiadomość z linkiem do ustawienia nowego hasła. Link jest ważny przez godzinę. Nie widzisz wiadomości? Zajrzyj do folderu „Oferty" lub „Spam".</div><div class="bar2"><button type="button" class="btn pri" data-auth="plog">Wróć do logowania rodzica</button></div><p class="small muted">Konto zakładane przyciskiem „Kontynuuj z Google" nie ma osobnego hasła – hasło zmienia się wtedy w ustawieniach konta Google.</p></section></div>';
      return h + '<p>Podaj adres e-mail konta rodzica. Wyślemy link do ustawienia nowego hasła.</p><form id="pform" data-mode="reset" novalidate>' + field('pem', 'Adres e-mail rodzica', 'email', st.email, ' autocomplete="email" inputmode="email" required', '', e.em) + msg(st.msg) +
        '<button type="submit" class="btn pri big"' + busy + '>' + (st.busy ? 'Wysyłam…' : 'Wyślij link do zmiany hasła') + '</button></form><p class="aswitch"><button type="button" class="alink" data-auth="plog">← Pamiętam hasło – zaloguj się</button></p></section></div>';
    }
    const reg = m === 'register';
    h += '<h1>' + (reg ? 'Załóż konto rodzica' : 'Zaloguj się jako rodzic') + '</h1><p>' + (reg ? 'Na koncie rodzica zapiszesz profile dzieci i zobaczysz ich postępy na każdym urządzeniu. Następny krok: połączysz konto Google dziecka.' : 'Zobaczysz postępy dzieci i zarządzisz ich kontami.') + '</p>' +
      '<div class="atabs" role="group" aria-label="Konto rodzica"><button type="button" data-auth="preg" aria-pressed="' + reg + '">Nowe konto</button><button type="button" data-auth="plog" aria-pressed="' + !reg + '">Mam już konto</button></div>' +
      '<form id="pform" data-mode="' + m + '" novalidate>' + field('pem', 'Adres e-mail', 'email', st.email, ' autocomplete="email" inputmode="email" required', '', e.em) +
      field('ppw', 'Hasło', 'password', '', ' autocomplete="' + (reg ? 'new-password' : 'current-password') + '" required minlength="8"', reg ? 'Co najmniej 8 znaków. Najlepiej kilka słów lub litery z cyframi.' : '', e.pw) +
      (reg ? field('ppw2', 'Powtórz hasło', 'password', '', ' autocomplete="new-password" required', '', e.pw2) + '<label class="acheck' + (e.ok ? ' bad' : '') + '"><input type="checkbox" id="pok"' + (st.okChecked ? ' checked' : '') + (e.ok ? ' aria-invalid="true" aria-describedby="pok-e"' : '') + '><span>Jestem rodzicem lub opiekunem prawnym i zakładam konto, z którego będę zarządzać kontami dzieci.</span></label>' + (e.ok ? '<span class="aerr" id="pok-e">' + e.ok + '</span>' : '') : '') +
      msg(st.msg) +
      '<button type="submit" class="btn pri big"' + busy + '>' + (st.busy ? (reg ? 'Zakładam konto…' : 'Loguję…') : (reg ? 'Załóż konto rodzica' : 'Zaloguj się jako rodzic')) + '</button>' +
      (reg ? '' : '<p class="aswitch"><button type="button" class="alink" data-auth="preset">Nie pamiętasz hasła?</button></p>') + '</form>' +
      '<div class="aor"><span>albo</span></div><button type="button" class="btn gbtn big" data-auth="pgoogle"' + busy + '>' + G + 'Kontynuuj z Google</button>' +
      '<p class="small muted">Zakładałeś(-aś) wcześniej konto przyciskiem Google? Użyj tego przycisku – lista dzieci i ich postępy są na miejscu.</p>' +
      '<p class="aswitch">' + (reg ? 'Masz już konto rodzica? <button type="button" class="alink" data-auth="plog"><b>Zaloguj się</b></button>' : 'Nie masz konta? <button type="button" class="alink" data-auth="preg"><b>Załóż konto rodzica</b></button>') + '</p></section>' +
      '<p class="afoot small">Hasło przechowuje bezpiecznie usługa logowania Google Firebase – aplikacja go nie widzi. Nie zbieramy danych do reklam.</p></div>';
    return h;
  }

  // st: {email, msg, busy, state: null|'notlinked'|'parentacct'|'error', who}
  function student(st) {
    st = st || {}; const busy = st.busy ? ' disabled aria-busy="true"' : '';
    let h = '<div class="authwrap narrow">' + brand + back + '<section class="acard rs"><span class="rtag">Logowanie ucznia</span>';
    if (st.state === 'parentacct') return h + '<h1>To jest konto rodzica</h1><p>Adres <b>' + esc(st.who) + '</b> należy do konta rodzica, a nie ucznia.</p><div class="bar2"><button type="button" class="btn pri" data-auth="toparentacct">Otwórz panel rodzica</button><button type="button" class="btn" data-auth="sretry">Zaloguj się innym kontem</button></div><p class="small muted">Uczeń loguje się własnym kontem Google, które rodzic połączył w panelu rodzica.</p></section></div>';
    if (st.state === 'notlinked') return h + '<h1>To konto nie jest jeszcze połączone</h1>' +
      '<div class="fb info" role="alert"><p>Konto <b>' + esc(st.who) + '</b> nie zostało jeszcze połączone z kontem rodzica, więc nie możesz się nim zalogować. Nic się nie stało – nie utworzyliśmy żadnego konta.</p></div>' +
      '<h2 class="h3">Co zrobić?</h2><ol class="asteps"><li><b>Poproś rodzica</b>, żeby otworzył Matmę w kratkę i wybrał „Jestem rodzicem”.</li><li>W panelu rodzica przy Twoim profilu rodzic klika <b>„Przypisz konto Google”</b> i wpisuje adres <b>' + esc(st.who) + '</b>.</li><li>Wróć tutaj i zaloguj się jeszcze raz.</li></ol>' +
      '<p class="small muted">Wybrałeś(-aś) inne konto, niż chciałeś(-aś)? Zaloguj się jeszcze raz i wybierz właściwe.</p><div class="bar2"><button type="button" class="btn stu" data-auth="sretry">Spróbuj ponownie</button></div></section></div>';
    return h + '<h1>Cześć! Czas na matematykę!</h1><p>Zaloguj się na swoje konto, aby kontynuować naukę.</p>' +
      '<form id="sform" novalidate>' + field('sem', 'Adres e-mail', 'email', st.email, ' autocomplete="email" inputmode="email" required placeholder="np. kuba.nowak@gmail.com"', 'To adres Twojego konta Google, który rodzic połączył z aplikacją.', st.err) + msg(st.msg) +
      '<button type="submit" class="btn stu big"' + busy + '>' + (st.busy ? 'Otwieram okienko Google…' : 'Zaloguj się') + '</button>' +
      '<p class="ahow"><span aria-hidden="true">🔒</span> Hasło wpiszesz w okienku Google, które się otworzy. Matma w kratkę nie widzi i nie zapisuje Twojego hasła.</p></form>' +
      '<div class="rnote big">Nie masz jeszcze konta? Poproś rodzica o jego utworzenie.</div></section></div>';
  }

  // wprowadzenie rodzica po założeniu konta – st: {who, verified, viaGoogle, kids:[{id,name,email}], msg}
  function pwelcome(st) {
    const needV = !st.verified && !st.viaGoogle;
    const step = (n, title, body, state) => '<li class="astep ' + (state || '') + '"><span class="anum" aria-hidden="true">' + (state === 'done' ? '✓' : n) + '</span><div><b>' + title + '</b>' + (state === 'done' ? ' <span class="small" style="color:var(--ok)">– zrobione</span>' : '') + '<p>' + body + '</p></div></li>';
    let h = '<div class="authwrap narrow">' + brand + '<section class="acard rp"><span class="rtag">Konto rodzica · ' + esc(st.who) + '</span><h1>Dodaj konto swojego dziecka</h1><p>Połącz konto Google dziecka, aby umożliwić mu logowanie do Matmy w kratkę i korzystanie z własnego profilu nauki.</p>' + msg(st.msg) + '<ol class="asteplist">';
    let n = 1;
    if (!st.viaGoogle) h += step(n++, 'Potwierdź swój adres e-mail', needV ? 'Wysłaliśmy link na <b>' + esc(st.who) + '</b>. Kliknij go, a potem wróć tutaj. Bez potwierdzenia nie da się połączyć konta dziecka – to chroni dzieci przed podszywaniem się pod rodzica.<span class="bar2" style="margin-top:8px"><button type="button" class="btn sm pri" data-auth="pverified">Już potwierdziłem(-am)</button><button type="button" class="btn sm" data-auth="presend">Wyślij link ponownie</button></span>' : 'Adres potwierdzony.', needV ? 'now' : 'done');
    h += step(n++, 'Utwórz profil dziecka', 'Imię lub ksywka, klasa, awatar i zainteresowania. Bez nazwiska i innych danych osobowych.', st.kids.length ? 'done' : (needV ? '' : 'now'));
    h += step(n++, 'Połącz konto Google dziecka', 'Wpisz adres Gmail dziecka (np. konto z Family Link). Dziecko nie zakłada niczego samo – to Ty decydujesz, które konto ma dostęp.', st.kids.some(k => k.email) ? 'done' : '');
    h += step(n++, 'Dziecko się loguje', 'Na swoim urządzeniu dziecko wybiera „Jestem uczniem” i loguje się swoim kontem Google. Zobaczy tylko swoje lekcje, bez panelu rodzica.', '');
    h += '</ol><div class="bar2"><button type="button" class="btn pri big" data-act="addchildp">Utwórz profil dziecka</button></div>' +
      '<p class="small muted">Dziecko nie ma własnego konta Google? Może też ćwiczyć na Twoim urządzeniu – wtedy wystarczy krok 2.</p><p class="aswitch"><button type="button" class="alink" data-act="glogout">Wyloguj się</button></p></section></div>';
    return h;
  }

  // krok „połącz konto Google dziecka" zaraz po utworzeniu profilu – st: {kid:{id,name,email}, msg, busy, err, verified, viaGoogle}
  function plink(st) {
    const k = st.kid, busy = st.busy ? ' disabled aria-busy="true"' : '';
    return '<div class="authwrap narrow">' + brand + '<section class="acard rp"><span class="rtag">Konto rodzica · krok 3 z 4</span><h1>Połącz konto Google: ' + esc(k.name) + '</h1>' +
      '<p>Wpisz adres konta Google dziecka. Potem ' + esc(k.name) + ' zaloguje się nim na swoim urządzeniu, wybierając „Jestem uczniem”.</p>' +
      '<form id="linkform" data-id="' + esc(k.id) + '" data-flow="onb" novalidate>' + field('lem', 'Adres Gmail dziecka', 'email', st.email || k.email || '', ' autocomplete="off" inputmode="email" required placeholder="np. kuba.nowak@gmail.com"', 'Konto Google z Family Link też działa – Google może wtedy poprosić Cię o zgodę przy pierwszym logowaniu dziecka.', st.err) +
      msg(st.msg) + '<p class="small" id="lemmsg" role="status"></p><div class="bar2"><button type="submit" class="btn pri big"' + busy + '>' + (st.busy ? 'Łączę…' : 'Połącz konto dziecka') + '</button><button type="button" class="btn ghost" data-auth="plinkskip">Pomiń – dziecko ćwiczy na moim urządzeniu</button></div></form>' +
      '<details class="small"><summary>Jak to działa i co z hasłem dziecka?</summary><p>Dziecko loguje się przez Google – hasło jest hasłem jego konta Google (w Family Link ustawiasz je Ty). Matma w kratkę nie tworzy osobnego hasła i nigdy go nie widzi. Połączenie możesz w każdej chwili zmienić lub odłączyć w panelu rodzica.</p></details></section></div>';
  }
  function plinked(st) {
    return '<div class="authwrap narrow">' + brand + '<section class="acard rp"><span class="rtag">Konto rodzica · gotowe</span><div class="fb ok big" role="status"><span class="okico" aria-hidden="true">✓</span><div><b>Konto dziecka zostało połączone. Może już zalogować się do aplikacji.</b><p class="small">' + esc(st.kid.name) + ' · ' + esc(st.kid.email) + '</p></div></div>' +
      '<h2 class="h3">Pierwsze logowanie dziecka</h2><ol class="asteps"><li>Na urządzeniu dziecka otwórz <b>' + esc(location.host || 'Matmę w kratkę') + '</b>.</li><li>Dziecko wybiera <b>„Jestem uczniem” → „Zaloguj się jako uczeń”</b> i wpisuje adres <b>' + esc(st.kid.email) + '</b>.</li><li>W okienku Google wpisuje hasło swojego konta Google. Przy koncie z Family Link Google może poprosić Ciebie o zgodę.</li></ol>' +
      '<div class="bar2"><button type="button" class="btn pri" data-auth="topanel">Przejdź do panelu rodzica</button><button type="button" class="btn" data-act="addchildp">Dodaj kolejne dziecko</button></div></section></div>';
  }
  function loading(t) { return '<div class="authwrap narrow">' + brand + '<section class="acard"><p class="aload" role="status"><span class="spin" aria-hidden="true"></span>' + esc(t || 'Chwileczkę…') + '</p></section></div>'; }

  // komunikaty błędów Firebase Authentication po polsku
  function errText(code, ctx) {
    const c = String(code || '').replace('auth/', '');
    const T = {
      'email-already-in-use': 'Na ten adres jest już konto. <button type="button" class="alink" data-auth="plog">Zaloguj się</button> albo <button type="button" class="alink" data-auth="preset">odzyskaj hasło</button>. Jeśli zakładałeś(-aś) konto przez Google, użyj przycisku „Kontynuuj z Google”.',
      'invalid-email': 'To nie wygląda na poprawny adres e-mail.',
      'weak-password': 'Hasło jest za słabe – użyj co najmniej 8 znaków.',
      'wrong-password': 'Nieprawidłowy e-mail lub hasło. Jeśli konto zakładałeś(-aś) przez Google, użyj przycisku „Kontynuuj z Google”.',
      'invalid-credential': 'Nieprawidłowy e-mail lub hasło. Jeśli konto zakładałeś(-aś) przez Google, użyj przycisku „Kontynuuj z Google”.',
      'invalid-login-credentials': 'Nieprawidłowy e-mail lub hasło. Jeśli konto zakładałeś(-aś) przez Google, użyj przycisku „Kontynuuj z Google”.',
      'user-not-found': 'Nieprawidłowy e-mail lub hasło. Nie masz konta? <button type="button" class="alink" data-auth="preg">Załóż konto rodzica</button>.',
      'too-many-requests': 'Za dużo prób. Odczekaj kilka minut albo <button type="button" class="alink" data-auth="preset">ustaw nowe hasło</button>.',
      'network-request-failed': 'Brak połączenia z internetem. Sprawdź połączenie i spróbuj ponownie.',
      'user-disabled': 'To konto zostało zablokowane.',
      'operation-not-allowed': 'Logowanie e-mailem i hasłem nie jest jeszcze włączone w tej aplikacji. Użyj przycisku „Kontynuuj z Google”.',
      'popup-blocked': 'Przeglądarka zablokowała okienko logowania Google. Zezwól na wyskakujące okienka dla tej strony i spróbuj ponownie.',
      'account-exists-with-different-credential': 'Na ten adres jest już konto zakładane e-mailem i hasłem. Zaloguj się e-mailem i hasłem.',
      'timeout': 'Nie udało się sprawdzić konta – słabe połączenie. Spróbuj ponownie.',
      'unavailable': 'Nie udało się połączyć z serwerem. Spróbuj ponownie za chwilę.'
    };
    return T[c] || ('Nie udało się ' + (ctx || 'zalogować') + '. Spróbuj ponownie' + (c ? ' (kod: ' + esc(c) + ')' : '') + '.');
  }
  // walidacja formularza rodzica (zwraca obiekt błędów pól; pusty = OK)
  function validateParent(mode, v) {
    const e = {}; const em = String(v.email || '').trim();
    if (!em) e.em = 'Wpisz adres e-mail.'; else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(em)) e.em = 'To nie wygląda na poprawny adres e-mail (np. jan.kowalski@gmail.com).';
    if (mode === 'reset') return e;
    if (!v.pw) e.pw = 'Wpisz hasło.'; else if (mode === 'register' && v.pw.length < 8) e.pw = 'Hasło musi mieć co najmniej 8 znaków.';
    if (mode === 'register') { if (!e.pw && v.pw2 !== v.pw) e.pw2 = 'Hasła się różnią – wpisz to samo hasło dwa razy.'; if (!v.ok) e.ok = 'Potwierdź, że jesteś rodzicem lub opiekunem.'; }
    return e;
  }
  MP.authViews = { role, parent, student, pwelcome, plink, plinked, loading, errText, validateParent };
})(MP);
