import { Injectable } from "@angular/core";
import { UserSettings, UserZonesModel, ZoneModel } from "@elevate/shared/models";
import { UserSettingsDao } from "../../dao/user-settings/user-settings.dao";
import { ZoneDefinitionModel } from "../../models/zone-definition.model";
import { LoggerService } from "../logging/logger.service";
import { environment } from "../../../../environments/environment";
import UserSettingsModel = UserSettings.UserSettingsModel;

@Injectable()
export class UserSettingsService {

    public static readonly MARK_LOCAL_STORAGE_CLEAR: string = "localStorageMustBeCleared";

    constructor(public userSettingsDao: UserSettingsDao,
                public logger: LoggerService) {
    }

    public fetch(): Promise<UserSettingsModel> {
        return (<Promise<UserSettingsModel>> this.userSettingsDao.fetch());
    }

    public saveProperty<V>(path: string | string[], value: V): Promise<UserSettingsModel> {
        return this.userSettingsDao.putAt<V>(path, value);
    }

    /**
     * Clear local storage on next reload
     */
    public clearLocalStorageOnNextLoad(): Promise<void> {
        return this.saveProperty(UserSettingsService.MARK_LOCAL_STORAGE_CLEAR, true).then(() => {
            this.logger.info("LocalStorage is marked to be cleared on next core load");
            return Promise.resolve();
        });
    }

    public saveZones(zoneDefinition: ZoneDefinitionModel, zones: ZoneModel[]): Promise<ZoneModel[]> {
        const path = ["zones", zoneDefinition.value];
        return this.saveProperty<number[]>(path, UserZonesModel.serialize(zones)).then((userSettingsModel: UserSettingsModel) => {
            return Promise.resolve(UserZonesModel.deserialize(userSettingsModel.zones[zoneDefinition.value]));
        });
    }

    public reset(): Promise<UserSettingsModel> {
        return (<Promise<UserSettingsModel>> this.userSettingsDao.save(UserSettings.getDefaultsByEnvTarget(environment.target)));
    }

    public resetZones(): Promise<UserSettingsModel> {
        const defaultZones = (<UserSettingsModel> this.userSettingsDao.getDefaultStorageValue()).zones;
        return this.saveProperty<UserZonesModel>(["zones"], defaultZones);
    }
}
