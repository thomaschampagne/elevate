import { Inject, Injectable } from "@angular/core";
import { Subject } from "rxjs";
import { DesktopSyncService } from "../../../shared/services/sync/impl/desktop-sync.service";
import { SyncService } from "../../../shared/services/sync/sync.service";
import { ConnectorService } from "../connector.service";
import { IPC_TUNNEL_SERVICE } from "../../ipc/ipc-tunnel-service.token";
import { IpcTunnelService } from "@elevate/shared/electron/ipc-tunnel";
import { IpcMessage } from "@elevate/shared/electron/ipc-message";
import { ConnectorType } from "@elevate/shared/sync/connectors/connector-type.enum";
import { Channel } from "@elevate/shared/electron/channels.enum";
import { GarminConnectorInfo } from "@elevate/shared/sync/connectors/garmin-connector-info.model";
import { GarminConnectorInfoService } from "../../../shared/services/garmin-connector-info/garmin-connector-info.service";
import { GarminAccount } from "@elevate/shared/sync/garmin/garmin-account";

/**
 * Renderer-side counterpart to ipc-garmin-link.listener.ts
 * All the actual Garmin auth work happens in the main process;
 * this service just relays over IPC and persists the result the same way StravaConnectorService does.
 */
@Injectable()
export class GarminConnectorService extends ConnectorService {
  /**
   * Emits when the main process (mid-login, via garmin_sync.py) needs an MFA
   * code. GarminConnectorComponent subscribes to show the code input; once
   * the user submits, call submitMfaCode() to unblock the pending IPC
   * response (which unblocks the main process's onMfaRequired() promise,
   * which unblocks garmin_sync.py's stdin read).
   */
  public mfaRequested$ = new Subject<void>();

  private pendingMfaResolve: ((code: string) => void) | null = null;

  constructor(
    @Inject(IPC_TUNNEL_SERVICE) public readonly ipcTunnelService: IpcTunnelService,
    @Inject(GarminConnectorInfoService) public readonly garminConnectorInfoService: GarminConnectorInfoService,
    @Inject(SyncService) private readonly desktopSyncService: DesktopSyncService
  ) {
    super();

    this.ipcTunnelService.on<unknown[], string>(Channel.garminMfaRequest, () => {
      return new Promise<string>(resolve => {
        this.pendingMfaResolve = resolve;
        this.mfaRequested$.next();
      });
    });
  }

  /** Called by GarminConnectorComponent once the user submits the MFA code. */
  public submitMfaCode(code: string): void {
    if (this.pendingMfaResolve) {
      this.pendingMfaResolve(code);
      this.pendingMfaResolve = null;
    }
  }

  public fetch(): Promise<GarminConnectorInfo> {
    return this.garminConnectorInfoService.fetch();
  }

  public authenticate(password: string, mfaCode?: string): Promise<GarminConnectorInfo> {
    let garminConnectorInfo: GarminConnectorInfo = null;
    return this.fetch()
      .then((garminConnectorInfoFetched: GarminConnectorInfo) => {
        garminConnectorInfo = garminConnectorInfoFetched;

        const ipcMessage = new IpcMessage(Channel.garminLink, garminConnectorInfo.username, password, mfaCode);
        return this.ipcTunnelService.send<IpcMessage, { displayName: string; username: string; profileId: number }>(
          ipcMessage
        );
      })
      .then(result => {
        garminConnectorInfo.username = result.username;
        garminConnectorInfo.garminAccount = new GarminAccount(result.displayName, result.displayName, result.profileId);
        return this.garminConnectorInfoService.update(garminConnectorInfo);
      })
      .catch(error => {
        return Promise.reject(error);
      });
  }

  public sync(fastSync: boolean = null, forceSync: boolean = null): Promise<void> {
    return this.desktopSyncService.sync(fastSync, forceSync, ConnectorType.GARMIN);
  }
}
