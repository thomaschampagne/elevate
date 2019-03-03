import { Injectable } from "@angular/core";
import { Subject } from "rxjs";
import { CoreMessages, SyncResultModel } from "../../../../../../modules/shared/models";
import { AppEventsService } from "../app-events-service";

@Injectable()
export class ChromeEventsService extends AppEventsService {

	constructor() {

		super();

		this.pluginId = ChromeEventsService.getBrowserPluginId();

		// Listen for external messages
		ChromeEventsService.getBrowserExternalMessages().addListener((request: any, sender: chrome.runtime.MessageSender) => {
			this.onBrowserRequestReceived(request, sender.id);
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

	public onBrowserRequestReceived(request: { message: string, results: any }, senderId: any): void {

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
