import { Injectable } from "@angular/core";
import { ActivityDao } from "../../dao/activity/activity.dao";
import { SyncedActivityModel } from "../../../../../../shared/models/sync/synced-activity.model";
import * as _ from "lodash";
import { AthleteModelResolverService } from "../athlete-settings/athlete-model-resolver.service";
import { Subject } from "rxjs";

@Injectable()
export class ActivityService {

	public athleteSettingsConsistency: Subject<boolean>;

	constructor(public activityDao: ActivityDao,
				public athleteModelResolverService: AthleteModelResolverService) {
		this.athleteSettingsConsistency = new Subject<boolean>();
	}

	/**
	 *
	 * @returns {Promise<SyncedActivityModel[]>} stored SyncedActivityModels
	 */
	public fetch(): Promise<SyncedActivityModel[]> {
		return this.activityDao.fetch();
	}

	/**
	 *
	 * @param {SyncedActivityModel[]} syncedActivityModels
	 * @returns {Promise<SyncedActivityModel[]>} saved SyncedActivityModels
	 */
	public save(syncedActivityModels: SyncedActivityModel[]): Promise<SyncedActivityModel[]> {
		return this.activityDao.save(syncedActivityModels);
	}

	/**
	 *
	 * @returns {Promise<SyncedActivityModel[]>} cleared SyncedActivityModels
	 */
	public clear(): Promise<SyncedActivityModel[]> {
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

		return this.athleteModelResolverService.update().then(() => {
			return this.activityDao.fetch();
		}).then((syncedActivityModels: SyncedActivityModel[]) => {
			let isCompliant = true;
			_.forEachRight(syncedActivityModels, (syncedActivityModel: SyncedActivityModel) => {
				const athleteModelFound = this.athleteModelResolverService.resolve(new Date(syncedActivityModel.start_time));
				if (!athleteModelFound.equals(syncedActivityModel.athleteModel)) {
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

		console.debug("checking athlete settings consistency");
		this.isAthleteSettingsConsistent().then(isConsistent => {
			this.athleteSettingsConsistency.next(isConsistent);
			console.debug("Athlete settings consistent: " + isConsistent);
		}, error => this.athleteSettingsConsistency.error(error));

	}


	/**
	 * Provide local synced activity ids which are not compliant with current athlete settings
	 */
	public nonConsistentActivitiesWithAthleteSettings(): Promise<number[]> {

		return this.athleteModelResolverService.update().then(() => {
			return this.activityDao.fetch();
		}).then((syncedActivityModels: SyncedActivityModel[]) => {
			const nonConsistentIds = [];
			_.forEachRight(syncedActivityModels, (syncedActivityModel: SyncedActivityModel) => {
				const athleteModelFound = this.athleteModelResolverService.resolve(new Date(syncedActivityModel.start_time));
				if (!athleteModelFound.equals(syncedActivityModel.athleteModel)) {
					nonConsistentIds.push(syncedActivityModel.id);
				}
			});
			return Promise.resolve(nonConsistentIds);
		});

	}
}

