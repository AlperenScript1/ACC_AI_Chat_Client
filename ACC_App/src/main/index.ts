import { app, shell, BrowserWindow, ipcMain, globalShortcut, session } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import Store from 'electron-store'
import fs from 'fs'

const WINDOW_BOUNDS = {
  minWidth: 800,
  minHeight: 600
} as const

// Force Chromium caches into userData to avoid Windows permission/lock issues
// (especially common in dev + webview partitions)
try {
  const userData = app.getPath('userData')
  app.commandLine.appendSwitch('disk-cache-dir', join(userData, 'DiskCache'))
  app.commandLine.appendSwitch('gpu-disk-cache-dir', join(userData, 'GpuCache'))
  app.commandLine.appendSwitch('disable-gpu-shader-disk-cache')
} catch {
  // ignore
}

// --- Store schema & initialization ---
const schema = {
  settings: {
    type: 'object',
    properties: {
      language: { type: 'string', default: 'tr' },
      homeHotkey: { type: 'string', default: 'Ctrl+H' },
      windowBoundsLocked: { type: 'boolean', default: true },
      theme: { type: 'string', default: 'dark' },
      animationsEnabled: { type: 'boolean', default: true },
      searchShortcut: { type: 'string', default: 'Ctrl+F' },
      /** Minutes until model sleep; 0 = disabled. Negative = seconds (e.g. -5 for tests). */
      autoCloseTimeout: { type: 'number', default: 30 },
      /** Settings panel UI: en | tr (more later) */
      settingsUiLocale: { type: 'string', default: 'en' }
    },
    default: {
      language: 'tr',
      homeHotkey: 'Ctrl+H',
      windowBoundsLocked: true,
      theme: 'dark',
      animationsEnabled: true,
      searchShortcut: 'Ctrl+F',
      autoCloseTimeout: 30,
      settingsUiLocale: 'en'
    }
  },
  models: {
    type: 'array',
    default: [],
    items: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        url: { type: 'string' },
        icon: { type: 'string' },
        isFavorite: { type: 'boolean', default: false },
        lastActive: { type: 'number', default: 0 },
        isAsleep: { type: 'boolean', default: false }
      }
    }
  },
  chatHistory: {
    type: 'array',
    default: []
  }
} as const

let store: Store<any>

const ALLOWED_STORE_KEYS = ['settings', 'models', 'chatHistory'] as const
type StoreKey = (typeof ALLOWED_STORE_KEYS)[number]

function isAllowedKey(key: unknown): key is StoreKey {
  return typeof key === 'string' && ALLOWED_STORE_KEYS.includes(key as StoreKey)
}

// --- Config recovery detection ---
// electron-store default path: `${app.getPath('userData')}/config.json`
let configWasRecreated = false

// --- Global shortcut registration ---
let currentAccelerator: string | null = null

const VALID_ACCELERATOR_REGEX =
  /^(CommandOrControl|Alt|Shift|Command|Control)(\+(CommandOrControl|Alt|Shift|[A-Z0-9]|F[1-9]|F1[0-2]))+$/i

function toAccelerator(hotkey: string): string | null {
  const acc = hotkey
    .replace(/ctrl/i, 'CommandOrControl')
    .replace(/cmd/i, 'CommandOrControl')
    .replace(/\s/g, '')

  if (!VALID_ACCELERATOR_REGEX.test(acc)) {
    console.warn('[Shortcut] Invalid accelerator rejected:', acc)
    return null
  }
  return acc
}

function registerHomeShortcut(win: BrowserWindow, hotkey: string) {
  if (currentAccelerator) {
    globalShortcut.unregister(currentAccelerator)
    currentAccelerator = null
  }

  const acc = toAccelerator(hotkey)
  if (!acc) return // silently reject invalid combos

  try {
    const success = globalShortcut.register(acc, () => {
      win.webContents.send('navigate-home')
    })
    if (!success) {
      console.warn('[Shortcut] Registration failed (key in use?):', acc)
      return
    }
    currentAccelerator = acc
  } catch (err) {
    console.error('[Shortcut] Unexpected error registering shortcut:', err)
  }
}

let mainWindow: BrowserWindow | null = null

function applyWindowBoundsLock(win: BrowserWindow, locked: boolean): void {
  if (locked) {
    win.setMinimumSize(WINDOW_BOUNDS.minWidth, WINDOW_BOUNDS.minHeight)
    // No max constraints: user can freely enlarge the window.
    win.setMaximumSize(0, 0)
    return
  }

  // Remove constraints: allow free resize.
  win.setMinimumSize(0, 0)
  win.setMaximumSize(0, 0)
}

function createWindow(): void {
  const settings = store.get('settings') as { windowBoundsLocked: boolean; homeHotkey: string }
  const windowBoundsLocked = Boolean(settings?.windowBoundsLocked)

  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    ...(windowBoundsLocked
      ? {
          minWidth: WINDOW_BOUNDS.minWidth,
          minHeight: WINDOW_BOUNDS.minHeight
        }
      : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      experimentalFeatures: false,
      webviewTag: true
    }
  })

  mainWindow.webContents.on('will-navigate', (event, url) => {
    const appURL = is.dev
      ? process.env['ELECTRON_RENDERER_URL']
      : `file://${join(__dirname, '../renderer/index.html')}`

    if (!url.startsWith(appURL ?? '')) {
      event.preventDefault()
      console.warn('[Security] Blocked navigation to:', url)
    }
  })

  // Ensure correct runtime constraints before window is shown.
  applyWindowBoundsLock(mainWindow, windowBoundsLocked)

  // Show window only after it is ready to avoid visual flash
  mainWindow.once('ready-to-show', () => mainWindow?.show())

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  // Load initial hotkey from store and register it
  const hotkey = (settings?.homeHotkey ?? 'Ctrl+H') as string
  registerHomeShortcut(mainWindow, hotkey)
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Initialize electron-store after app is ready (important on Windows)
  const configPath = join(app.getPath('userData'), 'config.json')
  const configExisted = fs.existsSync(configPath)

  try {
    store = new Store({ schema })
    if (!configExisted) {
      configWasRecreated = true
      console.warn('[Config] config.json was missing — recreated with defaults')
    }
  } catch (err) {
    console.error('[Config] config.json is corrupt — deleting and recreating:', err)
    try {
      fs.unlinkSync(configPath)
    } catch {
      // ignore
    }
    store = new Store({ schema })
    configWasRecreated = true
  }

  // Ensure cache lives under userData (avoids Windows permission issues)
  app.setPath('cache', join(app.getPath('userData'), 'Cache'))

  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const csp = is.dev
      ? [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' data: https:",
          "font-src 'self' data:",
          "connect-src 'self' http://localhost:* ws://localhost:* https:",
          "object-src 'none'",
          "frame-src 'none'",
          "base-uri 'self'"
        ].join('; ')
      : [
          "default-src 'self'",
          "script-src 'self'",
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' data: https:",
          "font-src 'self' data:",
          "connect-src 'self' https:",
          "object-src 'none'",
          "frame-src 'none'",
          "base-uri 'self'",
          'upgrade-insecure-requests'
        ].join('; ')

    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [csp]
      }
    })
  })

  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // Optional dev-only IPC debug (do not log in production)
  if (is.dev) {
    ipcMain.on('ping', () => console.log('pong'))
    ipcMain.on('acc:new-window', (_event, payload) => {
      console.log('[acc:new-window]', payload)
    })
    ipcMain.on('acc:model-select', (_event, payload) => {
      console.log('[acc:model-select]', payload)
    })
  }

  ipcMain.handle('acc:get-window-bounds-lock', () => {
    const settings = store.get('settings') as { windowBoundsLocked?: boolean }
    return Boolean(settings?.windowBoundsLocked)
  })

  ipcMain.handle('acc:set-window-bounds-lock', (_event, locked: boolean) => {
    const next = Boolean(locked)
    const prev = (store.get('settings') as Record<string, unknown> | undefined) ?? {}
    store.set('settings', { ...prev, windowBoundsLocked: next })
    const win = BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0]
    if (win) applyWindowBoundsLock(win, next)
    return next
  })

  // --- IPC Handlers (electron-store bridge) ---
  ipcMain.handle('get-store-data', (_event, key?: string) => {
    if (key !== undefined && !isAllowedKey(key)) {
      console.warn('[IPC] Rejected unknown store key:', key)
      return null
    }
    return key ? store.get(key) : store.store
  })

  ipcMain.handle('set-store-data', (_event, key: string, value: unknown) => {
    if (!isAllowedKey(key)) {
      console.warn('[IPC] Rejected write to unknown key:', key)
      return false
    }
    if (value === undefined || value === null) {
      console.warn('[IPC] Rejected null/undefined value for key:', key)
      return false
    }
    store.set(key, value)

    // Re-register hotkey if settings changed
    if (key === 'settings' && typeof value === 'object') {
      const s = value as { homeHotkey?: string; windowBoundsLocked?: boolean }
      if (typeof s?.windowBoundsLocked === 'boolean') {
        const win = BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0]
        if (win) applyWindowBoundsLock(win, s.windowBoundsLocked)
      }
      if (s?.homeHotkey && mainWindow) {
        registerHomeShortcut(mainWindow, s.homeHotkey)
      }
    }
    return true
  })

  let resetCooldown = false
  ipcMain.handle('reset-store', () => {
    if (resetCooldown) {
      console.warn('[IPC] reset-store called too rapidly, ignored')
      return false
    }
    resetCooldown = true
    setTimeout(() => {
      resetCooldown = false
    }, 5000)
    store.clear()
    return true
  })

  let quitCooldown = false
  ipcMain.on('quit-app', () => {
    if (quitCooldown) return
    quitCooldown = true
    setTimeout(() => {
      quitCooldown = false
    }, 5000)
    app.quit()
  })

  // --- Config recovery status (shown once per session) ---
  ipcMain.handle('was-config-recreated', () => {
    return configWasRecreated
  })

  ipcMain.handle('acknowledge-config-recreated', () => {
    configWasRecreated = false
    return true
  })

  createWindow()

  // Unregister all shortcuts when app closes
  app.on('will-quit', () => globalShortcut.unregisterAll())

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
