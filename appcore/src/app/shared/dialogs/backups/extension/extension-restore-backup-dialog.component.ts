import { Component, Inject, OnInit } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import _ from "lodash";
import { ExtensionBackupModel } from "../../../models/extension-backup.model";

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
  `
})
export class ExtensionRestoreBackupDialogComponent implements OnInit {
  constructor(
    @Inject(MatDialogRef) protected readonly dialogRef: MatDialogRef<ExtensionRestoreBackupDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public mode: string
  ) {}

  public static readonly MAX_WIDTH: string = "80%";
  public static readonly MIN_WIDTH: string = "40%";

  public file: File;
  public displayName: string;
  public displaySize: string;
  public readonly fileExt: string = ".json";

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
        const extensionBackupModel: ExtensionBackupModel = JSON.parse(
          (event.target as IDBRequest).result
        ) as ExtensionBackupModel;
        this.dialogRef.close(extensionBackupModel);
      };
    }
  }
}
