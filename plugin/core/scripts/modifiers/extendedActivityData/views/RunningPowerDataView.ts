import { AbstractDataView } from "./AbstractDataView";
import * as _ from "lodash";
import { PowerDataModel } from "../../../../../shared/models/activity-data/power-data.model";

export class RunningPowerDataView extends AbstractDataView {

	protected powerData: PowerDataModel;

	constructor(powerData: PowerDataModel, units: string) {
		super(units);
		this.mainColor = [63, 64, 72];
		this.setGraphTitleFromUnits();
		this.powerData = powerData;
		this.setupDistributionGraph(this.powerData.powerZones);
		this.setupDistributionTable(this.powerData.powerZones);
	}

	public render(): void {

		// Add a title
		this.content += this.generateSectionTitle("<img src=\"" + this.appResources.boltIcon + "\" style=\"vertical-align: baseline; height:20px;\"/> POWER <a target=\"_blank\" href=\"" + this.appResources.settingsLink + "#/zonesSettings/runningPower\" style=\"float: right;margin-right: 10px;\"><img src=\"" + this.appResources.cogIcon + "\" style=\"vertical-align: baseline; height:20px;\"/></a>");

		// Creates a grid
		this.makeGrid(3, 4); // (col, row)

		this.insertDataIntoGrid();
		this.generateCanvasForGraph();

		// Push grid, graph and table to content view
		this.injectToContent();
	}

	protected insertDataIntoGrid(): void {

		const isRealPower = !(this.powerData.isEstimatedRunningPower === true);
		const printEstimatedWordWhenRealPower = isRealPower ? "" : "Estimated ";
		const printEstimatedTildWhenRealPower = isRealPower ? "" : "<span style='font-size: 14px;'>~</span>";

		this.insertContentAtGridPosition(0, 0, printEstimatedTildWhenRealPower + this.printNumber(this.powerData.avgWatts, 0),
			printEstimatedWordWhenRealPower + "Average Power", "W", isRealPower ? "displayAdvancedPowerData" : "displayRunningPowerEstimation");

		if (_.isNumber(this.powerData.best20min) && !this.isSegmentEffortView) {
			this.insertContentAtGridPosition(1, 0, printEstimatedTildWhenRealPower + this.printNumber(this.powerData.best20min, 0),
				printEstimatedWordWhenRealPower + " Best 20min Power <sup style='color:#FC4C02; font-size:12px; position: initial;'>NEW</sup>", "W", isRealPower ? "displayAdvancedPowerData" : "displayRunningPowerEstimation");
		}

		if (isRealPower) {
			this.insertContentAtGridPosition(0, 1, this.printNumber(this.powerData.weightedPower, 0),
				printEstimatedWordWhenRealPower + "Weighted Power", "W", "displayAdvancedPowerData");
			this.insertContentAtGridPosition(1, 1, this.printNumber(this.powerData.variabilityIndex, 2),
				printEstimatedWordWhenRealPower + "Variability Index", "", "displayAdvancedPowerData");
		}

		this.insertContentAtGridPosition(0, 2, printEstimatedTildWhenRealPower + this.powerData.lowerQuartileWatts,
			printEstimatedWordWhenRealPower + "25% Quartile Watts", "W", isRealPower ? "displayAdvancedPowerData" : "displayRunningPowerEstimation");
		this.insertContentAtGridPosition(1, 2, printEstimatedTildWhenRealPower + this.powerData.medianWatts,
			printEstimatedWordWhenRealPower + "50% Quartile Watts", "W", isRealPower ? "displayAdvancedPowerData" : "displayRunningPowerEstimation");
		this.insertContentAtGridPosition(2, 2, printEstimatedTildWhenRealPower + this.powerData.upperQuartileWatts,
			printEstimatedWordWhenRealPower + "75% Quartile Watts", "W", isRealPower ? "displayAdvancedPowerData" : "displayRunningPowerEstimation");

	}
}
