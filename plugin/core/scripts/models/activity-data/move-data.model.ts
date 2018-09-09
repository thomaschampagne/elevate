import { SpeedDataModel } from "./speed-data.model";
import { PaceDataModel } from "./pace-data.model";

export class MoveDataModel {
	public movingTime: number;
	public elapsedTime: number;
	public speed: SpeedDataModel;
	public pace: PaceDataModel;
}
