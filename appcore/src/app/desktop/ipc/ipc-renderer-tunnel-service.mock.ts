import { Channel, IpcMessage, IpcTunnelService } from "@elevate/shared/electron";

export class IpcRendererTunnelServiceMock implements IpcTunnelService {
  public on<T, R>(channel: Channel, request: (param: T) => R | Promise<R> | void | Error): void {}

  public send<T, R>(ipcMessage: IpcMessage): Promise<R> {
    return Promise.resolve(undefined);
  }
}
