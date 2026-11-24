import asyncio, json
from playwright.async_api import async_playwright
URL='http://localhost:8765/index.html'
UNLOCK = "(()=>{const S=window.__mp.S; Object.keys(MP.SK).forEach(id=>{MP.engine.sk(S,id).placedOk=true;}); window.__mp.render();})()"
async def onboard(pg, name, grade, ints):
    if await pg.locator('[data-act=addchildp]').count(): await pg.click('[data-act=addchildp]'); await pg.wait_for_timeout(100)
    await pg.fill('#nm', name); await pg.click('[data-ob="1"]'); await pg.wait_for_timeout(100)
    await pg.click(f'[data-grade="{grade}"]'); await pg.click('[data-ob="2"]'); await pg.wait_for_timeout(100)
    await pg.click('[data-avk=hair][data-avd="1"]'); await pg.click('[data-ob="3"]'); await pg.wait_for_timeout(100)
    if await pg.locator('[data-helper]').count(): await pg.click('[data-helper=robot]'); await pg.click('[data-ob="4"]'); await pg.wait_for_timeout(100)
    for k in ints: await pg.click(f'[data-int={k}]')
    await pg.click('[data-ob=done]'); await pg.wait_for_timeout(300)
async def answer_some(pg, n):
    for i in range(n*3):
        await pg.wait_for_timeout(60)
        if await pg.locator('[data-act=cardnext]').count(): await pg.click('[data-act=cardnext]'); continue
        if await pg.locator('[data-act=next]').count(): await pg.click('[data-act=next]'); continue
        if await pg.locator('#inp:not([disabled])').count():
            a = await pg.evaluate("(()=>{const v=MP.engine.buildItem(window.__mp.S.session.cur.spec).answer.value;return (v.n<0?'-':'')+Math.abs(v.n)+(v.d>1?'/'+v.d:'')})()")
            await pg.fill('#inp', a); await pg.click('[data-act=checkans]'); continue
        if await pg.locator('[data-opt]:not([disabled])').count():
            c = await pg.evaluate("MP.engine.buildItem(window.__mp.S.session.cur.spec).answer.correct"); await pg.locator(f'[data-opt="{c}"]').click(); await pg.click('[data-act=checkans]'); continue
        if await pg.locator('[data-multi]').count():
            vals = await pg.evaluate("MP.engine.buildItem(window.__mp.S.session.cur.spec).answer.values.map(v=>v.n+(v.d>1?'/'+v.d:''))")
            for k,v in enumerate(vals): await pg.fill(f'[data-multi="{k}"]', v)
            await pg.click('[data-act=checkans]'); continue
        if await pg.locator('[data-seq]:not([disabled])').count():
            seq = await pg.evaluate("MP.engine.buildItem(window.__mp.S.session.cur.spec).answer.seq")
            for k in seq: await pg.locator(f'[data-seq="{k}"]').click()
            await pg.click('[data-act=checkans]'); continue
        if await pg.locator('.ix').count() and await pg.locator('[data-act=checkans]').count():
            await pg.evaluate(IXANS); await pg.click('[data-act=checkans]'); continue
        break
# poprawna odpowiedź dla zadań interaktywnych (interakcje same w sobie testuje e2e_ix.py)
IXANS = """(()=>{const c=window.__mp.S.session.cur, it=MP.engine.buildItem(c.spec), a=it.answer, U=MP.util; let v=null;
 if(a.kind==='pos') v=U.val(a.value); else if(a.kind==='shade') v=Array.from({length:a.value.n*a.parts/a.value.d},(_,i)=>i);
 else if(a.kind==='cut'){const k=a.dens.reduce((x,y)=>U.lcm(x,y)); v={k,n:a.fr.map(f=>String(f.n*k/f.d)),s:a.res?String(a.res.n*k/a.res.d):undefined};}
 else if(a.kind==='bins'||a.kind==='match') v=Object.assign({},a.bins||a.pairs); else if(a.kind==='point') v={x:a.x,y:a.y}; else if(a.kind==='rect') v={a:a.solA,b:a.solB};
 else if(a.kind==='cells') v=Array.from({length:a.count},(_,i)=>i); else if(a.kind==='multisel') v=a.set.slice(); else if(a.kind==='order') v=a.seq.slice();
 c.draft=v;})()"""
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        errors=[]
        ctx = await b.new_context(viewport={'width':1280,'height':900}); pg = await ctx.new_page()
        pg.on('pageerror', lambda e: errors.append(str(e)))
        await pg.goto(URL); await pg.wait_for_timeout(600)
        await onboard(pg, 'Kuba', 6, ['kosmos','pilka'])
        await pg.evaluate("window.__mp.go('topic',{id:'duz_dod'})"); await pg.wait_for_timeout(150)
        await pg.evaluate(UNLOCK)
        await pg.click('[data-learn=fr_add_same]'); await answer_some(pg, 6)
        kuba_items = await pg.evaluate("window.__mp.S.stats.items"); print('Kuba items', kuba_items)
        # drugie dziecko
        await pg.evaluate("window.__mp.go('dzieci')"); await pg.wait_for_timeout(150); await pg.click('[data-act=addchild]'); await pg.wait_for_timeout(150)
        await pg.screenshot(path='n_onb0.png')
        await pg.fill('#nm','Ola'); await pg.click('[data-ob="1"]'); await pg.wait_for_timeout(100)
        await pg.screenshot(path='n_grade.png')
        await pg.click('[data-grade="2"]'); await pg.click('[data-ob="2"]'); await pg.click('[data-ob="3"]'); await pg.click('[data-int=zwierzeta]'); await pg.click('[data-int=dinozaury]'); await pg.click('[data-ob=done]'); await pg.wait_for_timeout(300)
        await pg.screenshot(path='n_home2.png', full_page=True)
        print('Ola grade', await pg.evaluate("MP.grade"), 'items', await pg.evaluate("window.__mp.S.stats.items"))
        await pg.evaluate("window.__mp.go('start')"); await pg.wait_for_timeout(150); await pg.screenshot(path='n_dz2.png', full_page=True)
        await pg.evaluate("window.__mp.go('topic',{id:'k2t_clock'})"); await pg.wait_for_timeout(150)
        await pg.evaluate(UNLOCK)
        await pg.click('[data-learn=k2_clock]'); await pg.wait_for_timeout(150)
        while await pg.locator('[data-act=cardnext]').count(): await pg.click('[data-act=cardnext]')
        await pg.screenshot(path='n_clock.png', full_page=True)
        await answer_some(pg, 4)
        await pg.evaluate("window.__mp.go('topic',{id:'k2t_word'})"); await pg.wait_for_timeout(150)
        await pg.evaluate(UNLOCK)
        await pg.click('[data-learn=k2_word]'); await pg.wait_for_timeout(150)
        while await pg.locator('[data-act=cardnext]').count(): await pg.click('[data-act=cardnext]')
        await pg.screenshot(path='n_word.png', full_page=True)
        await answer_some(pg, 3)
        await pg.click('[data-act=pause]') if await pg.locator('[data-act=pause]').count() else None
        await pg.evaluate("window.__mp.go('dzieci')"); await pg.wait_for_timeout(300); await pg.screenshot(path='n_parent.png', full_page=True)
        # przeładowanie → ekran wyboru
        await pg.goto(URL); await pg.reload(); await pg.wait_for_timeout(600); await pg.screenshot(path='n_who.png')
        names = await pg.locator('[data-who]').all_inner_texts(); print('who', names)
        await pg.locator('[data-who]').first.click(); await pg.wait_for_timeout(300)
        print('after pick', await pg.evaluate("window.__mp.S.profile.name"), await pg.evaluate("window.__mp.S.stats.items"), 'grade', await pg.evaluate("MP.grade"))
        # klasa 5
        await pg.evaluate("window.__mp.go('dzieci')"); await pg.click('[data-act=addchild]'); await pg.wait_for_timeout(100)
        await onboard(pg, 'Ala', 5, ['muzyka'])
        await pg.evaluate("window.__mp.go('start')"); await pg.wait_for_timeout(150); await pg.screenshot(path='n_dz5.png', full_page=True)
        await pg.evaluate("window.__mp.go('topic',{id:'nat_pisem'})"); await pg.wait_for_timeout(150)
        await pg.evaluate(UNLOCK)
        await pg.click('[data-learn=nat_pis]'); await answer_some(pg, 3)
        print('profiles', await pg.evaluate("window.__mp.IDX.profiles.map(p=>p.name+':'+p.grade)"))
        # migracja ze starej wersji
        ctx3 = await b.new_context(viewport={'width':390,'height':844}); pm = await ctx3.new_page(); pm.on('pageerror', lambda e: errors.append('mig:'+str(e)))
        await pm.goto(URL); await pm.evaluate("localStorage.clear(); localStorage.setItem('mp6_state_v1', JSON.stringify(Object.assign(MP.engine.newState(Date.now()), {profile:{name:'Stary',av:null,interests:['gry']}, stats:{items:42,ok:30,hintsUsed:0,afterHint:0,errFound:0,remed:0,noHintRun:0}, settings:{pin:'h123',showGrade:true,sessionLen:10}})))")
        await pm.reload(); await pm.wait_for_timeout(600)
        print('migrated', await pm.evaluate("JSON.stringify({n:window.__mp.S&&window.__mp.S.profile.name, items:window.__mp.S&&window.__mp.S.stats.items, grade:MP.grade, pin:window.__mp.IDX.pin})"))
        await pm.screenshot(path='n_mig_mobile.png', full_page=True)
        print('ERRORS', errors)
        await b.close()
if __name__ == "__main__": asyncio.run(main())
