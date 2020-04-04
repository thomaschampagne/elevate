import { Inject, Injectable } from "@angular/core";
import { StorageLocationModel } from "../storage-location.model";
import { DataStore } from "../data-store";
import { AppUsageDetails } from "../../models/app-usage-details.model";
import PouchDB from "pouchdb-browser";
import PouchDBFind from "pouchdb-find";
import PouchDBDebug from "pouchdb-debug";
import { LoggerService } from "../../services/logging/logger.service";
import * as _ from "lodash";
import { StorageType } from "../storage-type.enum";
import { VERSIONS_PROVIDER, VersionsProvider } from "../../services/versions/versions-provider.interface";
import { DesktopDumpModel } from "../../models/dumps/desktop-dump.model";
import { AppUsage } from "../../models/app-usage.model";
import { ActivityDao } from "../../dao/activity/activity.dao";
import { Gzip } from "@elevate/shared/tools";
import { StreamsDao } from "../../dao/streams/streams.dao";
import FindRequest = PouchDB.Find.FindRequest;

@Injectable()
export class DesktopDataStore<T> extends DataStore<T> {

	constructor(@Inject(VERSIONS_PROVIDER) public versionsProvider: VersionsProvider,
				public logger: LoggerService) {
		super();
		this.setup();
	}

	public static readonly POUCH_DB_NAME: string = "elevate";
	public static readonly POUCH_DB_DEBUG: string = null; // values: "*", "pouchdb:find", "pouchdb:http" ...

	public static readonly POUCH_DB_ID_FIELD: string = "_id";
	public static readonly POUCH_DB_ID_LIST_SEPARATOR: string = ":";
	public static readonly POUCH_DB_DOCTYPE_FIELD: string = "$doctype";
	public static readonly POUCH_DB_SINGLE_VALUE_FIELD: string = "$value";
	public static readonly POUCH_DB_DELETED_FIELD: string = "_deleted";
	public static readonly POUCH_DB_REV_FIELD: string = "_rev";

	public static readonly DATABASES: { main: PouchDB.Database, activities: PouchDB.Database, streams: PouchDB.Database } = {
		main: null,
		activities: null,
		streams: null,
	};

	public static readonly STORAGE_TO_DB_MAP: { storageKey: string, dbKey: string, database?: PouchDB.Database }[] = [
		{storageKey: ActivityDao.STORAGE_LOCATION.key, dbKey: "activities"},
		{storageKey: StreamsDao.STORAGE_LOCATION.key, dbKey: "streams"}
	];

	public static getDbIdSelectorByStorageLocation(storageLocation: StorageLocationModel): PouchDB.Find.ConditionOperators {
		const selector = (storageLocation.storageType === StorageType.COLLECTION) ?
			{$regex: "^" + storageLocation.key + DesktopDataStore.POUCH_DB_ID_LIST_SEPARATOR} : {$eq: storageLocation.key};
		selector["$gte"] = null; // Solves "no matching index found, create an index to optimize query time"
		return selector;
	}

	public setup(): void {

		PouchDB.plugin(PouchDBFind); // Register find plugin
		const options = {auto_compaction: true, adapter: "idb"};
		DesktopDataStore.DATABASES.main = new PouchDB(DesktopDataStore.POUCH_DB_NAME + "_main", options);
		DesktopDataStore.DATABASES.activities = new PouchDB(DesktopDataStore.POUCH_DB_NAME + "_activities", options);
		DesktopDataStore.DATABASES.streams = new PouchDB(DesktopDataStore.POUCH_DB_NAME + "_streams", options);

		// Update STORAGE_TO_DB_MAP with the proper associated database
		DesktopDataStore.STORAGE_TO_DB_MAP.forEach(entry => {
			entry.database = DesktopDataStore.DATABASES[entry.dbKey];
		});

		(<any> window).elevateDatabases = DesktopDataStore.DATABASES;

		if (DesktopDataStore.POUCH_DB_DEBUG) {
			PouchDB.plugin(PouchDBDebug); // Register debug plugin
			PouchDB.debug.enable(DesktopDataStore.POUCH_DB_DEBUG);
		}
	}

	public provideDatabase(storageKey: string): PouchDB.Database<T[] | T> {
		const foundEntry = _.find(DesktopDataStore.STORAGE_TO_DB_MAP, {storageKey: storageKey});
		return <PouchDB.Database<T[] | T>> ((foundEntry) ? foundEntry.database : DesktopDataStore.DATABASES.main);
	}

	public clear(storageLocation: StorageLocationModel): Promise<void> {

		const database = this.provideDatabase(storageLocation.key);

		return database.find({
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

					promise = database.bulkDocs(result.docs);

				} else if (storageLocation.storageType === StorageType.OBJECT || storageLocation.storageType === StorageType.SINGLE_VALUE) {

					promise = database.remove(result.docs[0][DesktopDataStore.POUCH_DB_ID_FIELD],
						result.docs[0][DesktopDataStore.POUCH_DB_REV_FIELD]);
				} else {
					throw new Error("Unknown StorageType");
				}
			}

			return promise;

		}).then(() => {
			return Promise.resolve();
		});
	}

	public findDocs(storageLocation: StorageLocationModel, findRequest?: FindRequest<T[] | T>): Promise<PouchDB.Find.FindResponse<T[] | T>> {

		if (!findRequest) {
			findRequest = {
				selector: {
					_id: DesktopDataStore.getDbIdSelectorByStorageLocation(storageLocation)
				}
			};
		} else {
			findRequest = _.set(findRequest, ["selector", DesktopDataStore.POUCH_DB_ID_FIELD],
				DesktopDataStore.getDbIdSelectorByStorageLocation(storageLocation));
		}

		return this.provideDatabase(storageLocation.key).find(findRequest);
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

	public getAppUsageDetails(): Promise<AppUsageDetails> {
		return navigator.storage.estimate().then((storageEstimate: StorageEstimate) => {
			const appUsage = new AppUsage(storageEstimate.usage, storageEstimate.quota);
			const megaBytesInUse = appUsage.bytesInUse / (1024 * 1024);
			const percentUsage = appUsage.bytesInUse / appUsage.quotaBytes * 100;
			const appUsageDetails = new AppUsageDetails(appUsage, megaBytesInUse, percentUsage);
			return Promise.resolve(appUsageDetails);
		});
	}

	public createDump(): Promise<Blob> {

		const prepare = docs => {
			return docs.rows.map(wrappedDoc => {
				delete wrappedDoc.doc[DesktopDataStore.POUCH_DB_REV_FIELD];
				return wrappedDoc.doc;
			});
		};

		const options = {include_docs: true, attachments: true};

		const databases: any = {};

		return DesktopDataStore.DATABASES.main.allDocs(options).then(mainDocs => {
			databases.main = prepare(mainDocs);
			return DesktopDataStore.DATABASES.activities.allDocs(options);
		}).then(activitiesDocs => {
			databases.activities = prepare(activitiesDocs);
			return DesktopDataStore.DATABASES.streams.allDocs(options);
		}).then(streamsDocs => {
			databases.streams = prepare(streamsDocs);

			const desktopDumpModel: DesktopDumpModel = new DesktopDumpModel();

			// Remove revision field before export
			desktopDumpModel.gzippedDatabases = Gzip.pack(JSON.stringify(databases));
			return this.versionsProvider.getPackageVersion().then(version => {
				desktopDumpModel.version = version;
				const blob = new Blob([desktopDumpModel.serialize()], {type: "application/gzip"});
				return Promise.resolve(blob);
			});

		});
	}


	public loadDump(dump: DesktopDumpModel): Promise<void> {
		return new Promise((resolve, reject) => {
			try {
				const inflatedDatabases = Gzip.unpack(dump.gzippedDatabases);
				const databases = JSON.parse(inflatedDatabases);

				const cleanDatabasesPromise = DesktopDataStore.DATABASES.main.destroy().then(() => {
					return DesktopDataStore.DATABASES.activities.destroy();
				}).then(() => {
					return DesktopDataStore.DATABASES.streams.destroy();
				}).then(() => {
					this.setup(); // Recreate databases
					return Promise.resolve();
				});

				cleanDatabasesPromise.then(() => {
					return DesktopDataStore.DATABASES.main.bulkDocs(databases.main);
				}).then(() => {
					return DesktopDataStore.DATABASES.activities.bulkDocs(databases.activities);
				}).then(() => {
					return DesktopDataStore.DATABASES.streams.bulkDocs(databases.streams);
				}).then(() => {
					resolve();
				}).catch(error => {
					reject(error.message);
				});

			} catch (err) {
				reject(err);
			}
		});
	}

	public save(storageLocation: StorageLocationModel, value: T[] | T, defaultStorageValue: T[] | T): Promise<T[] | T> {

		let savePromise: Promise<T[] | T>;

		const database = this.provideDatabase(storageLocation.key);

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
							const collectionDocId = storageLocation.key + DesktopDataStore.POUCH_DB_ID_LIST_SEPARATOR +
								_.get(newDoc, storageLocation.collectionFieldId);
							newDoc[DesktopDataStore.POUCH_DB_ID_FIELD] = collectionDocId;
							newDoc[DesktopDataStore.POUCH_DB_DOCTYPE_FIELD] = storageLocation.key;
						}
						return newDoc;
					});

					// Now apply all changes to collection
					const docsChanges = _.union(removeDocs, putDocs);
					promise = database.bulkDocs(docsChanges);

				} else if (storageLocation.storageType === StorageType.OBJECT) {

					if (result[DesktopDataStore.POUCH_DB_REV_FIELD]) {
						value[DesktopDataStore.POUCH_DB_REV_FIELD] = result[DesktopDataStore.POUCH_DB_REV_FIELD];
					} else {
						value[DesktopDataStore.POUCH_DB_ID_FIELD] = storageLocation.key;
						value[DesktopDataStore.POUCH_DB_DOCTYPE_FIELD] = storageLocation.key;
					}

					promise = database.put(value);
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
				} else {
					newDoc = {};
					newDoc[DesktopDataStore.POUCH_DB_ID_FIELD] = storageLocation.key;
					newDoc[DesktopDataStore.POUCH_DB_DOCTYPE_FIELD] = storageLocation.key;
				}

				newDoc[DesktopDataStore.POUCH_DB_SINGLE_VALUE_FIELD] = value;

				return database.put(newDoc).then(() => {
					return this.fetch(storageLocation, defaultStorageValue);
				});

			});

		} else {
			throw new Error("Unknown StorageType");
		}

		return savePromise;
	}

	public getById(storageLocation: StorageLocationModel, id: string): Promise<T> {

		if (storageLocation.storageType === StorageType.COLLECTION) {
			const keyPrefix = storageLocation.key + DesktopDataStore.POUCH_DB_ID_LIST_SEPARATOR;
			const hasIdKeyPrefix = id.startsWith(keyPrefix);
			id = (hasIdKeyPrefix) ? id : (keyPrefix + id);
		}

		return this.provideDatabase(storageLocation.key).get(id).then(result => {

			if (storageLocation.storageType === StorageType.SINGLE_VALUE) {
				return <Promise<T>> Promise.resolve(result[DesktopDataStore.POUCH_DB_SINGLE_VALUE_FIELD]);
			}

			return <Promise<T>> Promise.resolve(result);

		}, error => {

			if (error.status === 404) { // Not found
				return Promise.resolve(null);
			}

			return Promise.reject(error);
		});
	}

	public put(storageLocation: StorageLocationModel, value: T): Promise<T> {

		const database = this.provideDatabase(storageLocation.key);

		const promisePutDocReady = () => {

			if (storageLocation.storageType === StorageType.COLLECTION || storageLocation.storageType === StorageType.OBJECT) {
				if (!value[DesktopDataStore.POUCH_DB_ID_FIELD]) { // Create

					if (storageLocation.storageType === StorageType.COLLECTION) {
						value[DesktopDataStore.POUCH_DB_ID_FIELD] = storageLocation.key + DesktopDataStore.POUCH_DB_ID_LIST_SEPARATOR
							+ _.get(value, storageLocation.collectionFieldId);

					} else if (storageLocation.storageType === StorageType.OBJECT) {
						value[DesktopDataStore.POUCH_DB_ID_FIELD] = storageLocation.key;
					}

					value[DesktopDataStore.POUCH_DB_DOCTYPE_FIELD] = storageLocation.key;
				}

				return Promise.resolve(value);

			} else if (storageLocation.storageType === StorageType.SINGLE_VALUE) {

				return database.get(storageLocation.key).then(doc => {

					// Just update
					doc[DesktopDataStore.POUCH_DB_REV_FIELD] = doc[DesktopDataStore.POUCH_DB_REV_FIELD];
					doc[DesktopDataStore.POUCH_DB_SINGLE_VALUE_FIELD] = value;
					return Promise.resolve(<T> doc);

				}, error => {
					if (error.status === 404) { // Not found
						const newDoc = <T> {}; // Create new doc
						newDoc[DesktopDataStore.POUCH_DB_ID_FIELD] = storageLocation.key;
						newDoc[DesktopDataStore.POUCH_DB_DOCTYPE_FIELD] = storageLocation.key;
						newDoc[DesktopDataStore.POUCH_DB_SINGLE_VALUE_FIELD] = value;
						return Promise.resolve(newDoc);
					} else {
						return Promise.reject(error);
					}
				});
			}
		};

		return promisePutDocReady().then(putDoc => {
			return database.put(putDoc);
		}).then(result => {
			return this.getById(storageLocation, result.id);
		});
	}

	public removeByIds(storageLocation: StorageLocationModel, ids: (string | number)[], defaultStorageValue: T[] | T): Promise<T | T[]> {

		if (storageLocation.storageType !== StorageType.COLLECTION) {
			return Promise.reject("removeByIds must be called on a collection only");
		}

		const database = this.provideDatabase(storageLocation.key);
		return ids.reduce((previousPromise, id: string | number) => {
			return previousPromise.then(() => {
				return this.getById(storageLocation, <string> id).then((doc: PouchDB.Core.ExistingDocument<T>) => {
					return database.remove(doc);
				}).then(() => {
					return Promise.resolve();
				});
			});

		}, Promise.resolve()).then(() => {
			return this.fetch(storageLocation, defaultStorageValue);
		});
	}

	public upsertProperty<V>(storageLocation: StorageLocationModel, path: string | string[], value: V, defaultStorageValue: T[] | T): Promise<T> {

		return this.fetch(storageLocation, defaultStorageValue).then((doc: T) => {

			if (_.isArray(doc)) {
				return Promise.reject("Cannot save property to a collection");
			}

			if (!_.isObject(doc)) {
				return Promise.reject("Cannot save property of a value");
			}

			doc = _.set(doc, path, value) as T; // Update property of doc
			return <Promise<T>> this.save(storageLocation, doc, defaultStorageValue);
		});
	}

}
