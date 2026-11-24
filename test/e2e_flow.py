# Potwierdzanie odpowiedzi i zadanie analogiczne po błędzie
import asyncio, json, sys
from e2e2 import onboard, UNLOCK
from playwright.async_api import async_playwright
URL='http://localhost:8765/index.html'; res=[]
def ok(c,m): res.append((bool(c),m)); print(('  ✓ ' if c else '  ✗ ')+m)
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox']); err=[]
    pg=await b.new_page(viewport={'width':1100,'height':1000}); pg.on('pageerror',lambda e: err.append(str(e)))
    await pg.goto(URL); await pg.wait_for_timeout(500); await onboard(pg,'Ola',6,['konie']); await pg.evaluate(UNLOCK)
    await pg.evaluate("window.__mp.go('topic',{id:'duz_dod'})"); await pg.wait_for_timeout(150)
    await pg.click('[data-learn=fr_add_same]'); await pg.wait_for_timeout(200)
    while await pg.locator('[data-act=cardnext]').count(): await pg.click('[data-act=cardnext]')
    await pg.evaluate("(()=>{const s=window.__mp.S.session; s.cur={spec:MP.engine.makeSpec('fr_add_same',2,'choice'),attempts:0,hints:0,solShown:false,t0:Date.now(),tl:Date.now(),resp:null,fb:null}; window.__mp.render();})()"); await pg.wait_for_timeout(200)
    it=await pg.evaluate("MP.engine.buildItem(window.__mp.S.session.cur.spec)"); corr=it['answer']['correct']; wrong=[i for i in range(len(it['options'])) if i!=corr]
    before=await pg.evaluate("window.__mp.S.session.results.length")
    await pg.click(f'[data-opt="{wrong[0]}"]'); await pg.wait_for_timeout(120)
    st=await pg.evaluate("(()=>{const c=window.__mp.S.session.cur;return {a:c.attempts, sel:c.sel, done:!!c.done}})()")
    ok(st['a']==0 and st['sel']==wrong[0] and not st['done'], 'kliknięcie odpowiedzi tylko ją zaznacza (bez sprawdzania)')
    ok(await pg.locator(f'[data-opt="{wrong[0]}"].sel').count()==1 and await pg.locator('[data-act=checkans]').count()==1, 'zaznaczenie widoczne + przycisk „Sprawdź”')
    await pg.click(f'[data-opt="{wrong[1]}"]'); await pg.wait_for_timeout(100); ok(await pg.evaluate("window.__mp.S.session.cur.sel")==wrong[1], 'można zmienić zdanie przed sprawdzeniem')
    await pg.screenshot(path='f_sel.png')
    await pg.click('[data-act=checkans]'); await pg.wait_for_timeout(200)
    fb=await pg.inner_text('.fb'); ok('Poprawna odpowiedź' in fb and 'Następne zadanie będzie podobne' in fb, 'po błędzie: poprawna odpowiedź + wyjaśnienie, bez ponownego zaznaczania')
    ok(await pg.locator('.opt.right').count()>=1 and await pg.locator('[data-act=next]').count()==1 and await pg.locator('.sol').count()==1, 'zaznaczona poprawna opcja, rozwiązanie krok po kroku, przycisk „Dalej”')
    await pg.screenshot(path='f_wrong.png', full_page=True)
    sp0=await pg.evaluate("window.__mp.S.session.cur.spec")
    await pg.click('[data-act=next]'); await pg.wait_for_timeout(200)
    sp1=await pg.evaluate("window.__mp.S.session.cur.spec")
    ok(sp1.get('analog') and sp1['skill']==sp0['skill'] and sp1['type']==sp0['type'] and sp1['d']==sp0['d'] and sp1['seed']!=sp0['seed'], 'następne: analogiczne zadanie (ta sama umiejętność, typ i trudność, inne dane)')
    ok('Podobne zadanie' in await pg.inner_text('.task .tag'), 'oznaczenie „Podobne zadanie – spróbuj jeszcze raz”')
    p0=await pg.evaluate("MP.util.plain(MP.engine.buildItem(%s).prompt)" % json.dumps(sp0)); p1=await pg.evaluate("MP.util.plain(MP.engine.buildItem(window.__mp.S.session.cur.spec).prompt)")
    ok(p0!=p1, 'inne liczby: „%s” → „%s”' % (p0[:50], p1[:50]))
    c1=await pg.evaluate("MP.engine.buildItem(window.__mp.S.session.cur.spec).answer.correct")
    await pg.click(f'[data-opt="{c1}"]'); await pg.click('[data-act=checkans]'); await pg.wait_for_timeout(200)
    ok('✓' in await pg.inner_text('.fb'), 'analogiczne zadanie rozwiązane dobrze')
    n=await pg.evaluate("(()=>{const s=window.__mp.S.session;return {counted:s.results.filter(r=>!r.detour&&!r.probe&&!r.analog).length, all:s.results.length, max:s.max}})()")
    ok(n['all']==n['counted']+1, 'zadanie analogiczne nie skraca lekcji (liczone %d z %d, wszystkich %d)' % (n['counted'], n['max'], n['all']))
    # wpisywanie: błąd → też poprawna odpowiedź i analogia
    await pg.click('[data-act=next]'); await pg.wait_for_timeout(150)
    await pg.evaluate("(()=>{const s=window.__mp.S.session; s.cur={spec:MP.engine.makeSpec('fr_add_same',2,'input'),attempts:0,hints:0,solShown:false,t0:Date.now(),tl:Date.now(),resp:null,fb:null}; window.__mp.render();})()"); await pg.wait_for_timeout(150)
    await pg.fill('#inp','977'); await pg.click('[data-act=checkans]'); await pg.wait_for_timeout(200)
    ok('Poprawna odpowiedź' in await pg.inner_text('.fb'), 'zadanie z wpisywaniem: po błędzie poprawna odpowiedź')
    # test opanowania: bez pokazywania wyniku, bez analogii
    await pg.evaluate("(()=>{const S=window.__mp.S; S.session=null; MP.engine.startSession(S,{mode:'mastery',skill:'fr_add_same'},Date.now()); window.__mp.go('lesson');})()"); await pg.wait_for_timeout(200)
    while await pg.locator('[data-act=cardnext]').count(): await pg.click('[data-act=cardnext]')
    t=await pg.evaluate("MP.engine.buildItem(window.__mp.S.session.cur.spec).type")
    if t in ('choice','why','error'):
      cc=await pg.evaluate("MP.engine.buildItem(window.__mp.S.session.cur.spec).answer.correct"); await pg.click(f'[data-opt="{(cc+1)%2}"]'); await pg.click('[data-act=checkans]')
    else:
      await pg.evaluate("window.__mp.S.session.cur.draft='977'") ; await pg.fill('#inp','977') if await pg.locator('#inp').count() else None; await pg.click('[data-act=checkans]')
    await pg.wait_for_timeout(200)
    ok('Zapisane' in await pg.inner_text('.fb') and 'Poprawna odpowiedź' not in await pg.inner_text('.fb'), 'test opanowania: odpowiedź tylko zapisana (bez podpowiadania wyniku)')
    ok(not err, 'brak błędów JS '+json.dumps(err)[:200]); await b.close()
  bad=[m for c,m in res if not c]; print('\nWYNIK: %d/%d'%(len(res)-len(bad),len(res)))
asyncio.run(main())
