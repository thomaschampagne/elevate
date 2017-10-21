import {Helper} from "../../../../../common/scripts/Helper";
import {ICadenceData} from "../../../../../common/scripts/interfaces/IActivityData";
import {AbstractCadenceDataView} from "./AbstractCadenceDataView";

export class CyclingCadenceDataView extends AbstractCadenceDataView {

    constructor(cadenceData: ICadenceData, units: string) {
        super(cadenceData, units);
    }

    public render(): void {

        this.content += this.generateSectionTitle("<img src=\"" + this.appResources.circleNotchIcon + "\" style=\"vertical-align: baseline; height:20px;\"/> CADENCE <a target=\"_blank\" href=\"" + this.appResources.settingsLink + "#!/zonesSettings/cyclingCadence\" style=\"float: right;margin-right: 10px;\"><img src=\"" + this.appResources.cogIcon + "\" style=\"vertical-align: baseline; height:20px;\"/></a>");
        super.render();
    }

    protected insertDataIntoGrid(): void {

        super.insertDataIntoGrid();
        this.insertContentAtGridPosition(0, 0, this.cadenceData.cadencePercentageMoving.toFixed(2), "Cadence % while moving", "%", "displayCadenceData");
        this.insertContentAtGridPosition(1, 0, Helper.secondsToHHMMSS(this.cadenceData.cadenceTimeMoving), "Cadence Time while moving", "", "displayCadenceData");
        this.insertContentAtGridPosition(2, 0, this.cadenceData.totalOccurrences.toFixed(0), "Crank Revolutions", "", "displayCadenceData");

        if (this.cadenceData.upFlatDownCadencePaceData) {
            this.insertContentAtGridPosition(0, 1, this.cadenceData.upFlatDownCadencePaceData.up.toFixed(0), "Climbing avg cadence", this.units, "displayCadenceData");
            this.insertContentAtGridPosition(1, 1, this.cadenceData.upFlatDownCadencePaceData.flat.toFixed(0), "Flat avg cadence", this.units, "displayCadenceData");
            this.insertContentAtGridPosition(2, 1, this.cadenceData.upFlatDownCadencePaceData.down.toFixed(0), "Downhill avg cadence", this.units, "displayCadenceData");
        }

        this.insertContentAtGridPosition(0, 2, this.cadenceData.lowerQuartileCadence, "25% Cadence", "rpm", "displayCadenceData");
        this.insertContentAtGridPosition(1, 2, this.cadenceData.medianCadence, "50% Cadence", "rpm", "displayCadenceData");
        this.insertContentAtGridPosition(2, 2, this.cadenceData.upperQuartileCadence, "75% Cadence", "rpm", "displayCadenceData");

        this.insertContentAtGridPosition(0, 3, this.cadenceData.averageDistancePerOccurrence.toFixed(2), "Avg Dist. / Crank Rev.", "M", "displayCadenceData");
        this.insertContentAtGridPosition(1, 3, this.cadenceData.standardDeviationCadence, "Std Deviation &sigma;", "rpm", "displayCadenceData");

        this.insertContentAtGridPosition(0, 4, this.cadenceData.lowerQuartileDistancePerOccurrence.toFixed(2), "25% Dist. / Crank Rev.", "M", "displayCadenceData");
        this.insertContentAtGridPosition(1, 4, this.cadenceData.medianDistancePerOccurrence.toFixed(2), "50% Dist. / Crank Rev.", "M", "displayCadenceData");
        this.insertContentAtGridPosition(2, 4, this.cadenceData.upperQuartileDistancePerOccurrence.toFixed(2), "75% Dist. / Crank Rev.", "M", "displayCadenceData");

    }
}
