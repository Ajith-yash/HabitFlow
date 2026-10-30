// Profile, preferences and reminder notifications.
const Settings={
 applyTheme(){document.documentElement.dataset.theme=Pref.get('theme','light')},
 render(){const u=S.user||{},g=S.owner==='guest';
  $('#profInfo').innerHTML=g?'<p class="muted">You are using <b>Guest Mode</b>. Data is saved on this device only. Create a local account to keep separate profiles.</p>':`<p>Created: ${fmtDate(u.created.slice(0,10))}</p>`;
  $('#fProf').hidden=$('#fPw').hidden=$('#delAcct').hidden=g;$('#outBtn').textContent=g?'Leave guest mode':'Log out';
  if(!g){$('#pName').value=u.name;$('#pUser').value=u.username;$('#pEmail').value=u.email}
  $('#sTheme').value=Pref.get('theme','light');$('#sWeek').value=Pref.get('weekStart',0);$('#sDate').value=Pref.get('dateFormat','iso');
  $('#sNotif').checked=Pref.get('notif',false)&&window.Notification&&Notification.permission==='granted'},
 msg(t,ok){const m=$('#profMsg');m.textContent=t;m.className='msg '+(ok?'ok':'err')},
 init(){
  $('#sTheme').onchange=e=>{Pref.set('theme',e.target.value);Settings.applyTheme()};
  $('#sWeek').onchange=e=>Pref.set('weekStart',+e.target.value);$('#sDate').onchange=e=>{Pref.set('dateFormat',e.target.value);App.render()};
  $('#sNotif').onchange=async e=>{if(!e.target.checked)return Pref.set('notif',false);
   if(!window.Notification){e.target.checked=false;return toast('This browser does not support notifications.')}
   const p=await Notification.requestPermission();Pref.set('notif',p==='granted');e.target.checked=p==='granted';if(p!=='granted')toast('Notification permission was not granted.')};
  $('#fProf').onsubmit=async e=>{e.preventDefault();try{await Auth.updateProfile({name:$('#pName').value,username:$('#pUser').value.trim(),email:$('#pEmail').value.trim()});Settings.msg('Profile saved.',1);App.render()}catch(x){Settings.msg(x.message)}};
  $('#fPw').onsubmit=async e=>{e.preventDefault();try{await Auth.changePassword($('#pwOld').value,$('#pwNew').value);$('#fPw').reset();Settings.msg('Password updated.',1)}catch(x){Settings.msg(x.message)}};
  $('#outBtn').onclick=()=>{Auth.logout();location.hash='#home';App.render()};
  $('#delAcct').onclick=async()=>{if(await confirmBox('Delete this account and all its habits and history from this browser? This cannot be undone.')){await Auth.deleteAccount();location.hash='#home';App.render();toast('Account deleted')}};
  // Reminders: checked every 30 s while the app is open. They cannot fire when the app is closed.
  const sent={};setInterval(()=>{if(!S.owner||!Pref.get('notif',false)||!window.Notification||Notification.permission!=='granted')return;
   const n=new Date(),hm=pad(n.getHours())+':'+pad(n.getMinutes()),t=todayISO();
   S.habits.forEach(h=>{if(h.reminder===hm&&Habits.scheduled(h,t)&&!Habits.done(h.id,t)&&sent[h.id+t]!==hm){sent[h.id+t]=hm;new Notification('HabitFlow reminder',{body:h.name})}})},30000)}};
