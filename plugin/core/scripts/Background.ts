import { IStorageUsage, StorageManager } from "./StorageManager";
import * as _ from "lodash";
import { SyncResultModel } from "./shared/models/sync/sync-result.model";
import { MessagesModel } from "./shared/models/messages.model";

export class Background {

	public storageManager: StorageManager = new StorageManager();

	public init(): void {
		this.listenForExternalMessages();
	}

	public listenForExternalMessages(): void {
		chrome.runtime.onMessage.addListener((request, sender, callback) => {
			switch (request.message.method) {
				case MessagesModel.ON_EXTERNAL_SYNC_DONE:
					//refresh graphs on data change
					chrome.tabs.reload(request.message.params.sourceTabId);
					break;

				case MessagesModel.ON_RELOAD_BROWSER_TAB:
					console.log("Now reloading tab id " + request.message.params.sourceTabId);
					chrome.tabs.reload(request.message.params.sourceTabId);
					break;

				case MessagesModel.ON_GET_FROM_STORAGE:
					this.storageManager.getFromStorage(request.message.params.storage, request.message.params.key, callback);
					break;

				case MessagesModel.ON_SET_FROM_STORAGE:
					this.storageManager.setToStorage(request.message.params.storage, request.message.params.key, request.message.params.value, callback);
					break;

				case MessagesModel.ON_REMOVE_FROM_STORAGE:
					this.storageManager.removeFromStorage(request.message.params.storage, request.message.params.key, callback);
					break;

				case MessagesModel.ON_STORAGE_USAGE:
					this.storageManager.getStorageUsage(request.message.params.storage, callback);
					break;

				default:
					throw new Error("Not existing method:" + JSON.stringify(request));
			}
			return true;
		});
	}
}
const background = new Background();
background.init();
