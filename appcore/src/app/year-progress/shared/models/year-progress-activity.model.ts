import { ElevateSport } from "@elevate/shared/enums/elevate-sport.enum";

export class YearProgressActivity {
  public dayOfYear: number;
  public year: number;
  public type: ElevateSport;
  public startTime: string;
  public trainer: boolean;
  public commute: boolean;
  public distance: number;
  public movingTime: number;
  public elevationGain: number;
}
