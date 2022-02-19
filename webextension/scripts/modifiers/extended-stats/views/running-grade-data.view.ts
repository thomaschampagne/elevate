import { Helper } from "../../../helper";
import { AbstractGradeDataView } from "./abstract-grade-data.view";
import { Time } from "@elevate/shared/tools/time";
import { GradeStats } from "@elevate/shared/models/sync/activity.model";

export class RunningGradeDataView extends AbstractGradeDataView {
  constructor(grade: GradeStats, units: string) {
    super(grade, units);
  }

  protected insertDataIntoGrid(): void {
    super.insertDataIntoGrid();

    this.grade.slopeSpeed.up = Helper.convertSpeedToPace(this.grade.slopeSpeed.up);
    this.grade.slopeSpeed.flat = Helper.convertSpeedToPace(this.grade.slopeSpeed.flat);
    this.grade.slopeSpeed.down = Helper.convertSpeedToPace(this.grade.slopeSpeed.down);

    this.insertContentAtGridPosition(
      0,
      4,
      this.grade.slopeSpeed.up / this.speedUnitsData.speedUnitFactor !== 0
        ? Time.secToMilitary(this.grade.slopeSpeed.up / this.speedUnitsData.speedUnitFactor)
        : "-",
      "Avg climbing pace",
      "/" + this.speedUnitsData.units,
      "displayAdvancedGradeData"
    );
    this.insertContentAtGridPosition(
      1,
      4,
      this.grade.slopeSpeed.flat / this.speedUnitsData.speedUnitFactor !== 0
        ? Time.secToMilitary(this.grade.slopeSpeed.flat / this.speedUnitsData.speedUnitFactor)
        : "-",
      "Avg flat pace",
      "/" + this.speedUnitsData.units,
      "displayAdvancedGradeData"
    );
    this.insertContentAtGridPosition(
      2,
      4,
      this.grade.slopeSpeed.down / this.speedUnitsData.speedUnitFactor !== 0
        ? Time.secToMilitary(this.grade.slopeSpeed.down / this.speedUnitsData.speedUnitFactor)
        : "-",
      "Avg downhill pace",
      "/" + this.speedUnitsData.units,
      "displayAdvancedGradeData"
    );
  }
}
