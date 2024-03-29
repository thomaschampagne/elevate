import { TestBed } from "@angular/core/testing";
import { AthleteService } from "./athlete.service";
import _ from "lodash";
import { AppError } from "../../models/app-error.model";
import { DataStore } from "../../data-store/data-store";
import { TestingDataStore } from "../../data-store/testing-datastore.service";
import { CoreModule } from "../../../core/core.module";
import { SharedModule } from "../../shared.module";
import { TargetModule } from "../../modules/target/desktop-target.module";
import { IpcRendererTunnelServiceMock } from "../../../desktop/ipc/ipc-renderer-tunnel-service.mock";
import { IPC_TUNNEL_SERVICE } from "../../../desktop/ipc/ipc-tunnel-service.token";
import { AthleteModel } from "@elevate/shared/models/athlete/athlete.model";
import { AthleteSettings } from "@elevate/shared/models/athlete/athlete-settings/athlete-settings.model";
import { Gender } from "@elevate/shared/models/athlete/gender.enum";
import { DatedAthleteSettings } from "@elevate/shared/models/athlete/athlete-settings/dated-athlete-settings.model";

describe("AthleteService", () => {
  let service: AthleteService = null;
  let defaultAthleteModel: AthleteModel = null;

  let since;
  let until;
  let maxHr;
  let restHr;
  let lthr;
  let cyclingFTP;
  let runningFTP;
  let swimFTP;
  let weight;

  beforeEach(done => {
    TestBed.configureTestingModule({
      imports: [CoreModule, SharedModule, TargetModule],
      providers: [
        { provide: DataStore, useClass: TestingDataStore },
        { provide: IPC_TUNNEL_SERVICE, useClass: IpcRendererTunnelServiceMock }
      ]
    });

    // Retrieve injected service
    service = TestBed.inject(AthleteService);

    defaultAthleteModel = new AthleteModel(Gender.MEN, null);

    since = new Date();
    until = new Date();
    maxHr = 200;
    restHr = 50;
    lthr = {
      default: 185,
      cycling: null,
      running: null
    };
    cyclingFTP = 210;
    runningFTP = 350;
    swimFTP = 31;
    weight = 72;
    done();
  });

  it("should be created", done => {
    expect(service).toBeTruthy();
    done();
  });

  describe("should fetch", () => {
    it("should fetch empty 'dated athlete settings'", done => {
      // Given
      const existingPeriodAthleteSettings: DatedAthleteSettings[] = [];

      defaultAthleteModel.datedAthleteSettings = existingPeriodAthleteSettings;

      const fetchDaoSpy = spyOn(service.athleteModelDao, "findOne").and.returnValue(
        Promise.resolve(defaultAthleteModel)
      );

      // When
      const promise: Promise<AthleteModel> = service.fetch();

      // Then
      promise.then(
        (athleteModel: AthleteModel) => {
          expect(athleteModel).not.toBeNull();
          expect(fetchDaoSpy).toHaveBeenCalledTimes(1);
          expect(athleteModel.datedAthleteSettings).toEqual(existingPeriodAthleteSettings);
          done();
        },
        error => {
          expect(error).toBeNull();
          throw new Error("Whoops! I should not be here!");
        }
      );
    });

    it("should reject fetch of 'dated athlete settings'", done => {
      // Given
      const errorMessage = "Houston we have a problem";
      const fetchDaoSpy = spyOn(service.athleteModelDao, "findOne").and.returnValue(Promise.reject(errorMessage));

      // When
      const promise: Promise<AthleteModel> = service.fetch();

      // Then
      promise.then(
        (athleteModel: AthleteModel) => {
          expect(athleteModel).toBeNull();
          throw new Error("Whoops! I should not be here!");
        },
        error => {
          expect(fetchDaoSpy).toHaveBeenCalledTimes(1);
          expect(error).not.toBeNull();
          expect(error).toEqual(errorMessage);

          done();
        }
      );
    });
  });

  describe("should add", () => {
    it("should add a dated athlete settings with already existing periods", done => {
      // Given
      const existingPeriodAthleteSettings: DatedAthleteSettings[] = [
        new DatedAthleteSettings("2018-05-10", new AthleteSettings(200, 50, lthr, 190, runningFTP, swimFTP, 75)),
        new DatedAthleteSettings("2018-04-15", new AthleteSettings(195, restHr, lthr, 150, runningFTP, swimFTP, 76)),
        new DatedAthleteSettings("2018-02-01", new AthleteSettings(190, 65, lthr, 110, runningFTP, swimFTP, 78)),
        new DatedAthleteSettings(null, new AthleteSettings(190, 65, lthr, 110, runningFTP, swimFTP, 78))
      ];

      defaultAthleteModel.datedAthleteSettings = existingPeriodAthleteSettings;

      const athletePeriodSettingsToAdd = new DatedAthleteSettings(
        "2018-06-03",
        new AthleteSettings(maxHr, restHr, lthr, cyclingFTP, runningFTP, swimFTP, weight)
      );

      const expectedAthleteModel = _.cloneDeep(defaultAthleteModel);
      expectedAthleteModel.datedAthleteSettings = _.flatten([
        athletePeriodSettingsToAdd,
        existingPeriodAthleteSettings
      ]);

      const fetchDaoSpy = spyOn(service.athleteModelDao, "findOne").and.returnValue(
        Promise.resolve(defaultAthleteModel)
      );
      const updateDaoSpy = spyOn(service.athleteModelDao, "update").and.returnValue(
        Promise.resolve(expectedAthleteModel)
      );

      // When
      const promise: Promise<DatedAthleteSettings[]> = service.addSettings(athletePeriodSettingsToAdd);

      // Then
      promise.then(
        (result: DatedAthleteSettings[]) => {
          expect(result).not.toBeNull();
          expect(result).toEqual(expectedAthleteModel.datedAthleteSettings);
          expect(fetchDaoSpy).toHaveBeenCalledTimes(1);
          expect(updateDaoSpy).toHaveBeenCalledTimes(1);
          expect(updateDaoSpy).toHaveBeenCalledWith(expectedAthleteModel);

          done();
        },
        error => {
          expect(error).toBeNull();
          throw new Error("Whoops! I should not be here!");
        }
      );
    });

    it("should add a dated athlete settings with the single 'forever' existing period", done => {
      // Given
      const existingPeriodAthleteSettings: DatedAthleteSettings[] = [
        new DatedAthleteSettings(null, new AthleteSettings(190, 65, lthr, 110, runningFTP, swimFTP, 78))
      ];

      defaultAthleteModel.datedAthleteSettings = existingPeriodAthleteSettings;

      const athletePeriodSettingsToAdd = new DatedAthleteSettings(
        "2018-06-03",
        new AthleteSettings(maxHr, restHr, lthr, cyclingFTP, runningFTP, swimFTP, weight)
      );

      const expectedAthleteModel = _.cloneDeep(defaultAthleteModel);
      expectedAthleteModel.datedAthleteSettings = _.flatten([
        athletePeriodSettingsToAdd,
        existingPeriodAthleteSettings
      ]);

      const fetchDaoSpy = spyOn(service.athleteModelDao, "findOne").and.returnValue(
        Promise.resolve(defaultAthleteModel)
      );
      const updateDaoSpy = spyOn(service.athleteModelDao, "update").and.returnValue(
        Promise.resolve(expectedAthleteModel)
      );

      // When
      const promise: Promise<DatedAthleteSettings[]> = service.addSettings(athletePeriodSettingsToAdd);

      // Then
      promise.then(
        (result: DatedAthleteSettings[]) => {
          expect(result).not.toBeNull();
          expect(result).toEqual(expectedAthleteModel.datedAthleteSettings);
          expect(fetchDaoSpy).toHaveBeenCalledTimes(1);
          expect(updateDaoSpy).toHaveBeenCalledTimes(1);
          expect(updateDaoSpy).toHaveBeenCalledWith(expectedAthleteModel);

          done();
        },
        error => {
          expect(error).toBeNull();
          throw new Error("Whoops! I should not be here!");
        }
      );
    });

    it("should add a dated athlete settings without existing periods", done => {
      // Given
      const existingPeriodAthleteSettings: DatedAthleteSettings[] = [];

      defaultAthleteModel.datedAthleteSettings = existingPeriodAthleteSettings;

      const athletePeriodSettingsToAdd = new DatedAthleteSettings(
        "2018-06-03",
        new AthleteSettings(maxHr, restHr, lthr, cyclingFTP, runningFTP, swimFTP, weight)
      );

      const expectedPeriodAthleteSettings = _.flatten([athletePeriodSettingsToAdd, existingPeriodAthleteSettings]);

      const foreverDatedSettings = _.cloneDeep(athletePeriodSettingsToAdd); // Forever dated settings have until be created !
      foreverDatedSettings.since = null;
      expectedPeriodAthleteSettings.push(foreverDatedSettings);

      const expectedAthleteModel = _.cloneDeep(defaultAthleteModel);
      expectedAthleteModel.datedAthleteSettings = expectedPeriodAthleteSettings;

      const fetchDaoSpy = spyOn(service.athleteModelDao, "findOne").and.returnValue(
        Promise.resolve(defaultAthleteModel)
      );
      const updateDaoSpy = spyOn(service.athleteModelDao, "update").and.returnValue(
        Promise.resolve(expectedAthleteModel)
      );

      // When
      const promise: Promise<DatedAthleteSettings[]> = service.addSettings(athletePeriodSettingsToAdd);

      // Then
      promise.then(
        (result: DatedAthleteSettings[]) => {
          expect(result).not.toBeNull();
          expect(result).toEqual(expectedPeriodAthleteSettings);
          expect(fetchDaoSpy).toHaveBeenCalledTimes(1);
          expect(updateDaoSpy).toHaveBeenCalledTimes(1);
          expect(updateDaoSpy).toHaveBeenCalledWith(expectedAthleteModel);

          done();
        },
        error => {
          expect(error).toBeNull();
          throw new Error("Whoops! I should not be here!");
        }
      );
    });

    it("should reject add of an existing dated athlete settings", done => {
      // Given
      const addAtDate = "2018-04-15";
      defaultAthleteModel.datedAthleteSettings = [
        new DatedAthleteSettings("2018-05-10", new AthleteSettings(200, 50, lthr, 190, runningFTP, swimFTP, 75)),
        new DatedAthleteSettings(addAtDate, new AthleteSettings(195, restHr, lthr, 150, runningFTP, swimFTP, 76)),
        new DatedAthleteSettings("2018-02-01", new AthleteSettings(190, 65, lthr, 110, runningFTP, swimFTP, 78)),
        new DatedAthleteSettings(null, new AthleteSettings(190, 65, lthr, 110, runningFTP, swimFTP, 78))
      ];

      const athletePeriodSettingsToAdd = new DatedAthleteSettings(
        addAtDate,
        new AthleteSettings(maxHr, restHr, lthr, cyclingFTP, runningFTP, swimFTP, weight)
      );

      const fetchDaoSpy = spyOn(service.athleteModelDao, "findOne").and.returnValue(
        Promise.resolve(defaultAthleteModel)
      );
      const updateDaoSpy = spyOn(service.athleteModelDao, "update").and.stub();

      // When
      const promise: Promise<DatedAthleteSettings[]> = service.addSettings(athletePeriodSettingsToAdd);

      // Then
      promise.then(
        (result: DatedAthleteSettings[]) => {
          expect(result).toBeNull();
          throw new Error("Whoops! I should not be here!");

          done();
        },
        (error: AppError) => {
          expect(error).not.toBeNull();
          expect(fetchDaoSpy).toHaveBeenCalledTimes(1);
          expect(updateDaoSpy).not.toHaveBeenCalled();
          expect(error.code).toEqual(AppError.DATED_ATHLETE_SETTINGS_EXISTS);
          expect(error.message).toEqual("Dated athlete settings already exists. You should edit it instead.");

          done();
        }
      );
    });

    it("should reject add of invalid dated athlete settings date", done => {
      // Given
      defaultAthleteModel.datedAthleteSettings = [
        new DatedAthleteSettings("2018-05-10", new AthleteSettings(200, 50, lthr, 190, runningFTP, swimFTP, 75)),
        new DatedAthleteSettings("2018-04-15", new AthleteSettings(195, restHr, lthr, 150, runningFTP, swimFTP, 76)),
        new DatedAthleteSettings("2018-02-01", new AthleteSettings(190, 65, lthr, 110, runningFTP, swimFTP, 78)),
        new DatedAthleteSettings(null, new AthleteSettings(190, 65, lthr, 110, runningFTP, swimFTP, 78))
      ];

      const invalidDate = "2018-99-99";
      const athletePeriodSettingsToAdd = new DatedAthleteSettings(
        invalidDate,
        new AthleteSettings(maxHr, restHr, lthr, cyclingFTP, runningFTP, swimFTP, weight)
      );

      const fetchDaoSpy = spyOn(service.athleteModelDao, "findOne").and.returnValue(
        Promise.resolve(defaultAthleteModel)
      );
      const updateDaoSpy = spyOn(service.athleteModelDao, "update").and.stub();

      // When
      const promise: Promise<DatedAthleteSettings[]> = service.addSettings(athletePeriodSettingsToAdd);

      // Then
      promise.then(
        (result: DatedAthleteSettings[]) => {
          expect(result).toBeNull();
          throw new Error("Whoops! I should not be here!");

          done();
        },
        (error: AppError) => {
          expect(error).not.toBeNull();
          expect(fetchDaoSpy).toHaveBeenCalledTimes(0);
          expect(updateDaoSpy).not.toHaveBeenCalled();
          expect(error.code).toEqual(AppError.DATED_ATHLETE_SETTINGS_INVALID_DATE);
          expect(error.message).toEqual("Dated athlete settings has invalid date.");

          done();
        }
      );
    });
  });

  describe("should save", () => {
    it("should save several dated athlete settings of AthleteModel", done => {
      // Given
      const expectedPeriodAthleteSettings: DatedAthleteSettings[] = [
        new DatedAthleteSettings("2018-05-10", new AthleteSettings(200, 50, lthr, 190, runningFTP, swimFTP, 75)),
        new DatedAthleteSettings("2018-04-15", new AthleteSettings(195, restHr, lthr, 150, runningFTP, swimFTP, 76)),
        new DatedAthleteSettings("2018-02-01", new AthleteSettings(190, 65, lthr, 110, runningFTP, swimFTP, 78)),
        new DatedAthleteSettings(null, new AthleteSettings(190, 65, lthr, 110, runningFTP, swimFTP, 78))
      ];

      const athleteModelToSave = _.cloneDeep(defaultAthleteModel);
      athleteModelToSave.datedAthleteSettings = expectedPeriodAthleteSettings;

      const expectedAthleteModel = _.cloneDeep(athleteModelToSave);

      const updateDaoSpy = spyOn(service.athleteModelDao, "update").and.returnValue(
        Promise.resolve(athleteModelToSave)
      );

      // When
      const promise: Promise<AthleteModel> = service.validateUpdate(athleteModelToSave);

      // Then
      promise.then(
        (athleteModel: AthleteModel) => {
          expect(athleteModel).not.toBeNull();
          expect(updateDaoSpy).toHaveBeenCalledWith(expectedAthleteModel);
          expect(updateDaoSpy).toHaveBeenCalledTimes(1);

          done();
        },
        error => {
          expect(error).toBeNull();
          throw new Error("Whoops! I should not be here!");
        }
      );
    });
  });

  describe("should reset", () => {
    it("should reset dated athlete settings of AthleteModel", done => {
      // Given
      defaultAthleteModel.datedAthleteSettings = [
        new DatedAthleteSettings("2018-05-10", new AthleteSettings(200, 50, lthr, 190, runningFTP, swimFTP, 75)),
        new DatedAthleteSettings("2018-04-15", new AthleteSettings(195, restHr, lthr, 150, runningFTP, swimFTP, 76)),
        new DatedAthleteSettings("2018-02-01", new AthleteSettings(190, 65, lthr, 110, runningFTP, swimFTP, 78)),
        new DatedAthleteSettings(null, new AthleteSettings(190, 65, lthr, 110, runningFTP, swimFTP, 78))
      ];

      const updateDaoSpy = spyOn(service.athleteModelDao, "update").and.callThrough();
      const addDaoSpy = spyOn(service, "addSettings").and.callThrough();

      // When
      const promise: Promise<DatedAthleteSettings[]> = service.resetSettings();

      // Then
      promise.then(
        (datedAthleteSettings: DatedAthleteSettings[]) => {
          expect(datedAthleteSettings).not.toBeNull();
          expect(datedAthleteSettings.length).toEqual(2);
          expect(_.first(datedAthleteSettings)).toEqual(DatedAthleteSettings.DEFAULT_MODEL);
          expect(addDaoSpy).toHaveBeenCalledTimes(1);
          expect(updateDaoSpy).toHaveBeenCalledTimes(2);

          done();
        },
        error => {
          expect(error).toBeNull();
          throw new Error("Whoops! I should not be here!");
        }
      );
    });
  });

  describe("should edit", () => {
    it("should edit 'settings' a of dated athlete settings with already existing periods", done => {
      // Given
      const editAtDate = "2018-04-15";
      const datedAthleteSettings01 = new DatedAthleteSettings(
        "2018-05-10",
        new AthleteSettings(200, 50, lthr, 190, runningFTP, swimFTP, 75)
      );
      const datedAthleteSettings02 = new DatedAthleteSettings(
        editAtDate,
        new AthleteSettings(195, restHr, lthr, 150, runningFTP, swimFTP, 76)
      );
      const datedAthleteSettings03 = new DatedAthleteSettings(
        "2018-02-01",
        new AthleteSettings(190, 65, lthr, 110, runningFTP, swimFTP, 78)
      );
      const datedAthleteSettings04 = new DatedAthleteSettings(
        null,
        new AthleteSettings(190, 65, lthr, 110, runningFTP, swimFTP, 78)
      );

      defaultAthleteModel.datedAthleteSettings = [
        datedAthleteSettings01,
        datedAthleteSettings02,
        datedAthleteSettings03,
        datedAthleteSettings04
      ];

      const expectedEditedDatedAthleteSettings = new DatedAthleteSettings(
        editAtDate,
        new AthleteSettings(99, 99, lthr, 99, 99, 99, 99)
      );
      const expectedEditedPeriodAthleteSettings = [
        datedAthleteSettings01,
        expectedEditedDatedAthleteSettings,
        datedAthleteSettings03,
        datedAthleteSettings04
      ];

      const expectedAthleteModel = _.cloneDeep(defaultAthleteModel);
      expectedAthleteModel.datedAthleteSettings = expectedEditedPeriodAthleteSettings;

      const fetchDaoSpy = spyOn(service.athleteModelDao, "findOne").and.returnValue(
        Promise.resolve(defaultAthleteModel)
      );
      const updateDaoSpy = spyOn(service.athleteModelDao, "update").and.returnValue(
        Promise.resolve(expectedAthleteModel)
      );

      // When
      const promise: Promise<DatedAthleteSettings[]> = service.editSettings(
        editAtDate,
        expectedEditedDatedAthleteSettings
      );

      // Then
      promise.then(
        (result: DatedAthleteSettings[]) => {
          expect(result).not.toBeNull();
          expect(result).toEqual(expectedEditedPeriodAthleteSettings);
          expect(fetchDaoSpy).toHaveBeenCalledTimes(1);
          expect(updateDaoSpy).toHaveBeenCalledTimes(1);
          expect(updateDaoSpy).toHaveBeenCalledWith(expectedAthleteModel);

          done();
        },
        error => {
          expect(error).toBeNull();
          throw new Error("Whoops! I should not be here!");
        }
      );
    });

    it("should edit 'since date & settings' of a dated athlete settings with already existing periods", done => {
      // Given
      const editAtDate = "2018-04-15";
      const datedAthleteSettings01 = new DatedAthleteSettings(
        "2018-05-10",
        new AthleteSettings(200, 50, lthr, 190, runningFTP, swimFTP, 75)
      );
      const datedAthleteSettings02 = new DatedAthleteSettings(
        editAtDate,
        new AthleteSettings(195, restHr, lthr, 150, runningFTP, swimFTP, 76)
      );
      const datedAthleteSettings03 = new DatedAthleteSettings(
        "2018-02-01",
        new AthleteSettings(190, 65, lthr, 110, runningFTP, swimFTP, 78)
      );
      const datedAthleteSettings04 = new DatedAthleteSettings(
        null,
        new AthleteSettings(190, 65, lthr, 110, runningFTP, swimFTP, 78)
      );

      defaultAthleteModel.datedAthleteSettings = [
        datedAthleteSettings01,
        datedAthleteSettings02,
        datedAthleteSettings03,
        datedAthleteSettings04
      ];

      const expectedNewDate = "2018-03-01";
      const expectedEditedDatedAthleteSettings = new DatedAthleteSettings(
        expectedNewDate,
        new AthleteSettings(99, 99, lthr, 99, 99, 99, 99)
      );

      const expectedEditedPeriodAthleteSettings = [
        datedAthleteSettings01,
        expectedEditedDatedAthleteSettings,
        datedAthleteSettings03,
        datedAthleteSettings04
      ];

      const expectedAthleteModel = _.cloneDeep(defaultAthleteModel);
      expectedAthleteModel.datedAthleteSettings = expectedEditedPeriodAthleteSettings;

      const fetchDaoSpy = spyOn(service.athleteModelDao, "findOne").and.returnValue(
        Promise.resolve(defaultAthleteModel)
      );
      const updateDaoSpy = spyOn(service.athleteModelDao, "update").and.returnValue(
        Promise.resolve(expectedAthleteModel)
      );

      // When
      const promise: Promise<DatedAthleteSettings[]> = service.editSettings(
        editAtDate,
        expectedEditedDatedAthleteSettings
      );

      // Then
      promise.then(
        (result: DatedAthleteSettings[]) => {
          expect(result).not.toBeNull();
          expect(result).toEqual(expectedEditedPeriodAthleteSettings);
          expect(fetchDaoSpy).toHaveBeenCalledTimes(1);
          expect(updateDaoSpy).toHaveBeenCalledTimes(1);
          expect(updateDaoSpy).toHaveBeenCalledWith(expectedAthleteModel);

          done();
        },
        error => {
          expect(error).toBeNull();
          throw new Error("Whoops! I should not be here!");
        }
      );
    });

    it("should edit the single 'forever' existing period", done => {
      // Given
      const editAtDate = null;
      const foreverDatedAthleteSettings = new DatedAthleteSettings(
        null,
        new AthleteSettings(190, 65, lthr, 110, runningFTP, swimFTP, 78)
      );

      defaultAthleteModel.datedAthleteSettings = [foreverDatedAthleteSettings];

      const expectedEditedDatedAthleteSettings = new DatedAthleteSettings(
        editAtDate,
        new AthleteSettings(99, 99, lthr, 99, 99, 99, 99)
      );
      const expectedEditedPeriodAthleteSettings = [expectedEditedDatedAthleteSettings];

      const expectedAthleteModel = _.cloneDeep(defaultAthleteModel);
      expectedAthleteModel.datedAthleteSettings = expectedEditedPeriodAthleteSettings;

      const fetchDaoSpy = spyOn(service.athleteModelDao, "findOne").and.returnValue(
        Promise.resolve(defaultAthleteModel)
      );
      const updateDaoSpy = spyOn(service.athleteModelDao, "update").and.returnValue(
        Promise.resolve(expectedAthleteModel)
      );

      // When
      const promise: Promise<DatedAthleteSettings[]> = service.editSettings(
        editAtDate,
        expectedEditedDatedAthleteSettings
      );

      // Then
      promise.then(
        (result: DatedAthleteSettings[]) => {
          expect(result).not.toBeNull();
          expect(result).toEqual(expectedEditedPeriodAthleteSettings);
          expect(fetchDaoSpy).toHaveBeenCalledTimes(1);
          expect(updateDaoSpy).toHaveBeenCalledTimes(1);
          expect(updateDaoSpy).toHaveBeenCalledWith(expectedAthleteModel);

          done();
        },
        error => {
          expect(error).toBeNull();
          throw new Error("Whoops! I should not be here!");
        }
      );
    });

    it("should reject edit of an non-existing dated athlete settings", done => {
      // Given
      const fakeEditAtDate = "2018-04-23";
      const datedAthleteSettings01 = new DatedAthleteSettings(
        "2018-05-10",
        new AthleteSettings(200, 50, lthr, 190, runningFTP, swimFTP, 75)
      );
      const datedAthleteSettings02 = new DatedAthleteSettings(
        "2018-04-15",
        new AthleteSettings(195, restHr, lthr, 150, runningFTP, swimFTP, 76)
      );
      const datedAthleteSettings03 = new DatedAthleteSettings(
        "2018-02-01",
        new AthleteSettings(190, 65, lthr, 110, runningFTP, swimFTP, 78)
      );
      const datedAthleteSettings04 = new DatedAthleteSettings(
        null,
        new AthleteSettings(190, 65, lthr, 110, runningFTP, swimFTP, 78)
      );

      defaultAthleteModel.datedAthleteSettings = [
        datedAthleteSettings01,
        datedAthleteSettings02,
        datedAthleteSettings03,
        datedAthleteSettings04
      ];

      const expectedNewDate = "2018-03-01";
      const expectedEditedDatedAthleteSettings = new DatedAthleteSettings(
        expectedNewDate,
        new AthleteSettings(99, 99, lthr, 99, 99, 99, 99)
      );

      const fetchDaoSpy = spyOn(service.athleteModelDao, "findOne").and.returnValue(
        Promise.resolve(defaultAthleteModel)
      );
      const updateDaoSpy = spyOn(service.athleteModelDao, "update").and.stub();

      // When
      const promise: Promise<DatedAthleteSettings[]> = service.editSettings(
        fakeEditAtDate,
        expectedEditedDatedAthleteSettings
      );

      // Then
      promise.then(
        (result: DatedAthleteSettings[]) => {
          expect(result).toBeNull();
          throw new Error("Whoops! I should not be here!");

          done();
        },
        (error: AppError) => {
          expect(error).not.toBeNull();
          expect(fetchDaoSpy).toHaveBeenCalledTimes(1);
          expect(updateDaoSpy).not.toHaveBeenCalled();
          expect(error.code).toEqual(AppError.DATED_ATHLETE_SETTINGS_DO_NOT_EXISTS);
          expect(error.message).toEqual("Dated athlete settings do not exists. You should add it instead.");
          done();
        }
      );
    });

    it("should reject edit of an dated athlete settings that conflict with another existing one", done => {
      // Given
      const editAtDate = "2018-05-10";
      const existingDatedSettingsDate = "2018-02-01";
      const datedAthleteSettings01 = new DatedAthleteSettings(
        editAtDate,
        new AthleteSettings(200, 50, lthr, 190, runningFTP, swimFTP, 75)
      );
      const datedAthleteSettings02 = new DatedAthleteSettings(
        "2018-04-15",
        new AthleteSettings(195, restHr, lthr, 150, runningFTP, swimFTP, 76)
      );
      const datedAthleteSettings03 = new DatedAthleteSettings(
        existingDatedSettingsDate,
        new AthleteSettings(190, 65, lthr, 110, runningFTP, swimFTP, 78)
      );
      const datedAthleteSettings04 = new DatedAthleteSettings(
        null,
        new AthleteSettings(190, 65, lthr, 110, runningFTP, swimFTP, 78)
      );

      defaultAthleteModel.datedAthleteSettings = [
        datedAthleteSettings01,
        datedAthleteSettings02,
        datedAthleteSettings03,
        datedAthleteSettings04
      ];

      const expectedEditedDatedAthleteSettings = new DatedAthleteSettings(
        existingDatedSettingsDate,
        new AthleteSettings(99, 99, lthr, 99, 99, 99, 99)
      );

      const fetchDaoSpy = spyOn(service.athleteModelDao, "findOne").and.returnValue(
        Promise.resolve(defaultAthleteModel)
      );
      const updateDaoSpy = spyOn(service.athleteModelDao, "update").and.stub();

      // When
      const promise: Promise<DatedAthleteSettings[]> = service.editSettings(
        editAtDate,
        expectedEditedDatedAthleteSettings
      );

      // Then
      promise.then(
        (result: DatedAthleteSettings[]) => {
          expect(result).toBeNull();
          throw new Error("Whoops! I should not be here!");
        },
        (error: AppError) => {
          expect(error).not.toBeNull();
          expect(fetchDaoSpy).toHaveBeenCalledTimes(1);
          expect(updateDaoSpy).not.toHaveBeenCalled();
          expect(error.code).toEqual(AppError.DATED_ATHLETE_SETTINGS_EXISTS);
          expect(error.message).toEqual("Dated athlete settings do not exists. You should add it instead.");
          done();
        }
      );
    });

    it("should reject edit of invalid dated athlete settings date", done => {
      // Given
      const invalidDate = "2018-99-99";
      const datedAthleteSettings01 = new DatedAthleteSettings(
        "2018-05-10",
        new AthleteSettings(200, 50, lthr, 190, runningFTP, swimFTP, 75)
      );
      const datedAthleteSettings02 = new DatedAthleteSettings(
        "2018-04-15",
        new AthleteSettings(195, restHr, lthr, 150, runningFTP, swimFTP, 76)
      );
      const datedAthleteSettings03 = new DatedAthleteSettings(
        "2018-02-01",
        new AthleteSettings(190, 65, lthr, 110, runningFTP, swimFTP, 78)
      );
      const datedAthleteSettings04 = new DatedAthleteSettings(
        null,
        new AthleteSettings(190, 65, lthr, 110, runningFTP, swimFTP, 78)
      );

      defaultAthleteModel.datedAthleteSettings = [
        datedAthleteSettings01,
        datedAthleteSettings02,
        datedAthleteSettings03,
        datedAthleteSettings04
      ];

      const expectedEditedDatedAthleteSettings = new DatedAthleteSettings(
        invalidDate,
        new AthleteSettings(99, 99, lthr, 99, 99, 99, 99)
      );

      const fetchDaoSpy = spyOn(service.athleteModelDao, "findOne").and.returnValue(
        Promise.resolve(defaultAthleteModel)
      );
      const updateDaoSpy = spyOn(service.athleteModelDao, "update").and.stub();

      // When
      const promise: Promise<DatedAthleteSettings[]> = service.editSettings(
        invalidDate,
        expectedEditedDatedAthleteSettings
      );

      // Then
      promise.then(
        (result: DatedAthleteSettings[]) => {
          expect(result).toBeNull();
          throw new Error("Whoops! I should not be here!");

          done();
        },
        (error: AppError) => {
          expect(error).not.toBeNull();
          expect(fetchDaoSpy).toHaveBeenCalledTimes(0);
          expect(updateDaoSpy).not.toHaveBeenCalled();
          expect(error.code).toEqual(AppError.DATED_ATHLETE_SETTINGS_INVALID_DATE);
          expect(error.message).toEqual("Dated athlete settings has invalid date.");
          done();
        }
      );
    });
  });

  describe("should remove", () => {
    it("should remove a dated athlete settings with already existing periods", done => {
      // Given
      const removeSinceIdentifier = "2018-04-15";
      const removeDatedAthleteSettingsIndex = 1;
      const existingPeriodAthleteSettings: DatedAthleteSettings[] = [
        new DatedAthleteSettings("2018-05-10", new AthleteSettings(200, 50, lthr, 190, runningFTP, swimFTP, 75)),
        new DatedAthleteSettings(
          removeSinceIdentifier,
          new AthleteSettings(195, restHr, lthr, 150, runningFTP, swimFTP, 76)
        ),
        new DatedAthleteSettings("2018-02-01", new AthleteSettings(190, 65, lthr, 110, runningFTP, swimFTP, 78)),
        new DatedAthleteSettings(null, new AthleteSettings(190, 65, lthr, 110, runningFTP, swimFTP, 78))
      ];

      defaultAthleteModel.datedAthleteSettings = existingPeriodAthleteSettings;

      const expectedPeriodAthleteSettings = _.cloneDeep(existingPeriodAthleteSettings);
      expectedPeriodAthleteSettings.splice(removeDatedAthleteSettingsIndex, 1);

      const expectedAthleteModel = _.cloneDeep(defaultAthleteModel);
      expectedAthleteModel.datedAthleteSettings = expectedPeriodAthleteSettings;

      const fetchDaoSpy = spyOn(service.athleteModelDao, "findOne").and.returnValue(
        Promise.resolve(defaultAthleteModel)
      );
      const updateDaoSpy = spyOn(service.athleteModelDao, "update").and.returnValue(
        Promise.resolve(expectedAthleteModel)
      );

      // When
      const promise: Promise<DatedAthleteSettings[]> = service.removeSettings(removeSinceIdentifier);

      // Then
      promise.then(
        (result: DatedAthleteSettings[]) => {
          expect(result).not.toBeNull();
          expect(result).toEqual(expectedPeriodAthleteSettings);
          expect(fetchDaoSpy).toHaveBeenCalledTimes(1);
          expect(updateDaoSpy).toHaveBeenCalledWith(expectedAthleteModel);
          expect(updateDaoSpy).toHaveBeenCalledTimes(1);

          done();
        },
        error => {
          expect(error).toBeNull();
          throw new Error("Whoops! I should not be here!");
        }
      );
    });

    it("should reject deletion of the 'forever' existing period", done => {
      // Given
      const removeSinceIdentifier = null;
      const existingPeriodAthleteSettings: DatedAthleteSettings[] = [
        new DatedAthleteSettings("2018-02-01", new AthleteSettings(190, 65, lthr, 110, runningFTP, swimFTP, 78)),
        new DatedAthleteSettings(
          removeSinceIdentifier,
          new AthleteSettings(190, 65, lthr, 110, runningFTP, swimFTP, 78)
        )
      ];

      const expectedPeriodAthleteSettings = _.pullAt(existingPeriodAthleteSettings, 1);

      const fetchDaoSpy = spyOn(service.athleteModelDao, "findOne").and.returnValue(
        Promise.resolve(_.cloneDeep(new AthleteModel(Gender.MEN, existingPeriodAthleteSettings)))
      );

      const updateDaoSpy = spyOn(service.athleteModelDao, "update").and.returnValue(
        Promise.resolve(new AthleteModel(Gender.MEN, expectedPeriodAthleteSettings))
      );

      // When
      const promise: Promise<DatedAthleteSettings[]> = service.removeSettings(removeSinceIdentifier);

      // Then
      promise.then(
        (result: DatedAthleteSettings[]) => {
          expect(result).toBeNull();
          throw new Error("Whoops! I should not be here!");
        },
        (error: AppError) => {
          expect(error).not.toBeNull();
          expect(fetchDaoSpy).toHaveBeenCalledTimes(1);
          expect(updateDaoSpy).not.toHaveBeenCalled();
          expect(error.code).toEqual(AppError.DATED_ATHLETE_SETTINGS_FOREVER_MUST_EXISTS);
          expect(error.message).toEqual("Default forever dated athlete settings cannot be removed.");
          done();
        }
      );
    });

    it("should reject deletion of the single 'forever' existing period", done => {
      // Given
      const removeSinceIdentifier = null;
      const existingPeriodAthleteSettings: DatedAthleteSettings[] = [
        new DatedAthleteSettings(
          removeSinceIdentifier,
          new AthleteSettings(190, 65, lthr, 110, runningFTP, swimFTP, 78)
        )
      ];

      const expectedPeriodAthleteSettings = _.pullAt(existingPeriodAthleteSettings, 1);

      const fetchDaoSpy = spyOn(service.athleteModelDao, "findOne").and.returnValue(
        Promise.resolve(_.cloneDeep(new AthleteModel(Gender.MEN, existingPeriodAthleteSettings)))
      );

      const updateDaoSpy = spyOn(service.athleteModelDao, "update").and.returnValue(
        Promise.resolve(new AthleteModel(Gender.MEN, expectedPeriodAthleteSettings))
      );

      // When
      const promise: Promise<DatedAthleteSettings[]> = service.removeSettings(removeSinceIdentifier);

      // Then
      promise.then(
        (result: DatedAthleteSettings[]) => {
          expect(result).toBeNull();
          throw new Error("Whoops! I should not be here!");
        },
        (error: AppError) => {
          expect(error).not.toBeNull();
          expect(fetchDaoSpy).toHaveBeenCalledTimes(1);
          expect(updateDaoSpy).not.toHaveBeenCalled();
          expect(error.code).toEqual(AppError.DATED_ATHLETE_SETTINGS_FOREVER_MUST_EXISTS);
          expect(error.message).toEqual("Default forever dated athlete settings cannot be removed.");
          done();
        }
      );
    });

    it("should reject deletion of a non-existing period", done => {
      // Given
      const removeSinceIdentifier = "fake";
      const existingPeriodAthleteSettings: DatedAthleteSettings[] = [
        new DatedAthleteSettings("2018-05-10", new AthleteSettings(200, 50, lthr, 190, runningFTP, swimFTP, 75)),
        new DatedAthleteSettings("2018-04-15", new AthleteSettings(195, restHr, lthr, 150, runningFTP, swimFTP, 76)),
        new DatedAthleteSettings("2018-02-01", new AthleteSettings(190, 65, lthr, 110, runningFTP, swimFTP, 78)),
        new DatedAthleteSettings(null, new AthleteSettings(190, 65, lthr, 110, runningFTP, swimFTP, 78))
      ];

      const expectedPeriodAthleteSettings = _.pullAt(existingPeriodAthleteSettings, 1);

      const fetchDaoSpy = spyOn(service.athleteModelDao, "findOne").and.returnValue(
        Promise.resolve(_.cloneDeep(new AthleteModel(Gender.MEN, existingPeriodAthleteSettings)))
      );

      const updateDaoSpy = spyOn(service.athleteModelDao, "update").and.returnValue(
        Promise.resolve(new AthleteModel(Gender.MEN, expectedPeriodAthleteSettings))
      );

      // When
      const promise: Promise<DatedAthleteSettings[]> = service.removeSettings(removeSinceIdentifier);

      // Then
      promise.then(
        (result: DatedAthleteSettings[]) => {
          expect(result).toBeNull();
          throw new Error("Whoops! I should not be here!");
        },
        (error: AppError) => {
          expect(error).not.toBeNull();
          expect(fetchDaoSpy).toHaveBeenCalledTimes(1);
          expect(updateDaoSpy).not.toHaveBeenCalled();
          expect(error.code).toEqual(AppError.DATED_ATHLETE_SETTINGS_DO_NOT_EXISTS);
          expect(error.message).toEqual("Dated athlete settings do not exists. You should add it instead.");
          done();
        }
      );
    });
  });

  describe("should validate", () => {
    it("should validate dated athlete settings consistency", done => {
      // Given
      const periodAthleteSettings: DatedAthleteSettings[] = [
        new DatedAthleteSettings("2018-05-10", new AthleteSettings(200, 50, lthr, 190, runningFTP, swimFTP, 75)),
        new DatedAthleteSettings("2018-04-15", new AthleteSettings(195, restHr, lthr, 150, runningFTP, swimFTP, 76)),
        new DatedAthleteSettings("2018-02-01", new AthleteSettings(190, 65, lthr, 110, runningFTP, swimFTP, 78)),
        new DatedAthleteSettings(null, new AthleteSettings(190, 65, lthr, 110, runningFTP, swimFTP, 78))
      ];

      const spyResolve = spyOn(Promise, "resolve").and.callThrough();

      // When
      const promise: Promise<void> = service.validate(periodAthleteSettings);

      // Then
      promise.then(
        () => {
          expect(spyResolve).toHaveBeenCalled();
          done();
        },
        (error: AppError) => {
          expect(error).toBeNull();
          done();
        }
      );
    });

    it("should not validate dated athlete settings consistency with duplicate identifier (1)", done => {
      // Given
      const duplicateSinceIdentifier = "2018-05-10";
      const periodAthleteSettings: DatedAthleteSettings[] = [
        new DatedAthleteSettings(
          duplicateSinceIdentifier,
          new AthleteSettings(200, 50, lthr, 190, runningFTP, swimFTP, 75)
        ),
        new DatedAthleteSettings(
          duplicateSinceIdentifier,
          new AthleteSettings(195, restHr, lthr, 150, runningFTP, swimFTP, 76)
        ),
        new DatedAthleteSettings("2018-02-01", new AthleteSettings(190, 65, lthr, 110, runningFTP, swimFTP, 78)),
        new DatedAthleteSettings(null, new AthleteSettings(190, 65, lthr, 110, runningFTP, swimFTP, 78))
      ];

      // When
      const promise: Promise<void> = service.validate(periodAthleteSettings);

      // Then
      promise.then(
        () => {
          throw new Error("Whoops! I should not be here!");
        },
        (error: AppError) => {
          expect(error).not.toBeNull();
          expect(error.code).toEqual(AppError.DATED_ATHLETE_SETTINGS_DUPLICATES);
          expect(error.message).toEqual("Dated athlete settings have duplicates.");
          done();
        }
      );
    });

    it("should not validate dated athlete settings consistency with duplicate identifier (2)", done => {
      // Given
      const duplicateSinceIdentifier = null;
      const periodAthleteSettings: DatedAthleteSettings[] = [
        new DatedAthleteSettings(
          duplicateSinceIdentifier,
          new AthleteSettings(200, 50, lthr, 190, runningFTP, swimFTP, 75)
        ),
        new DatedAthleteSettings("2018-04-15", new AthleteSettings(195, restHr, lthr, 150, runningFTP, swimFTP, 76)),
        new DatedAthleteSettings(
          duplicateSinceIdentifier,
          new AthleteSettings(190, 65, lthr, 110, runningFTP, swimFTP, 78)
        ),
        new DatedAthleteSettings(
          duplicateSinceIdentifier,
          new AthleteSettings(190, 65, lthr, 110, runningFTP, swimFTP, 78)
        )
      ];

      // When
      const promise: Promise<void> = service.validate(periodAthleteSettings);

      // Then
      promise.then(
        () => {
          throw new Error("Whoops! I should not be here!");
        },
        (error: AppError) => {
          expect(error).not.toBeNull();
          expect(error.code).toEqual(AppError.DATED_ATHLETE_SETTINGS_DUPLICATES);
          expect(error.message).toEqual("Dated athlete settings have duplicates.");
          done();
        }
      );
    });

    it("should not validate dated athlete settings consistency with missing 'forever' dated settings", done => {
      // Given
      const periodAthleteSettings: DatedAthleteSettings[] = [
        new DatedAthleteSettings("2018-05-10", new AthleteSettings(200, 50, lthr, 190, runningFTP, swimFTP, 75)),
        new DatedAthleteSettings("2018-04-15", new AthleteSettings(195, restHr, lthr, 150, runningFTP, swimFTP, 76)),
        new DatedAthleteSettings("2018-02-01", new AthleteSettings(190, 65, lthr, 110, runningFTP, swimFTP, 78))
      ];

      // When
      const promise: Promise<void> = service.validate(periodAthleteSettings);

      // Then
      promise.then(
        () => {
          throw new Error("Whoops! I should not be here!");
        },
        (error: AppError) => {
          expect(error).not.toBeNull();
          expect(error.code).toEqual(AppError.DATED_ATHLETE_SETTINGS_FOREVER_MUST_EXISTS);
          expect(error.message).toEqual("Default forever dated athlete settings must exists.");
          done();
        }
      );
    });
  });
});
