import { Component, Inject, OnInit } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import _ from "lodash";
import { ExtensionDumpModel } from "../../../models/dumps/extension-dump.model";

@Component({
  selector: "app-import-backup-dialog",
  template: `
    <h2 mat-dialog-title>Import activities</h2>
    <mat-dialog-content class="mat-body-1">
      <div *ngIf="!file">
        <button (click)="fileInput.click()" color="primary" mat-stroked-button>
          Choose backup file
          <input
            #fileInput
            (change)="onFileSelected($event.target.files[0])"
            [hidden]="true"
            type="file"
            accept="{{ fileExt }}"
          />
        </button>
      </div>

      <div *ngIf="file">
        <div>
          Filename: <i>{{ displayName }} </i>
        </div>
        <div>
          Size: <i>{{ displaySize }} </i>
        </div>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions>
      <button (click)="onCancel()" color="primary" mat-dialog-close mat-stroked-button>Cancel</button>
      <span fxFlex="1"></span>
      <button (click)="onRestore()" *ngIf="file" color="primary" mat-stroked-button>Restore</button>
    </mat-dialog-actions>
  `,
  styles: [``]
})
export class ExtensionImportBackupDialogComponent implements OnInit {
  constructor(
    @Inject(MatDialogRef) protected readonly dialogRef: MatDialogRef<ExtensionImportBackupDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public mode: string
  ) {
    this.isImportMode = mode === ExtensionImportBackupDialogComponent.MODE_IMPORT;
    this.isExportMode = !this.isImportMode;
  }

  public static readonly MAX_WIDTH: string = "80%";
  public static readonly MIN_WIDTH: string = "40%";
  public static readonly MODE_IMPORT: string = "MODE_IMPORT";
  public static readonly MODE_EXPORT: string = "MODE_EXPORT";

  public file: File;
  public displayName: string;
  public displaySize: string;
  public readonly fileExt: string = ".json";

  public isImportMode: boolean;
  public isExportMode: boolean;

  public ngOnInit(): void {
    this.file = null;
  }

  public onCancel(): void {
    this.dialogRef.close(null);
  }

  public onFileSelected(file: File): void {
    this.file = file;
    this.displayName = this.file.name;
    this.displaySize = _.floor(this.file.size / (1024 * 1024), 2) + " MB";
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
