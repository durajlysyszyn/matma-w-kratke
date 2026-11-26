# Etap 1 minigier + neutralne testy + poprawki – sprawdzenie w przeglądarce (kl. 2, 3, 5, 6)
import asyncio, json, re
from e2e2 import onboard
from playwright.async_api import async_playwright
URL = 'http://localhost:8765/index.html'
res = []
def ok(c, m): res.append((bool(c), m)); print(('  ✓ ' if c else '  ✗ ') + m)
# udawane „opanowanie tematu”: lekcja z umiejętnością, której poziom w trakcie wzrósł z 3 do 4
MASTER = """(sid)=>{const S=window.__mp.S; const s=S.session; S.skills[sid]=Object.assign(S.skills[sid]||{id:sid,n:0,ok:0,hist:[],rev:[],errs:{}},{lvl:4,l4At:Date.now(),n:12,ok:11}); s.startLevels[sid]=3; s.results.push({skill:sid,ok:true}); return true;}"""
TOPIC1 = "(g)=>{const T=MP.TOPICS; for(const id in T){const r=T[id].skills.filter(MP.isReady); if(r.length===1) return r[0];} return null;}"
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox']); errors = []
        for g, name in [(2, 'Felek'), (3, 'Lena'), (5, 'Maja'), (6, 'Szymon')]:
            ctx = await b.new_context(viewport={'width': 390, 'height': 800}, has_touch=True, is_mobile=True); pg = await ctx.new_page(); pg.on('pageerror', lambda e: errors.append(str(e)))
            await pg.goto(URL); await pg.wait_for_timeout(400); await onboard(pg, name, g, ['dinozaury'])
            if await pg.locator('[data-act=welcomed]').count(): await pg.click('[data-act=welcomed]'); await pg.wait_for_timeout(150)
            sid = await pg.evaluate(TOPIC1, g)
            await pg.evaluate(f"window.__mp.go('start')"); await pg.click('.nextstep [data-act=rec]'); await pg.wait_for_timeout(150)
            await pg.evaluate("()=>{}")
            await pg.evaluate(f"(sid)=>{{const S=window.__mp.S; S.session.skills=[sid]; S.session.skill=sid;}}", sid)
            await pg.evaluate(MASTER, sid)
            await pg.click('[data-act=pause]'); await pg.click('[data-act=pausefinish]'); await pg.wait_for_timeout(200)
            ok(await pg.locator('.goffer [data-act=game]').count() == 1, f'kl. {g}: po opanowaniu tematu ({sid}) propozycja minigry')
            await pg.click('[data-act=game]'); await pg.wait_for_timeout(150)
            intro = await pg.inner_text('.game')
            ok('Start' in intro and 'Pomiń' in intro, f'kl. {g}: ekran gry ma Start i „Pomiń grę” – {intro.splitlines()[0]}')
            await pg.click('[data-g=go]'); await pg.wait_for_timeout(2600)
            n = await pg.locator('.gitem').count(); ok(n >= 1, f'kl. {g}: spadają liczby do złapania ({n})')
            # dotknij poprawnych
            hit = 0
            for _ in range(25):
                items = await pg.locator('.gitem:not(.gok):not(.gno)').all()
                for it in items:
                    try:
                        bb = await it.bounding_box()
                        if bb and bb['y'] > 0: await pg.touchscreen.tap(bb['x'] + bb['width'] / 2, bb['y'] + bb['height'] / 2); hit += 1; break
                    except Exception: pass
                await pg.wait_for_timeout(250)
            sc = int(await pg.inner_text('.gsc'))
            msg = await pg.inner_text('.gwhy'); ok(hit > 0 and (sc > 0 or 'Nie ta' in msg), f'kl. {g}: dotknięcia działają (dotknięto {hit}, punkty {sc}, komunikat: „{(await pg.inner_text(".gwhy"))[:50]}”)')
            w = await pg.evaluate("document.documentElement.scrollWidth"); ok(w <= 392, f'kl. {g}: gra bez poziomego przewijania na telefonie ({w}px)')
            if g == 2: await pg.screenshot(path='/home/claude/ux/game_k2.png')
            if g == 6: await pg.screenshot(path='/home/claude/ux/game_k6.png')
            # gra kończy się sama: przyspieszenie
            await pg.wait_for_timeout(200)
            await pg.evaluate("()=>{}")
            t0 = await pg.evaluate("Date.now()")
            await pg.wait_for_selector('.gend:not([hidden])', timeout=45000)
            dt = (await pg.evaluate("Date.now()")) - t0
            endtxt = await pg.inner_text('.gend'); ok('Złapane' in endtxt, f'kl. {g}: gra kończy się sama po ok. 40 s – {endtxt.splitlines()[0]}')
            await pg.click('[data-g=done]'); await pg.wait_for_timeout(200)
            ok(await pg.locator('.goffer').count() == 0 and 'Na start' in await pg.inner_text('#app') or 'Na dziś koniec' in await pg.inner_text('#app'), f'kl. {g}: powrót do podsumowania, propozycja gry znika')
            best = await pg.evaluate("window.__mp.S.games"); ok(best and best['n'] == 1, f'kl. {g}: zapisany rekord (tylko w postępach): {json.dumps(best)}')
            if g == 2:
                # pominięcie gry od razu
                await pg.evaluate("()=>{}")
                await pg.evaluate("window.__mp.go('start')"); await pg.click('.nextstep [data-act=rec]'); await pg.wait_for_timeout(150)
                while await pg.locator('[data-act=cardnext]').count(): await pg.click('[data-act=cardnext]'); await pg.wait_for_timeout(60)
                sid2 = await pg.evaluate("window.__mp.S.session.skill")
                await pg.evaluate(f"(sid)=>{{const S=window.__mp.S; const T=MP.TOPICS[MP.SKILL_TOPIC[sid]]; T.skills.filter(MP.isReady).forEach(x=>{{S.skills[x]=Object.assign(S.skills[x]||{{id:x,n:0,ok:0,hist:[],rev:[],errs:{{}}}},{{lvl:4,l4At:Date.now()}});}}); S.session.startLevels[sid]=3; S.session.results.push({{skill:sid,ok:true}});}}", sid2)
                await pg.click('[data-act=pause]'); await pg.click('[data-act=pausefinish]'); await pg.wait_for_timeout(200)
                await pg.click('[data-act=game]'); await pg.wait_for_timeout(100); await pg.click('.gintro [data-g=skip]'); await pg.wait_for_timeout(150)
                ok(await pg.locator('.game').count() == 0 and await pg.evaluate("window.__mp.S.games.n") == 1, 'pominięcie gry od razu wraca do podsumowania (bez zapisu wyniku)')
                # rodzic wyłącza gry
                await pg.evaluate("window.__mp.S.settings.games=false")
                await pg.evaluate("window.__mp.go('start')"); await pg.click('.nextstep [data-act=rec]'); await pg.wait_for_timeout(150)
                while await pg.locator('[data-act=cardnext]').count(): await pg.click('[data-act=cardnext]'); await pg.wait_for_timeout(60)
                sid3 = await pg.evaluate("window.__mp.S.session.skill")
                await pg.evaluate(MASTER, sid3); await pg.evaluate(f"(sid)=>{{const S=window.__mp.S; const T=MP.TOPICS[MP.SKILL_TOPIC[sid]]; T.skills.filter(MP.isReady).forEach(x=>{{S.skills[x].lvl=4;S.skills[x].l4At=Date.now()}});}}", sid3)
                await pg.click('[data-act=pause]'); await pg.click('[data-act=pausefinish]'); await pg.wait_for_timeout(200)
                ok(await pg.locator('.goffer').count() == 0, 'wyłączone przez rodzica → brak propozycji gry')
                await pg.evaluate("window.__mp.S.settings.games=true")
                # test: neutralne „Zapisane ✓” także przy wyborze ABCD
                await pg.evaluate("window.__mp.go('start')"); await pg.evaluate("()=>{}")
                await pg.evaluate("()=>{const S=window.__mp.S; S.session=null;}")
                await pg.evaluate("()=>{}")
                await pg.evaluate("window.__mp.go('topic',{id:MP.SKILL_TOPIC['k2_cmp']})"); await pg.wait_for_timeout(150)
                await pg.click('[data-act=check]')
                for _ in range(6):
                    if await pg.locator('[data-opt]').count(): break
                    if await pg.locator('[data-act=cardnext]').count(): await pg.click('[data-act=cardnext]')
                    elif await pg.locator('[data-act=dontknow]').count(): await pg.click('[data-act=dontknow]'); await pg.click('[data-act=next]')
                    await pg.wait_for_timeout(100)
                await pg.wait_for_timeout(200)
                if await pg.locator('[data-act=cardnext]').count(): await pg.click('[data-act=cardnext]'); await pg.wait_for_timeout(100)
                if await pg.locator('[data-opt]').count():
                    await pg.click('[data-opt="0"]'); await pg.click('[data-act=checkans]'); await pg.wait_for_timeout(150)
                    fb = await pg.inner_text('.fb'); colored = await pg.locator('.opt.right, .opt.wrong').count()
                    ok('Zapisane ✓' in fb and colored == 0, f'test: wybór ABCD bez zieleni/czerwieni, „{fb[:70]}”')
                    live = await pg.inner_text('#srlive'); ok('Zapisane' in live, 'komunikat odczytywany przez czytnik ekranu (aria-live)')
                else: ok(False, 'test: brak zadania z wyborem')
            if g == 6:
                # przygotowanie do sprawdzianu: szybki wybór + data
                await pg.evaluate("window.__mp.S.session=null"); await pg.evaluate("window.__mp.go('sprawdzian')"); await pg.wait_for_timeout(150)
                ok(await pg.locator('#pdate').count() == 1, 'sprawdzian: pole „Kiedy sprawdzian?”')
                tiles = await pg.locator('[data-ptiles]').all_inner_texts(); ok(len(tiles) >= 1, 'sprawdzian: szybki wybór – ' + ' | '.join(tiles))
                await pg.locator('[data-ptiles]').first.click(); n = await pg.locator('#prepform input[name=t]:checked').count(); ok(n >= 1, f'kafelek zaznacza tematy ({n})')
                await pg.fill('#pdate', '2026-12-04'); await pg.click('#prepform [type=submit]'); await pg.wait_for_timeout(200)
                ok('Do sprawdzianu' in await pg.inner_text('#app'), 'plan pokazuje dni do sprawdzianu')
                # gra z panelu rodzica (podgląd) – kontrolka
            await ctx.close()
        ok(not errors, 'brak błędów JS ' + str(errors[:3]))
        await b.close()
    bad = [m for c, m in res if not c]; print(f'\nWYNIK: {len(res) - len(bad)}/{len(res)}')
asyncio.run(main())
