import { Injectable } from "@angular/core";
import { Subject } from "rxjs/Subject";
import { SyncResultModel } from "../../../../../../shared/models/sync/sync-result.model";
import { MessagesModel } from "../../../../../../shared/models/messages.model";

@Injectable()
export class ExternalUpdatesService {

	public static getBrowserExternalMessages(): chrome.runtime.ExtensionMessageEvent {
		return chrome.runtime.onMessage;
	}

	public static getBrowserPluginId(): string {
		return chrome.runtime.id;
	}

	public pluginId: string;
	public onSyncDone: Subject<SyncResultModel>;

	constructor() {

		this.pluginId = ExternalUpdatesService.getBrowserPluginId();

		// Listen for external messages
		ExternalUpdatesService.getBrowserExternalMessages().addListener((request: any, sender: chrome.runtime.MessageSender) => {
			this.onExternalRequestReceived(request, sender.id);
		});

		this.onSyncDone = new Subject<SyncResultModel>();
	}

	public onExternalRequestReceived(request: { message: string, results: any }, senderId: any): void {

		if (senderId !== this.pluginId) {
			return;
		}

		switch (request.message) {
			case MessagesModel.ON_EXTERNAL_SYNC_DONE:
				this.onSyncDone.next(request.results);
				break;
		}
	}
}
