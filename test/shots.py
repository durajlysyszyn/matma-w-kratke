# Zrzuty ekranu do case study (dane przykładowe, symulowane silnikiem aplikacji)
import asyncio, json, os
from playwright.async_api import async_playwright
from fbmock import MOCK
OUT = 'wyniki/zrzuty'; os.makedirs(OUT, exist_ok=True)
URL = 'http://localhost:8766/index.html'
CFG = "window.MWK_FIREBASE={apiKey:'x',authDomain:'x',projectId:'x'};"

SIM = r"""
window.__sim = function (P) {
  const S = window.__mp.S, E = MP.engine, I = MP.items, U = MP.util, g = S.profile.grade;
  const correct = (it) => { const a = it.answer; if (a.kind === 'num') return (a.value.n < 0 ? '-' : '') + Math.abs(a.value.n) + (a.value.d > 1 ? '/' + a.value.d : ''); if (a.kind === 'choice') return a.correct;
    if (a.kind === 'multi') return a.values.map(v => v.n + (v.d > 1 ? '/' + v.d : '')); if (a.kind === 'fill') return a.values ? a.values.map(v => String(U.val(v))) : null;
    if (a.kind === 'order') return a.seq.slice(); if (a.kind === 'match') return Object.assign({}, a.pairs);
    if (a.kind === 'pos') return U.val(a.value); if (a.kind === 'shade') return Array.from({ length: a.value.n * a.parts / a.value.d }, (_, i) => i);
    if (a.kind === 'cut') { const k = a.dens.reduce((x, y) => U.lcm(x, y)); return { k, n: a.fr.map(f => f.n * k / f.d), s: a.res ? a.res.n * k / a.res.d : undefined }; }
    if (a.kind === 'bins') return Object.assign({}, a.bins); if (a.kind === 'point') return { x: a.x, y: a.y }; if (a.kind === 'rect') return { a: a.solA, b: a.solB };
    if (a.kind === 'cells') return Array.from({ length: a.count }, (_, i) => i); if (a.kind === 'multisel') return a.set.slice(); return null; };
  const wrong = (it, code) => { const a = it.answer;
    if (a.kind === 'num') { const w = (it.wrong || []).find(w => (!code || w.code === code) && w.v && !U.eq(w.v, a.value)) || (it.wrong || []).find(w => w.v && !U.eq(w.v, a.value)); return w ? w.v.n + (w.v.d > 1 ? '/' + w.v.d : '') : '977'; }
    if (a.kind === 'choice') { const i = (it.options || []).findIndex((o, j) => j !== a.correct && (!code || o.code === code)); return i >= 0 ? i : (a.correct + 1) % it.options.length; }
    return null; };
  const DAY = E.DAY; let t0 = Date.now() - P.days * DAY;
  for (let d = 0; d < P.days; d++) {
    if (P.skip.includes(d)) continue;
    let t = t0 + d * DAY + (16 + Math.random()) * 3600e3;
    for (let k = 0; k < P.per; k++) {
      const rec = E.recommend(S, t); let opts = null;
      if (rec.kind === 'learn') opts = { mode: 'learn', skill: rec.skill }; else if (rec.kind === 'review') opts = { mode: 'review', skills: rec.skills };
      else if (rec.kind === 'mastery') opts = { mode: 'mastery', skill: rec.skill }; else if (rec.kind === 'repair') opts = { mode: 'repair', skill: rec.skill }; else break;
      if (S.session) E.endSession(S, t);
      E.startSession(S, opts, t); let steps = 0;
      while (steps++ < 60) {
        const st = E.nextStep(S, t); if (!st) break; if (st.kind === 'card') continue;
        const it = E.buildItem(st); const pr = P.p[st.skill] != null ? P.p[st.skill] : P.base;
        const fixedMode = S.session.mode === 'mastery';
        let ok = Math.random() < (fixedMode ? Math.min(1, pr + 0.15) : pr); let resp = ok ? correct(it) : wrong(it, P.code[st.skill]); if (resp === null) resp = correct(it);
        let res = I.check(it, resp);
        if (ok && !res.ok && it.answer.kind === 'num') { const v = it.answer.value, w = Math.trunc(Math.abs(v.n) / v.d), r = Math.abs(v.n) % v.d; resp = (v.n < 0 ? '-' : '') + w + ' ' + r + '/' + v.d; res = I.check(it, resp); }
        const sp = (P.speed[st.skill] || 1) * (0.75 + Math.random() * 0.5); const sec = Math.round(E.expectedSec(it.type, st.d, g) * sp);
        const r = E.record(S, { skill: st.skill, d: st.d, type: it.type, hints: Math.random() < 0.1 ? 1 : 0, attempt: 1, sec, mode: S.session.mode, id: st.skill + '#' + st.type + '#' + st.seed, aspect: it.aspect }, res, t);
        E.afterAnswer(S, st, r, t); t += (sec + 6) * 1000;
      }
      const mode = S.session.mode; const sum = E.endSession(S, t);
      if (mode === 'mastery') E.masteryResult(S, sum.results, t); if (mode === 'repair') E.repairResult(S, sum.results, t);
      t += 60000;
    }
  }
  S.welcomed = true; MP.store.save(S, window.__mp.CID); window.__mp.render();
};
"""

async def onboard(pg, name, grade, ints, helper, av=(0, 0)):
    await pg.fill('#nm', name); await pg.click('[data-ob="1"]'); await pg.click(f'[data-grade="{grade}"]'); await pg.click('[data-ob="2"]')
    for _ in range(av[0]): await pg.click('[data-avk=hair][data-avd="1"]')
    for _ in range(av[1]): await pg.click('[data-avk=top][data-avd="1"]') if await pg.locator('[data-avk=top][data-avd="1"]').count() else None
    await pg.click('[data-ob="3"]'); await pg.click(f'[data-helper={helper}]'); await pg.click('[data-ob="4"]')
    for i in ints: await pg.click(f'[data-int={i}]')
    await pg.click('[data-ob=done]'); await pg.wait_for_timeout(300)

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        async def dev(seed=None, vp=(1280, 820), scale=2):
            ctx = await b.new_context(viewport={'width': vp[0], 'height': vp[1]}, device_scale_factor=scale)
            await ctx.route('**/firebase-config.js', lambda r: r.fulfill(body=CFG, content_type='text/javascript'))
            init = "if(!localStorage.getItem('__seeded')){localStorage.setItem('__seeded','1');" + ''.join("localStorage.setItem(%s,%s);" % (json.dumps(k), json.dumps(v)) for k, v in (seed or {}).items()) + "}"
            await ctx.add_init_script(init + MOCK + SIM); return await ctx.new_page()
        async def shot(pg, name, full=False, el=None):
            await pg.wait_for_timeout(250)
            await pg.evaluate("""(()=>{document.querySelectorAll('.toast,#toast').forEach(e=>e.style.display='none'); if(!document.getElementById('__cs')){const st=document.createElement('style'); st.id='__cs'; st.textContent='header.top{position:relative!important}'; document.head.appendChild(st);}
              const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT); let n; while((n=w.nextNode())){ if(n.nodeValue.includes('localhost:8766')) n.nodeValue=n.nodeValue.replace(/localhost:8766/g,'matma-w-kratke.netlify.app'); }})()""")
            if el: await pg.locator(el).first.screenshot(path=f'{OUT}/{name}.png')
            else: await pg.screenshot(path=f'{OUT}/{name}.png', full_page=full)
            print('  ', name)
        # ---- rodzic: wejście, rejestracja
        pg = await dev(); await pg.goto(URL); await pg.wait_for_timeout(700)
        await shot(pg, '01-role-select')
        await pg.click('[data-auth=preg]'); await pg.fill('#pem', 'anna.nowak@example.com'); await pg.fill('#ppw', 'kratka2026!'); await pg.fill('#ppw2', 'kratka2026!'); await pg.check('#pok')
        await shot(pg, '02-parent-register', full=True)
        await pg.click('#pform [type=submit]'); await pg.wait_for_timeout(900)
        await pg.evaluate("window.__verifyEmail('anna.nowak@example.com')"); await pg.click('[data-auth=pverified]'); await pg.wait_for_timeout(300)
        await shot(pg, '03-parent-onboarding', full=True)
        # ---- dziecko 1: Kuba, kl. 6 (onboarding na zrzutach)
        await pg.click('[data-act=addchildp]'); await pg.wait_for_timeout(200)
        await pg.fill('#nm', 'Kuba'); await pg.click('[data-ob="1"]'); await pg.click('[data-grade="6"]'); await shot(pg, '04-onboarding-grade', full=True)
        await pg.click('[data-ob="2"]'); await pg.click('[data-avk=hair][data-avd="1"]'); await pg.click('[data-avk=hair][data-avd="1"]'); await shot(pg, '05-onboarding-avatar', full=True)
        await pg.click('[data-ob="3"]'); await pg.click('[data-helper=bernenczyk]'); await shot(pg, '06-onboarding-helper', full=True)
        await pg.click('[data-ob="4"]')
        for i in ['literatura', 'pilka', 'kosmos', 'gry']:
            if await pg.locator(f'[data-int={i}]').count(): await pg.click(f'[data-int={i}]')
        await shot(pg, '07-onboarding-interests', full=True)
        await pg.click('[data-ob=done]'); await pg.wait_for_timeout(400)
        await pg.fill('#lem', 'kuba.nowak@gmail.com'); await pg.click('#linkform [type=submit]'); await pg.wait_for_timeout(600)
        await shot(pg, '08-child-linked', full=True)
        await pg.click('[data-auth=topanel]'); await pg.wait_for_timeout(300)
        # ---- dziecko 2: Ola, kl. 3
        await pg.click('.kidadd'); await pg.wait_for_timeout(200); await onboard(pg, 'Ola', 3, ['swinki', 'konie', 'taniec'], 'swinka', (3, 0))
        await pg.click('[data-auth=plinkskip]'); await pg.wait_for_timeout(300)
        ids = await pg.evaluate("window.__mp.IDX.profiles.map(p=>[p.name,p.id])"); ids = dict(ids)
        # ---- symulacja nauki
        await pg.evaluate("id=>window.__mp.activate(id,true)", ids['Kuba'])
        await pg.evaluate("""(()=>{const S=window.__mp.S,E=MP.engine,t=Date.now()-15*E.DAY; MP.SKILL_ORDER.slice(0,14).forEach(id=>{const s=E.sk(S,id); s.placedOk=true; s.lvl=4; s.maxLvl=4; s.mastery={at:t,legacy:true}; s.l4At=t; s.n=6; s.next=t+40*E.DAY; s.hist=[1,2,3,3,2].map(d=>({t,d,ok:true,h:0,ty:'input'}));}); S.placement={done:true,at:t};})()""")
        await pg.evaluate("""window.__sim({days:14, per:3, skip:[3,9], base:0.92, p:{fr_add_diff:0.5, fr_mixed:0.86, fr_common:0.8, fr_add_mixed:0.7}, code:{fr_add_diff:'frac_add_both', fr_common:'lcm_product'}, speed:{fr_part:1.1, fr_expand:1.9, fr_simplify:2.0, fr_common:1.9, fr_add_same:1.7, fr_add_diff:2.2, fr_compare:1.6, fr_line:0.9}})""")
        await pg.evaluate("id=>window.__mp.activate(id,true)", ids['Ola'])
        await pg.evaluate("""window.__sim({days:12, per:2, skip:[2,6,7], base:0.86, p:{k3_clock:0.55}, code:{}, speed:{k3_clock:1.9, k3_word:1.3}})""")
        await pg.wait_for_timeout(2500)
        await pg.evaluate("window.__mp.go('dzieci')"); await pg.wait_for_timeout(400)
        await shot(pg, '09-parent-children', full=True)
        await pg.click(f'[data-pkid="{ids["Kuba"]}"]'); await pg.wait_for_timeout(500)
        await shot(pg, '10-parent-progress')
        for nm, h2 in [('10b-parent-recommendations', 'Co system rekomenduje'), ('10c-parent-understanding', 'Co rozumie'), ('10d-parent-errors', 'błęd'), ('10e-parent-skills', 'Umiejętności')]:
            try: await shot(pg, nm, el=f'section:has(h2:has-text("{h2}"))')
            except Exception as e: print('  brak', nm)
        await shot(pg, '11-parent-pace', el='section:has(h2:has-text("Tempo pracy"))')
        try:
            await pg.click('.pdz:has-text("Działania na ułamkach") summary'); await shot(pg, '11b-parent-pace-expanded', el='section:has(h2:has-text("Tempo pracy"))')
        except Exception as e: print('pace expand', e)
        await pg.click('header nav [data-go=pustaw]'); await pg.wait_for_timeout(200); await shot(pg, '12-parent-settings-general', full=True)
        await pg.click(f'.sside [data-pset="{ids["Kuba"]}"]'); await pg.wait_for_timeout(300); await shot(pg, '13-parent-settings-child')
        await pg.wait_for_timeout(2000)
        sh = {k: await pg.evaluate("k=>localStorage.getItem(k)", k) for k in ['__MOCKFS', '__MOCKAUTH']}
        # ---- uczeń: logowanie i nauka (Kuba, własne konto)
        ch = await dev(sh); await ch.goto(URL); await ch.wait_for_timeout(700)
        await ch.click('[data-auth=slog]'); await ch.fill('#sem', 'kuba.nowak@gmail.com'); await shot(ch, '14-student-login')
        await ch.evaluate("localStorage.setItem('__WHO',JSON.stringify({email:'kuba.nowak@gmail.com',uid:'K1'}))"); await ch.click('#sform [type=submit]'); await ch.wait_for_timeout(2000)
        # przerwana lekcja do pokazania paska
        await ch.evaluate("""(()=>{const S=window.__mp.S,E=MP.engine,I=MP.items; E.startSession(S,{mode:'learn',skill:'fr_add_mixed'},Date.now()); let n=0; while(n<4){const st=E.nextStep(S,Date.now()); if(!st)break; if(st.kind==='card')continue; const it=E.buildItem(st); const a=it.answer; const resp=a.kind==='num'?(a.value.n+(a.value.d>1?'/'+a.value.d:'')):a.kind==='choice'?a.correct:null; const r=E.record(S,{skill:st.skill,d:st.d,type:it.type,hints:0,attempt:1,sec:40,mode:'learn',id:'x'+n},I.check(it,resp),Date.now()); E.afterAnswer(S,st,r,Date.now()); n++;} MP.store.save(S,window.__mp.CID); window.__mp.go('start');})()""")
        await ch.wait_for_timeout(400); await shot(ch, '15-student-home'); await shot(ch, '15b-student-home-full', full=True)
        await ch.click('.map.big .dn >> nth=3'); await ch.wait_for_timeout(300); await shot(ch, '16-student-chapter')
        # lekcja: zadanie z treścią (literatura), wskazówka, dobra odpowiedź
        async def force(skill, d, ty, theme=None, seed=None):
            js = "([sk,d,ty,th,seed])=>{const S=window.__mp.S,E=MP.engine; if(S.session) E.endSession(S,Date.now()); E.startSession(S,{mode:'learn',skill:sk},Date.now()); const s=S.session; s.queue=[]; const sp=E.makeSpec(sk,d,ty); if(th) sp.th=th; if(seed) sp.seed=seed; s.cur={spec:sp,attempts:0,hints:0,solShown:false,t0:Date.now(),tl:Date.now(),resp:null,fb:null}; window.__mp.go('lesson',{from:'start'});}"
            await ch.evaluate(js, [skill, d, ty, theme, seed]); await ch.wait_for_timeout(300)
            return await ch.evaluate("MP.engine.buildItem(window.__mp.S.session.cur.spec)")
        # znajdź zadanie z treścią z motywem literatury
        seed = await ch.evaluate("""(()=>{for(let s=1;s<5000;s++){const it=MP.engine.buildItem({kind:'item',skill:'fr_word',d:2,type:'input',th:'literatura',seed:s}); if(/Obozie|Klan|rezerwat/.test(MP.util.plain(it.prompt))) return s;} return 1;})()""") if await ch.evaluate("!!MP.SK.fr_word") else None
        it = await force('fr_add_same', 3, 'input', 'literatura', 1)
        await ch.click('[data-act=hint]'); await ch.wait_for_timeout(200); await shot(ch, '17-lesson-word-problem-hint', full=True)
        a = it['answer']
        if a['kind'] == 'num':
            v = a['value']; await ch.fill('#inp', ('-' if v['n'] < 0 else '') + str(abs(v['n'])) + ('/' + str(v['d']) if v['d'] > 1 else ''))
        await ch.click('[data-act=checkans]'); await ch.wait_for_timeout(300); await shot(ch, '18-lesson-correct', full=True)
        await force('data_read', 2, 'input', 'literatura', 1); await shot(ch, '18b-word-problem-chart', full=True)
        for th in ['swinki', 'pilka', 'literatura', 'konie']:
            await force('fr_part', 3, 'input', th, 1); await shot(ch, '18c-personalized-' + th, el='.task')
        # wybór: zaznaczenie + potwierdzenie
        it = await force('fr_add_same', 2, 'choice', 'kosmos')
        await ch.click(f'[data-opt="{(it["answer"]["correct"] + 1) % len(it["options"])}"]'); await shot(ch, '19-lesson-select-confirm', full=True)
        # błąd: 3/4 + 1/2
        sd = await ch.evaluate("""(()=>{for(let s=1;s<200000;s++){const it=MP.engine.buildItem({kind:'item',skill:'fr_add_diff',d:1,type:'input',th:'pilka',seed:s}); if(MP.util.plain(it.prompt).includes('3/4 + 1/2')) return s;} return 1;})()""")
        await ch.evaluate("""(()=>{const s=window.__mp.S; s.skills.fr_add_diff=s.skills.fr_add_diff||{}; })()""")
        it = await force('fr_add_diff', 1, 'input', 'pilka', sd)
        # drugi raz ten sam błąd w sesji, żeby pokazać rysunek
        await ch.evaluate("(()=>{const s=window.__mp.S.session; s.errItems={frac_add_both:['a','b']}; s.errSeen=s.errSeen||{};})()")
        await ch.fill('#inp', '4/6'); await ch.click('[data-act=checkans]'); await ch.wait_for_timeout(300); await shot(ch, '20-lesson-wrong-explained', full=True)
        await ch.click('[data-act=next]'); await ch.wait_for_timeout(300); await shot(ch, '21-lesson-analog-task', full=True)
        # interaktywne
        it = await force('fr_add_diff', 1, 'cutbars')
        L = it['answer']['dens'][0] * it['answer']['dens'][1]
        import math; L = L // math.gcd(*it['answer']['dens'])
        for _ in range(L - 1): await ch.click('[data-cutk="1"]')
        for i, f in enumerate(it['answer']['fr']): await ch.fill(f'[data-cutn="{i}"]', str(f['n'] * L // f['d']))
        await shot(ch, '22-interactive-fraction-bars', full=True)
        it = await force('fr_line', 2, 'nline'); v = it['answer']['value']; k = round(v['n'] / v['d'] / it['axis']['step'])
        await ch.focus('.nlsvg')
        for _ in range(k): await ch.keyboard.press('ArrowRight')
        await ch.click('[data-act=checkans]'); await ch.wait_for_timeout(200); await shot(ch, '23-interactive-number-line', full=True)
        it = await force('fr_mixed', 1, 'bins'); bins = it['answer']['bins']
        for i, bn in enumerate(bins[:4]): await ch.click(f'.pool [data-drag="{i}"]'); await ch.click(f'.bin[data-drop="{bn}"] > b')
        await shot(ch, '24-interactive-sorting', full=True)
        it = await force('sym_line', 2, 'point'); a = it['answer']
        await ch.focus('.ptsvg')
        for _ in range(abs(a['x'])): await ch.keyboard.press('ArrowRight' if a['x'] > 0 else 'ArrowLeft')
        for _ in range(abs(a['y'])): await ch.keyboard.press('ArrowUp' if a['y'] > 0 else 'ArrowDown')
        await ch.click('[data-act=checkans]'); await ch.wait_for_timeout(200)
        await shot(ch, '25-interactive-coordinates', full=True)
        it = await force('fr_add_diff', 2, 'order', None, 7)
        for kidx in it['answer']['seq'][:2]: await ch.click(f'.pool [data-drag="{kidx}"]')
        await shot(ch, '26-interactive-step-order', full=True)
        # test opanowania
        await ch.evaluate("(()=>{const S=window.__mp.S,E=MP.engine; if(S.session) E.endSession(S,Date.now()); E.startSession(S,{mode:'mastery',skill:'fr_add_same'},Date.now()); window.__mp.go('lesson',{from:'start'});})()"); await ch.wait_for_timeout(300)
        await ch.evaluate("(()=>{const s=window.__mp.S.session; if(!s.cur){} })()")
        # pokazujemy kartę wprowadzającą testu
        await shot(ch, '27-mastery-test-intro', full=True)
        # ustawienia ucznia
        await ch.evaluate("(()=>{const S=window.__mp.S; if(S.session) MP.engine.endSession(S,Date.now()); window.__mp.go('profil');})()"); await ch.wait_for_timeout(300)
        await shot(ch, '28-student-settings')
        await ch.evaluate("window.__mp.go('sprawdzian')"); await ch.wait_for_timeout(300); await shot(ch, '29-test-prep')
        # telefon
        mb = await dev(sh, (390, 844), 3); await mb.goto(URL); await mb.wait_for_timeout(700)
        await shot(mb, '30-mobile-role-select')
        await mb.click('[data-auth=slog]'); await mb.evaluate("localStorage.setItem('__WHO',JSON.stringify({email:'kuba.nowak@gmail.com',uid:'K1'}))"); await mb.fill('#sem', 'kuba.nowak@gmail.com'); await mb.click('#sform [type=submit]'); await mb.wait_for_timeout(2000)
        await shot(mb, '31-mobile-home')
        await mb.evaluate("""([sk,d,ty])=>{const S=window.__mp.S,E=MP.engine; if(S.session) E.endSession(S,Date.now()); E.startSession(S,{mode:'learn',skill:sk},Date.now()); const s=S.session; s.queue=[]; s.cur={spec:E.makeSpec(sk,d,ty),attempts:0,hints:0,solShown:false,t0:Date.now(),tl:Date.now(),resp:null,fb:null}; window.__mp.go('lesson',{from:'start'});}""", ['fr_add_same', 2, 'choice']); await mb.wait_for_timeout(300)
        c = await mb.evaluate("MP.engine.buildItem(window.__mp.S.session.cur.spec).answer.correct"); await mb.click(f'[data-opt="{c}"]'); await mb.click('[data-act=checkans]'); await mb.wait_for_timeout(300)
        await shot(mb, '32-mobile-lesson-correct', full=True)
        await b.close()
asyncio.run(main())
