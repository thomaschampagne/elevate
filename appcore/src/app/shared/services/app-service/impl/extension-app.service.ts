import { Inject, Injectable } from "@angular/core";
import { CoreMessages } from "@elevate/shared/models";
import { AppService } from "../app.service";
import { DataStore } from "../../../data-store/data-store";
import { LoggerService } from "../../logging/logger.service";
import { ActivityService } from "../../activity/activity.service";
import { ExtensionSyncService } from "../../sync/impl/extension-sync.service";
import { SyncService } from "../../sync/sync.service";

@Injectable()
export class ExtensionAppService extends AppService {
  public pluginId: string;

  constructor(
    @Inject(ActivityService) protected readonly activityService: ActivityService,
    @Inject(DataStore) private readonly dataStore: DataStore<object>,
    @Inject(SyncService) public readonly extensionSyncService: ExtensionSyncService,
    @Inject(LoggerService) private readonly logger: LoggerService
  ) {
    super(activityService, extensionSyncService);

    this.pluginId = ExtensionAppService.getBrowserPluginId();

    // Listen for external messages
    ExtensionAppService.getBrowserExternalMessages().addListener(
      (request: any, sender: chrome.runtime.MessageSender) => {
        this.onBrowserRequestReceived(request, sender.id);
      }
    );
  }

  public static getBrowserExternalMessages(): chrome.runtime.ExtensionMessageEvent {
    return chrome.runtime.onMessage;
  }

  public static getBrowserPluginId(): string {
    return chrome.runtime.id;
  }

  public onBrowserRequestReceived(request: { message: string; results: any }, senderId: any): void {
    if (senderId !== this.pluginId) {
      return;
    }

    if (request.message === CoreMessages.ON_EXTERNAL_DB_CHANGE) {
      this.logger.info("External database change detected, reloading database...");
      this.dataStore.reload(); // Reload datastore if external db changes happened (e.g. localStorageMustBeCleared = false in strava.com)
    }

    if (request.message === CoreMessages.ON_EXTERNAL_SYNC_DONE) {
      this.extensionSyncService.syncDone$.next();
    }
  }
}
