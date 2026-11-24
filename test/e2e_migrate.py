# Postęp zapisany w STAREJ wersji (kopia sprzed zmian) otwarty w NOWEJ – nic nie może zginąć
import asyncio, json
from playwright.async_api import async_playwright
from e2e2 import onboard
OLD = 'http://localhost:8767/index.html'; NEW = 'http://localhost:8765/index.html'
res = []
def ok(c, m): res.append((bool(c), m)); print(('  ✓ ' if c else '  ✗ ') + m)
SIM = open('shots.py').read().split('SIM = r"""')[1].split('"""')[0]
SNAP = """(()=>{const S=window.__mp.S; const sk=Object.keys(S.skills).sort(); return {name:S.profile.name, grade:S.profile.grade, items:S.stats.items, ok:S.stats.ok, days:Object.keys(S.days).length, log:S.log.length,
  skills:sk.length, n:sk.map(id=>S.skills[id].n).join(','), hist:sk.map(id=>S.skills[id].hist.length).join(','), lvl:sk.map(id=>S.skills[id].lvl).join(','), badges:Object.keys(S.badges).length, interests:(S.profile.interests||[]).join(','), helper:S.profile.helper||''};})()"""
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox']); errs = []
        ctx = await b.new_context(viewport={'width': 1000, 'height': 900}); await ctx.add_init_script(SIM)
        pg = await ctx.new_page(); pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(OLD); await pg.wait_for_timeout(500); await onboard(pg, 'Kuba', 6, ['pilka', 'gry'])
        await pg.click('[data-act=welcomed]') if await pg.locator('[data-act=welcomed]').count() else None
        await pg.evaluate("""(()=>{const S=window.__mp.S,E=MP.engine,t=Date.now()-15*E.DAY; MP.SKILL_ORDER.slice(0,10).forEach(id=>{const s=E.sk(S,id); s.placedOk=true; s.lvl=4; s.maxLvl=4; s.mastery={at:t,aspects:['proc']}; s.l4At=t; s.n=6; s.next=t+40*E.DAY; s.hist=[1,2,3,3,2].map(d=>({t,d,ok:true,h:0,ty:'input'}));}); S.placement={done:true,at:t};})()""")
        await pg.evaluate("window.__sim({days:12, per:3, skip:[3], base:0.85, p:{fr_add_diff:0.45}, code:{fr_add_diff:'frac_add_both'}, speed:{}})")
        # stan „w trakcie”: umiejętność gotowa do testu opanowania i rozpoczęty test pojedynczej umiejętności
        await pg.evaluate("""(()=>{const S=window.__mp.S,E=MP.engine; const id=MP.SKILL_ORDER.find(i=>S.skills[i]&&S.skills[i].lvl===3); if(id){S.skills[id].testReady=true; window.__tr=id;} E.startSession(S,{mode:'mastery',skill:id||'fr_add_same'},Date.now()); S.session.results.push({skill:id,ok:true}); MP.store.save(S, window.__mp.CID);})()""")
        await pg.wait_for_timeout(800)
        before = await pg.evaluate(SNAP); tr = await pg.evaluate("window.__tr || null")
        ls = await pg.evaluate("JSON.stringify(Object.fromEntries(Object.keys(localStorage).map(k=>[k,localStorage.getItem(k)])))")
        print('stara wersja:', json.dumps(before, ensure_ascii=False)[:300])
        ctx2 = await b.new_context(viewport={'width': 1000, 'height': 900})
        await ctx2.add_init_script("if(!localStorage.getItem('__m')){const d=" + json.dumps(ls) + "; const o=JSON.parse(d); for(const k in o) localStorage.setItem(k,o[k]); localStorage.setItem('__m','1');}")
        p2 = await ctx2.new_page(); p2.on('pageerror', lambda e: errs.append(str(e)))
        await p2.goto(NEW); await p2.wait_for_timeout(800)
        after = await p2.evaluate(SNAP)
        for k in ['name', 'grade', 'items', 'ok', 'days', 'log', 'skills', 'n', 'hist', 'badges', 'interests', 'helper']:
            ok(before[k] == after[k], f'{k}: {str(before[k])[:40]} → {str(after[k])[:40]}')
        lb = list(map(int, before['lvl'].split(','))); la = list(map(int, after['lvl'].split(',')))
        ok(all(a >= b_ for a, b_ in zip(la, lb)), 'żadna umiejętność nie spadła poziomem (' + str(sum(la)) + ' ≥ ' + str(sum(lb)) + ')')
        if tr: ok(await p2.evaluate(f"!!window.__mp.S.skills['{tr}'].mastery && !window.__mp.S.skills['{tr}'].testReady"), '„gotowe do testu” (' + tr + ') → opanowane bez testu')
        ok(await p2.evaluate("window.__mp.S.session === null"), 'przerwany test pojedynczej umiejętności usunięty (nie ma już takich testów)')
        h = await p2.inner_text('#app'); ok('Twój następny krok' in h or 'Zanim pójdziemy dalej' in h or 'Dział przećwiczony' in h, 'strona główna po migracji działa: ' + h[:80].replace('\n', ' '))
        await p2.screenshot(path='mig_home.png', full_page=True)
        await p2.reload(); await p2.wait_for_timeout(600); again = await p2.evaluate(SNAP)
        ok(again['items'] == after['items'] and again['lvl'] == after['lvl'], 'po odświeżeniu stan ten sam')
        ok(not errs, 'brak błędów JS ' + json.dumps(errs)[:300])
        await b.close()
    bad = [m for c, m in res if not c]; print('\nWYNIK: %d/%d' % (len(res) - len(bad), len(res)))
asyncio.run(main())
