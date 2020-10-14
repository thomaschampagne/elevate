import { AppStorageUsage } from "./models/app-storage-usage.model";
import { BrowserStorageType } from "./models/browser-storage-type.enum";

export class LegacyBrowserStorage {
  public static readonly ON_GET_MESSAGE: string = "ON_GET_MESSAGE";
  public static readonly ON_SET_MESSAGE: string = "ON_SET_MESSAGE";
  public static readonly ON_RM_MESSAGE: string = "ON_RM_MESSAGE";
  public static readonly ON_CLEAR_MESSAGE: string = "ON_CLEAR_MESSAGE";
  public static readonly ON_USAGE_MESSAGE: string = "ON_USAGE_MESSAGE";
  protected static instance: LegacyBrowserStorage = null;
  protected extensionId: string = null;

  constructor(extensionId?: string) {
    this.extensionId = extensionId ? extensionId : null;
  }

  public static getInstance(): LegacyBrowserStorage {
    if (!this.instance) {
      this.instance = new LegacyBrowserStorage(
        chrome && chrome.runtime && chrome.runtime.id ? chrome.runtime.id : null
      );
    }
    return this.instance;
  }

  public setExtensionId(extensionId: string): void {
    this.extensionId = extensionId ? extensionId : null;
  }

  public hasExtensionId(): boolean {
    return this.extensionId !== null;
  }

  public get<T>(storageType: BrowserStorageType, key?: string): Promise<T> {
    this.verifyExtensionId();

    key = !key ? null : key;

    return new Promise<T>((resolve, reject) => {
      if (this.hasStorageAccess()) {
        chrome.storage[storageType].get(key, (result: T) => {
          const error = chrome.runtime.lastError;
          if (error) {
            reject(error.message);
          } else {
            if (!key) {
              resolve(result);
            } else {
              resolve(result[key]);
            }
          }
        });
      } else {
        this.backgroundStorageQuery<T>(LegacyBrowserStorage.ON_GET_MESSAGE, storageType, key, null).then(
          (result: T) => {
            resolve(result);
          }
        );
      }
    });
  }

  public set<T>(storageType: BrowserStorageType, key: string, value: T): Promise<void> {
    this.verifyExtensionId();

    return new Promise<void>((resolve, reject) => {
      if (this.hasStorageAccess()) {
        let object = {};
        if (key) {
          object[key] = value;
        } else {
          object = value;
        }

        chrome.storage[storageType].set(object, () => {
          const error = chrome.runtime.lastError;
          if (error) {
            reject(error.message);
          } else {
            resolve();
          }
        });
      } else {
        this.backgroundStorageQuery<T>(LegacyBrowserStorage.ON_SET_MESSAGE, storageType, key, value).then(() => {
          resolve();
        });
      }
    });
  }

  public rm<T>(storageType: BrowserStorageType, key: string | string[]): Promise<void> {
    this.verifyExtensionId();

    return new Promise<void>((resolve, reject) => {
      if (this.hasStorageAccess()) {
        chrome.storage[storageType].remove(key as any, () => {
          const error = chrome.runtime.lastError;
          if (error) {
            reject(error.message);
          } else {
            resolve();
          }
        });
      } else {
        this.backgroundStorageQuery<T>(LegacyBrowserStorage.ON_RM_MESSAGE, storageType, key, null).then(() => {
          resolve();
        });
      }
    });
  }

  public clear<T>(storageType: BrowserStorageType): Promise<void> {
    this.verifyExtensionId();

    return new Promise<void>((resolve, reject) => {
      if (this.hasStorageAccess()) {
        chrome.storage[storageType].clear(() => {
          const error = chrome.runtime.lastError;
          if (error) {
            reject(error.message);
          } else {
            resolve();
          }
        });
      } else {
        this.backgroundStorageQuery<T>(LegacyBrowserStorage.ON_CLEAR_MESSAGE, storageType, null, null).then(() => {
          resolve();
        });
      }
    });
  }

  public usage(storageType: BrowserStorageType): Promise<AppStorageUsage> {
    this.verifyExtensionId();

    return new Promise<AppStorageUsage>((resolve, reject) => {
      if (this.hasStorageAccess()) {
        chrome.storage[storageType].getBytesInUse((bytesInUse: number) => {
          const error = chrome.runtime.lastError;
          if (error) {
            reject(error.message);
          } else {
            const storageUsage = {
              bytesInUse: bytesInUse,
              quotaBytes: chrome.storage[storageType].QUOTA_BYTES,
              percentUsage: (bytesInUse / chrome.storage[storageType].QUOTA_BYTES) * 100
            };
            resolve(storageUsage);
          }
        });
      } else {
        this.backgroundStorageQuery(LegacyBrowserStorage.ON_USAGE_MESSAGE, storageType, null, null).then(
          (result: AppStorageUsage) => {
            resolve(result);
          }
        );
      }
    });
  }

  public backgroundStorageQuery<T>(
    method: string,
    storageType: BrowserStorageType,
    key: string | string[],
    value: T | T[]
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const params: any = {
        storage: storageType
      };

      if (key !== null) {
        params.key = key;
      }

      if (value !== null) {
        params.value = value;
      }

      chrome.runtime.sendMessage(
        this.extensionId,
        {
          method: method,
          params: params
        },
        (result: { data: T }) => {
          resolve(result.data);
        }
      );
    });
  }

  /**
   * Check extension id exists
   */
  protected verifyExtensionId(): void {
    if (!this.extensionId) {
      throw new Error("Missing 'extensionId' property, please set it manually.");
    }
  }

  protected hasStorageAccess(): boolean {
    return chrome && chrome.storage !== undefined;
  }
}
