import { YearProgressTypeModel } from "./year-progress-type.model";
import { ProgressMode } from "../enums/progress-mode.enum";
import { ElevateSport } from "@elevate/shared/enums";

export class AddYearToDateProgressPresetDialogData {
  public readonly mode: ProgressMode = ProgressMode.YEAR_TO_DATE;
  public yearProgressTypeModel: YearProgressTypeModel;
  public activityTypes: ElevateSport[];
  public includeCommuteRide: boolean;
  public includeIndoorRide: boolean;
  public targetValue: number;

  constructor(
    yearProgressTypeModel: YearProgressTypeModel,
    activityTypes: ElevateSport[],
    includeCommuteRide: boolean,
    includeIndoorRide: boolean,
    targetValue: number
  ) {
    this.yearProgressTypeModel = yearProgressTypeModel;
    this.activityTypes = activityTypes;
    this.includeCommuteRide = includeCommuteRide;
    this.includeIndoorRide = includeIndoorRide;
    this.targetValue = targetValue ? targetValue : null;
  }
}
