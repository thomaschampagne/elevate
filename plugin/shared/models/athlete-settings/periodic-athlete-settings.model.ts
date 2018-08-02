import { AthleteSettingsModel } from "./athlete-settings.model";

export class PeriodicAthleteSettingsModel extends AthleteSettingsModel {

	public static readonly DEFAULT_FROM: string = (new Date()).toISOString().split('T')[0];

	public static readonly FROM_DATE_FORMAT: string = "YYYY-MM-DD";

	public static readonly DEFAULT_MODEL: PeriodicAthleteSettingsModel = new PeriodicAthleteSettingsModel(
		PeriodicAthleteSettingsModel.DEFAULT_FROM,
		AthleteSettingsModel.DEFAULT_MODEL
	);

	/**
	 * Start period date. A null value means from "forever"
	 */
	public from: string = null;

	/**
	 *
	 * @param {string} from Date format YYYY-MM-DD
	 * @param {AthleteSettingsModel} athleteSettingsModel
	 */
	constructor(from: string, athleteSettingsModel: AthleteSettingsModel) {
		super(athleteSettingsModel.maxHr, athleteSettingsModel.restHr, athleteSettingsModel.lthr,
			athleteSettingsModel.cyclingFtp, athleteSettingsModel.runningFtp, athleteSettingsModel.swimFtp, athleteSettingsModel.weight);
		this.from = from;
	}

	public toAthleteSettingsModel(): AthleteSettingsModel {
		return new AthleteSettingsModel(
			this.maxHr,
			this.restHr,
			this.lthr,
			this.cyclingFtp,
			this.runningFtp,
			this.swimFtp,
			this.weight
		);
	}

	public isForever(): boolean {
		return (this.from === null);
	}

}
