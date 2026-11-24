# Przerwana lekcja: baner tylko po faktycznych odpowiedziach; przerwa w połowie nie traci postępu
import asyncio, json
from e2e2 import onboard, UNLOCK, IXANS
from playwright.async_api import async_playwright
URL='http://localhost:8765/index.html'; res=[]
def ok(c,m): res.append((bool(c),m)); print(('  ✓ ' if c else '  ✗ ')+m)
async def answer(pg, n):
  done=0
  while done<n:
    await pg.wait_for_timeout(60)
    if await pg.locator('[data-act=cardnext]').count(): await pg.click('[data-act=cardnext]'); continue
    if await pg.locator('[data-act=next]').count(): await pg.click('[data-act=next]'); continue
    await pg.evaluate("""(()=>{const c=window.__mp.S.session.cur,it=MP.engine.buildItem(c.spec),a=it.answer;
      if(a.kind==='choice'){c.sel=a.correct;return;} if(a.kind==='num'){const v=a.value;document.getElementById('inp')?(c.draft=null):0;window.__ans=(v.n<0?'-':'')+Math.abs(v.n)+(v.d>1?'/'+v.d:'');return;} window.__ans=null;})()""")
    t=await pg.evaluate("MP.engine.buildItem(window.__mp.S.session.cur.spec).answer.kind")
    if t=='num': await pg.fill('#inp', await pg.evaluate("window.__ans"))
    elif t!='choice': await pg.evaluate(IXANS)
    await pg.click('[data-act=checkans]'); done+=1
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox']); err=[]
    pg=await b.new_page(viewport={'width':1100,'height':1000}); pg.on('pageerror',lambda e: err.append(str(e)))
    await pg.goto(URL); await pg.wait_for_timeout(500); await onboard(pg,'Ola',6,['swinki']); await pg.evaluate(UNLOCK)
    # 1) otwarta lekcja bez odpowiedzi
    await pg.evaluate("window.__mp.go('topic',{id:'duz_dod'})"); await pg.wait_for_timeout(150); await pg.click('[data-learn=fr_add_same]'); await pg.wait_for_timeout(200)
    await pg.evaluate("window.__mp.go('start')"); await pg.wait_for_timeout(200)
    ok(await pg.locator('.resume:has-text("Przerwana lekcja")').count()==0, 'lekcja otwarta bez odpowiedzi → brak paska „Przerwana lekcja”')
    await pg.reload(); await pg.wait_for_timeout(600)
    ok(await pg.locator('.resume:has-text("Przerwana lekcja")').count()==0, 'także po ponownym otwarciu aplikacji / zalogowaniu')
    # 2) 5 odpowiedzi i przerwa
    await pg.evaluate("window.__mp.go('topic',{id:'duz_dod'})"); await pg.wait_for_timeout(150); await pg.click('[data-learn=fr_add_same]'); await pg.wait_for_timeout(200)
    await answer(pg,5); await pg.wait_for_timeout(150)
    n0=await pg.evaluate("window.__mp.S.log.length")
    await pg.click('[data-act=pause]'); await pg.wait_for_timeout(150)
    t=await pg.inner_text('#app'); ok('Chcesz zrobić przerwę?' in t and 'są już zapisane' in t, 'przerwij → pytanie: dokończę później / zakończ teraz / wracam')
    await pg.screenshot(path='p_pause.png')
    await pg.click('[data-act=pauselater]'); await pg.wait_for_timeout(200)
    ban=await pg.inner_text('.resume') if await pg.locator('.resume').count() else ''
    ok('Przerwana lekcja' in ban and 'zrobione 5 zadań' in ban, 'na ekranie głównym: „Przerwana lekcja … zrobione 5 zadań”: ' + ban.replace('\n',' ')[:120])
    await pg.reload(); await pg.wait_for_timeout(600)
    ok(await pg.locator('.resume:has-text("zrobione 5 zadań")').count()==1, 'pasek zostaje po zamknięciu i otwarciu aplikacji')
    await pg.click('.resume [data-act=rec]'); await pg.wait_for_timeout(200)
    r=await pg.evaluate("window.__mp.S.session.results.length"); ok(r==5 and await pg.locator('.lhead').count()==1, 'kontynuacja od 6. zadania (zapisanych odpowiedzi: %d)' % r)
    # 3) zakończ teraz
    await answer(pg,2); await pg.wait_for_timeout(150); await pg.click('[data-act=pause]'); await pg.wait_for_timeout(100); await pg.click('[data-act=pausefinish]'); await pg.wait_for_timeout(300); await pg.screenshot(path='p_fin.png')
    t=await pg.inner_text('#app'); n1=await pg.evaluate("window.__mp.S.log.length")
    ok(await pg.evaluate("window.__mp.S.session")==None and n1>=7 and ('Podsumowanie' in t or 'robota' in t or 'ćwiczysz' in t), 'zakończ teraz → podsumowanie, wszystkie 7 odpowiedzi zapisane w postępach (%d)' % n1)
    await pg.evaluate("window.__mp.go('start')"); await pg.wait_for_timeout(150)
    ok(await pg.locator('.resume:has-text("Przerwana lekcja")').count()==0, 'po zakończeniu brak paska przerwanej lekcji')
    ok(not err,'brak błędów JS '+json.dumps(err)[:200]); await b.close()
  bad=[m for c,m in res if not c]; print('\nWYNIK: %d/%d'%(len(res)-len(bad),len(res)))
asyncio.run(main())
