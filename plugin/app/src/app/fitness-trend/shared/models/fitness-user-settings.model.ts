import { Gender } from "../../../shared/enums/gender.enum";
import { UserSettingsModel } from "../../../../../../shared/models/user-settings/user-settings.model";
import { UserLactateThresholdModel } from "../../../../../../shared/models/user-settings/user-lactate-threshold.model";

export class FitnessUserSettingsModel {

	public static createFrom(userSettingsModel: UserSettingsModel): FitnessUserSettingsModel {
		return new FitnessUserSettingsModel((userSettingsModel.userGender === Gender.MEN) ? Gender.MEN : Gender.WOMEN,
			userSettingsModel.userMaxHr,
			userSettingsModel.userRestHr,
			{
				default: userSettingsModel.userLTHR.default,
				cycling: userSettingsModel.userLTHR.cycling,
				running: userSettingsModel.userLTHR.running
			},
			userSettingsModel.userFTP,
			userSettingsModel.userRunningFTP,
			userSettingsModel.userSwimFTP);
	}

	public userGender: Gender;
	public userMaxHr: number;
	public userRestHr: number;
	public userLactateThreshold: UserLactateThresholdModel;
	public cyclingFtp: number;
	public runningFtp: number;
	public swimFtp: number;

	constructor(userGender: Gender, userMaxHr: number, userRestHr: number, userLactateThreshold: UserLactateThresholdModel,
				cyclingFtp: number, runningFtp: number, swimFtp: number) {
		this.userGender = userGender;
		this.userMaxHr = userMaxHr;
		this.userRestHr = userRestHr;
		this.userLactateThreshold = userLactateThreshold;
		this.cyclingFtp = cyclingFtp;
		this.runningFtp = runningFtp;
		this.swimFtp = swimFtp;
	}
}
