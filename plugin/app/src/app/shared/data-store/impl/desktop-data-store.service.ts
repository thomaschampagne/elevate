import { Injectable } from "@angular/core";
import { StorageLocationModel } from "../storage-location.model";
import { DataStore } from "../data-store";
import { AppUsageDetails } from "../../models/app-usage-details.model";
import PouchDB from "pouchdb-browser";
import PouchDBFind from "pouchdb-find";
import { LoggerService } from "../../services/logging/logger.service";
import { NotImplementedException } from "@elevate/shared/exceptions";
import * as _ from "lodash";
import { StorageType } from "../storage-type.enum";
import FindRequest = PouchDB.Find.FindRequest;

@Injectable()
export class DesktopDataStore<T> extends DataStore<T> {

	public static readonly POUCH_DB_NAME: string = "elevate";

	public static readonly POUCH_DB_ID_FIELD: string = "_id";
	public static readonly POUCH_DB_ID_LIST_SEPARATOR: string = ":";
	public static readonly POUCH_DB_SINGLE_VALUE_FIELD: string = "$value";
	public static readonly POUCH_DB_DELETED_FIELD: string = "_deleted";
	public static readonly POUCH_DB_REV_FIELD: string = "_rev";

	public database: PouchDB.Database<T[] | T>;

	constructor(public logger: LoggerService) {
		super();
		this.setup();
	}

	public setup(): void {
		PouchDB.plugin(PouchDBFind); // Register find plugin
		this.database = new PouchDB(DesktopDataStore.POUCH_DB_NAME, {auto_compaction: true});

	}

	public clear(storageLocation: StorageLocationModel): Promise<void> {

		return this.database.find({
			selector: {
				_id: DesktopDataStore.getDbIdSelectorByStorageLocation(storageLocation)
			},
			fields: [DesktopDataStore.POUCH_DB_ID_FIELD, DesktopDataStore.POUCH_DB_REV_FIELD]
		}).then(result => {

			let promise = Promise.resolve(null);

			if (result.docs.length > 0) {

				if (storageLocation.storageType === StorageType.COLLECTION) {

					result.docs = result.docs.map(doc => {
						doc[DesktopDataStore.POUCH_DB_DELETED_FIELD] = true;
						return doc;
					});

					promise = this.database.bulkDocs(result.docs);

				} else if (storageLocation.storageType === StorageType.OBJECT || storageLocation.storageType === StorageType.SINGLE_VALUE) {

					promise = this.database.remove(result.docs[0][DesktopDataStore.POUCH_DB_ID_FIELD], result.docs[0][DesktopDataStore.POUCH_DB_REV_FIELD]);

				} else {
					throw new Error("Unknown StorageType");
				}
			}

			return promise;

		}).then(() => {
			return Promise.resolve();
		});
	}

	public static getDbIdSelectorByStorageLocation(storageLocation: StorageLocationModel): PouchDB.Find.ConditionOperators {
		const selector = (storageLocation.storageType === StorageType.COLLECTION) ?
			{$regex: "^" + storageLocation.key + DesktopDataStore.POUCH_DB_ID_LIST_SEPARATOR + ".*"} : {$eq: storageLocation.key};
		selector["$gte"] = null; // Solves "no matching index found, create an index to optimize query time"
		return selector;
	}

	public findDocs(storageLocation: StorageLocationModel, findRequest?: FindRequest<T[] | T>): Promise<PouchDB.Find.FindResponse<T[] | T>> {

		if (!findRequest) {
			findRequest = {
				selector: {
					_id: DesktopDataStore.getDbIdSelectorByStorageLocation(storageLocation)
				}
			};
		} else {
			findRequest = _.set(findRequest, ["selector", DesktopDataStore.POUCH_DB_ID_FIELD], DesktopDataStore.getDbIdSelectorByStorageLocation(storageLocation));
		}

		// Create indexes along FindRequest selector fields
		const indexesToCreate = _.without(_.keys(findRequest.selector), DesktopDataStore.POUCH_DB_ID_FIELD);
		return this.database.createIndex({
			index: {
				fields: indexesToCreate
			}
		}).then(() => {
			return this.database.find(findRequest);
		});

	}

	public fetch(storageLocation: StorageLocationModel, defaultStorageValue: T[] | T, findRequest?: FindRequest<T[] | T>): Promise<T[] | T> {

		return this.findDocs(storageLocation, findRequest).then(result => {

			let response: T[] | T;

			if (storageLocation.storageType === StorageType.COLLECTION) {
				response = <T[] | T> result.docs;
			} else if (storageLocation.storageType === StorageType.OBJECT) {
				response = (result.docs[0]) ? result.docs[0] : defaultStorageValue;
			} else if (storageLocation.storageType === StorageType.SINGLE_VALUE) {
				response = (result.docs[0]) ? result.docs[0][DesktopDataStore.POUCH_DB_SINGLE_VALUE_FIELD] : defaultStorageValue;
			} else {
				throw new Error("Unknown StorageType");
			}

			return Promise.resolve(response);
		});
	}

	// TODO
	public getAppUsageDetails(): Promise<AppUsageDetails> {
		throw new NotImplementedException();
	}

	public save(storageLocation: StorageLocationModel, value: T[] | T, defaultStorageValue: T[] | T): Promise<T[] | T> {

		let savePromise: Promise<T[] | T>;

		if (storageLocation.storageType === StorageType.COLLECTION || storageLocation.storageType === StorageType.OBJECT) {

			savePromise = this.fetch(storageLocation, defaultStorageValue).then(result => {

				let promise;

				// let savePromise
				if (storageLocation.storageType === StorageType.COLLECTION) {

					const newDocsValue = <T[]> value;

					// Find existing docs in db
					const existingDocs = <T[]> result;

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
						} else {
							const collectionDocId = storageLocation.key + DesktopDataStore.POUCH_DB_ID_LIST_SEPARATOR + _.get(newDoc, storageLocation.collectionFieldId);
							newDoc[DesktopDataStore.POUCH_DB_ID_FIELD] = collectionDocId;
						}
						return newDoc;
					});

					// Now apply all changes to collection
					const docsChanges = _.union(removeDocs, putDocs);
					promise = this.database.bulkDocs(docsChanges);

				} else if (storageLocation.storageType === StorageType.OBJECT) {

					value[DesktopDataStore.POUCH_DB_ID_FIELD] = storageLocation.key;

					if (result[DesktopDataStore.POUCH_DB_REV_FIELD]) {
						value[DesktopDataStore.POUCH_DB_REV_FIELD] = result[DesktopDataStore.POUCH_DB_REV_FIELD];
					}

					promise = this.database.put(value);
				}

				return promise.then(() => {
					return this.fetch(storageLocation, defaultStorageValue);
				});

			});

		} else if (storageLocation.storageType === StorageType.SINGLE_VALUE) {

			savePromise = this.findDocs(storageLocation).then(result => {

				let newDoc;
				if (result.docs[0]) {
					newDoc = result.docs[0];
					newDoc[DesktopDataStore.POUCH_DB_SINGLE_VALUE_FIELD] = value;
				} else {
					newDoc = {};
					newDoc[DesktopDataStore.POUCH_DB_ID_FIELD] = storageLocation.key;
					newDoc[DesktopDataStore.POUCH_DB_SINGLE_VALUE_FIELD] = value;
				}

				return this.database.put(newDoc).then(() => {
					return this.fetch(storageLocation, defaultStorageValue);
				});

			});


		} else {
			throw new Error("Unknown StorageType");
		}

		return savePromise;
	}

	public upsertProperty<V>(storageLocation: StorageLocationModel, path: string | string[], value: V, defaultStorageValue: T[] | T): Promise<T> {

		return this.fetch(storageLocation, defaultStorageValue).then((doc: T) => {

			if (_.isArray(doc)) {
				return Promise.reject("Cannot save property to a collection");
			}

			if (!_.isObject(doc)) {
				return Promise.reject("Cannot save property of a value");
			}

			doc = _.set(doc as Object, path, value) as T; // Update property of doc
			return <Promise<T>> this.save(storageLocation, doc, defaultStorageValue);
		});
	}
}
