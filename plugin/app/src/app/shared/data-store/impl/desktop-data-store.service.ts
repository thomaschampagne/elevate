import { Injectable } from "@angular/core";
import { StorageLocationModel } from "../storage-location.model";
import { DataStore } from "../data-store";
import { AppUsageDetails } from "../../models/app-usage-details.model";
import PouchDB from "pouchdb-browser";
import * as _ from "lodash";
import { LoggerService } from "../../services/logging/logger.service";
import { NotImplementedException } from "@elevate/shared/exceptions";

@Injectable()
export class DesktopDataStore<T> extends DataStore<T> {

	public static readonly POUCH_DB_ID_FIELD: string = "_id";
	public static readonly POUCH_DB_DELETED_FIELD: string = "_deleted";
	public static readonly POUCH_DB_REV_FIELD: string = "_rev";

	public elevateCollectionsMap: Map<string, PouchDB.Database<T[] | T>>;

	constructor(public logger: LoggerService) {
		super();
		this.elevateCollectionsMap = new Map<string, PouchDB.Database<T[] | T>>();
	}

	public getCollection(name: string): PouchDB.Database<T[] | T> {
		if (!this.elevateCollectionsMap.has(name)) {
			this.elevateCollectionsMap.set(name, new PouchDB(name, {auto_compaction: true}));
		}
		return this.elevateCollectionsMap.get(name);
	}

	public clear(storageLocation: StorageLocationModel): Promise<void> {

		const collection = this.getCollection(storageLocation.key);

		return collection.destroy().then(() => {

			this.elevateCollectionsMap.delete(storageLocation.key);

			this.getCollection(storageLocation.key); // Force collection to be recreated again

			return Promise.resolve();
		});
	}

	public fetch(storageLocation: StorageLocationModel, query: Partial<T> | string | string[], defaultStorageValue: T[] | T): Promise<T[] | T> {

		return this.getCollection(storageLocation.key).allDocs({
			include_docs: true
		}).then(results => {

			if (results.total_rows === 0) {

				if (defaultStorageValue) {
					defaultStorageValue[DesktopDataStore.POUCH_DB_ID_FIELD] = storageLocation.key;
				}

				return Promise.resolve(defaultStorageValue);
			}

			const docs = results.rows.map(result => {
				return <T>result.doc;
			});

			// If only 1 result and identifier match with storage key, then result as "object", else "array"
			return <Promise<T[] | T>>((docs.length === 1 && docs[0][DesktopDataStore.POUCH_DB_ID_FIELD] === storageLocation.key) ? Promise.resolve(docs[0]) : Promise.resolve(docs));
		});

	}

	// TODO
	public getAppUsageDetails(): Promise<AppUsageDetails> {
		throw new NotImplementedException();
	}

	public save(storageLocation: StorageLocationModel, value: T[] | T, defaultStorageValue: T[] | T): Promise<T[] | T> {

		const collection = this.getCollection(storageLocation.key);

		return collection.allDocs({
			include_docs: true
		}).then(results => {

			const hasExistingObject = (results.total_rows === 1 && results.rows[0].id === storageLocation.key);
			const isNewValueObject = _.isObject(value) && !_.isArray(value);
			const isObjectMode = isNewValueObject || hasExistingObject;

			let savePromise;

			if (isObjectMode) {

				const newDocValue = <T>value;

				if (hasExistingObject) { // Update new doc with revision of object to be updated if object exists in collection
					newDocValue[DesktopDataStore.POUCH_DB_REV_FIELD] = results.rows[0].doc._rev;
				} else { // Create new one with _id
					newDocValue[DesktopDataStore.POUCH_DB_ID_FIELD] = storageLocation.key;
				}
				savePromise = collection.put(newDocValue);

			} else {

				const newDocsValue = <T[]>value;

				// Find existing docs in db
				const existingDocs = results.rows.map(result => {
					return <T>result.doc;
				});

				// Find docs to be removed
				const removeDocs = _.differenceBy(existingDocs, newDocsValue, DesktopDataStore.POUCH_DB_ID_FIELD).map(doc => {
					doc[DesktopDataStore.POUCH_DB_DELETED_FIELD] = true;
					return doc;
				});

				// Find docs to be updated with new value
				const updateDocs = _.intersectionBy(existingDocs, newDocsValue, DesktopDataStore.POUCH_DB_ID_FIELD);

				// Prepare "put" docs: if a new doc already exists, then apply his revision field to update in pouch db
				const putDocs = newDocsValue.map(newDoc => {
					const existingDoc = _.find(updateDocs, {_id: newDoc[DesktopDataStore.POUCH_DB_ID_FIELD]});
					if (existingDoc) {
						newDoc[DesktopDataStore.POUCH_DB_REV_FIELD] = existingDoc[DesktopDataStore.POUCH_DB_REV_FIELD];
					}
					return newDoc;
				});

				// Now apply all changes to collection
				const docsChanges = _.union(removeDocs, putDocs);
				savePromise = collection.bulkDocs(docsChanges);
			}

			return savePromise.then(() => {
				return this.fetch(storageLocation, null, defaultStorageValue);
			});

		});
	}

	public upsertProperty<V>(storageLocation: StorageLocationModel, path: string | string[], value: V, defaultStorageValue: T[] | T): Promise<T> {

		return this.fetch(storageLocation, null, defaultStorageValue).then((doc: T) => {

			if (_.isArray(doc)) {
				return Promise.reject("Cannot save property to a collection");
			}

			doc = _.set(doc as Object, path, value) as T; // Update property of doc

			return this.getCollection(storageLocation.key).put(doc).then(() => {
				return <Promise<T>>this.fetch(storageLocation, null, defaultStorageValue);
			});
		});
	}

}
