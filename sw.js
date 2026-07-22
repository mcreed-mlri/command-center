/* Training Unit — Command Center
   Caches the app shell so the launcher opens instantly and works offline.
   Bump CACHE when you change the files below. */
const CACHE = "tu-shell-v17";
const SHELL = [
  "./", "index.html", "manifest.webmanifest", "icon.svg",
  "icons/slack.svg", "icons/monday.svg", "icons/otter.svg", "icons/google-drive.svg",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;

  // Network-first for navigations (so edits show up), cache fallback offline.
  if (req.mode === "navigate") {
    e.respondWith(fetch(req).catch(() => caches.match("index.html")));
    return;
  }
  // Cache-first for the shell assets.
  e.respondWith(caches.match(req).then((hit) => hit || fetch(req)));
});
