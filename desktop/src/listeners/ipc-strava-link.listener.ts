import { IpcListener } from "./ipc-listener.interface";
import { inject, singleton } from "tsyringe";
import { StravaAuthenticator } from "../connectors/strava/strava-authenticator";
import { IpcTunnelService } from "@elevate/shared/electron/ipc-tunnel";
import { Channel } from "@elevate/shared/electron/channels.enum";

@singleton()
export class IpcStravaLinkListener implements IpcListener {
  constructor(@inject(StravaAuthenticator) private readonly stravaAuthenticator: StravaAuthenticator) {}

  public startListening(ipcTunnelService: IpcTunnelService): void {
    // Handle strava account linking from ipc renderer
    ipcTunnelService.on<
      Array<[number, string, string]>,
      { accessToken: string; refreshToken: string; expiresAt: number; athlete: any }
    >(Channel.stravaLink, payload => {
      const [clientId, clientSecret, refreshToken] = payload[0];
      return this.handleLinkWithStrava(clientId, clientSecret, refreshToken);
    });
  }

  public handleLinkWithStrava(
    clientId: number,
    clientSecret: string,
    refreshToken: string
  ): Promise<{ accessToken: string; refreshToken: string; expiresAt: number; athlete: any }> {
    return refreshToken
      ? this.stravaAuthenticator.refresh(clientId, clientSecret, refreshToken)
      : this.stravaAuthenticator.authorize(clientId, clientSecret);
  }
}
