
const CACHE_NAME = 'isma-pwa-v2.5';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  // Librairies externes critiques pour le mode offline
  'https://cdn.tailwindcss.com',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  // Images utilisées (Icons)
  'https://cdn-icons-png.flaticon.com/512/2083/2083260.png'
];

// 1. INSTALLATION : Mise en cache immédiate des ressources critiques (App Shell)
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Mise en cache des fichiers critiques');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  // Force l'activation immédiate du nouveau SW sans attendre la fermeture des onglets
  self.skipWaiting();
});

// 2. ACTIVATION : Nettoyage des anciens caches pour libérer de l'espace
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Suppression ancien cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Prend le contrôle de la page immédiatement
  self.clients.claim();
});

// 3. FETCH : Interception des requêtes
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // A. Stratégie pour les API (Network Only avec fallback JSON)
  // On ne cache JAMAIS les appels API vers Gemini ou Kobo pour éviter les données périmées
  if (url.hostname.includes('googleapis.com') || url.hostname.includes('kobotoolbox.org')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return new Response(JSON.stringify({ error: 'offline', message: 'Pas de connexion internet' }), {
          headers: { 'Content-Type': 'application/json' }
        });
      })
    );
    return;
  }

  // B. Stratégie pour les Assets Statiques (Cache First, Network Fallback)
  // Pour les images, CSS, JS, et le HTML principal : on sert le cache en priorité pour la vitesse
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      // Si pas dans le cache, on va chercher sur le réseau
      return fetch(event.request).then((networkResponse) => {
        // On vérifie si la réponse est valide
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic' && networkResponse.type !== 'cors') {
          return networkResponse;
        }

        // On met en cache la nouvelle ressource pour la prochaine fois
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      }).catch(() => {
        // Si réseau échoue et pas de cache (ex: nouvelle page hors ligne)
        // On pourrait renvoyer une page "Offline" générique ici si elle existait
        if (event.request.headers.get('accept').includes('text/html')) {
             return caches.match('/index.html'); // Fallback sur l'index pour les SPA
        }
      });
    })
  );
});
