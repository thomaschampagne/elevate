import _ from "lodash";
import { AbstractDataView } from "./abstract-data.view";
import { PowerStats, StressScores } from "@elevate/shared/models/sync/activity.model";

export class CyclingPowerDataView extends AbstractDataView {
  constructor(protected power: PowerStats, protected stressScores: StressScores, units: string) {
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
        '#/zonesSettings/power" style="float: right;margin-right: 10px;"><img src="' +
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
    this.insertContentAtGridPosition(
      0,
      0,
      this.printNumber(this.power.weighted, 0),
      "Normalized Power®",
      "W",
      "displayAdvancedPowerData"
    );
    this.insertContentAtGridPosition(
      1,
      0,
      this.printNumber(this.power.variabilityIndex, 2),
      "Variability Index",
      "",
      "displayAdvancedPowerData"
    );

    if (this.power.intensityFactor) {
      this.insertContentAtGridPosition(
        2,
        0,
        this.printNumber(this.power.intensityFactor, 2),
        "Intensity",
        "",
        "displayAdvancedPowerData"
      );
    }

    this.insertContentAtGridPosition(
      0,
      1,
      this.printNumber(this.power.lowQ),
      "25% Quartile Watts",
      "W",
      "displayAdvancedPowerData"
    );
    this.insertContentAtGridPosition(
      1,
      1,
      this.printNumber(this.power.median),
      "50% Quartile Watts",
      "W",
      "displayAdvancedPowerData"
    );
    this.insertContentAtGridPosition(
      2,
      1,
      this.printNumber(this.power.upperQ),
      "75% Quartile Watts",
      "W",
      "displayAdvancedPowerData"
    );

    if (_.isNumber(this.power.avgKg)) {
      this.insertContentAtGridPosition(
        0,
        2,
        this.printNumber(this.power.avgKg, 2),
        "Avg Watts/Kg",
        "W/Kg",
        "displayAdvancedPowerData"
      );
    }

    if (_.isNumber(this.power.weightedKg)) {
      this.insertContentAtGridPosition(
        1,
        2,
        this.printNumber(this.power.weightedKg, 2),
        "Normalized Power®/Kg",
        "W/Kg",
        "displayAdvancedPowerData"
      );
    }
    if (_.isNumber(this.power.best20min) && !this.isSegmentEffortView) {
      this.insertContentAtGridPosition(
        2,
        2,
        this.printNumber(this.power.best20min, 0),
        "Best 20min Power <sup style='color:#FC4C02; font-size:12px; position: initial;'>NEW</sup>",
        "W",
        "displayAdvancedPowerData"
      );
    }

    if (_.isNumber(this.stressScores?.pss)) {
      this.insertContentAtGridPosition(
        0,
        3,
        this.printNumber(this.stressScores.pss, 0),
        "Power Stress Score",
        "",
        "displayAdvancedPowerData"
      );
    }

    if (_.isNumber(this.stressScores?.pssPerHour)) {
      this.insertContentAtGridPosition(
        1,
        3,
        this.printNumber(this.stressScores.pssPerHour, 1),
        "Power Stress Score / Hour",
        "",
        "displayAdvancedPowerData"
      );
    }
  }
}
