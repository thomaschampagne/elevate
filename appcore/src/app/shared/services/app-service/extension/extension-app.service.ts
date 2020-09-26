import { Inject, Injectable } from "@angular/core";
import { AppService } from "../app.service";
import { DataStore } from "../../../data-store/data-store";
import { LoggerService } from "../../logging/logger.service";
import { ActivityService } from "../../activity/activity.service";
import { ExtensionSyncService } from "../../sync/impl/extension-sync.service";
import { SyncService } from "../../sync/sync.service";
import { filter } from "rxjs/operators";
import { CoreMessages } from "@elevate/shared/models";
import { ChromiumService } from "../../../../extension/chromium.service";

@Injectable()
export class ExtensionAppService extends AppService {
  constructor(
    @Inject(ActivityService) protected readonly activityService: ActivityService,
    @Inject(DataStore) private readonly dataStore: DataStore<object>,
    @Inject(SyncService) public readonly extensionSyncService: ExtensionSyncService,
    @Inject(ChromiumService) public readonly chromiumService: ChromiumService,
    @Inject(LoggerService) private readonly logger: LoggerService
  ) {
    super(activityService, extensionSyncService);

    // On external db changes message reload the datastore
    this.chromiumService.externalMessages$
      .pipe(filter(message => message === CoreMessages.ON_EXTERNAL_DB_CHANGE))
      .subscribe(() => {
        this.logger.info("External database change detected, reloading database...");
        this.dataStore.reload(); // Reload datastore if external db changes happened (e.g. localStorageMustBeCleared = false in strava.com)
      });
  }
}
