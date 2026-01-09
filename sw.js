const CACHE_NAME = 'hawk-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/index.tsx',
  'https://cdn.tailwindcss.com',
  'https://esm.sh/react@^19.2.1',
  'https://esm.sh/react-dom@^19.2.1/',
  'https://esm.sh/react@^19.2.1/',
  'https://esm.sh/lucide-react@^0.560.0',
  'https://esm.sh/@supabase/supabase-js@2'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).then((networkResponse) => {
        if (event.request.url.includes('esm.sh') || event.request.url.includes('cdn.tailwindcss.com')) {
           const clone = networkResponse.clone();
           caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return networkResponse;
      });
    }).catch(() => {
        if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
        }
    })
  );
});