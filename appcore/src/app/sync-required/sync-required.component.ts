import { Component } from "@angular/core";
import { SyncService } from "../shared/services/sync/sync.service";
import { SyncState } from "../shared/services/sync/sync-state.enum";

@Component({
  selector: "app-sync-required",
  template: `
    <mat-card *ngIf="isSynced === false">
      <mat-card-title>Missing activities</mat-card-title>
      <mat-card-content>
        <div>This feature requires activities and none has been found.</div>
        <div>
          <button (click)="syncRedirect()" color="primary" mat-stroked-button>Sync your activities</button>
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

  constructor(protected readonly syncService: SyncService<any>) {
    this.syncService.getSyncState().then((syncState: SyncState) => {
      this.isSynced = syncState >= SyncState.PARTIALLY_SYNCED;
    });
  }

  public syncRedirect(): void {
    this.syncService.redirect();
  }
}
