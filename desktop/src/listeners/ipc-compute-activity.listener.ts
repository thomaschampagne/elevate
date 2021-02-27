import { IpcListener } from "./ipc-listener.interface";
import { AthleteSnapshotModel, Streams, SyncedActivityModel, UserSettings } from "@elevate/shared/models";
import { Channel, IpcTunnelService } from "@elevate/shared/electron";
import { inject, singleton } from "tsyringe";
import { ConnectorSyncService } from "../connectors/connector-sync.service";
import DesktopUserSettingsModel = UserSettings.DesktopUserSettingsModel;

@singleton()
export class IpcComputeActivityListener implements IpcListener {
  constructor(@inject(ConnectorSyncService) private readonly connectorSyncService: ConnectorSyncService) {}

  public startListening(ipcTunnelService: IpcTunnelService): void {
    // Compute activity
    ipcTunnelService.on<
      Array<[SyncedActivityModel, AthleteSnapshotModel, Streams, DesktopUserSettingsModel]>,
      SyncedActivityModel
    >(Channel.computeActivity, payload => {
      const [syncedActivityModel, athleteSnapshotModel, streams, desktopUserSettingsModel] = payload[0];
      return this.handleComputeActivity(syncedActivityModel, athleteSnapshotModel, streams, desktopUserSettingsModel);
    });
  }

  public handleComputeActivity(
    syncedActivityModel: SyncedActivityModel,
    athleteSnapshotModel: AthleteSnapshotModel,
    streams: Streams,
    userSettingsModel: DesktopUserSettingsModel
  ): Promise<SyncedActivityModel> {
    return this.connectorSyncService.computeActivity(
      syncedActivityModel,
      userSettingsModel,
      athleteSnapshotModel,
      streams
    );
  }
}
