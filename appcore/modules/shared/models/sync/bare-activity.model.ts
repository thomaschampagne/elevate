// tslint:disable:variable-name
import { ElevateSport } from "../../enums";

export class BareActivityModel {
  public id: number | string;
  public name: string;
  public type: ElevateSport;
  public display_type: string;
  public start_time: string;
  public end_time: string;
  public distance_raw: number;
  public moving_time_raw: number;
  public elapsed_time_raw: number;
  public hasPowerMeter: boolean;
  public trainer: boolean;
  public commute: boolean;
  public elevation_gain_raw: number;
  public calories: number;
}
