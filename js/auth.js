// LOCAL accounts only. Passwords are hashed with PBKDF2 (Web Crypto) and a random salt; nothing leaves the browser.
// This is NOT online authentication: it only separates data between people sharing one browser.
const S={owner:null,user:null,habits:[],logs:new Set()};   // current session state used everywhere
const b64=u=>btoa(String.fromCharCode(...u)), unb64=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
const Auth={
 async hash(pw,salt){if(!(window.crypto&&crypto.subtle))throw new Error('Password hashing needs HTTPS or localhost. Open the app with Live Server.');
  const k=await crypto.subtle.importKey('raw',new TextEncoder().encode(pw),'PBKDF2',false,['deriveBits']);
  return b64(new Uint8Array(await crypto.subtle.deriveBits({name:'PBKDF2',salt,iterations:150000,hash:'SHA-256'},k,256)))},
 check(f,{needPw=true}={}){const e=[];
  if(f.name.trim().length<2)e.push('Enter your full name.');
  if(!/^[a-z0-9_]{3,20}$/i.test(f.username))e.push('Username: 3-20 letters, numbers or underscores.');
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email))e.push('Enter a valid email address.');
  if(needPw&&f.pw.length<8)e.push('Password must be at least 8 characters.');
  if(needPw&&f.pw!==f.pw2)e.push('Passwords do not match.');return e},
 async unique(f,exceptId){const all=await DB.all('accounts');
  if(all.some(a=>a.id!==exceptId&&a.username.toLowerCase()===f.username.toLowerCase()))throw new Error('That username is already used on this device.');
  if(all.some(a=>a.id!==exceptId&&a.email===f.email.toLowerCase()))throw new Error('That email is already used on this device.')},
 async register(f){const e=Auth.check(f);if(e.length)throw new Error(e[0]);await Auth.unique(f);
  const salt=crypto.getRandomValues(new Uint8Array(16));
  const a={id:uid(),name:f.name.trim(),username:f.username,email:f.email.toLowerCase(),salt:b64(salt),hash:await Auth.hash(f.pw,salt),created:new Date().toISOString()};
  await DB.put('accounts',a);await Auth.enter(a.id)},
 async login(id,pw){const q=id.trim().toLowerCase(),a=(await DB.all('accounts')).find(x=>x.email===q||x.username.toLowerCase()===q);
  if(!a||(await Auth.hash(pw,unb64(a.salt)))!==a.hash)throw new Error('Incorrect login details.');await Auth.enter(a.id)},
 async enter(owner){Pref.set('session',owner);S.owner=owner;
  S.user=owner==='guest'?{name:'Guest',username:'guest'}:await DB.run('accounts','readonly',o=>o.get(owner));await Habits.load()},
 logout(){Pref.del('session');S.owner=S.user=null;S.habits=[];S.logs=new Set()},
 async changePassword(old,nw){if(nw.length<8)throw new Error('New password must be at least 8 characters.');
  if((await Auth.hash(old,unb64(S.user.salt)))!==S.user.hash)throw new Error('Current password is incorrect.');
  const salt=crypto.getRandomValues(new Uint8Array(16));S.user={...S.user,salt:b64(salt),hash:await Auth.hash(nw,salt)};await DB.put('accounts',S.user)},
 async updateProfile(f){const e=Auth.check(f,{needPw:false});if(e.length)throw new Error(e[0]);await Auth.unique(f,S.user.id);
  S.user={...S.user,name:f.name.trim(),username:f.username,email:f.email.toLowerCase()};await DB.put('accounts',S.user)},
 async deleteAccount(){await DB.delOwner(S.owner);await DB.del('accounts',S.owner);Auth.logout()}};
