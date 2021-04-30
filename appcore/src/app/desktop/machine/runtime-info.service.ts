import { Inject, Injectable } from "@angular/core";
import { IPC_TUNNEL_SERVICE } from "../ipc/ipc-tunnel-service.token";
import { Channel, IpcMessage, IpcTunnelService, RuntimeInfo } from "@elevate/shared/electron";

@Injectable()
export class RuntimeInfoService {
  constructor(@Inject(IPC_TUNNEL_SERVICE) public readonly ipcTunnelService: IpcTunnelService) {}

  public get(): Promise<RuntimeInfo> {
    return this.ipcTunnelService.send<void, RuntimeInfo>(new IpcMessage(Channel.runtimeInfo));
  }

  public getMachineCredentials(): Promise<{ id: string; key: string }> {
    return this.get().then(info => Promise.resolve({ id: info.athleteMachineId, key: info.athleteMachineKey }));
  }
}
