// Analytics: every number and chart comes from the saved habits and completion records.
const Analytics={
 days(n){const t=todayISO();return Array.from({length:n},(_,i)=>addDays(t,i-n+1))},
 sum(ds){let s=0,c=0;ds.forEach(d=>{const x=Habits.dayStat(d);s+=x.s;c+=x.c});return{s,c,pct:s?Math.round(c/s*100):0}},
 pct(d){const x=Habits.dayStat(d);return x.s?Math.round(x.c/x.s*100):0},
 card:(v,l)=>`<div class="stat"><b>${v}</b><span>${l}</span></div>`,
 render(){const n=+$('#range').value,ds=Analytics.days(n),empty=!S.habits.length;$('#aEmpty').hidden=!empty;$('#aBody').hidden=empty;if(empty)return;
  const tot=Analytics.sum(ds),o=Habits.overall(),w7=Analytics.sum(Analytics.days(7)),m30=Analytics.sum(Analytics.days(30));
  $('#astats').innerHTML=Analytics.card(o.cur,'Current streak')+Analytics.card(o.best,'Best streak')+Analytics.card(w7.pct+'%','Weekly consistency')+Analytics.card(m30.pct+'%','Monthly consistency')+Analytics.card(`${tot.c}/${tot.s}`,'Done in period');
  // 1 daily bar (max 31 most recent days)
  const dd=ds.slice(-31);MiniChart.bar($('#c1'),dd.map(d=>d.slice(8)),dd.map(Analytics.pct));
  // 2 weekday performance
  const wd=[0,1,2,3,4,5,6].map(i=>Analytics.sum(ds.filter(d=>parseISO(d).getDay()===i)).pct);MiniChart.bar($('#c2'),DAYS,wd);
  // 3 trend: per day (<=31), per week (<=90) or per month (1 year)
  const g=n<=31?1:n<=90?7:30,lab=[],val=[];for(let i=0;i<ds.length;i+=g){const ch=ds.slice(i,i+g);lab.push(g===30?ch[0].slice(2,7):ch[0].slice(5));val.push(Analytics.sum(ch).pct)}
  $('#c3t').textContent='Consistency trend ('+(g===1?'daily':g===7?'weekly':'monthly')+' %)';MiniChart.line($('#c3'),lab,val);
  // 4 categories
  const cc={};S.habits.forEach(h=>cc[h.cat]=(cc[h.cat]||0)+1);const ks=Object.keys(cc),pal=['#2563EB','#16A34A','#F59E0B','#DC2626','#7C3AED','#0891B2','#64748B'];
  MiniChart.doughnut($('#c4'),ks.map(k=>cc[k]),pal);$('#c4l').innerHTML=ks.map((k,i)=>`<span><i style="background:${pal[i%7]}"></i>${esc(k)} (${cc[k]})</span>`).join('');
  // habit-wise completed vs missed
  $('#hbars').innerHTML=S.habits.map(h=>{let s=0,c=0;ds.forEach(d=>{if(Habits.scheduled(h,d)){s++;if(Habits.done(h.id,d))c++}});
   return`<div class="item"><div class="t"><b>${esc(h.icon)} ${esc(h.name)}</b><div class="bar" style="margin-top:6px"><i style="width:${s?c/s*100:0}%;background:${esc(h.color)}"></i></div></div><small class="muted">${c} done / ${s-c} missed</small></div>`}).join('');
  // heatmap: 53 weeks ending this week, Sunday first
  const t=todayISO(),start=addDays(t,-364-parseISO(t).getDay()+0);let hm='';
  for(let d=start;d<=t;d=addDays(d,1)){const x=Habits.dayStat(d),p=x.s?x.c/x.s:-1,l=p<0?0:p===0?0:p<.5?1:p<.8?2:p<1?3:4;hm+=`<i class="${l?'l'+l:''}" title="${d}: ${x.s?x.c+'/'+x.s+' done':'nothing scheduled'}"></i>`}
  $('#heat').innerHTML=hm;
  // individual habit
  const sel=$('#oneSel'),cur=sel.value;sel.innerHTML=S.habits.map(h=>`<option value="${h.id}">${esc(h.name)}</option>`).join('');if(S.habits.some(h=>h.id===cur))sel.value=cur;
  Analytics.one()},
 one(){const h=S.habits.find(x=>x.id===$('#oneSel').value);if(!h)return;const ds=Analytics.days(+$('#range').value),s=Habits.streaks(h);let sc=0,c=0;
  ds.forEach(d=>{if(Habits.scheduled(h,d)){sc++;if(Habits.done(h.id,d))c++}});
  $('#oneStats').innerHTML=Analytics.card(s.cur,'Current streak')+Analytics.card(s.best,'Best streak')+Analytics.card(sc?Math.round(c/sc*100)+'%':'-','Completion in period');
  const dd=ds.slice(-31);MiniChart.bar($('#c5'),dd.map(d=>d.slice(8)),dd.map(d=>Habits.scheduled(h,d)?(Habits.done(h.id,d)?100:6):0),{unit:'%'})}};
