
import { BrowserWindow, screen, app } from "electron"
import { AppState } from "./main"
import path from "node:path"
import { SettingsManager } from "./services/SettingsManager"

const isEnvDev = process.env.NODE_ENV === "development"
const isPackaged = app.isPackaged;
const inAppBundle = process.execPath.includes('.app/') || process.execPath.includes('.app\\');

console.log(`[WindowHelper] isEnvDev: ${isEnvDev}, isPackaged: ${isPackaged}, inAppBundle: ${inAppBundle}`);

// Force production mode if running as packaged app or inside app bundle
const isDev = isEnvDev && !isPackaged;

const startUrl = isDev
  ? "http://localhost:5180"
  : `file://${path.join(__dirname, "../../dist/index.html")}`

interface OverlayMonitorInfo {
  id: string
  name: string
  x: number
  y: number
  width: number
  height: number
  scaleFactor: number
  isPrimary: boolean
}

interface OverlayWindowSettingsSnapshot {
  width: number
  height: number
  preferredMonitorId: string | null
  strictPassiveMode: boolean
  userSized: boolean
  minWidth: number
  minHeight: number
  maxWidth: number
  maxHeight: number
}

const OVERLAY_TOP_OFFSET = 54
const OVERLAY_DEFAULT_WIDTH = 900
const OVERLAY_DEFAULT_HEIGHT = 620
const OVERLAY_MIN_WIDTH = 420
const OVERLAY_MIN_HEIGHT = 220
const OVERLAY_MAX_RATIO = 0.95

export class WindowHelper {
  private launcherWindow: BrowserWindow | null = null
  private overlayWindow: BrowserWindow | null = null
  private isWindowVisible: boolean = false
  // Position/Size tracking for Launcher
  private launcherPosition: { x: number; y: number } | null = null
  private launcherSize: { width: number; height: number } | null = null
  // Track current window mode (persists even when overlay is hidden via Cmd+B)
  private currentWindowMode: 'launcher' | 'overlay' = 'launcher'

  private appState: AppState
  private contentProtection: boolean = false
  private opacityTimeout: NodeJS.Timeout | null = null

  // Initialize with explicit number type and 0 value
  private screenWidth: number = 0
  private screenHeight: number = 0

  // Movement variables (apply to active window)
  private step: number = 20
  private currentX: number = 0
  private currentY: number = 0
  private overlayPreferredWidth: number = OVERLAY_DEFAULT_WIDTH
  private overlayPreferredHeight: number = OVERLAY_DEFAULT_HEIGHT
  private overlayPreferredMonitorId: string | null = null
  private strictPassiveMode: boolean = false
  private overlayUserSized: boolean = false

  constructor(appState: AppState) {
    this.appState = appState
    this.loadOverlaySettings()
  }

  private loadOverlaySettings(): void {
    const saved = SettingsManager.getInstance().get('overlayWindow')
    if (!saved) return

    if (typeof saved.width === 'number' && Number.isFinite(saved.width)) {
      this.overlayPreferredWidth = Math.round(saved.width)
    }
    if (typeof saved.height === 'number' && Number.isFinite(saved.height)) {
      this.overlayPreferredHeight = Math.round(saved.height)
    }
    if (typeof saved.preferredMonitorId === 'string') {
      this.overlayPreferredMonitorId = saved.preferredMonitorId
    } else {
      this.overlayPreferredMonitorId = null
    }
    if (typeof saved.strictPassiveMode === 'boolean') {
      this.strictPassiveMode = saved.strictPassiveMode
    }
    if (typeof saved.userSized === 'boolean') {
      this.overlayUserSized = saved.userSized
    }
  }

  private persistOverlaySettings(): void {
    SettingsManager.getInstance().set('overlayWindow', {
      width: this.overlayPreferredWidth,
      height: this.overlayPreferredHeight,
      preferredMonitorId: this.overlayPreferredMonitorId,
      strictPassiveMode: this.strictPassiveMode,
      userSized: this.overlayUserSized
    })
  }

  private getDisplayId(display: Electron.Display): string {
    return String(display.id)
  }

  private getOverlayMonitorsInternal(): OverlayMonitorInfo[] {
    const displays = screen.getAllDisplays()
    const primaryId = this.getDisplayId(screen.getPrimaryDisplay())

    return displays
      .map((display) => ({
        id: this.getDisplayId(display),
        name: display.label || `Display ${display.id}`,
        x: display.workArea.x,
        y: display.workArea.y,
        width: display.workArea.width,
        height: display.workArea.height,
        scaleFactor: display.scaleFactor,
        isPrimary: this.getDisplayId(display) === primaryId
      }))
      .sort((a, b) => {
        if (a.y !== b.y) return a.y - b.y
        return a.x - b.x
      })
  }

  public listOverlayMonitors(): OverlayMonitorInfo[] {
    return this.getOverlayMonitorsInternal()
  }

  private resolveTargetDisplay(preferredId: string | null): Electron.Display {
    const displays = screen.getAllDisplays()
    const primaryDisplay = screen.getPrimaryDisplay()
    if (displays.length === 0) return primaryDisplay

    if (preferredId) {
      const preferred = displays.find((display) => this.getDisplayId(display) === preferredId)
      if (preferred) return preferred
    }

    if (this.overlayWindow && !this.overlayWindow.isDestroyed()) {
      const bounds = this.overlayWindow.getBounds()
      const matchingDisplay = screen.getDisplayMatching(bounds)
      if (matchingDisplay) return matchingDisplay
    }

    return primaryDisplay
  }

  private clampOverlaySize(
    width: number,
    height: number,
    display: Electron.Display
  ): { width: number; height: number } {
    const maxWidth = Math.max(OVERLAY_MIN_WIDTH, Math.floor(display.workArea.width * OVERLAY_MAX_RATIO))
    const maxHeight = Math.max(OVERLAY_MIN_HEIGHT, Math.floor(display.workArea.height * OVERLAY_MAX_RATIO))
    const clampedWidth = Math.min(Math.max(Math.round(width), OVERLAY_MIN_WIDTH), maxWidth)
    const clampedHeight = Math.min(Math.max(Math.round(height), OVERLAY_MIN_HEIGHT), maxHeight)
    return { width: clampedWidth, height: clampedHeight }
  }

  private getOverlayMaxBounds(display: Electron.Display): { maxWidth: number; maxHeight: number } {
    return {
      maxWidth: Math.max(OVERLAY_MIN_WIDTH, Math.floor(display.workArea.width * OVERLAY_MAX_RATIO)),
      maxHeight: Math.max(OVERLAY_MIN_HEIGHT, Math.floor(display.workArea.height * OVERLAY_MAX_RATIO))
    }
  }

  private applyOverlayInteractionMode(): void {
    if (!this.overlayWindow || this.overlayWindow.isDestroyed()) return
    this.overlayWindow.setIgnoreMouseEvents(this.strictPassiveMode, { forward: true })
  }

  private positionOverlayTopCenter(display: Electron.Display, width: number, height: number): void {
    if (!this.overlayWindow || this.overlayWindow.isDestroyed()) return
    const workArea = display.workArea
    const x = Math.floor(workArea.x + (workArea.width - width) / 2)
    const maxY = workArea.y + Math.max(0, workArea.height - height)
    const y = Math.min(workArea.y + OVERLAY_TOP_OFFSET, maxY)
    this.overlayWindow.setBounds({ x, y, width, height })
  }

  public getOverlayWindowSettings(): OverlayWindowSettingsSnapshot {
    const targetDisplay = this.resolveTargetDisplay(this.overlayPreferredMonitorId)
    const bounds = this.overlayWindow && !this.overlayWindow.isDestroyed()
      ? this.overlayWindow.getBounds()
      : { width: this.overlayPreferredWidth, height: this.overlayPreferredHeight }
    const clamped = this.clampOverlaySize(bounds.width, bounds.height, targetDisplay)
    const maxBounds = this.getOverlayMaxBounds(targetDisplay)

    return {
      width: clamped.width,
      height: clamped.height,
      preferredMonitorId: this.overlayPreferredMonitorId,
      strictPassiveMode: this.strictPassiveMode,
      userSized: this.overlayUserSized,
      minWidth: OVERLAY_MIN_WIDTH,
      minHeight: OVERLAY_MIN_HEIGHT,
      maxWidth: maxBounds.maxWidth,
      maxHeight: maxBounds.maxHeight
    }
  }

  public setOverlayMonitorPreference(monitorId: string | null): OverlayWindowSettingsSnapshot {
    const available = this.getOverlayMonitorsInternal()
    const resolvedId = monitorId && available.some((item) => item.id === monitorId) ? monitorId : null
    this.overlayPreferredMonitorId = resolvedId
    this.persistOverlaySettings()

    if (this.currentWindowMode === 'overlay' && this.overlayWindow && !this.overlayWindow.isDestroyed()) {
      const targetDisplay = this.resolveTargetDisplay(this.overlayPreferredMonitorId)
      const current = this.overlayWindow.getBounds()
      const clamped = this.clampOverlaySize(current.width, current.height, targetDisplay)
      this.positionOverlayTopCenter(targetDisplay, clamped.width, clamped.height)
    }

    return this.getOverlayWindowSettings()
  }

  public setOverlayStrictPassiveMode(enabled: boolean): OverlayWindowSettingsSnapshot {
    this.strictPassiveMode = enabled
    this.persistOverlaySettings()
    this.applyOverlayInteractionMode()
    return this.getOverlayWindowSettings()
  }

  public resetOverlayManualSize(): OverlayWindowSettingsSnapshot {
    this.overlayUserSized = false
    this.overlayPreferredWidth = OVERLAY_DEFAULT_WIDTH
    this.overlayPreferredHeight = OVERLAY_DEFAULT_HEIGHT
    this.persistOverlaySettings()
    const targetDisplay = this.resolveTargetDisplay(this.overlayPreferredMonitorId)
    const clamped = this.clampOverlaySize(this.overlayPreferredWidth, this.overlayPreferredHeight, targetDisplay)
    this.overlayPreferredWidth = clamped.width
    this.overlayPreferredHeight = clamped.height
    if (this.overlayWindow && !this.overlayWindow.isDestroyed()) {
      this.positionOverlayTopCenter(targetDisplay, clamped.width, clamped.height)
    }
    this.persistOverlaySettings()
    return this.getOverlayWindowSettings()
  }

  public setContentProtection(enable: boolean): void {
    this.contentProtection = enable
    this.applyContentProtection(enable)
  }

  private applyContentProtection(enable: boolean): void {
    const windows = [this.launcherWindow, this.overlayWindow]
    windows.forEach(win => {
      if (win && !win.isDestroyed()) {
        win.setContentProtection(enable);
      }
    });
  }

  public setWindowDimensions(width: number, height: number): void {
    const activeWindow = this.getMainWindow(); // Gets currently focused/relevant window
    if (!activeWindow || activeWindow.isDestroyed()) return

    const [currentX, currentY] = activeWindow.getPosition()
    const primaryDisplay = screen.getPrimaryDisplay()
    const workArea = primaryDisplay.workAreaSize
    const maxAllowedWidth = Math.floor(workArea.width * 0.9)
    const newWidth = Math.min(width, maxAllowedWidth)
    const newHeight = Math.ceil(height)
    const maxX = workArea.width - newWidth
    const newX = Math.min(Math.max(currentX, 0), maxX)

    activeWindow.setBounds({
      x: newX,
      y: currentY,
      width: newWidth,
      height: newHeight
    })

    // Update internal tracking if it's launcher
    if (activeWindow === this.launcherWindow) {
      this.launcherSize = { width: newWidth, height: newHeight }
      this.launcherPosition = { x: newX, y: currentY }
    }
  }

  public setOverlayDimensions(width: number, height: number): void {
    if (!this.overlayWindow || this.overlayWindow.isDestroyed()) return
    if (this.overlayUserSized) return

    const targetDisplay = this.resolveTargetDisplay(this.overlayPreferredMonitorId)
    const clamped = this.clampOverlaySize(width, height, targetDisplay)
    const [currentX, currentY] = this.overlayWindow.getPosition()
    const workArea = targetDisplay.workArea
    const maxX = workArea.x + Math.max(0, workArea.width - clamped.width)
    const maxY = workArea.y + Math.max(0, workArea.height - clamped.height)
    const nextX = Math.min(Math.max(currentX, workArea.x), maxX)
    const nextY = Math.min(Math.max(currentY, workArea.y), maxY)

    this.overlayWindow.setBounds({
      x: nextX,
      y: nextY,
      width: clamped.width,
      height: clamped.height
    })

    this.overlayPreferredWidth = clamped.width
    this.overlayPreferredHeight = clamped.height
    this.persistOverlaySettings()
  }

  public setOverlayManualDimensions(width: number, height: number): OverlayWindowSettingsSnapshot {
    const targetDisplay = this.resolveTargetDisplay(this.overlayPreferredMonitorId)
    const clamped = this.clampOverlaySize(width, height, targetDisplay)

    this.overlayPreferredWidth = clamped.width
    this.overlayPreferredHeight = clamped.height
    this.overlayUserSized = true
    this.persistOverlaySettings()

    if (this.overlayWindow && !this.overlayWindow.isDestroyed()) {
      const current = this.overlayWindow.getBounds()
      const workArea = targetDisplay.workArea
      const maxX = workArea.x + Math.max(0, workArea.width - clamped.width)
      const maxY = workArea.y + Math.max(0, workArea.height - clamped.height)
      const nextX = Math.min(Math.max(current.x, workArea.x), maxX)
      const nextY = Math.min(Math.max(current.y, workArea.y), maxY)
      this.overlayWindow.setBounds({ x: nextX, y: nextY, width: clamped.width, height: clamped.height })
    }

    return this.getOverlayWindowSettings()
  }

  public createWindow(): void {
    if (this.launcherWindow !== null) return // Already created

    const primaryDisplay = screen.getPrimaryDisplay()
    const workArea = primaryDisplay.workArea
    this.screenWidth = workArea.width
    this.screenHeight = workArea.height

    // Fixed dimensions per user request
    const width = 1200;
    const height = 800;

    // Calculate centered X, and top-centered Y (5% from top)
    const x = Math.round(workArea.x + (workArea.width - width) / 2);
    // Ensure y is at least workArea.y (don't go offscreen top)
    const topMargin = Math.round(workArea.height * 0.05);
    const y = Math.round(workArea.x + topMargin);

    // --- 1. Create Launcher Window ---
    const launcherSettings: Electron.BrowserWindowConstructorOptions = {
      width: width,
      height: height,
      x: x,
      y: y,
      minWidth: 600,
      minHeight: 400,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, "preload.js"),
        scrollBounce: true,
        webSecurity: !isDev, // DEBUG: Disable web security only in dev
      },
      show: false, // DEBUG: Force show -> Fixed white screen, now relies on ready-to-show
      titleBarStyle: 'hiddenInset',
      trafficLightPosition: { x: 14, y: 14 },
      vibrancy: 'under-window',
      visualEffectState: 'followWindow',
      transparent: false, // DEBUG: Disable transparency
      hasShadow: true,
      backgroundColor: "#000000", // Fixed: Black background to match startup sequence
      focusable: true,
      resizable: true,
      movable: true,
      center: true,
      icon: (() => {
        const isMac = process.platform === "darwin";
        const isWin = process.platform === "win32";
        const mode = this.appState.getDisguise();

        if (mode === 'none') {
          if (isMac) {
            return app.isPackaged
              ? path.join(process.resourcesPath, "natively.icns")
              : path.resolve(__dirname, "../../assets/natively.icns");
          } else if (isWin) {
            return app.isPackaged
              ? path.join(process.resourcesPath, "assets/icons/win/icon.ico")
              : path.resolve(__dirname, "../../assets/icons/win/icon.ico");
          } else {
            return app.isPackaged
              ? path.join(process.resourcesPath, "icon.png")
              : path.resolve(__dirname, "../../assets/icon.png");
          }
        }

        // Disguise mode icons
        let iconName = "terminal.png";
        if (mode === 'settings') iconName = "settings.png";
        if (mode === 'activity') iconName = "activity.png";

        const platformDir = isWin ? "win" : "mac";
        return app.isPackaged
          ? path.join(process.resourcesPath, `assets/fakeicon/${platformDir}/${iconName}`)
          : path.resolve(__dirname, `../../assets/fakeicon/${platformDir}/${iconName}`);
      })()
    }

    console.log(`[WindowHelper] Icon Path: ${launcherSettings.icon}`);
    console.log(`[WindowHelper] Start URL: ${startUrl}`);

    try {
      this.launcherWindow = new BrowserWindow(launcherSettings)
      console.log('[WindowHelper] BrowserWindow created successfully');
    } catch (err) {
      console.error('[WindowHelper] Failed to create BrowserWindow:', err);
      return;
    }

    this.launcherWindow.setContentProtection(this.contentProtection)

    this.launcherWindow.loadURL(`${startUrl}?window=launcher`)
      .then(() => console.log('[WindowHelper] loadURL success'))
      .catch((e) => { console.error("[WindowHelper] Failed to load URL:", e) })

    this.launcherWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
      console.error(`[WindowHelper] did-fail-load: ${errorCode} ${errorDescription}`);
    });

    // if (isDev) {
    //   this.launcherWindow.webContents.openDevTools({ mode: 'detach' }); // DEBUG: Open DevTools
    // }

    // --- 2. Create Overlay Window (Hidden initially) ---
    const targetOverlayDisplay = this.resolveTargetDisplay(this.overlayPreferredMonitorId)
    const initialOverlaySize = this.clampOverlaySize(
      this.overlayPreferredWidth,
      this.overlayPreferredHeight,
      targetOverlayDisplay
    )
    this.overlayPreferredWidth = initialOverlaySize.width
    this.overlayPreferredHeight = initialOverlaySize.height
    this.persistOverlaySettings()

    const overlaySettings: Electron.BrowserWindowConstructorOptions = {
      width: initialOverlaySize.width,
      height: initialOverlaySize.height,
      minWidth: OVERLAY_MIN_WIDTH,
      minHeight: OVERLAY_MIN_HEIGHT,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, "preload.js"),
        scrollBounce: true,
      },
      show: false,
      frame: false, // Frameless
      transparent: true,
      backgroundColor: "#00000000",
      alwaysOnTop: true,
      focusable: true,
      resizable: false,
      movable: true,
      skipTaskbar: true, // Don't show separately in dock/taskbar
      hasShadow: false, // Prevent shadow from adding perceived size/artifacts
    }

    this.overlayWindow = new BrowserWindow(overlaySettings)
    this.overlayWindow.setContentProtection(this.contentProtection)

    if (process.platform === "darwin") {
      this.overlayWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })
      this.overlayWindow.setHiddenInMissionControl(true)
      this.overlayWindow.setAlwaysOnTop(true, "floating")
    }

    this.positionOverlayTopCenter(targetOverlayDisplay, initialOverlaySize.width, initialOverlaySize.height)
    this.applyOverlayInteractionMode()

    this.overlayWindow.loadURL(`${startUrl}?window=overlay`).catch(e => {
        console.error('[WindowHelper] Failed to load Overlay URL:', e);
    })

    // --- 3. Startup Sequence ---
    this.launcherWindow.once('ready-to-show', () => {
      this.switchToLauncher()
      this.isWindowVisible = true
    })

    this.setupWindowListeners()
  }

  private setupWindowListeners(): void {
    if (!this.launcherWindow) return

    this.launcherWindow.on("move", () => {
      if (this.launcherWindow) {
        const bounds = this.launcherWindow.getBounds()
        this.launcherPosition = { x: bounds.x, y: bounds.y }
        this.appState.settingsWindowHelper.reposition(bounds)
      }
    })

    this.launcherWindow.on("resize", () => {
      if (this.launcherWindow) {
        const bounds = this.launcherWindow.getBounds()
        this.launcherSize = { width: bounds.width, height: bounds.height }
        this.appState.settingsWindowHelper.reposition(bounds)
      }
    })

    this.launcherWindow.on("closed", () => {
      this.launcherWindow = null
      // If launcher closes, we should probably quit app or close overlay
      if (this.overlayWindow && !this.overlayWindow.isDestroyed()) {
        this.overlayWindow.close()
      }
      this.overlayWindow = null
      this.isWindowVisible = false
    })

    // Listen for overlay close if independent closing acts as "Stop Meeting"
    if (this.overlayWindow) {
      this.overlayWindow.on('close', (e) => {
        // Prevent accidental closing via cmd+w if we want to enforce workflow? 
        // Or treat as end meeting. simpler to treat as hiding for now.
        if (this.isWindowVisible && this.overlayWindow?.isVisible()) {
          e.preventDefault();
          this.switchToLauncher();
          // Notify backend meeting ended? Handled via IPC ideally.
        }
      })
    }
  }

  // Helper to get whichever window should be treated as "Main" for IPC
  public getMainWindow(): BrowserWindow | null {
    if (this.currentWindowMode === 'overlay' && this.overlayWindow) {
      return this.overlayWindow;
    }
    return this.launcherWindow;
  }

  // Specific getters if needed
  public getLauncherWindow(): BrowserWindow | null { return this.launcherWindow }
  public getOverlayWindow(): BrowserWindow | null { return this.overlayWindow }
  public getCurrentWindowMode(): 'launcher' | 'overlay' { return this.currentWindowMode }

  public isVisible(): boolean {
    return this.isWindowVisible
  }

  public hideMainWindow(): void {
    // Hide BOTH
    this.launcherWindow?.hide()
    this.overlayWindow?.hide()
    this.isWindowVisible = false
  }

  public showMainWindow(): void {
    // Show the window corresponding to the current mode
    if (this.currentWindowMode === 'overlay') {
      this.switchToOverlay();
    } else {
      this.switchToLauncher();
    }
  }

  public toggleMainWindow(): void {
    if (this.isWindowVisible) {
      this.hideMainWindow()
    } else {
      this.showMainWindow()
    }
  }

  public toggleOverlayWindow(): void {
    this.toggleMainWindow();
  }

  public centerAndShowWindow(): void {
    // Default to launcher
    this.switchToLauncher();
    this.launcherWindow?.center();
  }

  // --- Swapping Logic ---

  public switchToOverlay(): void {
    console.log('[WindowHelper] Switching to OVERLAY');
    this.currentWindowMode = 'overlay';

    // Show Overlay FIRST
    if (this.overlayWindow && !this.overlayWindow.isDestroyed()) {
      const targetDisplay = this.resolveTargetDisplay(this.overlayPreferredMonitorId)
      const targetSize = this.clampOverlaySize(
        this.overlayPreferredWidth,
        this.overlayPreferredHeight,
        targetDisplay
      )
      this.overlayPreferredWidth = targetSize.width
      this.overlayPreferredHeight = targetSize.height
      this.positionOverlayTopCenter(targetDisplay, targetSize.width, targetSize.height)
      this.applyOverlayInteractionMode()

      if (process.platform === 'win32' && this.contentProtection) {
        // Opacity Shield: Show at 0 opacity first to prevent frame leak
        this.overlayWindow.setOpacity(0);
        this.overlayWindow.show();
        this.overlayWindow.setContentProtection(true);
        // Small delay to ensure Windows DWM processes the flag before making it opaque
        
        if (this.opacityTimeout) clearTimeout(this.opacityTimeout);
        this.opacityTimeout = setTimeout(() => {
          if (this.overlayWindow && !this.overlayWindow.isDestroyed()) {
            this.overlayWindow.setOpacity(1);
            this.overlayWindow.focus();
            this.overlayWindow.setAlwaysOnTop(true, "floating");
          }
        }, 60);
      } else {
        this.overlayWindow.setContentProtection(this.contentProtection);
        this.overlayWindow.show();
        this.overlayWindow.focus();
        this.overlayWindow.setAlwaysOnTop(true, "floating");
      }
      this.isWindowVisible = true;
    }

    // Hide Launcher SECOND
    if (this.launcherWindow && !this.launcherWindow.isDestroyed()) {
      this.launcherWindow.hide();
    }
  }

  public switchToLauncher(): void {
    console.log('[WindowHelper] Switching to LAUNCHER');
    this.currentWindowMode = 'launcher';

    // Show Launcher FIRST
    if (this.launcherWindow && !this.launcherWindow.isDestroyed()) {
      if (process.platform === 'win32' && this.contentProtection) {
        // Opacity Shield: Show at 0 opacity first
        this.launcherWindow.setOpacity(0);
        this.launcherWindow.show();
        this.launcherWindow.setContentProtection(true);
        
        if (this.opacityTimeout) clearTimeout(this.opacityTimeout);
        this.opacityTimeout = setTimeout(() => {
          if (this.launcherWindow && !this.launcherWindow.isDestroyed()) {
            this.launcherWindow.setOpacity(1);
            this.launcherWindow.focus();
          }
        }, 60);
      } else {
        this.launcherWindow.setContentProtection(this.contentProtection);
        this.launcherWindow.show();
        this.launcherWindow.focus();
      }
      this.isWindowVisible = true;
    }

    // Hide Overlay SECOND
    if (this.overlayWindow && !this.overlayWindow.isDestroyed()) {
      this.overlayWindow.hide();
    }
  }

  // Simplified setWindowMode that just calls switchers
  public setWindowMode(mode: 'launcher' | 'overlay'): void {
    if (mode === 'launcher') {
      this.switchToLauncher();
    } else {
      this.switchToOverlay();
    }
  }

  // --- Window Movement (Applies to Overlay mostly, but generalized to active) ---
  private moveActiveWindow(dx: number, dy: number): void {
    const win = this.getMainWindow();
    if (!win) return;

    const [x, y] = win.getPosition();
    win.setPosition(x + dx, y + dy);

    this.currentX = x + dx;
    this.currentY = y + dy;
  }

  public moveWindowRight(): void { this.moveActiveWindow(this.step, 0) }
  public moveWindowLeft(): void { this.moveActiveWindow(-this.step, 0) }
  public moveWindowDown(): void { this.moveActiveWindow(0, this.step) }
  public moveWindowUp(): void { this.moveActiveWindow(0, -this.step) }
}
