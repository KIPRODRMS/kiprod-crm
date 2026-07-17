const OFFLINE_PAGE = `
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="theme-color" content="#071426">
  <title>KIPROD CRM â€” Offline</title>
  <style>
    body {
      margin: 0;
      min-height: 100vh;
      display: grid;
      place-items: center;
      padding: 24px;
      background: #071426;
      color: white;
      font-family: system-ui, sans-serif;
    }
    main {
      max-width: 420px;
      text-align: center;
    }
    strong {
      color: #f59e0b;
      letter-spacing: .18em;
    }
    p {
      line-height: 1.6;
      color: #cbd5e1;
    }
  </style>
</head>
<body>
  <main>
    <strong>KIPROD CRM</strong>
    <h1>Internet connection required</h1>
    <p>Reconnect to the internet, then open the CRM again. Sensitive CRM records are not stored offline on this device.</p>
  </main>
</body>
</html>
`;

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener(
  "activate",
  (event) => {
    event.waitUntil(
      self.clients.claim()
    );
  }
);

self.addEventListener(
  "fetch",
  (event) => {
    const request = event.request;

    if (request.method !== "GET") {
      return;
    }

    const url = new URL(request.url);

    if (
      url.origin !==
      self.location.origin
    ) {
      return;
    }

    event.respondWith(
      fetch(request).catch(() => {
        if (
          request.mode ===
          "navigate"
        ) {
          return new Response(
            OFFLINE_PAGE,
            {
              status: 503,
              headers: {
                "Content-Type":
                  "text/html; charset=utf-8",
                "Cache-Control":
                  "no-store",
              },
            }
          );
        }

        return new Response("", {
          status: 503,
          statusText: "Offline",
          headers: {
            "Cache-Control":
              "no-store",
          },
        });
      })
    );
  }
);