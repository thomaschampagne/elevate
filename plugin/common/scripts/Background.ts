import { IStorageUsage, StorageManager } from "./modules/StorageManager";
import * as _ from "lodash";
import { SyncResultModel } from "../../core/scripts/synchronizer/sync-result.model";
import { Messages } from "./Messages";

export class Background {

	private storageManager: StorageManager = new StorageManager();

	public init(): void {
		this.listenForExternalMessages();
	}

	private reloadBrowserTab(tabId: number): void {
		console.log("Now reloading tab id " + tabId);
		chrome.tabs.reload(tabId);
	}

	/**
	 * Forward syncResult to * non url tabs
	 * @param {SyncResult} syncResult
	 */
	private forwardOnExternalSyncFinished(syncResult: SyncResultModel): void {

		if (syncResult) {
			chrome.tabs.query({}, (tabs: chrome.tabs.Tab[]) => {
				_.forEach(tabs, (tab: chrome.tabs.Tab) => {
					if (!tab.url) {
						const message = {
							message: Messages.ON_EXTERNAL_SYNC_DONE,
							results: syncResult
						};
						chrome.tabs.sendMessage(tab.id, message);
					}
				});
			});
		}
	}

	private listenForExternalMessages(): void {

		chrome.runtime.onMessageExternal.addListener((request, sender, sendResponse) => {

			switch (request.method) {

				case Messages.ON_EXTERNAL_SYNC_DONE:
					this.forwardOnExternalSyncFinished(request.params.syncResult);
					break;

				case Messages.ON_RELOAD_BROWSER_TAB:
					this.reloadBrowserTab(request.params.sourceTabId);
					break;

				case Messages.ON_GET_FROM_STORAGE:
					this.storageManager.getFromStorage(request.params.storage, request.params.key, function (returnedValue: any) {
						sendResponse({
							data: returnedValue,
						});
					});
					break;

				case Messages.ON_SET_FROM_STORAGE:
					this.storageManager.setToStorage(request.params.storage, request.params.key, request.params.value, function (returnAllData: any) {
						sendResponse({
							data: returnAllData,
						});
					});
					break;

				case Messages.ON_REMOVE_FROM_STORAGE:
					this.storageManager.removeFromStorage(request.params.storage, request.params.key, function (returnAllData: any) {
						sendResponse({
							data: returnAllData,
						});
					});
					break;

				case Messages.ON_STORAGE_USAGE:
					this.storageManager.getStorageUsage(request.params.storage, function (response: IStorageUsage) {
						sendResponse({
							data: response,
						});
					});
					break;

				default:
					throw new Error("Not existing method");

			}
			return true;
		});
	}

}

const background = new Background();
background.init();
