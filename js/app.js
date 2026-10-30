// App start-up, routing (URL hash) and dashboard rendering.
const App={
 PUBLIC:['home','auth','about'],
 async init(){Settings.applyTheme();paintIcons();Habits.initForm();Cal.init();Settings.init();Exp.init();App.wire();
  try{await DB.open();const s=Pref.get('session',null);if(s)try{await Auth.enter(s)}catch{Auth.logout()}}
  catch(e){$('#fatal').textContent='Storage problem: '+e.message+' HabitFlow cannot save data until this is fixed.'}
  addEventListener('hashchange',App.render);addEventListener('resize',()=>{if(App.view()==='analytics'&&S.owner)Analytics.render()});
  addEventListener('online',App.net);addEventListener('offline',App.net);App.net();
  if('serviceWorker'in navigator&&location.protocol.startsWith('http'))navigator.serviceWorker.register('service-worker.js').catch(()=>{});
  let ev;addEventListener('beforeinstallprompt',e=>{e.preventDefault();ev=e;$('#installBtn').hidden=false});
  $('#installBtn').onclick=async()=>{if(ev){ev.prompt();await ev.userChoice;ev=null;$('#installBtn').hidden=true}};
  App.render()},
 net(){$('#offline').hidden=navigator.onLine},
 view(){return(location.hash.slice(1)||'home')},
 wire(){
  const guest=async()=>{try{await Auth.enter('guest');location.hash='#dashboard'}catch(e){toast(e.message)}};$('#guestBtn').onclick=$('#guestBtn2').onclick=guest;
  $('#tLogin').onclick=()=>App.tab(1);$('#tReg').onclick=()=>App.tab(0);
  const fail=e=>{$('#authMsg').textContent=e.message};
  $('#fLogin').onsubmit=async e=>{e.preventDefault();try{await Auth.login($('#lId').value,$('#lPw').value);$('#fLogin').reset();location.hash='#dashboard'}catch(x){fail(x)}};
  $('#fReg').onsubmit=async e=>{e.preventDefault();try{await Auth.register({name:$('#rName').value,username:$('#rUser').value.trim(),email:$('#rEmail').value.trim(),pw:$('#rPw').value,pw2:$('#rPw2').value});$('#fReg').reset();location.hash='#dashboard';toast('Local account created')}catch(x){fail(x)}};
  $$('[data-add]').forEach(b=>b.onclick=()=>Habits.openForm());
  ['#todayList','#habitList'].forEach(s=>$(s).onclick=Habits.act);
  ['q','fcat','fstat','fsort'].forEach(i=>$('#'+i).oninput=Habits.renderList);
  $('#fcat').innerHTML='<option value="all">All categories</option>'+Habits.cats.map(c=>`<option>${esc(c)}</option>`).join('');
  $('#range').onchange=Analytics.render;$('#oneSel').onchange=Analytics.one;$('#infoClose').onclick=()=>$('#dInfo').close()},
 tab(login){$('#fLogin').hidden=!login;$('#fReg').hidden=!!login;$('#tLogin').classList.toggle('ghost',!login);$('#tReg').classList.toggle('ghost',!!login);$('#authMsg').textContent=''},
 render(){let v=App.view();if(!$('#v-'+v))v='home';
  if(!S.owner&&!App.PUBLIC.includes(v)){location.hash='#auth';return}
  const on=!!S.owner;document.body.classList.toggle('authed',on);
  $('#mode').textContent=!on?'Not signed in':S.owner==='guest'?'Guest Mode':'Account: '+S.user.username;
  $('#loginLink').hidden=on;$$('[data-app]').forEach(a=>a.hidden=!on);
  $$('.view').forEach(e=>e.classList.toggle('on',e.id==='v-'+v));
  $$('.links a,.bottom a').forEach(a=>a.classList.toggle('on',a.getAttribute('href')==='#'+v));
  if(!on)return;
  App.dash();if(v==='habits')Habits.renderList();if(v==='analytics')Analytics.render();if(v==='calendar')Cal.render();if(v==='profile')Settings.render();
  if(v==='downloads')$('#expWho').textContent=S.owner==='guest'?'Exporting guest data.':'Exporting data for account '+S.user.username+'.';scrollTo(0,0)},
 dash(){const t=todayISO(),h=new Date().getHours(),g=h<12?'Good morning':h<18?'Good afternoon':'Good evening',x=Habits.dayStat(t),p=x.s?Math.round(x.c/x.s*100):0;
  $('#greet').textContent=`${g}, ${S.user.name.split(' ')[0]}`;$('#todayLbl').textContent=new Date().toLocaleDateString(undefined,{weekday:'long',year:'numeric',month:'long',day:'numeric'});
  const first=S.habits.map(z=>z.start).sort()[0]||t,n=Math.min(730,Math.round((parseISO(t)-parseISO(first))/864e5)+1),tot=Analytics.sum(Analytics.days(Math.max(1,n)));
  $('#stats').innerHTML=Analytics.card(S.habits.filter(z=>z.status==='active').length,'Active habits')+Analytics.card(x.c,'Done today')+Analytics.card(x.s-x.c,'Remaining today')+Analytics.card(Habits.overall().cur,'Current streak')+Analytics.card(tot.pct+'%','Overall completion');
  $('#ring').style.background=`conic-gradient(var(--blue) ${p}%,var(--bd) 0)`;$('#ringTxt').textContent=p+'%';$('#ringBar').style.width=p+'%';
  $('#ringSub').textContent=x.s?`${x.c} of ${x.s} habits done today`:'Nothing scheduled today';
  $('#quote').textContent=!x.s?'Add a habit to begin your first streak.':p===100?'Everything done today. Great work!':p>=50?'More than halfway there. Keep going.':'One small step now is enough to start.';
  const l=S.habits.filter(z=>Habits.scheduled(z,t));$('#todayList').innerHTML=l.length?l.map(z=>Habits.row(z,t,false)).join(''):'<div class="empty">No habits scheduled today. Select "Add New Habit".</div>'}};
document.addEventListener('DOMContentLoaded',App.init);
