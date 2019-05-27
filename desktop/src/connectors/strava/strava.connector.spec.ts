import { StravaConnector } from "./strava.connector";
import { ActivitySyncEvent, ConnectorType, ErrorSyncEvent, StravaApiCredentials, SyncEvent } from "@elevate/shared/sync";
import { sample_activities as fakeActivitiesFixture } from "./fixtures/sample_activities.fixture";
import {
	ActivityStreamsModel,
	AthleteModel,
	BareActivityModel,
	EnvTarget,
	SyncedActivityModel,
	UserSettings
} from "@elevate/shared/models";
import * as _ from "lodash";
import { Subject } from "rxjs";
import { sample_streams as fakeStreamsFixture } from "./fixtures/sample_streams.fixture";

const getActivitiesFixture = (page: number, perPage: number, activities: Array<BareActivityModel[]>) => {
	const from = (page > 1) ? ((page - 1) * perPage) : 0;
	const to = from + perPage;
	return _.cloneDeep(activities[0].slice(from, to));
};

describe("StravaConnector", () => {

	const priority = 1;
	const clientId = 9999;
	const clientSecret = "9999";
	const accessToken = "fakeToken";
	const updateSyncedActivitiesNameAndType = false;

	let stravaConnector: StravaConnector;
	let getStravaBareActivityModelsSpy: jasmine.Spy;
	let processBareActivitiesSpy: jasmine.Spy;
	let findSyncedActivityModelsSpy: jasmine.Spy;
	let getStravaActivityStreamsSpy: jasmine.Spy;
	let fetchRemoteStravaActivityStreamsSpy: jasmine.Spy;

	beforeEach((done: Function) => {

		stravaConnector = new StravaConnector(priority, AthleteModel.DEFAULT_MODEL, UserSettings.getDefaultsByEnvTarget(EnvTarget.DESKTOP),
			new StravaApiCredentials(clientId, clientSecret, accessToken), updateSyncedActivitiesNameAndType);

		// Simulate strava pages
		getStravaBareActivityModelsSpy = spyOn(stravaConnector, "getStravaBareActivityModels");
		getStravaBareActivityModelsSpy.and.callFake((page: number, perPage: number) => {
			return Promise.resolve(getActivitiesFixture(page, perPage, fakeActivitiesFixture));
		});

		processBareActivitiesSpy = spyOn(stravaConnector, "processBareActivities").and.callThrough();

		// By default there's no existing activities
		findSyncedActivityModelsSpy = spyOn(stravaConnector, "findSyncedActivityModels");
		findSyncedActivityModelsSpy.and.returnValue(Promise.resolve(null));

		// Return a fake stream
		fetchRemoteStravaActivityStreamsSpy = spyOn(stravaConnector, "fetchRemoteStravaActivityStreams");
		fetchRemoteStravaActivityStreamsSpy.and.returnValue(Promise.resolve(_.cloneDeep(fakeStreamsFixture)));

		getStravaActivityStreamsSpy = spyOn(stravaConnector, "getStravaActivityStreams");
		getStravaActivityStreamsSpy.and.callThrough();

		done();
	});

	describe("Sync pages", () => {

		it("should recursive sync strava activities pages", (done: Function) => {

			// Given
			const syncEvents = new Subject<SyncEvent>();
			const syncPagesSpy = spyOn(stravaConnector, "syncPages").and.callThrough();
			const expectedSyncPagesCalls = 4;
			const expectedProcessCalls = 3;

			// When
			const promise = stravaConnector.syncPages(syncEvents);

			// Then
			promise.then(() => {

				expect(syncPagesSpy).toBeCalledTimes(expectedSyncPagesCalls);
				expect(getStravaBareActivityModelsSpy).toBeCalledTimes(expectedSyncPagesCalls);
				expect(processBareActivitiesSpy).toBeCalledTimes(expectedProcessCalls);
				done();

			}, error => {
				expect(error).toBeNull();
				done();
			});

		});

		it("should reject recursive sync strava activities pages when remote a page throw an error", (done: Function) => {

			// Given
			const syncEvents = new Subject<SyncEvent>();
			const syncPagesSpy = spyOn(stravaConnector, "syncPages").and.callThrough();
			const expectedSyncPagesCalls = 3;
			const expectedProcessCalls = 2;
			const errorAtPage = 3;
			const errorMessage = "An error has been raised :/";

			getStravaBareActivityModelsSpy.and.callFake((page: number, perPage: number) => {

				if (page === errorAtPage) {
					return Promise.reject(errorMessage);
				}

				return Promise.resolve(getActivitiesFixture(page, perPage, fakeActivitiesFixture));

			});

			// When
			const promise = stravaConnector.syncPages(syncEvents);

			// Then
			promise.then(() => {

				throw new Error("Whoops! I should not be here!");

			}, error => {
				expect(error).not.toBeNull();
				expect(error).toEqual(errorMessage);
				expect(syncPagesSpy).toBeCalledTimes(expectedSyncPagesCalls);
				expect(getStravaBareActivityModelsSpy).toBeCalledTimes(expectedSyncPagesCalls);
				expect(processBareActivitiesSpy).toBeCalledTimes(expectedProcessCalls);
				done();
			});

		});

		it("should reject recursive sync strava activities pages when processing an activity throw an error", (done: Function) => {

			// Given
			const syncEvents = new Subject<SyncEvent>();
			const errorMessage = "An error has been raised :/";

			// Track processBareActivities() calls and throw error on the 3rd call
			let processBareActivitiesCalls = 0;
			processBareActivitiesSpy.and.callFake(() => {
				processBareActivitiesCalls++;
				if (processBareActivitiesCalls === 3) {
					return Promise.reject(errorMessage);
				}
				return Promise.resolve();
			});

			// When
			const promise = stravaConnector.syncPages(syncEvents);

			// Then
			promise.then(() => {

				throw new Error("Whoops! I should not be here!");

			}, error => {
				expect(error).not.toBeNull();
				expect(error).toEqual(errorMessage);
				done();
			});

		});

	});

	describe("Process bare activities", () => {

		it("should find for existing activity when processing bare activities", (done: Function) => {

			// Given
			const syncEvents = new Subject<SyncEvent>();
			const page = 1;
			const perPage = 20;
			const bareActivities = getActivitiesFixture(page, perPage, fakeActivitiesFixture);
			const expectedFindActivityCalls = perPage;

			// When
			const promise = stravaConnector.processBareActivities(syncEvents, bareActivities);

			// Then
			promise.then(() => {

				expect(findSyncedActivityModelsSpy).toBeCalledTimes(expectedFindActivityCalls);
				done();

			}, error => {
				expect(error).toBeNull();
				done();
			});

		});

		it("should send activity sync event when processing 1 bare activity that already exists (updateSyncedActivitiesNameAndType = true)", (done: Function) => {

			// Given
			const syncEvents = new Subject<SyncEvent>();
			const syncEventsSpy = spyOn(syncEvents, "next");
			const page = 1;
			const perPage = 20;
			const bareActivities = getActivitiesFixture(page, perPage, fakeActivitiesFixture);
			const trackCallId = 1; // the 2nd one

			stravaConnector.updateSyncedActivitiesNameAndType = true;

			const expectedSyncedActivityModelUpdate = _.cloneDeep(<SyncedActivityModel> _.cloneDeep(bareActivities[trackCallId]));
			expectedSyncedActivityModelUpdate.name = "FakeName";
			expectedSyncedActivityModelUpdate.type = "FakeType";
			const expectedActivitySyncEvent = new ActivitySyncEvent(ConnectorType.STRAVA, null, expectedSyncedActivityModelUpdate, false);

			// Emulate 1 existing activity
			findSyncedActivityModelsSpy.and.callFake(() => {
				if (findSyncedActivityModelsSpy.calls.count() === (trackCallId + 1)) {
					return Promise.resolve([expectedSyncedActivityModelUpdate]);
				}
				return Promise.resolve(null);
			});


			// When
			const promise = stravaConnector.processBareActivities(syncEvents, bareActivities);

			// Then
			promise.then(() => {

				const activitySyncEventSent = <ActivitySyncEvent> syncEventsSpy.calls.argsFor(trackCallId)[0]; // Catching call args

				expect(activitySyncEventSent.fromConnectorType).toEqual(expectedActivitySyncEvent.fromConnectorType);
				expect(activitySyncEventSent.description).toEqual(expectedActivitySyncEvent.description);
				expect(activitySyncEventSent.isNew).toEqual(expectedActivitySyncEvent.isNew);
				expect(activitySyncEventSent.activity.name).toEqual(expectedActivitySyncEvent.activity.name);
				expect(activitySyncEventSent.activity.type).toEqual(expectedActivitySyncEvent.activity.type);
				expect(syncEventsSpy).toBeCalledTimes(perPage);

				done();

			}, error => {
				expect(error).toBeNull();
				done();
			});

		});

		it("should send activity sync event when processing 1 bare activity that already exists (updateSyncedActivitiesNameAndType = false)", (done: Function) => {

			// Given
			const syncEvents = new Subject<SyncEvent>();
			const syncEventsSpy = spyOn(syncEvents, "next");
			const page = 1;
			const perPage = 20;
			const bareActivities = getActivitiesFixture(page, perPage, fakeActivitiesFixture);
			const trackCallId = 1; // the 2nd one

			stravaConnector.updateSyncedActivitiesNameAndType = false;

			const expectedSyncedActivityModelUpdate = _.cloneDeep(<SyncedActivityModel> _.cloneDeep(bareActivities[trackCallId]));
			expectedSyncedActivityModelUpdate.name = "FakeName";
			expectedSyncedActivityModelUpdate.type = "FakeType";

			// Emulate 1 existing activity
			findSyncedActivityModelsSpy.and.callFake(() => {
				if (findSyncedActivityModelsSpy.calls.count() === (trackCallId + 1)) {
					return Promise.resolve([expectedSyncedActivityModelUpdate]);
				}
				return Promise.resolve(null);
			});

			// When
			const promise = stravaConnector.processBareActivities(syncEvents, bareActivities);

			// Then
			promise.then(() => {

				expect(syncEventsSpy).toBeCalledTimes(perPage - 1);

				_.forEach(syncEventsSpy.calls.all(), call => {
					const activitySyncEventSent = <ActivitySyncEvent> call.args[0];
					expect(activitySyncEventSent.isNew).toEqual(true); // Call is always a new activity
				});

				done();

			}, error => {
				expect(error).toBeNull();
				done();
			});

		});

		it("should send error sync event when processing 1 bare activity that already exists (multiple results found)", (done: Function) => {

			// Given
			const syncEvents = new Subject<SyncEvent>();
			const errorSyncEventsSpy = spyOn(syncEvents, "error");
			const page = 1;
			const perPage = 20;
			const bareActivities = getActivitiesFixture(page, perPage, fakeActivitiesFixture);
			const trackCallId = 1; // the 2nd one

			stravaConnector.updateSyncedActivitiesNameAndType = true;

			const expectedSyncedActivityModelUpdate = _.cloneDeep(<SyncedActivityModel> _.cloneDeep(bareActivities[trackCallId]));
			expectedSyncedActivityModelUpdate.name = "FakeName";
			expectedSyncedActivityModelUpdate.type = "FakeType";
			expectedSyncedActivityModelUpdate.start_time = new Date().toISOString();

			// Emulate 1 existing activity
			findSyncedActivityModelsSpy.and.callFake(() => {

				if (findSyncedActivityModelsSpy.calls.count() === (trackCallId + 1)) {
					return Promise.resolve([expectedSyncedActivityModelUpdate, expectedSyncedActivityModelUpdate]);
				}
				return Promise.resolve(null);
			});

			const activitiesFound = expectedSyncedActivityModelUpdate.name + " (" + new Date(expectedSyncedActivityModelUpdate.start_time).toString() + ")";
			const error = new Error("2 local activities found while processing the remote " +
				"strava activity \"" + expectedSyncedActivityModelUpdate.id + "\": " + [activitiesFound, activitiesFound].join("; "));

			const expectedErrorSyncEvent = new ErrorSyncEvent(ConnectorType.STRAVA, "Multiple existing activities found", error);


			// When
			const promise = stravaConnector.processBareActivities(syncEvents, bareActivities);

			// Then
			promise.then(() => {
				expect(errorSyncEventsSpy).toBeCalledWith(expectedErrorSyncEvent);
				done();

			}, error => {
				expect(error).toBeNull();
				done();
			});

		});

		it("should send activity sync event when processing 1 bare activity that do not exists", (done: Function) => {

			// Given
			const syncEvents = new Subject<SyncEvent>();
			const syncEventsSpy = spyOn(syncEvents, "next");
			const page = 1;
			const perPage = 20;
			const bareActivities = getActivitiesFixture(page, perPage, fakeActivitiesFixture);
			const trackCallId = 1; // the 2nd one

			stravaConnector.updateSyncedActivitiesNameAndType = true;

			const expectedSyncedActivityModelUpdate = _.cloneDeep(<SyncedActivityModel> _.cloneDeep(bareActivities[trackCallId])); // "Mini Zwift & Pschitt"
			const expectedStartTime = "2019-03-10T16:17:32.000Z";
			const expectedEndTime = "2019-03-10T16:49:23.000Z";

			const expectedActivitySyncEvent = new ActivitySyncEvent(ConnectorType.STRAVA, null, expectedSyncedActivityModelUpdate, true);

			// Emulate 1 existing activity
			findSyncedActivityModelsSpy.and.returnValue(Promise.resolve(null));

			// When
			const promise = stravaConnector.processBareActivities(syncEvents, bareActivities);

			// Then
			promise.then(() => {

				const activitySyncEventSent = <ActivitySyncEvent> syncEventsSpy.calls.argsFor(trackCallId)[0]; // Catching 2nd call
				expect(activitySyncEventSent.activity.start_time).toEqual(expectedStartTime);
				expect(activitySyncEventSent.activity.end_time).toEqual(expectedEndTime);
				expect(activitySyncEventSent.activity.name).toEqual(expectedActivitySyncEvent.activity.name);
				expect(activitySyncEventSent.activity.type).toEqual(expectedActivitySyncEvent.activity.type);
				expect(activitySyncEventSent.activity.sourceConnectorType).toEqual(ConnectorType.STRAVA);
				expect(activitySyncEventSent.activity.streams).not.toBeNull();
				expect(activitySyncEventSent.activity.athleteSnapshot).toEqual(stravaConnector.athleteSnapshotResolver.getCurrent());
				expect(activitySyncEventSent.activity.extendedStats).not.toBeNull();
				done();

			}, error => {
				expect(error).toBeNull();
				done();
			});

		});

	});

	describe("Activity streams", () => {

		it("should get streams of an activity", (done: Function) => {

			// Given
			const activityId = 666;

			// When
			const promise = stravaConnector.getStravaActivityStreams(activityId);

			// Then
			promise.then((activityStreamsModel: ActivityStreamsModel) => {

				expect(fetchRemoteStravaActivityStreamsSpy).toBeCalledTimes(1);

				expect(activityStreamsModel).not.toBeNull();
				expect(activityStreamsModel.time).toEqual(_.find(fakeStreamsFixture, {type: "time"})["data"]);
				expect(activityStreamsModel.distance).toEqual(_.find(fakeStreamsFixture, {type: "distance"})["data"]);
				expect(activityStreamsModel.latlng).toEqual(_.find(fakeStreamsFixture, {type: "latlng"})["data"]);
				expect(activityStreamsModel.altitude).toEqual(_.find(fakeStreamsFixture, {type: "altitude"})["data"]);
				expect(activityStreamsModel.velocity_smooth).toEqual(_.find(fakeStreamsFixture, {type: "velocity_smooth"})["data"]);
				expect(activityStreamsModel.heartrate).toEqual(_.find(fakeStreamsFixture, {type: "heartrate"})["data"]);
				expect(activityStreamsModel.cadence).toEqual(_.find(fakeStreamsFixture, {type: "cadence"})["data"]);
				expect(activityStreamsModel.watts).toEqual(_.find(fakeStreamsFixture, {type: "watts"})["data"]);
				expect(activityStreamsModel.watts_calc).toEqual(_.find(fakeStreamsFixture, {type: "watts_calc"})["data"]);
				expect(activityStreamsModel.grade_smooth).toEqual(_.find(fakeStreamsFixture, {type: "grade_smooth"})["data"]);
				expect(activityStreamsModel.grade_adjusted_speed).toEqual(_.find(fakeStreamsFixture, {type: "grade_adjusted_speed"})["data"]);

				done();

			}, error => {
				expect(error).toBeNull();
				done();
			});

		});

		it("should get empty streams when an activity has no streams", (done: Function) => {

			// Given
			const activityId = 666;

			const stravaApiStreamError = {
				"message": "Resource Not Found",
				"errors": [
					{
						"resource": "Activity",
						"field": "",
						"code": "not found"
					}
				]
			};

			fetchRemoteStravaActivityStreamsSpy.and.returnValue(Promise.reject(stravaApiStreamError));

			// When
			const promise = stravaConnector.getStravaActivityStreams(activityId);

			// Then
			promise.then((activityStreamsModel: ActivityStreamsModel) => {

				expect(activityStreamsModel).toBeNull();
				done();

			}, error => {
				expect(error).toBeNull();
				done();
			});
		});

		it("should reject when error occurs while getting streams", (done: Function) => {

			// Given
			const activityId = 666;

			const stravaApiStreamError = "Unknown error";

			fetchRemoteStravaActivityStreamsSpy.and.returnValue(Promise.reject(stravaApiStreamError));

			// When
			const promise = stravaConnector.getStravaActivityStreams(activityId);

			// Then
			promise.then(() => {
				throw new Error("Test fail!");
			}, error => {
				expect(error).not.toBeNull();
				expect(error).toEqual(stravaApiStreamError);
				done();
			});
		});


	});

});
