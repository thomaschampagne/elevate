import { AbstractDataView } from "./abstract-data.view";
import { PowerStats } from "@elevate/shared/models/sync/activity.model";

export class CyclingPowerCurveView extends AbstractDataView {
  protected power: PowerStats;

  constructor(power: PowerStats, units: string) {
    super(units, "scatter-line", true);
    this.mainColor = [63, 64, 72];
    this.power = power;
    this.graphTitle = "Power best efforts vs. time";
    this.setupScatterLineGraph(
      this.power.peaks.map(split => {
        return { x: split.range, y: split.result };
      })
    );
    this.setupPointDataTable(this.power.peaks);
  }

  public render(): void {
    // Add a title
    this.content += this.generateSectionTitle(
      '<img src="' +
        this.appResources.boltIcon +
        '" style="vertical-align: baseline; height:20px;"/> POWER CURVE <a target="_blank" href="' +
        this.appResources.settingsLink +
        '#/zonesSettings/power" style="float: right;margin-right: 10px;"><img src="' +
        this.appResources.cogIcon +
        '" style="vertical-align: baseline; height:20px;"/></a>'
    );

    // Creates a grid
    this.makeGrid(3, 4); // (col, row)

    this.generateCanvasForGraph();

    // Push grid, graph and table to content view
    this.injectToContent();
  }

  protected insertDataIntoGrid(): void {
    // Empty virtual method
    return;
  }
}
