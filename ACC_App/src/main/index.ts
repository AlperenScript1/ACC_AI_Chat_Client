import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import Store from 'electron-store'

const WINDOW_BOUNDS = {
  minWidth: 800,
  minHeight: 600,
  maxWidth: 1600,
  maxHeight: 1000
} as const

const store = new Store<{ windowBoundsLocked: boolean }>({
  defaults: { windowBoundsLocked: true }
})

function applyWindowBoundsLock(win: BrowserWindow, locked: boolean): void {
  if (locked) {
    win.setMinimumSize(WINDOW_BOUNDS.minWidth, WINDOW_BOUNDS.minHeight)
    win.setMaximumSize(WINDOW_BOUNDS.maxWidth, WINDOW_BOUNDS.maxHeight)
    return
  }

  // Remove constraints: allow free resize.
  win.setMinimumSize(0, 0)
  win.setMaximumSize(0, 0)
}

function createWindow(): void {
  const windowBoundsLocked = store.get('windowBoundsLocked')

  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    ...(windowBoundsLocked
      ? {
          minWidth: WINDOW_BOUNDS.minWidth,
          minHeight: WINDOW_BOUNDS.minHeight,
          maxWidth: WINDOW_BOUNDS.maxWidth,
          maxHeight: WINDOW_BOUNDS.maxHeight
        }
      : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      webviewTag: true
    }
  })

  // Ensure correct runtime constraints before window is shown.
  applyWindowBoundsLock(mainWindow, windowBoundsLocked)

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

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
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  // ACC IPC base (renderer -> main)
  ipcMain.on('acc:new-window', (_event, payload) => {
    console.log('[acc:new-window]', payload)
  })

  ipcMain.on('acc:model-select', (_event, payload) => {
    console.log('[acc:model-select]', payload)
  })

  ipcMain.handle('acc:get-window-bounds-lock', () => {
    return store.get('windowBoundsLocked')
  })

  ipcMain.handle('acc:set-window-bounds-lock', (_event, locked: boolean) => {
    const next = Boolean(locked)
    store.set('windowBoundsLocked', next)
    const win = BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0]
    if (win) applyWindowBoundsLock(win, next)
    return next
  })

  createWindow()

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
