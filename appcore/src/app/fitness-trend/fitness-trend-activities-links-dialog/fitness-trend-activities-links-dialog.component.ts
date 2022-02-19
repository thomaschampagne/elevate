import { Component, Inject, OnInit } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { DayFitnessTrendModel } from "../shared/models/day-fitness-trend.model";
import {
  OPEN_RESOURCE_RESOLVER,
  OpenResourceResolver
} from "../../shared/services/links-opener/open-resource-resolver";

@Component({
  selector: "app-fitness-trend-activities-links-dialog",
  templateUrl: "./fitness-trend-activities-links-dialog.component.html",
  styleUrls: ["./fitness-trend-activities-links-dialog.component.scss"]
})
export class FitnessTrendActivitiesLinksDialogComponent implements OnInit {
  public static readonly MAX_WIDTH: string = "80%";
  public static readonly MIN_WIDTH: string = "40%";

  constructor(
    @Inject(MatDialogRef) private readonly dialogRef: MatDialogRef<FitnessTrendActivitiesLinksDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public readonly dayFitnessTrendModel: DayFitnessTrendModel,
    @Inject(OPEN_RESOURCE_RESOLVER) private readonly openResourceResolver: OpenResourceResolver
  ) {}

  public ngOnInit(): void {}

  public openActivity(activityId: number): void {
    this.openResourceResolver.openActivity(activityId);
    this.dialogRef.close();
  }
}
