import { StorageType } from "./storage-type.enum";

export class StorageLocationModel {

	public readonly key: string;
	public readonly storageType: StorageType;
	public readonly collectionFieldId: string;

	/**
	 *
	 * @param key {string} key location in storage being used. If not set the whole storage will be used as location.
	 * @param storageType can be object, list or single value
	 * @param collectionFieldId if storage is type of collection, this "collectionFieldId" is used as ID concatenated with key of storage "key:MY_ID" (e.g. activity:09182094923)
	 */
	constructor(key?: string, storageType?: StorageType, collectionFieldId?: string) {
		this.key = (key) ? key : null;
		this.storageType = (storageType !== undefined) ? storageType : null;
		this.collectionFieldId = (storageType === StorageType.COLLECTION && collectionFieldId) ? collectionFieldId : null;
	}
}
