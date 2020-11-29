import { Inject, Injectable } from "@angular/core";
import { UserSettings, UserZonesModel, ZoneModel } from "@elevate/shared/models";
import { UserSettingsDao } from "../../dao/user-settings/user-settings.dao";
import { ZoneDefinitionModel } from "../../models/zone-definition.model";
import { LoggerService } from "../logging/logger.service";
import { environment } from "../../../../environments/environment";
import UserSettingsModel = UserSettings.UserSettingsModel;

@Injectable()
export class UserSettingsService {
  public static readonly MARK_LOCAL_STORAGE_CLEAR: string = "localStorageMustBeCleared";

  constructor(
    @Inject(UserSettingsDao) public readonly userSettingsDao: UserSettingsDao,
    @Inject(LoggerService) public readonly logger: LoggerService
  ) {}

  public fetch(): Promise<UserSettingsModel> {
    return this.userSettingsDao.findOne();
  }

  public updateOption(optionKey: keyof UserSettingsModel, optionValue: any): Promise<UserSettingsModel> {
    return this.fetch().then(userSettings => {
      userSettings[optionKey as string] = optionValue;
      return this.updateUserSettings(userSettings);
    });
  }

  /**
   * Clear local storage on next reload
   * TODO Should be only for extension, not for desktop
   */
  public clearLocalStorageOnNextLoad(): Promise<void> {
    return this.updateOption(UserSettingsService.MARK_LOCAL_STORAGE_CLEAR as keyof UserSettingsModel, true).then(() =>
      Promise.resolve()
    );
  }

  public updateZones(zoneDefinition: ZoneDefinitionModel, zones: ZoneModel[]): Promise<ZoneModel[]> {
    return this.fetch()
      .then(userSettings => {
        // Replace with new zones
        userSettings.zones[zoneDefinition.value] = UserZonesModel.serialize(zones);

        // Update new user settings
        return this.userSettingsDao.update(userSettings);
      })
      .then(updatedUserSettings => {
        return Promise.resolve(UserZonesModel.deserialize(updatedUserSettings.zones[zoneDefinition.value]));
      });
  }

  public reset(): Promise<UserSettingsModel> {
    return this.userSettingsDao.clear(true).then(() => {
      const defaultUserSettingsModel = UserSettings.getDefaultsByBuildTarget(environment.buildTarget);
      return this.userSettingsDao.insert(defaultUserSettingsModel, true);
    });
  }

  public resetZones(): Promise<UserSettingsModel> {
    return this.fetch().then(userSettings => {
      // Get default zones
      const defaultZones = this.userSettingsDao.getDefaultStorageValue().zones;

      // Replace with default zones
      userSettings.zones = defaultZones;

      // Update new user settings
      return this.updateUserSettings(userSettings);
    });
  }

  private updateUserSettings(userSettings: UserSettings.UserSettingsModel): Promise<UserSettingsModel> {
    return this.userSettingsDao.update(userSettings, true);
  }
}
