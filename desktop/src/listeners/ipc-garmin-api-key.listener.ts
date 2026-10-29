import { IpcListener } from "./ipc-listener.interface";
import { inject, singleton } from "tsyringe";
import { IpcTunnelService } from "@elevate/shared/electron/ipc-tunnel";
import { Channel } from "@elevate/shared/electron/channels.enum";
import { GarminApiClient } from "../clients/garmin-api.client";
import { ErrorSyncEvent } from "@elevate/shared/sync/events/error-sync.event";

export interface GarminApiKeyTestResult {
  valid: boolean;
  message: string;
}

@singleton()
export class IpcGarminApiKeyListener implements IpcListener {
  constructor(@inject(GarminApiClient) private readonly garminApiClient: GarminApiClient) {}

  public startListening(ipcTunnelService: IpcTunnelService): void {
    // Handle garmin personal api key checks from ipc renderer
    ipcTunnelService.on<Array<[string]>, GarminApiKeyTestResult>(Channel.garminTestApiKey, payload => {
      const [apiKey] = payload[0];
      return this.handleTestApiKey(apiKey);
    });
  }

  public handleTestApiKey(apiKey: string): Promise<GarminApiKeyTestResult> {
    return this.garminApiClient
      .testApiKey(apiKey)
      .then(() => ({ valid: true, message: "Garmin personal API key is valid." }))
      .catch((error: ErrorSyncEvent | Error) => ({
        valid: false,
        message: (error as ErrorSyncEvent)?.description || (error as Error)?.message || "Unable to check the key."
      }));
  }
}
