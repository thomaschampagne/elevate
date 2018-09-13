import { Injectable } from "@angular/core";
import { Subject } from "rxjs";
import { SyncResultModel } from "../../../../../../core/scripts/shared/models/sync/sync-result.model";
import { CoreMessages } from "../../../../../../core/scripts/shared/models/core-messages";

@Injectable()
export class ExternalUpdatesService {

	constructor() {

		this.pluginId = ExternalUpdatesService.getBrowserPluginId();

		// Listen for external messages
		ExternalUpdatesService.getBrowserExternalMessages().addListener((request: any, sender: chrome.runtime.MessageSender) => {
			this.onExternalRequestReceived(request, sender.id);
		});

		this.onSyncDone = new Subject<SyncResultModel>();
	}

	public pluginId: string;
	public onSyncDone: Subject<SyncResultModel>;

	public static getBrowserExternalMessages(): chrome.runtime.ExtensionMessageEvent {
		return chrome.runtime.onMessage;
	}

	public static getBrowserPluginId(): string {
		return chrome.runtime.id;
	}

	public onExternalRequestReceived(request: { message: string, results: any }, senderId: any): void {

		if (senderId !== this.pluginId) {
			return;
		}

		switch (request.message) {
			case CoreMessages.ON_EXTERNAL_SYNC_DONE:
				this.onSyncDone.next(request.results);
				break;
		}
	}
}
