export enum Channel {
  // Electron
  enableFullscreen = "enableFullscreen",
  disableFullscreen = "disableFullscreen",
  isFullscreen = "isFullscreen",
  minimizeApp = "minimizeApp",
  restartApp = "restartApp",
  closeApp = "closeApp",
  resetApp = "resetApp",
  getPath = "getPath",
  clearStorageData = "clearStorageData",
  showOpenDialogSync = "showOpenDialogSync",

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
  findActivity = "findActivity",
  findStreams = "findStreams",

  // Other
  stravaLink = "stravaLink",
  runtimeInfo = "runtimeInfo"
}
