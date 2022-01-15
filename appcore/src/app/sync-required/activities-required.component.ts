import { Component, Inject, OnDestroy, OnInit } from "@angular/core";
import { SyncService } from "../shared/services/sync/sync.service";
import { AppService } from "../shared/services/app-service/app.service";
import { ActivityService } from "../shared/services/activity/activity.service";
import { Subscription } from "rxjs";

@Component({
  selector: "app-activities-required",
  template: `
    <mat-card *ngIf="hasActivities === false">
      <mat-card-title>Missing activities</mat-card-title>
      <mat-card-content>
        <div>This feature requires activities and none has been found.</div>
        <div>
          <button [disabled]="appService.isSyncing" (click)="syncRedirect()" color="primary" mat-flat-button>
            Sync your activities
          </button>
        </div>
      </mat-card-content>
    </mat-card>
  `,
  styles: [
    `
      mat-card-content,
      div {
        margin-bottom: 20px;
        margin-top: 20px;
      }
    `
  ]
})
export class ActivitiesRequiredComponent implements OnInit, OnDestroy {
  public hasActivities: boolean;
  private historyChangesSub: Subscription;

  constructor(
    @Inject(AppService) public readonly appService: AppService,
    @Inject(ActivityService) private readonly activityService: ActivityService,
    @Inject(SyncService) protected readonly syncService: SyncService<any>
  ) {
    this.activityService.count().then((count: number) => {
      this.hasActivities = count > 0;
    });
  }

  public ngOnInit(): void {
    this.historyChangesSub = this.appService.historyChanges$.subscribe({
      next: () => {
        this.activityService.count().then((count: number) => {
          this.hasActivities = count > 0;
        });
      }
    });
  }

  public syncRedirect(): void {
    this.syncService.redirect();
  }

  public ngOnDestroy(): void {
    this.historyChangesSub.unsubscribe();
  }
}
