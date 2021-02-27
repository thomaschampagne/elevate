import { IpcTunnelService } from "@elevate/shared/electron";

export interface IpcListener {
  startListening(ipcTunnelService: IpcTunnelService): void;
}
