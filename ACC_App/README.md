# ACC App (Electron)

This folder contains the Electron + React application for **ACC (AI Chat Client)**.

If you’re browsing the repository on GitHub, start with the root `README.md` for a full overview (features, security notes, how Sync Mode works, etc.).

## Tech stack

- Electron (main + preload)
- React + TypeScript (renderer)
- electron-vite
- Tailwind CSS
- Zustand (state)
- dnd-kit (drag & drop)

## Recommended IDE setup

- [VS Code](https://code.visualstudio.com/) + ESLint + Prettier

## Project setup

### Install

```bash
npm install
```

### Development

```bash
npm run dev
```

### Build

```bash
# Windows
npm run build:win

# macOS
npm run build:mac

# Linux
npm run build:linux
```

## Notes

- The app uses persistent webview sessions via `partition="persist:acc"`.
- Sync Mode injects scripts into provider webviews (best-effort) to set the message and press send.
