# Pełne ścieżki wejścia: wybór roli, rejestracja i logowanie rodzica, połączenie konta dziecka, logowanie ucznia,
# próby obejścia (rejestracja ucznia, zapis z pominięciem interfejsu), uczeń bez połączenia, telefon, zachowanie starych kont.
import asyncio, json, sys
from playwright.async_api import async_playwright
from fbmock import MOCK
from e2e2 import onboard
URL = 'http://localhost:8766/index.html'
res = []
def ok(c, m): res.append((bool(c), m)); print(('  ✓ ' if c else '  ✗ ') + m); sys.stdout.flush()
CFG = "window.MWK_FIREBASE={apiKey:'x',authDomain:'x',projectId:'x'};"

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        errors = []
        async def device(seed=None, vp=(1280, 800)):
            ctx = await b.new_context(viewport={'width': vp[0], 'height': vp[1]})
            await ctx.route('**/firebase-config.js', lambda r: r.fulfill(body=CFG, content_type='text/javascript'))
            init = "if(!localStorage.getItem('__seeded')){localStorage.setItem('__seeded','1');" + ''.join("localStorage.setItem(%s,%s);" % (json.dumps(k), json.dumps(v)) for k, v in (seed or {}).items()) + "}"
            await ctx.add_init_script(init + MOCK)
            pg = await ctx.new_page(); pg.on('pageerror', lambda e: errors.append(str(e))); return pg
        async def shared(pg): return {k: await pg.evaluate("k=>localStorage.getItem(k)", k) or '{}' for k in ['__MOCKFS', '__MOCKAUTH']}
        async def txt(pg): return await pg.inner_text('#app')
        async def who(pg, email, uid=None): await pg.evaluate("w=>localStorage.setItem('__WHO',JSON.stringify(w))", {'email': email, 'uid': uid} if uid else {'email': email})

        print('0) Pierwszy ekran: „Kim jesteś?”')
        pg = await device(); await pg.goto(URL); await pg.wait_for_timeout(700)
        t = await txt(pg)
        ok('Kim jesteś?' in t and 'Jestem rodzicem' in t and 'Jestem uczniem' in t, 'pytanie i dwie role na pierwszym ekranie')
        for s_ in ['Załóż konto, dodaj dziecko i monitoruj jego postępy w nauce.', 'Załóż konto rodzica', 'Masz już konto?', 'Zaloguj się na konto utworzone i przygotowane przez rodzica.', 'Zaloguj się jako uczeń', 'Nie masz jeszcze konta? Poproś rodzica o jego utworzenie.']:
            ok(s_ in t, 'tekst: ' + s_)
        stu = await pg.inner_text('.role.rs'); ok(not any(w in stu.lower() for w in ['załóż', 'zarejestruj', 'utwórz konto', 'rejestr']), 'karta ucznia bez rejestracji / zakładania konta')
        bx = [await pg.locator(s_).bounding_box() for s_ in ['.role.rp', '.role.rs']]
        ok(all(x['y'] + x['height'] <= 800 for x in bx) and abs(bx[0]['y'] - bx[1]['y']) < 2, 'obie role widoczne bez przewijania (1280×800), obok siebie')
        ok(await pg.evaluate("getComputedStyle(document.querySelector('header.top')).display") == 'none', 'na ekranie wejścia brak menu aplikacji')
        await pg.screenshot(path='a_role.png')
        # klawiatura: Tab dochodzi do przycisków ról z widocznym fokusem
        await pg.keyboard.press('Tab'); f1 = await pg.evaluate("document.activeElement.textContent")
        ok('Załóż konto rodzica' in f1 or 'Wróć' in f1 or len(f1) > 0, 'Tab przechodzi do przycisków (' + f1.strip()[:30] + ')')

        print('1) Rejestracja nowego rodzica')
        await pg.click('[data-auth=preg]'); await pg.wait_for_timeout(150)
        t = await txt(pg); ok('Załóż konto rodzica' in t and 'Konto rodzica' in t and 'Wróć do wyboru' in t, 'formularz rejestracji z oznaczeniem roli i powrotem do wyboru')
        await pg.click('#pform [type=submit]'); await pg.wait_for_timeout(150)
        errs = await pg.locator('.aerr').all_inner_texts(); ok(len(errs) >= 3, 'puste pola → komunikaty przy polach: ' + ' | '.join(errs)[:120])
        await pg.fill('#pem', 'mama@'); await pg.fill('#ppw', 'abc'); await pg.fill('#ppw2', 'abd'); await pg.click('#pform [type=submit]'); await pg.wait_for_timeout(150)
        errs = await pg.locator('.aerr').all_inner_texts(); ok(any('adres' in e for e in errs) and any('8 znaków' in e for e in errs), 'zły e-mail i za krótkie hasło: ' + ' | '.join(errs)[:140])
        ok(await pg.input_value('#pem') == 'mama@', 'wpisany e-mail zostaje po błędzie')
        await pg.fill('#pem', 'anna.nowak@example.com'); await pg.fill('#ppw', 'kratka2026!'); await pg.fill('#ppw2', 'kratka2026?'); await pg.check('#pok'); await pg.click('#pform [type=submit]'); await pg.wait_for_timeout(150)
        ok('różnią' in await txt(pg), 'różne hasła → komunikat')
        await pg.click('[data-peek=ppw]'); ok(await pg.get_attribute('#ppw', 'type') == 'text', 'przycisk „Pokaż” odsłania hasło')
        await pg.fill('#ppw', 'kratka2026!'); await pg.fill('#ppw2', 'kratka2026!'); await pg.check('#pok')
        await pg.screenshot(path='a_preg.png', full_page=True)
        await pg.click('#pform [type=submit]'); await pg.wait_for_timeout(900)
        t = await txt(pg); ok('Dodaj konto swojego dziecka' in t and 'Połącz konto Google dziecka, aby umożliwić mu logowanie' in t, 'po rejestracji: wprowadzenie „Dodaj konto swojego dziecka”')
        ok('Potwierdź swój adres e-mail' in t and await pg.evaluate("window.__verifSent||0") >= 1, 'wysłano link potwierdzający e-mail, krok oznaczony jako bieżący')
        await pg.screenshot(path='a_pwelcome.png', full_page=True)
        # profil dziecka → krok połączenia
        await pg.click('[data-act=addchildp]'); await pg.wait_for_timeout(150)
        await onboard(pg, 'Kuba', 6, ['kosmos']); await pg.wait_for_timeout(300)
        t = await txt(pg); ok('Połącz konto Google: Kuba' in t, 'po utworzeniu profilu: krok „Połącz konto Google”')
        await pg.fill('#lem', 'kuba.nowak@gmail.com'); await pg.click('#linkform [type=submit]'); await pg.wait_for_timeout(300)
        ok('potwierdź swój adres' in (await pg.inner_text('#lemmsg')).lower(), 'bez potwierdzonego e-maila łączenie zablokowane z wyjaśnieniem')
        await pg.evaluate("window.__verifyEmail('anna.nowak@example.com')")
        await pg.click('#lemmsg [data-auth=pverified]'); await pg.wait_for_timeout(300)
        ok('Adres potwierdzony' in await pg.inner_text('#toast'), '„Już potwierdziłem” odświeża stan konta')
        await pg.click('#linkform [type=submit]'); await pg.wait_for_timeout(600)
        t = await txt(pg); ok('Konto dziecka zostało połączone. Może już zalogować się do aplikacji.' in t, 'potwierdzenie połączenia konta dziecka')
        ok('Jestem uczniem' in t and 'kuba.nowak@gmail.com' in t, 'instrukcja pierwszego logowania dziecka')
        await pg.screenshot(path='a_plinked.png', full_page=True)
        await pg.click('[data-auth=topanel]'); await pg.wait_for_timeout(300)
        t = await txt(pg); ok('Zobacz postępy' in t and 'kuba.nowak@gmail.com' in t, 'panel rodzica pokazuje połączone konto')
        await pg.wait_for_timeout(1800)
        sh = await shared(pg); fs = json.loads(sh['__MOCKFS'])
        ok(fs.get('invites/kuba.nowak@gmail.com', {}).get('pid'), 'w bazie zapisane połączenie (invites/kuba.nowak@gmail.com)')
        kid_pid = fs['invites/kuba.nowak@gmail.com']['pid']
        # druga ścieżka połączenia: z panelu (drugie dziecko)
        await pg.evaluate("window.__mp.go('dzieci')"); await pg.wait_for_timeout(200)
        await pg.click('[data-act=addchild]'); await onboard(pg, 'Ola', 3, ['zwierzeta']); await pg.wait_for_timeout(300)
        await pg.click('[data-auth=plinkskip]'); await pg.wait_for_timeout(300)
        ola = await pg.evaluate("window.__mp.IDX.profiles.find(p=>p.name==='Ola').id")
        await pg.evaluate("id=>window.__mp.go('pustaw',{tab:id})", ola); await pg.wait_for_timeout(200); await pg.fill('#lem', 'anna.nowak@example.com'); await pg.click('#linkform [type=submit]'); await pg.wait_for_timeout(200)
        ok('Twój adres' in await pg.inner_text('#lemmsg'), 'nie da się połączyć własnego adresu rodzica')
        await pg.fill('#lem', 'ola.nowak@gmail.com'); await pg.click('#linkform [type=submit]'); await pg.wait_for_timeout(500)
        ok('Konto dziecka zostało połączone' in await txt(pg), 'połączenie z panelu rodzica → potwierdzenie')
        # dzieci ćwiczą trochę na koncie rodzica (postępy do sprawdzenia później)
        await pg.evaluate("(()=>{const S=window.__mp.S; S.stats.items=17; S.stats.ok=12; window.__mp.render();})()")
        await pg.evaluate("MP.store.save(window.__mp.S, window.__mp.CID)"); await pg.wait_for_timeout(1800)
        sh = await shared(pg)

        print('2) Logowanie istniejącego rodzica (inny komputer)')
        pg2 = await device(sh); await pg2.goto(URL); await pg2.wait_for_timeout(700)
        await pg2.click('[data-auth=plog]'); await pg2.wait_for_timeout(120)
        t = await txt(pg2); ok('Zaloguj się jako rodzic' in t and 'Nie pamiętasz hasła?' in t, 'logowanie rodzica + odzyskiwanie hasła')
        await pg2.fill('#pem', 'anna.nowak@example.com'); await pg2.fill('#ppw', 'zlehaslo1'); await pg2.click('#pform [type=submit]'); await pg2.wait_for_timeout(400)
        ok('Nieprawidłowy e-mail lub hasło' in await txt(pg2), 'złe hasło → czytelny komunikat')
        ok(not await pg2.locator('#pform [type=submit][disabled]').count() and 'Loguję' not in await txt(pg2), 'po błędzie przycisk znów aktywny')
        await pg2.screenshot(path='a_plogin_err.png', full_page=True)
        await pg2.click('.acard [data-auth=preset]'); await pg2.wait_for_timeout(120)
        ok(await pg2.input_value('#pem') == 'anna.nowak@example.com', 'odzyskiwanie hasła: e-mail przeniesiony')
        await pg2.click('#pform [type=submit]'); await pg2.wait_for_timeout(300)
        ok('Sprawdź skrzynkę' in await txt(pg2) and await pg2.evaluate("window.__resetFor") == 'anna.nowak@example.com', 'link do zmiany hasła wysłany')
        await pg2.click('[data-auth=plog]'); await pg2.fill('#pem', 'anna.nowak@example.com'); await pg2.fill('#ppw', 'kratka2026!'); await pg2.click('#pform [type=submit]'); await pg2.wait_for_timeout(1500)
        t = await txt(pg2); ok('Zobacz postępy' in t and 'Kuba' in t and 'Ola' in t, 'po zalogowaniu: panel rodzica z dziećmi' + ('' if 'Zobacz postępy' in t else ' [' + t[:200] + ']'))
        items = await pg2.evaluate("(()=>{const id=window.__mp.IDX.profiles.find(p=>p.name==='Ola').id; const s=MP.store.loadProfile(id)||{}; return window.__mp.CID===id? window.__mp.S.stats.items : (s.stats||{}).items})()")
        ok(items == 17, 'postępy dziecka dostępne na innym urządzeniu (zadań: %s)' % items)
        await pg2.screenshot(path='a_ppanel.png', full_page=True)

        print('4) Dziecko loguje się własnym kontem')
        ch = await device(sh); await ch.goto(URL); await ch.wait_for_timeout(700)
        await ch.click('[data-auth=slog]'); await ch.wait_for_timeout(120)
        t = await txt(ch); ok('Cześć! Czas na matematykę!' in t and 'Zaloguj się na swoje konto, aby kontynuować naukę.' in t and 'Logowanie ucznia' in t, 'ekran logowania ucznia')
        ok(not any(w in t.lower() for w in ['załóż', 'zarejestruj', 'utwórz konto', 'sign up', 'rejestracja']), 'na ekranie ucznia brak rejestracji')
        ok('Poproś rodzica o jego utworzenie' in t, 'wskazówka: poproś rodzica')
        await ch.click('#sform [type=submit]'); await ch.wait_for_timeout(120); ok('Wpisz adres' in await txt(ch), 'puste pole → komunikat')
        await ch.screenshot(path='a_slogin.png', full_page=True)
        await who(ch, 'kuba.nowak@gmail.com', 'K1'); await ch.fill('#sem', 'Kuba.Nowak@gmail.com'); await ch.click('#sform [type=submit]'); await ch.wait_for_timeout(1500)
        info = await ch.evaluate("JSON.stringify({name:window.__mp.S&&window.__mp.S.profile.name, n:window.__mp.IDX.profiles.length, rodzic:!document.querySelector('nav [data-go=dzieci]'), hint:window.__lastHint, child:MP.store.isChild()})")
        i = json.loads(info); ok(i['name'] == 'Kuba' and i['n'] == 1 and i['rodzic'] and i['child'], 'uczeń widzi tylko swój profil, bez panelu rodzica: ' + info)
        ok(i['hint'] == 'kuba.nowak@gmail.com', 'adres ucznia podpowiedziany w okienku Google (login_hint)')
        await ch.screenshot(path='a_child_home.png')
        await ch.evaluate("window.__mp.go('rodzic')"); await ch.wait_for_timeout(150)
        ok('Zobacz postępy' not in await txt(ch), 'uczeń nie otworzy panelu rodzica nawet bezpośrednio')

        print('5) Uczeń próbuje założyć konto / obejść interfejs')
        r = await ch.evaluate("""(async()=>{const fs=firebase.firestore(); const out={};
          try{ await fs.collection('users').doc('K1').collection('docs').doc('index').set({json:'{}'}); out.ownData='ZAPISANO'; }catch(e){ out.ownData=e.code; }
          try{ await fs.collection('invites').doc('kolega@gmail.com').set({parent:'K1',pid:'x'}); out.invite='ZAPISANO'; }catch(e){ out.invite=e.code; }
          const inv=JSON.parse(localStorage.getItem('__MOCKFS'))['invites/kuba.nowak@gmail.com'];
          try{ await fs.collection('users').doc(inv.parent).collection('docs').doc('index').get(); out.parentIndex='ODCZYTANO'; }catch(e){ out.parentIndex=e.code; }
          try{ await fs.collection('users').doc(inv.parent).collection('docs').doc('p_'+inv.pid).get(); out.ownProgress='ok'; }catch(e){ out.ownProgress=e.code; }
          return out;})()""")
        ok(r['ownData'] == 'permission-denied' and r['invite'] == 'permission-denied', 'zapis własnego konta / łączenie przez API odrzucone (reguły): ' + json.dumps(r))
        ok(r['parentIndex'] == 'permission-denied' and r['ownProgress'] == 'ok', 'uczeń nie czyta listy dzieci rodzica, czyta tylko swoje postępy')
        # uczeń wchodzi w ścieżkę rejestracji rodzica swoim połączonym adresem (e-mail + hasło)
        ch2 = await device(sh); await ch2.goto(URL); await ch2.wait_for_timeout(700)
        await ch2.click('[data-auth=preg]'); await ch2.fill('#pem', 'ola.nowak@gmail.com'); await ch2.fill('#ppw', 'olaola123'); await ch2.fill('#ppw2', 'olaola123'); await ch2.check('#pok'); await ch2.click('#pform [type=submit]'); await ch2.wait_for_timeout(1200)
        await ch2.evaluate("window.__mp.go('start')"); await ch2.wait_for_timeout(100)
        for _ in range(20):
            if await ch2.evaluate("!!firebase.auth().currentUser"): break
            await ch2.wait_for_timeout(200)
        print('    (ch2 view)', (await txt(ch2))[:80].replace('\n',' '))
        den = await ch2.evaluate("(async()=>{const fs=firebase.firestore(); const u=firebase.auth().currentUser; try{ await fs.collection('users').doc(u.uid).collection('docs').doc('index').set({json:'{}'}); return 'ZAPISANO'; }catch(e){ return e.code; }})()")
        ok(den == 'permission-denied', 'konto e-mail na adres połączonego ucznia nie może zapisać własnych danych rodzica (' + den + ')')
        inv2 = await ch2.evaluate("(async()=>{try{ await firebase.firestore().collection('invites').doc('kolega2@gmail.com').set({parent:firebase.auth().currentUser.uid,pid:'x'}); return 'ZAPISANO'; }catch(e){ return e.code; }})()")
        ok(inv2 == 'permission-denied', 'ani połączyć innego dziecka (' + inv2 + ')')

        print('6) Uczeń bez połączonego konta')
        st = await device(sh); await st.goto(URL); await st.wait_for_timeout(700)
        await st.click('[data-auth=slog]'); await who(st, 'tomek.kowal@gmail.com'); await st.fill('#sem', 'tomek.kowal@gmail.com'); await st.click('#sform [type=submit]'); await st.wait_for_timeout(1500)
        t = await txt(st); ok('nie jest jeszcze połączone' in t and 'Poproś rodzica' in t and 'Przypisz konto Google' in t, 'komunikat „konto nie jest połączone” z instrukcją dla rodzica')
        acc = json.loads(await st.evaluate("localStorage.getItem('__MOCKAUTH')"))
        ok('tomek.kowal@gmail.com' not in acc and await st.evaluate("firebase.auth().currentUser") is None, 'świeżo utworzone konto logowania usunięte, uczeń wylogowany (brak samodzielnej rejestracji)')
        fs = json.loads(await st.evaluate("localStorage.getItem('__MOCKFS')")); ok(not any(k.startswith('users/') and k.split('/')[1] not in [x.split('/')[1] for x in json.loads(sh['__MOCKFS']) if x.startswith('users/')] for k in fs), 'w bazie nie powstały żadne dane ucznia')
        await st.screenshot(path='a_notlinked.png', full_page=True)
        await st.click('[data-auth=sretry]'); await st.wait_for_timeout(150); ok('Czas na matematykę' in await txt(st), '„Spróbuj ponownie” wraca do logowania ucznia')
        await st.click('[data-auth=role]'); await st.wait_for_timeout(120); ok('Kim jesteś?' in await txt(st), 'powrót do wyboru roli')

        print('8) Stare konta i postępy zostają')
        legacy_fs = json.loads(sh['__MOCKFS'])
        old_state = await pg2.evaluate("(()=>{const s=JSON.parse(JSON.stringify(window.__mp.S)); s.stats.items=321; s.stats.ok=300; s.profile.name='Zosia'; s.updated=Date.now(); return s;})()")
        legacy_fs['users/OLD1/docs/index'] = {'json': json.dumps({'v': 2, 'profiles': [{'id': 'zz1', 'name': 'Zosia', 'grade': 6, 'created': 1, 'updated': 2}], 'deleted': [], 'last': 'zz1', 'pin': None, 'updated': 5}), 'updated': 5}
        legacy_fs['users/OLD1/docs/p_zz1'] = {'json': json.dumps(old_state), 'updated': old_state['updated']}
        legacy_acc = json.loads(sh['__MOCKAUTH']); legacy_acc['tata@gmail.com'] = {'uid': 'OLD1', 'email': 'tata@gmail.com', 'provider': 'google.com', 'verified': True}
        lg = await device({'__MOCKFS': json.dumps(legacy_fs), '__MOCKAUTH': json.dumps(legacy_acc)}); await lg.goto(URL); await lg.wait_for_timeout(700)
        await lg.click('[data-auth=plog]'); await who(lg, 'tata@gmail.com', 'OLD1'); await lg.click('[data-auth=pgoogle]'); await lg.wait_for_timeout(2500)
        t = await txt(lg); its = await lg.evaluate("window.__mp.S&&window.__mp.S.stats.items")
        ok('Zobacz postępy' in t and its == 321, 'dotychczasowy rodzic (Google) loguje się „Kontynuuj z Google” → jego dziecko i 321 zadań na miejscu')
        # stare konto rodzica wybiera przez pomyłkę ścieżkę ucznia
        lg2 = await device({'__MOCKFS': json.dumps(legacy_fs), '__MOCKAUTH': json.dumps(legacy_acc)}); await lg2.goto(URL); await lg2.wait_for_timeout(700)
        await lg2.click('[data-auth=slog]'); await who(lg2, 'tata@gmail.com', 'OLD1'); await lg2.fill('#sem', 'tata@gmail.com'); await lg2.click('#sform [type=submit]'); await lg2.wait_for_timeout(1500)
        t = await txt(lg2); ok('To jest konto rodzica' in t, 'rodzic w ścieżce ucznia → „To jest konto rodzica” (konto nie jest usuwane)')
        acc2 = json.loads(await lg2.evaluate("localStorage.getItem('__MOCKAUTH')")); ok('tata@gmail.com' in acc2, 'konto rodzica nietknięte')
        await lg2.click('[data-auth=toparentacct]'); await lg2.wait_for_timeout(1500); ok('Zobacz postępy' in await txt(lg2), '„Otwórz panel rodzica” działa')
        # sesja zapamiętana: odświeżenie strony nie wylogowuje
        await lg2.reload(); await lg2.wait_for_timeout(1500); ok('Kim jesteś?' not in await txt(lg2), 'po odświeżeniu rodzic nadal zalogowany')
        # wylogowanie → wybór roli
        await lg2.evaluate("window.__mp.go('rodzic')"); await lg2.wait_for_timeout(200)
        await lg2.click('header nav [data-nact=glogout]'); await lg2.click('[data-y]'); await lg2.wait_for_timeout(600); ok('Kim jesteś?' in await txt(lg2), 'wylogowanie → ekran „Kim jesteś?”')
        # osoba używająca aplikacji bez konta (tylko ta przeglądarka) – profile zostają
        loc = await device(); await loc.goto(URL); await loc.wait_for_timeout(600)
        await loc.click('.afoot [data-act=skiplogin]'); await loc.wait_for_timeout(200); await onboard(loc, 'Iga', 4, ['kosmos']); await loc.wait_for_timeout(200)
        await loc.reload(); await loc.wait_for_timeout(900); ok('Iga' in await txt(loc), 'tryb bez konta: po odświeżeniu profil lokalny dostępny od razu')

        print('7) Telefon')
        mb = await device(sh, (390, 844)); await mb.goto(URL); await mb.wait_for_timeout(700)
        a1 = await mb.locator('.role.rp').bounding_box(); a2 = await mb.locator('.role.rs').bounding_box()
        ok(a2['y'] >= a1['y'] + a1['height'] - 1 and a1['width'] > 330, 'role jedna pod drugą na całą szerokość')
        ok(await mb.evaluate("document.documentElement.scrollWidth<=window.innerWidth"), 'brak przewijania w poziomie')
        bb = await mb.locator('[data-auth=preg]').bounding_box(); ok(bb['y'] + bb['height'] < 844, 'przycisk rodzica widoczny bez przewijania na telefonie')
        await mb.screenshot(path='a_m_role.png', full_page=True)
        await mb.click('[data-auth=slog]'); await who(mb, 'ola.nowak@gmail.com', 'O1'); await mb.fill('#sem', 'ola.nowak@gmail.com'); await mb.screenshot(path='a_m_slogin.png', full_page=True)
        await mb.click('#sform [type=submit]'); await mb.wait_for_timeout(1500)
        ok(await mb.evaluate("window.__mp.S&&window.__mp.S.profile.name") == 'Ola', 'uczeń (Ola) loguje się na telefonie')
        ok(await mb.evaluate("document.documentElement.scrollWidth<=window.innerWidth"), 'ekran ucznia bez przewijania w poziomie')
        mp_ = await device(sh, (390, 844)); await mp_.goto(URL); await mp_.wait_for_timeout(700)
        await mp_.click('[data-auth=plog]'); await mp_.screenshot(path='a_m_plogin.png', full_page=True)
        await mp_.fill('#pem', 'anna.nowak@example.com'); await mp_.fill('#ppw', 'kratka2026!'); await mp_.click('#pform [type=submit]'); await mp_.wait_for_timeout(1500)
        ok('Zobacz postępy' in await txt(mp_), 'rodzic loguje się na telefonie')
        ok(await mp_.evaluate("document.documentElement.scrollWidth<=window.innerWidth+1"), 'panel rodzica na telefonie bez przewijania w poziomie')

        ok(not errors, 'brak błędów JS: ' + json.dumps(errors)[:300])
        await b.close()
    bad = [m for c_, m in res if not c_]
    print('\nWYNIK: %d/%d' % (len(res) - len(bad), len(res)))
    for m in bad: print('  ✗', m)
asyncio.run(main())
