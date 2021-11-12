import { Component, Inject } from "@angular/core";
import { SyncService } from "../shared/services/sync/sync.service";
import { SyncState } from "../shared/services/sync/sync-state.enum";
import { AppService } from "../shared/services/app-service/app.service";

@Component({
  selector: "app-sync-required",
  template: `
    <mat-card *ngIf="isSynced === false">
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
export class SyncRequiredComponent {
  public isSynced: boolean;

  constructor(
    @Inject(AppService) public readonly appService: AppService,
    @Inject(SyncService) protected readonly syncService: SyncService<any>
  ) {
    this.syncService.getSyncState().then((syncState: SyncState) => {
      this.isSynced = syncState >= SyncState.PARTIALLY_SYNCED;
    });
  }

  public syncRedirect(): void {
    this.syncService.redirect();
  }
}
