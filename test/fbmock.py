# Atrapa Firebase (Auth: Google + e-mail/hasło; Firestore) dla testów przeglądarkowych.
# Firestore egzekwuje reguły przepisane 1:1 z build/firestore.rules (symulacja – prawdziwe reguły trzeba sprawdzić na projekcie Firebase).
MOCK = r"""
(function(){
  const CLOUD='__MOCKFS', USERK='__MOCKUSER', ACC='__MOCKAUTH';
  const J=(k,d)=>JSON.parse(localStorage.getItem(k)||d); const P=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
  const db=()=>J(CLOUD,'{}'); const put=d=>P(CLOUD,d);
  let user=J(USERK,'null'); const subs=[]; window.__denied=[]; window.__writes=[];
  const emit=()=>{ setTimeout(()=>subs.forEach(f=>f(user?mkUser(user):null)),20); };
  function mkUser(u){ return {uid:u.uid,email:u.email,emailVerified:!!u.verified,providerData:[{providerId:u.provider}],
    reload:async function(){const a=J(ACC,'{}'); const r=a[u.email]; if(r){u.verified=!!r.verified; user.verified=u.verified; P(USERK,user); this.emailVerified=u.verified;} },
    getIdToken:async()=>'t', sendEmailVerification:async()=>{window.__verifSent=(window.__verifSent||0)+1},
    delete:async()=>{const a=J(ACC,'{}'); delete a[u.email]; P(ACC,a); window.__deletedUser=u.email; }}; }
  function err(code){ const e=new Error(code); e.code=code; return e; }
  // ---- reguły (kopia logiki z firestore.rules) ----
  function ruleCheck(op,path,data){
    const a=user; const signed=!!a; const email=a&&a.email?a.email.toLowerCase():null; const ver=!!(a&&a.verified);
    const D=db(); const inv=email?D['invites/'+email]:null; const linked=!!inv;
    let m=path.match(/^users\/([^/]+)\/docs\/([^/]+)$/);
    if(m){ const [_,uid,doc]=m; const own=signed&&a.uid===uid&&!linked; const child=signed&&email&&ver&&inv&&inv.parent===uid&&doc==='p_'+inv.pid; return own||child; }
    m=path.match(/^invites\/(.+)$/);
    if(m){ const em=m[1]; const cur=D[path];
      if(op==='get'){ if(!signed) return false; if(email&&ver&&email===em) return true; if(!cur) return 'error'; return cur.parent===a.uid; }
      if(op==='set'&&!cur) return signed&&email&&ver&&!linked&&em===em.toLowerCase()&&em!==email&&data.parent===a.uid&&typeof data.pid==='string';
      if(op==='set'&&cur) return signed&&email&&ver&&cur.parent===a.uid&&data.parent===a.uid&&typeof data.pid==='string';
      if(op==='delete') return signed&&cur&&cur.parent===a.uid;
    }
    return false;
  }
  function guard(op,path,data){ const r=ruleCheck(op,path,data); if(r!==true){ window.__denied.push(op+' '+path); throw err('permission-denied'); } }
  function doc(path){return{collection:n=>coll(path+'/'+n),
    get:async()=>{guard('get',path); const v=db()[path];return{exists:!!v,data:()=>v}},
    set:async v=>{guard('set',path,v); window.__writes.push(path);const d=db();d[path]=v;put(d)},
    delete:async()=>{guard('delete',path); window.__writes.push('DEL '+path);const d=db();delete d[path];put(d)}}}
  function coll(path){return{doc:id=>doc(path+'/'+id)}}
  function Prov(){} Prov.prototype.setCustomParameters=function(p){window.__lastHint=p&&p.login_hint};
  let n=0; const newUid=()=>'U'+Date.now().toString(36)+(n++);
  function login(u,isNew){ user=u; P(USERK,user); emit(); return {user:mkUser(u), additionalUserInfo:{isNewUser:isNew}}; }
  const api={
    languageCode:null,
    get currentUser(){ return user?mkUser(user):null; },
    onAuthStateChanged:f=>{subs.push(f);setTimeout(()=>f(user?mkUser(user):null),30)},
    signInWithPopup:async()=>{ const w=J('__WHO','null'); if(!w) throw err('auth/popup-closed-by-user'); const a=J(ACC,'{}'); let r=a[w.email]; let isNew=false;
      if(!r){ r={uid:w.uid||newUid(),email:w.email,provider:'google.com',verified:true}; a[w.email]=r; P(ACC,a); isNew=true; }
      return login({uid:r.uid,email:r.email,provider:'google.com',verified:true},isNew); },
    signInWithRedirect:async()=>{},
    createUserWithEmailAndPassword:async(email,pass)=>{ email=email.toLowerCase(); const a=J(ACC,'{}'); if(a[email]) throw err('auth/email-already-in-use'); if(pass.length<6) throw err('auth/weak-password');
      const r={uid:newUid(),email,pass,provider:'password',verified:false}; a[email]=r; P(ACC,a); return login({uid:r.uid,email,provider:'password',verified:false},true); },
    signInWithEmailAndPassword:async(email,pass)=>{ email=email.toLowerCase(); const a=J(ACC,'{}'); const r=a[email]; if(!r||r.pass!==pass) throw err('auth/invalid-credential');
      return login({uid:r.uid,email,provider:'password',verified:!!r.verified},false); },
    sendPasswordResetEmail:async(email)=>{ window.__resetFor=email; },
    signOut:async()=>{user=null;localStorage.removeItem(USERK);emit()}
  };
  const auth=()=>api; auth.GoogleAuthProvider=Prov;
  window.firebase={apps:[],initializeApp(){this.apps.push(1)},auth,firestore:()=>({collection:n=>coll(n)})};
  // pomocnicze dla testów: „kliknięcie linku weryfikacyjnego"
  window.__verifyEmail=(email)=>{ const a=J(ACC,'{}'); if(a[email]) { a[email].verified=true; P(ACC,a);} };
})();
"""
