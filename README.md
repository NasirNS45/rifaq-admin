# RIFAQ Admin

The admin is a static React SPA. Build it with `npm ci && npm run build`; deploy the
contents of `dist/` to Cloudflare Pages with `VITE_API_URL` set to the HTTPS API
origin at build time.

The `_redirects` file provides the SPA fallback for deep links. `_headers` keeps the
HTML revalidated while allowing hashed assets to be cached immutably. The repository
Dockerfile is for local Vite development, not production serving.
