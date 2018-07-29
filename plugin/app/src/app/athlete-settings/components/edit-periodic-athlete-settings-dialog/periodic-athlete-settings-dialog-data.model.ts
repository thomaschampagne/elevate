import { PeriodicAthleteSettingsModel } from "../../../../../../shared/models/athlete-settings/periodic-athlete-settings.model";
import { PeriodicAthleteSettingsAction } from "./periodic-athlete-settings-action.enum";

export class PeriodicAthleteSettingsDialogData {
	public action: PeriodicAthleteSettingsAction;
	public periodicAthleteSettingsModel?: PeriodicAthleteSettingsModel;
}
