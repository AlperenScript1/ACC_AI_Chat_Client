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

<img width="882" height="632" alt="Store   Add AI Model" src="https://github.com/user-attachments/assets/400f062f-4103-4ddd-9f32-f940d7656ee4" />


---

### 🔄 Sync Mode
The flagship feature of **ACC**. Write your message once and send it to all active tabs simultaneously. Perfect for comparing answers from ChatGPT, Claude, and Gemini at the same time without repeating yourself.

*   **Efficiency:** Compare different AI models side-by-side.
*   **Automation:** Automatically detects input fields and triggers the "Send" action across providers.

<img width="888" height="636" alt="Sync" src="https://github.com/user-attachments/assets/983c465f-f71b-4609-aa2f-531355ac6aee" />


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
```
##⚖️ Legal Disclaimer
This project is an unofficial, open-source tool and is not affiliated with, endorsed by, or associated with OpenAI, Anthropic, Google, Perplexity, or any other AI service provider.

* **Browser-Based Wrapper:** ACC operates as a specialized browser (using Electron webview) that renders the official web interfaces of AI providers. It does not provide direct API access or bypass any subscription requirements.

* **Terms of Service:** Users are responsible for complying with the Terms of Service (ToS) of each individual AI provider. The use of automation features (like Sync Mode) is at the user's own risk.

* **Privacy:** ACC does not collect, store, or intercept your login credentials or chat data. All sessions are handled locally on your machine via isolated Electron partitions.

* **Liability:** The developer of ACC is not responsible for any account suspensions, data loss, or other issues resulting from the use of this software.


## License
MIT (see `LICENSE`).
