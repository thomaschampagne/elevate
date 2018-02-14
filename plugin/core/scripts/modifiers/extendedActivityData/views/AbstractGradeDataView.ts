import { Helper } from "../../../../../common/scripts/Helper";
import { GradeDataModel } from "../../../../../common/scripts/models/ActivityData";
import { AbstractDataView } from "./AbstractDataView";

export abstract class AbstractGradeDataView extends AbstractDataView {

	protected gradeData: GradeDataModel;

	constructor(gradeData: GradeDataModel, units: string) {
        super(units);
        this.mainColor = [0, 128, 0];
        this.setGraphTitleFromUnits();
        this.gradeData = gradeData;
        this.setupDistributionGraph(this.gradeData.gradeZones);
        this.setupDistributionTable(this.gradeData.gradeZones);
        this.speedUnitsData = Helper.getSpeedUnitData();
    }

    public render(): void {

        // Add a title
		this.content += this.generateSectionTitle("<img src=\"" + this.appResources.areaChartIcon + "\" style=\"vertical-align: baseline; height:20px;\"/> GRADE <a target=\"_blank\" href=\"" + this.appResources.settingsLink + "#/zonesSettings/grade\" style=\"float: right;margin-right: 10px;\"><img src=\"" + this.appResources.cogIcon + "\" style=\"vertical-align: baseline; height:20px;\"/></a>");

        // Creates a grid
        this.makeGrid(3, 7); // (col, row)

        this.insertDataIntoGrid();
        this.generateCanvasForGraph();

        // Push grid, graph and table to content view
        this.injectToContent();
    }

    protected insertDataIntoGrid(): void {

        this.insertContentAtGridPosition(0, 0, this.gradeData.gradeProfile, "Grade Profile", "", "displayAdvancedGradeData");

        this.insertContentAtGridPosition(0, 1, this.gradeData.lowerQuartileGrade, "25% Quartile Grade", "%", "displayAdvancedGradeData");
        this.insertContentAtGridPosition(1, 1, this.gradeData.medianGrade, "50% Quartile Grade", "%", "displayAdvancedGradeData");
        this.insertContentAtGridPosition(2, 1, this.gradeData.upperQuartileGrade, "75% Quartile Grade", "%", "displayAdvancedGradeData");

		this.insertContentAtGridPosition(0, 2, this.printNumber((this.gradeData.upFlatDownInSeconds.up / this.gradeData.upFlatDownInSeconds.total * 100), 1), "% climbing", "%", "displayAdvancedGradeData");
		this.insertContentAtGridPosition(1, 2, this.printNumber((this.gradeData.upFlatDownInSeconds.flat / this.gradeData.upFlatDownInSeconds.total * 100), 1), "% flat", "%", "displayAdvancedGradeData");
		this.insertContentAtGridPosition(2, 2, this.printNumber((this.gradeData.upFlatDownInSeconds.down / this.gradeData.upFlatDownInSeconds.total * 100), 1), "% downhill ", "%", "displayAdvancedGradeData");

        this.insertContentAtGridPosition(0, 3, Helper.secondsToHHMMSS(this.gradeData.upFlatDownInSeconds.up), "Climbing time", "", "displayAdvancedGradeData");
        this.insertContentAtGridPosition(1, 3, Helper.secondsToHHMMSS(this.gradeData.upFlatDownInSeconds.flat), "Flat time", "", "displayAdvancedGradeData");
        this.insertContentAtGridPosition(2, 3, Helper.secondsToHHMMSS(this.gradeData.upFlatDownInSeconds.down), "Downhill time", "", "displayAdvancedGradeData");

        const distanceUp: number = this.gradeData.upFlatDownDistanceData.up * this.speedUnitsData.speedUnitFactor;
        const distanceFlat: number = this.gradeData.upFlatDownDistanceData.flat * this.speedUnitsData.speedUnitFactor;
        const distanceDown: number = this.gradeData.upFlatDownDistanceData.down * this.speedUnitsData.speedUnitFactor;

        this.insertContentAtGridPosition(0, 5, ((distanceUp !== 0) ? distanceUp.toFixed(1) : "-"), "Climbing distance", this.speedUnitsData.units, "displayAdvancedGradeData");
        this.insertContentAtGridPosition(1, 5, ((distanceFlat !== 0) ? distanceFlat.toFixed(1) : "-"), "Flat distance", this.speedUnitsData.units, "displayAdvancedGradeData");
        this.insertContentAtGridPosition(2, 5, ((distanceDown !== 0) ? distanceDown.toFixed(1) : "-"), "Downhill distance", this.speedUnitsData.units, "displayAdvancedGradeData");

		this.insertContentAtGridPosition(0, 6, this.printNumber(this.gradeData.avgGrade, 1), "Avg grade", "%", "displayAdvancedGradeData");
		this.insertContentAtGridPosition(1, 6, this.printNumber(this.gradeData.avgMaxGrade, 1), "Max uphill grade", "%", "displayAdvancedGradeData");
		this.insertContentAtGridPosition(2, 6, this.printNumber(this.gradeData.avgMinGrade, 1), "Max downhill grade", "%", "displayAdvancedGradeData");
    }
}
