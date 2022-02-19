import { ElevateSport } from "../../enums/elevate-sport.enum";

export class BareActivity {
  public id: number | string;
  public name: string;
  public type: ElevateSport;
  public startTime: string;
  public endTime: string;
  public startTimestamp: number;
  public endTimestamp: number;
  public hasPowerMeter: boolean;
  public trainer: boolean;
  public commute: boolean;
  public manual: boolean;
}
