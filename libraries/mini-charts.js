// Tiny dependency-free canvas charts (bar, line, doughnut) so the app works offline with no CDN.
// You may swap in Chart.js later: put chart.umd.js in this folder and rewrite the calls in js/analytics.js.
const MiniChart=(()=>{
 const css=n=>getComputedStyle(document.documentElement).getPropertyValue(n).trim();
 function setup(c){const d=window.devicePixelRatio||1,w=c.clientWidth,h=c.clientHeight;c.width=w*d;c.height=h*d;const x=c.getContext('2d');x.scale(d,d);x.clearRect(0,0,w,h);x.font='11px Inter,system-ui,sans-serif';return{x,w,h}}
 function frame(c,labels,max,unit){const{x,w,h}=setup(c),L=38,B=22,T=8,R=6,pw=w-L-R,ph=h-B-T;
  x.fillStyle=css('--sec');x.strokeStyle=css('--bd');x.textAlign='right';
  for(let i=0;i<=4;i++){const y=T+ph-ph*i/4;x.beginPath();x.moveTo(L,y);x.lineTo(w-R,y);x.stroke();x.fillText(Math.round(max*i/4)+unit,L-5,y+4)}
  x.textAlign='center';const step=Math.ceil(labels.length/Math.max(1,Math.floor(pw/46)));
  labels.forEach((l,i)=>{if(i%step===0)x.fillText(l,L+pw*(i+.5)/labels.length,h-6)});
  return{x,L,T,pw,ph,n:labels.length,w,h}}
 function bar(c,labels,vals,o={}){const max=o.max||100,u=o.unit??'%',f=frame(c,labels,max,u),bw=Math.max(2,Math.min(30,f.pw/f.n*.65));
  f.x.fillStyle=o.color||css('--blue');vals.forEach((v,i)=>{const bh=f.ph*Math.min(v,max)/max;f.x.fillRect(f.L+f.pw*(i+.5)/f.n-bw/2,f.T+f.ph-bh,bw,bh)})}
 function line(c,labels,vals,o={}){const max=o.max||100,f=frame(c,labels,max,o.unit??'%'),x=f.x;
  x.strokeStyle=css('--blue');x.lineWidth=2;x.beginPath();const P=i=>[f.L+f.pw*(i+.5)/f.n,f.T+f.ph-f.ph*Math.min(vals[i],max)/max];
  vals.forEach((v,i)=>{const[a,b]=P(i);i?x.lineTo(a,b):x.moveTo(a,b)});x.stroke();
  if(f.n<=40){x.fillStyle=css('--blue');vals.forEach((v,i)=>{const[a,b]=P(i);x.beginPath();x.arc(a,b,3,0,7);x.fill()})}}
 function doughnut(c,vals,colors){const{x,w,h}=setup(c),t=vals.reduce((a,b)=>a+b,0),cx=w/2,cy=h/2,r=Math.min(w,h)/2-6;let a=-Math.PI/2;
  vals.forEach((v,i)=>{const e=a+v/t*Math.PI*2;x.beginPath();x.moveTo(cx,cy);x.arc(cx,cy,r,a,e);x.fillStyle=colors[i];x.fill();a=e});
  x.beginPath();x.arc(cx,cy,r*.58,0,7);x.fillStyle=css('--card');x.fill()}
 return{bar,line,doughnut}})();
