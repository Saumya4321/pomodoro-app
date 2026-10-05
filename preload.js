const { contextBridge, ipcRenderer } = require("electron");

// The only bridge between the app's pages and the computer.
contextBridge.exposeInMainWorld("pawAPI", {
  info: () => ipcRenderer.invoke("info"),
  chooseFolder: () => ipcRenderer.invoke("choose-folder"),
  readAll: () => ipcRenderer.invoke("read-all"),
  writeMine: (data) => ipcRenderer.invoke("write-mine", data),
  toggleMini: () => ipcRenderer.send("toggle-mini"),
  sendState: (s) => ipcRenderer.send("state", s),
  miniCommand: (c) => ipcRenderer.send("mini-command", c),
  setMiniAlpha: (a) => ipcRenderer.send("mini-alpha", a),
  setMiniSize: (h) => ipcRenderer.send("mini-size", h),
  onState: (fn) => ipcRenderer.on("state", (_e, s) => fn(s)),
  onOpacity: (fn) => ipcRenderer.on("opacity", (_e, a) => fn(a)),
  onMiniCommand: (fn) => ipcRenderer.on("mini-command", (_e, c) => fn(c)),
  onMiniVisible: (fn) => ipcRenderer.on("mini-visible", (_e, v) => fn(v)),
});
