import { IpcListener } from "./ipc-listener.interface";
import { inject, singleton } from "tsyringe";
import { IpcStorageService } from "../ipc-storage-service";
import { IpcTunnelService } from "@elevate/shared/electron/ipc-tunnel";
import { Channel } from "@elevate/shared/electron/channels.enum";

@singleton()
export class IpcSharedStorageListener implements IpcListener {
  constructor(@inject(IpcStorageService) private readonly ipcStorage: IpcStorageService) {}

  public startListening(ipcTunnelService: IpcTunnelService): void {
    ipcTunnelService.on<[string], any>(Channel.ipcStorage, payload => {
      const [method, key, value] = payload[0];

      let actionPromise;

      switch (method) {
        case "get":
          actionPromise = this.handleGet(key);
          break;

        case "set":
          actionPromise = this.handleSet(key, value);
          break;

        case "rm":
          actionPromise = this.handleRm(key);
          break;

        default:
          actionPromise = Promise.reject(`Unknown ipc storage method ${method}`);
      }

      return actionPromise;
    });
  }

  private handleGet(key: string): Promise<void> {
    try {
      return Promise.resolve(this.ipcStorage.get(key));
    } catch (err) {
      return Promise.reject(err);
    }
  }

  private handleSet(key: string, value: any): Promise<void> {
    try {
      this.ipcStorage.set(key, value);
      return Promise.resolve();
    } catch (err) {
      return Promise.reject(err);
    }
  }

  private handleRm(key: string): Promise<void> {
    try {
      this.ipcStorage.rm(key);
      return Promise.resolve();
    } catch (err) {
      return Promise.reject(err);
    }
  }
}
