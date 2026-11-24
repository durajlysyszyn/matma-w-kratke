"""Buduje stronę: src/ (+ config/firebase-config.js) -> site/index.html + site/firebase-config.js.
Uruchom:  python3 build.py   (z głównego folderu repozytorium)"""
import re, os, shutil
ROOT = os.path.dirname(os.path.abspath(__file__)); APP = os.path.join(ROOT, 'src'); SITE = os.path.join(ROOT, 'site')
html = open(os.path.join(APP, 'index.html'), encoding='utf-8').read()
def inline(h):
    h = re.sub(r'<link rel="stylesheet" href="([^"]+)">', lambda m: '<style>\n' + open(os.path.join(APP, m.group(1)), encoding='utf-8').read() + '\n</style>', h)
    return re.sub(r'<script src="([^"]+)"></script>', lambda m: '<script>\n/* ' + m.group(1) + ' */\n' + open(os.path.join(APP, m.group(1)), encoding='utf-8').read().replace('</script>', '<\\/script>') + '\n</script>', h)
srv = html.replace('<script src="storage.js"></script>', '<script src="firebase-config.js"></script>\n<script src="storage.js"></script>')
out = inline(srv.replace('<script src="firebase-config.js"></script>', '@@CFG@@')).replace('@@CFG@@', '<script src="firebase-config.js"></script>')
os.makedirs(SITE, exist_ok=True)
open(os.path.join(SITE, 'index.html'), 'w', encoding='utf-8').write(out)
shutil.copy(os.path.join(ROOT, 'config', 'firebase-config.js'), os.path.join(SITE, 'firebase-config.js'))
print('Zbudowano site/ –', len(out), 'znaków')
