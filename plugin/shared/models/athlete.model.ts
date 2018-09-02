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

	/**
	 *
	 * @param otherAthleteModel {AthleteModel}
	 */
	public equals(otherAthleteModel: AthleteModel): boolean {

		const isSame = otherAthleteModel && (this.athleteSettings.maxHr !== otherAthleteModel.athleteSettings.maxHr
			|| this.athleteSettings.restHr !== otherAthleteModel.athleteSettings.restHr
			|| this.athleteSettings.cyclingFtp !== otherAthleteModel.athleteSettings.cyclingFtp
			|| this.athleteSettings.runningFtp !== otherAthleteModel.athleteSettings.runningFtp
			|| this.athleteSettings.lthr.default !== otherAthleteModel.athleteSettings.lthr.default
			|| this.athleteSettings.lthr.cycling !== otherAthleteModel.athleteSettings.lthr.cycling
			|| this.athleteSettings.lthr.running !== otherAthleteModel.athleteSettings.lthr.running
			|| this.athleteSettings.weight !== otherAthleteModel.athleteSettings.weight
			|| this.athleteSettings.swimFtp !== otherAthleteModel.athleteSettings.swimFtp
			|| this.gender !== otherAthleteModel.gender
		);
		return !isSame;
	}
}
