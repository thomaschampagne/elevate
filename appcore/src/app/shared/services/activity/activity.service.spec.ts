import { TestBed } from "@angular/core/testing";
import { ActivityService } from "./activity.service";
import { TEST_SYNCED_ACTIVITIES } from "../../../../shared-fixtures/activities-2015.fixture";
import * as _ from "lodash";
import { AthleteModel, AthleteSettingsModel, AthleteSnapshotModel, DatedAthleteSettingsModel, Gender, SyncedActivityModel } from "@elevate/shared/models";
import { FakeSyncedActivityHelper } from "../../../fitness-trend/shared/helpers/fake-synced-activity.helper";
import { CoreModule } from "../../../core/core.module";
import { SharedModule } from "../../shared.module";
import { ElevateSport } from "@elevate/shared/enums";
import { DesktopModule } from "../../modules/desktop/desktop.module";
import { ElectronService, ElectronWindow } from "../electron/electron.service";
import FindRequest = PouchDB.Find.FindRequest;

describe("ActivityService", () => {

    let activityService: ActivityService = null;

    let _TEST_SYNCED_ACTIVITIES_: SyncedActivityModel[] = null;

    beforeEach(done => {

        TestBed.configureTestingModule({
            imports: [
                CoreModule,
                SharedModule,
                DesktopModule
            ]
        });

        const electronService: ElectronService = TestBed.inject(ElectronService);
        electronService.instance = {
            ipcRenderer: {}
        };

        const electronWindow = (window as ElectronWindow);
        const electronRequire = (module: string) => {
            console.log("Loading module: " + module);
            return {};
        };
        electronWindow.require = electronRequire;
        spyOn(electronWindow, "require").and.callFake(electronRequire);

        _TEST_SYNCED_ACTIVITIES_ = _.cloneDeep(TEST_SYNCED_ACTIVITIES);

        // Retrieve injected service
        activityService = TestBed.inject(ActivityService);

        done();
    });

    describe("CRUD operation support", () => {

        it("should be created", done => {
            expect(activityService).toBeTruthy();
            done();
        });

        it("should fetch activities", done => {

            // Given
            const fetchDaoSpy = spyOn(activityService.activityDao, "fetch")
                .and.returnValue(Promise.resolve(_TEST_SYNCED_ACTIVITIES_));

            // When
            const promise: Promise<SyncedActivityModel[]> = activityService.fetch();

            // Then
            promise.then((result: SyncedActivityModel[]) => {

                expect(result).not.toBeNull();
                expect(result.length).toEqual(_TEST_SYNCED_ACTIVITIES_.length);
                expect(result).toEqual(_TEST_SYNCED_ACTIVITIES_);
                expect(fetchDaoSpy).toHaveBeenCalledTimes(1);

                done();

            }, error => {
                expect(error).toBeNull();
                expect(false).toBeTruthy("Whoops! I should not be here!");
                done();
            });

        });

        it("should save SyncedActivityModels", done => {

            // Given
            const syncedActivityModelsToSave = _TEST_SYNCED_ACTIVITIES_;
            const saveDaoSpy = spyOn(activityService.activityDao, "save")
                .and.returnValue(Promise.resolve(_TEST_SYNCED_ACTIVITIES_));

            // When
            const promise: Promise<SyncedActivityModel[]> = activityService.save(syncedActivityModelsToSave);

            // Then
            promise.then((result: SyncedActivityModel[]) => {

                expect(result).not.toBeNull();
                expect(result.length).toEqual(_TEST_SYNCED_ACTIVITIES_.length);
                expect(result).toEqual(_TEST_SYNCED_ACTIVITIES_);
                expect(saveDaoSpy).toHaveBeenCalledTimes(1);

                done();

            }, error => {
                expect(error).toBeNull();
                expect(false).toBeTruthy("Whoops! I should not be here!");
                done();
            });
        });

        it("should clear SyncedActivityModels", done => {

            // Given
            const removeDaoSpy = spyOn(activityService.activityDao, "clear")
                .and.returnValue(Promise.resolve(null));

            // When
            const promise: Promise<void> = activityService.clear();

            // Then
            promise.then(() => {
                expect(removeDaoSpy).toHaveBeenCalledTimes(1);
                done();

            }, error => {
                expect(error).toBeNull();
                expect(false).toBeTruthy("Whoops! I should not be here!");
                done();
            });
        });

        it("should remove SyncedActivityModel by activity ids", done => {

            // Given
            const activitiesToDelete = [
                302537043, // Chamrousse 1750
                296692980, // Fondo 100
            ];

            const expectedExistingActivity = 353633586; // Venon PR 01

            spyOn(activityService.activityDao, "removeByIds")
                .and.returnValue(Promise.resolve(_.filter(_TEST_SYNCED_ACTIVITIES_, (syncedActivityModel: SyncedActivityModel) => {
                return (_.indexOf(activitiesToDelete, syncedActivityModel.id) === -1);
            })));

            // When
            const promise: Promise<SyncedActivityModel[]> = activityService.removeByIds(activitiesToDelete);

            // Then
            promise.then((result: SyncedActivityModel[]) => {

                expect(result.length).toEqual(_TEST_SYNCED_ACTIVITIES_.length - activitiesToDelete.length);

                let activity = _.find(result, {id: activitiesToDelete[0]});
                expect(_.isEmpty(activity)).toBeTruthy();

                activity = _.find(result, {id: activitiesToDelete[1]});
                expect(_.isEmpty(activity)).toBeTruthy();

                activity = _.find(result, {id: expectedExistingActivity});
                expect(_.isEmpty(activity)).toBeFalsy();

                done();

            }, error => {
                expect(error).toBeNull();
                expect(false).toBeTruthy("Whoops! I should not be here!");
                done();
            });
        });

    });

    describe("Activity compliance with athlete settings", () => {

        it("should resolve activities compliant with athlete settings", done => {

            // Given
            const athleteSnapshot = new AthleteSnapshotModel(Gender.MEN, new AthleteSettingsModel(190, 60, {
                default: 163,
                cycling: null,
                running: null
            }, 150, 300, 31, 70));

            const athleteModel = new AthleteModel(Gender.MEN, [new DatedAthleteSettingsModel(null, athleteSnapshot.athleteSettings)]);

            const syncedActivityModels: SyncedActivityModel[] = [];
            syncedActivityModels.push(FakeSyncedActivityHelper.create(1,
                athleteSnapshot,
                "SuperHeartRateRide 01",
                ElevateSport.Ride,
                "2018-01-01",
                150,
                null,
                false));

            syncedActivityModels.push(FakeSyncedActivityHelper.create(2,
                athleteSnapshot,
                "SuperHeartRateRide 02",
                ElevateSport.Ride,
                "2018-01-15",
                180,
                null,
                false));

            syncedActivityModels.push(FakeSyncedActivityHelper.create(3,
                athleteSnapshot,
                "SuperHeartRateRide 03",
                ElevateSport.Ride,
                "2018-01-30",
                135,
                null,
                false));

            const fetchDaoSpy = spyOn(activityService.activityDao, "fetch")
                .and.returnValue(Promise.resolve(syncedActivityModels));

            spyOn(activityService.athleteSnapshotResolverService.athleteService, "fetch")
                .and.returnValue(Promise.resolve(athleteModel));

            // When
            const promise = activityService.isAthleteSettingsConsistent();

            // Then
            promise.then((result: boolean) => {

                expect(fetchDaoSpy).toHaveBeenCalledTimes(1);
                expect(result).toBeTruthy();
                done();

            }, error => {
                expect(error).toBeNull();
                expect(false).toBeTruthy("Whoops! I should not be here!");
                done();
            });

        });

        it("should resolve activities compliant with athlete settings hasDatedAthleteSettings=true", done => {

            // Given
            const athleteSnapshot01 = new AthleteSnapshotModel(Gender.MEN, new AthleteSettingsModel(190, 60, {
                default: 163,
                cycling: null,
                running: null
            }, 150, 300, 31, 70));

            const athleteSnapshot02 = _.cloneDeep(athleteSnapshot01);
            athleteSnapshot02.athleteSettings.maxHr = 211;
            athleteSnapshot02.athleteSettings.restHr = 66;
            athleteSnapshot02.athleteSettings.cyclingFtp = 250;

            const datedAthleteSettingsModels = [
                new DatedAthleteSettingsModel("2018-01-14", athleteSnapshot02.athleteSettings),
                new DatedAthleteSettingsModel(null, athleteSnapshot01.athleteSettings),
            ];

            const athleteModel = new AthleteModel(Gender.MEN, datedAthleteSettingsModels);

            const syncedActivityModels: SyncedActivityModel[] = [];
            syncedActivityModels.push(FakeSyncedActivityHelper.create(1,
                athleteSnapshot01,
                "SuperHeartRateRide 01",
                ElevateSport.Ride,
                "2018-01-01",
                150,
                null,
                false));

            syncedActivityModels.push(FakeSyncedActivityHelper.create(2,
                athleteSnapshot02,
                "SuperHeartRateRide 02",
                ElevateSport.Ride,
                "2018-01-15",
                180,
                null,
                false));

            syncedActivityModels.push(FakeSyncedActivityHelper.create(3,
                athleteSnapshot02,
                "SuperHeartRateRide 03",
                ElevateSport.Ride,
                "2018-01-30",
                135,
                null,
                false));

            const fetchDaoSpy = spyOn(activityService.activityDao, "fetch")
                .and.returnValue(Promise.resolve(syncedActivityModels));

            spyOn(activityService.athleteSnapshotResolverService.athleteService, "fetch")
                .and.returnValue(Promise.resolve(athleteModel));

            // When
            const promise = activityService.isAthleteSettingsConsistent();

            // Then
            promise.then((result: boolean) => {

                expect(fetchDaoSpy).toHaveBeenCalledTimes(1);
                expect(result).toBeTruthy();
                done();

            }, error => {
                expect(error).toBeNull();
                expect(false).toBeTruthy("Whoops! I should not be here!");
                done();
            });

        });

        it("should resolve non consistent activities ids which are not compliant athlete settings hasDatedAthleteSettings=true", done => {

            // Given
            const athleteModel01 = new AthleteSnapshotModel(Gender.MEN, new AthleteSettingsModel(190, 60, {
                default: 163,
                cycling: null,
                running: null
            }, 150, 300, 31, 70));

            const athleteModel02 = _.cloneDeep(athleteModel01);
            athleteModel02.athleteSettings.maxHr = 211;
            athleteModel02.athleteSettings.restHr = 66;
            athleteModel02.athleteSettings.cyclingFtp = 250;

            const datedAthleteSettingsModels = [
                new DatedAthleteSettingsModel("2018-01-15", athleteModel02.athleteSettings),
                new DatedAthleteSettingsModel(null, athleteModel01.athleteSettings),
            ];

            const athleteModel = new AthleteModel(Gender.MEN, datedAthleteSettingsModels);

            const syncedActivityModels: SyncedActivityModel[] = [];
            syncedActivityModels.push(FakeSyncedActivityHelper.create(1,
                athleteModel01,
                "SuperHeartRateRide 01",
                ElevateSport.Ride,
                "2018-01-01",
                150,
                null,
                false));

            syncedActivityModels.push(FakeSyncedActivityHelper.create(2,
                athleteModel01,
                "SuperHeartRateRide 02",
                ElevateSport.Ride,
                "2018-01-15",
                180,
                null,
                false));

            syncedActivityModels.push(FakeSyncedActivityHelper.create(3,
                athleteModel01,
                "SuperHeartRateRide 03",
                ElevateSport.Ride,
                "2018-01-30",
                135,
                null,
                false));

            const fetchDaoSpy = spyOn(activityService.activityDao, "fetch")
                .and.returnValue(Promise.resolve(syncedActivityModels));

            spyOn(activityService.athleteSnapshotResolverService.athleteService, "fetch")
                .and.returnValue(Promise.resolve(athleteModel));

            // When
            const promise = activityService.nonConsistentActivitiesWithAthleteSettings();

            // Then
            promise.then((result: number[]) => {

                expect(fetchDaoSpy).toHaveBeenCalledTimes(1);

                expect(_.indexOf(result, 1)).toEqual(-1);
                expect(_.indexOf(result, 2)).not.toEqual(-1);
                expect(_.indexOf(result, 3)).not.toEqual(-1);

                done();

            }, error => {
                expect(error).toBeNull();
                expect(false).toBeTruthy("Whoops! I should not be here!");
                done();
            });

        });

        it("should resolve activities NOT compliant with athlete settings", done => {

            // Given
            const athleteSnapshot = new AthleteSnapshotModel(Gender.MEN, new AthleteSettingsModel(190, 60, {
                default: 163,
                cycling: null,
                running: null
            }, 150, 300, 31, 70));

            const syncedActivityModels: SyncedActivityModel[] = [];
            syncedActivityModels.push(FakeSyncedActivityHelper.create(1,
                athleteSnapshot,
                "SuperHeartRateRide 01",
                ElevateSport.Ride,
                "2018-01-01",
                150,
                null,
                false));

            const variousAthleteSnapshotModel = _.cloneDeep(athleteSnapshot);
            variousAthleteSnapshotModel.athleteSettings.maxHr = 666; // Introducing a little settings change
            syncedActivityModels.push(FakeSyncedActivityHelper.create(2,
                variousAthleteSnapshotModel,
                "SuperHeartRateRide 02",
                ElevateSport.Ride,
                "2018-01-15",
                180,
                null,
                false));

            syncedActivityModels.push(FakeSyncedActivityHelper.create(3,
                athleteSnapshot,
                "SuperHeartRateRide 03",
                ElevateSport.Ride,
                "2018-01-30",
                135,
                null,
                false));

            const fetchDaoSpy = spyOn(activityService.activityDao, "fetch")
                .and.returnValue(Promise.resolve(syncedActivityModels));

            spyOn(activityService.athleteSnapshotResolverService.athleteService, "fetch")
                .and.returnValue(Promise.resolve(AthleteModel.DEFAULT_MODEL));

            // When
            const promise = activityService.isAthleteSettingsConsistent();

            // Then
            promise.then((result: boolean) => {

                expect(fetchDaoSpy).toHaveBeenCalledTimes(1);
                expect(result).toBeFalsy();
                done();

            }, error => {
                expect(error).toBeNull();
                expect(false).toBeTruthy("Whoops! I should not be here!");
                done();
            });

        });

    });

    describe("Activity lacking of athlete settings (= missing stress scores)", () => {

        it("should detect any activities lacking of athlete settings", done => {

            // Given
            const syncedActivities: Partial<SyncedActivityModel>[] = [
                {id: "111", name: "111", settingsLack: false},
                {id: "222", name: "222", settingsLack: true},
                {id: "333", name: "333", settingsLack: false},
                {id: "444", name: "444", settingsLack: true},
                {id: "555", name: "555", settingsLack: false},
                {id: "666", name: "666"},
            ];

            spyOn(activityService.activityDao, "fetch").and.returnValue(Promise.resolve(<SyncedActivityModel[]> syncedActivities));

            // When
            const promise = activityService.hasActivitiesWithSettingsLacks();

            // Then
            promise.then(result => {
                expect(result).toBeTruthy();
                done();

            }, error => {
                expect(error).toBeNull();
                done();
            });
        });

        it("should NOT detect any activities lacking of athlete settings", done => {

            // Given
            const syncedActivities: Partial<SyncedActivityModel>[] = [
                {id: "111", name: "111", settingsLack: false},
                {id: "222", name: "222", settingsLack: false},
                {id: "333", name: "333", settingsLack: false},
                {id: "444", name: "444", settingsLack: false},
                {id: "555", name: "555", settingsLack: false},
                {id: "666", name: "666"},
            ];

            spyOn(activityService.activityDao, "fetch").and.returnValue(Promise.resolve(<SyncedActivityModel[]> syncedActivities));

            // When
            const promise = activityService.hasActivitiesWithSettingsLacks();

            // Then
            promise.then(result => {
                expect(result).toBeFalsy();
                done();

            }, error => {
                expect(error).toBeNull();
                done();
            });
        });

        it("should find activities lacking of athlete settings", done => {

            // Given
            const expectedSize = 2;
            const syncedActivities: Partial<SyncedActivityModel>[] = [
                {id: "111", name: "111", settingsLack: false},
                {id: "222", name: "222", settingsLack: true},
                {id: "333", name: "333", settingsLack: false},
                {id: "444", name: "444", settingsLack: true},
                {id: "555", name: "555", settingsLack: false},
                {id: "666", name: "666"},
            ];

            spyOn(activityService.activityDao, "fetch").and.returnValue(Promise.resolve(<SyncedActivityModel[]> syncedActivities));

            // When
            const promise = activityService.findActivitiesWithSettingsLacks();

            // Then
            promise.then(activities => {
                expect(activities.length).toEqual(expectedSize);
                expect(activities[0]).toEqual(<SyncedActivityModel> syncedActivities[1]);
                expect(activities[1]).toEqual(<SyncedActivityModel> syncedActivities[3]);
                done();

            }, error => {
                expect(error).toBeNull();
                done();
            });
        });

        it("should NOT find activities lacking of athlete settings", done => {

            // Given
            const expectedSize = 0;
            const syncedActivities: Partial<SyncedActivityModel>[] = [
                {id: "111", name: "111", settingsLack: false},
                {id: "222", name: "222", settingsLack: false},
                {id: "333", name: "333", settingsLack: false},
                {id: "444", name: "444", settingsLack: false},
                {id: "555", name: "555", settingsLack: false},
                {id: "666", name: "666"},
            ];

            spyOn(activityService.activityDao, "fetch").and.returnValue(Promise.resolve(<SyncedActivityModel[]> syncedActivities));

            // When
            const promise = activityService.findActivitiesWithSettingsLacks();

            // Then
            promise.then(activities => {
                expect(activities.length).toEqual(expectedSize);
                done();

            }, error => {
                expect(error).toBeNull();
                done();
            });
        });

    });

    it("should find activity by start time and duration", done => {

        // Given
        const date = "2019-03-01T10:00:00.000Z";
        const activityDuration = 3600;

        const query: FindRequest<SyncedActivityModel[]> = {
            selector: {
                $or: [
                    {
                        start_time: {
                            $gte: "2019-03-01T10:00:00.000Z",
                        },
                        end_time: {
                            $lte: "2019-03-01T11:00:00.000Z",
                        }
                    },
                    {
                        start_time: {
                            $gte: "2019-03-01T10:00:00.000Z",
                            $lte: "2019-03-01T11:00:00.000Z",
                        }
                    },
                    {
                        end_time: {
                            $gte: "2019-03-01T10:00:00.000Z",
                            $lte: "2019-03-01T11:00:00.000Z",
                        }
                    }

                ]

            }
        };

        const findActivitySpy = spyOn(activityService, "find").and.returnValue(Promise.resolve([]));

        // When
        const promise = activityService.findByDatedSession(date, activityDuration);

        // Then
        promise.then(() => {

            expect(findActivitySpy).toHaveBeenCalledTimes(1);
            expect(findActivitySpy).toHaveBeenCalledWith(query);

            done();

        }, error => {
            expect(error).toBeNull();
            done();
        });
    });


});
