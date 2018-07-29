import { Gender } from "../../app/src/app/shared/enums/gender.enum";
import { AthleteSettingsModel } from "./athlete-settings/athlete-settings.model";

export class AthleteModel {

	public static readonly DEFAULT_MODEL: AthleteModel = new AthleteModel(Gender.MEN, AthleteSettingsModel.DEFAULT_MODEL);

	public gender: Gender;
	public athleteSettings: AthleteSettingsModel;

	/**
	 *
	 * @param {Gender} gender
	 * @param {AthleteSettingsModel} athleteSettings
	 */
	constructor(gender: Gender, athleteSettings: AthleteSettingsModel) {
		this.gender = gender;
		this.athleteSettings = athleteSettings;
	}

}
