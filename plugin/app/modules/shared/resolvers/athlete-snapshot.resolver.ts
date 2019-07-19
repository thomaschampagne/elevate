import { AthleteModel, AthleteSettingsModel, AthleteSnapshotModel } from "../models/athlete";
import { DatedAthleteSettingsModel } from "../models/athlete/athlete-settings";
import * as _ from "lodash";

/**
 * Shared by core and app to resolve AthleteModel for a given activity date
 */
export class AthleteSnapshotResolver {

	constructor(athleteModel: AthleteModel) {

		this.athleteModel = (athleteModel) ? athleteModel : AthleteModel.DEFAULT_MODEL;

		this.athleteModel.datedAthleteSettings = _.sortBy(this.athleteModel.datedAthleteSettings, (model: DatedAthleteSettingsModel) => {
			const sortOnDate: Date = (_.isNull(model.since)) ? new Date(0) : new Date(model.since);
			return sortOnDate.getTime() * -1;
		});
	}

	public athleteModel: AthleteModel;

	public static getShortDateString(onDate: string | Date): string {

		let onDateString: string;

		if (onDate instanceof Date) {
			const isValidDate = !isNaN(onDate.getTime());
			if (!isValidDate) {
				return null;
			}
			onDateString = onDate.getFullYear() + "-" + (onDate.getMonth() + 1).toString().padStart(2, "0") + "-"
				+ onDate.getDate().toString().padStart(2, "0");
		} else {
			if (_.isEmpty(onDate) || isNaN(new Date(onDate).getTime())) {
				return null;
			}
			onDateString = onDate;
		}

		return onDateString;
	}

	/**
	 * Resolve the proper AthleteModel and activity date
	 * @param onDate Date format YYYY-MM-DD or Date object
	 * @returns {AthleteModel}
	 */
	public resolve(onDate: string | Date): AthleteSnapshotModel {

		const onDateString: string = AthleteSnapshotResolver.getShortDateString(onDate);

		let datedAthleteSettingsModel: DatedAthleteSettingsModel;

		if (_.isNull(onDateString)) { // No compliant date given

			const foreverDatedAthleteSettings = _.last(this.athleteModel.datedAthleteSettings);
			datedAthleteSettingsModel = (foreverDatedAthleteSettings) ? foreverDatedAthleteSettings : DatedAthleteSettingsModel.DEFAULT_MODEL;
		} else {
			// Find the AthleteSnapshotModel for the given date
			datedAthleteSettingsModel = this.resolveDatedAthleteSettingsAtDate(onDateString);
		}

		return (datedAthleteSettingsModel) ? new AthleteSnapshotModel(this.athleteModel.gender,
			datedAthleteSettingsModel.toAthleteSettingsModel())
			: new AthleteSnapshotModel(this.athleteModel.gender, AthleteSettingsModel.DEFAULT_MODEL);
	}

	public getCurrent(): AthleteSnapshotModel {
		return this.resolve((new Date()));
	}

	public resolveDatedAthleteSettingsAtDate(onDate: string): DatedAthleteSettingsModel {

		const onDateTime: number = new Date(onDate).getTime();

		const datedAthleteSettingsModel: DatedAthleteSettingsModel = _.find(this.athleteModel.datedAthleteSettings,
			(datedAthleteSettings: DatedAthleteSettingsModel) => {
				const fromDate = (datedAthleteSettings.since) ? new Date(datedAthleteSettings.since) : new Date(0);
				return onDateTime >= fromDate.getTime();
			});

		return (datedAthleteSettingsModel) ? DatedAthleteSettingsModel.asInstance(datedAthleteSettingsModel) : null;
	}


}
