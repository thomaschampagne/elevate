import { Gender } from "../../../shared/enums/gender.enum";
import { UserSettingsModel } from "../../../../../../common/scripts/models/UserSettings";

export class FitnessUserSettingsModel {

	public static createFrom(userSettingsModel: UserSettingsModel): FitnessUserSettingsModel {
		return new FitnessUserSettingsModel((userSettingsModel.userGender === Gender.MEN) ? Gender.MEN : Gender.WOMEN,
			userSettingsModel.userMaxHr,
			userSettingsModel.userRestHr,
			userSettingsModel.userLTHR,
			userSettingsModel.userFTP,
			userSettingsModel.userSwimFTP);
	}

	public userGender: Gender;
	public userMaxHr: number;
	public userRestHr: number;
	public userLactateThreshold: number;
	public cyclingFtp: number;
	public swimFtp: number;

	constructor(userGender: Gender, userMaxHr: number, userRestHr: number, userLactateThreshold: number, cyclingFtp: number, swimFtp: number) {
		this.userGender = userGender;
		this.userMaxHr = userMaxHr;
		this.userRestHr = userRestHr;
		this.userLactateThreshold = userLactateThreshold;
		this.cyclingFtp = cyclingFtp;
		this.swimFtp = swimFtp;
	}
}
