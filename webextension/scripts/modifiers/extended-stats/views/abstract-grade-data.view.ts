import { Helper } from "../../../helper";
import { AbstractDataView } from "./abstract-data.view";
import { GradeStats } from "@elevate/shared/models/sync/activity.model";
import { Time } from "@elevate/shared/tools/time";

export abstract class AbstractGradeDataView extends AbstractDataView {
  protected grade: GradeStats;

  protected constructor(grade: GradeStats, units: string) {
    super(units);
    this.mainColor = [3, 167, 97];
    this.setGraphTitleFromUnits();
    this.grade = grade;
    this.setupDistributionGraph(this.grade.zones);
    this.setupDistributionTable(this.grade.zones);
    this.speedUnitsData = Helper.getSpeedUnitData(window.currentAthlete.get("measurement_preference"));
  }

  public render(): void {
    // Add a title
    this.content += this.generateSectionTitle(
      '<img src="' +
        this.appResources.areaChartIcon +
        '" style="vertical-align: baseline; height:20px;"/> GRADE <a target="_blank" href="' +
        this.appResources.settingsLink +
        '#/zonesSettings/grade" style="float: right;margin-right: 10px;"><img src="' +
        this.appResources.cogIcon +
        '" style="vertical-align: baseline; height:20px;"/></a>'
    );

    // Creates a grid
    this.makeGrid(3, 7); // (col, row)

    this.insertDataIntoGrid();
    this.generateCanvasForGraph();

    // Push grid, graph and table to content view
    this.injectToContent();
  }

  protected insertDataIntoGrid(): void {
    this.insertContentAtGridPosition(0, 0, this.grade.slopeProfile, "Grade Profile", "", "displayAdvancedGradeData");

    this.insertContentAtGridPosition(0, 1, this.grade.lowQ, "25% Quartile Grade", "%", "displayAdvancedGradeData");
    this.insertContentAtGridPosition(1, 1, this.grade.median, "50% Quartile Grade", "%", "displayAdvancedGradeData");
    this.insertContentAtGridPosition(2, 1, this.grade.upperQ, "75% Quartile Grade", "%", "displayAdvancedGradeData");

    this.insertContentAtGridPosition(
      0,
      2,
      this.printNumber((this.grade.slopeTime.up / this.grade.slopeTime.total) * 100, 1),
      "% climbing",
      "%",
      "displayAdvancedGradeData"
    );
    this.insertContentAtGridPosition(
      1,
      2,
      this.printNumber((this.grade.slopeTime.flat / this.grade.slopeTime.total) * 100, 1),
      "% flat",
      "%",
      "displayAdvancedGradeData"
    );
    this.insertContentAtGridPosition(
      2,
      2,
      this.printNumber((this.grade.slopeTime.down / this.grade.slopeTime.total) * 100, 1),
      "% downhill ",
      "%",
      "displayAdvancedGradeData"
    );

    this.insertContentAtGridPosition(
      0,
      3,
      Time.secToMilitary(this.grade.slopeTime.up),
      "Climbing time",
      "",
      "displayAdvancedGradeData"
    );
    this.insertContentAtGridPosition(
      1,
      3,
      Time.secToMilitary(this.grade.slopeTime.flat),
      "Flat time",
      "",
      "displayAdvancedGradeData"
    );
    this.insertContentAtGridPosition(
      2,
      3,
      Time.secToMilitary(this.grade.slopeTime.down),
      "Downhill time",
      "",
      "displayAdvancedGradeData"
    );

    const distanceUp: number = (this.grade.slopeDistance.up / 1000) * this.speedUnitsData.speedUnitFactor;
    const distanceFlat: number = (this.grade.slopeDistance.flat / 1000) * this.speedUnitsData.speedUnitFactor;
    const distanceDown: number = (this.grade.slopeDistance.down / 1000) * this.speedUnitsData.speedUnitFactor;

    this.insertContentAtGridPosition(
      0,
      5,
      distanceUp !== 0 ? distanceUp.toFixed(1) : "-",
      "Climbing distance",
      this.speedUnitsData.units,
      "displayAdvancedGradeData"
    );
    this.insertContentAtGridPosition(
      1,
      5,
      distanceFlat !== 0 ? distanceFlat.toFixed(1) : "-",
      "Flat distance",
      this.speedUnitsData.units,
      "displayAdvancedGradeData"
    );
    this.insertContentAtGridPosition(
      2,
      5,
      distanceDown !== 0 ? distanceDown.toFixed(1) : "-",
      "Downhill distance",
      this.speedUnitsData.units,
      "displayAdvancedGradeData"
    );

    this.insertContentAtGridPosition(
      0,
      6,
      this.printNumber(this.grade.avg, 1),
      "Avg grade",
      "%",
      "displayAdvancedGradeData"
    );
    this.insertContentAtGridPosition(
      1,
      6,
      this.printNumber(this.grade.max, 1),
      "Max uphill grade",
      "%",
      "displayAdvancedGradeData"
    );
    this.insertContentAtGridPosition(
      2,
      6,
      this.printNumber(this.grade.min, 1),
      "Max downhill grade",
      "%",
      "displayAdvancedGradeData"
    );
  }
}
