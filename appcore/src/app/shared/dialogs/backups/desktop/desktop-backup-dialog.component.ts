import { Component, Inject, OnInit } from "@angular/core";
import { MatDialogRef } from "@angular/material/dialog";
import { ElectronService } from "../../../../desktop/electron/electron.service";
import { MatSnackBar } from "@angular/material/snack-bar";
import { SyncService } from "../../../services/sync/sync.service";
import { DesktopSyncService } from "../../../services/sync/impl/desktop-sync.service";
import { ElevateException } from "@elevate/shared/exceptions/elevate.exception";
import { BackupEvent } from "@elevate/shared/models/backup/backup-event.int";

@Component({
  selector: "app-import-backup-dialog",
  template: `
    <h2 *ngIf="!isBackupProcessing" mat-dialog-title>Profile backup</h2>
    <mat-dialog-content class="mat-body-1">
      <!-- No backup processing: display form to user -->
      <div *ngIf="!isBackupProcessing">
        <div>
          An Elevate backup (.elv) includes the following data:
          <ul>
            <li>Activities with sensors data</li>
            <li>Global settings</li>
            <li>Athlete settings</li>
            <li>Zone settings</li>
            <li>Year progression presets</li>
            <li>Connectors information (except file connector)</li>
          </ul>
        </div>
        <mat-form-field fxFill>
          <input
            [(ngModel)]="outputDirectory"
            (click)="onUserDirectorySelection()"
            matInput
            class="clickable"
            placeholder="{{ outputDirectory ? 'Output directory' : 'Choose an output directory for your backup' }}"
            type="text"
            readonly
          />
          <button
            *ngIf="outputDirectory"
            (click)="onUserDirectoryOpen()"
            color="primary"
            matTooltip="Locate output directory"
            mat-icon-button
            matSuffix
          >
            <mat-icon fontSet="material-icons-outlined">gps_fixed</mat-icon>
          </button>
          <button
            (click)="onUserDirectorySelection()"
            color="primary"
            mat-icon-button
            matTooltip="Browse output directory"
            matSuffix
          >
            <mat-icon fontSet="material-icons-outlined">folder_open</mat-icon>
          </button>
        </mat-form-field>
      </div>
      <!-- Backup processing: display progress -->
      <div class="progress" *ngIf="isBackupProcessing">
        <div>
          <i>Backup in progress. Don't close the application.</i>
        </div>
        <mat-progress-bar mode="determinate" [value]="backupProgress"></mat-progress-bar>
        <div class="mat-title">
          <strong>{{ backupProgress }}</strong
          >%
        </div>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions *ngIf="!isBackupProcessing">
      <button (click)="onCancel()" color="primary" mat-dialog-close mat-stroked-button>Cancel</button>
      <span fxFlex="1"></span>
      <button (click)="onBackup()" *ngIf="outputDirectory" color="primary" mat-stroked-button>Start Backup</button>
    </mat-dialog-actions>
  `,
  styles: [
    `
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
export class DesktopBackupDialogComponent implements OnInit {
  public static readonly MAX_WIDTH: string = "80%";
  public static readonly MIN_WIDTH: string = "40%";

  public outputDirectory: string;
  public backupFilePath: string;
  public isBackupProcessing: boolean;
  public backupProgress: number;

  constructor(
    @Inject(MatDialogRef) protected readonly dialogRef: MatDialogRef<DesktopBackupDialogComponent>,
    @Inject(SyncService) protected readonly desktopSyncService: DesktopSyncService,
    @Inject(MatSnackBar) protected readonly snackBar: MatSnackBar,
    @Inject(ElectronService) protected readonly electronService: ElectronService
  ) {
    this.outputDirectory = null;
    this.backupFilePath = null;
    this.isBackupProcessing = false;
    this.backupProgress = null;
  }

  public ngOnInit(): void {}

  public onUserDirectoryOpen(): void {
    this.electronService.openItem(this.outputDirectory);
  }

  public onUserDirectorySelection(): void {
    this.electronService.userDirectorySelection().then(directory => {
      if (directory) {
        this.configureSourceDirectory(directory);
      }
    });
  }

  public configureSourceDirectory(path: string): void {
    this.isExistingFolder(path).then(isExistingFolder => {
      if (isExistingFolder) {
        this.outputDirectory = path;
      } else {
        this.snackBar.open(`Directory ${path} is invalid`);
      }
    });
  }

  private isExistingFolder(path: string): Promise<boolean> {
    return this.electronService.isDirectory(path);
  }

  public onBackup(): void {
    if (this.outputDirectory) {
      this.isBackupProcessing = true;
      this.backupProgress = 0;
      this.desktopSyncService.backup(this.outputDirectory).subscribe(
        (backupEvent: BackupEvent) => {
          this.backupProgress = Math.floor((backupEvent.savedDocs / backupEvent.totalDocs) * 100);

          if (backupEvent.file) {
            this.backupFilePath = backupEvent.file;
          }
        },
        error => {
          throw new ElevateException(error);
        },
        () => {
          this.dialogRef.close(this.backupFilePath);
        }
      );
    }
  }

  public onCancel(): void {
    this.dialogRef.close(null);
  }

  public viewBackupFileLocation(): void {
    this.electronService.showItemInFolder(this.backupFilePath);
  }
}
