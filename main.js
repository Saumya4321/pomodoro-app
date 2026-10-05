const { app, BrowserWindow, ipcMain, dialog, screen, nativeTheme } = require("electron");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

let cfg = {};
let mainWin = null;
let miniWin = null;

/* ---------- settings saved on this computer ---------- */
const cfgPath = () => path.join(app.getPath("userData"), "config.json");
function loadCfg() {
  try { return JSON.parse(fs.readFileSync(cfgPath(), "utf8")); } catch { return {}; }
}
function saveCfg() {
  try {
    fs.mkdirSync(path.dirname(cfgPath()), { recursive: true });
    fs.writeFileSync(cfgPath(), JSON.stringify(cfg, null, 2));
  } catch (e) { console.error("Couldn't save settings", e); }
}
const miniHeight = () => Math.max(36, Math.min(140, cfg.miniHeight || 60));
const miniWidth = (h) => Math.round(h * 3.2);

/* ---------- windows ---------- */
function createMain() {
  mainWin = new BrowserWindow({
    width: 860,
    height: 940,
    minWidth: 420,
    minHeight: 600,
    title: "Pawmodoro",
    backgroundColor: nativeTheme.shouldUseDarkColors ? "#17131F" : "#F4F0FA",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      backgroundThrottling: false, // keep the timer exact while minimized
    },
  });
  mainWin.loadFile(path.join(__dirname, "renderer", "index.html"));
  mainWin.on("closed", () => {
    mainWin = null;
    if (miniWin) miniWin.close();
  });
}

function createMini() {
  const h = miniHeight(), w = miniWidth(h);
  const area = screen.getPrimaryDisplay().workArea;
  const b = cfg.miniPos || {};
  miniWin = new BrowserWindow({
    width: w,
    height: h,
    x: Number.isFinite(b.x) ? b.x : area.x + area.width - w - 24,
    y: Number.isFinite(b.y) ? b.y : area.y + 24,
    frame: false,
    transparent: true,
    backgroundColor: "#00000000",
    hasShadow: false,
    resizable: false, // size comes from the slider in Settings
    maximizable: false,
    minimizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      backgroundThrottling: false,
    },
  });
  miniWin.setAlwaysOnTop(true, "floating");
  if (process.platform === "darwin") miniWin.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  miniWin.loadFile(path.join(__dirname, "renderer", "mini.html"));
  miniWin.webContents.on("did-finish-load", () => {
    if (miniWin) miniWin.webContents.send("opacity", cfg.miniAlpha ?? 0.55);
  });
  miniWin.on("moved", () => {
    if (!miniWin) return;
    const { x, y } = miniWin.getBounds();
    cfg.miniPos = { x, y };
    saveCfg();
  });
  miniWin.on("closed", () => {
    miniWin = null;
    if (mainWin) mainWin.webContents.send("mini-visible", false);
  });
  if (mainWin) mainWin.webContents.send("mini-visible", true);
}

/* ---------- messages from the windows ---------- */
ipcMain.handle("info", () => ({
  deviceId: cfg.deviceId,
  folder: cfg.syncFolder || null,
  miniAlpha: cfg.miniAlpha ?? 0.55,
  miniHeight: miniHeight(),
}));

ipcMain.handle("choose-folder", async () => {
  const res = await dialog.showOpenDialog(mainWin, {
    title: "Choose a sync folder (e.g. inside OneDrive, Google Drive, Dropbox or iCloud)",
    properties: ["openDirectory", "createDirectory"],
  });
  if (res.canceled || !res.filePaths[0]) return null;
  cfg.syncFolder = res.filePaths[0];
  saveCfg();
  return cfg.syncFolder;
});

ipcMain.handle("read-all", () => {
  const folder = cfg.syncFolder;
  if (!folder) return { folder: null, files: [] };
  try {
    const files = fs.readdirSync(folder)
      .filter((n) => /^pawmodoro-.+\.json$/.test(n))
      .map((n) => {
        try { return JSON.parse(fs.readFileSync(path.join(folder, n), "utf8")); } catch { return null; }
      })
      .filter(Boolean);
    return { folder, files };
  } catch (e) {
    return { folder, files: [], error: String(e) };
  }
});

ipcMain.handle("write-mine", (_e, data) => {
  const folder = cfg.syncFolder;
  if (!folder) return false;
  const safe = { deviceId: cfg.deviceId, days: data && data.days ? data.days : {}, updated: Date.now() };
  fs.writeFileSync(path.join(folder, `pawmodoro-${cfg.deviceId}.json`), JSON.stringify(safe));
  return true;
});

ipcMain.on("toggle-mini", () => (miniWin ? miniWin.close() : createMini()));
ipcMain.on("state", (_e, s) => { if (miniWin) miniWin.webContents.send("state", s); });
ipcMain.on("mini-command", (_e, c) => { if (mainWin) mainWin.webContents.send("mini-command", c); });

ipcMain.on("mini-alpha", (_e, a) => {
  cfg.miniAlpha = Math.max(0, Math.min(1, Number(a) || 0));
  saveCfg();
  if (miniWin) miniWin.webContents.send("opacity", cfg.miniAlpha);
});

ipcMain.on("mini-size", (_e, h) => {
  cfg.miniHeight = Math.max(36, Math.min(140, Math.round(Number(h) || 60)));
  saveCfg();
  if (miniWin) {
    const { x, y } = miniWin.getBounds();
    miniWin.setBounds({ x, y, width: miniWidth(cfg.miniHeight), height: cfg.miniHeight });
  }
});

/* ---------- app lifecycle ---------- */
app.whenReady().then(() => {
  cfg = loadCfg();
  if (!cfg.deviceId) { cfg.deviceId = crypto.randomUUID(); saveCfg(); }
  createMain();
  app.on("activate", () => { if (!mainWin) createMain(); });
});

app.on("window-all-closed", () => app.quit());
