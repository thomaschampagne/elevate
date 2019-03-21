import { Injectable } from "@angular/core";
import { ActivityDao } from "../../dao/activity/activity.dao";
import { SyncedActivityModel } from "@elevate/shared/models";
import * as _ from "lodash";
import { AthleteSnapshotResolverService } from "../athlete-snapshot-resolver/athlete-snapshot-resolver.service";
import { Subject } from "rxjs";
import { LoggerService } from "../logging/logger.service";

@Injectable()
export class ActivityService {

	public athleteSettingsConsistency: Subject<boolean>;

	constructor(public activityDao: ActivityDao,
				public athleteSnapshotResolverService: AthleteSnapshotResolverService,
				public logger: LoggerService) {
		this.athleteSettingsConsistency = new Subject<boolean>();
	}

	/**
	 *
	 * @returns {Promise<SyncedActivityModel[]>} stored SyncedActivityModels
	 */
	public fetch(): Promise<SyncedActivityModel[]> {
		return (<Promise<SyncedActivityModel[]>> this.activityDao.fetch()).then(activities => {
			return Promise.resolve(_.sortBy(activities, "start_time"));
		});
	}

	/**
	 *
	 * @param {SyncedActivityModel[]} syncedActivityModels
	 * @returns {Promise<SyncedActivityModel[]>} saved SyncedActivityModels
	 */
	public save(syncedActivityModels: SyncedActivityModel[]): Promise<SyncedActivityModel[]> {
		return (<Promise<SyncedActivityModel[]>> this.activityDao.save(syncedActivityModels));
	}

	public clear(): Promise<void> {
		return this.activityDao.clear();
	}

	/**
	 *
	 * @param {number[]} activitiesToDelete
	 * @returns {Promise<SyncedActivityModel[]>}
	 */
	public removeByIds(activitiesToDelete: number[]): Promise<SyncedActivityModel[]> {
		return this.activityDao.removeByIds(activitiesToDelete);
	}

	/**
	 * Tells if local synced activities is compliant with current athlete settings
	 * @returns {Promise<boolean>}
	 */
	public isAthleteSettingsConsistent(): Promise<boolean> {

		return this.athleteSnapshotResolverService.update().then(() => {
			return this.activityDao.fetch();
		}).then((syncedActivityModels: SyncedActivityModel[]) => {
			let isCompliant = true;
			_.forEachRight(syncedActivityModels, (syncedActivityModel: SyncedActivityModel) => {
				const athleteModelFound = this.athleteSnapshotResolverService.resolve(new Date(syncedActivityModel.start_time));
				if (!athleteModelFound.equals(syncedActivityModel.athleteSnapshot)) {
					isCompliant = false;
					return false;
				}
			});
			return Promise.resolve(isCompliant);
		});
	}

	/**
	 * Ask for athleteSettings consistency check and notify athleteSettingsConsistency subscribers of consistency
	 */
	public verifyConsistencyWithAthleteSettings(): void {

		this.logger.debug("checking athlete settings consistency");
		this.isAthleteSettingsConsistent().then(isConsistent => {
			this.athleteSettingsConsistency.next(isConsistent);
			this.logger.debug("Athlete settings consistent: " + isConsistent);
		}, error => this.athleteSettingsConsistency.error(error));

	}


	/**
	 * Provide local synced activity ids which are not compliant with current athlete settings
	 */
	public nonConsistentActivitiesWithAthleteSettings(): Promise<number[]> {

		return this.athleteSnapshotResolverService.update().then(() => {
			return this.activityDao.fetch();
		}).then((syncedActivityModels: SyncedActivityModel[]) => {
			const nonConsistentIds = [];
			_.forEachRight(syncedActivityModels, (syncedActivityModel: SyncedActivityModel) => {
				const athleteModelFound = this.athleteSnapshotResolverService.resolve(new Date(syncedActivityModel.start_time));
				if (!athleteModelFound.equals(syncedActivityModel.athleteSnapshot)) {
					nonConsistentIds.push(syncedActivityModel.id);
				}
			});
			return Promise.resolve(nonConsistentIds);
		});

	}
}

