import { AnalysisDataModel } from "../activity-data";
import { AthleteSnapshotModel } from "../athlete";

export class SyncedActivityModel {
	public id: number;
	public name: string;
	public type: string;
	public display_type: string;
	public private: boolean;
	public bike_id: number;
	public start_time: string;
	public distance_raw: number;
	public short_unit: string;
	public moving_time_raw: number;
	public elapsed_time_raw: number;
	public hasPowerMeter: boolean;
	public trainer: boolean;
	public commute: boolean;
	public elevation_unit: string;
	public elevation_gain_raw: number;
	public calories: number;
	public extendedStats: AnalysisDataModel;
	public athleteSnapshot: AthleteSnapshotModel;
}
