import { ElevationDataModel } from "../../../../../common/scripts/models/ActivityData";
import { AbstractDataView } from "./AbstractDataView";

export class ElevationDataView extends AbstractDataView {
	protected elevationData: ElevationDataModel;

	constructor(elevationData: ElevationDataModel, units: string) {
        super(units);
        this.mainColor = [216, 212, 38];
        this.elevationData = elevationData;
        this.setGraphTitleFromUnits();
        this.setupDistributionGraph(this.elevationData.elevationZones);
        this.setupDistributionTable(this.elevationData.elevationZones);
    }

    public render(): void {

        // Add a title
		this.content += this.generateSectionTitle("<img src=\"" + this.appResources.logArrowUpIcon + "\" style=\"vertical-align: baseline; height:20px;\"/> ELEVATION <a target=\"_blank\" href=\"" + this.appResources.settingsLink + "#/zonesSettings/elevation\" style=\"float: right;margin-right: 10px;\"><img src=\"" + this.appResources.cogIcon + "\" style=\"vertical-align: baseline; height:20px;\"/></a>");

        // Creates a grid
        this.makeGrid(3, 2); // (col, row)

        this.insertDataIntoGrid();
        this.generateCanvasForGraph();

        // Push grid, graph and table to content view
        this.injectToContent();
    }

    protected insertDataIntoGrid(): void {

        this.insertContentAtGridPosition(0, 0, this.elevationData.avgElevation, "Average Elevation", "m", "displayAdvancedElevationData");
		this.insertContentAtGridPosition(1, 0, this.printNumber(this.elevationData.accumulatedElevationAscent, 0), "Ascent", "m", "displayAdvancedElevationData");
		this.insertContentAtGridPosition(2, 0, this.printNumber(this.elevationData.accumulatedElevationDescent, 0), "Descent", "m", "displayAdvancedElevationData");

        this.insertContentAtGridPosition(0, 1, this.elevationData.lowerQuartileElevation, "25% Quartile Elevation", "m", "displayAdvancedElevationData");
        this.insertContentAtGridPosition(1, 1, this.elevationData.medianElevation, "50% Quartile Elevation", "m", "displayAdvancedElevationData");
        this.insertContentAtGridPosition(2, 1, this.elevationData.upperQuartileElevation, "75% Quartile Elevation", "m", "displayAdvancedElevationData");
    }
}
