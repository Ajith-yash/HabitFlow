// Export, import (validated), source-code ZIP, and clearing local data.
const SOURCE_FILES=['index.html','manifest.json','service-worker.js','README.md','assets/icons/icon.svg','css/style.css','css/mobile.css','libraries/jszip.min.js','libraries/mini-charts.js',
 'js/icons.js','js/utils.js','js/database.js','js/auth.js','js/habits.js','js/analytics.js','js/calendar.js','js/settings.js','js/export.js','js/app.js'];
const Exp={
 async data(owner){const h=await DB.byOwner('habits',owner),l=await DB.byOwner('logs',owner);
  return{app:'HabitFlow',version:1,exported:new Date().toISOString(),mode:owner==='guest'?'guest':'account',
   habits:h.map(({owner:_,...x})=>x),logs:l.map(x=>({habitId:x.habitId,date:x.date}))}},
 stamp:()=>todayISO(),
 async json(owner,name){saveFile(`habitflow-${name}-${Exp.stamp()}.json`,JSON.stringify(await Exp.data(owner),null,2),'application/json');toast('Backup downloaded')},
 async habitsCsv(){const d=await Exp.data(S.owner);const r=[['Name','Category','Frequency','Days','Start','Target','Reminder','Status','Description']].concat(d.habits.map(h=>[h.name,h.cat,h.freq,h.days.map(x=>DAYS[x]).join(' '),h.start,h.target,h.reminder,h.status,h.desc]));
  saveFile(`habitflow-habits-${Exp.stamp()}.csv`,'\ufeff'+r.map(x=>x.map(csvCell).join(',')).join('\r\n'),'text/csv')},
 async histCsv(){const d=await Exp.data(S.owner),nm=Object.fromEntries(d.habits.map(h=>[h.id,h.name]));
  const r=[['Date','Habit','Completed']].concat(d.logs.sort((a,b)=>a.date<b.date?1:-1).map(l=>[l.date,nm[l.habitId]||'(deleted habit)','Yes']));
  saveFile(`habitflow-history-${Exp.stamp()}.csv`,'\ufeff'+r.map(x=>x.map(csvCell).join(',')).join('\r\n'),'text/csv')},
 // Strict validation: copies only known fields, so malformed files cannot damage existing records.
 validate(j){if(!j||j.app!=='HabitFlow'||!Array.isArray(j.habits)||!Array.isArray(j.logs))throw new Error('This is not a HabitFlow backup file.');
  if(j.habits.length>2000||j.logs.length>200000)throw new Error('The backup is unusually large and was rejected.');
  const ids=new Set(),habits=j.habits.map((h,i)=>{const bad=m=>{throw new Error(`Habit #${i+1}: ${m}`)};
   if(!h||typeof h.id!=='string'||!h.id||h.id.length>80||h.id.includes('|'))bad('invalid id');if(typeof h.name!=='string'||!h.name.trim()||h.name.length>60)bad('invalid name');
   if(!['daily','weekly','custom'].includes(h.freq))bad('invalid frequency');if(!Array.isArray(h.days)||h.days.some(d=>!Number.isInteger(d)||d<0||d>6))bad('invalid days');if(!validISO(h.start))bad('invalid start date');
   ids.add(h.id);const col=/^#[0-9a-f]{6}$/i.test(h.color)?h.color:'#2563EB';
   const off=Array.isArray(h.off)?h.off.filter(p=>Array.isArray(p)&&validISO(p[0])&&(p[1]===null||validISO(p[1]))).map(p=>[p[0],p[1]]):[];
   return{id:h.id,name:h.name.trim(),desc:String(h.desc||'').slice(0,200),cat:Habits.cats.includes(h.cat)?h.cat:'Other',freq:h.freq,days:[...new Set(h.days)],target:String(h.target||'').slice(0,40),start:h.start,
    reminder:/^\d{2}:\d{2}$/.test(h.reminder||'')?h.reminder:'',color:col,icon:Habits.icons.includes(h.icon)?h.icon:Habits.icons[0],status:['active','paused','archived'].includes(h.status)?h.status:'active',off,created:Number(h.created)||Date.now()}});
  const logs=j.logs.filter(l=>l&&ids.has(l.habitId)&&validISO(l.date)).map(l=>({habitId:l.habitId,date:l.date}));return{habits,logs}},
 async import(file){const m=$('#impMsg');m.className='msg';try{if(file.size>10e6)throw new Error('File is larger than 10 MB.');
   const v=Exp.validate(JSON.parse(await file.text()));
   const c=await ask(`Backup contains ${v.habits.length} habits and ${v.logs.length} completion records.`,['Cancel','Merge (keep existing)','Replace all current data']);if(!c){m.textContent='Import cancelled.';return}
   if(c===2){await DB.delOwner(S.owner)}else{const have=new Set(S.habits.map(h=>h.id)),sig=new Set(S.habits.map(h=>h.name.toLowerCase()+'|'+h.start));
    v.habits=v.habits.filter(h=>!have.has(h.id)&&!sig.has(h.name.toLowerCase()+'|'+h.start));const ok=new Set(v.habits.map(h=>h.id));v.logs=v.logs.filter(l=>ok.has(l.habitId))}
   await DB.putMany('habits',v.habits.map(h=>({...h,owner:S.owner})));await DB.putMany('logs',v.logs.map(l=>({k:`${S.owner}|${l.habitId}|${l.date}`,owner:S.owner,habitId:l.habitId,date:l.date})));
   await Habits.load();m.textContent=`Imported ${v.habits.length} habits.`;m.className='msg ok';App.render()}catch(x){m.textContent='Import failed: '+x.message;m.className='msg err'}},
 async zip(){const m=$('#zipMsg');m.textContent='Building ZIP...';try{if(!window.JSZip)throw new Error('ZIP library missing.');const z=new JSZip(),f=z.folder('HabitFlow');
   for(const p of SOURCE_FILES){const r=await fetch(p);if(!r.ok)throw new Error(p+' could not be read. Open HabitFlow through Live Server or a web host, not by double-clicking the file.');f.file(p,await r.blob())}
   saveFile('HabitFlow-source.zip',await z.generateAsync({type:'blob'}));m.textContent='Source ZIP downloaded.'}catch(x){m.textContent=x.message;m.className='msg err'}},
 async clear(){if(!await confirmBox('Delete all habits and history for the current profile from this browser? Export a backup first if unsure.'))return;await DB.delOwner(S.owner);await Habits.load();App.render();toast('Local data cleared')},
 init(){$('#xJson').onclick=()=>Exp.json(S.owner,S.owner==='guest'?'guest':'account');$('#xGuest').onclick=()=>Exp.json('guest','guest');$('#xHab').onclick=Exp.habitsCsv;$('#xHist').onclick=Exp.histCsv;
  $('#imp').onchange=e=>{if(e.target.files[0])Exp.import(e.target.files[0]);e.target.value=''};$('#xZip').onclick=Exp.zip;$('#clearBtn').onclick=Exp.clear}};
