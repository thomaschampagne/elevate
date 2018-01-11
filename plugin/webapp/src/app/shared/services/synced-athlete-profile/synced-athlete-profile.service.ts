import { Injectable } from '@angular/core';
import { SyncedAthleteProfileDao } from "../../dao/synced-athlete-profile/synced-athlete-profile.dao";
import { AthleteProfileModel } from "../../../../../../common/scripts/models/AthleteProfile";

@Injectable()
export class SyncedAthleteProfileService {

	constructor(public syncedAthleteProfileDao: SyncedAthleteProfileDao) {
	}

	public getProfile(): Promise<AthleteProfileModel> {
		return this.syncedAthleteProfileDao.getProfile();
	}

	public getLastSyncDateTime(): Promise<number> {
		return this.syncedAthleteProfileDao.getLastSyncDateTime();
	}
}
