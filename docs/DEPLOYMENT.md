# Cloudflare Pages deployment

Beep-Connect is deployed as a static Vite application on Cloudflare Pages.

## Git integration

1. Open **Workers & Pages** in the Cloudflare dashboard.
2. Create a Pages project and connect GitHub.
3. Select `sakusdev/Beep-Connect`.
4. Configure the build:

| Setting | Value |
| --- | --- |
| Production branch | `main` |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | `/` |

No server-side runtime or environment variables are required for the current prototype.

Every push to `main` creates a production deployment. Pull-request branches can be deployed as preview environments.

## Browser requirements

Microphone access requires a secure context. Cloudflare Pages serves deployments over HTTPS, so the browser can request microphone permission normally.

The `public/_headers` file is copied into `dist` by Vite and configures security, microphone permissions, and long-lived caching for hashed assets.

## Local production preview

```bash
npm install
npm run build
npm run preview
```
