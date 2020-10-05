import { Injectable } from "@angular/core";
import { BaseDao } from "../base.dao";
import { CollectionDef } from "../../data-store/collection-def";
import { environment } from "../../../../environments/environment";
import { UserSettings } from "@elevate/shared/models";
import UserSettingsModel = UserSettings.UserSettingsModel;

@Injectable()
export class UserSettingsDao extends BaseDao<UserSettingsModel> {

    public static readonly COLLECTION_DEF: CollectionDef<UserSettingsModel> = new CollectionDef("userSettings", null);

    public getCollectionDef(): CollectionDef<UserSettingsModel> {
        return UserSettingsDao.COLLECTION_DEF;
    }

    public getDefaultStorageValue(): UserSettingsModel {
        return UserSettings.getDefaultsByEnvTarget(environment.target);
    }
}
