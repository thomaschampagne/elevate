import { LegacyBrowserStorage } from "./legacy-browser-storage";
import { BrowserStorageType } from "./models/browser-storage-type.enum";

export class BrowserStorage extends LegacyBrowserStorage {
    constructor(extensionId?: string) {
        super(extensionId);
    }

    public static getInstance(): BrowserStorage {
        if (!this.instance) {
            this.instance = new BrowserStorage(
                chrome && chrome.runtime && chrome.runtime.id ? chrome.runtime.id : null
            );
        }
        return this.instance;
    }

    private static setLokiMetaData(object: any): any {
        const time = Date.now();

        if (object.meta) {
            object.meta.updated = time;
            object.meta.revision = object.meta.revision + 1;
        } else {
            object.meta = {
                revision: 1,
                created: time,
                version: 0,
                updated: time,
            };
        }

        return object;
    }

    public get<T>(storageType: BrowserStorageType, colName: string, getFirstDocOnly: boolean = false): Promise<T> {
        this.verifyExtensionId();

        return new Promise<T>((resolve, reject) => {
            if (this.hasStorageAccess()) {
                chrome.storage[storageType].get(colName, result => {
                    const error = chrome.runtime.lastError;
                    if (error) {
                        reject(error.message);
                    } else {
                        const data =
                            result && result[colName] && result[colName].data && result[colName].data.length > 0
                                ? result[colName].data
                                : null;

                        if (data) {
                            resolve(getFirstDocOnly ? data[0] : data);
                        } else {
                            resolve(null);
                        }
                    }
                });
            } else {
                this.backgroundStorageQuery<T>(
                    LegacyBrowserStorage.ON_GET_MESSAGE,
                    storageType,
                    colName,
                    null,
                    getFirstDocOnly
                ).then((result: T) => {
                    resolve(result);
                });
            }
        });
    }

    public set<T>(storageType: BrowserStorageType, colName: string, value: T | T[]): Promise<void> {
        this.verifyExtensionId();

        return new Promise<void>((resolve, reject) => {
            if (this.hasStorageAccess()) {
                chrome.storage[storageType].get(colName, collection => {
                    if (chrome.runtime.lastError) {
                        reject(chrome.runtime.lastError.message);
                    } else {
                        if (!collection[colName] || !collection[colName].data) {
                            collection = {};
                            collection[colName] = {
                                name: colName,
                            };
                        }

                        if (Array.isArray(value)) {
                            // Ensure documents in value variable receive $loki and metadata
                            value = value.map((doc, index) => {
                                doc = BrowserStorage.setLokiMetaData(doc);
                                (doc as any).$loki = index + 1;
                                return doc;
                            });

                            collection[colName].data = value;
                        } else {
                            let doc = {};

                            if (typeof value === "object") {
                                doc = value;
                            } else {
                                doc[colName] = value;
                            }

                            doc = BrowserStorage.setLokiMetaData(doc);
                            (doc as any).$loki = 1;
                            collection[colName].data = [doc];
                        }

                        chrome.storage[storageType].set(collection, () => {
                            if (chrome.runtime.lastError) {
                                reject(chrome.runtime.lastError.message);
                            } else {
                                resolve();
                            }
                        });
                    }
                });
            } else {
                this.backgroundStorageQuery<T>(
                    LegacyBrowserStorage.ON_SET_MESSAGE,
                    storageType,
                    colName,
                    value,
                    null
                ).then(() => {
                    resolve();
                });
            }
        });
    }

    public backgroundStorageQuery<T>(
        method: string,
        storageType: BrowserStorageType,
        key: string | string[],
        value: T[] | T,
        getFirstDocOnly: boolean = false
    ): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            const params: any = {
                storage: storageType,
            };

            if (key !== undefined) {
                params.key = key;
            }

            if (value !== undefined) {
                params.value = value;
            }

            if (typeof getFirstDocOnly === "boolean") {
                params.getFirstDocOnly = getFirstDocOnly;
            }

            chrome.runtime.sendMessage(
                this.extensionId,
                {
                    method: method,
                    params: params,
                },
                (result: { data: T }) => {
                    resolve(result.data);
                }
            );
        });
    }
}
