# Test manualny (zautomatyzowany przebieg klikany jak przez człowieka) – funkcje rodzica, ucznia, synchronizacja, sprawdzian
import asyncio, json, os, re
from playwright.async_api import async_playwright
from fbmock import MOCK
URL = 'http://localhost:8766/index.html'; OUT = 'wyniki/manual'; os.makedirs(OUT, exist_ok=True)
CFG = "window.MWK_FIREBASE={apiKey:'x',authDomain:'x',projectId:'x'};"
RES = []
def ok(c, m, note=''): RES.append({'ok': bool(c), 'm': m, 'note': note}); print(('  ✓ ' if c else '  ✗ ') + m + ((' — ' + note) if note else ''))
ANS = r"""(()=>{const c=window.__mp.S.session.cur; if(!c||c.card) return null; const it=MP.engine.buildItem(c.spec); const a=it.answer;
  if(a.kind==='num'){const v=a.value; let s=(v.n<0?'-':'')+Math.abs(v.n)+(v.d>1?'/'+v.d:''); if(!MP.items.check(it,s).ok){const w=Math.trunc(Math.abs(v.n)/v.d),r=Math.abs(v.n)%v.d; s=(v.n<0?'-':'')+w+' '+r+'/'+v.d;} return {t:'num',v:s};}
  if(a.kind==='choice') return {t:'opt',v:a.correct}; return {t:'other',type:it.type};})()"""
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox']); errs = []
        async def dev(seed=None, vp=(1100, 900)):
            ctx = await b.new_context(viewport={'width': vp[0], 'height': vp[1]})
            await ctx.route('**/firebase-config.js', lambda r: r.fulfill(body=CFG, content_type='text/javascript'))
            init = "if(!localStorage.getItem('__seeded')){localStorage.setItem('__seeded','1');" + ''.join("localStorage.setItem(%s,%s);" % (json.dumps(k), json.dumps(v)) for k, v in (seed or {}).items()) + "}"
            await ctx.add_init_script(init + MOCK); pg = await ctx.new_page(); pg.on('pageerror', lambda e: errs.append(str(e)[:200])); return pg
        async def lesson_answer(pg, n, right=True):
            done = 0
            for _ in range(n * 4):
                if done >= n: break
                if await pg.locator('[data-act=cardnext]').count(): await pg.click('[data-act=cardnext]'); continue
                if await pg.locator('[data-act=next]').count(): await pg.click('[data-act=next]'); await pg.wait_for_timeout(60); continue
                a = await pg.evaluate(ANS)
                if not a: break
                if a['t'] == 'num' and await pg.locator('#inp').count(): await pg.fill('#inp', a['v'] if right else '977'); await pg.click('[data-act=checkans]')
                elif a['t'] == 'opt': await pg.click(f'[data-opt="{a["v"]}"]'); await pg.click('[data-act=checkans]')
                else:
                    while await pg.locator('[data-act=hint]').count(): await pg.click('[data-act=hint]')
                    if await pg.locator('[data-act=showsol]').count(): await pg.click('[data-act=showsol]')
                    if await pg.locator('[data-act=dontknow]').count(): await pg.click('[data-act=dontknow]')
                    else: await pg.evaluate("window.__mp.S.session.queue=[]; window.__mp.S.session.cur.done=true; window.__mp.render()")
                done += 1; await pg.wait_for_timeout(80)
            return done
        # ---------- 1. Rodzic: rejestracja, dziecko z kontem, dziecko bez konta
        pa = await dev(); await pa.goto(URL); await pa.wait_for_timeout(600)
        await pa.click('[data-auth=preg]'); await pa.fill('#pem', 'ewa@example.com'); await pa.fill('#ppw', 'Kratka2026!'); await pa.fill('#ppw2', 'Kratka2026!'); await pa.check('#pok')
        await pa.click('#pform [type=submit]'); await pa.wait_for_timeout(900)
        ok('niezweryfikowany e-mail' in (await pa.inner_text('body')).lower() or await pa.locator('[data-auth=pverified]').count(), 'rejestracja rodzica → prośba o weryfikację e-maila')
        await pa.evaluate("window.__verifyEmail('ewa@example.com')"); await pa.click('[data-auth=pverified]'); await pa.wait_for_timeout(300)
        await pa.click('[data-act=addchildp]'); await pa.fill('#nm', 'Igor'); await pa.click('[data-ob="1"]'); await pa.click('[data-grade="5"]'); await pa.click('[data-ob="2"]'); await pa.click('[data-ob="3"]'); await pa.click('[data-helper=ufok]'); await pa.click('[data-ob="4"]'); await pa.click('[data-int=gry]'); await pa.click('[data-ob=done]'); await pa.wait_for_timeout(300)
        await pa.fill('#lem', 'igor@gmail.com'); await pa.click('#linkform [type=submit]'); await pa.wait_for_timeout(700)
        ok('igor@gmail.com' in await pa.inner_text('body'), 'połączenie dziecka z kontem Google (zaproszenie)')
        await pa.click('[data-auth=topanel]'); await pa.wait_for_timeout(300)
        await pa.click('.kidadd'); await pa.fill('#nm', 'Ala'); await pa.click('[data-ob="1"]'); await pa.click('[data-grade="2"]'); await pa.click('[data-ob="2"]'); await pa.click('[data-ob="3"]'); await pa.click('[data-ob="4"]')
        await pa.click('[data-ob=done]'); await pa.wait_for_timeout(300)
        t = await pa.inner_text('body'); ok('Co Cię interesuje' in t, 'kreator nie przepuszcza bez zainteresowań', 'komunikat: ' + ('jest' if 'przynajmniej' in t.lower() or 'wybierz' in t.lower() else 'brak widocznego komunikatu'))
        await pa.click('[data-int=swinki]'); await pa.click('[data-ob=done]'); await pa.wait_for_timeout(300)
        if await pa.locator('[data-auth=plinkskip]').count(): await pa.click('[data-auth=plinkskip]'); await pa.wait_for_timeout(300)
        await pa.evaluate("window.__mp.go('dzieci')"); await pa.wait_for_timeout(300)
        ok(await pa.locator('.kidcard, [data-pkid]').count() >= 2, 'lista dzieci pokazuje 2 profile')
        await pa.screenshot(path=f'{OUT}/01-dzieci.png', full_page=True)
        # ---------- 2. Ćwiczenie na urządzeniu rodzica (Ala) + PIN
        btn = pa.locator('[data-practice]'); ok(await btn.count() >= 1, 'przycisk „Zacznij naukę” dla dziecka bez konta')
        await btn.first.click(); await pa.wait_for_timeout(400)
        nav = await pa.locator('header nav').inner_text(); ok('Zakończ naukę' in nav and 'Dzieci' not in nav, 'tryb ucznia na urządzeniu rodzica: menu Start/Sprawdzian/Ustawienia/Zakończ naukę', nav.replace('\n', ' · '))
        if await pa.locator('[data-act=welcomed]').count(): await pa.click('[data-act=welcomed]'); await pa.wait_for_timeout(200)
        await pa.click('header nav >> text=Zakończ naukę'); await pa.wait_for_timeout(300)
        body = await pa.inner_text('body'); ok('Dzieci' in body, 'Zakończ naukę → powrót do panelu rodzica (bez PIN-u)', body[:60].replace('\n', ' '))
        # ---------- 3. Dziecko na własnym urządzeniu: logowanie, nauka
        sh = {k: await pa.evaluate("k=>localStorage.getItem(k)", k) for k in ['__MOCKFS', '__MOCKAUTH']}
        pc = await dev(sh); await pc.goto(URL); await pc.wait_for_timeout(600)
        await pc.click('[data-auth=slog]'); await pc.fill('#sem', 'nieznany@gmail.com'); await pc.evaluate("localStorage.setItem('__WHO',JSON.stringify({email:'nieznany@gmail.com',uid:'X9'}))"); await pc.click('#sform [type=submit]'); await pc.wait_for_timeout(1500)
        t = await pc.inner_text('body'); ok('rodzic' in t.lower() and 'Cześć' not in t, 'logowanie ucznia z niepołączonym kontem → komunikat, bez dostępu', t[:140].replace('\n', ' '))
        await pc.screenshot(path=f'{OUT}/02-uczen-niepolaczony.png')
        pc = await dev(sh); await pc.goto(URL); await pc.wait_for_timeout(600)
        await pc.click('[data-auth=slog]'); await pc.fill('#sem', 'igor@gmail.com'); await pc.evaluate("localStorage.setItem('__WHO',JSON.stringify({email:'igor@gmail.com',uid:'I1'}))"); await pc.click('#sform [type=submit]'); await pc.wait_for_timeout(2000)
        ok('Igor' in await pc.inner_text('main'), 'logowanie ucznia połączonym kontem → profil Igora')
        await pc.click('[data-act=welcomed]') if await pc.locator('[data-act=welcomed]').count() else None
        await pc.evaluate("window.__mp.go('topic',{id:'duz_dod'})"); await pc.wait_for_timeout(200)
        await pc.evaluate("(()=>{const S=window.__mp.S; Object.keys(MP.SK).forEach(id=>{MP.engine.sk(S,id).placedOk=true;}); window.__mp.render();})()")
        learn = pc.locator('[data-learn]'); n0 = await learn.count()
        if n0: await learn.first.click(); await pc.wait_for_timeout(300)
        # Enter zatwierdza odpowiedź?
        a = await pc.evaluate(ANS)
        if a and a['t'] == 'num' and await pc.locator('#inp').count():
            await pc.fill('#inp', a['v']); await pc.press('#inp', 'Enter'); await pc.wait_for_timeout(200)
            ok(await pc.locator('.fb').count() > 0, 'Enter w polu odpowiedzi zatwierdza odpowiedź')
            if await pc.locator('[data-act=next]').count(): await pc.click('[data-act=next]')
        d = await lesson_answer(pc, 8); ok(d >= 6, 'uczeń rozwiązuje zadania w lekcji', f'{d} zadań')
        await pc.wait_for_timeout(2500)
        items = await pc.evaluate("window.__mp.S.stats.items"); ok(items >= 6, 'postęp zapisany w stanie ucznia', f'items={items}')
        cloud = await pc.evaluate("localStorage.getItem('__MOCKFS')")
        # ---------- 4. Synchronizacja: rodzic widzi postęp dziecka
        await pa.evaluate("cl=>localStorage.setItem('__MOCKFS',cl)", cloud); await pa.reload(); await pa.wait_for_timeout(2000)
        await pa.evaluate("window.__mp.go('dzieci')"); await pa.wait_for_timeout(500)
        card = await pa.inner_text('main'); m = re.search(r'Igor[\s\S]{0,200}?(\d+)\s*\n?\s*zadań', card)
        ok(m and int(m.group(1)) >= 6, 'panel rodzica pokazuje zadania wykonane na urządzeniu dziecka', (m.group(0)[-40:] if m else card[:200]).replace('\n', ' '))
        await pa.screenshot(path=f'{OUT}/03-rodzic-po-synchronizacji.png', full_page=True)
        # ---------- 5. Rodzic zmienia klasę dziecka → dziecko widzi zmianę
        await pa.click('header nav [data-go=pustaw]'); await pa.wait_for_timeout(300)
        sett = pa.locator('.sside [data-pset]'); ok(await sett.count() >= 2, 'ustawienia rodzica: lista dzieci')
        await sett.first.click(); await pa.wait_for_timeout(300); await pa.screenshot(path=f'{OUT}/04-ustawienia-dziecka.png', full_page=True)
        gsel = pa.locator('[data-grade="6"]')
        if await gsel.count():
            await gsel.first.click(); await pa.wait_for_timeout(200)
            sv = pa.locator('main button:has-text("Zapisz")')
            if await sv.count(): await sv.first.click(); await pa.wait_for_timeout(1500)
            cloud = await pa.evaluate("localStorage.getItem('__MOCKFS')")
            await pc.evaluate("cl=>localStorage.setItem('__MOCKFS',cl)", cloud); await pc.reload(); await pc.wait_for_timeout(2000)
            ok('Klasa 6' in await pc.inner_text('main'), 'zmiana klasy przez rodzica widoczna u dziecka po odświeżeniu', (await pc.inner_text('main'))[:60].replace('\n', ' '))
        else: ok(False, 'zmiana klasy w ustawieniach dziecka', 'nie znaleziono wyboru klasy')
        # ---------- 6. Przygotowanie do sprawdzianu → test diagnostyczny → próbny sprawdzian
        await pc.click('header nav >> text=Sprawdzian'); await pc.wait_for_timeout(300)
        await pc.locator('main details summary').nth(2).click(); await pc.locator('main details[open] input[type=checkbox]').first.check()
        await pc.locator('main details summary').nth(3).click(); cbs = pc.locator('main details[open] input[type=checkbox]')
        if await cbs.count() > 1: await cbs.nth(1).check()
        await pc.locator('main button:has-text("Zaczynamy")').first.click(); await pc.wait_for_timeout(300)
        txt = await pc.inner_text('main'); mm = re.search(r'(\d+) zadań bez podpowiedzi', txt); ok(True, 'start przygotowań', (mm.group(0) if mm else ''))
        if mm and int(mm.group(1)) in (2, 3, 4): ok(False, 'odmiana liczebnika w opisie testu diagnostycznego', f'„{mm.group(0)}” zamiast „{mm.group(1)} zadania”')
        await pc.click('[data-act=prepdiag]'); await pc.wait_for_timeout(300)
        for _ in range(30):
            if not await pc.locator('.task').count(): break
            a = await pc.evaluate(ANS)
            if a and a['t'] == 'num' and await pc.locator('#inp').count(): await pc.fill('#inp', a['v']); await pc.click('[data-act=checkans]')
            elif a and a['t'] == 'opt': await pc.click(f'[data-opt="{a["v"]}"]'); await pc.click('[data-act=checkans]')
            else: await pc.click('[data-act=dontknow]')
            await pc.wait_for_timeout(80)
            if await pc.locator('[data-act=next]').count(): await pc.click('[data-act=next]'); await pc.wait_for_timeout(80)
        back = pc.locator('main button:has-text("planu")')
        if await back.count(): await back.first.click(); await pc.wait_for_timeout(300)
        await pc.screenshot(path=f'{OUT}/05-plan.png', full_page=True)
        plan = await pc.inner_text('main'); ok('Krok 3' in plan and 'próbny sprawdzian' in plan.lower(), 'po teście diagnostycznym widać plan i próbny sprawdzian')
        es = pc.locator('[data-act=examstart]'); ok(await es.count() == 1, 'przycisk rozpoczęcia próbnego sprawdzianu')
        if await es.count():
            await es.click(); await pc.wait_for_timeout(300); await pc.screenshot(path=f'{OUT}/06-sprawdzian.png', full_page=True)
            ex = await pc.inner_text('main'); ok(re.search(r'\d+:\d\d', ex) is not None, 'próbny sprawdzian: widoczny licznik czasu')
            nq = 0
            for _ in range(30):
                if await pc.locator('[data-act=exnext]').count() == 0: break
                if await pc.locator('#inp').count(): await pc.fill('#inp', '1')
                elif await pc.locator('[data-opt]').count(): await pc.locator('[data-opt]').first.click()
                await pc.click('[data-act=exnext]'); nq += 1; await pc.wait_for_timeout(60)
            await pc.click('[data-act=exfinish]'); await pc.wait_for_timeout(200)
            if await pc.locator('.modal .pri, .modal [data-act=ok]').count(): await pc.locator('.modal .pri, .modal [data-act=ok]').first.click(); await pc.wait_for_timeout(400)
            res = await pc.inner_text('main'); await pc.screenshot(path=f'{OUT}/07-wynik.png', full_page=True)
            ok(re.search(r'ocen|punkt|%', res.lower()) is not None, 'wynik próbnego sprawdzianu (punkty/ocena)', res[:160].replace('\n', ' '))
        # ---------- 7. Wylogowanie ucznia czyści dane lokalne
        await pc.click('header nav >> text=Wyloguj'); await pc.wait_for_timeout(300)
        if await pc.locator('.modal .pri, .modal [data-act=ok]').count(): await pc.locator('.modal .pri, .modal [data-act=ok]').first.click(); await pc.wait_for_timeout(500)
        left = await pc.evaluate("Object.keys(localStorage).filter(k=>k.startsWith('mp_')).map(k=>k+'='+localStorage.getItem(k).slice(0,200))")
        ok(await pc.locator('[data-auth=slog]').count() == 1 and not left, 'wylogowanie ucznia → ekran wyboru, brak danych w przeglądarce', 'pozostałe klucze: ' + str(left))
        # ---------- 8. Telefon: nawigacja i lekcja bez poziomego przewijania
        pm = await dev(json.loads(json.dumps({'__MOCKFS': cloud, '__MOCKAUTH': sh['__MOCKAUTH']})), (360, 740)); await pm.goto(URL); await pm.wait_for_timeout(600)
        await pm.click('[data-auth=slog]'); await pm.fill('#sem', 'igor@gmail.com'); await pm.evaluate("localStorage.setItem('__WHO',JSON.stringify({email:'igor@gmail.com',uid:'I1'}))"); await pm.click('#sform [type=submit]'); await pm.wait_for_timeout(2000)
        w = await pm.evaluate("document.documentElement.scrollWidth"); ok(w <= 362, 'telefon 360 px: strona główna bez poziomego przewijania', f'szerokość {w}')
        await pm.screenshot(path=f'{OUT}/08-telefon-start.png', full_page=True)
        # ---------- 9. Rodzic: wylogowanie
        await pa.click('header nav >> text=Wyloguj'); await pa.wait_for_timeout(300)
        if await pa.locator('.modal .pri, .modal [data-act=ok]').count(): await pa.locator('.modal .pri, .modal [data-act=ok]').first.click(); await pa.wait_for_timeout(500)
        ok(await pa.locator('[data-auth=plog], [data-auth=preg]').count() >= 1, 'wylogowanie rodzica → ekran wyboru roli')
        ok(not errs, 'brak błędów JavaScript w całym przebiegu', '; '.join(errs[:3]))
        json.dump(RES, open(f'{OUT}/res.json', 'w'), ensure_ascii=False, indent=1); await b.close()
    bad = [r for r in RES if not r['ok']]; print(f'\nWYNIK: {len(RES) - len(bad)}/{len(RES)}')
asyncio.run(main())
