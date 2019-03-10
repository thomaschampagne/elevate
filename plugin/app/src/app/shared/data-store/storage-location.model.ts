export class StorageLocationModel {

	public readonly key: string;

	/**
	 *
	 * @param type {AppStorageType} Should be LOCAl or SYNC
	 * @param key {string} key location in storage being used. If not set the whole storage will be used as location.
	 */
	constructor(key?: string) {
		this.key = (key) ? key : null;
	}
}
