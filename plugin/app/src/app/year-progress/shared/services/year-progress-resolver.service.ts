import { Injectable } from "@angular/core";
import { ActivatedRouteSnapshot, Resolve, RouterStateSnapshot } from "@angular/router";
import { UserSettingsService } from "../../../shared/services/user-settings/user-settings.service";
import { UserSettingsModel } from "../../../../../../common/scripts/models/UserSettings";
import { ActivityDao } from "../../../shared/dao/activity/activity.dao";
import * as _ from "lodash";
import { SyncedActivityModel } from "../../../../../../common/scripts/models/Sync";
import { RequiredYearProgressDataModel } from "../models/required-year-progress-data.model";
import { AthleteHistoryService } from "../../../shared/services/athlete-history/athlete-history.service";
import { AthleteHistoryState } from "../../../shared/services/athlete-history/athlete-history-state.enum";

@Injectable()
export class YearProgressResolverService implements Resolve<RequiredYearProgressDataModel> {

	constructor(public athleteHistoryService: AthleteHistoryService,
				public userSettingsService: UserSettingsService,
				public activityDao: ActivityDao) {
	}

	public resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<RequiredYearProgressDataModel> {

		return new Promise<RequiredYearProgressDataModel>((resolve) => {

			this.athleteHistoryService.getSyncState().then((athleteHistoryState: AthleteHistoryState) => {

				if (athleteHistoryState === AthleteHistoryState.SYNCED) {

					Promise.all([

						this.userSettingsService.fetch(),
						this.activityDao.fetch()

					]).then((results: Object[]) => {

						const userSettingsModel = _.first(results) as UserSettingsModel;
						const syncedActivityModels = _.last(results) as SyncedActivityModel[];
						const isMetric = (userSettingsModel.systemUnit === UserSettingsModel.SYSTEM_UNIT_METRIC_KEY);
						const requiredYearProgressDataModel = new RequiredYearProgressDataModel(isMetric, syncedActivityModels);
						resolve(requiredYearProgressDataModel);

					}, error => {
						console.error(error);
					});

				} else {
					console.warn("Stopping here! AthleteHistoryState is: " + AthleteHistoryState[athleteHistoryState].toString());
					resolve(null);
				}
			});
		});
	}
}
