import { IpcListener } from "./ipc-listener.interface";
import { inject, singleton } from "tsyringe";
import { GarminConnectClient, GarminTokens } from "../connectors/garmin/garmin-connect.client";
import { IpcTunnelService } from "@elevate/shared/electron/ipc-tunnel";
import { Channel } from "@elevate/shared/electron/channels.enum";

@singleton()
export class IpcGarminLinkListener implements IpcListener {
  constructor(@inject(GarminConnectClient) private readonly garminConnectClient: GarminConnectClient) {}

  public startListening(ipcTunnelService: IpcTunnelService): void {
    // Handle garmin account linking from ipc renderer.
    // The password is only used here (main process) to obtain OAuth tokens which
    // are then persisted by the renderer. The password is never stored.
    ipcTunnelService.on<Array<[string, string]>, GarminTokens>(Channel.garminLink, payload => {
      const [username, password] = payload[0];
      return this.handleLinkWithGarmin(username, password);
    });
  }

  public handleLinkWithGarmin(username: string, password: string): Promise<GarminTokens> {
    return this.garminConnectClient.login(username, password);
  }
}
