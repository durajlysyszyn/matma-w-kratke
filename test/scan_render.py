# Skan renderowania: każda umiejętność × trudność × typ × 3 ziarna, na telefonie (390 px)
import asyncio, json
from playwright.async_api import async_playwright
URL='http://localhost:8765/index.html'
JS=r"""async (g)=>{ const out=[]; const S=window.__mp.S; MP.setGrade(g); const E=MP.engine;
 const ids=Object.keys(MP.SK).filter(id=>MP.SK[id].types && !MP.SK[id].planned && (MP.SKILL_ORDER.includes(id)));
 for (const id of ids){ for (const d of [1,2,3]){ const tys=(MP.SK[id].types[d]||[]); for (const ty of tys){ for (const seed of [11,22,33]){
   let sp; try{ sp=E.makeSpec(id,d,ty); sp.seed=seed; }catch(e){ out.push({id,d,ty,err:'makeSpec '+e.message}); continue; }
   if (S.session) S.session=null; E.startSession(S,{mode:'learn',skill:id},Date.now()); S.session.queue=[];
   S.session.cur={spec:sp,attempts:0,hints:3,solShown:true,t0:Date.now(),tl:Date.now(),resp:null,fb:null};
   try{ window.__mp.go('lesson',{from:'start'}); }catch(e){ out.push({id,d,ty,seed,err:'render '+e.message}); continue; }
   const root=document.querySelector('.lesson'); if(!root){ out.push({id,d,ty,seed,err:'brak .lesson'}); continue; }
   const t=root.innerText; const r=[];
   for (const p of ['mathrm','undefined','NaN','null','[object','\\frac','\\cdot','\\square','Infinity','$']) if (t.includes(p)) r.push('tekst:'+p);
   const ke=root.querySelector('.katex-error'); if(ke) r.push('katex-error:'+ke.textContent.slice(0,50));
   const tk=document.querySelector('.task'); if (tk && tk.scrollWidth>tk.clientWidth+4) r.push('poziomy-scroll:'+tk.scrollWidth);
   if (document.documentElement.scrollWidth>window.innerWidth+2) r.push('strona-szersza:'+document.documentElement.scrollWidth);
   if (r.length) out.push({g,id,d,ty,seed,r,prompt:(root.querySelector('.q')||{}).innerText?.slice(0,90)});
 }}}} return {n:ids.length, out}; }"""
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox']); errs=[]
        pg=await b.new_page(viewport={'width':390,'height':844}); pg.on('pageerror',lambda e: errs.append(str(e)[:200]))
        await pg.goto(URL); await pg.wait_for_timeout(600)
        # tryb lokalny bez logowania
        from e2e2 import onboard, UNLOCK
        await onboard(pg,'Test',6,['gry']); await pg.evaluate(UNLOCK)
        res={}
        for g in range(1,9):
            await pg.evaluate("g=>{ if(!window.__mp.S.profile) window.__mp.S.profile={name:'Test',grade:g,av:{},interests:['gry']}; window.__mp.S.profile.grade=g; }", g)
            r=await pg.evaluate(JS, g); res[g]=r; print('klasa',g,'umiejętności',r['n'],'problemy',len(r['out']))
            for o in r['out'][:6]: print('   ',json.dumps(o,ensure_ascii=False)[:260])
        json.dump(res,open('wyniki/scan.json','w'),ensure_ascii=False,indent=1); print('JS errors',len(errs),errs[:5]); await b.close()
asyncio.run(main())
