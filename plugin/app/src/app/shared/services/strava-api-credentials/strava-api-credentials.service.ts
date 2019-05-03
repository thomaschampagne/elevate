import { Injectable } from "@angular/core";
import { StravaApiCredentialsDao } from "../../dao/strava-api-credentials/strava-api-credentials.dao";
import { StravaApiCredentials } from "@elevate/shared/sync/connectors/strava/strava-api-credentials";

@Injectable({
	providedIn: "root"
})
export class StravaApiCredentialsService {

	constructor(public stravaApiCredentialsDao: StravaApiCredentialsDao) {
	}

	public fetch(): Promise<StravaApiCredentials> {
		return <Promise<StravaApiCredentials>> this.stravaApiCredentialsDao.fetch();
	}

	public save(stravaApiCredentials: StravaApiCredentials): Promise<StravaApiCredentials> {
		return <Promise<StravaApiCredentials>> this.stravaApiCredentialsDao.save(stravaApiCredentials);
	}
}
