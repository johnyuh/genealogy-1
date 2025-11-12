// service-worker.js — OneSpark 星火 安全版快取 (排除擴充資源)
const CACHE_NAME = "genealogy-1Cache";
const FILES_TO_CACHE = [
  "./",
  "./index.html",
  "./email.js",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

self.addEventListener("install", event => {
  console.log("🪄 [ServiceWorker] Installing...");
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      for (const url of FILES_TO_CACHE) {
        try {
          await cache.add(url);
          console.log("✅ 已快取:", url);
        } catch (e) {
          console.warn("⚠️ 跳過無法快取的資源:", url, e);
        }
      }
      self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", event => {
  console.log("⚙️ [ServiceWorker] Activating...");
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            console.log("🧹 移除舊快取:", key);
            return caches.delete(key);
          }
        })
      );
      self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", event => {
  // 🧠 排除 chrome-extension 請求
  const url = event.request.url;
  if (url.startsWith("chrome-extension://")) {
    // 完全略過這類請求，不干擾外掛
    return;
  }

  // 只處理 GET 請求
  if (event.request.method !== "GET") return;

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(event.request);
      if (cached) {
        // 嘗試背景更新
        event.waitUntil(
          fetch(event.request)
            .then(response => {
              if (response && response.status === 200) {
                cache.put(event.request, response.clone()).catch(() => {
                  // 忽略擴充資源錯誤
                });
              }
            })
            .catch(() => {})
        );
        return cached;
      }

      try {
        const response = await fetch(event.request);
        if (response && response.status === 200) {
          cache.put(event.request, response.clone()).catch(() => {});
        }
        return response;
      } catch (err) {
        console.warn("🚫 無法從網路取得：", event.request.url);
        return cached || Response.error();
      }
    })()
  );
});

console.log("✨ OneSpark 安全版 Service Worker v2 已啟動（忽略擴充功能請求）。");


