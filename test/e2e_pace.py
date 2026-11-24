import asyncio, json
from e2e2 import onboard
from playwright.async_api import async_playwright
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox']); err=[]
    for vp,nm in [((1200,1000),'d'),((390,844),'m')]:
      pg=await b.new_page(viewport={'width':vp[0],'height':vp[1]}); pg.on('pageerror',lambda e: err.append(str(e)))
      await pg.goto('http://localhost:8765/index.html'); await pg.wait_for_timeout(500); await onboard(pg,'Kuba',6,['swinki'])
      await pg.evaluate("""(()=>{const S=window.__mp.S, t=Date.now(); const add=(s,ty,d,sec,ok,n)=>{for(let i=0;i<n;i++)S.log.push({t:t-i*60000,s,d,ty,ok,a:1,sec:sec+(i%3)*4,m:'learn'});};
        add('fr_add_diff','input',2,115,true,9); add('fr_add_same','choice',2,30,true,6); add('tabl','input',1,25,true,10); add('nwd','input',2,50,false,4); window.__mp.render();})()""")
      await pg.evaluate("window.__mp.go('dzieci')"); await pg.wait_for_timeout(200)
      print(nm,'card tags:', await pg.inner_text('.kidc .ktags'))
      await pg.click('[data-pkid]'); await pg.wait_for_timeout(300)
      t=await pg.inner_text('#app'); i=t.find('Tempo pracy'); print(nm, t[i:i+700].replace('\n',' | '))
      await pg.click('.pdz:has-text("ułamkach") summary') ; await pg.wait_for_timeout(100)
      sec=pg.locator('section:has(h2:has-text("Tempo pracy"))'); await sec.screenshot(path=f'pace_{nm}.png')
      print('sw', await pg.evaluate('document.documentElement.scrollWidth'))
    print('ERR', err); await b.close()
asyncio.run(main())
