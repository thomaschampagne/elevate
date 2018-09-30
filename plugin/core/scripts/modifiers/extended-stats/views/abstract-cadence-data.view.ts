import { AbstractDataView } from "./abstract-data.view";
import { CadenceDataModel } from "../../../models/activity-data/cadence-data.model";

export abstract class AbstractCadenceDataView extends AbstractDataView {

	protected cadenceData: CadenceDataModel;

	protected constructor(cadenceData: CadenceDataModel, units: string) {
		super(units);
		this.cadenceData = cadenceData;
		this.mainColor = [195, 69, 185];
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
