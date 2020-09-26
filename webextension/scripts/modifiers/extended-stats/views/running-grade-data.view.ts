import { Helper } from "../../../helper";
import { AbstractGradeDataView } from "./abstract-grade-data.view";
import { GradeDataModel } from "@elevate/shared/models";
import { Time } from "@elevate/shared/tools";

export class RunningGradeDataView extends AbstractGradeDataView {
  constructor(gradeData: GradeDataModel, units: string) {
    super(gradeData, units);
  }

  protected insertDataIntoGrid(): void {
    super.insertDataIntoGrid();

    this.gradeData.upFlatDownMoveData.up = Helper.convertSpeedToPace(this.gradeData.upFlatDownMoveData.up);
    this.gradeData.upFlatDownMoveData.flat = Helper.convertSpeedToPace(this.gradeData.upFlatDownMoveData.flat);
    this.gradeData.upFlatDownMoveData.down = Helper.convertSpeedToPace(this.gradeData.upFlatDownMoveData.down);

    this.insertContentAtGridPosition(
      0,
      4,
      this.gradeData.upFlatDownMoveData.up / this.speedUnitsData.speedUnitFactor !== 0
        ? Time.secToMilitary(this.gradeData.upFlatDownMoveData.up / this.speedUnitsData.speedUnitFactor)
        : "-",
      "Avg climbing pace",
      "/" + this.speedUnitsData.units,
      "displayAdvancedGradeData"
    );
    this.insertContentAtGridPosition(
      1,
      4,
      this.gradeData.upFlatDownMoveData.flat / this.speedUnitsData.speedUnitFactor !== 0
        ? Time.secToMilitary(this.gradeData.upFlatDownMoveData.flat / this.speedUnitsData.speedUnitFactor)
        : "-",
      "Avg flat pace",
      "/" + this.speedUnitsData.units,
      "displayAdvancedGradeData"
    );
    this.insertContentAtGridPosition(
      2,
      4,
      this.gradeData.upFlatDownMoveData.down / this.speedUnitsData.speedUnitFactor !== 0
        ? Time.secToMilitary(this.gradeData.upFlatDownMoveData.down / this.speedUnitsData.speedUnitFactor)
        : "-",
      "Avg downhill pace",
      "/" + this.speedUnitsData.units,
      "displayAdvancedGradeData"
    );
  }
}
