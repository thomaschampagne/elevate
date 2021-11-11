import { Inject, Injectable } from "@angular/core";
import { UserSettingsService } from "../user-settings.service";
import { UserSettingsDao } from "../../../dao/user-settings/user-settings.dao";
import { LoggerService } from "../../logging/logger.service";
import { ZoneDefinitionModel } from "../../../models/zone-definition.model";
import { UserSettings } from "@elevate/shared/models/user-settings/user-settings.namespace";
import { ZoneModel } from "@elevate/shared/models/zone.model";
import ExtensionUserSettings = UserSettings.ExtensionUserSettings;

@Injectable()
export class ExtensionUserSettingsService extends UserSettingsService {
  constructor(
    @Inject(UserSettingsDao) public readonly userSettingsDao: UserSettingsDao,
    @Inject(LoggerService) public readonly logger: LoggerService
  ) {
    super(userSettingsDao, logger);
  }

  public updateZones(zoneDefinition: ZoneDefinitionModel, zones: ZoneModel[]): Promise<ZoneModel[]> {
    return super.updateZones(zoneDefinition, zones).then(updatedZones => {
      return this.clearLocalStorageOnNextLoad().then(() => {
        return Promise.resolve(updatedZones);
      });
    });
  }

  /**
   * Clear local storage on next reload
   */
  public clearLocalStorageOnNextLoad(): Promise<void> {
    return this.updateOption<ExtensionUserSettings>("localStorageMustBeCleared", true).then(() => Promise.resolve());
  }
}
