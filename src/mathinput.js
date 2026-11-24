/* mathinput.js — pole odpowiedzi z prawdziwym ułamkiem piętrowym i klawiaturą matematyczną.
   Tryby: liczba (całkowita / dziesiętna z przecinkiem) albo ułamek (opcjonalne całości + licznik nad mianownikiem).
   Wynik zawsze jest zamieniany na tekst zrozumiały dla MP.util.parseNum, np. "−1 3/4" albo "0,25". */
var MP = window.MP;
(function (MP) {
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  // rozbiór zapisanej odpowiedzi na części pola
  function split(v) {
    const s = String(v || '').trim().replace(/−/g, '-');
    let m = s.match(/^(-?)(\d+) (\d*)\/(\d*)$/); if (m) return { neg: !!m[1], mode: 'frac', mixed: true, w: m[2], n: m[3], d: m[4], x: '' };
    m = s.match(/^(-?)(\d*)\/(\d*)$/); if (m) return { neg: !!m[1], mode: 'frac', mixed: false, w: '', n: m[2], d: m[3], x: '' };
    m = s.match(/^(-?)(.*)$/); return { neg: !!m[1], mode: 'num', mixed: false, w: '', n: '', d: '', x: m[2] };
  }
  function compose(p) {
    const sg = p.neg ? '-' : '';
    if (p.mode === 'frac') { if (!p.n && !p.d && !p.w) return ''; return sg + (p.mixed && p.w ? p.w + ' ' : '') + (p.n || '') + '/' + (p.d || ''); }
    return p.x ? sg + p.x : (p.neg ? '-' : '');
  }
  const coarse = () => window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
  function render(val, o) {
    o = o || {}; const p = split(val); const dis = o.disabled ? ' disabled' : ''; const im = coarse() ? 'none' : 'decimal';
    const state = o.state ? ' ' + o.state : '';
    const keys = Object.assign({ frac: true, mixed: true, comma: true, neg: true }, o.keys || {});
    let h = '<div class="mf' + state + (o.narrow ? ' narrow' : '') + '" data-mode="' + p.mode + '" data-mixed="' + (p.mixed ? 1 : 0) + '" data-neg="' + (p.neg ? 1 : 0) + '">';
    h += '<label class="small muted" for="inp">' + esc(o.label || 'Twoja odpowiedź') + (o.unit ? ' (' + esc(o.unit) + ')' : '') + '</label>';
    h += '<div class="mfbox" role="group" aria-label="pole odpowiedzi">';
    h += '<span class="mfsg" aria-hidden="true">' + (p.neg ? '−' : '') + '</span>';
    h += '<input id="inp" class="mfx" autocomplete="off" inputmode="' + im + '" enterkeyhint="done" aria-label="liczba" value="' + esc(p.x) + '"' + dis + ' placeholder="' + esc(o.placeholder || 'wpisz wynik') + '">';
    h += '<input id="mfw" class="mfw" autocomplete="off" inputmode="' + im + '" aria-label="całości" value="' + esc(p.w) + '"' + dis + ' placeholder="▫">';
    h += '<span class="mffr"><input id="mfn" autocomplete="off" inputmode="' + im + '" aria-label="licznik" value="' + esc(p.n) + '"' + dis + ' placeholder="▫"><i class="mfbar"></i><input id="mfd" autocomplete="off" inputmode="' + im + '" aria-label="mianownik" value="' + esc(p.d) + '"' + dis + ' placeholder="▫"></span>';
    h += '<span class="mfok" aria-hidden="true">✓</span></div>';
    if (!o.disabled) {
      // klawisze niepotrzebne w tym zadaniu (np. ułamki w klasie 1) – ukryte, ale miejsce zostaje, żeby układ się nie przesuwał
      const off = { frac: !keys.frac, mixed: !keys.mixed, ',': !keys.comma, neg: !keys.neg, next: !keys.frac };
      const K = (k, lbl, cls, aria) => off[k] ? '<span class="kh" aria-hidden="true"></span>' : '<button type="button" class="' + (cls || '') + '" data-mk="' + k + '" aria-label="' + esc(aria || lbl) + '">' + lbl + '</button>';
      const D = (arr) => arr.map(d => K(d, d)).join('');
      if (!keys.frac && !keys.comma && !keys.neg) { // same cyfry – prosta klawiatura (klasy 1–3)
        h += '<div class="kpad slim" aria-label="klawiatura">' + D(['7', '8', '9']) + K('bs', '⌫', 'fn', 'cofnij znak') + D(['4', '5', '6']) + K('clr', 'C', 'fn', 'wyczyść') + D(['1', '2', '3']) + '<span class="kh"></span>' + K('0', '0', 'w3') + '</div>';
        return h + '<div class="preview" id="pv" aria-live="polite"></div></div>';
      }
      h += '<div class="kpad" aria-label="klawiatura matematyczna">' + D(['7', '8', '9']) + K('frac', '<span class="kfr"><i>a</i><i>b</i></span>', 'fn', 'ułamek – licznik nad mianownikiem') + K('bs', '⌫', 'fn', 'cofnij znak') +
        D(['4', '5', '6']) + K('mixed', '<span class="kmx">1<span class="kfr"><i>a</i><i>b</i></span></span>', 'fn', 'liczba mieszana – całości i ułamek') + K('clr', 'C', 'fn', 'wyczyść') +
        D(['1', '2', '3']) + K(',', ',', 'fn', 'przecinek dziesiętny') + K('neg', '±', 'fn', 'zmień znak (liczba ujemna)') +
        K('0', '0', 'w4') + K('next', '⇥', 'fn', 'następne pole (licznik / mianownik)') + '</div>';
    }
    return h + '<div class="preview" id="pv" aria-live="polite"></div></div>';
  }
  function read(root) {
    const box = root.querySelector('.mf'); if (!box) return '';
    const g = (id) => (root.querySelector('#' + id) || {}).value || '';
    return compose({ neg: box.dataset.neg === '1', mode: box.dataset.mode, mixed: box.dataset.mixed === '1', w: g('mfw').replace(/\D/g, ''), n: g('mfn').replace(/\D/g, ''), d: g('mfd').replace(/\D/g, ''), x: g('inp').replace(/\s+/g, ' ').trim() });
  }
  // podłączenie zachowania; onChange(text), onEnter()
  function bind(root, onChange, onEnter, preview) {
    const box = root.querySelector('.mf'); if (!box) return;
    const F = { x: root.querySelector('#inp'), w: root.querySelector('#mfw'), n: root.querySelector('#mfn'), d: root.querySelector('#mfd') };
    let last = box.dataset.mode === 'frac' ? (F.n.value ? F.d : F.n) : F.x;
    const changed = () => { const v = read(root); if (preview) preview(v); if (onChange) onChange(v); };
    const order = () => box.dataset.mode === 'frac' ? (box.dataset.mixed === '1' ? [F.w, F.n, F.d] : [F.n, F.d]) : [F.x];
    const focus = (el) => { last = el; if (!coarse()) el.focus(); markFocus(); };
    const markFocus = () => { Object.values(F).forEach(el => el.classList.toggle('cur', el === last)); };
    const setMode = (mode, mixed) => {
      if (mode === 'frac' && box.dataset.mode !== 'frac') { // przenieś wpisane cyfry do licznika
        const digits = F.x.value.replace(/[^\d]/g, ''); if (digits && !F.n.value) F.n.value = digits; F.x.value = '';
      }
      if (mode === 'num' && box.dataset.mode === 'frac') { F.x.value = (F.w.value && box.dataset.mixed === '1' ? F.w.value : F.n.value) || ''; F.w.value = ''; F.n.value = ''; F.d.value = ''; }
      box.dataset.mode = mode; box.dataset.mixed = mixed ? '1' : '0';
      if (mode === 'frac' && mixed && !F.w.value && F.n.value && !F.d.value) { F.w.value = F.n.value; F.n.value = ''; }
      focus(mode === 'frac' ? (mixed && !F.w.value ? F.w : (F.n.value ? F.d : F.n)) : F.x); changed();
    };
    const insert = (ch) => {
      const el = last || order()[0];
      if (ch === ',' && el !== F.x) return;
      el.value += ch; changed();
      if (el === F.n && box.dataset.mode === 'frac') { /* zostań w liczniku */ }
    };
    Object.values(F).forEach(el => {
      el.addEventListener('focus', () => { last = el; markFocus(); });
      el.addEventListener('input', () => {
        if (el === F.x) {
          let v = el.value.replace(/\./g, ',').replace(/[^\d, \-−\/=a-ząćęłńóśźż]/gi, '');
          if (/[\-−]/.test(v)) { box.dataset.neg = box.dataset.neg === '1' ? '0' : '1'; v = v.replace(/[\-−]/g, ''); }
          const sl = v.indexOf('/');
          if (sl >= 0) { const before = v.slice(0, sl).trim(), after = v.slice(sl + 1).replace(/\D/g, ''); const mm = before.match(/^(\d+) (\d+)$/); el.value = ''; box.dataset.mode = 'frac'; if (mm) { box.dataset.mixed = '1'; F.w.value = mm[1]; F.n.value = mm[2]; } else { box.dataset.mixed = '0'; F.n.value = before.replace(/\D/g, ''); } F.d.value = after; focus(F.d); }
          else el.value = v;
        } else { el.value = el.value.replace(/\D/g, ''); }
        root.querySelector('.mfsg').textContent = box.dataset.neg === '1' ? '−' : '';
        changed();
      });
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); if (onEnter) onEnter(); return; }
        if (box.dataset.mode === 'frac') {
          if ((e.key === '/' || e.key === 'ArrowDown') && el === F.n) { e.preventDefault(); focus(F.d); }
          else if (e.key === 'ArrowUp' && el === F.d) { e.preventDefault(); focus(F.n); }
          else if (e.key === ' ' && el === F.n && box.dataset.mixed !== '1') { e.preventDefault(); if (F.n.value) { box.dataset.mixed = '1'; F.w.value = F.n.value; F.n.value = ''; focus(F.n); changed(); } }
          else if (e.key === 'Backspace' && !el.value) {
            e.preventDefault();
            if (el === F.d) focus(F.n); else if (el === F.n && box.dataset.mixed === '1') focus(F.w); else setMode('num');
          } else if (e.key === '-' || e.key === '−') { e.preventDefault(); toggleNeg(); }
        }
      });
    });
    const toggleNeg = () => { box.dataset.neg = box.dataset.neg === '1' ? '0' : '1'; root.querySelector('.mfsg').textContent = box.dataset.neg === '1' ? '−' : ''; changed(); };
    root.querySelectorAll('[data-mk]').forEach(b => {
      b.addEventListener('pointerdown', (e) => e.preventDefault()); // nie zabieraj fokusu z pola
      b.addEventListener('click', () => {
        const k = b.dataset.mk;
        if (/^\d$/.test(k) || k === ',') return insert(k);
        if (k === 'bs' || k === 'bs2') { const el = last || order()[0]; if (el.value) { el.value = el.value.slice(0, -1); changed(); } else if (box.dataset.mode === 'frac') { if (el === F.d) focus(F.n); else if (el === F.n && box.dataset.mixed === '1') focus(F.w); else setMode('num'); } return; }
        if (k === 'clr') { Object.values(F).forEach(x => x.value = ''); box.dataset.neg = '0'; root.querySelector('.mfsg').textContent = ''; setMode('num'); return; }
        if (k === 'neg') return toggleNeg();
        if (k === 'frac') return box.dataset.mode === 'frac' && box.dataset.mixed !== '1' ? setMode('num') : setMode('frac', false);
        if (k === 'mixed') return box.dataset.mode === 'frac' && box.dataset.mixed === '1' ? setMode('frac', false) : setMode('frac', true);
        if (k === 'next') { const o = order(); const i = o.indexOf(last); focus(o[(i + 1) % o.length]); return; }
        if (k === 'ok' && onEnter) onEnter();
      });
    });
    // dotknięcie pola na telefonie – zaznacz je (bez systemowej klawiatury)
    Object.values(F).forEach(el => el.addEventListener('pointerdown', () => { last = el; markFocus(); }));
    markFocus(); changed();
    if (!coarse() && !F.x.disabled && window.matchMedia('(min-width: 700px)').matches) (last || F.x).focus();
  }
  MP.mf = { render, read, bind, split, compose };
})(MP);
