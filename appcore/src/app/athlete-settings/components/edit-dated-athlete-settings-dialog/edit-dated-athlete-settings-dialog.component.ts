import { Component, Inject, OnInit } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import moment from "moment";
import { DatedAthleteSettingsDialogData } from "./dated-athlete-settings-dialog-data.model";
import { DatedAthleteSettingsAction } from "./dated-athlete-settings-action.enum";
import _ from "lodash";
import { DatedAthleteSettings } from "@elevate/shared/models/athlete/athlete-settings/dated-athlete-settings.model";

@Component({
  selector: "app-edit-dated-athlete-settings-dialog",
  templateUrl: "./edit-dated-athlete-settings-dialog.component.html",
  styleUrls: ["./edit-dated-athlete-settings-dialog.component.scss"]
})
export class EditDatedAthleteSettingsDialogComponent implements OnInit {
  public static readonly WIDTH: string = "60%";

  public sinceDate: Date;

  public datedAthleteSettings: DatedAthleteSettings;

  public DatedAthleteSettingsAction = DatedAthleteSettingsAction;

  constructor(
    @Inject(MatDialogRef) private readonly dialogRef: MatDialogRef<EditDatedAthleteSettingsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public readonly data: DatedAthleteSettingsDialogData
  ) {}

  public ngOnInit(): void {
    this.datedAthleteSettings = DatedAthleteSettings.asInstance(_.cloneDeep(this.data.datedAthleteSettings));
    this.sinceDate = moment(this.datedAthleteSettings.since).toDate();
  }

  public onAthleteSettingsModelChanged(datedAthleteSettings: DatedAthleteSettings): void {
    this.datedAthleteSettings = datedAthleteSettings;
  }

  public onDateChange(): void {
    this.datedAthleteSettings.since = moment(this.sinceDate).format(DatedAthleteSettings.SINCE_DATE_FORMAT);
  }

  public onConfirm(): void {
    this.dialogRef.close(this.datedAthleteSettings);
  }

  public onCancel(): void {
    this.dialogRef.close();
  }
}
