// The game that used to be served here registered a service worker at this URL (sw.js?v=…&a=…) that kept the game
// offline. A returning browser updates to this one, which drops those caches and unregisters. Saves (IndexedDB sts2fs,
// localStorage sts2fs:* and sts2fs-j:*) are left as they are.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil((async () => {
  for (const k of await caches.keys()) await caches.delete(k);
  await self.registration.unregister();
})()));
