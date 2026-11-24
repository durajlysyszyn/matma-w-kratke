import asyncio
from e2e2 import onboard
from playwright.async_api import async_playwright
URL='http://localhost:8765/index.html'
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox']); errors=[]
        ctx = await b.new_context(viewport={'width':1100,'height':1000}); pg = await ctx.new_page(); pg.on('pageerror', lambda e: errors.append(str(e)))
        await pg.goto(URL); await pg.wait_for_timeout(600); await onboard(pg, 'Kuba', 6, ['kosmos'])
        await pg.evaluate("(()=>{const S=window.__mp.S; Object.keys(MP.SK).forEach(id=>{MP.engine.sk(S,id).placedOk=true;});})()")  # podstawy uznane za opanowane (blokada tematów)
        await pg.evaluate("window.__mp.go('topic',{id:'duz_dod'})"); await pg.wait_for_timeout(150)
        await pg.click('[data-learn=fr_add_diff]'); await pg.wait_for_timeout(200)
        for i in range(8):
            if await pg.locator('[data-act=cardnext]').count(): await pg.click('[data-act=cardnext]'); await pg.wait_for_timeout(100); continue
            break
        # force an input fr_add_diff item
        await pg.evaluate("""(()=>{const s=window.__mp.S.session; s.cur={spec:{kind:'item',skill:'fr_add_diff',d:2,type:'input',th:'kosmos',seed:12345},attempts:0,hints:2,solShown:true,t0:Date.now(),tl:Date.now(),resp:null,fb:null}; window.__mp.render();})()""")
        await pg.wait_for_timeout(300)
        await pg.screenshot(path='m_input.png', full_page=True)
        # type via keypad: fraction
        await pg.click('[data-mk=frac]'); await pg.click('[data-mk="5"]'); await pg.click('[data-mk=next]'); await pg.click('[data-mk="4"]')
        await pg.wait_for_timeout(100); print('read', await pg.evaluate("MP.mf.read(document.getElementById('app'))"))
        await pg.screenshot(path='m_typed.png')
        # keyboard typing: clear and type 1 1/4
        await pg.click('[data-mk=clr]'); await pg.click('#inp'); await pg.keyboard.type('1 1/4'); await pg.wait_for_timeout(100)
        print('read2', await pg.evaluate("MP.mf.read(document.getElementById('app'))"))
        await pg.keyboard.press('Enter'); await pg.wait_for_timeout(300)
        await pg.screenshot(path='m_after.png', full_page=True)
        print('ERRORS', errors); await b.close()
asyncio.run(main())
