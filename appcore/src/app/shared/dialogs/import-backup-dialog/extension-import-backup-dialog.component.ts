import { Component, Inject, OnInit } from "@angular/core";
import { MatDialogRef } from "@angular/material/dialog";
import { ExtensionDumpModel } from "../../models/dumps/extension-dump.model";
import { ImportBackupDialogComponent } from "./import-backup-dialog.component";

@Component({
  selector: "app-import-backup-dialog",
  templateUrl: "./import-backup-dialog.component.html",
  styleUrls: ["./import-backup-dialog.component.scss"]
})
export class ExtensionImportBackupDialogComponent extends ImportBackupDialogComponent implements OnInit {
  constructor(@Inject(MatDialogRef) protected readonly dialogRef: MatDialogRef<ExtensionImportBackupDialogComponent>) {
    super(dialogRef);
  }

  public onRestore(): void {
    if (this.file) {
      // Reading file, when load, import it
      const reader = new FileReader();
      reader.readAsText(this.file);
      reader.onload = (event: Event) => {
        const extensionDumpModel: ExtensionDumpModel = JSON.parse(
          (event.target as IDBRequest).result
        ) as ExtensionDumpModel;
        this.dialogRef.close(extensionDumpModel);
      };
    }
  }
}
