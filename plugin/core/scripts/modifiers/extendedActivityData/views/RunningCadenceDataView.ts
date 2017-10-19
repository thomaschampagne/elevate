import * as _ from "lodash";
import {ICadenceData} from "../../../../../common/scripts/interfaces/IActivityData";
import {IUserSettings} from "../../../../../common/scripts/interfaces/IUserSettings";
import {AbstractCadenceDataView} from "./AbstractCadenceDataView";

export class RunningCadenceDataView extends AbstractCadenceDataView {

    protected userSettings: IUserSettings;

    constructor(cadenceData: ICadenceData, units: string, userSettings: IUserSettings) {

        if (userSettings.enableBothLegsCadence) {

            // Create a deep clone in memory to avoid values doubled on each reload
            const cadenceDataClone: ICadenceData = _.cloneDeep(cadenceData);

            // Then multiply cadence per 2
            cadenceDataClone.averageCadenceMoving *= 2;
            cadenceDataClone.lowerQuartileCadence *= 2;
            cadenceDataClone.medianCadence *= 2;
            cadenceDataClone.upperQuartileCadence *= 2;

            if (cadenceDataClone.upFlatDownCadencePaceData) {
                cadenceDataClone.upFlatDownCadencePaceData.up *= 2;
                cadenceDataClone.upFlatDownCadencePaceData.flat *= 2;
                cadenceDataClone.upFlatDownCadencePaceData.down *= 2;
            }

            for (const zone in cadenceDataClone.cadenceZones) {
                cadenceDataClone.cadenceZones[zone].from *= 2;
                cadenceDataClone.cadenceZones[zone].to *= 2;
            }
            super(cadenceDataClone, units);

        } else {
            super(cadenceData, units);
        }

        this.userSettings = userSettings;

        this.setGraphTitleFromUnits();
    }

    public render(): void {

        // Add legs cadence type to view title
        this.content += this.generateSectionTitle("<img src=\"" + this.appResources.circleNotchIcon + "\" style=\"vertical-align: baseline; height:20px;\"/> CADENCE @ " + ((this.userSettings.enableBothLegsCadence) ? "2 legs" : "1 leg") + " <a target=\"_blank\" href=\"" + this.appResources.settingsLink + "#!/zonesSettings/runningCadence\" style=\"float: right;margin-right: 10px;\"><img src=\"" + this.appResources.cogIcon + "\" style=\"vertical-align: baseline; height:20px;\"/></a>");
        super.render();
    }

    protected insertDataIntoGrid(): void {

        super.insertDataIntoGrid();

        this.insertContentAtGridPosition(0, 0, this.cadenceData.averageCadenceMoving.toFixed(1), "Avg Cadence", this.units, "displayCadenceData");
        this.insertContentAtGridPosition(1, 0, this.cadenceData.averageDistancePerOccurrence.toFixed(2), "Avg Stride length", "M", "displayCadenceData");
        this.insertContentAtGridPosition(2, 0, this.cadenceData.totalOccurrences.toFixed(0), "Total steps", "", "displayCadenceData");

        if (this.cadenceData.upFlatDownCadencePaceData) {
            this.insertContentAtGridPosition(0, 1, this.cadenceData.upFlatDownCadencePaceData.up.toFixed(0), "Climbing avg cadence", this.units, "displayCadenceData");
            this.insertContentAtGridPosition(1, 1, this.cadenceData.upFlatDownCadencePaceData.flat.toFixed(0), "Flat avg cadence", this.units, "displayCadenceData");
            this.insertContentAtGridPosition(2, 1, this.cadenceData.upFlatDownCadencePaceData.down.toFixed(0), "Downhill avg cadence", this.units, "displayCadenceData");
        }

        this.insertContentAtGridPosition(0, 2, this.cadenceData.lowerQuartileCadence, "25% Cadence", this.units, "displayCadenceData");
        this.insertContentAtGridPosition(1, 2, this.cadenceData.medianCadence, "50% Cadence", this.units, "displayCadenceData");
        this.insertContentAtGridPosition(2, 2, this.cadenceData.upperQuartileCadence, "75% Cadence", this.units, "displayCadenceData");

        this.insertContentAtGridPosition(0, 3, this.cadenceData.lowerQuartileDistancePerOccurrence.toFixed(2), "25% Stride Length", "M", "displayCadenceData");
        this.insertContentAtGridPosition(1, 3, this.cadenceData.medianDistancePerOccurrence.toFixed(2), "50% Stride Length", "M", "displayCadenceData");
        this.insertContentAtGridPosition(2, 3, this.cadenceData.upperQuartileDistancePerOccurrence.toFixed(2), "75% Stride Length", "M", "displayCadenceData");

    }
}
