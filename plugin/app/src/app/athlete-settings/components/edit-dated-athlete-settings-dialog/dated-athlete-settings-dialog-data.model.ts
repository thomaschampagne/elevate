import { DatedAthleteSettingsModel } from "@elevate/shared";
import { DatedAthleteSettingsAction } from "./dated-athlete-settings-action.enum";

export class DatedAthleteSettingsDialogData {
	public action: DatedAthleteSettingsAction;
	public datedAthleteSettingsModel: DatedAthleteSettingsModel;
}
