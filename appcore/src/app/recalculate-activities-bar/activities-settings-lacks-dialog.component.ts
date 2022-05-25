import { Component, Inject, OnInit } from "@angular/core";
import { MAT_DIALOG_DATA } from "@angular/material/dialog";
import { MatTableDataSource } from "@angular/material/table";
import _ from "lodash";
import { Activity } from "@elevate/shared/models/sync/activity.model";
import { ElevateSport } from "@elevate/shared/enums/elevate-sport.enum";

@Component({
  selector: "app-activities-settings-lacks-dialog",
  template: `
    <h2 mat-dialog-title>
      Detected {{ activities.length }} activit{{ activities.length > 1 ? "ies" : "y" }} with missing stress scores due
      to lack of functional thresholds
    </h2>
    <div class="mat-h3">
      ➞ Please provide your functional thresholds in dated athlete settings to cover below activit{{
        activities.length > 1 ? "ies" : "y"
      }}
    </div>
    <mat-dialog-content class="mat-body-1">
      <table mat-table [dataSource]="dataSource">
        <!-- Date Column -->
        <ng-container matColumnDef="date">
          <th mat-header-cell *matHeaderCellDef>Date</th>
          <td mat-cell *matCellDef="let activity">{{ activity.startTime | date }}</td>
        </ng-container>

        <!-- Type Column -->
        <ng-container matColumnDef="type" width="130px">
          <th mat-header-cell *matHeaderCellDef>Type</th>
          <td mat-cell *matCellDef="let activity">{{ activity.type }}</td>
        </ng-container>

        <!-- Name Column -->
        <ng-container matColumnDef="name">
          <th mat-header-cell *matHeaderCellDef>Name</th>
          <td mat-cell *matCellDef="let activity">{{ activity.name }}</td>
        </ng-container>

        <!-- Lack Of -->
        <ng-container matColumnDef="lackof">
          <th mat-header-cell *matHeaderCellDef>Lack Of</th>
          <td mat-cell *matCellDef="let activity">
            <span *ngIf="activity.type === ElevateSport.Ride || activity.type === ElevateSport.VirtualRide"
              >Cycling FTP</span
            >
            <span *ngIf="activity.type === ElevateSport.Run || activity.type === ElevateSport.VirtualRun"
              >Running FTP</span
            >
            <span *ngIf="activity.type === ElevateSport.Swim">Swimming FTP</span>
          </td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="displayedColumns; sticky: true"></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
      </table>
    </mat-dialog-content>
    <mat-dialog-actions>
      <button color="primary" mat-dialog-close mat-stroked-button>Close</button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      mat-dialog-content {
        overflow: auto;
      }

      table {
        width: 100%;
      }
    `
  ]
})
export class ActivitiesSettingsLacksDialogComponent implements OnInit {
  public static readonly MIN_WIDTH: string = "50%";

  public readonly displayedColumns: string[] = ["date", "type", "name", "lackof"];
  public readonly ElevateSport = ElevateSport;

  public dataSource: MatTableDataSource<Activity>;

  constructor(@Inject(MAT_DIALOG_DATA) public activities: Activity[]) {}

  public ngOnInit(): void {
    this.dataSource = new MatTableDataSource();
    this.dataSource.data = _.sortBy(this.activities, (activity: Activity) => {
      return activity.startTime;
    });
  }
}
