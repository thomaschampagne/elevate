import { Inject, Injectable } from "@angular/core";
import { Subject } from "rxjs";
import { LoggerService } from "../shared/services/logging/logger.service";

@Injectable()
export class ChromiumService {
  public pluginId: string;
  public externalMessages$: Subject<string>;

  constructor(@Inject(LoggerService) private readonly logger: LoggerService) {
    this.externalMessages$ = new Subject<string>();

    this.pluginId = this.getBrowserPluginId();

    // Listen for external messages
    this.getBrowserExternalMessages().addListener((request: any, sender: chrome.runtime.MessageSender) => {
      if (sender.id !== this.pluginId) {
        return;
      }
      this.logger.debug(`Received external message ${request.message}`);
      this.externalMessages$.next(request.message);
    });
  }

  public getCurrentTab(): Promise<chrome.tabs.Tab> {
    return new Promise(resolve => {
      this.getTabs().getCurrent((tab: chrome.tabs.Tab) => {
        resolve(tab);
      });
    });
  }

  public getTabs(): typeof chrome.tabs {
    return chrome.tabs;
  }

  public getBrowserPluginId(): string {
    return chrome.runtime.id;
  }

  public getBrowserExternalMessages(): chrome.runtime.ExtensionMessageEvent {
    return chrome.runtime.onMessage;
  }

  public createTab(url: string): Promise<chrome.tabs.Tab> {
    return this.getCurrentTab().then((tab: chrome.tabs.Tab) => {
      const createProperties = {
        url: url,
        openerTabId: tab.id,
        selected: false,
        index: tab.index + 1
      };
      // Create tab for sync
      return new Promise(resolve => {
        this.getTabs().create(createProperties, createdTab => {
          resolve(createdTab);
        });
      });
    });
  }
}
