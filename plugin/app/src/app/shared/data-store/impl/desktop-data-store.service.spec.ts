import { TestBed } from "@angular/core/testing";

import { DesktopDataStore } from "./desktop-data-store.service";
import { StorageLocationModel } from "../storage-location.model";
import * as _ from "lodash";
import { LoggerService } from "../../services/logging/logger.service";
import { ConsoleLoggerService } from "../../services/logging/console-logger.service";
import { StorageType } from "../storage-type.enum";
import Spy = jasmine.Spy;

describe("DesktopDataStore", () => {

	class FakeDoc {
		_id?: string;
		$doctype?: string;

		constructor(id: string) {
			this._id = id;
			this.$doctype = id;
		}
	}

	class FakeSettings {

		maxHr: number;
		restHr: number;
		weight: number;

		constructor(maxHr: number, restHr: number, weight: number) {
			this.maxHr = maxHr;
			this.restHr = restHr;
			this.weight = weight;
		}
	}

	class FakeAthlete extends FakeDoc {

		name: string;
		age: number;
		fakeSettings: FakeSettings[];

		constructor(name: string, age: number, fakeSettings: FakeSettings[]) {
			super("fakeAthlete");
			this.name = name;
			this.age = age;
			this.fakeSettings = fakeSettings;
		}
	}

	class FakeDateTime extends FakeDoc {

		$value: any;

		constructor($value: any) {
			super("fakeDateTime");
			this.$value = $value;
		}
	}

	class FakeActivity extends FakeDoc {

		activityId: string;
		name: string;
		type: string;
		start_time: string;
		end_time: string;
		duration: number;

		constructor(activityId: string, name: string, type: string, start_time: string, duration: number) {
			super("fakeSyncedActivity:" + activityId);
			this.$doctype = "fakeSyncedActivity"; // Override to ensure doctype
			this.activityId = activityId;
			this.name = name;
			this.type = type;
			this.start_time = start_time;
			this.duration = duration;

			const endDate = new Date(start_time);
			endDate.setSeconds(endDate.getSeconds() + this.duration);
			this.end_time = endDate.toISOString();
		}
	}

	let desktopDataStore: DesktopDataStore<any[] | any>;

	const FAKE_EXISTING_DOCUMENTS: FakeDoc[] = [
		new FakeAthlete("Thomas", 31, [new FakeSettings(189, 60, 75),
			new FakeSettings(195, 50, 72)]),

		new FakeDateTime(new Date().getTime()),

		new FakeActivity("00001", "Zwift climb", "Ride", "2019-03-12T16:00:00Z", 3600),
		new FakeActivity("00002", "Recover session", "Ride", "2019-03-17T16:39:48Z", 3600),
		new FakeActivity("00003", "Easy running day!", "Run", "2019-05-01T16:39:48Z", 3600),
	];

	const FAKE_ATHLETE_STORAGE_LOCATION = new StorageLocationModel("fakeAthlete", StorageType.OBJECT);
	const FAKE_ACTIVITIES_STORAGE_LOCATION = new StorageLocationModel("fakeSyncedActivity", StorageType.COLLECTION, "activityId");
	const FAKE_DATE_TIME_STORAGE_LOCATION = new StorageLocationModel("fakeDateTime", StorageType.SINGLE_VALUE);

	beforeEach((done: Function) => {

		TestBed.configureTestingModule({
			providers: [
				DesktopDataStore,
				{provide: LoggerService, useClass: ConsoleLoggerService}
			]
		});

		desktopDataStore = TestBed.get(DesktopDataStore);

		const fakeDocs = _.cloneDeep(FAKE_EXISTING_DOCUMENTS);

		desktopDataStore.database.allDocs().then(results => {
			expect(results.total_rows).toEqual(0);
			return desktopDataStore.database.bulkDocs(fakeDocs);

		}).then(results => {
			expect(results.length).toEqual(fakeDocs.length);
			done();

		}).catch(error => {
			console.error(error);
			throw error;
		});
	});

	afterEach((done: Function) => {

		// Cleaning database
		desktopDataStore.database.destroy().then(() => {
			done();
		}).catch(error => {
			console.error(error);
			throw error;
		});
	});

	describe("Handle object", () => {

		it("should fetch a FakeAthlete object", (done: Function) => {

			// Given
			const expectedFakeAthlete: FakeAthlete = <FakeAthlete> _.find(FAKE_EXISTING_DOCUMENTS, {_id: "fakeAthlete"});

			// When
			const promise: Promise<FakeAthlete> = <Promise<FakeAthlete>> desktopDataStore.fetch(FAKE_ATHLETE_STORAGE_LOCATION, null);

			// Then
			promise.then((fakeAthlete: FakeAthlete) => {

				expect(fakeAthlete._id).toEqual(expectedFakeAthlete._id);
				expect(fakeAthlete.name).toEqual(expectedFakeAthlete.name);
				expect(fakeAthlete.age).toEqual(expectedFakeAthlete.age);
				expect(fakeAthlete.fakeSettings.length).toEqual(expectedFakeAthlete.fakeSettings.length);
				expect(fakeAthlete.$doctype).toEqual(expectedFakeAthlete.$doctype);

				done();

			}, error => {
				expect(error).toBeNull();
				expect(false).toBeTruthy("Whoops! I should not be here!");
				done();
			});
		});

		it("should fetch default storage value when FakeAthlete object is missing in database", (done: Function) => {

			// Given
			const defaultFakeAthlete: FakeAthlete = new FakeAthlete("Your Name", 30, []);

			const promiseMissing = desktopDataStore.database.get(FAKE_ATHLETE_STORAGE_LOCATION.key).then(fakeAthlete => {
				return desktopDataStore.database.remove(fakeAthlete);
			});

			// When
			const promise: Promise<FakeAthlete> = <Promise<FakeAthlete>> promiseMissing.then(() => {
				return desktopDataStore.fetch(FAKE_ATHLETE_STORAGE_LOCATION, defaultFakeAthlete);
			});

			// Then
			promise.then((fakeAthlete: FakeAthlete) => {

				expect(fakeAthlete._id).toEqual(defaultFakeAthlete._id);
				expect(fakeAthlete.name).toEqual(defaultFakeAthlete.name);
				expect(fakeAthlete.age).toEqual(defaultFakeAthlete.age);
				expect(fakeAthlete.fakeSettings.length).toEqual(defaultFakeAthlete.fakeSettings.length);

				done();

			}, error => {
				expect(error).toBeNull();
				expect(false).toBeTruthy("Whoops! I should not be here!");
				done();
			});
		});

		it("should get by id a FakeAthlete object", (done: Function) => {

			// Given
			const id = "fakeAthlete";
			const expectedFakeAthlete: FakeAthlete = <FakeAthlete> _.find(FAKE_EXISTING_DOCUMENTS, {_id: id});

			// When
			const promise: Promise<FakeAthlete> = <Promise<FakeAthlete>> desktopDataStore.getById(FAKE_ATHLETE_STORAGE_LOCATION, id);

			// Then
			promise.then((fakeAthlete: FakeAthlete) => {

				expect(fakeAthlete._id).toEqual(expectedFakeAthlete._id);
				expect(fakeAthlete.name).toEqual(expectedFakeAthlete.name);
				expect(fakeAthlete.age).toEqual(expectedFakeAthlete.age);
				expect(fakeAthlete.fakeSettings.length).toEqual(expectedFakeAthlete.fakeSettings.length);
				expect(fakeAthlete.$doctype).toEqual(expectedFakeAthlete.$doctype);

				done();

			}, error => {
				expect(error).toBeNull();
				expect(false).toBeTruthy("Whoops! I should not be here!");
				done();
			});
		});

		it("should save and replace a FakeAthlete object", (done: Function) => {

			// Given
			const newFakeAthlete: FakeAthlete = <FakeAthlete> _.cloneDeep(_.find(FAKE_EXISTING_DOCUMENTS, {_id: "fakeAthlete"}));
			newFakeAthlete.age = 99;
			newFakeAthlete.name = "Fake name";
			newFakeAthlete.fakeSettings = [new FakeSettings(99, 99, 99)];

			// When
			const promise: Promise<FakeAthlete> = <Promise<FakeAthlete>> desktopDataStore.save(FAKE_ATHLETE_STORAGE_LOCATION, newFakeAthlete, null);

			// Then
			promise.then((savedFakeAthlete: FakeAthlete) => {

				expect(savedFakeAthlete._id).toEqual(newFakeAthlete._id);
				expect(savedFakeAthlete.name).toEqual(newFakeAthlete.name);
				expect(savedFakeAthlete.age).toEqual(newFakeAthlete.age);
				expect(savedFakeAthlete.fakeSettings.length).toEqual(newFakeAthlete.fakeSettings.length);
				expect(savedFakeAthlete.$doctype).toEqual(newFakeAthlete.$doctype);

				done();

			}, error => {
				expect(error).toBeNull();
				expect(false).toBeTruthy("Whoops! I should not be here!");
				done();
			});

		});

		it("should save a FakeAthlete when object is missing in database", (done: Function) => {

			// Given
			const expectedDocType = "fakeAthlete";
			const defaultFakeAthlete: FakeAthlete = {
				name: "Your Name",
				age: 30,
				fakeSettings: [new FakeSettings(11, 11, 11)]
			};

			const newFakeAthlete: FakeAthlete = {
				name: "Fake name",
				age: 99,
				fakeSettings: [new FakeSettings(99, 99, 99)]
			};

			const promiseMissing = desktopDataStore.database.get(FAKE_ATHLETE_STORAGE_LOCATION.key).then(fakeAthlete => {
				return desktopDataStore.database.remove(fakeAthlete);
			});

			// When
			const promise: Promise<FakeAthlete> = promiseMissing.then(() => {
				return <Promise<FakeAthlete>> desktopDataStore.save(FAKE_ATHLETE_STORAGE_LOCATION, newFakeAthlete, defaultFakeAthlete);
			});

			// Then
			promise.then((savedFakeAthlete: FakeAthlete) => {

				expect(savedFakeAthlete._id).toEqual(newFakeAthlete._id);
				expect(savedFakeAthlete.name).toEqual(newFakeAthlete.name);
				expect(savedFakeAthlete.age).toEqual(newFakeAthlete.age);
				expect(savedFakeAthlete.fakeSettings.length).toEqual(newFakeAthlete.fakeSettings.length);
				expect(savedFakeAthlete.$doctype).toEqual(expectedDocType);

				done();

			}, error => {
				expect(error).toBeNull();
				expect(false).toBeTruthy("Whoops! I should not be here!");
				done();
			});

		});

		it("should put (create) a FakeAthlete as object", (done: Function) => {

			// Given
			const expectedDocId = "fakeAthlete";
			const docType = "fakeAthlete";
			const newFakeAthlete: FakeAthlete = {name: "Jean kevin", age: 30, fakeSettings: []};

			const promiseMissing = desktopDataStore.database.get(FAKE_ATHLETE_STORAGE_LOCATION.key).then(fakeAthlete => {
				return desktopDataStore.database.remove(fakeAthlete);
			});

			// When
			const promise: Promise<FakeAthlete> = promiseMissing.then(() => {
				return <Promise<FakeAthlete>> desktopDataStore.put(FAKE_ATHLETE_STORAGE_LOCATION, newFakeAthlete);
			});

			// Then
			promise.then((fakeAthlete: FakeAthlete) => {

				expect(fakeAthlete._id).toEqual(expectedDocId);
				expect(fakeAthlete.name).toEqual(newFakeAthlete.name);
				expect(fakeAthlete.age).toEqual(newFakeAthlete.age);
				expect(fakeAthlete.fakeSettings).toEqual(newFakeAthlete.fakeSettings);
				expect(fakeAthlete.$doctype).toEqual(docType);

				done();

			}, error => {
				expect(error).toBeNull();
				expect(false).toBeTruthy("Whoops! I should not be here!");
				done();
			});
		});

		it("should put (update) a FakeAthlete as object", (done: Function) => {

			// Given
			const docId = "fakeAthlete";
			const docType = "fakeAthlete";
			const updatedFakeAthlete: FakeAthlete = {_id: docId, name: "Jean kevin", age: 30, fakeSettings: [], $doctype: docType};

			const promiseSetRevision = desktopDataStore.database.get(docId).then(doc => {
				updatedFakeAthlete[DesktopDataStore.POUCH_DB_REV_FIELD] = doc._rev;
				return Promise.resolve();
			});

			// When
			const promise: Promise<FakeAthlete> = promiseSetRevision.then(() => {
				return desktopDataStore.put(FAKE_ACTIVITIES_STORAGE_LOCATION, updatedFakeAthlete);
			});

			// Then
			promise.then((fakeAthlete: FakeAthlete) => {

				expect(fakeAthlete._id).toEqual(docId);
				expect(fakeAthlete.name).toEqual(updatedFakeAthlete.name);
				expect(fakeAthlete.age).toEqual(updatedFakeAthlete.age);
				expect(fakeAthlete.fakeSettings).toEqual(updatedFakeAthlete.fakeSettings);
				expect(fakeAthlete.$doctype).toEqual(docType);

				done();

			}, error => {
				expect(error).toBeNull();
				expect(false).toBeTruthy("Whoops! I should not be here!");
				done();
			});
		});

		it("should upsert property of a FakeAthlete object", (done: Function) => {

			// Given
			const newValue = 666;
			const updatePath = ["fakeSettings", "1", "weight"]; // eq "fakeSettings[1].weight"

			const expectedFakeAthlete: FakeAthlete = <FakeAthlete> _.find(FAKE_EXISTING_DOCUMENTS, {_id: "fakeAthlete"});
			expectedFakeAthlete.fakeSettings[1].weight = newValue;

			// When
			const promise: Promise<FakeAthlete> = <Promise<FakeAthlete>> desktopDataStore.upsertProperty(FAKE_ATHLETE_STORAGE_LOCATION,
				updatePath, newValue, null);

			// Then
			promise.then((savedFakeAthlete: FakeAthlete) => {

				expect(savedFakeAthlete._id).toEqual(expectedFakeAthlete._id);
				expect(savedFakeAthlete.name).toEqual(expectedFakeAthlete.name);
				expect(savedFakeAthlete.age).toEqual(expectedFakeAthlete.age);
				expect(savedFakeAthlete.fakeSettings.length).toEqual(expectedFakeAthlete.fakeSettings.length);
				expect(savedFakeAthlete.fakeSettings[1].weight).toEqual(expectedFakeAthlete.fakeSettings[1].weight);
				expect(savedFakeAthlete.$doctype).toEqual(expectedFakeAthlete.$doctype);

				done();

			}, error => {
				expect(error).toBeNull();
				expect(false).toBeTruthy("Whoops! I should not be here!");
				done();
			});

		});

		it("should clear FakeAthlete object", (done: Function) => {

			// When
			const promise: Promise<void> = desktopDataStore.clear(FAKE_ATHLETE_STORAGE_LOCATION);

			// Then
			promise.then(() => {

				desktopDataStore.database.find({
					selector: {
						_id: {$eq: FAKE_ATHLETE_STORAGE_LOCATION.key}
					}
				}).then(results => {
					expect(results.docs.length).toEqual(0);
					done();
				});

			}, error => {
				expect(error).toBeNull();
				expect(false).toBeTruthy("Whoops! I should not be here!");
				done();
			});
		});

	});

	describe("Handle collection", () => {

		it("should fetch a FakeActivity collection", (done: Function) => {

			// Given
			const expectedDocType = "fakeSyncedActivity";
			const expectedFakeActivities: FakeActivity[] = <FakeActivity[]> _.filter(FAKE_EXISTING_DOCUMENTS, (doc: FakeDoc) => {
				return doc._id.match("fakeSyncedActivity:") !== null;
			});

			// When
			const promise: Promise<FakeActivity[]> = <Promise<FakeActivity[]>> desktopDataStore.fetch(FAKE_ACTIVITIES_STORAGE_LOCATION, null);

			// Then
			promise.then((fakeActivities: FakeActivity[]) => {

				expect(fakeActivities.length).toEqual(3);
				expect(fakeActivities[0]._id).toEqual(expectedFakeActivities[0]._id);
				expect(fakeActivities[0].name).toEqual(expectedFakeActivities[0].name);
				expect(fakeActivities[0].type).toEqual(expectedFakeActivities[0].type);
				expect(fakeActivities[0].$doctype).toEqual(expectedDocType);

				expect(fakeActivities[1]._id).toEqual(expectedFakeActivities[1]._id);
				expect(fakeActivities[1].name).toEqual(expectedFakeActivities[1].name);
				expect(fakeActivities[1].type).toEqual(expectedFakeActivities[1].type);
				expect(fakeActivities[1].$doctype).toEqual(expectedDocType);

				expect(fakeActivities[2]._id).toEqual(expectedFakeActivities[2]._id);
				expect(fakeActivities[2].name).toEqual(expectedFakeActivities[2].name);
				expect(fakeActivities[2].type).toEqual(expectedFakeActivities[2].type);
				expect(fakeActivities[2].$doctype).toEqual(expectedDocType);

				done();

			}, error => {
				expect(error).toBeNull();
				expect(false).toBeTruthy("Whoops! I should not be here!");
				done();
			});
		});

		describe("Find in collection", () => {

			it("should find FakeActivity 'Ride' collection", (done: Function) => {

				// Given
				const expectedType = "Ride";
				const query: PouchDB.Find.FindRequest<FakeActivity[]> = {
					selector: {
						type: {
							$eq: expectedType
						}
					}
				};

				const promise: Promise<FakeActivity[]> = <Promise<FakeActivity[]>> desktopDataStore.fetch(FAKE_ACTIVITIES_STORAGE_LOCATION,
					null, query);

				// Then
				promise.then((fakeActivities: FakeActivity[]) => {

					expect(fakeActivities.length).toEqual(2);
					expect(fakeActivities[0].type).toEqual(expectedType);
					expect(fakeActivities[1].type).toEqual(expectedType);

					done();

				}, error => {
					expect(error).toBeNull();
					expect(false).toBeTruthy("Whoops! I should not be here!");
					done();
				});
			});

			it("should find FakeActivity between start & end time", (done: Function) => {

				// Given
				const expectedId = "00001";
				const activityStartTime = "2019-03-12T15:00:00Z";
				const activityEndTime = "2019-03-12T17:00:00Z";

				const query: PouchDB.Find.FindRequest<FakeActivity[]> = {
					selector: {
						start_time: {
							$gte: activityStartTime,
						},
						end_time: {
							$lte: activityEndTime,
						}
					}
				};

				const promise: Promise<FakeActivity[]> = <Promise<FakeActivity[]>> desktopDataStore.fetch(FAKE_ACTIVITIES_STORAGE_LOCATION,
					null, query);

				// Then
				promise.then((fakeActivities: FakeActivity[]) => {

					expect(fakeActivities.length).toEqual(1);
					expect(fakeActivities[0].activityId).toEqual(expectedId);

					done();

				}, error => {
					expect(error).toBeNull();
					expect(false).toBeTruthy("Whoops! I should not be here!");
					done();
				});
			});

		});

		it("should fetch default storage value when FakeActivity collection is missing in database", (done: Function) => {

			// Given
			const defaultStorageValue = [];
			const promiseMissingCollection = desktopDataStore.database.destroy().then(() => { // Clean database and only enter 1 row (a fake athlete)
				const fakeAthlete = _.cloneDeep(_.find(FAKE_EXISTING_DOCUMENTS, {_id: "fakeAthlete"}));
				desktopDataStore.setup();
				desktopDataStore.database.put(fakeAthlete).then(() => {
					return Promise.resolve();
				});
			});

			// When
			const promise: Promise<FakeActivity[]> = promiseMissingCollection.then(() => {
				return <Promise<FakeActivity[]>> desktopDataStore.fetch(FAKE_ACTIVITIES_STORAGE_LOCATION, defaultStorageValue);
			});

			// Then
			promise.then((fakeActivities: FakeActivity[]) => {

				expect(fakeActivities).toEqual(defaultStorageValue);

				done();

			}, error => {
				expect(error).toBeNull();
				expect(false).toBeTruthy("Whoops! I should not be here!");
				done();
			});
		});

		it("should get by id a FakeActivity into a collection", (done: Function) => {

			// Given
			const id = "fakeSyncedActivity:00002";
			const expectedDocType = "fakeSyncedActivity";
			const expectedFakeActivity: FakeActivity = <FakeActivity> _.find(FAKE_EXISTING_DOCUMENTS, {_id: id});

			// When
			const promise: Promise<FakeActivity> = desktopDataStore.getById(FAKE_ACTIVITIES_STORAGE_LOCATION, id);

			// Then
			promise.then((fakeActivity: FakeActivity) => {

				expect(fakeActivity._id).toEqual(expectedFakeActivity._id);
				expect(fakeActivity.name).toEqual(expectedFakeActivity.name);
				expect(fakeActivity.type).toEqual(expectedFakeActivity.type);
				expect(fakeActivity.$doctype).toEqual(expectedDocType);

				done();

			}, error => {
				expect(error).toBeNull();
				expect(false).toBeTruthy("Whoops! I should not be here!");
				done();
			});
		});

		it("should put (create) a FakeActivity into collection", (done: Function) => {

			// Given
			const expectedDocType = "fakeSyncedActivity";
			const id = "00009";
			const expectedDocId = "fakeSyncedActivity:" + id;
			const newFakeActivity: FakeActivity = {
				activityId: id,
				name: "New activity !",
				type: "Ride",
				start_time: "2019-03-12T16:39:48Z",
				end_time: "2019-03-12T16:39:48Z",
				duration: 3600,
			};

			// When
			const promise: Promise<FakeActivity> = desktopDataStore.put(FAKE_ACTIVITIES_STORAGE_LOCATION, newFakeActivity);

			// Then
			promise.then((fakeActivity: FakeActivity) => {

				expect(fakeActivity._id).toEqual(expectedDocId);
				expect(fakeActivity.name).toEqual(newFakeActivity.name);
				expect(fakeActivity.activityId).toEqual(newFakeActivity.activityId);
				expect(fakeActivity.type).toEqual(newFakeActivity.type);
				expect(fakeActivity.$doctype).toEqual(expectedDocType);

				done();

			}, error => {
				expect(error).toBeNull();
				expect(false).toBeTruthy("Whoops! I should not be here!");
				done();
			});
		});

		it("should put (update) a FakeActivity into collection", (done: Function) => {

			// Given
			const docType = "fakeSyncedActivity";
			const id = "00001";
			const docId = "fakeSyncedActivity:" + id;
			const updatedFakeActivity: FakeActivity = {
				_id: docId,
				activityId: id,
				name: "Updated activity !",
				type: "Run",
				start_time: "2019-03-12T16:39:48Z",
				duration: 3600,
				end_time: "2019-03-12T16:39:48Z",
				$doctype: docType
			};

			const putSpy = spyOn(desktopDataStore.database, "put").and.callThrough();

			const promiseSetRevision = desktopDataStore.database.get(docId).then(doc => {
				updatedFakeActivity[DesktopDataStore.POUCH_DB_REV_FIELD] = doc._rev;
				return Promise.resolve();
			});

			// When
			const promise: Promise<FakeActivity> = promiseSetRevision.then(() => {
				return desktopDataStore.put(FAKE_ACTIVITIES_STORAGE_LOCATION, updatedFakeActivity);
			});

			// Then
			promise.then((fakeActivity: FakeActivity) => {

				expect(fakeActivity._id).toEqual(docId);
				expect(fakeActivity.name).toEqual(updatedFakeActivity.name);
				expect(fakeActivity.activityId).toEqual(updatedFakeActivity.activityId);
				expect(fakeActivity.type).toEqual(updatedFakeActivity.type);
				expect(fakeActivity.$doctype).toEqual(docType);
				expect(putSpy).toHaveBeenCalledWith(updatedFakeActivity);

				done();

			}, error => {
				expect(error).toBeNull();
				expect(false).toBeTruthy("Whoops! I should not be here!");
				done();
			});
		});

		it("should save and replace an existing FakeActivity collection", (done: Function) => {

			// Given
			const expectedLength = 3;
			const newFakeActivities: FakeActivity[] = [
				{
					activityId: "00003",
					name: "Running day! (rename)",
					type: "Run",
					start_time: "2019-03-12T16:39:48Z",
					end_time: "2019-03-12T16:39:48Z",
					duration: 3600,
				},
				{
					activityId: "00004",
					name: "Recovery spins",
					type: "Ride",
					start_time: "2019-03-12T16:39:48Z",
					end_time: "2019-03-12T16:39:48Z",
					duration: 3600,
				},
				{
					activityId: "00005",
					name: "Marathon",
					type: "Run",
					start_time: "2019-03-12T16:39:48Z",
					end_time: "2019-03-12T16:39:48Z",
					duration: 3600,
				},
			];

			const expectedExistRenamedActivity = <FakeActivity> _.find(_.cloneDeep(newFakeActivities), activity => {
				return activity.activityId === "00003";
			});
			expectedExistRenamedActivity._id = "fakeSyncedActivity:00003";
			expectedExistRenamedActivity.$doctype = "fakeSyncedActivity";

			const expectedExistActivity = <FakeActivity> _.find(_.cloneDeep(newFakeActivities), activity => {
				return activity.activityId === "00004";
			});
			expectedExistActivity._id = "fakeSyncedActivity:00004";
			expectedExistActivity.$doctype = "fakeSyncedActivity";

			const expectedExistActivity2 = <FakeActivity> _.find(_.cloneDeep(newFakeActivities), activity => {
				return activity.activityId === "00005";
			});
			expectedExistActivity2._id = "fakeSyncedActivity:00005";
			expectedExistActivity2.$doctype = "fakeSyncedActivity";


			// When
			const promise: Promise<FakeActivity[]> = <Promise<FakeActivity[]>> desktopDataStore.save(FAKE_ACTIVITIES_STORAGE_LOCATION,
				newFakeActivities, []);

			// Then
			promise.then((results: FakeActivity[]) => {

				expect(results).not.toBeNull();

				// Test new person added
				const addedFakeActivity_1: FakeActivity = _.find(results, {_id: "fakeSyncedActivity:00004"});
				expect(addedFakeActivity_1._id).toEqual(expectedExistActivity._id);
				expect(addedFakeActivity_1.name).toEqual(expectedExistActivity.name);
				expect(addedFakeActivity_1.type).toEqual(expectedExistActivity.type);
				expect(addedFakeActivity_1.$doctype).toEqual(expectedExistActivity.$doctype);

				const fakeRenamedActivity: FakeActivity = _.find(results, {_id: "fakeSyncedActivity:00003"});
				expect(fakeRenamedActivity._id).toEqual(expectedExistRenamedActivity._id);
				expect(fakeRenamedActivity.name).toEqual(expectedExistRenamedActivity.name);
				expect(fakeRenamedActivity.type).toEqual(expectedExistRenamedActivity.type);
				expect(fakeRenamedActivity.$doctype).toEqual(expectedExistRenamedActivity.$doctype);

				// Test person removed
				const unknownActivity = _.find(results, {_id: "fakeSyncedActivity:00001"});
				expect(unknownActivity).toBeUndefined();

				const addedFakeActivity_2: FakeActivity = _.find(results, {_id: "fakeSyncedActivity:00005"});
				expect(addedFakeActivity_2._id).toEqual(expectedExistActivity2._id);
				expect(addedFakeActivity_2.name).toEqual(expectedExistActivity2.name);
				expect(addedFakeActivity_2.type).toEqual(expectedExistActivity2.type);
				expect(addedFakeActivity_2.$doctype).toEqual(expectedExistActivity2.$doctype);

				expect(results.length).toEqual(expectedLength);

				done();

			}, error => {
				console.log(error);
				expect(error).toBeNull();
				expect(false).toBeTruthy("Whoops! I should not be here!");
				done();
			});
		});

		it("should reject upsert of a FakeActivity collection", (done: Function) => {

			// Given
			const newValue = "foo";
			const updatePath = ["none"];

			// When
			const promise = desktopDataStore.upsertProperty(FAKE_ACTIVITIES_STORAGE_LOCATION, updatePath, newValue, []);

			// Then
			promise.then(() => {
				expect(false).toBeTruthy("Whoops! I should not be here!");
				done();

			}, error => {
				expect(error).not.toBeNull();
				expect(error).toEqual("Cannot save property to a collection");
				done();
			});
		});

		it("should clear FakeActivity collection", (done: Function) => {

			// When
			const promise: Promise<void> = desktopDataStore.clear(FAKE_ACTIVITIES_STORAGE_LOCATION);

			// Then
			promise.then(() => {

				desktopDataStore.database.find({
					selector: {
						_id: {$regex: "^" + FAKE_ACTIVITIES_STORAGE_LOCATION.key + DesktopDataStore.POUCH_DB_ID_LIST_SEPARATOR + ".*"}
					}
				}).then(results => {
					expect(results.docs.length).toEqual(0);
					done();
				});

			}, error => {
				expect(error).toBeNull();
				expect(false).toBeTruthy("Whoops! I should not be here!");
				done();
			});
		});
	});

	describe("Handle single value", () => {

		it("should fetch a FakeDateTime as single value", (done: Function) => {

			// Given
			const expectedFakeDateTime = (<FakeDateTime> _.find(FAKE_EXISTING_DOCUMENTS, {_id: "fakeDateTime"})).$value;

			// When
			const promise: Promise<number> = desktopDataStore.fetch(FAKE_DATE_TIME_STORAGE_LOCATION, null);

			// Then
			promise.then((fakeDateTime: number) => {

				expect(fakeDateTime).toEqual(expectedFakeDateTime);

				done();

			}, error => {
				expect(error).toBeNull();
				expect(false).toBeTruthy("Whoops! I should not be here!");
				done();
			});

		});

		it("should fetch default storage value when FakeDateTime is missing in database", (done: Function) => {

			// Given
			const defaultStorageValue = null;
			const promiseMissingCollection = desktopDataStore.database.destroy().then(() => { // Clean database and only enter 1 row (a fake athlete)
				const fakeAthlete = _.cloneDeep(_.find(FAKE_EXISTING_DOCUMENTS, {_id: "fakeAthlete"}));
				desktopDataStore.setup();
				desktopDataStore.database.put(fakeAthlete).then(() => {
					return Promise.resolve();
				});
			});

			// When
			const promise: Promise<number> = promiseMissingCollection.then(() => {
				return desktopDataStore.fetch(FAKE_DATE_TIME_STORAGE_LOCATION, defaultStorageValue);
			});

			// Then
			promise.then((fakeDateTime: number) => {
				expect(fakeDateTime).toEqual(defaultStorageValue);
				done();
			}, error => {
				expect(error).toBeNull();
				expect(false).toBeTruthy("Whoops! I should not be here!");
				done();
			});

		});

		it("should get by id a FakeDateTime as single value", (done: Function) => {

			// Given
			const id = "fakeDateTime";
			const expectedFakeDateTime: FakeDateTime = <FakeDateTime> _.find(FAKE_EXISTING_DOCUMENTS, {_id: id});

			// When
			const promise: Promise<number> = desktopDataStore.getById(FAKE_DATE_TIME_STORAGE_LOCATION, id);

			// Then
			promise.then((fakeDateTime: number) => {

				expect(fakeDateTime).toEqual(expectedFakeDateTime.$value);
				done();

			}, error => {
				expect(error).toBeNull();
				expect(false).toBeTruthy("Whoops! I should not be here!");
				done();
			});
		});

		it("should save and replace a FakeDateTime single value", (done: Function) => {

			// Given
			const newDateTime = _.random(10000);

			// When
			const promise: Promise<number> = <Promise<number>> desktopDataStore.save(FAKE_DATE_TIME_STORAGE_LOCATION, newDateTime, null);

			// Then
			promise.then((fakeDateTime: number) => {

				expect(fakeDateTime).toEqual(newDateTime);

				done();

			}, error => {
				expect(error).toBeNull();
				expect(false).toBeTruthy("Whoops! I should not be here!");
				done();
			});

		});

		it("should save a FakeDateTime when FakeDateTime is missing in database", (done: Function) => {

			// Given
			const newDateTime = _.random(10000);
			const expectedCalledWith: FakeDateTime = {
				_id: FAKE_DATE_TIME_STORAGE_LOCATION.key,
				$doctype: FAKE_DATE_TIME_STORAGE_LOCATION.key,
				$value: newDateTime
			};

			let putSpy: Spy;

			const promiseMissingCollection = desktopDataStore.database.destroy().then(() => { // Clean database and only enter 1 row (a fake athlete)
				const fakeAthlete = _.cloneDeep(_.find(FAKE_EXISTING_DOCUMENTS, {_id: "fakeAthlete"}));
				desktopDataStore.setup();
				desktopDataStore.database.put(fakeAthlete).then(() => {
					putSpy = spyOn(desktopDataStore.database, "put").and.callThrough();
					return Promise.resolve();
				});
			});

			// When
			const promise: Promise<number> = promiseMissingCollection.then(() => {
				return <Promise<number>> desktopDataStore.save(FAKE_DATE_TIME_STORAGE_LOCATION, newDateTime, null);
			});

			// Then
			promise.then((fakeDateTime: number) => {
				expect(fakeDateTime).toEqual(newDateTime);
				expect(putSpy).toHaveBeenCalledWith(expectedCalledWith);
				done();
			}, error => {
				expect(error).toBeNull();
				expect(false).toBeTruthy("Whoops! I should not be here!");
				done();
			});

		});

		it("should put (create) a FakeDateTime as single value", (done: Function) => {

			// Given
			const newDateTime = _.random(10000);
			const expectedCalledWith: FakeDateTime = {
				_id: FAKE_DATE_TIME_STORAGE_LOCATION.key,
				$doctype: FAKE_DATE_TIME_STORAGE_LOCATION.key,
				$value: newDateTime
			};

			let putSpy: Spy;

			const promiseMissingCollection = desktopDataStore.database.destroy().then(() => { // Clean database and only enter 1 row (a fake athlete)
				desktopDataStore.setup();
				putSpy = spyOn(desktopDataStore.database, "put").and.callThrough();
				return Promise.resolve();
			});

			// When
			const promise: Promise<number> = promiseMissingCollection.then(() => {
				return desktopDataStore.put(FAKE_DATE_TIME_STORAGE_LOCATION, newDateTime);
			});

			// Then
			promise.then((fakeDateTime: number) => {
				expect(fakeDateTime).toEqual(newDateTime);
				expect(putSpy).toHaveBeenCalledWith(expectedCalledWith);
				done();

			}, error => {
				expect(error).toBeNull();
				expect(false).toBeTruthy("Whoops! I should not be here!");
				done();
			});
		});

		it("should put (update) a FakeDateTime as single value", (done: Function) => {

			// Given
			const newDateTime = 666;
			const docId = FAKE_DATE_TIME_STORAGE_LOCATION.key;
			const expectedCalledWith: FakeDateTime = {
				_id: docId,
				$doctype: docId,
				$value: newDateTime
			};

			let putSpy: Spy;

			const promiseSetRevision = desktopDataStore.database.get(docId).then(doc => {
				expectedCalledWith[DesktopDataStore.POUCH_DB_REV_FIELD] = doc._rev;
				putSpy = spyOn(desktopDataStore.database, "put").and.callThrough();
				return Promise.resolve();
			});

			// When
			const promise: Promise<number> = promiseSetRevision.then(() => {
				return desktopDataStore.put(FAKE_DATE_TIME_STORAGE_LOCATION, newDateTime);
			});

			// Then
			promise.then((fakeDateTime: number) => {

				expect(fakeDateTime).toEqual(newDateTime);
				expect(putSpy).toHaveBeenCalledWith(expectedCalledWith);

				done();

			}, error => {
				expect(error).toBeNull();
				expect(false).toBeTruthy("Whoops! I should not be here!");
				done();
			});
		});

		it("should reject upsert of a FakeDateTime value", (done: Function) => {

			// Given
			const newValue = 444;
			const updatePath = ["none"];

			// When
			const promise = desktopDataStore.upsertProperty(FAKE_DATE_TIME_STORAGE_LOCATION, updatePath, newValue, null);

			// Then
			promise.then(() => {
				expect(false).toBeTruthy("Whoops! I should not be here!");
				done();

			}, error => {
				expect(error).not.toBeNull();
				expect(error).toEqual("Cannot save property of a value");
				done();
			});

		});

		it("should clear FakeDateTime value", (done: Function) => {

			// When
			const promise: Promise<void> = desktopDataStore.clear(FAKE_DATE_TIME_STORAGE_LOCATION);

			// Then
			promise.then(() => {

				desktopDataStore.database.find({
					selector: {
						_id: {$eq: FAKE_DATE_TIME_STORAGE_LOCATION.key}
					}
				}).then(results => {
					expect(results.docs.length).toEqual(0);
					done();
				});

			}, error => {
				expect(error).toBeNull();
				expect(false).toBeTruthy("Whoops! I should not be here!");
				done();
			});
		});

	});

	it("should return null when get by id a has no results (collection, object & single value)", (done: Function) => {

		// Given
		const id = "fakeSyncedActivity:00010";

		// When
		const promise: Promise<FakeActivity> = desktopDataStore.getById(FAKE_ACTIVITIES_STORAGE_LOCATION, id);

		// Then
		promise.then((fakeActivity: FakeActivity) => {

			expect(fakeActivity).toEqual(null);
			done();

		}, error => {
			expect(error).toBeNull();
			expect(false).toBeTruthy("Whoops! I should not be here!");
			done();
		});
	});

});
