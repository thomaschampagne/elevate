import { Gender } from "./gender.enum";
import { AthleteSettingsModel, DatedAthleteSettingsModel } from "./athlete-settings";
import { AbstractAthleteModel } from "./abstract-athlete.model";

export class AthleteModel extends AbstractAthleteModel {

	public static readonly DEFAULT_MODEL: AthleteModel = new AthleteModel(Gender.MEN, [DatedAthleteSettingsModel.DEFAULT_MODEL]);
	public gender: Gender;
	public datedAthleteSettings: DatedAthleteSettingsModel[];


	/**
	 *
	 * @param {Gender} gender
	 * @param {AthleteSettingsModel} datedAthleteSettings
	 */
	constructor(gender: Gender, datedAthleteSettings: DatedAthleteSettingsModel[]) {
		super();
		this.gender = gender;
		this.datedAthleteSettings = (!datedAthleteSettings || datedAthleteSettings.length === 0)
			? [DatedAthleteSettingsModel.DEFAULT_MODEL] : datedAthleteSettings;
	}

	/**
	 *
	 */
	public getCurrentSettings(): AthleteSettingsModel {
		const lastDatedAthleteSettingsModel = this.datedAthleteSettings[this.datedAthleteSettings.length - 1];
		return (lastDatedAthleteSettingsModel) ? lastDatedAthleteSettingsModel.toAthleteSettingsModel() : null;
	}
}
