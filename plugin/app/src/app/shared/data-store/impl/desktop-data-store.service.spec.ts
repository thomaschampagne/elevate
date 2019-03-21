import { TestBed } from "@angular/core/testing";

import { DesktopDataStore } from "./desktop-data-store.service";
import { StorageLocationModel } from "../storage-location.model";
import * as _ from "lodash";
import { LoggerService } from "../../services/logging/logger.service";
import { ConsoleLoggerService } from "../../services/logging/console-logger.service";
import { StorageType } from "../storage-type.enum";

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

		constructor(activityId: string, name: string, type: string) {
			super("fakeSyncedActivity:" + activityId);
			this.$doctype = "fakeSyncedActivity"; // Override to ensure doctype
			this.activityId = activityId;
			this.name = name;
			this.type = type;
		}
	}

	let desktopDataStore: DesktopDataStore<any[] | any>;

	const FAKE_EXISTING_DOCUMENTS: FakeDoc[] = [
		new FakeAthlete("Thomas", 31, [new FakeSettings(189, 60, 75),
			new FakeSettings(195, 50, 72)]),

		new FakeDateTime(new Date().getTime()),

		new FakeActivity("00001", "Zwift climb", "Ride"),
		new FakeActivity("00002", "Recover session", "Ride"),
		new FakeActivity("00003", "Easy running day!", "Run"),
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
			const defaultFakeAthlete: FakeAthlete = new FakeAthlete("Your Name", 30, []);
			const newFakeAthlete: FakeAthlete = <FakeAthlete> _.cloneDeep(_.find(FAKE_EXISTING_DOCUMENTS, {_id: "fakeAthlete"}));
			newFakeAthlete.age = 99;
			newFakeAthlete.name = "Fake name";
			newFakeAthlete.fakeSettings = [new FakeSettings(99, 99, 99)];

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
				expect(savedFakeAthlete.$doctype).toEqual(newFakeAthlete.$doctype);

				done();

			}, error => {
				expect(error).toBeNull();
				expect(false).toBeTruthy("Whoops! I should not be here!");
				done();
			});

		});

		it("should upsert property of a FakeAthlete object", (done: Function) => {

			// Given
			const newValue: number = 666;
			const updatePath = ["fakeSettings", "1", "weight"]; // eq "fakeSettings[1].weight"

			const expectedFakeAthlete: FakeAthlete = <FakeAthlete> _.find(FAKE_EXISTING_DOCUMENTS, {_id: "fakeAthlete"});
			expectedFakeAthlete.fakeSettings[1].weight = newValue;

			// When
			const promise: Promise<FakeAthlete> = <Promise<FakeAthlete>> desktopDataStore.upsertProperty(FAKE_ATHLETE_STORAGE_LOCATION, updatePath, newValue, null);

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

		it("should fetch and sort a FakeActivity collection", (done: Function) => {

			// Given
			const expectedFakeActivities: FakeActivity[] = <FakeActivity[]> _.filter(FAKE_EXISTING_DOCUMENTS, (doc: FakeDoc) => {
				return doc._id.match("fakeSyncedActivity:") !== null;
			});

			const findRequest = {
				selector: {
					name: {$gte: null}
				},
				sort: ["name"]
			};

			// When
			const promise: Promise<FakeActivity[]> = <Promise<FakeActivity[]>> desktopDataStore.fetch(FAKE_ACTIVITIES_STORAGE_LOCATION, null, findRequest);

			// Then
			promise.then((fakeActivities: FakeActivity[]) => {

				expect(fakeActivities.length).toEqual(3);
				expect(fakeActivities[0].name).toEqual(expectedFakeActivities[2].name);
				expect(fakeActivities[1].name).toEqual(expectedFakeActivities[1].name);
				expect(fakeActivities[2].name).toEqual(expectedFakeActivities[0].name);

				done();

			}, error => {
				expect(error).toBeNull();
				expect(false).toBeTruthy("Whoops! I should not be here!");
				done();
			});
		});

		it("should fetch default storage value when FakeActivity collection is missing in database", (done: Function) => {

			// Given
			const defaultStorageValue = [];
			const promiseMissingCollection = desktopDataStore.database.destroy().then(() => { // Clean database and only enter 1 row (a fake athlete)
				const fakeAthlete = _.cloneDeep(_.find(FAKE_EXISTING_DOCUMENTS, {_id: "fakeAthlete"}));
				desktopDataStore.setup();
				desktopDataStore.database.put(fakeAthlete);
				return Promise.resolve();
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

		it("should save and replace an existing FakeActivity collection", (done: Function) => {

			// Given
			const expectedLength = 3;
			const newFakeActivities: FakeActivity[] = [
				{activityId: "00003", name: "Running day! (rename)", type: "Run"},
				{activityId: "00004", name: "Recovery spins", type: "Ride"},
				{activityId: "00005", name: "Marathon", type: "Run"}
			];

			const expectedExistRenamedActivity = <FakeActivity> _.find(newFakeActivities, activity => {
				return activity.activityId === "00003";
			});
			expectedExistRenamedActivity._id = "fakeSyncedActivity:00003";
			expectedExistRenamedActivity.$doctype = "fakeSyncedActivity";

			const expectedExistActivity = <FakeActivity> _.find(newFakeActivities, activity => {
				return activity.activityId === "00004";
			});
			expectedExistActivity._id = "fakeSyncedActivity:00004";
			expectedExistActivity.$doctype = "fakeSyncedActivity";


			// When
			const promise: Promise<FakeActivity[]> = <Promise<FakeActivity[]>> desktopDataStore.save(FAKE_ACTIVITIES_STORAGE_LOCATION, newFakeActivities, []);

			// Then
			promise.then((results: FakeActivity[]) => {

				expect(results).not.toBeNull();

				// Test new person added
				const fakeActivity: FakeActivity = _.find(results, {_id: "fakeSyncedActivity:00004"});
				expect(fakeActivity._id).toEqual(expectedExistActivity._id);
				expect(fakeActivity.name).toEqual(expectedExistActivity.name);
				expect(fakeActivity.type).toEqual(expectedExistActivity.type);
				expect(fakeActivity.$doctype).toEqual(expectedExistActivity.$doctype);

				const fakeRenamedActivity: FakeActivity = _.find(results, {_id: "fakeSyncedActivity:00003"});
				expect(fakeRenamedActivity._id).toEqual(expectedExistRenamedActivity._id);
				expect(fakeRenamedActivity.name).toEqual(expectedExistRenamedActivity.name);
				expect(fakeRenamedActivity.type).toEqual(expectedExistRenamedActivity.type);
				expect(fakeRenamedActivity.$doctype).toEqual(expectedExistRenamedActivity.$doctype);

				// Test person removed
				const unknownActivity = _.find(results, {_id: "fakeSyncedActivity:00001"});
				expect(unknownActivity).toBeUndefined();

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
				desktopDataStore.database.put(fakeAthlete);
				return Promise.resolve();
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

			const promiseMissingCollection = desktopDataStore.database.destroy().then(() => { // Clean database and only enter 1 row (a fake athlete)
				const fakeAthlete = _.cloneDeep(_.find(FAKE_EXISTING_DOCUMENTS, {_id: "fakeAthlete"}));
				desktopDataStore.setup();
				desktopDataStore.database.put(fakeAthlete);
				return Promise.resolve();
			});

			// When
			const promise: Promise<number> = promiseMissingCollection.then(() => {
				return <Promise<number>> desktopDataStore.save(FAKE_DATE_TIME_STORAGE_LOCATION, newDateTime, null);
			});

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

});
