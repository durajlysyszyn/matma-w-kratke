# Nowa nawigacja: uczeń (Start · Sprawdzian · Ustawienia · Wyloguj), rodzic (Dzieci · Ustawienia · Wyloguj), klikalne działy, brak „Działów” i awatara w menu
import asyncio, json, sys
from playwright.async_api import async_playwright
from fbmock import MOCK
from e2e2 import onboard
res=[]
def ok(c,m): res.append((bool(c),m)); print(('  ✓ ' if c else '  ✗ ')+m); sys.stdout.flush()
CFG="window.MWK_FIREBASE={apiKey:'x',authDomain:'x',projectId:'x'};"
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox']); errors=[]
    async def dev(seed=None, vp=(1200,900)):
      ctx=await b.new_context(viewport={'width':vp[0],'height':vp[1]})
      await ctx.route('**/firebase-config.js', lambda r: r.fulfill(body=CFG, content_type='text/javascript'))
      init="if(!localStorage.getItem('__seeded')){localStorage.setItem('__seeded','1');"+''.join("localStorage.setItem(%s,%s);"%(json.dumps(k),json.dumps(v)) for k,v in (seed or {}).items())+"}"
      await ctx.add_init_script(init+MOCK); pg=await ctx.new_page(); pg.on('pageerror',lambda e: errors.append(str(e))); return pg
    nav=lambda pg: pg.evaluate("[...document.querySelectorAll('header.top nav button')].filter(b=>b.offsetParent).map(b=>b.textContent)")
    # rodzic rejestruje się, tworzy dwoje dzieci
    pg=await dev(); await pg.goto('http://localhost:8766/index.html'); await pg.wait_for_timeout(600)
    await pg.click('[data-auth=preg]'); await pg.fill('#pem','mama@example.com'); await pg.fill('#ppw','kratka2026!'); await pg.fill('#ppw2','kratka2026!'); await pg.check('#pok'); await pg.click('#pform [type=submit]'); await pg.wait_for_timeout(900)
    await pg.evaluate("window.__verifyEmail('mama@example.com')"); await pg.click('[data-auth=pverified]'); await pg.wait_for_timeout(300)
    await pg.click('[data-act=addchildp]'); await onboard(pg,'Kuba',6,['literatura']); await pg.wait_for_timeout(300)
    await pg.fill('#lem','kuba@gmail.com'); await pg.click('#linkform [type=submit]'); await pg.wait_for_timeout(500); await pg.click('[data-auth=topanel]'); await pg.wait_for_timeout(300)
    ok(await nav(pg)==['Dzieci','Ustawienia','Wyloguj'], 'menu rodzica: %s' % await nav(pg))
    ok(await pg.locator('#me').count()==0, 'brak kółka z awatarem w menu')
    t=await pg.inner_text('#app'); ok('Dzieci' in t and 'Kuba' in t and 'Dodaj dziecko' in t, 'pulpit „Dzieci” z kartą dziecka i „Dodaj dziecko”')
    await pg.click('.kidadd'); await onboard(pg,'Ola',3,['konie']); await pg.wait_for_timeout(300); await pg.click('[data-auth=plinkskip]'); await pg.wait_for_timeout(300)
    ok(await pg.locator('.kidc').count()==2, 'dwie karty dzieci')
    await pg.screenshot(path='n2_dzieci.png', full_page=True)
    ola=await pg.evaluate("window.__mp.IDX.profiles.find(p=>p.name==='Ola').id")
    await pg.click(f'[data-pkid="{ola}"]'); await pg.wait_for_timeout(300); t=await pg.inner_text('#app'); ok('Postępy: Ola' in t and 'Co system rekomenduje' in t, 'Zobacz postępy → widok postępów')
    kuba=await pg.evaluate("window.__mp.IDX.profiles.find(p=>p.name==='Kuba').id")
    await pg.click(f'.kswitch [data-pkid="{kuba}"]'); await pg.wait_for_timeout(200); ok('Postępy: Kuba' in await pg.inner_text('#app'), 'przełącznik dzieci w postępach')
    await pg.click('header nav [data-go=pustaw]'); await pg.wait_for_timeout(200); t=await pg.inner_text('#app'); ok('Ustawienia ogólne' in t and 'PIN rodzica' in t and 'Co już działa' in t, 'Ustawienia → ogólne (konto, PIN, o aplikacji)')
    await pg.click(f'.sside [data-pset="{kuba}"]'); await pg.wait_for_timeout(300); t=await pg.inner_text('#app'); ok('Logowanie dziecka' in t and 'kuba@gmail.com' in t and 'Zadań w jednej serii' in t and 'Usuń konto' in t and 'Zainteresowania' in t, 'Ustawienia dziecka: profil, logowanie, nauka, dane, usuwanie')
    await pg.screenshot(path='n2_ustaw.png', full_page=True)
    await pg.fill('#nm','Kubuś'); await pg.click('[data-act=saveprof]'); await pg.wait_for_timeout(200)
    ok(await pg.evaluate("window.__mp.IDX.profiles.find(p=>p.id===%s).name" % json.dumps(kuba))=='Kubuś', 'zmiana imienia w ustawieniach dziecka zapisana')
    await pg.click('header nav [data-go=dzieci]'); await pg.wait_for_timeout(200)
    await pg.click(f'.kidc:has([data-pkid="{ola}"]) summary'); await pg.click(f'.kidc:has([data-pkid="{ola}"]) [data-pdel]'); await pg.click('[data-y]'); await pg.wait_for_timeout(300)
    ok(await pg.locator('.kidc').count()==1, 'usunięcie dziecka z menu ⋯ na karcie')
    await pg.wait_for_timeout(1500); sh={k: await pg.evaluate("k=>localStorage.getItem(k)",k) for k in ['__MOCKFS','__MOCKAUTH']}
    await pg.click('header nav [data-nact=glogout]'); await pg.click('[data-y]'); await pg.wait_for_timeout(500); ok('Kim jesteś?' in await pg.inner_text('#app'), '„Wyloguj” w menu wylogowuje')
    # dziecko loguje się
    ch=await dev(sh); await ch.goto('http://localhost:8766/index.html'); await ch.wait_for_timeout(600)
    await ch.click('[data-auth=slog]'); await ch.evaluate("localStorage.setItem('__WHO',JSON.stringify({email:'kuba@gmail.com',uid:'K1'}))"); await ch.fill('#sem','kuba@gmail.com'); await ch.click('#sform [type=submit]'); await ch.wait_for_timeout(1500)
    ok(await nav(ch)==['Start','Sprawdzian','Ustawienia','Wyloguj'], 'menu ucznia: %s' % await nav(ch))
    ok(await ch.locator('header [data-go=dzialy]').count()==0, 'brak zakładki „Działy”')
    dz=ch.locator('.map.big .dn').first; ok(await dz.count()==1 and 'Kliknij nazwę działu' in await ch.inner_text('#app'), 'nazwy działów jako przyciski + podpowiedź')
    st=await dz.evaluate("e=>{const s=getComputedStyle(e.querySelector('.dnt'));return s.textDecorationLine+' '+getComputedStyle(e).color}"); ok('underline' in st, 'nazwa działu podkreślona i kolorowa (%s)' % st)
    await ch.screenshot(path='n2_child_home.png')
    name=await dz.locator('.dnt').inner_text(); await dz.click(); await ch.wait_for_timeout(200); t=await ch.inner_text('#app'); ok(name in t and 'Strona główna' in t, 'klik w dział → widok działu „%s”' % name)
    await ch.click('.crumbs [data-go2=start]'); await ch.wait_for_timeout(200); ok('Twój zeszyt w kratkę' in await ch.inner_text('#app'), 'powrót z działu → strona główna')
    await ch.evaluate("window.__mp.go('dzialy')"); await ch.wait_for_timeout(100); ok('Twój zeszyt w kratkę' in await ch.inner_text('#app'), 'stary adres „Działy” prowadzi na stronę główną')
    await ch.click('header nav [data-go=profil]'); await ch.wait_for_timeout(200); t=await ch.inner_text('#app'); ok(t.startswith('Ustawienia') or 'Ustawienia\n' in t, 'Ustawienia ucznia'); ok('Awatar' in t and 'Zainteresowania' in t and 'Wyloguj' in t and 'Klasę zmienia rodzic' in t, 'w ustawieniach ucznia: awatar, imię, zainteresowania, klasa (tylko odczyt), wyloguj')
    await ch.screenshot(path='n2_child_set.png', full_page=True)
    await ch.click('header nav [data-go=sprawdzian]'); await ch.wait_for_timeout(200); ok(await ch.evaluate("document.querySelector('header nav [aria-current=page]').textContent")=='Sprawdzian', 'Sprawdzian zostaje')
    # nauka na urządzeniu rodzica (Zakończ naukę)
    pp=await dev(sh); await pp.goto('http://localhost:8766/index.html'); await pp.wait_for_timeout(600)
    await pp.click('[data-auth=plog]'); await pp.fill('#pem','mama@example.com'); await pp.fill('#ppw','kratka2026!'); await pp.click('#pform [type=submit]'); await pp.wait_for_timeout(1500)
    await pp.click('.kidadd'); await onboard(pp,'Zosia',2,['taniec']); await pp.wait_for_timeout(300); await pp.click('[data-auth=plinkskip]'); await pp.wait_for_timeout(300)
    await pp.click('[data-practice]'); await pp.wait_for_timeout(300)
    ok(await nav(pp)==['Start','Sprawdzian','Ustawienia','Zakończ naukę'], 'nauka na urządzeniu rodzica: %s' % await nav(pp))
    await pp.click('header nav [data-nact=endpractice]'); await pp.wait_for_timeout(200); ok(await nav(pp)==['Dzieci','Ustawienia','Wyloguj'], '„Zakończ naukę” → panel rodzica')
    # telefon
    mb=await dev(sh,(390,844)); await mb.goto('http://localhost:8766/index.html'); await mb.wait_for_timeout(600)
    await mb.click('[data-auth=slog]'); await mb.evaluate("localStorage.setItem('__WHO',JSON.stringify({email:'kuba@gmail.com',uid:'K1'}))"); await mb.fill('#sem','kuba@gmail.com'); await mb.click('#sform [type=submit]'); await mb.wait_for_timeout(1500)
    vis=await mb.evaluate("[...document.querySelectorAll('header.top nav button')].map(b=>{const r=b.getBoundingClientRect();return r.right<=window.innerWidth+1 && r.width>0})")
    ok(all(vis) and len(vis)==4, 'telefon: wszystkie 4 pozycje menu (z „Wyloguj”) widoczne')
    ok(await mb.evaluate("document.documentElement.scrollWidth<=window.innerWidth+1"), 'telefon: bez przewijania w poziomie')
    await mb.screenshot(path='n2_m_child.png')
    # wersja bez konta (claude.ai / tylko przeglądarka)
    lc=await b.new_page(viewport={'width':1200,'height':900}); lc.on('pageerror',lambda e: errors.append(str(e)))
    await lc.goto('http://localhost:8765/index.html'); await lc.wait_for_timeout(500); await onboard(lc,'Iga',4,['moda'])
    ok(await nav(lc)==['Start','Sprawdzian','Ustawienia','Panel rodzica'], 'wersja bez konta: %s' % await nav(lc))
    await lc.click('header nav [data-go=dzieci]'); await lc.wait_for_timeout(200); ok(await nav(lc)==['Dzieci','Ustawienia','Zamknij panel'], 'panel rodzica bez konta: %s' % await nav(lc))
    ok(not errors, 'brak błędów JS ' + json.dumps(errors)[:300])
    await b.close()
  bad=[m for c,m in res if not c]; print('\nWYNIK: %d/%d'%(len(res)-len(bad),len(res)))
asyncio.run(main())
