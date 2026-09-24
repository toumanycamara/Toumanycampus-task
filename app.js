// Clé publique (sb_publishable_...). Ne mettez jamais une clé sb_secret_ ici.
const SUPABASE_URL='https://cmshcdignxexsvadacar.supabase.co';
const SUPABASE_KEY='sb_publishable_d2fin-Z1EwZiHz6T5AgKwA_RWVm8h1y';

const $=id=>document.getElementById(id),esc=t=>String(t??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const PAL=['#6d5ce8','#3b82f6','#2b9a5f','#8b5cf6','#e0a800','#e5652e','#2f8fe0','#14b8a6','#0f8a6d','#e5484d','#5b6ee1','#d9467a','#64748b'];
const STARTER=['Algorithmique','Langage C','Python','PHP','JavaScript','HTML','CSS','Tailwind CSS','Méthodes agiles','Gestion de projets','CMS (WordPress)','Anglais','Mathématiques'];
let db,U=null,P={},TAB='tasks',LV=localStorage.getItem('tdc_lv')||'L1',D={courses:[],tasks:[],grades:[],projects:[]},mode='in';
// H = 1er ou 2e semestre de l'année en cours (L1 : S1/S2, L2 : S3/S4, L3 : S5/S6)
let H=+localStorage.getItem('tdc_h')||1;

const show=v=>['setup','auth','app'].forEach(k=>$(k).classList.toggle('hide',k!=v));
const toast=m=>{$('toast').textContent=m;$('toast').classList.remove('hide');setTimeout(()=>$('toast').classList.add('hide'),3500)};
const lv=a=>a.filter(x=>x.level==LV),cs=()=>lv(D.courses),cid=i=>D.courses.find(c=>c.id==i);

// ---------- Semestres ----------
const semsOf=()=>{const b=(+LV[1]-1)*2;return [b+1,b+2]};          // semestres du niveau affiché
const semN=()=>semsOf()[H-1];                                        // semestre sélectionné
const semOf=c=>c.semester||((+c.level[1]-1)*2+1);                    // matière sans semestre : 1er semestre du niveau
const csS=(s=semN())=>cs().filter(c=>semOf(c)==s);
const semBar=()=>`<div class="seg semseg" role="group" aria-label="Semestre">${semsOf().map((n,i)=>`<button data-h="${i+1}" class="${H==i+1?'on':''}">Semestre ${n}</button>`).join('')}</div>`;

const days=s=>Math.round((new Date(s+'T00:00')-new Date(new Date().toDateString()))/864e5);
const lab=n=>n<0?'En retard':n==0?"Aujourd'hui":n==1?'Demain':'Dans '+n+' j';
// s fourni : seulement les matières de ce semestre ; sinon toutes les matières du niveau, préfixées par le semestre
const opts=(none,s)=>(none?'<option value="">Sans matière</option>':'')+(s?csS(s):cs()).map(c=>`<option value="${c.id}">${s?'':'S'+semOf(c)+' · '}${esc(c.name)}</option>`).join('');

// ---------- Moyennes ----------
const avgC=id=>{const g=lv(D.grades).filter(x=>x.course_id==id);return g.length?g.reduce((a,x)=>a+x.value/x.max*20,0)/g.length:null};
const avgSem=s=>{let t=0,w=0;csS(s).forEach(c=>{const a=avgC(c.id);if(a!=null){t+=a*c.coef;w+=+c.coef}});return w?t/w:null};
const avgYear=()=>{const v=semsOf().map(avgSem).filter(x=>x!=null);return v.length?v.reduce((a,b)=>a+b,0)/v.length:null};
const fmt=a=>a==null?'—':a.toFixed(2);
const col=a=>a==null?'inherit':a>=10?'var(--ac)':'var(--r)';

// ---------- Minuteur de concentration ----------
let FT={s:1500,tot:1500,run:false,iv:null};
const mm=s=>String(s/60|0).padStart(2,'0')+':'+String(s%60).padStart(2,'0');
const focus=()=>`<div class="card focus"><div><h2>Concentration</h2><div class="clock" id="clk">${mm(FT.s)}</div></div><div class="fctl"><div class="seg">${[25,15,5].map(m=>`<button data-fm="${m}" class="${FT.tot==m*60?'on':''}">${m} min</button>`).join('')}</div><div><button class="btn" data-ft="go">${FT.run?'Pause':FT.s<FT.tot?'Reprendre':'Démarrer'}</button> <button class="btn g2" data-ft="rs">Réinitialiser</button></div></div></div>`;
function setFT(t){clearInterval(FT.iv);FT={s:t,tot:t,run:false,iv:null};document.title='Toumany Dev Campus';render()}
function toggleFT(){if(FT.run){clearInterval(FT.iv);FT.run=false}else{try{Notification.requestPermission()}catch(e){}FT.run=true;FT.iv=setInterval(tickFT,1000)}render()}
function tickFT(){FT.s--;
 if(FT.s<=0){clearInterval(FT.iv);FT.run=false;FT.s=FT.tot;document.title='Toumany Dev Campus';toast('Session terminée ! Prenez une pause.');try{if(window.Notification&&Notification.permission=='granted')new Notification('Session terminée')}catch(e){}render();return}
 const c=$('clk');if(c)c.textContent=mm(FT.s);document.title=mm(FT.s)+' · Toumany'}

// ---------- Authentification ----------
if(SUPABASE_URL.includes('YOUR-')||SUPABASE_KEY.includes('COLLEZ')||SUPABASE_KEY.startsWith('sb_secret')){show('setup')}else{
 db=supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
 db.auth.onAuthStateChange((_e,s)=>{if(s?.user){if(!U||U.id!==s.user.id){U=s.user;load()}}else{U=null;show('auth')}});
}
function setMode(m){mode=m;$('at').textContent=m=='up'?'Créer un compte':'Connexion';$('ab').textContent=m=='up'?'Créer mon compte':'Se connecter';
 $('sw').textContent=m=='up'?'Déjà un compte ? Se connecter':'Pas de compte ? Créer un compte';
 document.querySelectorAll('.up').forEach(e=>e.classList.toggle('hide',m!='up'));$('an').required=$('aph').required=$('ap2').required=m=='up';$('ap2').value='';
 $('ap').autocomplete=m=='up'?'new-password':'current-password';$('am').textContent=''}
$('sw').onclick=()=>setMode(mode=='up'?'in':'up');
$('ap').oninput=$('ap2').oninput=()=>{const bad=mode=='up'&&$('ap2').value&&$('ap').value!==$('ap2').value;$('am').className='msg';$('am').textContent=bad?'Les mots de passe ne sont pas identiques.':''};
$('af').onsubmit=async e=>{e.preventDefault();$('am').className='msg';$('am').textContent='';const em=$('ae').value.trim(),pw=$('ap').value;
 if(mode=='up'&&pw!==$('ap2').value){$('am').textContent='Les mots de passe ne sont pas identiques.';return}
 const r=mode=='up'?await db.auth.signUp({email:em,password:pw,options:{data:{full_name:$('an').value.trim(),phone:$('aph').value.trim()}}}):await db.auth.signInWithPassword({email:em,password:pw});
 if(r.error){$('am').textContent=r.error.message}
 else if(mode=='up'&&!r.data.session){$('am').className='msg ok';$('am').textContent='Compte créé. Confirmez votre e-mail, puis connectez-vous.'}};
$('out').onclick=()=>db.auth.signOut();

// ---------- Données ----------
async function load(){
 const r=await Promise.all([db.from('profiles').select('*').eq('id',U.id).maybeSingle(),...['courses','tasks','grades','projects'].map(n=>db.from(n).select('*').order('created_at'))]);
 P=r[0].data||{};['courses','tasks','grades','projects'].forEach((n,i)=>D[n]=r[i+1].data||[]);
 show('app');render();
}
async function ins(n,row){const {data,error}=await db.from(n).insert({...row,level:LV}).select().single();if(error)return toast(error.message);D[n].push(data);render()}
async function upd(n,id,p){const {error}=await db.from(n).update(p).eq('id',id);if(error)return toast(error.message);Object.assign(D[n].find(x=>x.id==id),p);render()}
async function del(n,id){const {error}=await db.from(n).delete().eq('id',id);if(error)return toast(error.message);D[n]=D[n].filter(x=>x.id!=id);if(n=='courses')D.grades=D.grades.filter(x=>x.course_id!=id);render()}

// ---------- Vues ----------
const noC=s=>`<p class="sub">Ajoutez d'abord les matières du semestre ${s} dans l'onglet « Matières ».</p>`;
const V={
tasks(){const L=lv(D.tasks),n=L.filter(x=>x.done).length,late=L.filter(x=>!x.done&&x.due&&days(x.due)<0).length,a=avgYear();
 const rows=[...L].sort((a,b)=>a.done-b.done||(a.due||'9').localeCompare(b.due||'9')).map(x=>{const c=cid(x.course_id),d=x.due?days(x.due):0;
  return `<div class="row ${x.done?'done':''}"><button class="chk" data-done="${x.id}" aria-label="Terminer">✓</button><div><div class="ti">${esc(x.title)}</div><div class="meta">${c?`<span class="pj" style="--c:${esc(c.color)}">S${semOf(c)} · ${esc(c.name)}</span>`:''}${x.start_time?`<span>⏰ ${x.start_time.slice(0,5)}</span>`:''}</div></div><span class="due ${!x.done&&x.due&&d<0?'late':''}">${x.done?'Terminée':x.due?lab(d):'Sans date'}</span><button class="x" data-del="tasks:${x.id}" aria-label="Supprimer">×</button></div>`}).join('')||'<p class="sub">Aucune tâche pour ce niveau.</p>';
 return `<h1>Mes tâches · Licence ${LV[1]}</h1>${focus()}<div class="stats"><div class="st"><b>${n}/${L.length}</b><span>Terminées</span></div><div class="st"><b style="color:${late?'var(--r)':'inherit'}">${late}</b><span>En retard</span></div><div class="st"><b>${a==null?'—':a.toFixed(1)}</b><span>Moyenne annuelle /20</span></div></div>
 <div class="card">${rows}<form class="add" id="ft"><input class="g" name="t" placeholder="Nouvelle tâche" required aria-label="Titre"><select name="c" aria-label="Matière">${opts(1)}</select><input type="date" name="d" aria-label="Échéance"><input type="time" name="h" aria-label="Heure de début"><button class="btn">Ajouter</button></form></div>`},

grades(){const s=semN(),L=lv(D.grades),[s1,s2]=semsOf(),a1=avgSem(s1),a2=avgSem(s2),y=avgYear();
 const tb=csS(s).map(c=>{const g=L.filter(x=>x.course_id==c.id),m=avgC(c.id);return `<tr><td><span class="pj" style="--c:${esc(c.color)}"><b>${esc(c.name)}</b></span></td><td>${g.map(x=>`<span title="${esc(x.label)}">${x.value}/${x.max}<button class="x" data-del="grades:${x.id}" aria-label="Supprimer la note">×</button></span>`).join(' ')||'—'}</td><td>${c.coef}</td><td><b>${m==null?'—':m.toFixed(1)}</b></td></tr>`}).join('');
 return `<h1>Notes · Licence ${LV[1]}</h1><p class="sub">Moyenne de chaque semestre pondérée par vos coefficients. La moyenne annuelle est la moyenne des deux semestres.</p>${semBar()}
 <div class="stats">
  <div class="st ${s==s1?'cur':''}"><b style="color:${col(a1)}">${fmt(a1)}</b><span>Semestre ${s1} /20</span></div>
  <div class="st ${s==s2?'cur':''}"><b style="color:${col(a2)}">${fmt(a2)}</b><span>Semestre ${s2} /20</span></div>
  <div class="st"><b style="color:${col(y)}">${fmt(y)}</b><span>Moyenne annuelle /20</span></div>
 </div>
 <div class="card"><h2>Semestre ${s}</h2>${csS(s).length?`<table><tr><th>Matière</th><th>Notes</th><th>Coef.</th><th>Moyenne</th></tr>${tb}</table>
 <form class="add" id="fg"><select name="c" aria-label="Matière">${opts(0,s)}</select><input class="g" name="l" placeholder="Intitulé (DS, TP…)" aria-label="Intitulé"><input name="v" type="number" step="0.25" min="0" required placeholder="Note" style="width:90px" aria-label="Note"><input name="m" type="number" min="1" value="20" style="width:80px" aria-label="Barème"><button class="btn">Ajouter la note</button></form>`:noC(s)}</div>`},

courses(){const s=semN(),L=csS(s),[s1,s2]=semsOf();
 return `<h1>Mes matières · Licence ${LV[1]}</h1><p class="sub">Ajoutez les matières de chaque semestre et choisissez leur coefficient.</p>${semBar()}<div class="card"><h2>Semestre ${s}</h2>
 ${L.length?`<table><tr><th>Matière</th><th>Coefficient</th><th>Semestre</th><th></th></tr>${L.map(c=>`<tr><td><span class="pj" style="--c:${esc(c.color)}">${esc(c.name)}</span></td><td><input type="number" min="0" step="0.5" value="${c.coef}" data-coef="${c.id}" aria-label="Coefficient de ${esc(c.name)}"></td><td><select data-sem="${c.id}" aria-label="Semestre de ${esc(c.name)}" style="border:1px solid var(--line);background:var(--card);border-radius:8px;padding:4px 8px">${[s1,s2].map(n=>`<option value="${n}" ${semOf(c)==n?'selected':''}>S${n}</option>`).join('')}</select></td><td><button class="x" data-del="courses:${c.id}" aria-label="Supprimer">×</button></td></tr>`).join('')}</table>`:`<p class="sub">Aucune matière pour le semestre ${s}.</p><button class="btn" data-starter="1">Charger l'exemple Génie logiciel</button>`}
 <form class="add" id="fc"><input class="g" name="n" placeholder="Nom de la matière" required aria-label="Nom"><input name="k" type="number" min="0" step="0.5" value="1" style="width:90px" aria-label="Coefficient"><button class="btn">Ajouter au semestre ${s}</button></form></div>`},

projects(){const L=lv(D.projects);
 return `<h1>Mes projets · Licence ${LV[1]}</h1><p class="sub">Déposez ici les liens de vos projets réalisés.</p><div class="card"><div class="grid">${L.map(x=>{const c=cid(x.course_id);return `<div class="pc" style="--c:${esc(c?.color||'#888')}"><b>${esc(x.name)}</b><small>${c?'S'+semOf(c)+' · '+esc(c.name):''}${x.tech?' · '+esc(x.tech):''}</small>${x.descr?`<small>${esc(x.descr)}</small>`:''}<a href="${esc(x.url)}" target="_blank" rel="noopener noreferrer">Ouvrir le lien</a><button class="link" data-del="projects:${x.id}">Supprimer</button></div>`}).join('')||'<p class="sub">Aucun projet pour ce niveau.</p>'}</div>
 <form class="add" id="fj"><input class="g" name="n" placeholder="Nom du projet" required aria-label="Nom du projet"><select name="c" aria-label="Matière">${opts(1)}</select><input class="g" name="u" placeholder="https://github.com/…" required aria-label="Lien"><input class="g" name="t" placeholder="Technologies" aria-label="Technologies"><input class="g" name="d" placeholder="Description courte" aria-label="Description"><button class="btn">Enregistrer le lien</button></form></div>`},

profile(){return `<h1>Mon profil</h1><p class="sub">Ces informations sont privées et servent aux rappels.</p><form class="card" id="fp" style="max-width:420px"><label>Nom complet<input class="fld" name="n" value="${esc(P.full_name)}"></label><label>Téléphone<input class="fld" name="p" type="tel" value="${esc(P.phone)}"></label><label>E-mail<input class="fld" value="${esc(U.email)}" disabled></label><button class="btn">Enregistrer</button></form>`}
};

const T=[['tasks','Tâches'],['grades','Notes'],['courses','Matières'],['projects','Projets'],['profile','Profil']];
function render(){
 $('tabs').innerHTML=T.map(([k,l])=>`<button data-t="${k}" class="${k==TAB?'on':''}">${l}</button>`).join('');
 $('lvs').innerHTML=['L1','L2','L3'].map(l=>`<button data-l="${l}" class="${l==LV?'on':''}">${l}</button>`).join('');
 $('who').textContent=P.full_name||U.email;$('main').innerHTML=V[TAB]();
}
$('tabs').onclick=e=>{if(e.target.dataset.t){TAB=e.target.dataset.t;render()}};
$('lvs').onclick=e=>{if(e.target.dataset.l){LV=e.target.dataset.l;localStorage.setItem('tdc_lv',LV);render()}};
$('main').onclick=async e=>{const b=e.target.closest('button');if(!b)return;
 if(b.dataset.done){const t=D.tasks.find(x=>x.id==b.dataset.done);upd('tasks',t.id,{done:!t.done})}
 else if(b.dataset.h){H=+b.dataset.h;localStorage.setItem('tdc_h',H);render()}
 else if(b.dataset.fm){setFT(+b.dataset.fm*60)}else if(b.dataset.ft=='go'){toggleFT()}else if(b.dataset.ft=='rs'){setFT(FT.tot)}
 else if(b.dataset.del){const [n,id]=b.dataset.del.split(':');if(n=='courses'&&!confirm('Supprimer cette matière et ses notes ?'))return;del(n,id)}
 else if(b.dataset.starter){const s=semN(),{data,error}=await db.from('courses').insert(STARTER.map((n,i)=>({level:LV,semester:s,name:n,coef:1,color:PAL[i%PAL.length]}))).select();if(error)return toast(error.message);D.courses.push(...data);render()}};
$('main').onchange=e=>{const i=e.target;
 if(i.dataset.coef)upd('courses',i.dataset.coef,{coef:Math.max(0,+i.value||0)});
 else if(i.dataset.sem)upd('courses',i.dataset.sem,{semester:+i.value})};
$('main').onsubmit=async e=>{e.preventDefault();const f=e.target,v=k=>f.elements[k].value.trim();
 if(f.id=='ft')ins('tasks',{title:v('t'),course_id:v('c')||null,due:v('d')||null,start_time:v('h')||null});
 else if(f.id=='fg')ins('grades',{course_id:v('c'),label:v('l')||'Note',value:+v('v'),max:+v('m')||20});
 else if(f.id=='fc')ins('courses',{name:v('n'),coef:+v('k')||0,semester:semN(),color:PAL[cs().length%PAL.length]});
 else if(f.id=='fj'){if(!/^https?:\/\//i.test(v('u')))return toast('Le lien doit commencer par http:// ou https://');ins('projects',{name:v('n'),course_id:v('c')||null,url:v('u'),tech:v('t'),descr:v('d')})}
 else if(f.id=='fp'){const {error}=await db.from('profiles').upsert({id:U.id,full_name:v('n'),phone:v('p'),email:U.email});if(error)return toast(error.message);P={...P,full_name:v('n'),phone:v('p')};toast('Profil enregistré');render()}};

// ---------- Thème ----------
const dark=()=>document.documentElement.dataset.theme?document.documentElement.dataset.theme=='dark':matchMedia('(prefers-color-scheme: dark)').matches;
if(localStorage.getItem('tdc_th'))document.documentElement.dataset.theme=localStorage.getItem('tdc_th');
const th=()=>$('th').textContent=dark()?'☀':'☾';th();
$('th').onclick=()=>{const t=dark()?'light':'dark';document.documentElement.dataset.theme=t;localStorage.setItem('tdc_th',t);th()};
