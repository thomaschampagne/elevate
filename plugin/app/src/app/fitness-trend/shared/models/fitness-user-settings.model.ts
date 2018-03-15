import { Gender } from "../../../shared/enums/gender.enum";

export class FitnessUserSettingsModel {
	public userGender: Gender;
	public userMaxHr: number;
	public userMinHr: number;
	public userLactateThreshold: number;
	public cyclingFtp: number;
	public swimFtp: number;
}
