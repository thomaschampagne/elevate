import * as _ from "lodash";
import { AppResourcesModel } from "../../scripts/models/app-resources.model";
import { editActivityFromArray, removeActivityFromArray } from "../tools/specs-tools";
import { StravaActivityModel } from "../../scripts/models/sync/strava-activity.model";
import { ActivitiesSynchronize } from "../../scripts/processors/activities-synchronize";
import { AthleteSnapshotResolver } from "@elevate/shared/resolvers";
import { ActivitiesChangesModel, AthleteModel, SyncedActivityModel, UserSettings } from "@elevate/shared/models";
import ExtensionUserSettingsModel = UserSettings.ExtensionUserSettingsModel;

describe("ActivitiesSynchronize", () => {

	let userSettingsMock: ExtensionUserSettingsModel;
	let athleteModelResolver: AthleteSnapshotResolver;

	beforeEach((done: Function) => {
		userSettingsMock = _.cloneDeep(ExtensionUserSettingsModel.DEFAULT_MODEL);
		athleteModelResolver = new AthleteSnapshotResolver(AthleteModel.DEFAULT_MODEL);
		done();
	});

	it("should remove activity from array properly ", (done: Function) => {

		let rawPageOfActivities: Array<SyncedActivityModel> = _.cloneDeep(require("../fixtures/sync/rawPage0120161213.json").models);
		const sourceCount = rawPageOfActivities.length;

		rawPageOfActivities = removeActivityFromArray(722210052, rawPageOfActivities); // Remove Hike "Fort saint eynard"

		expect(rawPageOfActivities).not.toBeNull();
		expect(_.find(rawPageOfActivities, {id: 722210052})).toBeUndefined();
		expect(rawPageOfActivities.length).toEqual(sourceCount - 1);
		done();
	});

	it("should edit activity from array properly ", (done: Function) => {

		let rawPageOfActivities: Array<SyncedActivityModel> = _.cloneDeep(require("../fixtures/sync/rawPage0120161213.json").models);
		const sourceCount = rawPageOfActivities.length;

		rawPageOfActivities = editActivityFromArray(722210052, rawPageOfActivities, "New_Name", "Ride"); // Edit Hike "Fort saint eynard"

		expect(rawPageOfActivities).not.toBeNull();
		const foundBack: SyncedActivityModel = _.find(rawPageOfActivities, {id: 722210052});
		expect(foundBack).toBeDefined();
		expect(foundBack.name).toEqual("New_Name");
		expect(foundBack.type).toEqual("Ride");
		expect(foundBack.display_type).toEqual("Ride");
		expect(rawPageOfActivities.length).toEqual(sourceCount);
		done();

	});

	it("should detect activities added, modified and deleted ", (done: Function) => {

		let syncedActivities: Array<SyncedActivityModel> = _.cloneDeep(require("../fixtures/sync/syncedActivities20161213.json").syncedActivities);
		let rawPageOfActivities: Array<StravaActivityModel> = _.cloneDeep(require("../fixtures/sync/rawPage0120161213.json").models);

		// Simulate Added in strava: consist to remove since synced activities...
		syncedActivities = removeActivityFromArray(723224273, syncedActivities); // Remove Ride "Bon rythme ! 33 KPH !!"
		syncedActivities = removeActivityFromArray(707356065, syncedActivities); // Remove Ride "Je suis un gros lent !"

		// Simulate Modify: consist to edit data in strava
		rawPageOfActivities = editActivityFromArray(799672885, rawPageOfActivities, "Run comeback", "Run"); // Edit "Running back... Hard !"
		rawPageOfActivities = editActivityFromArray(708752345, rawPageOfActivities, "MTB @ Bastille", "Ride"); // Edit Run "Bastille"

		// Now find+test changes
		const changes: ActivitiesChangesModel = ActivitiesSynchronize.findAddedAndEditedActivities(rawPageOfActivities, syncedActivities);

		expect(changes).not.toBeNull();
		expect(changes.deleted).toEqual([]);

		expect(changes.added.length).toEqual(2);
		expect(_.indexOf(changes.added, 723224273)).not.toEqual(-1);
		expect(_.indexOf(changes.added, 707356065)).not.toEqual(-1);
		expect(_.indexOf(changes.added, 999999999)).toEqual(-1); // Fake

		expect(changes.edited.length).toEqual(2);
		expect(_.find(changes.edited, {id: 799672885})).toBeDefined();
		expect(_.find(changes.edited, {id: 708752345})).toBeDefined();
		let findWhere: any = _.find(changes.edited, {id: 799672885});
		expect(findWhere.name).toEqual("Run comeback");
		expect(findWhere.type).toEqual("Run");
		expect(findWhere.display_type).toEqual("Run");
		findWhere = _.find(changes.edited, {id: 708752345});
		expect(findWhere.name).toEqual("MTB @ Bastille");
		expect(findWhere.type).toEqual("Ride");
		expect(findWhere.display_type).toEqual("Ride");

		expect(ActivitiesSynchronize.findAddedAndEditedActivities(null, null)).not.toBeNull();

		done();

	});

	it("should append activities of pages where activities added, modified and deleted ", (done: Function) => {

		const appResourcesMock: AppResourcesModel = _.cloneDeep(require("../fixtures/app-resources/app-resources.json"));
		const activitiesSynchronize: ActivitiesSynchronize = new ActivitiesSynchronize(appResourcesMock, userSettingsMock, athleteModelResolver);

		// Append
		activitiesSynchronize.appendGlobalActivitiesChanges({
			added: [1, 2],
			deleted: [],
			edited: []
		});

		expect(activitiesSynchronize.activitiesChanges).not.toBeNull();
		expect(activitiesSynchronize.activitiesChanges.added).toEqual([1, 2]);
		expect(activitiesSynchronize.activitiesChanges.deleted.length).toEqual(0);
		expect(activitiesSynchronize.activitiesChanges.edited.length).toEqual(0);

		// Append
		activitiesSynchronize.appendGlobalActivitiesChanges({
			added: [4, 5],
			deleted: [],
			edited: [{id: 6, name: "rideName", type: "Ride", display_type: "Ride"}]
		});
		expect(activitiesSynchronize.activitiesChanges).not.toBeNull();
		expect(activitiesSynchronize.activitiesChanges.added.length).toEqual(4);
		expect(activitiesSynchronize.activitiesChanges.deleted.length).toEqual(0);
		expect(activitiesSynchronize.activitiesChanges.edited.length).toEqual(1);

		// Append
		activitiesSynchronize.appendGlobalActivitiesChanges({
			added: [5, 10, 11],
			deleted: [15, 16],
			edited: [{id: 6, name: "rideName", type: "Ride", display_type: "Ride"}, {
				id: 22,
				name: "Run...",
				type: "Run",
				display_type: "Run"
			}]
		});
		expect(activitiesSynchronize.activitiesChanges).not.toBeNull();
		expect(activitiesSynchronize.activitiesChanges.added.length).toEqual(6); // id:5 already added
		expect(activitiesSynchronize.activitiesChanges.deleted.length).toEqual(2);
		expect(activitiesSynchronize.activitiesChanges.edited.length).toEqual(3);

		done();
	});
});
