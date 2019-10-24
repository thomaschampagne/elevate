import { AthleteSettingsModel } from "./athlete-settings.model";

export class DatedAthleteSettingsModel extends AthleteSettingsModel {

	/**
	 *
	 * @param {string} since Date format YYYY-MM-DD
	 * @param {AthleteSettingsModel} athleteSettingsModel
	 */
	constructor(since: string, athleteSettingsModel: AthleteSettingsModel) {
		super(athleteSettingsModel.maxHr, athleteSettingsModel.restHr, athleteSettingsModel.lthr,
			athleteSettingsModel.cyclingFtp, athleteSettingsModel.runningFtp, athleteSettingsModel.swimFtp, athleteSettingsModel.weight);
		this.since = since;
	}

	public static readonly DEFAULT_SINCE: string = (new Date()).getFullYear() + "-"
		+ ((new Date()).getMonth() + 1).toString().padStart(2, "0") + "-"
		+ (new Date()).getDate().toString().padStart(2, "0");

	public static readonly SINCE_DATE_FORMAT: string = "YYYY-MM-DD";

	public static readonly DEFAULT_MODEL: DatedAthleteSettingsModel = new DatedAthleteSettingsModel(
		DatedAthleteSettingsModel.DEFAULT_SINCE,
		AthleteSettingsModel.DEFAULT_MODEL
	);

	/**
	 * Start period date. A null value means since "forever"
	 */
	public since: string = null;

	public static asInstance(datedAthleteSettingsModel: DatedAthleteSettingsModel): DatedAthleteSettingsModel {
		return new DatedAthleteSettingsModel(datedAthleteSettingsModel.since,
			new AthleteSettingsModel(
				datedAthleteSettingsModel.maxHr,
				datedAthleteSettingsModel.restHr,
				datedAthleteSettingsModel.lthr,
				datedAthleteSettingsModel.cyclingFtp,
				datedAthleteSettingsModel.runningFtp,
				datedAthleteSettingsModel.swimFtp,
				datedAthleteSettingsModel.weight
			));
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
		return (this.since === null);
	}

}
