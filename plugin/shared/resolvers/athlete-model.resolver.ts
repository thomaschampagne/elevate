import { AthleteModel } from "../models/athlete.model";
import { PeriodicAthleteSettingsModel } from "../models/athlete-settings/periodic-athlete-settings.model";
import { UserSettingsModel } from "../models/user-settings/user-settings.model";
import * as _ from "lodash";

/**
 * Shared by core and app to resolve AthleteModel for a given activity date
 */
export class AthleteModelResolver {

	public userSettingsModel: UserSettingsModel;

	public periodicAthleteSettingsModels: PeriodicAthleteSettingsModel[];

	constructor(userSettingsModel: UserSettingsModel, periodicAthleteSettingsModels: PeriodicAthleteSettingsModel[]) {
		this.userSettingsModel = userSettingsModel;
		this.periodicAthleteSettingsModels = _.sortBy(periodicAthleteSettingsModels, (model: PeriodicAthleteSettingsModel) => {
			const sortOnDate: Date = (_.isNull(model.from)) ? new Date(0) : new Date(model.from);
			return sortOnDate.getTime() * -1;
		});
	}

	/**
	 * Resolve the proper AthleteModel along UserSettingsModel.hasPeriodicAthleteSettings and activity date
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

		const hasPeriodicAthleteSettings: boolean = this.userSettingsModel.hasPeriodicAthleteSettings;

		if (hasPeriodicAthleteSettings) {

			// Find the local AthleteModel for the given date
			const periodicAthleteSettingsModel: PeriodicAthleteSettingsModel = this.resolvePeriodicAthleteSettingsAtDate(onDateString);

			// If periodicAthleteSettingsModel found use it, instead use 'classic' AthleteSettingsModel
			athleteModel = (periodicAthleteSettingsModel) ? new AthleteModel(gender, periodicAthleteSettingsModel.toAthleteSettingsModel())
				: new AthleteModel(this.userSettingsModel.athleteModel.gender, this.userSettingsModel.athleteModel.athleteSettings);

		} else {
			athleteModel = new AthleteModel(this.userSettingsModel.athleteModel.gender, this.userSettingsModel.athleteModel.athleteSettings);
		}

		return athleteModel;
	}

	public getCurrent(): AthleteModel {
		return this.resolve((new Date()));
	}

	public resolvePeriodicAthleteSettingsAtDate(onDate: string): PeriodicAthleteSettingsModel {

		const onDateTime: number = new Date(onDate).getTime();

		const periodicAthleteSettingsModel: PeriodicAthleteSettingsModel = _.find(this.periodicAthleteSettingsModels, (periodicAthleteSettings: PeriodicAthleteSettingsModel) => {
			const fromDate = (periodicAthleteSettings.from) ? new Date(periodicAthleteSettings.from) : new Date(0);
			return onDateTime >= fromDate.getTime();
		});

		return (periodicAthleteSettingsModel) ? PeriodicAthleteSettingsModel.asInstance(periodicAthleteSettingsModel) : null;
	}


	private assertCompliantDate(onDateString: string): void {

		const isDateWellFormatted = (/([0-9]{4})\-([0-9]{2})\-([0-9]{2})/gm).exec(onDateString);
		const onDate = new Date(onDateString);
		const isValidDate = (onDate instanceof Date && !isNaN(onDate.getTime()));

		if (!isDateWellFormatted || !isValidDate) {
			throw new Error("Invalid date or not formatted as 'YYYY-MM-DD'");
		}
	}
}
