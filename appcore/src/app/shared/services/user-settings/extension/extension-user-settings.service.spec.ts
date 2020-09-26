import { TestBed } from "@angular/core/testing";

import { ExtensionUserSettingsService } from "./extension-user-settings.service";
import { CoreModule } from "../../../../core/core.module";
import { SharedModule } from "../../../shared.module";
import { DataStore } from "../../../data-store/data-store";
import { TestingDataStore } from "../../../data-store/testing-datastore.service";
import _ from "lodash";
import { UserSettings } from "@elevate/shared/models";
import { TargetModule } from "../../../modules/target/extension-target.module";
import { UserSettingsService } from "../user-settings.service";
import ExtensionUserSettingsModel = UserSettings.ExtensionUserSettingsModel;

describe("ExtensionUserSettingsService", () => {
  let extensionUserSettingsService: ExtensionUserSettingsService;

  beforeEach(done => {
    TestBed.configureTestingModule({
      imports: [CoreModule, SharedModule, TargetModule],
      providers: [{ provide: DataStore, useClass: TestingDataStore }]
    });

    // Retrieve injected service
    extensionUserSettingsService = TestBed.inject(UserSettingsService) as ExtensionUserSettingsService;
    done();
  });

  it("should mark local storage to be clear", done => {
    // Given
    const expectedSettings = _.cloneDeep(ExtensionUserSettingsModel.DEFAULT_MODEL);
    expectedSettings.localStorageMustBeCleared = true;

    const updatePropertyDaoSpy = spyOn(extensionUserSettingsService.userSettingsDao, "update").and.returnValue(
      Promise.resolve(expectedSettings)
    );

    // When
    const promiseClearLS: Promise<void> = extensionUserSettingsService.clearLocalStorageOnNextLoad();

    // Then
    promiseClearLS.then(
      () => {
        expect(updatePropertyDaoSpy).toHaveBeenCalledTimes(1);
        done();
      },
      error => {
        expect(error).toBeNull();
        done();
      }
    );
  });
});
