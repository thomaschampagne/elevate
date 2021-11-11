import { Helper } from "../../../helper";
import { AbstractDataView } from "./abstract-data.view";
import _ from "lodash";
import { SpeedStats } from "@elevate/shared/models/sync/activity.model";

export class SpeedDataView extends AbstractDataView {
  protected speed: SpeedStats;

  constructor(speed: SpeedStats, units: string) {
    super(units);
    this.mainColor = [36, 130, 210];
    this.setGraphTitleFromUnits();
    this.speed = speed;
    this.speedUnitsData = Helper.getSpeedUnitData(window.currentAthlete.get("measurement_preference"));
    this.setupDistributionGraph(this.speed.zones, this.speedUnitsData.speedUnitFactor);
    this.setupDistributionTable(this.speed.zones, this.speedUnitsData.speedUnitFactor);
  }

  public render(): void {
    // Add a title
    this.content += this.generateSectionTitle(
      '<img src="' +
        this.appResources.tachometerIcon +
        '" style="vertical-align: baseline; height:20px;"/> SPEED <a target="_blank" href="' +
        this.appResources.settingsLink +
        '#/zonesSettings/speed" style="float: right;margin-right: 10px;"><img src="' +
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
    if (_.isNumber(this.speed.best20min) && !this.isSegmentEffortView) {
      this.insertContentAtGridPosition(
        0,
        0,
        this.printNumber(this.speed.best20min * this.speedUnitsData.speedUnitFactor, 1),
        "Best 20min Speed <sup style='color:#FC4C02; font-size:12px; position: initial;'>NEW</sup>",
        this.speedUnitsData.speedUnitPerHour,
        "displayAdvancedSpeedData"
      );
    }

    // Quartiles
    this.insertContentAtGridPosition(
      0,
      1,
      this.printNumber(this.speed.lowQ * this.speedUnitsData.speedUnitFactor, 1),
      "25% Quartile Speed",
      this.speedUnitsData.speedUnitPerHour,
      "displayAdvancedSpeedData"
    );
    this.insertContentAtGridPosition(
      1,
      1,
      this.printNumber(this.speed.median * this.speedUnitsData.speedUnitFactor, 1),
      "50% Quartile Speed",
      this.speedUnitsData.speedUnitPerHour,
      "displayAdvancedSpeedData"
    );
    this.insertContentAtGridPosition(
      2,
      1,
      this.printNumber(this.speed.upperQ * this.speedUnitsData.speedUnitFactor, 1),
      "75% Quartile Speed",
      this.speedUnitsData.speedUnitPerHour,
      "displayAdvancedSpeedData"
    );

    this.insertContentAtGridPosition(
      0,
      2,
      this.printNumber(this.speed.stdDev * this.speedUnitsData.speedUnitFactor, 1),
      "Std Deviation &sigma;",
      this.speedUnitsData.speedUnitPerHour,
      "displayAdvancedSpeedData"
    );
    this.insertContentAtGridPosition(
      1,
      2,
      this.printNumber(this.speed.avg * this.speedUnitsData.speedUnitFactor, 1),
      "Average speed",
      this.speedUnitsData.speedUnitPerHour,
      "displayAdvancedSpeedData"
    );
  }
}
