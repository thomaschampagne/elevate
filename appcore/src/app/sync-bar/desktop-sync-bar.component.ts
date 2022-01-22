import { ChangeDetectorRef, Component, HostBinding, Inject, OnInit } from "@angular/core";
import { DesktopSyncService } from "../shared/services/sync/impl/desktop-sync.service";
import { MatDialog } from "@angular/material/dialog";
import { DesktopErrorsSyncDetailsDialogComponent } from "./desktop-errors-sync-details-dialog.component";
import moment from "moment";
import { SyncBarComponent } from "./sync-bar.component";
import { SyncService } from "../shared/services/sync/sync.service";
import { SyncEvent } from "@elevate/shared/sync/events/sync.event";
import { SyncEventType } from "@elevate/shared/sync/events/sync-event-type";
import { ActivitySyncEvent } from "@elevate/shared/sync/events/activity-sync.event";
import { SyncException } from "@elevate/shared/exceptions/sync.exception";
import { ErrorSyncEvent } from "@elevate/shared/sync/events/error-sync.event";

class CurrentActivitySynced {
  public date: string;
  public name: string;
  public isNew: boolean;
}

@Component({
  selector: "app-desktop-sync-bar",
  template: `
    <div class="app-sync-bar">
      <div fxLayout="row" fxLayoutAlign="space-between center" class="ribbon">
        <div fxLayout="column" fxLayoutAlign="center start">
          <span fxFlex class="mat-body-1">
            <span *ngIf="currentActivitySynced">
              {{ currentActivitySynced.date }}: {{ currentActivitySynced.name }}
              <span class="activity-existence-tag">
                {{ currentActivitySynced.isNew ? "new" : "already exists" }}
              </span>
            </span>
            <span *ngIf="!currentActivitySynced && syncStatusText">{{ this.syncStatusText }}</span>
          </span>
          <span fxFlex class="mat-caption" *ngIf="activityCounter > 0">
            {{ activityCounter }} activities processed
          </span>
        </div>
        <div fxLayout="row" fxLayoutAlign="space-between center">
          <button
            *ngIf="eventErrors && eventErrors.length > 0"
            mat-flat-button
            color="warn"
            (click)="onActionShowWarnings()"
          >
            {{ eventErrors.length }} warning{{ eventErrors.length > 1 ? "s" : "" }}
          </button>
          <button *ngIf="isSyncing" mat-flat-button color="accent" (click)="onActionStop()" [disabled]="stopInProgress">
            <span *ngIf="!stopInProgress">Stop</span>
            <span *ngIf="stopInProgress">Please wait...</span>
          </button>
          <button *ngIf="!hiddenCloseButton" mat-icon-button (click)="onActionClose()">
            <mat-icon fontSet="material-icons-outlined">close</mat-icon>
          </button>
        </div>
      </div>
    </div>
    <mat-progress-bar *ngIf="isSyncing" mode="indeterminate"></mat-progress-bar>
  `,
  styles: [
    `
      .ribbon {
        padding: 10px 20px;
      }

      button {
        margin-left: 10px;
      }
    `
  ]
})
export class DesktopSyncBarComponent extends SyncBarComponent implements OnInit {
  @HostBinding("hidden")
  public hiddenBar: boolean;
  public hiddenCloseButton: boolean;
  public isSyncing: boolean;
  public syncStatusText: string;
  public currentActivitySynced: CurrentActivitySynced;
  public activityCounter: number;
  public eventErrors: ErrorSyncEvent[];
  public stopInProgress: boolean;

  constructor(
    @Inject(SyncService) private readonly desktopSyncService: DesktopSyncService,
    @Inject(MatDialog) private readonly dialog: MatDialog,
    @Inject(ChangeDetectorRef) private readonly changeDetectorRef: ChangeDetectorRef
  ) {
    super();
    this.hideSyncBar();
    this.hideCloseButton();
    this.isSyncing = false;
    this.syncStatusText = null;
    this.currentActivitySynced = null;
    this.resetCounter();
    this.eventErrors = [];
    this.stopInProgress = false;
  }

  public ngOnInit(): void {
    this.desktopSyncService.syncEvents$.subscribe((syncEvent: SyncEvent) => {
      this.handleSyncEventDisplay(syncEvent);
    });

    this.changeDetectorRef.detach();
  }

  public onActionStop(): Promise<void> {
    this.stopInProgress = true;
    return this.desktopSyncService
      .stop()
      .then(() => {
        this.stopInProgress = false;
      })
      .catch(error => {
        this.stopInProgress = false;
        throw new SyncException(error); // Should be caught by Error Handler
      });
  }

  public onActionClose(): void {
    this.hideSyncBar();
  }

  public onActionShowWarnings(): void {
    this.dialog.open(DesktopErrorsSyncDetailsDialogComponent, {
      minWidth: DesktopErrorsSyncDetailsDialogComponent.MIN_WIDTH,
      maxWidth: DesktopErrorsSyncDetailsDialogComponent.MAX_WIDTH,
      data: this.eventErrors
    });
  }

  public handleSyncEventDisplay(syncEvent: SyncEvent) {
    this.changeDetectorRef.markForCheck();

    if (syncEvent.type === SyncEventType.STARTED) {
      this.onStartedSyncEvent(syncEvent);
    }

    if (syncEvent.type === SyncEventType.ACTIVITY) {
      this.onActivitySyncEvent(syncEvent);
    } else {
      this.currentActivitySynced = null;
    }

    if (syncEvent.type === SyncEventType.GENERIC) {
      this.onGenericSyncEvent(syncEvent);
    }

    if (syncEvent.type === SyncEventType.ERROR) {
      this.onErrorSyncEvent(syncEvent as ErrorSyncEvent);
    }

    if (syncEvent.type === SyncEventType.STOPPED) {
      this.onStoppedSyncEvent(syncEvent);
    }

    if (syncEvent.type === SyncEventType.COMPLETE) {
      this.onCompleteSyncEvent(syncEvent);
    }

    this.changeDetectorRef.detectChanges();
  }

  private onStartedSyncEvent(syncEvent: SyncEvent): void {
    this.eventErrors = [];
    this.showSyncBar();
    this.hideCloseButton();
    this.isSyncing = true;
    this.resetCounter();
    this.syncStatusText = `Sync started on connector "${syncEvent.fromConnectorType.toLowerCase()}"`;
  }

  private onActivitySyncEvent(syncEvent: SyncEvent): void {
    this.activityCounter++;
    const activitySyncEvent = syncEvent as ActivitySyncEvent;
    this.currentActivitySynced = {
      date: moment(activitySyncEvent.activity.startTime).format("ll"),
      name: activitySyncEvent.activity.name,
      isNew: activitySyncEvent.isNew
    };
  }

  private onGenericSyncEvent(syncEvent: SyncEvent): void {
    this.syncStatusText = syncEvent.description;
  }

  private onErrorSyncEvent(errorSyncEvent: ErrorSyncEvent): void {
    this.eventErrors.push(errorSyncEvent);
  }

  private onStoppedSyncEvent(syncEvent: SyncEvent): void {
    this.syncStatusText = 'Sync stopped on connector "' + syncEvent.fromConnectorType.toLowerCase() + '"';
    this.onSyncEnded();
  }

  private onCompleteSyncEvent(syncEvent: SyncEvent): void {
    this.syncStatusText = 'Sync completed on connector "' + syncEvent.fromConnectorType.toLowerCase() + '"';
    this.onSyncEnded();
  }

  private onSyncEnded(): void {
    this.isSyncing = false;
    this.showCloseButton();
  }

  private showSyncBar(): void {
    this.hiddenBar = false;
  }

  private hideSyncBar(): void {
    this.hiddenBar = true;
  }

  private showCloseButton(): void {
    this.hiddenCloseButton = false;
  }

  private hideCloseButton(): void {
    this.hiddenCloseButton = true;
  }

  private resetCounter(): void {
    this.activityCounter = 0;
  }
}
