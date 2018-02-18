import { Helper } from "../../../../../common/scripts/Helper";
import { SpeedDataModel } from "../../../../../common/scripts/models/ActivityData";
import { AbstractDataView } from "./AbstractDataView";

export class SpeedDataView extends AbstractDataView {

	protected speedData: SpeedDataModel;

	constructor(speedData: SpeedDataModel, units: string) {
		super(units);
		this.mainColor = [9, 123, 219];
		this.setGraphTitleFromUnits();
		this.speedData = speedData;
		this.speedUnitsData = Helper.getSpeedUnitData();
		this.setupDistributionGraph(this.speedData.speedZones, this.speedUnitsData.speedUnitFactor);
		this.setupDistributionTable(this.speedData.speedZones, this.speedUnitsData.speedUnitFactor);
	}

	public render(): void {

		// Add a title
		this.content += this.generateSectionTitle("<img src=\"" + this.appResources.tachometerIcon + "\" style=\"vertical-align: baseline; height:20px;\"/> SPEED <a target=\"_blank\" href=\"" + this.appResources.settingsLink + "#/zonesSettings/speed\" style=\"float: right;margin-right: 10px;\"><img src=\"" + this.appResources.cogIcon + "\" style=\"vertical-align: baseline; height:20px;\"/></a>");

		// Creates a grid
		this.makeGrid(3, 2); // (col, row)
		this.insertDataIntoGrid();
		this.generateCanvasForGraph();

		// Push grid, graph and table to content view
		this.injectToContent();
	}

	protected insertDataIntoGrid(): void {

		// Quartiles
		this.insertContentAtGridPosition(0, 0, this.printNumber((this.speedData.lowerQuartileSpeed * this.speedUnitsData.speedUnitFactor), 1), "25% Quartile Speed", this.speedUnitsData.speedUnitPerHour, "displayAdvancedSpeedData");
		this.insertContentAtGridPosition(1, 0, this.printNumber((this.speedData.medianSpeed * this.speedUnitsData.speedUnitFactor), 1), "50% Quartile Speed", this.speedUnitsData.speedUnitPerHour, "displayAdvancedSpeedData");
		this.insertContentAtGridPosition(2, 0, this.printNumber((this.speedData.upperQuartileSpeed * this.speedUnitsData.speedUnitFactor), 1), "75% Quartile Speed", this.speedUnitsData.speedUnitPerHour, "displayAdvancedSpeedData");

		this.insertContentAtGridPosition(0, 1, this.printNumber((this.speedData.standardDeviationSpeed * this.speedUnitsData.speedUnitFactor), 1), "Std Deviation &sigma;", this.speedUnitsData.speedUnitPerHour, "displayAdvancedSpeedData");
		this.insertContentAtGridPosition(1, 1, this.printNumber((this.speedData.genuineAvgSpeed * this.speedUnitsData.speedUnitFactor), 1), "Average speed", this.speedUnitsData.speedUnitPerHour, "displayAdvancedSpeedData");

		if (!this.isSegmentEffortView) {
			this.insertContentAtGridPosition(2, 1, this.printNumber((this.speedData.totalAvgSpeed * this.speedUnitsData.speedUnitFactor), 1), "Full time Avg speed", this.speedUnitsData.speedUnitPerHour, "displayAdvancedSpeedData");
		}
	}

}
