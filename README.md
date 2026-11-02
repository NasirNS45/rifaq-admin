# RIFAQ Admin

The admin is a static React SPA deployed as Cloudflare Workers static assets. Set
`VITE_API_URL` to the HTTPS API origin at build time, then run `npm ci`,
`npm run build`, and `npx wrangler deploy`. Wrangler serves `dist/` and applies the
single-page-app fallback from `wrangler.jsonc`, so client-side routes work on direct
navigation. `public/_headers` revalidates HTML while allowing hashed assets to be
cached immutably.

The repository Dockerfile is for local Vite development, not production serving.

The admin app sends `noindex, nofollow, noarchive` directives in its HTML and
response headers. Keep crawlers able to fetch the app so they can process the
noindex directive; do not block the admin host in `robots.txt`.
