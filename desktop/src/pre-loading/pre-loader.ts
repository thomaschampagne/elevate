import { contextBridge, ipcRenderer, IpcRendererEvent, OpenDialogSyncOptions } from "electron";
import { BridgeApi } from "@elevate/shared/electron/bridge.api";
import { Channel } from "@elevate/shared/electron/channels.enum";

const api: BridgeApi = {
  // App actions
  minimizeApp: () => ipcRenderer.invoke(Channel.minimizeApp),
  maximizeApp: () => ipcRenderer.invoke(Channel.maximizeApp),
  restoreApp: () => ipcRenderer.invoke(Channel.restoreApp),
  enableFullscreen: () => ipcRenderer.invoke(Channel.enableFullscreen),
  disableFullscreen: () => ipcRenderer.invoke(Channel.disableFullscreen),
  restartApp: () => ipcRenderer.invoke(Channel.restartApp),
  closeApp: (force: boolean) => ipcRenderer.invoke(Channel.closeApp, force),
  resetApp: () => ipcRenderer.invoke(Channel.resetApp),
  invoke: (channel: Channel, ...args: any[]) => ipcRenderer.invoke(channel, args),
  receive: (channel: Channel, listener: (event: IpcRendererEvent, ...args: any[]) => void) =>
    ipcRenderer.on(channel, listener),
  unsubscribe: (channel: Channel) => ipcRenderer.removeAllListeners(channel),
  openExternal: (path: string) => ipcRenderer.invoke(Channel.openExternal, path),
  openPath: (path: string) => ipcRenderer.invoke(Channel.openPath, path),
  showItemInFolder: (path: string) => ipcRenderer.invoke(Channel.showItemInFolder, path),

  // File operations
  existsSync: (path: string | URL) => ipcRenderer.invoke(Channel.existsSync, path),
  isDirectory: (path: string | URL) => ipcRenderer.invoke(Channel.isDirectory, path),
  isFile: (path: string | URL) => ipcRenderer.invoke(Channel.isFile, path),

  // Remote electron stuff
  electronVersion: process.versions.electron,
  nodePlatform: process.platform,
  showOpenDialogSync: (options: OpenDialogSyncOptions) => ipcRenderer.invoke(Channel.showOpenDialogSync, options),
  getLogFilePath: () => ipcRenderer.invoke(Channel.getLogFilePath),
  clearStorageData: (options?: Electron.ClearStorageDataOptions) =>
    ipcRenderer.invoke(Channel.clearStorageData, options),
  getPath: (
    name:
      | "home"
      | "appData"
      | "userData"
      | "cache"
      | "temp"
      | "exe"
      | "module"
      | "desktop"
      | "documents"
      | "downloads"
      | "music"
      | "pictures"
      | "videos"
      | "recent"
      | "logs"
      | "crashDumps"
  ) => ipcRenderer.invoke(Channel.getPath, name)
};

contextBridge.exposeInMainWorld("api", api);
