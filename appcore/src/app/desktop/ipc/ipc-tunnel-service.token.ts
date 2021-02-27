import { InjectionToken } from "@angular/core";
import { IpcTunnelService } from "@elevate/shared/electron";

export const IPC_TUNNEL_SERVICE = new InjectionToken<IpcTunnelService>("IPC_TUNNEL_SERVICE");
