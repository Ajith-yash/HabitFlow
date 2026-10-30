// IndexedDB wrapper. Stores: accounts, habits (owner index), logs (owner index; one row per completed habit/day).
// "owner" is "guest" or a local account id, which keeps data separate.
const DB={db:null,
 open(){return new Promise((ok,bad)=>{if(!window.indexedDB)return bad(new Error('IndexedDB is not available in this browser (private mode?).'));
  const r=indexedDB.open('habitflow',1);
  r.onupgradeneeded=()=>{const d=r.result;d.createObjectStore('accounts',{keyPath:'id'});d.createObjectStore('habits',{keyPath:'id'}).createIndex('owner','owner');d.createObjectStore('logs',{keyPath:'k'}).createIndex('owner','owner')};
  r.onsuccess=()=>{DB.db=r.result;ok()};r.onerror=()=>bad(r.error||new Error('Could not open the local database.'))})},
 run(store,mode,fn){return new Promise((ok,bad)=>{const t=DB.db.transaction(store,mode);const req=fn(t.objectStore(store));t.oncomplete=()=>ok(req&&req.result);t.onerror=()=>bad(t.error);t.onabort=()=>bad(t.error)})},
 all:s=>DB.run(s,'readonly',o=>o.getAll()),
 byOwner:(s,o)=>DB.run(s,'readonly',x=>x.index('owner').getAll(o)),
 put:(s,v)=>DB.run(s,'readwrite',o=>o.put(v)),
 putMany:(s,a)=>DB.run(s,'readwrite',o=>{a.forEach(v=>o.put(v))}),
 del:(s,k)=>DB.run(s,'readwrite',o=>o.delete(k)),
 async delOwner(owner){for(const s of['habits','logs']){const rows=await DB.byOwner(s,owner);await DB.run(s,'readwrite',o=>{rows.forEach(r=>o.delete(r.id||r.k))})}}};
