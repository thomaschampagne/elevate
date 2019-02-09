import { ProgressMode } from "../enums/progress-mode.enum";
import { StandardProgressConfigModel } from "./standard-progress-config.model";

export class RollingProgressConfigModel extends StandardProgressConfigModel {

	public readonly mode = ProgressMode.ROLLING_CUMULATIVE; // Overrides mode

	public readonly rollingDays: number;

	constructor(typesFilter: string[], yearsFilter: number[], isMetric: boolean, includeCommuteRide: boolean,
				includeIndoorRide: boolean, rollingDays: number) {
		super(typesFilter, yearsFilter, isMetric, includeCommuteRide, includeIndoorRide);
		this.rollingDays = rollingDays;
	}
}
