// Habit data, schedules, streaks and the add/edit form.
const Habits={
 cats:['Health','Fitness','Education','Productivity','Personal Development','Lifestyle','Other'],  // edit categories here
 icons:['💧','🏃','📚','🧘','💪','🎯','✍️','🍎','😴','🎨'],
 async load(){S.habits=await DB.byOwner('habits',S.owner);S.logs=new Set((await DB.byOwner('logs',S.owner)).map(l=>l.k))},
 key:(id,d)=>`${S.owner}|${id}|${d}`,
 done:(id,d)=>S.logs.has(Habits.key(id,d)),
 async toggle(id,d){const k=Habits.key(id,d);
  if(S.logs.has(k)){S.logs.delete(k);await DB.del('logs',k)}else{S.logs.add(k);await DB.put('logs',{k,owner:S.owner,habitId:id,date:d})}},
 // A habit is scheduled on a date if the date is on/after its start, not inside a pause/archive period, and matches its days.
 scheduled(h,d){if(d<h.start)return false;if((h.off||[]).some(([a,b])=>d>=a&&(!b||d<b)))return false;
  return h.freq==='daily'||(h.days||[]).includes(parseISO(d).getDay())},
 dayStat(d){let s=0,c=0;for(const h of S.habits)if(Habits.scheduled(h,d)){s++;if(Habits.done(h.id,d))c++}return{s,c}},
 // Streak: walk scheduled days only. Unscheduled days are skipped; today being unfinished does not break the streak yet.
 streaks(h){const t=todayISO();let run=0,best=0;
  for(let d=h.start;d<=t;d=addDays(d,1)){if(!Habits.scheduled(h,d))continue;
   if(Habits.done(h.id,d)){run++;best=Math.max(best,run)}else if(d!==t)run=0}
  return{cur:run,best}},
 // Overall streak: consecutive days on which every scheduled habit was completed.
 overall(){if(!S.habits.length)return{cur:0,best:0};const t=todayISO();let run=0,best=0;
  for(let d=S.habits.map(h=>h.start).sort()[0];d<=t;d=addDays(d,1)){const x=Habits.dayStat(d);if(!x.s)continue;
   if(x.c===x.s){run++;best=Math.max(best,run)}else if(d!==t)run=0}
  return{cur:run,best}},
 async save(h){await DB.put('habits',h);const i=S.habits.findIndex(x=>x.id===h.id);i<0?S.habits.push(h):S.habits[i]=h},
 async remove(id){await DB.del('habits',id);S.habits=S.habits.filter(h=>h.id!==id);
  for(const k of[...S.logs])if(k.split('|')[1]===id){S.logs.delete(k);await DB.del('logs',k)}},
 async setStatus(h,st){const t=todayISO(),off=(h.off||[]).slice();
  if(h.status!=='active'&&off.length&&!off[off.length-1][1])off[off.length-1][1]=t;
  if(st!=='active')off.push([t,null]);await Habits.save({...h,status:st,off})},
 // ---- form ----
 openForm(id){const h=S.habits.find(x=>x.id===id)||{},f=$('#hForm');f.dataset.id=id||'';$('#hTitle').textContent=id?'Edit habit':'New habit';
  $('#hName').value=h.name||'';$('#hDesc').value=h.desc||'';$('#hCat').value=h.cat||Habits.cats[0];$('#hFreq').value=h.freq||'daily';
  $('#hTarget').value=h.target||'';$('#hStart').value=h.start||todayISO();$('#hRem').value=h.reminder||'';$('#hColor').value=h.color||'#2563EB';$('#hIcon').value=h.icon||Habits.icons[0];
  $$('#hDays input').forEach(i=>i.checked=(h.days||[]).includes(+i.value));$('#hErr').textContent='';Habits.syncDays();$('#dForm').showModal()},
 syncDays(){const v=$('#hFreq').value;$('#hDays').hidden=v==='daily';$('#hDays').dataset.single=v==='weekly'},
 initForm(){$('#hCat').innerHTML=Habits.cats.map(c=>`<option>${esc(c)}</option>`).join('');
  $('#hIcon').innerHTML=Habits.icons.map(c=>`<option>${c}</option>`).join('');
  $('#hDays').innerHTML=DAYS.map((n,i)=>`<label class="inl"><input type="checkbox" value="${i}">${n}</label>`).join('');
  $('#hFreq').onchange=Habits.syncDays;$('#hCancel').onclick=()=>$('#dForm').close();
  $('#hDays').onchange=e=>{if($('#hFreq').value==='weekly'&&e.target.checked)$$('#hDays input').forEach(i=>i.checked=i===e.target)};
  $('#hForm').onsubmit=async e=>{e.preventDefault();const id=$('#hForm').dataset.id,old=S.habits.find(x=>x.id===id)||{},freq=$('#hFreq').value,name=$('#hName').value.trim();
   const days=$$('#hDays input:checked').map(i=>+i.value),start=$('#hStart').value;let err='';
   if(!name)err='Enter a habit name.';else if(freq!=='daily'&&!days.length)err='Pick at least one day.';else if(!validISO(start))err='Choose a valid start date.';
   if(err){$('#hErr').textContent=err;return}
   try{await Habits.save({status:'active',off:[],created:Date.now(),...old,id:id||uid(),owner:S.owner,name,desc:$('#hDesc').value.trim(),cat:$('#hCat').value,freq,days:freq==='daily'?[0,1,2,3,4,5,6]:days,
     target:$('#hTarget').value.trim(),start,reminder:$('#hRem').value,color:$('#hColor').value,icon:$('#hIcon').value});
    $('#dForm').close();toast(id?'Habit updated':'Habit added');App.render()}catch(x){$('#hErr').textContent='Could not save: '+x.message}}},
 details(h){const s=Habits.streaks(h),n=[...S.logs].filter(k=>k.split('|')[1]===h.id).length;
  $('#infoBody').innerHTML=`<h2>${esc(h.icon)} ${esc(h.name)}</h2><p class="muted">${esc(h.desc||'No description')}</p><p>Category: ${esc(h.cat)}<br>Schedule: ${h.freq==='daily'?'Every day':h.days.map(d=>DAYS[d]).join(', ')}<br>Target: ${esc(h.target||'-')}<br>Started: ${fmtDate(h.start)}<br>Reminder: ${esc(h.reminder||'none')}<br>Status: ${esc(h.status)}</p><p><b>Current streak:</b> ${s.cur} &nbsp; <b>Best:</b> ${s.best} &nbsp; <b>Total completions:</b> ${n}</p>`;$('#dInfo').showModal()},
 // One row used by dashboard and list. Text comes through esc().
 row(h,date,full){const dn=Habits.done(h.id,date),s=Habits.streaks(h),ok=h.status==='active';
  return`<div class="item ${dn?'done':''} ${ok?'':'off'}"><span class="ico" style="background:${esc(h.color)}26">${esc(h.icon)}</span>
  <div class="t"><b>${esc(h.name)}</b><small>${esc(h.cat)}${h.target?' · '+esc(h.target):''} · streak ${s.cur}${ok?'':' · '+esc(h.status)}</small></div>
  ${full?'':`<button class="chk ${dn?'on':''}" data-tog="${h.id}" aria-label="${dn?'Undo':'Mark'} ${esc(h.name)} complete" title="${dn?'Undo completion':'Mark complete'}">${dn?ic('check'):''}</button>`}
  <div class="acts"><button class="btn sm ghost" data-view="${h.id}">Details</button><button class="btn sm ghost" data-edit="${h.id}">Edit</button>
  ${full?`<button class="btn sm ghost" data-pause="${h.id}">${h.status==='active'?'Pause':'Resume'}</button><button class="btn sm ghost" data-arch="${h.id}">${h.status==='archived'?'Restore':'Archive'}</button>`:''}
  <button class="btn sm ghost" data-del="${h.id}">Delete</button></div></div>`},
 // Handles the buttons rendered by row().
 async act(e){const b=e.target.closest('button');if(!b)return;const h=S.habits.find(x=>x.id===(b.dataset.tog||b.dataset.view||b.dataset.edit||b.dataset.pause||b.dataset.arch||b.dataset.del));if(!h)return;
  if(b.dataset.tog){await Habits.toggle(h.id,todayISO())}
  else if(b.dataset.view)return Habits.details(h);else if(b.dataset.edit)return Habits.openForm(h.id);
  else if(b.dataset.pause)await Habits.setStatus(h,h.status==='active'?'paused':'active');
  else if(b.dataset.arch)await Habits.setStatus(h,h.status==='archived'?'active':'archived');
  else if(b.dataset.del){if(!await confirmBox(`Delete "${h.name}" and all its history? This cannot be undone.`))return;await Habits.remove(h.id)}
  App.render()},
 renderList(){const q=$('#q').value.toLowerCase(),c=$('#fcat').value,st=$('#fstat').value,so=$('#fsort').value;
  let l=S.habits.filter(h=>(st==='all'||h.status===st)&&(c==='all'||h.cat===c)&&(h.name+h.desc).toLowerCase().includes(q));
  const rate=h=>{let s=0,c=0;for(let d=h.start;d<=todayISO();d=addDays(d,1))if(Habits.scheduled(h,d)){s++;if(Habits.done(h.id,d))c++}return s?c/s:0};
  l.sort((a,b)=>so==='name'?a.name.localeCompare(b.name):so==='old'?a.created-b.created:so==='rate'?rate(b)-rate(a):b.created-a.created);
  $('#habitList').innerHTML=l.length?l.map(h=>Habits.row(h,todayISO(),true)).join(''):`<div class="empty">${S.habits.length?'No habits match your filters.':'No habits yet. Select "Add New Habit" to start.'}</div>`}};
