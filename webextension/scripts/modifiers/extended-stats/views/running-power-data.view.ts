import { AbstractDataView } from "./abstract-data.view";
import _ from "lodash";
import { PowerStats } from "@elevate/shared/models/sync/activity.model";

export class RunningPowerDataView extends AbstractDataView {
  constructor(protected power: PowerStats, protected hasPowerMeter: boolean, units: string) {
    super(units);
    this.mainColor = [63, 64, 72];
    this.setGraphTitleFromUnits();
    this.power = power;
    this.setupDistributionGraph(this.power.zones);
    this.setupDistributionTable(this.power.zones);
  }

  public render(): void {
    // Add a title
    this.content += this.generateSectionTitle(
      '<img src="' +
        this.appResources.boltIcon +
        '" style="vertical-align: baseline; height:20px;"/> POWER <a target="_blank" href="' +
        this.appResources.settingsLink +
        '#/zonesSettings/runningPower" style="float: right;margin-right: 10px;"><img src="' +
        this.appResources.cogIcon +
        '" style="vertical-align: baseline; height:20px;"/></a>'
    );

    // Creates a grid
    this.makeGrid(3, 4); // (col, row)

    this.insertDataIntoGrid();
    this.generateCanvasForGraph();

    // Push grid, graph and table to content view
    this.injectToContent();
  }

  protected insertDataIntoGrid(): void {
    const isRealPower = this.hasPowerMeter;
    const printEstimatedWordWhenRealPower = isRealPower ? "" : "Estimated ";
    const printEstimatedTildWhenRealPower = isRealPower ? "" : "<span style='font-size: 14px;'>~</span>";

    this.insertContentAtGridPosition(
      0,
      0,
      printEstimatedTildWhenRealPower + this.printNumber(this.power.avg, 0),
      printEstimatedWordWhenRealPower + "Average Power",
      "W",
      "displayAdvancedPowerData"
    );

    if (_.isNumber(this.power.best20min) && !this.isSegmentEffortView) {
      this.insertContentAtGridPosition(
        1,
        0,
        printEstimatedTildWhenRealPower + this.printNumber(this.power.best20min, 0),
        printEstimatedWordWhenRealPower + " Best 20min Power",
        "W",
        "displayAdvancedPowerData"
      );
    }

    if (isRealPower) {
      this.insertContentAtGridPosition(
        0,
        1,
        this.printNumber(this.power.weighted, 0),
        printEstimatedWordWhenRealPower + "Normalized Power®",
        "W",
        "displayAdvancedPowerData"
      );
      this.insertContentAtGridPosition(
        1,
        1,
        this.printNumber(this.power.variabilityIndex, 2),
        printEstimatedWordWhenRealPower + "Variability Index",
        "",
        "displayAdvancedPowerData"
      );
    }

    this.insertContentAtGridPosition(
      0,
      2,
      printEstimatedTildWhenRealPower + this.printNumber(this.power.lowQ),
      printEstimatedWordWhenRealPower + "25% Quartile Watts",
      "W",
      "displayAdvancedPowerData"
    );
    this.insertContentAtGridPosition(
      1,
      2,
      printEstimatedTildWhenRealPower + this.printNumber(this.power.median),
      printEstimatedWordWhenRealPower + "50% Quartile Watts",
      "W",
      "displayAdvancedPowerData"
    );
    this.insertContentAtGridPosition(
      2,
      2,
      printEstimatedTildWhenRealPower + this.printNumber(this.power.upperQ),
      printEstimatedWordWhenRealPower + "75% Quartile Watts",
      "W",
      "displayAdvancedPowerData"
    );
  }
}
