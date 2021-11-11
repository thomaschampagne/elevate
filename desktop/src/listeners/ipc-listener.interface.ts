import { IpcTunnelService } from "@elevate/shared/electron/ipc-tunnel";

export interface IpcListener {
  startListening(ipcTunnelService: IpcTunnelService): void;
}
