import { PaceDataView } from "./pace-data.view";
import { PaceDataModel } from "../../../models/activity-data/pace-data.model";
import { Helper } from "../../../helper";

export class GradeAdjustedPaceDataView extends PaceDataView {

	constructor(paceData: PaceDataModel, units: string) {
		super(paceData, units);

		this.mainColor = [83, 17, 154];

		this.setupDistributionGraph(this.paceData.gradeAdjustedPaceZones, 1 / this.speedUnitsData.speedUnitFactor);
		this.setupDistributionTable(this.paceData.gradeAdjustedPaceZones, 1 / this.speedUnitsData.speedUnitFactor);
	}

	public render(): void {

		// Add a title
		this.content += this.generateSectionTitle("<img src=\"" + this.appResources.tachometerIcon + "\" style=\"vertical-align: baseline; height:20px;\"/> GRADE ADJUSTED PACE <a target=\"_blank\" href=\"" + this.appResources.settingsLink + "#/zonesSettings/gradeAdjustedPace\" style=\"float: right;margin-right: 10px;\"><img src=\"" + this.appResources.cogIcon + "\" style=\"vertical-align: baseline; height:20px;\"/></a>");

		// Creates a grid
		this.makeGrid(3, 1); // (col, row)

		this.insertDataIntoGrid();
		this.generateCanvasForGraph();
		this.injectToContent();
	}

	protected insertDataIntoGrid(): void {
		const gradeAdjustedPace: string = Helper.secondsToHHMMSS(this.paceData.genuineGradeAdjustedAvgPace / this.speedUnitsData.speedUnitFactor, true);
		this.insertContentAtGridPosition(0, 0, gradeAdjustedPace, "Avg Grade Adjusted Pace", "/" + this.speedUnitsData.units, "displayAdvancedSpeedData");
	}
}
