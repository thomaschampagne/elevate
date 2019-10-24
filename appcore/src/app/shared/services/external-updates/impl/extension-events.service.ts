import { Injectable } from "@angular/core";
import { CoreMessages, SyncResultModel } from "@elevate/shared/models";
import { AppEventsService } from "../app-events-service";

@Injectable()
export class ExtensionEventsService extends AppEventsService {

	constructor() {
		super();

		this.pluginId = ExtensionEventsService.getBrowserPluginId();

		// Listen for external messages
		ExtensionEventsService.getBrowserExternalMessages().addListener((request: any, sender: chrome.runtime.MessageSender) => {
			this.onBrowserRequestReceived(request, sender.id);
		});
	}

	public pluginId: string;

	public static getBrowserExternalMessages(): chrome.runtime.ExtensionMessageEvent {
		return chrome.runtime.onMessage;
	}

	public static getBrowserPluginId(): string {
		return chrome.runtime.id;
	}

	public onBrowserRequestReceived(request: { message: string, results: any }, senderId: any): void {

		if (senderId !== this.pluginId) {
			return;
		}

		if (request.message === CoreMessages.ON_EXTERNAL_SYNC_DONE) {
			const syncResult = <SyncResultModel> request.results;
			const hasChanges = syncResult.activitiesChangesModel.added.length > 0
				|| syncResult.activitiesChangesModel.edited.length > 0
				|| syncResult.activitiesChangesModel.deleted.length > 0;
			this.onSyncDone.next(hasChanges);
		}
	}
}
