import { UserSettings, UserZonesModel, ZoneModel } from "@elevate/shared/models";
import { UserSettingsDao } from "../../dao/user-settings/user-settings.dao";
import { ZoneDefinitionModel } from "../../models/zone-definition.model";
import { LoggerService } from "../logging/logger.service";
import { environment } from "../../../../environments/environment";
import UserSettingsModel = UserSettings.UserSettingsModel;

export abstract class UserSettingsService {
  protected constructor(public readonly userSettingsDao: UserSettingsDao, public readonly logger: LoggerService) {}

  public fetch(): Promise<UserSettingsModel> {
    return this.userSettingsDao.findOne();
  }

  public updateOption<T extends UserSettingsModel>(optionKey: keyof T, optionValue: any): Promise<UserSettingsModel> {
    return this.fetch().then(userSettings => {
      userSettings[optionKey as string] = optionValue;
      return this.updateUserSettings(userSettings);
    });
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

  public resetGlobalSettings(): Promise<UserSettingsModel> {
    let oldUserZones;
    return this.fetch()
      .then(userSettings => {
        oldUserZones = userSettings.zones;
        return this.userSettingsDao.clear();
      })
      .then(() => {
        const defaultUserSettingsModel = UserSettings.getDefaultsByBuildTarget(environment.buildTarget);

        if (oldUserZones) {
          defaultUserSettingsModel.zones = oldUserZones;
        }

        return this.userSettingsDao.insert(defaultUserSettingsModel);
      });
  }

  public resetZonesSettings(): Promise<UserSettingsModel> {
    return this.fetch().then(userSettings => {
      // Replace with default zones
      userSettings.zones = this.userSettingsDao.getDefaultStorageValue().zones;

      // Update new user settings
      return this.updateUserSettings(userSettings);
    });
  }

  private updateUserSettings(userSettings: UserSettings.UserSettingsModel): Promise<UserSettingsModel> {
    return this.userSettingsDao.update(userSettings);
  }
}
