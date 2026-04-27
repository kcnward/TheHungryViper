# The Hungry Viper

Waitlist page with optional **Solid** sign-in. When signed in (Solid Community), form submissions are saved as Turtle files under `hungry-viper-waitlist/` in your pod.

## Develop

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173/` with this project’s relative `base`).

## Publish (GitHub Pages)

The static site is built into the `docs/` folder.

```bash
npm run build
```

Commit and push `docs/` (and source changes). GitHub Pages should use **main** branch, **/docs** folder.

Identity provider is set to **https://solidcommunity.net** in `src/main.ts` (`OIDC_ISSUER`).
