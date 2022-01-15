import _ from "lodash";
import { AbstractCadenceDataView } from "./abstract-cadence-data.view";
import { UserSettings } from "@elevate/shared/models/user-settings/user-settings.namespace";
import { CadenceStats } from "@elevate/shared/models/sync/activity.model";
import ExtensionUserSettings = UserSettings.ExtensionUserSettings;

export class RunningCadenceDataView extends AbstractCadenceDataView {
  protected userSettings: ExtensionUserSettings;

  constructor(cadence: CadenceStats, units: string, userSettings: ExtensionUserSettings) {
    if (userSettings.enableBothLegsCadence) {
      // Create a deep clone in memory to avoid values doubled on each reload
      const cadenceClone: CadenceStats = _.cloneDeep(cadence);

      // Then multiply cadence per 2
      cadenceClone.avgActive *= 2;
      cadenceClone.lowQ *= 2;
      cadenceClone.median *= 2;
      cadenceClone.upperQ *= 2;

      if (cadenceClone.slope) {
        cadenceClone.slope.up *= 2;
        cadenceClone.slope.flat *= 2;
        cadenceClone.slope.down *= 2;
      }

      for (const zone in cadenceClone.zones) {
        cadenceClone.zones[zone].from *= 2;
        cadenceClone.zones[zone].to *= 2;
      }
      super(cadenceClone, units);
    } else {
      super(cadence, units);
    }

    this.userSettings = userSettings;

    this.setGraphTitleFromUnits();
  }

  public render(): void {
    // Add legs cadence type to view title
    this.content += this.generateSectionTitle(
      '<img src="' +
        this.appResources.circleNotchIcon +
        '" style="vertical-align: baseline; height:20px;"/> CADENCE @ ' +
        (this.userSettings.enableBothLegsCadence ? "2 legs" : "1 leg") +
        ' <a target="_blank" href="' +
        this.appResources.settingsLink +
        '#/zonesSettings/runningCadence" style="float: right;margin-right: 10px;"><img src="' +
        this.appResources.cogIcon +
        '" style="vertical-align: baseline; height:20px;"/></a>'
    );
    super.render();
  }

  protected insertDataIntoGrid(): void {
    super.insertDataIntoGrid();

    const hasHasPerCadenceOccurrence = _.isNumber(this.cadence.distPerCycle) && !_.isNaN(this.cadence.distPerCycle);

    // Row 0
    this.insertContentAtGridPosition(
      0,
      0,
      this.printNumber(this.cadence.avgActive, 1),
      "Active Avg Cadence",
      this.units,
      "displayCadenceData"
    );
    if (hasHasPerCadenceOccurrence) {
      this.insertContentAtGridPosition(
        1,
        0,
        this.printNumber(this.cadence.distPerCycle, 2),
        "Avg Stride length",
        "M",
        "displayCadenceData"
      );
    }
    this.insertContentAtGridPosition(
      2,
      0,
      this.printNumber(this.cadence.cycles, 0),
      "Total steps",
      "",
      "displayCadenceData"
    );

    // Row 1
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

    // Row 2
    this.insertContentAtGridPosition(0, 2, this.cadence.lowQ, "25% Cadence", this.units, "displayCadenceData");
    this.insertContentAtGridPosition(1, 2, this.cadence.median, "50% Cadence", this.units, "displayCadenceData");
    this.insertContentAtGridPosition(2, 2, this.cadence.upperQ, "75% Cadence", this.units, "displayCadenceData");

    // Row 3
    if (_.isNumber(this.cadence.distPerCycle)) {
      this.insertContentAtGridPosition(
        0,
        3,
        this.printNumber(this.cadence.distPerCycle, 2),
        "Avg Stride Length",
        "M",
        "displayCadenceData"
      );
    }
  }
}
