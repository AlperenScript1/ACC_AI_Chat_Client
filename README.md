# ACC (AI Chat Client)

ACC is a **desktop AI web-chat hub** built with **Electron + React + TypeScript**. It lets you open multiple AI chat websites (ChatGPT, Claude, Gemini, Perplexity, etc.) inside isolated tabs, quickly switch between them, and optionally **sync** a single prompt across multiple providers.

This project does **not** ship API keys and does **not** call provider APIs directly. Instead, it embeds the providers’ official web UIs in Electron `webview` containers—so you sign in on each provider’s website as usual.

## What it does

- **Multi-provider dashboard**: open AI chat websites side-by-side (as tabs).
- **Model “market”**: browse a curated catalog, add/remove providers, and pin favorites.
- **Favorites & ordering**: mark providers as favorite and reorder via drag-and-drop.
- **Sync Mode**: write once, send to multiple open webviews (best-effort) to compare answers.
- **Theme & UX**: dark/light mode, animations toggle, quick search shortcut preference.

## How it works (high level)

- **Main process**: Electron window + IPC (`ACC_App/src/main/index.ts`).
- **Renderer**: React UI (`ACC_App/src/renderer/src/*`).
- **Webviews**: each provider is opened in an Electron `webview` with a persistent partition:
  - `partition="persist:acc"` (keeps provider sessions/cookies on the machine).
- **Sync Mode injection**: ACC executes a small script inside each webview to find the chat input, set the message, and trigger send (see `ACC_App/src/renderer/src/lib/syncInjector.ts`).

## Security notes (important)

Publishing this repo as open source is generally fine, but keep these points in mind:

- **Do not commit secrets**: `.env*`, API keys, tokens, signing certificates, update credentials, etc.
- **Embedded webviews are powerful**: Electron `webview` + `executeJavaScript` can increase risk if you allow arbitrary/untrusted URLs. ACC currently embeds known chat provider domains, but any “custom URL” feature would need strict allowlisting.
- **Sessions live on-device**: because the partition is persistent, cookies/sessions are stored locally on the user’s machine. Users should protect their OS account.
- **Auto-update**: the project includes placeholder auto-update config (`ACC_App/dev-app-update.yml`, `ACC_App/electron-builder.yml`). Before shipping real updates, use HTTPS, sign builds appropriately, and host updates securely.

## Getting started (development)

### Requirements

- Node.js (recommended: latest LTS)
- npm (or pnpm/yarn if you adapt scripts)

### Install

```bash
cd ACC_App
npm install
```

### Run in dev mode

```bash
cd ACC_App
npm run dev
```

### Build installers

```bash
cd ACC_App

# Windows
npm run build:win

# macOS
npm run build:mac

# Linux
npm run build:linux
```

## Customizing providers

The built-in catalog lives in:

- `ACC_App/src/renderer/src/components/ModelMarket.tsx`

You can add/edit provider entries (name, URL, icon, description, category).

## Roadmap ideas

- URL allowlist + “custom provider” feature with safer constraints
- Per-provider settings (zoom, user-agent, ad-blocking options, etc.)
- Better Sync Mode adapters per provider (more reliable selectors / fallbacks)
- Export/import provider list and layout

## Contributing

PRs are welcome. If you’re proposing a bigger change, open an issue first describing the goal and the approach.

## License

MIT (see `LICENSE`).
