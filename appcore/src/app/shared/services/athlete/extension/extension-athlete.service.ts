import { Inject, Injectable } from "@angular/core";
import { AthleteDao } from "../../../dao/athlete/athlete.dao";
import { AthleteService } from "../athlete.service";
import { AthleteModel } from "@elevate/shared/models";
import { UserSettingsService } from "../../user-settings/user-settings.service";
import { ExtensionUserSettingsService } from "../../user-settings/extension/extension-user-settings.service";

@Injectable()
export class ExtensionAthleteService extends AthleteService {
  constructor(
    @Inject(AthleteDao) public readonly athleteModelDao: AthleteDao,
    @Inject(UserSettingsService) public readonly extensionUserSettingsService: ExtensionUserSettingsService
  ) {
    super(athleteModelDao);
  }

  public update(athleteModel: AthleteModel): Promise<AthleteModel> {
    return super.update(athleteModel).then(athleteModelUpdated => {
      return this.extensionUserSettingsService.clearLocalStorageOnNextLoad().then(() => {
        return Promise.resolve(athleteModelUpdated);
      });
    });
  }

  public insert(athleteModel: AthleteModel): Promise<AthleteModel> {
    return super.insert(athleteModel).then(athleteModelInserted => {
      return this.extensionUserSettingsService.clearLocalStorageOnNextLoad().then(() => {
        return Promise.resolve(athleteModelInserted);
      });
    });
  }

  public clear(): Promise<void> {
    return super.clear().then(() => {
      return this.extensionUserSettingsService.clearLocalStorageOnNextLoad();
    });
  }
}
