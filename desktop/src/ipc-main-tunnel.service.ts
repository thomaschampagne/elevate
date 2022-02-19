import { singleton } from "tsyringe";
import { BrowserWindow, IpcMain } from "electron";
import { IpcChannelSub, IpcTunnel, IpcTunnelService } from "@elevate/shared/electron/ipc-tunnel";
import { IpcMessage } from "@elevate/shared/electron/ipc-message";
import { Channel } from "@elevate/shared/electron/channels.enum";

@singleton()
export class IpcMainTunnelService implements IpcTunnelService {
  private ipcTunnel: IpcTunnel;

  public configure(ipcMain: IpcMain, browserWindow?: BrowserWindow): void {
    this.ipcTunnel = new IpcTunnel({ ipcMain: ipcMain, browserWindow: browserWindow });
  }

  public send<T, R>(ipcMessage: IpcMessage): Promise<R> {
    return this.ipcTunnel.send(ipcMessage.channel, ipcMessage.payload);
  }

  public fwd<T, R>(ipcMessage: IpcMessage): void {
    this.ipcTunnel.fwd(ipcMessage.channel, ipcMessage.payload);
  }

  public on<T, R>(channel: Channel, request: (param: T) => R | Promise<R> | void | Error): IpcChannelSub {
    return this.ipcTunnel.on(channel, request);
  }
}
