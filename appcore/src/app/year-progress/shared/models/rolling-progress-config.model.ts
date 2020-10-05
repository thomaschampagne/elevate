import { ProgressMode } from "../enums/progress-mode.enum";
import { YearToDateProgressConfigModel } from "./year-to-date-progress-config.model";
import { ProgressConfig } from "../interfaces/progress-config";
import { ElevateSport } from "@elevate/shared/enums";

export class RollingProgressConfigModel extends YearToDateProgressConfigModel {
    public readonly mode = ProgressMode.ROLLING; // Overrides mode
    public readonly rollingDays: number;

    constructor(
        typesFilter: ElevateSport[],
        includeCommuteRide: boolean,
        includeIndoorRide: boolean,
        rollingDays: number
    ) {
        super(typesFilter, includeCommuteRide, includeIndoorRide);
        this.rollingDays = rollingDays;
    }

    public static instanceFrom(progressConfig: ProgressConfig): RollingProgressConfigModel {
        if (progressConfig.mode !== ProgressMode.ROLLING) {
            throw new Error("progressConfig.mode !== ProgressMode.ROLLING");
        }

        return new RollingProgressConfigModel(
            progressConfig.activityTypes,
            progressConfig.includeCommuteRide,
            progressConfig.includeIndoorRide,
            (progressConfig as RollingProgressConfigModel).rollingDays
        );
    }
}
