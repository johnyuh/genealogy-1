// service-worker.js — OneSpark 星火 安全版快取 v2（排除擴充與下載請求）
const CACHE_NAME = "OneSparkCache-v2";
const FILES_TO_CACHE = [
  "./",
  "./index.html",
  "./email.js",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

self.addEventListener("install", (event) => {
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

self.addEventListener("activate", (event) => {
  console.log("⚙️ [ServiceWorker] Activating...");
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.map((key) => {
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

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // 🚫 排除 chrome-extension 請求
  if (url.protocol === "chrome-extension:") return;

  // 只處理 GET，同源請求；跨域完全放行（避免干擾 CDN / 檔案下載）
  if (event.request.method !== "GET") return;
  if (url.origin !== self.location.origin) return;

  // 🚫 排除下載檔案 (zip, docx, pdf, xlsx, pptx, txt, rar, 7z) 與 /download 路徑
  if (/\.(zip|docx|pdf|xlsx|pptx|txt|rar|7z)$/i.test(url.pathname) || url.pathname.includes("/download")) {
    console.log("⬇️ 跳過下載請求:", url.pathname);
    return;
  }

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(event.request);
      if (cached) {
        // 背景更新（不阻塞回應）
        event.waitUntil(
          fetch(event.request)
            .then((response) => {
              if (response && response.status === 200) {
                cache.put(event.request, response.clone()).catch(() => {});
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
