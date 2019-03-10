import { AppStorageUsage } from "./models/app-storage-usage.model";
import * as _ from "lodash";
import { BrowserStorageType } from "./models/browser-storage-type.enum";

export class BrowserStorage {

	constructor(extensionId?: string) {
		this.extensionId = (extensionId) ? extensionId : null;
	}

	public static readonly ON_GET_MESSAGE: string = "ON_GET_MESSAGE";
	public static readonly ON_SET_MESSAGE: string = "ON_SET_MESSAGE";
	public static readonly ON_RM_MESSAGE: string = "ON_RM_MESSAGE";
	public static readonly ON_CLEAR_MESSAGE: string = "ON_CLEAR_MESSAGE";
	public static readonly ON_USAGE_MESSAGE: string = "ON_USAGE_MESSAGE";

	private static instance: BrowserStorage = null;

	private extensionId: string = null;

	public static getInstance(): BrowserStorage {
		if (!this.instance) {
			this.instance = new BrowserStorage((chrome && chrome.runtime && chrome.runtime.id) ? chrome.runtime.id : null);
		}
		return this.instance;
	}

	public setExtensionId(extensionId: string): void {
		this.extensionId = (extensionId) ? extensionId : null;
	}

	public hasExtensionId(): boolean {
		return (this.extensionId !== null);
	}

	/**
	 *
	 * @param storageType
	 * @param key
	 */
	public get<T>(storageType: BrowserStorageType, key?: string): Promise<T> {

		this.verifyExtensionId();

		key = (!key) ? null : key;

		return new Promise<T>((resolve: Function, reject: Function) => {

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

				this.backgroundStorageQuery<T>(BrowserStorage.ON_GET_MESSAGE, storageType, key).then((result: T) => {
					resolve(result);
				});
			}
		});
	}

	/**
	 *
	 * @param storageType
	 * @param key
	 * @param value
	 */
	public set<T>(storageType: BrowserStorageType, key: string, value: T): Promise<void> {

		this.verifyExtensionId();

		return new Promise<void>((resolve: Function, reject: Function) => {

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

				this.backgroundStorageQuery<T>(BrowserStorage.ON_SET_MESSAGE, storageType, key, value).then(() => {
					resolve();
				});
			}
		});
	}

	/**
	 *
	 * @param storageType
	 * @param path
	 * @param value
	 */
	public upsertProperty<T, V>(storageType: BrowserStorageType, path: string[], value: V): Promise<void> {
		const key = path.shift();
		return this.get<T>(storageType, key).then((result: T) => {
			result = (path.length > 0) ? (_.set(result as Object, path, value) as T) : (value as any);
			return this.set<T>(storageType, key, result);
		});
	}

	/**
	 *
	 * @param storageType
	 * @param key
	 */
	public rm<T>(storageType: BrowserStorageType, key: string | string[]): Promise<void> {

		this.verifyExtensionId();

		return new Promise<void>((resolve: Function, reject: Function) => {

			if (this.hasStorageAccess()) {

				chrome.storage[storageType].remove(<any>key, () => {
					const error = chrome.runtime.lastError;
					if (error) {
						reject(error.message);
					} else {
						resolve();
					}
				});

			} else {

				this.backgroundStorageQuery<T>(BrowserStorage.ON_RM_MESSAGE, storageType, key).then(() => {
					resolve();
				});
			}
		});
	}

	/**
	 *
	 * @param storageType
	 */
	public clear<T>(storageType: BrowserStorageType): Promise<void> {

		this.verifyExtensionId();

		return new Promise<void>((resolve: Function, reject: Function) => {

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

				this.backgroundStorageQuery<T>(BrowserStorage.ON_CLEAR_MESSAGE, storageType).then(() => {
					resolve();
				});
			}
		});
	}

	/**
	 *
	 * @param storageType
	 */
	public usage(storageType: BrowserStorageType): Promise<AppStorageUsage> {

		this.verifyExtensionId();

		return new Promise<AppStorageUsage>((resolve: Function, reject: Function) => {

			if (this.hasStorageAccess()) {

				chrome.storage[storageType].getBytesInUse((bytesInUse: number) => {

					const error = chrome.runtime.lastError;
					if (error) {
						reject(error.message);
					} else {
						const storageUsage = {
							bytesInUse: bytesInUse,
							quotaBytes: chrome.storage[storageType].QUOTA_BYTES,
							percentUsage: bytesInUse / chrome.storage[storageType].QUOTA_BYTES * 100,
						};
						resolve(storageUsage);
					}
				});

			} else {
				this.backgroundStorageQuery(BrowserStorage.ON_USAGE_MESSAGE, storageType).then((result: AppStorageUsage) => {
					resolve(result);
				});
			}
		});
	}

	/**
	 * Check extension id exists
	 */
	private verifyExtensionId(): void {
		if (!this.extensionId) {
			throw new Error("Missing 'extensionId' property, please set it manually.");
		}
	}

	/**
	 *
	 */
	private hasStorageAccess(): boolean {
		return (chrome && chrome.storage !== undefined);
	}

	/**
	 *
	 * @param method
	 * @param storageType
	 * @param key
	 * @param value
	 */
	private backgroundStorageQuery<T>(method: string, storageType: BrowserStorageType, key?: string | string[], value?: T): Promise<T> {

		return new Promise<T>((resolve: Function, reject: Function) => {

			const params: any = {
				storage: storageType,
			};

			if (key !== undefined) {
				params.key = key;
			}

			if (value !== undefined) {
				params.value = value;
			}

			chrome.runtime.sendMessage(this.extensionId, {
				method: method,
				params: params
			}, (result: { data: T }) => {
				resolve(result.data);
			});
		});
	}

}
