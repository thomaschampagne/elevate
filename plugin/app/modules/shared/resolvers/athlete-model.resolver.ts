import { AthleteModel } from "../models/athlete";
import { DatedAthleteSettingsModel } from "../models/athlete/athlete-settings";
import { UserSettingsModel } from "../models/user-settings";
import * as _ from "lodash";

/**
 * Shared by core and app to resolve AthleteModel for a given activity date
 */
export class AthleteModelResolver {

	public userSettingsModel: UserSettingsModel;

	public datedAthleteSettingsModels: DatedAthleteSettingsModel[];

	constructor(userSettingsModel: UserSettingsModel, datedAthleteSettingsModels: DatedAthleteSettingsModel[]) {
		this.userSettingsModel = userSettingsModel;
		this.datedAthleteSettingsModels = _.sortBy(datedAthleteSettingsModels, (model: DatedAthleteSettingsModel) => {
			const sortOnDate: Date = (_.isNull(model.since)) ? new Date(0) : new Date(model.since);
			return sortOnDate.getTime() * -1;
		});
	}

	/**
	 * Resolve the proper AthleteModel along UserSettingsModel.hasDatedAthleteSettings and activity date
	 * @param onDate Date format YYYY-MM-DD or Date object
	 * @returns {AthleteModel}
	 */
	public resolve(onDate: string | Date): AthleteModel {

		let onDateString: string;

		if (onDate instanceof Date) {
			onDateString = onDate.getFullYear() + "-" + (onDate.getMonth() + 1).toString().padStart(2, "0") + "-" + onDate.getDate().toString().padStart(2, "0");
		} else {
			onDateString = onDate;
		}

		this.assertCompliantDate(onDateString);

		let athleteModel: AthleteModel;

		// Use gender set in synced user settings
		const gender = this.userSettingsModel.athleteModel.gender;

		const hasDatedAthleteSettings: boolean = this.userSettingsModel.hasDatedAthleteSettings;

		if (hasDatedAthleteSettings) {

			// Find the local AthleteModel for the given date
			const datedAthleteSettingsModel: DatedAthleteSettingsModel = this.resolveDatedAthleteSettingsAtDate(onDateString);

			// If datedAthleteSettingsModel found use it, instead use 'classic' AthleteSettingsModel
			athleteModel = (datedAthleteSettingsModel) ? new AthleteModel(gender, datedAthleteSettingsModel.toAthleteSettingsModel())
				: new AthleteModel(this.userSettingsModel.athleteModel.gender, this.userSettingsModel.athleteModel.athleteSettings);

		} else {
			athleteModel = new AthleteModel(this.userSettingsModel.athleteModel.gender, this.userSettingsModel.athleteModel.athleteSettings);
		}

		return athleteModel;
	}

	public getCurrent(): AthleteModel {
		return this.resolve((new Date()));
	}

	public resolveDatedAthleteSettingsAtDate(onDate: string): DatedAthleteSettingsModel {

		const onDateTime: number = new Date(onDate).getTime();

		const datedAthleteSettingsModel: DatedAthleteSettingsModel = _.find(this.datedAthleteSettingsModels, (datedAthleteSettings: DatedAthleteSettingsModel) => {
			const fromDate = (datedAthleteSettings.since) ? new Date(datedAthleteSettings.since) : new Date(0);
			return onDateTime >= fromDate.getTime();
		});

		return (datedAthleteSettingsModel) ? DatedAthleteSettingsModel.asInstance(datedAthleteSettingsModel) : null;
	}


	private assertCompliantDate(onDateString: string): void {

		const isDateWellFormatted = (/([0-9]{4})\-([0-9]{2})\-([0-9]{2})/gm).exec(onDateString);
		const onDate = new Date(onDateString);
		const isValidDate = !isNaN(onDate.getTime());

		if (!isDateWellFormatted || !isValidDate) {
			throw new Error("Invalid date or not formatted as 'YYYY-MM-DD'");
		}
	}
}
