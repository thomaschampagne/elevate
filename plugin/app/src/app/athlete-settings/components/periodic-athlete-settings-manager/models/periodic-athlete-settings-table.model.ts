import { PeriodicAthleteSettingsModel } from "../../../../../../../shared/models/athlete-settings/periodic-athlete-settings.model";
import * as moment from "moment";

export class PeriodicAthleteSettingsTableModel extends PeriodicAthleteSettingsModel {

	public sinceAsDate: Date;
	public untilAsDate: Date;

	constructor(periodicAthleteSettingsModel: PeriodicAthleteSettingsModel, previousPeriodicAthleteSettingsModel: PeriodicAthleteSettingsModel) {
		super(
			periodicAthleteSettingsModel.since,
			periodicAthleteSettingsModel
		);

		this.sinceAsDate = (this.since) ? new Date(this.since) : null;
		this.untilAsDate = (previousPeriodicAthleteSettingsModel && previousPeriodicAthleteSettingsModel.since) ?
			moment(previousPeriodicAthleteSettingsModel.since, PeriodicAthleteSettingsModel.SINCE_DATE_FORMAT).subtract(1, "days").toDate() : null;
	}

	public isNow(): boolean {
		return (this.untilAsDate === null);
	}
}
