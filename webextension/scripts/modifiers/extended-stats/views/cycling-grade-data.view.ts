import _ from "lodash";
import { AbstractGradeDataView } from "./abstract-grade-data.view";
import { GradeStats } from "@elevate/shared/models/sync/activity.model";

export class CyclingGradeDataView extends AbstractGradeDataView {
  constructor(grade: GradeStats, units: string) {
    super(grade, units);
  }

  protected insertDataIntoGrid(): void {
    super.insertDataIntoGrid();

    const avgClimbingSpeed: number = this.grade.slopeSpeed.up * this.speedUnitsData.speedUnitFactor;
    const avgFlatSpeed: number = this.grade.slopeSpeed.flat * this.speedUnitsData.speedUnitFactor;
    const avgDownhillSpeed: number = this.grade.slopeSpeed.down * this.speedUnitsData.speedUnitFactor;

    this.insertContentAtGridPosition(
      0,
      4,
      _.isNaN(avgClimbingSpeed) || avgClimbingSpeed.toString() === "NaN" ? "-" : this.printNumber(avgClimbingSpeed, 1),
      "Avg climbing speed",
      this.speedUnitsData.speedUnitPerHour,
      "displayAdvancedGradeData"
    );
    this.insertContentAtGridPosition(
      1,
      4,
      _.isNaN(avgFlatSpeed) || avgFlatSpeed.toString() === "NaN" ? "-" : this.printNumber(avgFlatSpeed, 1),
      "Avg flat speed",
      this.speedUnitsData.speedUnitPerHour,
      "displayAdvancedGradeData"
    );
    this.insertContentAtGridPosition(
      2,
      4,
      _.isNaN(avgDownhillSpeed) || avgDownhillSpeed.toString() === "NaN" ? "-" : this.printNumber(avgDownhillSpeed, 1),
      "Avg downhill speed",
      this.speedUnitsData.speedUnitPerHour,
      "displayAdvancedGradeData"
    );
  }
}
