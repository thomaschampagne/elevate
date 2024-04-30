import _ from "lodash";
import { LegacyBrowserStorage } from "./legacy-browser-storage";
import { BrowserStorage } from "./browser-storage";
import { SyncResultModel } from "@elevate/shared/models/sync/sync-result.model";
import { CoreMessages } from "@elevate/shared/models/core-messages";
import { Constant } from "@elevate/shared/constants/constant";

export class Background {
  public init(): void {
    this.listenForExternalMessages();
    this.setBrowserActionBehavior();
  }

  /**
   * Forward syncResult to * non url tabs
   */
  private forwardOnExternalSyncFinished(syncResult: SyncResultModel): void {
    if (syncResult) {
      this.forwardMessageToApp(CoreMessages.ON_EXTERNAL_SYNC_DONE, syncResult);
    }
  }

  private forwardMessageToApp<T>(messageKey: string, payload: T = null): void {
    chrome.tabs.query({}, (tabs: chrome.tabs.Tab[]) => {
      _.forEach(tabs, (tab: chrome.tabs.Tab) => {
        if (!tab.url) {
          const message = {
            message: messageKey,
            results: payload
          };
          chrome.tabs.sendMessage(tab.id, message);
        }
      });
    });
  }

  private listenForExternalMessages(): void {
    chrome.runtime.onMessageExternal.addListener((request, sender, sendResponse) => {
      switch (request.method) {
        case CoreMessages.ON_EXTERNAL_SYNC_START:
          this.forwardMessageToApp(CoreMessages.ON_EXTERNAL_SYNC_START);
          break;
        case CoreMessages.ON_EXTERNAL_SYNC_DONE:
          this.forwardOnExternalSyncFinished(request.params.syncResult);
          break;

        case CoreMessages.ON_EXTERNAL_DB_CHANGE:
          this.forwardMessageToApp(CoreMessages.ON_EXTERNAL_DB_CHANGE);
          break;

        case LegacyBrowserStorage.ON_GET_MESSAGE:
          BrowserStorage.getInstance()
            .get(request.params.storage, request.params.key, request.params.getFirstDocOnly)
            .then(
              result => sendResponse({ data: result }),
              error => {
                console.error(error);
              }
            );
          break;

        case LegacyBrowserStorage.ON_SET_MESSAGE:
          BrowserStorage.getInstance()
            .set(request.params.storage, request.params.key, request.params.value)
            .then(
              () =>
                sendResponse({
                  message: request.params.key + " has been set to " + request.params.value
                }),
              error => {
                console.error(error);
              }
            );
          break;

        case LegacyBrowserStorage.ON_RM_MESSAGE:
          BrowserStorage.getInstance()
            .rm(request.params.storage, request.params.key)
            .then(
              () => sendResponse({ message: request.params.key + " has been removed" }),
              error => {
                console.error(error);
              }
            );
          break;

        case LegacyBrowserStorage.ON_CLEAR_MESSAGE:
          BrowserStorage.getInstance()
            .clear(request.params.storage)
            .then(
              () => sendResponse({ message: request.params.storage + " has been cleared" }),
              error => {
                console.error(error);
              }
            );
          break;

        case LegacyBrowserStorage.ON_USAGE_MESSAGE:
          BrowserStorage.getInstance()
            .usage(request.params.storage)
            .then(
              result => sendResponse({ data: result }),
              error => {
                console.error(error);
              }
            );
          break;

        default:
          throw new Error("Not existing method");
      }
      return true;
    });
  }

  private setBrowserActionBehavior(): void {
    chrome.action.onClicked.addListener(() => {
      chrome.tabs.create({
        url: chrome.runtime.getURL(Constant.APP_ROOT_URL)
      });
    });
  }
}
