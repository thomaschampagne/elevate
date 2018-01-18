import { ElevationDataModel } from "../../../../../common/scripts/models/ActivityData";
import { AbstractDataView } from "./AbstractDataView";

export class AscentSpeedDataView extends AbstractDataView {

	protected elevationData: ElevationDataModel;

	constructor(elevationData: ElevationDataModel, units: string) {
        super(units);
        this.mainColor = [44, 0, 204];
        this.setGraphTitleFromUnits();
        this.elevationData = elevationData;
        this.setupDistributionGraph(this.elevationData.ascentSpeedZones);
        this.setupDistributionTable(this.elevationData.ascentSpeedZones);
    }

    public render(): void {

        // Add a title
		this.content += this.generateSectionTitle("<img src=\"" + this.appResources.tachometerIcon + "\" style=\"vertical-align: baseline; height:20px;\"/> ASCENT SPEED<a target=\"_blank\" href=\"" + this.appResources.settingsLink + "#/zonesSettings/ascent\" style=\"float: right;margin-right: 10px;\"><img src=\"" + this.appResources.cogIcon + "\" style=\"vertical-align: baseline; height:20px;\"/></a>");

        // Creates a grid
        this.makeGrid(3, 2); // (col, row)

        this.insertDataIntoGrid();
        this.generateCanvasForGraph();

        // Push grid, graph and table to content view
        this.injectToContent();
    }

    protected insertDataIntoGrid(): void {

        const ascentSpeedAvg: number = this.elevationData.ascentSpeed.avg;
        let ascentSpeedAvgDisplay: string;

        if (ascentSpeedAvg) {
            if (ascentSpeedAvg === -1) {
                ascentSpeedAvgDisplay = "&infin;";
            } else {
                ascentSpeedAvgDisplay = ascentSpeedAvg.toFixed(0);
            }
        }

        this.insertContentAtGridPosition(0, 0, ascentSpeedAvgDisplay, "Avg Ascent Speed or VAM", "Vm/h", "displayAdvancedElevationData");
        this.insertContentAtGridPosition(0, 1, this.elevationData.ascentSpeed.lowerQuartile, "25% Quartile Ascent Speed", "Vm/h", "displayAdvancedElevationData");
        this.insertContentAtGridPosition(1, 1, this.elevationData.ascentSpeed.median, "50% Quartile Ascent Speed", "Vm/h", "displayAdvancedElevationData");
        this.insertContentAtGridPosition(2, 1, this.elevationData.ascentSpeed.upperQuartile, "75% Quartile Ascent Speed", "Vm/h", "displayAdvancedElevationData");
    }
}
