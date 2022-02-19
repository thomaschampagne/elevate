import { AbstractDataView } from "./abstract-data.view";
import { CadenceStats } from "@elevate/shared/models/sync/activity.model";

export abstract class AbstractCadenceDataView extends AbstractDataView {
  protected constructor(protected cadence: CadenceStats, units: string) {
    super(units);
    this.cadence = cadence;
    this.mainColor = [195, 69, 185];
    this.setGraphTitleFromUnits();
    this.setupDistributionGraph(this.cadence.zones);
    this.setupDistributionTable(this.cadence.zones);
  }

  public render(): void {
    // Creates a grid
    this.makeGrid(3, 5); // (col, row)

    this.insertDataIntoGrid();
    this.generateCanvasForGraph();

    // Push grid, graph and table to content view
    this.injectToContent();
  }

  protected insertDataIntoGrid(): void {}
}
