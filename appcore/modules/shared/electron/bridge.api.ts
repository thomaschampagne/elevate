import { ClearStorageDataOptions, IpcRendererEvent, OpenDialogSyncOptions } from "electron";
import { Channel } from "./channels.enum";

export interface BridgeApi {
  // App actions
  minimizeApp: () => Promise<void>;
  maximizeApp: () => Promise<void>;
  unMaximizeApp: () => Promise<void>;
  restoreApp: () => Promise<void>;
  enableFullscreen: () => Promise<void>;
  disableFullscreen: () => Promise<void>;
  closeApp: (force: boolean) => Promise<void>;
  restartApp: () => Promise<void>;
  resetApp: () => Promise<void>;
  invoke: (channel: Channel, ...args: any[]) => Promise<any>;
  receive: (channel: Channel, listener: (event: IpcRendererEvent, ...args: any[]) => void) => void;
  unsubscribe: (channel: Channel) => void;
  openExternal: (path: string) => Promise<void>;
  openPath: (path: string) => Promise<string>;
  showItemInFolder: (path: string) => Promise<void>;

  // File operations
  existsSync: (path: string | URL) => Promise<boolean>;
  isDirectory: (path: string | URL) => Promise<boolean>;
  isFile: (path: string | URL) => Promise<boolean>;

  // Remote electron stuff
  electronVersion: string;
  nodePlatform: string;
  showOpenDialogSync: (options: OpenDialogSyncOptions) => Promise<string[] | undefined>;
  getLogFilePath: () => Promise<string>;
  clearStorageData: (options?: ClearStorageDataOptions) => Promise<void>;
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
  ) => Promise<string>;
}
