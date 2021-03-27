import { ChangeDetectorRef, Component, Inject, OnInit } from "@angular/core";
import { ElectronService } from "../../../../desktop/electron/electron.service";
import { MatSnackBar } from "@angular/material/snack-bar";
import { MatDialogRef } from "@angular/material/dialog";
import { SyncService } from "../../../services/sync/sync.service";
import { DesktopSyncService } from "../../../services/sync/impl/desktop-sync.service";
import { DesktopBackupService } from "../../../../desktop/backup/desktop-backup.service";

@Component({
  selector: "app-desktop-restore-dialog",
  template: `
    <h2 *ngIf="!isRestoreProcessing" mat-dialog-title>Profile restore</h2>
    <mat-dialog-content class="mat-body-1">
      <!-- No restore processing: display form to user -->
      <div *ngIf="!isRestoreProcessing">
        <div>Your current data will be erased by the backup you are going to restore.</div>
        <mat-form-field fxFill>
          <input
            [(ngModel)]="backupFilePath"
            (click)="onUserFileSelection()"
            class="clickable"
            matInput
            placeholder="{{ backupFilePath ? 'Backup file to restore' : 'Choose a backup file to restore' }}"
            type="text"
            readonly
          />
          <button
            (click)="onUserFileSelection()"
            color="primary"
            mat-icon-button
            matTooltip="Browse backup file to restore"
            matSuffix
          >
            <mat-icon fontSet="material-icons-outlined">insert_drive_file</mat-icon>
          </button>
        </mat-form-field>
      </div>
      <!-- Restore processing: display progress -->
      <div class="progress" *ngIf="isRestoreProcessing">
        <div>
          <i>Restore in progress. App will be reloaded when done.</i>
        </div>
        <mat-progress-bar mode="determinate" [value]="restoreProgress"></mat-progress-bar>
        <div class="mat-title">
          <strong>{{ restoreProgress }}</strong
          >%
        </div>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions *ngIf="!isRestoreProcessing">
      <button (click)="onCancel()" color="primary" mat-dialog-close mat-stroked-button>Cancel</button>
      <span fxFlex="1"></span>
      <button (click)="onRestore()" *ngIf="backupFilePath" color="primary" mat-stroked-button>Restore</button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      mat-form-field {
        margin-top: 10px;
      }

      .progress {
        text-align: center;
      }

      mat-progress-bar {
        margin-top: 20px;
        margin-bottom: 20px;
      }

      .progress > div {
        margin-top: 10px;
        margin-bottom: 10px;
      }
    `
  ]
})
export class DesktopRestoreDialogComponent implements OnInit {
  public static readonly BACKUP_TYPE_NAME: string = "Elevate backup file";
  public static readonly MAX_WIDTH: string = "80%";
  public static readonly MIN_WIDTH: string = "40%";

  public isRestoreProcessing: boolean;
  public restoreProgress: number;
  public backupFilePath: string;

  constructor(
    @Inject(MatDialogRef) protected readonly dialogRef: MatDialogRef<DesktopRestoreDialogComponent>,
    @Inject(SyncService) protected readonly desktopSyncService: DesktopSyncService,
    @Inject(ElectronService) protected readonly electronService: ElectronService,
    @Inject(MatSnackBar) protected readonly snackBar: MatSnackBar,
    @Inject(ChangeDetectorRef) private readonly changeDetectorRef: ChangeDetectorRef
  ) {
    this.backupFilePath = null;
    this.isRestoreProcessing = false;
    this.restoreProgress = null;
  }

  public ngOnInit(): void {}

  public onUserFileSelection(): void {
    this.electronService
      .userFileSelection(DesktopBackupService.BACKUP_EXT, DesktopRestoreDialogComponent.BACKUP_TYPE_NAME)
      .then(file => {
        if (file) {
          this.configureBackupFile(file);
        }
      });
  }

  private configureBackupFile(filePath: string): void {
    this.isExistingFile(filePath).then(exists => {
      if (exists) {
        this.backupFilePath = filePath;
      } else {
        this.snackBar.open(`Backup file ${filePath} is invalid`);
      }
    });
  }

  private isExistingFile(path: string): Promise<boolean> {
    return this.electronService.existsSync(path);
  }

  public onRestore(): void {
    if (this.backupFilePath) {
      this.isRestoreProcessing = true;
      this.restoreProgress = 0;
      this.desktopSyncService.restore(this.backupFilePath).subscribe(
        restoreEvent => {
          this.restoreProgress = Math.floor((restoreEvent.restoredDocs / restoreEvent.totalDocs) * 100);
          this.changeDetectorRef.detectChanges();
        },
        error => {
          this.isRestoreProcessing = false;
          this.dialogRef
            .afterClosed()
            .toPromise()
            .then(() => this.snackBar.open(error, "Close"));
          this.dialogRef.close();
        }
      );
    }
  }

  public onCancel(): void {
    this.dialogRef.close();
  }
}
