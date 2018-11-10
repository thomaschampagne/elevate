import { AppStorageType } from "@elevate/shared/models";

export class StorageLocationModel {

	public readonly type: AppStorageType;
	public readonly key: string;

	/**
	 *
	 * @param type {AppStorageType} Should be LOCAl or SYNC
	 * @param key {string} key location in storage being used. If not set the whole storage will be used as location.
	 */
	constructor(type: AppStorageType, key?: string) {
		this.type = type;
		this.key = (key) ? key : null;
	}
}
