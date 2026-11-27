# Gry odblokowane na mapie działów
import asyncio
from e2e2 import onboard
from playwright.async_api import async_playwright
res = []
def ok(c, m): res.append((bool(c), m)); print(('  ✓ ' if c else '  ✗ ') + m)
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox']); errs = []
        pg = await (await b.new_context(viewport={'width': 390, 'height': 820}, has_touch=True)).new_page(); pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('http://localhost:8765/index.html'); await pg.wait_for_timeout(400); await onboard(pg, 'Felek', 2, ['dinozaury'])
        if await pg.locator('[data-act=welcomed]').count(): await pg.click('[data-act=welcomed]')
        await pg.evaluate("window.__mp.go('start')"); await pg.wait_for_timeout(200)
        n_lk = await pg.locator('.dzgame.lk').count(); ok(n_lk > 0 and await pg.locator('button.dzgame').count() == 0, f'na start wszystkie gry zablokowane ({n_lk} kłódek)')
        ok('Odblokowane gry: 0 z' in await pg.inner_text('#app'), 'licznik 0 z N')
        # zaliczony test pierwszego działu
        dz = await pg.evaluate("(()=>{const S=window.__mp.S; const dz=MP.DZIALY.find(d=>d.topics.some(t=>t.skills.some(MP.isReady))); S.chTests[dz.id]={at:Date.now(),pass:true,pct:90,n:10,ok:9,tries:1}; return dz.id;})()")
        await pg.evaluate("window.__mp.go('start')"); await pg.wait_for_timeout(200)
        ok(await pg.locator('button.dzgame').count() == 1 and 'Odblokowane gry: 1 z' in await pg.inner_text('#app'), f'po zdaniu testu działu {dz}: gra odblokowana, licznik 1 z N')
        await pg.screenshot(path='/home/claude/ux/dzgames.png')
        await pg.click('button.dzgame'); await pg.wait_for_timeout(300)
        ok(await pg.locator('.game').count() == 0 and 'serię' in await pg.inner_text('body'), 'bez serii zadań dziś → komunikat „Najpierw zrób dziś jedną serię”')
        await pg.evaluate("(()=>{const S=window.__mp.S; const k=MP.engine.dayKey(Date.now()); S.days[k]=Object.assign(S.days[k]||{sec:0,n:0,ok:0},{n:6});})()")
        await pg.wait_for_timeout(2600); await pg.click('button.dzgame'); await pg.wait_for_timeout(200)
        ok(await pg.locator('.game').count() == 1, 'po serii zadań gra się otwiera')
        await pg.click('.gintro [data-g=skip]'); await pg.wait_for_timeout(200)
        ok(await pg.locator('.map').count() > 0, 'pominięcie wraca na stronę główną')
        await pg.evaluate("(()=>{const S=window.__mp.S; const k=MP.engine.dayKey(Date.now()); S.days[k].n=0; S.settings.gameFree=true;})()")
        await pg.evaluate("window.__mp.go('start')"); await pg.click('button.dzgame'); await pg.wait_for_timeout(200)
        ok(await pg.locator('.game').count() == 1, 'rodzic: „bez limitu” → gra bez serii')
        await pg.evaluate("window.__mp.S.settings.games=false"); await pg.evaluate("window.__mp.go('start')"); await pg.wait_for_timeout(150)
        ok(await pg.locator('.dzgame').count() == 0, 'gry wyłączone przez rodzica → brak kafelków')
        ok(not errs, 'brak błędów JS ' + str(errs[:2]))
        await b.close()
    bad = [m for c, m in res if not c]; print(f'\nWYNIK: {len(res) - len(bad)}/{len(res)}')
asyncio.run(main())
