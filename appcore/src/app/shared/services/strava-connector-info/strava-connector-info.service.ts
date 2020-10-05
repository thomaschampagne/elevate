import { Injectable } from "@angular/core";
import { StravaConnectorInfoDao } from "../../dao/strava-connector-info/strava-connector-info.dao";
import { StravaConnectorInfo } from "@elevate/shared/sync";

@Injectable()
export class StravaConnectorInfoService {

    constructor(public stravaConnectorInfoDao: StravaConnectorInfoDao) {
    }

    public fetch(): Promise<StravaConnectorInfo> {
        return this.stravaConnectorInfoDao.findOne();
    }

    public update(stravaConnectorInfo: StravaConnectorInfo): Promise<StravaConnectorInfo> {
        return this.stravaConnectorInfoDao.update(stravaConnectorInfo, true);
    }
}
