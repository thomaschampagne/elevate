import { Injectable } from "@angular/core";
import { BaseDao } from "../base.dao";
import { CollectionDef } from "../../data-store/collection-def";
import { environment } from "../../../../environments/environment";
import { UserSettings } from "@elevate/shared/models/user-settings/user-settings.namespace";
import BaseUserSettings = UserSettings.BaseUserSettings;

@Injectable()
export class UserSettingsDao extends BaseDao<BaseUserSettings> {
  public static readonly COLLECTION_DEF: CollectionDef<BaseUserSettings> = new CollectionDef("userSettings", null);

  public getCollectionDef(): CollectionDef<BaseUserSettings> {
    return UserSettingsDao.COLLECTION_DEF;
  }

  public getDefaultStorageValue(): BaseUserSettings {
    return UserSettings.getDefaultsByBuildTarget(environment.buildTarget);
  }
}
