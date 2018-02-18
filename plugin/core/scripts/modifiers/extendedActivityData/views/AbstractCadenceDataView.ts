import { CadenceDataModel } from "../../../../../common/scripts/models/ActivityData";
import { AbstractDataView } from "./AbstractDataView";

export abstract class AbstractCadenceDataView extends AbstractDataView {

	protected cadenceData: CadenceDataModel;

	constructor(cadenceData: CadenceDataModel, units: string) {
        super(units);
        this.cadenceData = cadenceData;
        this.mainColor = [213, 0, 195];
        this.setGraphTitleFromUnits();
        this.setupDistributionGraph(this.cadenceData.cadenceZones);
        this.setupDistributionTable(this.cadenceData.cadenceZones);
    }

    public render(): void {

        // Creates a grid
        this.makeGrid(3, 5); // (col, row)

        this.insertDataIntoGrid();
        this.generateCanvasForGraph();

        // Push grid, graph and table to content view
        this.injectToContent();
    }

    protected insertDataIntoGrid(): void {

    }
}
