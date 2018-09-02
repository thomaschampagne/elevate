import { PeriodicAthleteSettingsModel } from "../../../../../../../shared/models/athlete-settings/periodic-athlete-settings.model";
import * as moment from "moment";

export class PeriodicAthleteSettingsTableModel extends PeriodicAthleteSettingsModel {

	public fromAsDate: Date;
	public toAsDate: Date;

	constructor(periodicAthleteSettingsModel: PeriodicAthleteSettingsModel, previousPeriodicAthleteSettingsModel: PeriodicAthleteSettingsModel) {
		super(
			periodicAthleteSettingsModel.from,
			periodicAthleteSettingsModel
		);

		this.fromAsDate = (this.from) ? new Date(this.from) : null;
		this.toAsDate = (previousPeriodicAthleteSettingsModel && previousPeriodicAthleteSettingsModel.from) ?
			moment(previousPeriodicAthleteSettingsModel.from, PeriodicAthleteSettingsModel.FROM_DATE_FORMAT).subtract(1, "days").toDate() : null;
	}

	public isNow(): boolean {
		return (this.toAsDate === null);
	}
}
