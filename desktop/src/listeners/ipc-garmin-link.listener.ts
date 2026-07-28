import { IpcListener } from "./ipc-listener.interface";
import { inject, singleton } from "tsyringe";
import { GarminConnector } from "../connectors/garmin/garmin.connector";
import { IpcTunnelService } from "@elevate/shared/electron/ipc-tunnel";
import { IpcMessage } from "@elevate/shared/electron/ipc-message";
import { Channel } from "@elevate/shared/electron/channels.enum";

/**
 * Main-process counterpart to garmin-connector.service.ts (renderer).
 */
@singleton()
export class IpcGarminLinkListener implements IpcListener {
  private ipcTunnelService: IpcTunnelService;

  constructor(@inject(GarminConnector) private readonly garminConnector: GarminConnector) {}

  public startListening(ipcTunnelService: IpcTunnelService): void {
    this.ipcTunnelService = ipcTunnelService;

    ipcTunnelService.on<Array<[string, string]>, { displayName: string; username: string }>(
      Channel.garminLink,
      payload => {
        const [username, password] = payload[0];
        return this.handleLinkWithGarmin(username, password);
      }
    );
  }

  public async handleLinkWithGarmin(
    username: string,
    password: string
  ): Promise<{ displayName: string; username: string }> {
    // IpcTunnelService.send() is symmetric: calling it from the main-process
    // side pushes a message to the renderer and awaits its response, the
    // same mechanism Strava/File connectors use in the other direction.
    // Here it's how a mid-login MFA challenge in garmin_sync.py gets
    // surfaced as a live prompt in the Garmin connector form.
    const onMfaRequired = (): Promise<string> =>
      this.ipcTunnelService.send<unknown[], string>(new IpcMessage(Channel.garminMfaRequest));

    const info = await this.garminConnector.authenticate(username, password, onMfaRequired);
    return { displayName: info.garminAccount?.displayName, username: info.username };
  }
}
