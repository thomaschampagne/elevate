import { Inject, Injectable } from "@angular/core";
import { ElectronService } from "../electron/electron.service";
import { IpcChannelSub, IpcTunnel, IpcTunnelService } from "@elevate/shared/electron/ipc-tunnel";
import { IpcMessage } from "@elevate/shared/electron/ipc-message";
import { Channel } from "@elevate/shared/electron/channels.enum";

@Injectable()
export class IpcRendererTunnelService implements IpcTunnelService {
  public ipcTunnel: IpcTunnel;

  constructor(@Inject(ElectronService) private readonly electronService: ElectronService) {
    this.ipcTunnel = new IpcTunnel({ bridgeApi: this.electronService.api });
  }

  public on<T, R>(channel: Channel, request: (param: T) => R | Promise<R> | void | Error): IpcChannelSub {
    return this.ipcTunnel.on(channel, request);
  }

  public fwd<T, R>(ipcMessage: IpcMessage): void {
    this.ipcTunnel.fwd(ipcMessage.channel, ipcMessage.payload);
  }

  public send<T, R>(ipcMessage: IpcMessage): Promise<R> {
    return this.ipcTunnel.send(ipcMessage.channel, ipcMessage.payload);
  }
}
