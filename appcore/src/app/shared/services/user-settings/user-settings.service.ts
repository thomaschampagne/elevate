import { UserSettingsDao } from "../../dao/user-settings/user-settings.dao";
import { ZoneDefinitionModel } from "../../models/zone-definition.model";
import { LoggerService } from "../logging/logger.service";
import { environment } from "../../../../environments/environment";
import { UserSettings } from "@elevate/shared/models/user-settings/user-settings.namespace";
import { ZoneModel } from "@elevate/shared/models/zone.model";
import { UserZonesModel } from "@elevate/shared/models/user-settings/user-zones.model";
import BaseUserSettings = UserSettings.BaseUserSettings;

export abstract class UserSettingsService {
  protected constructor(public readonly userSettingsDao: UserSettingsDao, public readonly logger: LoggerService) {}

  public fetch(): Promise<BaseUserSettings> {
    return this.userSettingsDao.findOne();
  }

  public updateOption<T extends BaseUserSettings>(optionKey: keyof T, optionValue: any): Promise<BaseUserSettings> {
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

  public resetGlobalSettings(): Promise<BaseUserSettings> {
    let oldUserZones;
    return this.fetch()
      .then(userSettings => {
        oldUserZones = userSettings.zones;
        return this.userSettingsDao.clear();
      })
      .then(() => {
        const defaultBaseUserSettings = UserSettings.getDefaultsByBuildTarget(environment.buildTarget);

        if (oldUserZones) {
          defaultBaseUserSettings.zones = oldUserZones;
        }

        return this.userSettingsDao.insert(defaultBaseUserSettings);
      });
  }

  public resetZonesSettings(): Promise<BaseUserSettings> {
    return this.fetch().then(userSettings => {
      // Replace with default zones
      userSettings.zones = this.userSettingsDao.getDefaultStorageValue().zones;

      // Update new user settings
      return this.updateUserSettings(userSettings);
    });
  }

  private updateUserSettings(userSettings: UserSettings.BaseUserSettings): Promise<BaseUserSettings> {
    return this.userSettingsDao.update(userSettings);
  }
}
