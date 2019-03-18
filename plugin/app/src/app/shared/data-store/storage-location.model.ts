import { StorageType } from "./storage-type.enum";

export class StorageLocationModel {

	public readonly key: string;
	public readonly storageType: StorageType;

	/**
	 *
	 * @param key {string} key location in storage being used. If not set the whole storage will be used as location.
	 * @param storageType
	 */
	constructor(key?: string, storageType?: StorageType) {
		this.key = (key) ? key : null;
		this.storageType = (storageType !== undefined) ? storageType : null;
	}
}
