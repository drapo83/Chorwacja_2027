// Odliczanie — Service Worker
// Zadania: (1) cache offline, (2) wyświetlanie powiadomień lokalnych,
// (3) najlepszy-możliwy background sync (Periodic Background Sync, tylko wybrane przeglądarki).

const CACHE_NAME = "odliczanie-v2";
const CORE_ASSETS = ["./", "./index.html", "./manifest.json", "./icons/icon-192.png", "./icons/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// STRATEGIA: index.html i manifest.json (powłoka aplikacji + konfiguracja) są
// zawsze pobierane najpierw z sieci — dzięki temu każda Twoja edycja pliku
// od razu widoczna jest u wszystkich, którzy mają aplikację zainstalowaną
// i są online. Dopiero offline pokazujemy zapisaną wcześniej kopię.
// Statyczne zasoby (ikony, czcionki) zostają cache-first — szybciej się
// wczytują i nie muszą się odświeżać przy każdej wizycie.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  const isAppShell =
    event.request.mode === "navigate" ||
    url.pathname.endsWith("/index.html") ||
    url.pathname.endsWith("/manifest.json") ||
    url.pathname === "/" || url.pathname.endsWith("/Chorwacja_2027/") || url.pathname.endsWith("/");

  if (isAppShell) {
    event.respondWith(
      fetch(event.request)
        .then((resp) => {
          if (resp && resp.ok) {
            const copy = resp.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return resp;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const network = fetch(event.request)
        .then((resp) => {
          if (resp && resp.ok) {
            const copy = resp.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return resp;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});

// Wspólna logika obliczania, czy należy pokazać przypomnienie.
function computeShouldNotify(state) {
  if (!state || !state.eventDate) return null;
  const now = Date.now();
  const target = new Date(state.eventDate).getTime();
  const msLeft = target - now;
  if (msLeft <= 0) return null;
  const daysLeft = Math.ceil(msLeft / 86400000);
  const cadenceMs = daysLeft <= 7 ? 86400000 : 7 * 86400000;
  const last = state.lastNotifiedAt ? new Date(state.lastNotifiedAt).getTime() : 0;
  if (now - last >= cadenceMs) {
    return { daysLeft, title: state.eventName || "Odliczanie" };
  }
  return null;
}

async function showReminder(state) {
  const info = computeShouldNotify(state);
  if (!info) return false;
  const body =
    info.daysLeft === 0
      ? "To dziś! 🎉"
      : info.daysLeft === 1
      ? "Zostaje już tylko 1 dzień."
      : `Zostało ${info.daysLeft} dni.`;
  await self.registration.showNotification(info.title, {
    body,
    icon: "icons/icon-192.png",
    badge: "icons/icon-192.png",
    tag: "odliczanie-przypomnienie",
    renotify: true,
  });
  return true;
}

// Best-effort: Periodic Background Sync (obsługiwane tylko w części przeglądarek/Android,
// wymaga zainstalowanej aplikacji i nie gwarantuje dokładnego czasu wykonania).
self.addEventListener("periodicsync", (event) => {
  if (event.tag === "odliczanie-check") {
    event.waitUntil(
      self.clients.matchAll({ includeUncontrolled: true }).then(async (clients) => {
        // Stan trzymamy w IndexedDB przez klienta; tu prosimy klienta o dane, jeśli jest otwarty.
        // W trybie w pełni zamkniętej aplikacji polegamy na wartościach zapisanych wcześniej
        // przez stronę w Cache Storage (patrz index.html -> saveStateForSW()).
        const cache = await caches.open(CACHE_NAME);
        const resp = await cache.match("state.json");
        if (resp) {
          const state = await resp.json();
          const notified = await showReminder(state);
          if (notified) {
            state.lastNotifiedAt = new Date().toISOString();
            await cache.put("state.json", new Response(JSON.stringify(state)));
          }
        }
      })
    );
  }
});

// Fallback ręczny: strona może poprosić SW o natychmiastowe sprawdzenie.
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "CHECK_NOW") {
    event.waitUntil(showReminder(event.data.state));
  }
});
