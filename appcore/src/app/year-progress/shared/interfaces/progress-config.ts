import { ProgressMode } from "../enums/progress-mode.enum";
import { ElevateSport } from "@elevate/shared/enums/elevate-sport.enum";

export interface ProgressConfig {
  mode: ProgressMode;
  activityTypes: ElevateSport[];
  includeCommuteRide: boolean;
  includeIndoorRide: boolean;
}
