import { Inject, Injectable } from "@angular/core";
import { CoreMessages, SyncResultModel } from "@elevate/shared/models";
import { AppEventsService } from "../app-events-service";
import { DataStore } from "../../../data-store/data-store";
import { LoggerService } from "../../logging/logger.service";

@Injectable()
export class ExtensionEventsService extends AppEventsService {
  public pluginId: string;

  constructor(
    @Inject(DataStore) private readonly dataStore: DataStore<object>,
    @Inject(LoggerService) private readonly logger: LoggerService
  ) {
    super();

    this.pluginId = ExtensionEventsService.getBrowserPluginId();

    // Listen for external messages
    ExtensionEventsService.getBrowserExternalMessages().addListener(
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
      const syncResult = request.results as SyncResultModel;
      const hasChanges =
        syncResult.activitiesChangesModel.added.length > 0 ||
        syncResult.activitiesChangesModel.edited.length > 0 ||
        syncResult.activitiesChangesModel.deleted.length > 0;
      this.syncDone$.next(hasChanges);
    }
  }
}
