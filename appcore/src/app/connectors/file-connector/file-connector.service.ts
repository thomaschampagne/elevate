import { Inject, Injectable } from "@angular/core";
import { DesktopSyncService } from "../../shared/services/sync/impl/desktop-sync.service";
import { SyncService } from "../../shared/services/sync/sync.service";
import { ConnectorService } from "../connector.service";
import { ConnectorType } from "@elevate/shared/sync/connectors/connector-type.enum";

@Injectable()
export class FileConnectorService extends ConnectorService {
  constructor(@Inject(SyncService) private readonly desktopSyncService: DesktopSyncService) {
    super();
  }

  public sync(fastSync: boolean = null, forceSync: boolean = null): Promise<void> {
    return this.desktopSyncService.sync(fastSync, forceSync, ConnectorType.FILE);
  }
}
