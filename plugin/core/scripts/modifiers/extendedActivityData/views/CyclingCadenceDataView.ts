import { Helper } from "../../../../../common/scripts/Helper";
import { CadenceDataModel } from "../../../../../common/scripts/models/ActivityData";
import { AbstractCadenceDataView } from "./AbstractCadenceDataView";
import * as _ from "lodash";

export class CyclingCadenceDataView extends AbstractCadenceDataView {

	constructor(cadenceData: CadenceDataModel, units: string) {
        super(cadenceData, units);
    }

    public render(): void {

		this.content += this.generateSectionTitle("<img src=\"" + this.appResources.circleNotchIcon + "\" style=\"vertical-align: baseline; height:20px;\"/> CADENCE <a target=\"_blank\" href=\"" + this.appResources.settingsLink + "#/zonesSettings/cyclingCadence\" style=\"float: right;margin-right: 10px;\"><img src=\"" + this.appResources.cogIcon + "\" style=\"vertical-align: baseline; height:20px;\"/></a>");
        super.render();
    }

    protected insertDataIntoGrid(): void {

        super.insertDataIntoGrid();

		const hasHasPerCadenceOccurrence = _.isNumber(this.cadenceData.averageDistancePerOccurrence) && !_.isNaN(this.cadenceData.averageDistancePerOccurrence);

		// Row 1
		this.insertContentAtGridPosition(0, 0, this.printNumber(this.cadenceData.cadencePercentageMoving, 2), "Cadence % while moving", "%", "displayCadenceData");
        this.insertContentAtGridPosition(1, 0, Helper.secondsToHHMMSS(this.cadenceData.cadenceTimeMoving), "Cadence Time while moving", "", "displayCadenceData");
		this.insertContentAtGridPosition(2, 0, this.printNumber(this.cadenceData.totalOccurrences, 0), "Crank Revolutions", "", "displayCadenceData");

		// Row 2
        if (this.cadenceData.upFlatDownCadencePaceData) {
			this.insertContentAtGridPosition(0, 1, this.printNumber(this.cadenceData.upFlatDownCadencePaceData.up, 0), "Climbing avg cadence", this.units, "displayCadenceData");
			this.insertContentAtGridPosition(1, 1, this.printNumber(this.cadenceData.upFlatDownCadencePaceData.flat, 0), "Flat avg cadence", this.units, "displayCadenceData");
			this.insertContentAtGridPosition(2, 1, this.printNumber(this.cadenceData.upFlatDownCadencePaceData.down, 0), "Downhill avg cadence", this.units, "displayCadenceData");
        }

		// Row 3
        this.insertContentAtGridPosition(0, 2, this.cadenceData.lowerQuartileCadence, "25% Cadence", "rpm", "displayCadenceData");
        this.insertContentAtGridPosition(1, 2, this.cadenceData.medianCadence, "50% Cadence", "rpm", "displayCadenceData");
        this.insertContentAtGridPosition(2, 2, this.cadenceData.upperQuartileCadence, "75% Cadence", "rpm", "displayCadenceData");


		// Row 4
		this.insertContentAtGridPosition(0, 3, this.cadenceData.standardDeviationCadence, "Std Deviation &sigma;", "rpm", "displayCadenceData");

		if (hasHasPerCadenceOccurrence) {
			this.insertContentAtGridPosition(1, 3, this.printNumber(this.cadenceData.averageDistancePerOccurrence, 2), "Avg Dist. / Crank Rev. <sup style='color:#FC4C02; font-size:12px;'>NEW</sup>", "M", "displayCadenceData");

			// Row 5
			this.insertContentAtGridPosition(0, 4, this.printNumber(this.cadenceData.lowerQuartileDistancePerOccurrence, 2), "25% Dist. / Crank Rev. <sup style='color:#FC4C02; font-size:12px;'>NEW</sup>", "M", "displayCadenceData");
			this.insertContentAtGridPosition(1, 4, this.printNumber(this.cadenceData.medianDistancePerOccurrence, 2), "50% Dist. / Crank Rev. <sup style='color:#FC4C02; font-size:12px;'>NEW</sup>", "M", "displayCadenceData");
			this.insertContentAtGridPosition(2, 4, this.printNumber(this.cadenceData.upperQuartileDistancePerOccurrence, 2), "75% Dist. / Crank Rev. <sup style='color:#FC4C02; font-size:12px;'>NEW</sup>", "M", "displayCadenceData");
		}
    }
}
