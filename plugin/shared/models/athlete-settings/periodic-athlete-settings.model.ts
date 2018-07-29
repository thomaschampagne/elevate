import { AthleteSettingsModel } from "./athlete-settings.model";
import { UserLactateThresholdModel } from "../user-settings/user-lactate-threshold.model";

export class PeriodicAthleteSettingsModel extends AthleteSettingsModel {

	public static readonly DEFAULT_FROM: string = new Date().toISOString();

	public static readonly FROM_DATE_FORMAT: string = "YYYY-MM-DD";

	public static readonly DEFAULT_MODEL: PeriodicAthleteSettingsModel = new PeriodicAthleteSettingsModel(
		PeriodicAthleteSettingsModel.DEFAULT_FROM,
		AthleteSettingsModel.DEFAULT_MAX_HR,
		AthleteSettingsModel.DEFAULT_REST_HR,
		UserLactateThresholdModel.DEFAULT_MODEL,
		AthleteSettingsModel.DEFAULT_CYCLING_FTP,
		AthleteSettingsModel.DEFAULT_RUNNING_FTP,
		AthleteSettingsModel.DEFAULT_SWIM_FTP,
		AthleteSettingsModel.DEFAULT_WEIGHT
	);

	/**
	 * Start period date. A null value means from "forever"
	 */
	public from: string = null;

	/**
	 *
	 * @param {string} from Date format YYYY-MM-DD
	 * @param {number} maxHr
	 * @param {number} restHr
	 * @param {UserLactateThresholdModel} lthr
	 * @param {number} cyclingFtp
	 * @param {number} runningFtp
	 * @param {number} swimFtp
	 * @param {number} weight
	 */
	constructor(from: string, maxHr: number, restHr: number, lthr: UserLactateThresholdModel, cyclingFtp: number, // TODO Simplify constructor with AthleteSettingsModel param
				runningFtp: number, swimFtp: number, weight: number) {
		super(maxHr, restHr, lthr, cyclingFtp, runningFtp, swimFtp, weight);
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
