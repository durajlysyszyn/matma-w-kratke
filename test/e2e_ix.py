# Testy przeglądarkowe nowych interakcji: mysz (przeciąganie), dotyk-dotyk, klawiatura; poprawna odpowiedź → ✓, błąd → diagnoza
import asyncio, json
from e2e2 import onboard
from playwright.async_api import async_playwright
URL='http://localhost:8765/index.html'
res=[]
def ok(c,m): res.append((bool(c),m)); print(('  ✓ ' if c else '  ✗ ')+m)
async def force(pg, skill, d, ty, seed=4242):
    await pg.evaluate("""([sk,d,ty,seed])=>{const S=window.__mp.S; if(!S.session) MP.engine.startSession(S,{mode:'learn',skill:sk},Date.now()); const s=S.session; s.cur={spec:{kind:'item',skill:sk,d:d,type:ty,th:'kosmos',seed:seed},attempts:0,hints:0,solShown:false,t0:Date.now(),tl:Date.now(),resp:null,fb:null}; window.__mp.go('lesson');}""", [skill,d,ty,seed])
    await pg.wait_for_timeout(250)
    return await pg.evaluate("(()=>{const c=window.__mp.S.session.cur; return MP.engine.buildItem(c.spec);})()")
async def check(pg):
    await pg.click('[data-act=checkans]'); await pg.wait_for_timeout(250)
    return await pg.evaluate("(()=>{const c=window.__mp.S.session.cur; return {done:!!c.done, ok:!!c.ok, fb:(document.querySelector('.fb')||{}).textContent||'', ixok:!!document.querySelector('.ix.ok')}})()")
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox']); errors=[]
        ctx = await b.new_context(viewport={'width':1000,'height':1100}); pg = await ctx.new_page(); pg.on('pageerror', lambda e: errors.append(str(e)))
        await pg.goto(URL); await pg.wait_for_timeout(600); await onboard(pg, 'Ola', 6, ['kosmos'])
        # 1) oś liczbowa – klawiatura
        it = await force(pg,'fr_line',1,'nline'); v=it['answer']['value']; k=round(v['n']/v['d']/it['axis']['step'])
        await pg.focus('.nlsvg')
        for _ in range(k): await pg.keyboard.press('ArrowRight')
        r = await check(pg); ok(r['ok'] and r['ixok'], 'oś liczbowa (klawiatura, %d kroków): %s' % (k, r['fb'][:50]))
        await pg.screenshot(path='ix_nline.png')
        # 1b) oś – przeciąganie myszą w złe miejsce, potem rozpoznany błąd
        it = await force(pg,'int_compare',1,'nline', 99); x=it['answer']['value']['n']
        box = await pg.locator('.nlsvg').bounding_box(); W=360; ax=it['axis']
        X=lambda v: box['x'] + (24 + (v-ax['min'])/(ax['max']-ax['min'])*312)/W*box['width']
        await pg.mouse.move(X(0), box['y']+box['height']*0.56); await pg.mouse.down(); await pg.mouse.move(X(-x)+3, box['y']+box['height']*0.56, steps=6); await pg.mouse.up()
        r = await check(pg); ok(r['done'] and not r['ok'] and ('ujemn' in r['fb'].lower() or 'lew' in r['fb'].lower()) and 'Poprawna odpowiedź' in r['fb'] and 'Następne zadanie będzie podobne' in r['fb'], 'oś: błąd znaku → poprawna odpowiedź z wyjaśnieniem i zapowiedź podobnego zadania: ' + r['fb'][:120])
        await pg.click('[data-act=next]'); await pg.wait_for_timeout(200)
        an = await pg.evaluate("(()=>{const c=window.__mp.S.session.cur;return {a:!!c.spec.analog, sk:c.spec.skill, ty:c.spec.type, seed:c.spec.seed}})()")
        ok(an['a'] and an['sk']=='int_compare' and an['ty']=='nline' and an['seed']!=99 and 'Podobne zadanie' in await pg.inner_text('.task .tag'), 'kolejne zadanie: ta sama umiejętność i typ, inne dane')
        await pg.screenshot(path='ix_analog.png')
        it = await force(pg,'int_compare',1,'nline', 99)
        await pg.mouse.move(X(0), box['y']+box['height']*0.56); await pg.mouse.down(); await pg.mouse.move(X(x)-2, box['y']+box['height']*0.56, steps=8); await pg.mouse.up()
        r = await check(pg); ok(r['ok'], 'oś: poprawka przeciągnięciem → dobrze')
        # 2) zamalowywanie – dotyk
        it = await force(pg,'fr_part',2,'shade'); a=it['answer']; kk=a['value']['n']*a['parts']//a['value']['d']
        for i in range(a['value']['n']): await pg.click('[data-part="%d"]'%i)
        r = await check(pg); ok((kk==a['value']['n']) == r['ok'] and (r['ok'] or 'część' in r['fb'].lower() or 'mianownik' in r['fb'].lower() or r['fb']), 'zamalowanie licznika zamiast %d/%d części → %s' % (kk,a['parts'], r['fb'][:80]))
        if not r['ok']: it = await force(pg,'fr_part',2,'shade')
        for i in range(0 if not r['ok'] else a['value']['n'], kk): await pg.click('[data-part="%d"]'%i)
        r = await check(pg); ok(r['ok'] and r['ixok'], 'zamalowanie %d z %d części → ✓' % (kk, a['parts']))
        await pg.screenshot(path='ix_shade.png')
        # 3) paski cięte – fr_add_diff z wynikiem
        it = await force(pg,'fr_add_diff',1,'cutbars'); a=it['answer']
        import math
        L = a['dens'][0]*a['dens'][1]//math.gcd(*a['dens'])
        # najpierw zła liczba części
        bad = L+1
        for _ in range(bad-1): await pg.click('[data-cutk="1"]')
        await pg.wait_for_timeout(100); txt = await pg.locator('.ix.cut').inner_text(); ok('nie pasują' in txt, 'paski: przy %d częściach komunikat „kreski nie pasują”' % bad)
        await pg.click('[data-cutk="-1"]')
        for i,f in enumerate(a['fr']): await pg.fill('[data-cutn="%d"]'%i, str(f['n']*L//f['d']))
        R=a['res']; await pg.fill('[data-cuts]', str(R['n']*L//R['d']))
        await pg.screenshot(path='ix_cut.png')
        r = await check(pg); ok(r['ok'], 'paski: wspólny mianownik %d + liczniki + wynik → ✓ %s' % (L, r['fb'][:40]))
        # 4) kolejność kroków – przeciąganie myszą
        it = await force(pg,'fr_add_diff',2,'order', 7)
        seq = it['answer']['seq']
        for kidx in seq:
            src = pg.locator('.pool [data-drag="%d"]'%kidx); sb = await src.bounding_box(); db = await pg.locator('.seq2').bounding_box()
            await pg.mouse.move(sb['x']+10, sb['y']+10); await pg.mouse.down(); await pg.mouse.move(db['x']+40, db['y']+db['height']-8, steps=8); await pg.mouse.up(); await pg.wait_for_timeout(60)
        await pg.screenshot(path='ix_order.png')
        r = await check(pg); ok(r['ok'], 'kolejność kroków przeciąganiem → ✓')
        # 4b) kolejność – złe ułożenie (dotykiem) rozpoznane
        it = await force(pg,'fr_add_diff',2,'order', 8); seq=it['answer']['seq']; wrong=[seq[1],seq[0]]+seq[2:]
        for kidx in wrong: await pg.click('.pool [data-drag="%d"]'%kidx)
        r = await check(pg); ok(r['done'] and not r['ok'] and 'Poprawna odpowiedź' in r['fb'], 'zamienione kroki → pokazana poprawna kolejność: ' + r['fb'][:80])
        # 5) segregowanie – dotknij element, potem grupę (alternatywa dla przeciągania) + klawiatura Enter na grupie
        it = await force(pg,'fr_mixed',1,'bins'); bins=it['answer']['bins']
        for i,bn in enumerate(bins):
            await pg.click('.pool [data-drag="%d"]'%i)
            if i%2==0: await pg.click('.bin[data-drop="%d"] > b'%bn)
            else: await pg.focus('.bin[data-drop="%d"]'%bn); await pg.keyboard.press('Enter')
            await pg.wait_for_timeout(40)
        await pg.screenshot(path='ix_bins.png')
        r = await check(pg); ok(r['ok'], 'segregowanie (dotyk + Enter) → ✓')
        # 6) punkt – klawiatura strzałkami i kliknięcie
        it = await force(pg,'sym_line',2,'point'); a=it['answer']
        await pg.focus('.ptsvg')
        for _ in range(abs(a['x'])): await pg.keyboard.press('ArrowRight' if a['x']>0 else 'ArrowLeft')
        for _ in range(abs(a['y'])): await pg.keyboard.press('ArrowUp' if a['y']>0 else 'ArrowDown')
        r = await check(pg); ok(r['ok'], 'symetria: punkt ustawiony strzałkami (%d,%d) → ✓' % (a['x'],a['y']))
        await pg.screenshot(path='ix_point.png')
        it = await force(pg,'coord',2,'point', 31); a=it['answer']
        bx = await pg.locator('.ptsvg').bounding_box(); s=bx['width']/(2*(12+5*24))
        await pg.mouse.click(bx['x']+(12+5*24+a['y']*24)*s, bx['y']+(12+5*24-a['x']*24)*s)
        r = await check(pg); ok((a['x']==a['y']) or (not r['ok'] and ('zamien' in r['fb'].lower() or 'x' in r['fb'])), 'zamienione współrzędne rozpoznane: ' + r['fb'][:80])
        # 7) prostokąt – przyciski
        it = await force(pg,'area_rect',2,'rect'); a=it['answer']
        for _ in range(a['solA']-1): await pg.click('[data-rk=a][data-rd="1"]')
        for _ in range(a['solB']-1): await pg.click('[data-rk=b][data-rd="1"]')
        r = await check(pg); ok(r['ok'], 'prostokąt %dx%d (pole %s, obwód %s) → ✓' % (a['solA'],a['solB'],a.get('area'),a.get('per')))
        await pg.screenshot(path='ix_rect.png')
        # 8) wybór danych – zaznaczenie zbędnej danej → błąd czytania
        it = await force(pg,'fr_add_diff',3,'multisel')
        await pg.click('[data-ms="0"]'); await pg.click('[data-ms="1"]'); await pg.click('[data-ms="2"]')
        r = await check(pg); ok(not r['ok'], 'zbędna dana zaznaczona → nie zaliczone: ' + r['fb'][:70])
        it = await force(pg,'fr_add_diff',3,'multisel'); await pg.click('[data-ms="0"]'); await pg.click('[data-ms="1"]'); r = await check(pg); ok(r['ok'], 'tylko potrzebne dane → ✓')
        await pg.screenshot(path='ix_msel.png')
        # 9) dopasowanie par (istniejące zadanie match) – teraz przez przeciąganie/dotyk
        it = await force(pg,'dec_conv',1,'match') if await pg.evaluate("MP.SK.dec_conv.types[1].includes('match')") else None
        if it:
            pairs = it['answer']['pairs']
            for i,j in enumerate(pairs):
                await pg.click('.pool [data-drag="%d"]'%j); await pg.click('[data-drop="%d"]'%i)
            r = await check(pg); ok(r['ok'], 'dopasowanie par dotykiem → ✓')
            await pg.screenshot(path='ix_match.png')
        # 10) mobile: przeciąganie palcem nie przewija strony (touch-action) – sprawdzamy styl
        ta = await pg.evaluate("getComputedStyle(document.querySelector('.chipx')||document.body).touchAction")
        ok(ta in ('none',), 'elementy do przeciągania mają touch-action:none (' + ta + ')')
        ok(not errors, 'brak błędów JS: ' + json.dumps(errors)[:300])
        await b.close()
    bad=[m for c,m in res if not c]; print('\nWYNIK: %d/%d' % (len(res)-len(bad), len(res)))
asyncio.run(main())
