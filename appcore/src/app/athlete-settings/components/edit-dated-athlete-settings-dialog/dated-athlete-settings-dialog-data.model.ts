import { DatedAthleteSettingsAction } from "./dated-athlete-settings-action.enum";
import { DatedAthleteSettings } from "@elevate/shared/models/athlete/athlete-settings/dated-athlete-settings.model";

export class DatedAthleteSettingsDialogData {
  public action: DatedAthleteSettingsAction;
  public datedAthleteSettings: DatedAthleteSettings;
}
