// Monthly calendar with per-day habit records.
const Cal={m:new Date(),sel:null,
 render(){const y=Cal.m.getFullYear(),mo=Cal.m.getMonth(),ws=+Pref.get('weekStart',0),t=todayISO();
  $('#monthLbl').textContent=Cal.m.toLocaleString(undefined,{month:'long',year:'numeric'});
  let h=[...Array(7)].map((_,i)=>`<div class="h">${DAYS[(i+ws)%7]}</div>`).join('');
  const lead=(new Date(y,mo,1).getDay()-ws+7)%7;h+='<span></span>'.repeat(lead);
  for(let d=1;d<=new Date(y,mo+1,0).getDate();d++){const s=`${y}-${pad(mo+1)}-${pad(d)}`,x=Habits.dayStat(s),fut=s>t;
   const cl=[s===t?'today':'',s===Cal.sel?'sel':'',!fut&&x.s?(x.c===x.s?'p100':x.c?'pmid':'p0'):''].join(' ');
   h+=`<button class="${cl}" data-d="${s}" ${fut?'disabled aria-label="Future date"':''}>${d}</button>`}
  $('#cal').innerHTML=h;Cal.day()},
 day(){const s=Cal.sel;if(!s){$('#dayList').innerHTML='<div class="empty">Select a date to see its habits.</div>';return}
  const l=S.habits.filter(h=>Habits.scheduled(h,s)),x=Habits.dayStat(s);$('#dayTitle').textContent=fmtDate(s)+(x.s?` – ${Math.round(x.c/x.s*100)}% done`:'');
  $('#dayList').innerHTML=l.length?l.map(h=>{const dn=Habits.done(h.id,s);return`<div class="item ${dn?'done':''}"><span class="ico" style="background:${esc(h.color)}26">${esc(h.icon)}</span><div class="t"><b>${esc(h.name)}</b><small>${dn?'Completed':'Missed'}</small></div><button class="chk ${dn?'on':''}" data-ctog="${h.id}" aria-label="Toggle ${esc(h.name)} on ${s}">${dn?ic('check'):''}</button></div>`}).join(''):'<div class="empty">No habits were scheduled on this date.</div>'},
 init(){$('#prevM').onclick=()=>{Cal.m=new Date(Cal.m.getFullYear(),Cal.m.getMonth()-1,1);Cal.render()};
  $('#nextM').onclick=()=>{const n=new Date(Cal.m.getFullYear(),Cal.m.getMonth()+1,1);if(n<=new Date()){Cal.m=n;Cal.render()}else toast('Future months are not available.')};
  $('#cal').onclick=e=>{const b=e.target.closest('[data-d]');if(b){Cal.sel=b.dataset.d;Cal.render()}};
  $('#dayList').onclick=async e=>{const b=e.target.closest('[data-ctog]');if(b){await Habits.toggle(b.dataset.ctog,Cal.sel);Cal.render()}}}};
