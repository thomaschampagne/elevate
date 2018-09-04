import { DatedAthleteSettingsModel } from "../../../../../../shared/models/athlete-settings/dated-athlete-settings.model";
import { DatedAthleteSettingsAction } from "./dated-athlete-settings-action.enum";

export class DatedAthleteSettingsDialogData {
	public action: DatedAthleteSettingsAction;
	public datedAthleteSettingsModel?: DatedAthleteSettingsModel;
}
