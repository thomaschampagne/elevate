import { DatedAthleteSettingsModel } from "@elevate/shared/models";
import * as moment from "moment";

export class DatedAthleteSettingsTableModel extends DatedAthleteSettingsModel {

	public sinceAsDate: Date;
	public untilAsDate: Date;

	constructor(datedAthleteSettingsModel: DatedAthleteSettingsModel, previousDatedAthleteSettingsModel: DatedAthleteSettingsModel) {
		super(
			datedAthleteSettingsModel.since,
			datedAthleteSettingsModel
		);

		this.sinceAsDate = (this.since) ? moment(this.since).toDate() : null;
		this.untilAsDate = (previousDatedAthleteSettingsModel && previousDatedAthleteSettingsModel.since) ?
			moment(previousDatedAthleteSettingsModel.since, DatedAthleteSettingsModel.SINCE_DATE_FORMAT).subtract(1, "days").toDate() : null;
	}

	public isNow(): boolean {
		return (this.untilAsDate === null);
	}
}
