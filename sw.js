/* Training Unit — Command Center
   Caches the app shell so the launcher opens instantly and works offline.
   Bump CACHE when you change the files below. */
const CACHE = "tu-shell-v11";
const SHELL = [
  "./", "index.html", "manifest.webmanifest", "icon.svg",
  "icons/slack.svg", "icons/monday.svg", "icons/otter.svg", "icons/google-drive.svg",
];
const CAL_ICAL =
  "https://calendar.google.com/calendar/ical/c_a03387b3d278ec6cca7f881b6ca65357f410c3275ab231afbd80ba2d1815b87b%40group.calendar.google.com/public/basic.ics";

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

  const url = new URL(req.url);
  if (url.pathname.endsWith("/cal-feed")) {
    const feed = url.searchParams.get("src") || CAL_ICAL;
    e.respondWith(fetch(feed).catch(() => Response.error()));
    return;
  }

  // Network-first for navigations (so edits show up), cache fallback offline.
  if (req.mode === "navigate") {
    e.respondWith(fetch(req).catch(() => caches.match("index.html")));
    return;
  }
  // Cache-first for the shell assets.
  e.respondWith(caches.match(req).then((hit) => hit || fetch(req)));
});
