import json,statistics as st
for g in range(1,9):
    L=json.load(open(f'wyniki/g{g}/log.json'))
    steps=[l for l in L if 'step' in l and not l.get('second_try')]
    pl=[l for l in steps if l['task']=='T2']; le=[l for l in steps if l['task'] in('T3','T3b')]; dg=[l for l in steps if l['task']=='T5d']
    def scr(n): return next((l for l in L if l.get('screen')==n),{})
    print(f"\n######## KLASA {g}")
    print('placement', len(pl), 'ok', sum(l['ok'] for l in pl), 'dontknow', sum((l['action'] or '').startswith('nie wiem') for l in pl), 'types', sorted(set(l['type'] for l in pl)))
    print('placement words med', st.median([l['words'] for l in pl]) if pl else None, 'max', max([l['words'] for l in pl]) if pl else None)
    print('lesson', len(le), 'ok', sum(l['ok'] for l in le), 'analog', sum(l['analog'] for l in le), 'skills', sorted(set(l['skill'] for l in le)), 'types', sorted(set(l['type'] for l in le)), 'themes', sorted(set(str(l['theme']) for l in le)))
    print('lesson words med', st.median([l['words'] for l in le]) if le else None, 'max', max([l['words'] for l in le]) if le else None)
    print('cards', sum(1 for l in L if l.get('screen')=='card'), 'ix-empty', sum(1 for l in L if l.get('screen')=='ix-empty-check'), 'ix-stuck', sum(1 for l in L if l.get('screen')=='ix-stuck'))
    print('diag', len(dg), 'ok', sum(l['ok'] for l in dg))
    for n in ['placement-summary','lesson-summary','home-end','prep-after-start','prep-plan']:
        t=scr(n).get('text','')
        print('--',n,':',t[:380].replace('\n',' | '))
    for l in L:
        if l.get('error') or l.get('anomaly'): print('!!', l)
    fbs=[len(l['fb'].split()) for l in le if not l['ok'] and l.get('fb')]
    print('wrong-fb words med', st.median(fbs) if fbs else None)
