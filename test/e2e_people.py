# Bliskie osoby w zadaniach: onboarding, walidacja (bez nazwisk), ustawienia, użycie w zadaniach
import asyncio
from playwright.async_api import async_playwright
URL = 'http://localhost:8765/index.html'
res = []
def ok(c, m): res.append((bool(c), m)); print(('  ✓ ' if c else '  ✗ ') + m)
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox']); errs = []
        pg = await (await b.new_context(viewport={'width': 390, 'height': 820})).new_page(); pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(URL); await pg.wait_for_timeout(400)
        await pg.fill('#nm', 'Felek'); await pg.click('[data-ob="1"]'); await pg.click('[data-grade="2"]'); await pg.click('[data-ob="2"]'); await pg.click('[data-ob="3"]')
        await pg.click('[data-helper=robot]'); await pg.click('[data-ob="4"]'); await pg.click('[data-int=dinozaury]')
        ok(await pg.locator('#pnm').count() == 1 and 'nieobowiązkowe' in await pg.inner_text('main'), 'onboarding: pole na imiona bliskich (nieobowiązkowe)')
        async def add(txt, g):
            await pg.fill('#pnm', txt); await pg.click(f'[data-padd={g}]'); await pg.wait_for_timeout(120)
        await add('Kuba Nowak', 'm'); t = await pg.inner_text('body'); ok('bez nazwiska' in t and await pg.locator('.pchip').count() == 0, 'nazwisko odrzucone')
        await pg.wait_for_timeout(2600)
        await add('kuba7', 'm'); ok(await pg.locator('.pchip').count() == 0, 'cyfry odrzucone')
        await add('kuba', 'm'); await add('babcia ela', 'f'); await add('pies Burek', 'm')
        chips = await pg.locator('.pchip').all_inner_texts(); ok(len(chips) == 3 and chips[0].startswith('Kuba') and chips[1].startswith('babcia Ela'), 'dodane: ' + ' | '.join(c.replace('\n', '') for c in chips))
        await pg.screenshot(path='/home/claude/ux/people_onb.png', full_page=True)
        await pg.click('[data-pdelp="2"]'); ok(await pg.locator('.pchip').count() == 2, 'usuwanie osoby')
        await pg.click('[data-ob=done]'); await pg.wait_for_timeout(300)
        ppl = await pg.evaluate("window.__mp.S.profile.people"); ok(ppl == [{'n': 'Kuba', 'g': 'm'}, {'n': 'babcia Ela', 'g': 'f'}], f'zapisane w profilu: {ppl}')
        txt = await pg.evaluate("(()=>{let o=[];for(let k=0;k<40;k++){const it=MP.engine.buildItem(MP.engine.makeSpec('k2_word',1,'input'));o.push(MP.util.plain(it.prompt));}return o.join(' || ');})()")
        ok('Kuba' in txt and 'abcia Ela' in txt, 'imiona pojawiają się w zadaniach z treścią')
        ok(not any(s.strip()[:1].islower() for s in txt.split(' || ')), 'zadanie zaczyna się wielką literą („Babcia Ela miała…”)')
        # ustawienia dziecka: edycja
        await pg.evaluate("window.__mp.go('profil')"); await pg.wait_for_timeout(200)
        ok(await pg.locator('.pchip').count() == 2, 'ustawienia: lista bliskich osób')
        await pg.fill('#pnm', 'Zosia'); await pg.click('[data-padd=f]'); await pg.click('[data-act=saveprof]'); await pg.wait_for_timeout(200)
        ok(len(await pg.evaluate("window.__mp.S.profile.people")) == 3, 'ustawienia: dodanie i zapis')
        # po przeładowaniu
        await pg.reload(); await pg.wait_for_timeout(500)
        ok(await pg.evaluate("MP.people.length") == 3, 'po odświeżeniu imiona nadal używane w zadaniach')
        ok(not errs, 'brak błędów JS ' + str(errs[:2]))
        await b.close()
    bad = [m for c, m in res if not c]; print(f'\nWYNIK: {len(res) - len(bad)}/{len(res)}')
asyncio.run(main())
