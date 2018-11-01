import { AppStorage } from "./app-storage";
import * as _ from "lodash";
import { Constant, CoreMessages, SyncResultModel } from "@elevate/shared";

export class Background {

	public init(): void {
		this.listenForExternalMessages();
		this.setBrowserActionBehaviour();
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
							message: CoreMessages.ON_EXTERNAL_SYNC_DONE,
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

				case CoreMessages.ON_EXTERNAL_SYNC_DONE:
					this.forwardOnExternalSyncFinished(request.params.syncResult);
					break;

				case CoreMessages.ON_RELOAD_BROWSER_TAB:
					this.reloadBrowserTab(request.params.sourceTabId);
					break;

				case AppStorage.ON_GET_MESSAGE:
					AppStorage.getInstance().get(request.params.storage, request.params.key).then(
						result => sendResponse({data: result}),
						error => {
							console.error(error);
						}
					);
					break;

				case AppStorage.ON_SET_MESSAGE:
					AppStorage.getInstance().set(request.params.storage, request.params.key, request.params.value).then(
						() => sendResponse({message: request.params.key + " has been set to " + request.params.value}),
						error => {
							console.error(error);
						}
					);
					break;

				case AppStorage.ON_RM_MESSAGE:
					AppStorage.getInstance().rm(request.params.storage, request.params.key).then(
						() => sendResponse({message: request.params.key + " has been removed"}),
						error => {
							console.error(error);
						}
					);
					break;

				case AppStorage.ON_USAGE_MESSAGE:
					AppStorage.getInstance().usage(request.params.storage).then(
						result => sendResponse({data: result}),
						error => {
							console.error(error);
						});
					break;

				default:
					throw new Error("Not existing method");

			}
			return true;
		});
	}

	private setBrowserActionBehaviour(): void {
		chrome.browserAction.onClicked.addListener(() => {
			chrome.tabs.create({
				url: chrome.extension.getURL(Constant.APP_ROOT_URL)
			});
		});
	}

}

const background = new Background();
background.init();
