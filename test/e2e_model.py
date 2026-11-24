# Nowy model nauki i poprawki z obserwacji (Felek, kl. 2) oraz testów person – sprawdzenie w przeglądarce
import asyncio, json
from e2e2 import onboard, answer_some, IXANS
from playwright.async_api import async_playwright
URL = 'http://localhost:8765/index.html'
res = []
def ok(c, m): res.append((bool(c), m)); print(('  ✓ ' if c else '  ✗ ') + m)
FORCE = "([sk,d,ty,seed])=>{const S=window.__mp.S; const s=S.session; s.cur={spec:{kind:'item',skill:sk,d,type:ty,th:'szkola',seed:seed||12345},attempts:0,hints:0,solShown:false,t0:Date.now(),tl:Date.now(),resp:null,fb:null}; window.__mp.render();}"
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox']); errors = []
        ctx = await b.new_context(viewport={'width': 900, 'height': 1000}); pg = await ctx.new_page(); pg.on('pageerror', lambda e: errors.append(str(e)))
        await pg.goto(URL); await pg.wait_for_timeout(500); await onboard(pg, 'Felek', 2, ['dinozaury'])
        if await pg.locator('[data-act=welcomed]').count(): await pg.click('[data-act=welcomed]'); await pg.wait_for_timeout(200)
        home = await pg.inner_text('#app')
        ok('Twój następny krok' in home and await pg.locator('.nextstep [data-act=rec]').count() == 1, 'strona główna: zawsze jeden przycisk „następny krok”')
        ok('poziom' not in home.lower() and '4–5' not in home, 'dziecko nie widzi numerów poziomów')
        wk = await pg.locator('.week2 i').all_inner_texts(); ok(wk == ['pn', 'wt', 'śr', 'cz', 'pt', 'sb', 'nd'] and await pg.locator('.week2 i.today').count() == 1, 'pasek tygodnia jak kalendarz: ' + ' '.join(wk))
        # --- lekcja z rekomendacji: seria 5 zadań
        await pg.click('.nextstep [data-act=rec]'); await pg.wait_for_timeout(200)
        while await pg.locator('[data-act=cardnext]').count(): await pg.click('[data-act=cardnext]'); await pg.wait_for_timeout(60)
        ok(await pg.locator('.dots i').count() == 5, 'seria ma 5 kwadracików (było 10)')
        # dziesiątki i jedności: tabelka, krótkie pola, automatyczne przejście
        await pg.evaluate(FORCE, ['k2_dj', 1, 'multi', 777]); await pg.wait_for_timeout(150)
        ok(await pg.locator('.multi.tbl').count() == 1 and 'dziesiątki' in await pg.inner_text('.multi.tbl'), 'dziesiątki i jedności: tabelka z podpisanymi okienkami')
        vals = await pg.evaluate("MP.engine.buildItem(window.__mp.S.session.cur.spec).answer.values.map(v=>String(v.n))")
        await pg.click('[data-multi="0"]'); await pg.keyboard.type(vals[0]); await pg.wait_for_timeout(80)
        foc = await pg.evaluate("document.activeElement && document.activeElement.dataset.multi")
        ok(foc == '1', 'po wpisaniu cyfry dziesiątek kursor sam przechodzi do jedności')
        w = await pg.evaluate("document.querySelector('[data-multi]').getBoundingClientRect().width"); ok(w < 140, f'okienka są krótkie ({int(w)} px)')
        await pg.screenshot(path='m_dj.png')
        # liczby parzyste: krótkie pole, klawiatura bez ułamków, rozpoznanie listy
        await pg.evaluate(FORCE, ['k2_parity', 3, 'input', 4242]); await pg.wait_for_timeout(150)
        ok(await pg.locator('.mf.narrow').count() == 1, 'pole na jedną liczbę jest wąskie')
        ok(await pg.locator('[data-mk=frac]').count() == 0 and await pg.locator('[data-mk=neg]').count() == 0, 'klawiatura w kl. 2 bez ułamków i ±')
        pr = await pg.evaluate("MP.util.plain(MP.engine.buildItem(window.__mp.S.session.cur.spec).prompt)")
        lst = await pg.evaluate("MP.engine.buildItem(window.__mp.S.session.cur.spec).countOf")
        await pg.fill('#inp', ', '.join(map(str, lst))); await pg.click('[data-act=checkans]'); await pg.wait_for_timeout(150)
        fb = await pg.inner_text('.fb'); att = await pg.evaluate("window.__mp.S.session.cur.attempts")
        ok('Dobrze wypisane' in fb and att == 0, f'„{pr}” → wypisane liczby {lst} = dobry krok, nie błąd ({fb[:60]})')
        await pg.fill('#inp', ', '.join(map(str, lst)) + ' czyli ' + str(len(lst))); await pg.click('[data-act=checkans]'); await pg.wait_for_timeout(150)
        ok('✓' in await pg.inner_text('.fb'), '„… czyli ' + str(len(lst)) + '” uznane za dobrą odpowiedź')
        await pg.click('[data-act=next]'); await pg.wait_for_timeout(100)
        # parzyste w wersji ABCD: inne pytanie niż otwarte
        await pg.evaluate(FORCE, ['k2_parity', 3, 'choice', 4242]); await pg.wait_for_timeout(120)
        ok('grupie' in await pg.inner_text('.q'), 'wersja ABCD ma inne pytanie: ' + (await pg.inner_text('.q'))[:60])
        # zły format – podpowiedź bez przykładowych liczb
        await pg.evaluate(FORCE, ['k2_add', 1, 'input', 99]); await pg.wait_for_timeout(120)
        await pg.fill('#inp', ',,'); await pg.click('[data-act=checkans]'); await pg.wait_for_timeout(120)
        fb = await pg.inner_text('.fb'); ok('3/4' not in fb and '0,25' not in fb and 'jedną liczbę' in fb, 'podpowiedź przy złym formacie bez przykładów: ' + fb[:60])
        # błąd → zostajemy na tym samym kwadraciku, kwadraciki neutralne
        before = await pg.evaluate("document.querySelectorAll('.dots i.ok').length")
        await pg.fill('#inp', '977'); await pg.click('[data-act=checkans]'); await pg.wait_for_timeout(150)
        ok(await pg.locator('.dots i.no').count() == 0, 'brak żółtego kwadracika za błąd')
        await pg.click('[data-act=next]'); await pg.wait_for_timeout(150)
        an = await pg.evaluate("!!window.__mp.S.session.cur.spec.analog"); after = await pg.evaluate("document.querySelectorAll('.dots i.ok').length")
        ok(an and after == before, f'po błędzie podobne zadanie na tym samym kwadraciku (wypełnione: {before} → {after})')
        # „Nie wiem” w lekcji
        ok(await pg.locator('[data-act=dontknow]').count() == 1, 'w lekcji jest „Nie wiem – pokaż mi”')
        await pg.click('[data-act=dontknow]'); await pg.wait_for_timeout(120)
        ok(await pg.locator('[data-act=next]').count() == 1 and 'Poprawna odpowiedź' in await pg.inner_text('.fb'), '„Nie wiem” pokazuje odpowiedź i pozwala iść dalej')
        await pg.click('[data-act=next]'); await pg.wait_for_timeout(100)
        # pieniądze jako rysunek
        await pg.evaluate(FORCE, ['k2_money', 1, 'input', 5]); await pg.wait_for_timeout(120)
        ok(await pg.locator('svg.money circle').count() >= 3, 'monety narysowane (' + str(await pg.locator('svg.money circle').count()) + ' kształtów)')
        ok(await pg.locator('[data-act=speak]').count() == 1, 'kl. 1–3: przycisk „Przeczytaj”')
        await pg.screenshot(path='m_money.png')
        # bez powtórek w jednej lekcji
        dup = await pg.evaluate("(()=>{const S=window.__mp.S,E=MP.engine; E.startSession(S,{mode:'learn',skill:'k2_cmp',max:40},Date.now()); S.session.queue=[]; const seen=new Set(); let d=0; for(let i=0;i<30;i++){const sp=E.nextStep(S,Date.now()); if(!sp||sp.kind!=='item') continue; const it=E.buildItem(sp); const k=MP.util.plain(it.prompt)+JSON.stringify(it.answer); if(seen.has(k)) d++; seen.add(k); E.afterAnswer(S,sp,{ok:true},Date.now());} S.session=null; return d;})()")
        ok(dup == 0, 'porównywanie liczb: 30 zadań bez ani jednej powtórki')
        # przeciąganie palcem: przerwany gest nie zostawia „ducha”
        await pg.evaluate("(()=>{const S=window.__mp.S,E=MP.engine; E.startSession(S,{mode:'learn',skill:'k2_cmp'},Date.now()); S.session.queue=[]; window.__mp.go('lesson');})()")
        await pg.evaluate(FORCE, ['k2_cmp', 3, 'order', 31]); await pg.wait_for_timeout(150)
        g = await pg.evaluate("""(()=>{const ch=document.querySelector('[data-drag]'); if(!ch) return 'brak'; const r=ch.getBoundingClientRect(); const o={bubbles:true,pointerId:7,pointerType:'touch',isPrimary:true};
           ch.dispatchEvent(new PointerEvent('pointerdown',Object.assign({clientX:r.x+5,clientY:r.y+5},o))); ch.dispatchEvent(new PointerEvent('pointermove',Object.assign({clientX:r.x+60,clientY:r.y+80},o)));
           const mid=document.querySelectorAll('.chipx.ghost').length; ch.dispatchEvent(new PointerEvent('pointercancel',o)); return mid+'→'+document.querySelectorAll('.chipx.ghost').length;})()""")
        ok(g.endswith('→0') and g.startswith('1'), 'przerwany gest dotykowy sprząta przeciągany element (' + g + ')')
        # --- test działu
        await pg.evaluate("(()=>{const S=window.__mp.S,E=MP.engine; S.session=null; const dz=MP.DZIALY[0]; E.dzSkills(dz).forEach(id=>{const s=E.sk(S,id); s.n=10; s.hist=Array.from({length:10},(_,i)=>({t:Date.now(),d:1+i%3,ok:true,h:0,ty:i%2?'fill':'input',s:20})); E.updateLevel(s,Date.now()); s.needsReview=false;}); window.__mp.go('start');})()")
        await pg.wait_for_timeout(200); home = await pg.inner_text('#app')
        ok('Test działu' in home and 'gotowy do testu' in home, 'dział przećwiczony → „gotowy do testu” i przycisk testu działu')
        await pg.click('.nextstep [data-act=rec]'); await pg.wait_for_timeout(200)
        ok('Test działu' in await pg.inner_text('#app') and await pg.locator('[data-act=cardnext]').count() == 1, 'karta testu działu')
        await pg.click('[data-act=cardnext]'); await pg.wait_for_timeout(100)
        ok(await pg.locator('[data-act=hint]').count() == 0 and await pg.locator('[data-act=dontknow]').count() == 1, 'test działu bez wskazówek, z „Nie wiem”')
        await answer_some(pg, 20)
        await pg.wait_for_timeout(200); t = await pg.inner_text('#app'); await pg.screenshot(path='m_chtest.png', full_page=True)
        ok('Twoje odpowiedzi' in t and await pg.locator('.anslist li').count() >= 6, 'po teście lista odpowiedzi (' + str(await pg.locator('.anslist li').count()) + ')')
        ok('zaliczony' in t.lower(), 'zdany test → dział zaliczony')
        await pg.click('[data-go2=start]'); await pg.wait_for_timeout(200)
        ok('✓ zaliczony' in await pg.inner_text('#app'), 'na stronie głównej dział oznaczony „✓ zaliczony”')
        # --- panel rodzica: poziomy z wyjaśnieniem
        await pg.evaluate("window.__mp.go('rodzic')"); await pg.wait_for_timeout(300)
        pt = await pg.inner_text('#app')
        if 'Jak działają poziomy' not in pt:
            kid = await pg.locator('[data-pkid]').count()
            if kid: await pg.locator('[data-pkid]').first.click(); await pg.wait_for_timeout(300); pt = await pg.inner_text('#app')
        ok('Jak działają poziomy' in pt, 'panel rodzica: „Jak działają poziomy?”')
        ok(not errors, 'brak błędów JS ' + json.dumps(errors)[:300])
        await b.close()
    bad = [m for c, m in res if not c]; print('\nWYNIK: %d/%d' % (len(res) - len(bad), len(res)))
asyncio.run(main())
