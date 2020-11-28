import { Inject, Injectable } from "@angular/core";
import { ConnectorType } from "@elevate/shared/sync";
import { DesktopSyncService } from "../../shared/services/sync/impl/desktop-sync.service";
import { SyncService } from "../../shared/services/sync/sync.service";

@Injectable()
export class FileConnectorService {
  constructor(@Inject(SyncService) private readonly desktopSyncService: DesktopSyncService) {}

  public sync(fastSync: boolean = null, forceSync: boolean = null): Promise<void> {
    return this.desktopSyncService.sync(fastSync, forceSync, ConnectorType.FILE);
  }
}
