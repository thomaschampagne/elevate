import { Component, Inject, OnInit } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { ConfirmDialogDataModel } from "./confirm-dialog-data.model";
import { Observable } from "rxjs";
import { countdown } from "@elevate/shared/tools";

@Component({
  selector: "app-confirm-dialog",
  templateUrl: "./confirm-dialog.component.html",
  styleUrls: ["./confirm-dialog.component.scss"]
})
export class ConfirmDialogComponent implements OnInit {
  public static readonly MAX_WIDTH: string = "80%";
  public static readonly MIN_WIDTH: string = "40%";

  public html: string;
  public confirmCountdown$: Observable<number>;

  constructor(
    @Inject(MatDialogRef) private readonly dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public readonly dialogData: ConfirmDialogDataModel
  ) {}

  public ngOnInit() {
    if (this.dialogData.confirmTimeout > 0) {
      this.dialogRef.disableClose = this.dialogRef.disableClose !== undefined ? this.dialogRef.disableClose : true;
      this.confirmCountdown$ = countdown(this.dialogData.confirmTimeout);

      if (this.dialogData.confirmTimeoutEnded) {
        this.confirmCountdown$.toPromise().then(() => {
          this.dialogData.confirmTimeoutEnded();
        });
      }
    }
  }

  public onConfirm() {
    this.dialogRef.close(true);
  }

  public onCancel() {
    this.dialogRef.close(false);
  }
}
