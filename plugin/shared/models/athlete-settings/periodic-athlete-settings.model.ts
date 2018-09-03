import {AthleteSettingsModel} from "./athlete-settings.model";

export class PeriodicAthleteSettingsModel extends AthleteSettingsModel {

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

	public static readonly DEFAULT_MODEL: PeriodicAthleteSettingsModel = new PeriodicAthleteSettingsModel(
		PeriodicAthleteSettingsModel.DEFAULT_SINCE,
		AthleteSettingsModel.DEFAULT_MODEL
	);

	/**
	 * Start period date. A null value means since "forever"
	 */
	public since: string = null;

	public static asInstance(periodicAthleteSettingsModel: PeriodicAthleteSettingsModel): PeriodicAthleteSettingsModel {
		return new PeriodicAthleteSettingsModel(periodicAthleteSettingsModel.since,
			new AthleteSettingsModel(
				periodicAthleteSettingsModel.maxHr,
				periodicAthleteSettingsModel.restHr,
				periodicAthleteSettingsModel.lthr,
				periodicAthleteSettingsModel.cyclingFtp,
				periodicAthleteSettingsModel.runningFtp,
				periodicAthleteSettingsModel.swimFtp,
				periodicAthleteSettingsModel.weight
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
