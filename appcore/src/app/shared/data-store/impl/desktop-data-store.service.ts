import { DataStore } from "../data-store";
import LokiIncrementalIndexedAdapter from "lokijs/src/incremental-indexeddb-adapter";
import { LoggerService } from "../../services/logging/logger.service";
import { Inject, Injectable } from "@angular/core";
import { AppUsageDetails } from "../../models/app-usage-details.model";
import { AppUsage } from "../../models/app-usage.model";
import { IPC_TUNNEL_SERVICE } from "../../../desktop/ipc/ipc-tunnel-service.token";
import { IpcTunnelService } from "@elevate/shared/electron/ipc-tunnel";

@Injectable()
export class DesktopDataStore<T extends {}> extends DataStore<T> {
  constructor(
    @Inject(IPC_TUNNEL_SERVICE) public readonly ipcTunnelService: IpcTunnelService,
    @Inject(LoggerService) protected readonly logger: LoggerService
  ) {
    super(logger);
  }

  public getPersistenceAdapter(): LokiPersistenceAdapter {
    return new LokiIncrementalIndexedAdapter();
  }

  public getAppUsageDetails(): Promise<AppUsageDetails> {
    return navigator.storage.estimate().then((storageEstimate: StorageEstimate) => {
      const appUsage = new AppUsage(new Blob([this.db.serialize()]).size, storageEstimate.quota);
      const megaBytesInUse = appUsage.bytesInUse / (1024 * 1024);
      const percentUsage = (appUsage.bytesInUse / appUsage.quotaBytes) * 100;
      const appUsageDetails = new AppUsageDetails(appUsage, megaBytesInUse, percentUsage);
      return Promise.resolve(appUsageDetails);
    });
  }
}
