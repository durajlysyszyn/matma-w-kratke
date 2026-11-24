// Skan treści: format liczb, długie ułamki dziesiętne, duplikaty opcji, forma rodzaju, długość tekstu
const path=require('path'); const A=(f)=>require(path.join(__dirname,'..','app',f));
global.window=global; global.MP={};
['core.js','errors.js','gens_a.js','gens_b.js','gens_c.js','gens_k2.js','gens_k13.js','gens_k4p.js','gens_k78.js','gens_ix.js','themes.js','curriculum.js','curriculum_more.js','engine.js'].forEach(A);
const U=MP.util,E=MP.engine; const R={}; const add=(k,id,s)=>{R[k]=R[k]||{};R[k][id]=R[k][id]||[];if(R[k][id].length<2)R[k][id].push(s);};
let n=0; const words=[];
for (let g=1; g<=8; g++){ MP.setGrade(g);
 for (const id of MP.SKILL_ORDER){ const sk=MP.SK[id]; if(!sk||!sk.types) continue;
  for (const d of [1,2,3]) for (const ty of (sk.types[d]||[])) for (let seed=1; seed<=25; seed++){
   let it; try{ const sp=E.makeSpec(id,d,ty); sp.seed=seed*7919; it=E.buildItem(sp);}catch(e){add('wyjątek',id,e.message);continue;} n++;
   const P=U.plain(it.prompt||''); const opts=(it.options||[]).map(o=>U.plain(o.label||''));
   const all=[P,...opts,...(it.hints||[]).map(U.plain),...(it.sol||[]).map(U.plain)].join(' | ');
   if (/\d\.\d/.test(all.replace(/\d+\.\s/g,''))) add('kropka dziesiętna zamiast przecinka',id,all.match(/.{0,30}\d\.\d.{0,20}/)[0]);
   if (/\d[,.]\d{5,}/.test(all)) add('długie rozwinięcie dziesiętne',id,all.match(/.{0,25}\d[,.]\d{5,}.{0,5}/)[0]);
   if (new Set(opts).size!==opts.length) add('powtórzone opcje',id,opts.join(' / '));
   if (/(^|\D)-0(\D|$)|−0(?![,\d])/.test(all)) add('minus zero',id,all.slice(0,120));
   if (/\b(zrobiłeś|policzyłeś|wykonałeś|dodałeś|pomyliłeś|zapomniałeś|odczytałeś|pomnożyłeś|podzieliłeś|zgubiłeś)\b/i.test(all)) add('forma męska w treści',id,all.match(/.{0,20}\b(zrobiłeś|policzyłeś|wykonałeś|dodałeś|pomyliłeś|zapomniałeś|odczytałeś|pomnożyłeś|podzieliłeś|zgubiłeś)\b.{0,20}/i)[0]);
   if (/\[\[|\]\]|undefined|NaN/.test(all)) add('surowy znacznik/undefined',id,all.slice(0,120));
   words.push([g,P.split(/\s+/).length,id]);
 }}}
console.log('zadań',n);
for (const k in R){ console.log('\n##',k,Object.keys(R[k]).length,'umiejętności'); for (const id in R[k]) console.log('  ',id,'::',R[k][id][0].slice(0,140)); }
for (let g=1; g<=8; g++){ const w=words.filter(x=>x[0]===g).map(x=>x[1]).sort((a,b)=>a-b); const long=words.filter(x=>x[0]===g&&x[1]>=25); console.log('klasa',g,'mediana słów',w[w.length>>1],'p90',w[Math.floor(w.length*0.9)],'max',w[w.length-1],'≥25 słów:',[...new Set(long.map(x=>x[2]))].slice(0,6).join(','));}
// errors.js komunikaty męskie
const msgs=JSON.stringify(MP.ERRORS||MP.errors||{}); const m=msgs.match(/\b\w+(łeś|eś)\b/g)||[]; console.log('\nformy męskie w komunikatach błędów:', [...new Set(m)].slice(0,30).join(', '), 'łącznie', m.length);
