import { AbstractCadenceDataView } from "./abstract-cadence-data.view";
import _ from "lodash";
import { CadenceStats } from "@elevate/shared/models/sync/activity.model";
import { Time } from "@elevate/shared/tools/time";

export class CyclingCadenceDataView extends AbstractCadenceDataView {
  constructor(cadence: CadenceStats, units: string) {
    super(cadence, units);
  }

  public render(): void {
    this.content += this.generateSectionTitle(
      '<img src="' +
        this.appResources.circleNotchIcon +
        '" style="vertical-align: baseline; height:20px;"/> CADENCE <a target="_blank" href="' +
        this.appResources.settingsLink +
        '#/zonesSettings/cyclingCadence" style="float: right;margin-right: 10px;"><img src="' +
        this.appResources.cogIcon +
        '" style="vertical-align: baseline; height:20px;"/></a>'
    );
    super.render();
  }

  protected insertDataIntoGrid(): void {
    super.insertDataIntoGrid();

    // Row 1
    this.insertContentAtGridPosition(
      0,
      0,
      this.printNumber(this.cadence.activeRatio, 2),
      "Active Cadence",
      "",
      "displayCadenceData"
    );
    this.insertContentAtGridPosition(
      1,
      0,
      Time.secToMilitary(this.cadence.activeTime),
      "Active Cadence Time",
      "",
      "displayCadenceData"
    );
    this.insertContentAtGridPosition(
      2,
      0,
      this.printNumber(this.cadence.cycles, 0),
      "Crank Revolutions",
      "",
      "displayCadenceData"
    );

    // Row 2
    if (this.cadence.slope) {
      this.insertContentAtGridPosition(
        0,
        1,
        this.printNumber(this.cadence.slope.up, 0),
        "Climbing avg cadence",
        this.units,
        "displayCadenceData"
      );
      this.insertContentAtGridPosition(
        1,
        1,
        this.printNumber(this.cadence.slope.flat, 0),
        "Flat avg cadence",
        this.units,
        "displayCadenceData"
      );
      this.insertContentAtGridPosition(
        2,
        1,
        this.printNumber(this.cadence.slope.down, 0),
        "Downhill avg cadence",
        this.units,
        "displayCadenceData"
      );
    }

    // Row 3
    this.insertContentAtGridPosition(0, 2, this.cadence.lowQ, "25% Cadence", "rpm", "displayCadenceData");
    this.insertContentAtGridPosition(1, 2, this.cadence.median, "50% Cadence", "rpm", "displayCadenceData");
    this.insertContentAtGridPosition(2, 2, this.cadence.upperQ, "75% Cadence", "rpm", "displayCadenceData");

    // Row 4
    this.insertContentAtGridPosition(0, 3, this.cadence.stdDev, "Std Deviation &sigma;", "rpm", "displayCadenceData");

    if (_.isNumber(this.cadence.distPerCycle)) {
      this.insertContentAtGridPosition(
        1,
        3,
        this.printNumber(this.cadence.distPerCycle, 2),
        "Avg Dist. / Crank Rev.",
        "M",
        "displayCadenceData"
      );
    }
  }
}
