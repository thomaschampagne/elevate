import { Component, Inject, OnInit } from "@angular/core";
import { MatDialogRef } from "@angular/material/dialog";
import { ImportBackupDialogComponent } from "./import-backup-dialog.component";

@Component({
  selector: "app-import-backup-dialog",
  templateUrl: "./import-backup-dialog.component.html",
  styleUrls: ["./import-backup-dialog.component.scss"]
})
export class DesktopImportBackupDialogComponent extends ImportBackupDialogComponent implements OnInit {
  constructor(@Inject(MatDialogRef) protected readonly dialogRef: MatDialogRef<DesktopImportBackupDialogComponent>) {
    super(dialogRef);
  }

  public onRestore(): void {
    if (this.file) {
      this.dialogRef.close(this.file);
    }
  }
}
