export enum Channel {
  // Electron
  enableFullscreen = "enableFullscreen",
  disableFullscreen = "disableFullscreen",
  isFullscreen = "isFullscreen",
  isMaximized = "isMaximized",
  minimizeApp = "minimizeApp",
  maximizeApp = "maximizeApp",
  restoreApp = "restoreApp",
  restartApp = "restartApp",
  closeApp = "closeApp",
  resetApp = "resetApp",
  getPath = "getPath",
  clearStorageData = "clearStorageData",
  showOpenDialogSync = "showOpenDialogSync",
  openExternal = "openExternal",
  openPath = "openPath",
  showItemInFolder = "showItemInFolder",
  getLogFilePath = "getLogFilePath",

  // Fs
  existsSync = "existsSync",
  isDirectory = "isDirectory",
  isFile = "isFile",

  // Sync
  startSync = "startSync",
  stopSync = "stopSync",
  syncEvent = "syncEvent",

  // Activity
  computeActivity = "computeActivity",
  computeSplits = "computeSplits",
  findActivity = "findActivity",
  findStreams = "findStreams",

  // Profiles
  backupInit = "backupInit",
  backupWriteObj = "backupWriteObj",
  restoreInit = "restoreInit",
  restoreReadObj = "restoreReadObj",

  // Updates
  listUpdates = "listUpdates",
  checkForUpdate = "checkForUpdate",
  updateApp = "updateApp",
  updateDownloadProgress = "updateDownloadProgress",

  // Others
  ipcStorage = "ipcStorage",
  stravaLink = "stravaLink",
  runtimeInfo = "runtimeInfo"
}
