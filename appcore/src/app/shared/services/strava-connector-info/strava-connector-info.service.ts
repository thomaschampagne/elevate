import { Injectable } from "@angular/core";
import { StravaConnectorInfoDao } from "../../dao/strava-connector-info/strava-connector-info.dao";
import { StravaConnectorInfo } from "@elevate/shared/sync";

@Injectable()
export class StravaConnectorInfoService {

	constructor(public stravaConnectorInfoDao: StravaConnectorInfoDao) {
	}

	public fetch(): Promise<StravaConnectorInfo> {
		return <Promise<StravaConnectorInfo>> this.stravaConnectorInfoDao.fetch();
	}

	public save(stravaConnectorInfo: StravaConnectorInfo): Promise<StravaConnectorInfo> {
		return <Promise<StravaConnectorInfo>> this.stravaConnectorInfoDao.save(stravaConnectorInfo);
	}
}
