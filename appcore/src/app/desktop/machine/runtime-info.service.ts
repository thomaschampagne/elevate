import { Inject, Injectable } from "@angular/core";
import { IPC_TUNNEL_SERVICE } from "../ipc/ipc-tunnel-service.token";
import { RuntimeInfo } from "@elevate/shared/electron/runtime-info";
import { IpcMessage } from "@elevate/shared/electron/ipc-message";
import { IpcTunnelService } from "@elevate/shared/electron/ipc-tunnel";
import { Channel } from "@elevate/shared/electron/channels.enum";

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
