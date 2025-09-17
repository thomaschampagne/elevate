import { AbstractDataView } from "./abstract-data.view";
import { ElevationStats } from "@elevate/shared/models/sync/activity.model";

export class ElevationDataView extends AbstractDataView {
  protected elevation: ElevationStats;

  constructor(elevation: ElevationStats, units: string) {
    super(units);
    this.mainColor = [255, 185, 0];
    this.elevation = elevation;
    this.setGraphTitleFromUnits();
    this.setupDistributionGraph(this.elevation.elevationZones);
    this.setupDistributionTable(this.elevation.elevationZones);
  }

  public render(): void {
    // Add a title
    this.content += this.generateSectionTitle(
      '<img src="' +
        this.appResources.areaChartIcon +
        '" style="vertical-align: baseline; height:20px;"/> ELEVATION <a target="_blank" href="' +
        this.appResources.settingsLink +
        '#/zonesSettings/elevation" style="float: right;margin-right: 10px;"><img src="' +
        this.appResources.cogIcon +
        '" style="vertical-align: baseline; height:20px;"/></a>'
    );

    // Creates a grid
    this.makeGrid(3, 3); // (col, row)

    this.insertDataIntoGrid();
    this.generateCanvasForGraph();

    // Push grid, graph and table to content view
    this.injectToContent();
  }

  protected insertDataIntoGrid(): void {
    this.insertContentAtGridPosition(
      0,
      0,
      this.elevation.avg,
      "Average Elevation",
      "m",
      "displayAdvancedElevationData"
    );
    this.insertContentAtGridPosition(
      1,
      0,
      this.printNumber(this.elevation.ascent, 0),
      "Ascent",
      "m",
      "displayAdvancedElevationData"
    );
    this.insertContentAtGridPosition(
      2,
      0,
      this.printNumber(this.elevation.descent, 0),
      "Descent",
      "m",
      "displayAdvancedElevationData"
    );

    this.insertContentAtGridPosition(
      0,
      1,
      this.printNumber(this.elevation.lowQ),
      "25% Quartile Elevation",
      "m",
      "displayAdvancedElevationData"
    );
    this.insertContentAtGridPosition(
      1,
      1,
      this.printNumber(this.elevation.median),
      "50% Quartile Elevation",
      "m",
      "displayAdvancedElevationData"
    );
    this.insertContentAtGridPosition(
      2,
      1,
      this.printNumber(this.elevation.upperQ),
      "75% Quartile Elevation",
      "m",
      "displayAdvancedElevationData"
    );
    this.insertContentAtGridPosition(
      0,
      2,
      this.printNumber(this.elevation.ascentSpeed),
      "Average Ascent Speed",
      "Vm/h",
      "displayAdvancedElevationData"
    );
  }
}
