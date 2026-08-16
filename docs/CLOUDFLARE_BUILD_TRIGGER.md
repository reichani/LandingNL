# Cloudflare build trigger

This no-op documentation change intentionally triggers a fresh Cloudflare production build for `feat/sprint-0-foundation` after the Workers + OpenNext build configuration was updated.

Expected Cloudflare build command:

```text
npm run build:worker
```

Expected OpenNext output before deploy:

```text
.open-next/worker.js
.open-next/assets
```
