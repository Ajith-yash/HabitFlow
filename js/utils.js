// Small helpers shared by all files.
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
// esc() makes user text safe before it is placed inside innerHTML.
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pad=n=>String(n).padStart(2,'0');
const iso=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const parseISO=s=>{const[y,m,d]=s.split('-').map(Number);return new Date(y,m-1,d)};
const todayISO=()=>iso(new Date());
const addDays=(s,n)=>{const d=parseISO(s);d.setDate(d.getDate()+n);return iso(d)};
const validISO=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&iso(parseISO(s))===s;
const uid=()=>(crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+Math.random().toString(36).slice(2));
const DAYS=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
// Preferences in LocalStorage (wrapped so blocked storage never crashes the app).
const Pref={get(k,d){try{const v=localStorage.getItem('hf_'+k);return v===null?d:JSON.parse(v)}catch{return d}},
 set(k,v){try{localStorage.setItem('hf_'+k,JSON.stringify(v))}catch{}},del(k){try{localStorage.removeItem('hf_'+k)}catch{}}};
function fmtDate(s){const d=parseISO(s),f=Pref.get('dateFormat','iso');
 if(f==='dmy')return`${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()}`;
 if(f==='mdy')return`${pad(d.getMonth()+1)}/${pad(d.getDate())}/${d.getFullYear()}`;return s}
let _t;function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('on');clearTimeout(_t);_t=setTimeout(()=>t.classList.remove('on'),2800)}
// ask('Message',['Cancel','Delete']) resolves to the index of the clicked button (0 = first).
function ask(msg,labels){return new Promise(res=>{$('#askMsg').textContent=msg;const b=$('#askBtns');b.innerHTML='';
 labels.forEach((l,i)=>{const e=document.createElement('button');e.className='btn'+(i===0?' ghost':'');e.textContent=l;e.onclick=()=>{$('#dAsk').close();res(i)};b.append(e)});
 $('#dAsk').oncancel=()=>res(0);$('#dAsk').showModal()})}
const confirmBox=msg=>ask(msg,['Cancel','Confirm']).then(i=>i===1);
function saveFile(name,content,type){const a=document.createElement('a'),u=URL.createObjectURL(content instanceof Blob?content:new Blob([content],{type}));a.href=u;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),1000)}
// CSV cell: quotes values and blocks spreadsheet formula injection.
const csvCell=v=>{let s=String(v??'');if(/^[=+\-@]/.test(s))s="'"+s;return'"'+s.replace(/"/g,'""')+'"'};
