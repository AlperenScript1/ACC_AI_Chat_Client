# 🚀 ACC (AI Chat Client)

**ACC** is a powerful desktop AI web-chat hub built with **Electron + React + TypeScript**. It allows you to manage multiple AI chat providers (ChatGPT, Claude, Gemini, Perplexity, etc.) inside isolated, high-performance tabs. This project focuses on a "Privacy First" approach: it does **not** require API keys. Instead, it embeds official web UIs in secure Electron `webview` containers.

---

## 📺 Feature Showcases

### 🔍 Quick Search & Shortcuts
Easily find and switch between your favorite AI providers with the built-in search bar and customizable shortcuts. Designed for a fast, keyboard-centric workflow.

<img width="882" height="634" alt="Search" src="https://github.com/user-attachments/assets/d461ac00-19ed-40b9-89dd-630fc12d64c7" />

---

### 🛒 Model Market (Store)
Browse a curated list of AI providers, add them to your dashboard with a single click, and manage your "Market" to keep only the tools you need. You can also reorder them via drag-and-drop to personalize your layout.

[BURAYA STORE VİDEOSUNU SÜRÜKLE]

---

### 🔄 Sync Mode
The flagship feature of **ACC**. Write your message once and send it to all active tabs simultaneously. Perfect for comparing answers from ChatGPT, Claude, and Gemini at the same time without repeating yourself.

*   **Efficiency:** Compare different AI models side-by-side.
*   **Automation:** Automatically detects input fields and triggers the "Send" action across providers.

[BURAYA SYNC VİDEOSUNU SÜRÜKLE]

---

## ⚙️ How it Works

*   **Main Process:** Electron window management and IPC handled in `ACC_App/src/main/index.ts`.
*   **Renderer:** Modern UI built with React located in `ACC_App/src/renderer/src/*`.
*   **Isolated Sessions:** Each provider uses a persistent partition (`persist:acc`) to keep sessions and cookies secure on your local machine.
*   **Sync Engine:** Executes lightweight scripts inside webviews to automate prompt delivery across different platforms.

---

## 🛠️ Setup & Commands
```bash
# Install dependencies
cd ACC_App
npm install

# Run in development
npm run dev

# Build for Windows
npm run build:win

# Build for macOS
npm run build:mac

# Build for Linux
npm run build:linux

## License

MIT (see `LICENSE`).
