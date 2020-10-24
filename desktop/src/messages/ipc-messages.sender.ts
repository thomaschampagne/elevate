import { singleton } from "tsyringe";
import { IpcRequest, PromiseTron, PromiseTronReply } from "promise-tron";
import { FlaggedIpcMessage } from "@elevate/shared/electron";

@singleton()
export class IpcMessagesSender {
  private promiseTron: PromiseTron;

  public configure(ipcMain: Electron.IpcMain, webContents: Electron.WebContents): void {
    this.promiseTron = new PromiseTron(ipcMain, webContents);
  }

  public on(onRequest: (request: IpcRequest, replyWith: (promiseTronReply: PromiseTronReply) => void) => void): void {
    if (!this.promiseTron) {
      throw new Error("IpcMessagesSender must be configured first through configure()");
    }

    this.promiseTron.on(onRequest);
  }

  public send<T>(flaggedIpcMessage: FlaggedIpcMessage): Promise<T> {
    return this.promiseTron.send(flaggedIpcMessage) as Promise<T>;
  }
}
