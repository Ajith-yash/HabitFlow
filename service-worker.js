// Caches the app shell so HabitFlow opens offline. Habit data lives in IndexedDB, not here.
// Bump VERSION whenever you edit any cached file.
const VERSION='habitflow-v1';
const FILES=['./','index.html','manifest.json','assets/icons/icon.svg','css/style.css','css/mobile.css','libraries/jszip.min.js','libraries/mini-charts.js',
 'js/icons.js','js/utils.js','js/database.js','js/auth.js','js/habits.js','js/analytics.js','js/calendar.js','js/settings.js','js/export.js','js/app.js'];
self.addEventListener('install',e=>e.waitUntil(caches.open(VERSION).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==VERSION).map(x=>caches.delete(x)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;
 e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).catch(()=>caches.match('index.html'))))});
