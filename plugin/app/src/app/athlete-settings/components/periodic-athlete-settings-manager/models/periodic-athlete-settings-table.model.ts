import { PeriodicAthleteSettingsModel } from "../../../../../../../shared/models/athlete-settings/periodic-athlete-settings.model";
import * as moment from "moment";

export class PeriodicAthleteSettingsTableModel extends PeriodicAthleteSettingsModel {

	public fromAsDate: Date;
	public toAsDate: Date;

	constructor(periodicAthleteSettingsModel: PeriodicAthleteSettingsModel, previousPeriodicAthleteSettingsModel: PeriodicAthleteSettingsModel) {
		super(
			periodicAthleteSettingsModel.from,
			periodicAthleteSettingsModel.maxHr,
			periodicAthleteSettingsModel.restHr,
			periodicAthleteSettingsModel.lthr,
			periodicAthleteSettingsModel.cyclingFtp,
			periodicAthleteSettingsModel.runningFtp,
			periodicAthleteSettingsModel.swimFtp,
			periodicAthleteSettingsModel.weight
		);

		this.fromAsDate = (this.from) ? new Date(this.from) : null;
		this.toAsDate = (previousPeriodicAthleteSettingsModel && previousPeriodicAthleteSettingsModel.from) ?
			moment(previousPeriodicAthleteSettingsModel.from, PeriodicAthleteSettingsModel.FROM_DATE_FORMAT).subtract("days", 1).toDate() : null;
	}

	public isNow(): boolean {
		return (this.toAsDate === null);
	}
}
