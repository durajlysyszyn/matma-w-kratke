# Syntetyczny test usability: Szymon, kl. 6, słabo radzi sobie z matematyką (tablet 820x1180)
import asyncio, json, os, random, re
from playwright.async_api import async_playwright
from fbmock import MOCK
import sys
G=int(sys.argv[1]); PERS=json.loads(sys.argv[2])
OUT = f'wyniki/g{G}'; os.makedirs(OUT, exist_ok=True)
URL = 'http://localhost:8766/index.html'
CFG = "window.MWK_FIREBASE={apiKey:'x',authDomain:'x',projectId:'x'};"
random.seed(G*13)
LOG = []
ANOM = r'''(()=>{const r=[]; const root=document.querySelector('.lesson')||document.body; const t=root.innerText;
 for (const p of ['mathrm','undefined','NaN','null','[object','\\frac','\\cdot','Infinity']) if (t.includes(p)) r.push('tekst:'+p);
 if (root.querySelector('.katex-error')) r.push('katex-error: '+root.querySelector('.katex-error').textContent.slice(0,60));
 const tk=document.querySelector('.task'); if (tk && tk.scrollWidth>tk.clientWidth+4) r.push('poziomy-scroll '+tk.scrollWidth+'>'+tk.clientWidth);
 document.querySelectorAll('.task img, .task svg').forEach(e=>{const b=e.getBoundingClientRect(); if(b.right>window.innerWidth+2) r.push('obraz wychodzi poza ekran');});
 return r;})()'''
SETCORR = r'''(()=>{const U=MP.util; const correct = (it) => { const a = it.answer; if (a.kind === 'num') return (a.value.n < 0 ? '-' : '') + Math.abs(a.value.n) + (a.value.d > 1 ? '/' + a.value.d : ''); if (a.kind === 'choice') return a.correct;
    if (a.kind === 'multi') return a.values.map(v => v.n + (v.d > 1 ? '/' + v.d : '')); if (a.kind === 'fill') return a.values ? a.values.map(v => String(U.val(v))) : null;
    if (a.kind === 'order') return a.seq.slice(); if (a.kind === 'match') return Object.assign({}, a.pairs);
    if (a.kind === 'pos') return U.val(a.value); if (a.kind === 'shade') return Array.from({ length: a.value.n * a.parts / a.value.d }, (_, i) => i);
    if (a.kind === 'cut') { const k = a.dens.reduce((x, y) => U.lcm(x, y)); return { k, n: a.fr.map(f => f.n * k / f.d), s: a.res ? a.res.n * k / a.res.d : undefined }; }
    if (a.kind === 'bins') return Object.assign({}, a.bins); if (a.kind === 'point') return { x: a.x, y: a.y }; if (a.kind === 'rect') return { a: a.solA, b: a.solB };
    if (a.kind === 'cells') return Array.from({ length: a.count }, (_, i) => i); if (a.kind === 'multisel') return a.set.slice(); return null; }; const c=window.__mp.S.session.cur; const it=MP.engine.buildItem(c.spec); c.draft=correct(it); window.__mp.render(); })()'''
def log(**k): LOG.append(k); print(json.dumps(k, ensure_ascii=False)[:300])

CORRECT = r"""(()=>{const c=window.__mp.S.session.cur; const it=MP.engine.buildItem(c.spec); const a=it.answer, U=MP.util;
 let num=null; if(a.kind==='num'&&a.value){const v=a.value; num=(v.n<0?'-':'')+Math.abs(v.n)+(v.d>1?'/'+v.d:''); if(!MP.items.check(it,num).ok){const w=Math.trunc(Math.abs(v.n)/v.d), r=Math.abs(v.n)%v.d; num=(v.n<0?'-':'')+w+' '+r+'/'+v.d;}}
 let wr=[]; try{ wr=(it.wrong||[]).filter(w=>w.v&&a.value&&!U.eq(w.v,a.value)).map(w=>({v:w.v.n+(w.v.d>1?'/'+w.v.d:''),code:w.code}));}catch(e){}
 const wopt=(it.options||[]).map((o,i)=>i).filter(i=>i!==a.correct);
 return {type:it.type, kind:a.kind, skill:c.spec.skill, d:c.spec.d, grade:(MP.SK[c.spec.skill]||{}).grade, prompt:U.plain(it.prompt), theme:it.theme||null, num, corr:a.correct, wr, wopt, mode:window.__mp.S.session.mode, analog:!!c.spec.analog, hints:(it.hints||[]).map(h=>U.plain(h))};})()"""

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        async def dev(seed=None, vp=(820, 1180), scale=2):
            ctx = await b.new_context(viewport={'width': vp[0], 'height': vp[1]}, device_scale_factor=scale, has_touch=True)
            await ctx.route('**/firebase-config.js', lambda r: r.fulfill(body=CFG, content_type='text/javascript'))
            init = "if(!localStorage.getItem('__seeded')){localStorage.setItem('__seeded','1');" + ''.join("localStorage.setItem(%s,%s);" % (json.dumps(k), json.dumps(v)) for k, v in (seed or {}).items()) + "}"
            await ctx.add_init_script(init + MOCK); return await ctx.new_page()
        n = [0]
        async def shot(pg, name, full=False):
            n[0] += 1; await pg.wait_for_timeout(200); fn = f'{n[0]:02d}-{name}.png'
            await pg.screenshot(path=f'{OUT}/{fn}', full_page=full); return fn
        # --- rodzic zakłada profil (poza testem, tylko przygotowanie)
        pg = await dev((None)); await pg.goto(URL); await pg.wait_for_timeout(700)
        await pg.click('[data-auth=preg]'); await pg.fill('#pem', f'rodzic{G}@example.com'); await pg.fill('#ppw', 'kratka2026!'); await pg.fill('#ppw2', 'kratka2026!'); await pg.check('#pok')
        await pg.click('#pform [type=submit]'); await pg.wait_for_timeout(900)
        await pg.evaluate(f"window.__verifyEmail('rodzic{G}@example.com')"); await pg.click('[data-auth=pverified]'); await pg.wait_for_timeout(300)
        await pg.click('[data-act=addchildp]'); await pg.wait_for_timeout(200)
        await pg.fill('#nm', PERS['name']); await pg.click('[data-ob="1"]'); await pg.click(f'[data-grade="{G}"]'); await pg.click('[data-ob="2"]')
        await pg.click('[data-ob="3"]'); await pg.click(f"[data-helper={PERS['helper']}]"); await pg.click('[data-ob="4"]')
        for i in PERS['ints']: await pg.click(f'[data-int={i}]')
        await pg.click('[data-ob=done]'); await pg.wait_for_timeout(400)
        await pg.fill('#lem', f'kid{G}@gmail.com'); await pg.click('#linkform [type=submit]'); await pg.wait_for_timeout(800)
        sh = {k: await pg.evaluate("k=>localStorage.getItem(k)", k) for k in ['__MOCKFS', '__MOCKAUTH']}
        # --- T1: logowanie ucznia i orientacja
        ch = await dev(sh); await ch.goto(URL); await ch.wait_for_timeout(700)
        log(task='T1', screen='role', text=(await ch.inner_text('main'))[:600], shot=await shot(ch, 't1-role'))
        await ch.click('[data-auth=slog]'); await ch.wait_for_timeout(200)
        log(task='T1', screen='slogin', text=(await ch.inner_text('main'))[:600], shot=await shot(ch, 't1-student-login'))
        await ch.evaluate("localStorage.setItem('__WHO',JSON.stringify({email:'kid%d@gmail.com',uid:'S1'}))" % G); await ch.fill('#sem', f'kid{G}@gmail.com'); await ch.click('#sform [type=submit]'); await ch.wait_for_timeout(2000)
        log(task='T1', screen='home-first', text=(await ch.inner_text('main'))[:1200], shot=await shot(ch, 't1-home-first', True))
        # --- T2: test na start
        await ch.click('[data-act=placement]'); await ch.wait_for_timeout(300)
        async def solve(task, pcorr, maxsteps=40, use_hint=0.0, dontknow=0.0, shots_every=False, stop_after=None):
            k = 0
            last=None; rep=0
            while k < maxsteps:
                if stop_after and k >= stop_after: return k
                if await ch.locator('[data-act=cardnext]').count():
                    txt = await ch.inner_text('.lesson'); log(task=task, screen='card', text=txt[:500], shot=await shot(ch, f'{task.lower()}-card'))
                    await ch.click('[data-act=cardnext]'); await ch.wait_for_timeout(150); continue
                if not await ch.locator('.task').count(): return k
                info = await ch.evaluate(CORRECT); k += 1
                rep = rep + 1 if info['prompt'] == last else 0; last = info['prompt']
                if rep >= 3: log(task=task, stuck=True, skill=info['skill'], type=info['type'], shot=await shot(ch, 'stuck', True)); return k
                words = len(info['prompt'].split())
                p = pcorr(info) if callable(pcorr) else pcorr
                used_hint = 0
                if use_hint and random.random() < use_hint and await ch.locator('[data-act=hint]').count():
                    await ch.click('[data-act=hint]'); used_hint = 1; await ch.wait_for_timeout(150)
                    hs = await shot(ch, f'{task.lower()}-hint') if shots_every or k < 4 else None
                ok = random.random() < p + 0.15 * used_hint
                action = None
                if not ok and dontknow and random.random() < dontknow and await ch.locator('[data-act=dontknow]').count():
                    await ch.click('[data-act=dontknow]'); action = 'nie wiem'
                elif info['type'] in ('choice', 'why', 'error'):
                    i = info['corr'] if ok else random.choice(info['wopt'])
                    await ch.click(f'[data-opt="{i}"]'); await ch.wait_for_timeout(80); await ch.click('[data-act=checkans]'); action = 'wybór %s' % ('dobry' if ok else 'zły')
                elif info['type'] == 'input' and await ch.locator('#inp').count():
                    v = info['num'] if ok else (info['wr'][0]['v'] if info['wr'] else '12')
                    await ch.fill('#inp', v or '0'); await ch.click('[data-act=checkans]'); action = 'wpisał %s' % v
                else:
                    # interakcja: dziecko najpierw klika Sprawdź bez działania
                    if await ch.locator('[data-act=checkans]').count():
                        await ch.click('[data-act=checkans]'); await ch.wait_for_timeout(150)
                        fbt = (await ch.inner_text('.task'))[-300:]
                        log(task=task, screen='ix-empty-check', type=info['type'], text=fbt, shot=await shot(ch, f'{task.lower()}-ix-{info["type"]}'))
                    if await ch.locator('[data-act=dontknow]').count(): await ch.click('[data-act=dontknow]'); action = 'nie wiem (interakcja)'
                    else:
                        if not ok:
                            while await ch.locator('[data-act=hint]').count(): await ch.click('[data-act=hint]'); await ch.wait_for_timeout(80)
                            if await ch.locator('[data-act=showsol]').count(): await ch.click('[data-act=showsol]'); await ch.wait_for_timeout(100)
                            log(task=task, screen='ix-stuck', type=info['type'], buttons=await ch.locator('.task .bar2 button').all_inner_texts(), shot=await shot(ch, f'{task.lower()}-stuck-{info["type"]}', True))
                        await ch.evaluate(SETCORR); await ch.wait_for_timeout(100); await ch.click('[data-act=checkans]')
                        action = 'interakcja: ' + ('zrobił sam' if ok else 'przepisał z rozwiązania')
                await ch.wait_for_timeout(200)
                an = await ch.evaluate(ANOM)
                if an: log(task=task, anomaly=an, skill=info['skill'], type=info['type'], prompt=info['prompt'][:200], shot=await shot(ch, f'anom-{info["skill"]}', True))
                fb = await ch.inner_text('.fb') if await ch.locator('.fb').count() else ''
                sname = None
                if shots_every or (not ok and k < 8) or info['analog']: sname = await shot(ch, f'{task.lower()}-{k:02d}-{info["type"]}-{"ok" if ok else "zle"}', True)
                log(task=task, step=k, mode=info['mode'], skill=info['skill'], grade=info['grade'], d=info['d'], type=info['type'], theme=info['theme'], words=words, prompt=info['prompt'][:160], hint=used_hint, ok=ok, action=action, analog=info['analog'], fb=fb[:400], shot=sname)
                # druga próba, jeśli jest
                if await ch.locator('[data-act=checkans]').count() and not await ch.locator('[data-act=next]').count():
                    if info['type'] in ('choice', 'why', 'error'):
                        await ch.click(f'[data-opt="{info["corr"]}"]'); await ch.click('[data-act=checkans]')
                    elif await ch.locator('#inp').count(): await ch.fill('#inp', info['num'] or '0'); await ch.click('[data-act=checkans]')
                    await ch.wait_for_timeout(150); log(task=task, step=k, second_try=True, fb=(await ch.inner_text('.fb'))[:300] if await ch.locator('.fb').count() else '')
                if await ch.locator('[data-act=next]').count(): await ch.click('[data-act=next]'); await ch.wait_for_timeout(200)
                elif await ch.locator('[data-act=showsol]').count(): await ch.click('[data-act=showsol]'); await ch.wait_for_timeout(100); await ch.click('[data-act=next]') if await ch.locator('[data-act=next]').count() else None
            return k
        pl = lambda i: 0.8 if (i['grade'] or G) <= G - 2 else 0.5 if (i['grade'] or G) == G - 1 else 0.3
        await solve('T2', pl, dontknow=0.5)
        log(task='T2', screen='placement-summary', text=(await ch.inner_text('main'))[:1500], shot=await shot(ch, 't2-summary', True))
        log(task='T2', summary_buttons=await ch.locator('main button').all_inner_texts())
        await ch.click('[data-act=rec] >> nth=0'); await ch.wait_for_timeout(300)
        k = await solve('T3', lambda i: 0.5, use_hint=0.5, stop_after=6)
        # --- T4: przerwa w połowie i powrót
        await ch.click('[data-act=pause]'); await ch.wait_for_timeout(200)
        log(task='T4', screen='pause', text=(await ch.inner_text('.lesson'))[:500], shot=await shot(ch, 't4-pause'))
        await ch.click('[data-act=pauselater]'); await ch.wait_for_timeout(300)
        log(task='T4', screen='home-resume', text=(await ch.inner_text('main'))[:700], shot=await shot(ch, 't4-home-resume'))
        res = ch.locator('main button:has-text("Kontynuuj")')
        log(task='T4', found_continue=await res.count())
        if await res.count(): await res.first.click(); await ch.wait_for_timeout(300)
        await solve('T3b', lambda i: 0.5, use_hint=0.5)
        log(task='T3', screen='lesson-summary', text=(await ch.inner_text('main'))[:1500], shot=await shot(ch, 't3-summary', True))
        # --- T5: przygotowanie do sprawdzianu z ułamków
        await ch.click('header nav [data-go=sprawdzian]') if await ch.locator('header nav [data-go=sprawdzian]').count() else await ch.click('header nav >> text=Sprawdzian')
        await ch.wait_for_timeout(300)
        log(task='T5', screen='prep', text=(await ch.inner_text('main'))[:2000], shot=await shot(ch, 't5-prep', True))
        try:
            await ch.locator('main details summary').nth(1).click(); await ch.wait_for_timeout(150)
            cb = ch.locator('main details[open] input[type=checkbox]')
            log(task='T5', n_details=await ch.locator('main details').count(), n_checkbox_after_open=await cb.count())
            await cb.first.check(); await ch.click('[data-act=prepcheck]') if await ch.locator('[data-act=prepcheck]').count() else None
            btn = ch.locator('main button:has-text("Zaczynamy")'); await btn.first.click(); await ch.wait_for_timeout(300)
            log(task='T5', screen='prep-after-start', text=(await ch.inner_text('main'))[:900], shot=await shot(ch, 't5-prep-start', True))
            for sel in ['[data-act=prepdiag]', 'main button:has-text("test")']:
                if await ch.locator(sel).count(): await ch.locator(sel).first.click(); await ch.wait_for_timeout(300); break
            await solve('T5d', pl, dontknow=0.5, maxsteps=20)
            log(task='T5', screen='prep-plan', text=(await ch.inner_text('main'))[:1500], shot=await shot(ch, 't5-plan', True))
        except Exception as e: log(task='T5', error=str(e)[:300], shot=await shot(ch, 't5-error', True))
        # --- T6: zmiana pomocnika
        await ch.click('header nav >> text=Ustawienia'); await ch.wait_for_timeout(300)
        log(task='T6', screen='settings', text=(await ch.inner_text('main'))[:2000], shot=await shot(ch, 't6-settings', True))
        # --- T7: jak mi idzie?
        await ch.click('header nav >> text=Start'); await ch.wait_for_timeout(300)
        log(task='T7', screen='home-end', text=(await ch.inner_text('main'))[:2500], shot=await shot(ch, 't7-home-end', True))
        json.dump(LOG, open(f'{OUT}/log.json', 'w'), ensure_ascii=False, indent=1)
        await b.close()
asyncio.run(main())
