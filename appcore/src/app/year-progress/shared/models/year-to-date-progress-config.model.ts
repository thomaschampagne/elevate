import { ProgressMode } from "../enums/progress-mode.enum";
import { ProgressConfig } from "../interfaces/progress-config";
import { ElevateSport } from "@elevate/shared/enums/elevate-sport.enum";

export class YearToDateProgressConfigModel implements ProgressConfig {
  public readonly mode: ProgressMode = ProgressMode.YEAR_TO_DATE;
  public activityTypes: ElevateSport[];
  public includeCommuteRide: boolean;
  public includeIndoorRide: boolean;

  constructor(activityTypes: ElevateSport[], includeCommuteRide: boolean, includeIndoorRide: boolean) {
    this.activityTypes = activityTypes;
    this.includeCommuteRide = includeCommuteRide;
    this.includeIndoorRide = includeIndoorRide;
  }

  public static instanceFrom(progressConfig: ProgressConfig): YearToDateProgressConfigModel {
    if (progressConfig.mode !== ProgressMode.YEAR_TO_DATE) {
      throw new Error("progressConfig.mode !== ProgressMode.YEAR_TO_DATE");
    }

    return new YearToDateProgressConfigModel(
      progressConfig.activityTypes,
      progressConfig.includeCommuteRide,
      progressConfig.includeIndoorRide
    );
  }
}
