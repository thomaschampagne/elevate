import { TestBed } from "@angular/core/testing";
import { SharedModule } from "../../shared.module";
import { UserSettingsService } from "./user-settings.service";
import { ZoneDefinitionModel } from "../../models/zone-definition.model";
import { CoreModule } from "../../../core/core.module";
import _ from "lodash";
import { DataStore } from "../../data-store/data-store";
import { TestingDataStore } from "../../data-store/testing-datastore.service";
import { TargetModule } from "../../modules/target/desktop-target.module";
import { IpcRendererTunnelServiceMock } from "../../../desktop/ipc/ipc-renderer-tunnel-service.mock";
import { IPC_TUNNEL_SERVICE } from "../../../desktop/ipc/ipc-tunnel-service.token";
import { UserSettings } from "@elevate/shared/models/user-settings/user-settings.namespace";
import { ZoneModel } from "@elevate/shared/models/zone.model";
import { BuildTarget } from "@elevate/shared/enums/build-target.enum";
import { UserZonesModel } from "@elevate/shared/models/user-settings/user-zones.model";
import { ZoneType } from "@elevate/shared/enums/zone-type.enum";
import BaseUserSettings = UserSettings.BaseUserSettings;
import ExtensionUserSettings = UserSettings.ExtensionUserSettings;
import DesktopUserSettings = UserSettings.DesktopUserSettings;

describe("UserSettingsService", () => {
  let userSettingsService: UserSettingsService;

  beforeEach(done => {
    TestBed.configureTestingModule({
      imports: [CoreModule, SharedModule, TargetModule],
      providers: [
        { provide: DataStore, useClass: TestingDataStore },
        { provide: IPC_TUNNEL_SERVICE, useClass: IpcRendererTunnelServiceMock }
      ]
    });

    // Retrieve injected service
    userSettingsService = TestBed.inject(UserSettingsService);
    done();
  });

  it("should be created", done => {
    expect(userSettingsService).toBeTruthy();
    done();
  });

  it("should fetch user settings", done => {
    // Given
    const expectedSettings = _.cloneDeep(DesktopUserSettings.DEFAULT_MODEL);
    const fetchDaoSpy = spyOn(userSettingsService.userSettingsDao, "findOne").and.returnValue(
      Promise.resolve(expectedSettings)
    );

    // When
    const promiseFetch: Promise<BaseUserSettings> = userSettingsService.fetch();

    // Then
    promiseFetch.then(
      (result: BaseUserSettings) => {
        expect(result).not.toBeNull();
        expect(result).toEqual(expectedSettings);
        expect(fetchDaoSpy).toHaveBeenCalledTimes(1);

        done();
      },
      error => {
        expect(error).toBeNull();
        done();
      }
    );
  });

  it("should save user setting property", done => {
    // Given
    const key = "displayAdvancedHrData";
    const displayAdvancedHrData = false;
    const userSettingsData = UserSettings.getDefaultsByBuildTarget(BuildTarget.EXTENSION) as ExtensionUserSettings;
    const expectedSettings: ExtensionUserSettings = _.cloneDeep(userSettingsData);
    expectedSettings.displayAdvancedHrData = displayAdvancedHrData;

    const updateDaoSpy = spyOn(userSettingsService.userSettingsDao, "update").and.returnValue(
      Promise.resolve(expectedSettings)
    );

    // When
    const promiseUpdate: Promise<ExtensionUserSettings> = userSettingsService.updateOption<ExtensionUserSettings>(
      key,
      displayAdvancedHrData
    ) as Promise<ExtensionUserSettings>;

    // Then
    promiseUpdate.then(
      (result: ExtensionUserSettings) => {
        expect(result).not.toBeNull();
        expect(result.displayAdvancedHrData).toEqual(displayAdvancedHrData);
        expect(result).toEqual(expectedSettings);
        expect(result).not.toEqual(userSettingsData);
        expect(result.displayAdvancedHrData).not.toEqual(userSettingsData.displayAdvancedHrData);
        expect(updateDaoSpy).toHaveBeenCalledTimes(1);

        done();
      },
      error => {
        expect(error).toBeNull();
        done();
      }
    );
  });

  it("should save user zone", done => {
    // Given
    const TO_BE_SAVED_ZONES = [
      // 8 zones
      { from: 0, to: 50 },
      { from: 50, to: 100 },
      { from: 100, to: 150 },
      { from: 150, to: 200 },
      { from: 200, to: 250 },
      { from: 250, to: 300 },
      { from: 300, to: 400 },
      { from: 400, to: 500 }
    ];

    const zoneDefinition: ZoneDefinitionModel = {
      name: "Cycling Speed",
      value: ZoneType.SPEED,
      units: "KPH",
      step: 0.1,
      min: 0,
      max: 9999,
      customDisplay: null
    };

    const settings = _.cloneDeep(UserSettings.getDefaultsByBuildTarget(BuildTarget.DESKTOP));
    const serializedZones = UserZonesModel.serialize(TO_BE_SAVED_ZONES);
    settings.zones.speed = serializedZones;

    const updateDaoSpy = spyOn(userSettingsService.userSettingsDao, "update").and.returnValue(
      Promise.resolve(settings)
    );

    // When
    const promiseUpdateZones: Promise<ZoneModel[]> = userSettingsService.updateZones(zoneDefinition, TO_BE_SAVED_ZONES);

    // Then
    promiseUpdateZones.then(
      (savedZones: ZoneModel[]) => {
        expect(savedZones).not.toBeNull();
        expect(savedZones).toEqual(TO_BE_SAVED_ZONES);
        expect(updateDaoSpy).toHaveBeenCalledTimes(1);

        done();
      },
      error => {
        expect(error).toBeNull();
        done();
      }
    );
  });

  it("should reset user settings", done => {
    // Given
    const expectedUserSettings = UserSettings.getDefaultsByBuildTarget(BuildTarget.EXTENSION);
    const insertDaoSpy = spyOn(userSettingsService.userSettingsDao, "insert").and.returnValue(
      Promise.resolve(expectedUserSettings)
    );

    // When
    const promiseUpdate: Promise<BaseUserSettings> = userSettingsService.resetGlobalSettings();

    // Then
    promiseUpdate.then(
      (result: BaseUserSettings) => {
        expect(result).not.toBeNull();
        expect(result).toEqual(expectedUserSettings);
        expect(insertDaoSpy).toHaveBeenCalledTimes(1);
        expect(insertDaoSpy).toHaveBeenCalledWith(expectedUserSettings);

        done();
      },
      error => {
        expect(error).toBeNull();
        done();
      }
    );
  });

  it("should reset user zones settings", done => {
    // Given
    const userSettings = UserSettings.getDefaultsByBuildTarget(BuildTarget.DESKTOP);
    userSettings.zones = {} as UserZonesModel;
    spyOn(userSettingsService.userSettingsDao, "findOne").and.returnValue(Promise.resolve(userSettings));

    const expectedUserSettings = UserSettings.getDefaultsByBuildTarget(BuildTarget.DESKTOP);
    const updateDaoSpy = spyOn(userSettingsService.userSettingsDao, "update").and.returnValue(
      Promise.resolve(expectedUserSettings)
    );

    // When
    const promiseUpdate: Promise<BaseUserSettings> = userSettingsService.resetZonesSettings();

    // Then
    promiseUpdate.then(
      (result: BaseUserSettings) => {
        expect(result).not.toBeNull();
        expect(result).toEqual(expectedUserSettings);
        expect(updateDaoSpy).toHaveBeenCalledTimes(1);

        done();
      },
      error => {
        expect(error).toBeNull();
        done();
      }
    );
  });
});
