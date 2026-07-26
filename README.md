# Beep-Connect

Beep-Connect is an independent, browser-based acoustic data communication project.
It transfers data between nearby devices using speakers and microphones, without Bluetooth pairing, user accounts, or a central server.

## Current milestone

The first milestone is a reliable text link using four-frequency shift keying (4-FSK):

- transmit UTF-8 text as acoustic symbols
- receive microphone audio in the browser
- detect four carrier frequencies
- display decoded symbols and diagnostics
- run locally with no backend

## Development

```bash
npm install
npm run dev
```

Microphone access requires HTTPS or localhost.

## Cloudflare Pages

Beep-Connect is intended to be hosted on Cloudflare Pages.

Use these project settings:

- Production branch: `main`
- Build command: `npm run build`
- Build output directory: `dist`
- Root directory: `/`

Every push to `main` can deploy automatically through Cloudflare's GitHub integration. See [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

## Project principles

- independent design and implementation
- local-first and server-independent
- documented protocol and test vectors
- portable Web Platform APIs
- reliability before raw bitrate

## License

Mozilla Public License 2.0. See `LICENSE`.
