import { ChangeDetectorRef, Component, HostBinding, InjectionToken, OnInit } from "@angular/core";
import { DesktopSyncService } from "../shared/services/sync/impl/desktop-sync.service";
import { ActivitySyncEvent, ErrorSyncEvent, SyncEvent, SyncEventType } from "@elevate/shared/sync";
import { SyncException } from "@elevate/shared/exceptions";
import moment from "moment";
import { MatDialog } from "@angular/material/dialog";
import { DesktopErrorsSyncDetailsDialogComponent } from "./desktop-errors-sync-details-dialog.component";

export const SYNC_BAR_COMPONENT = new InjectionToken<SyncBarComponent>("SYNC_BAR_COMPONENT");

class CurrentActivitySynced {
  public date: string;
  public name: string;
  public isNew: boolean;
}

@Component({ template: "" })
export class SyncBarComponent {}

@Component({
  selector: "app-desktop-sync-bar",
  template: `
    <div class="app-sync-bar">
      <div fxLayout="row" fxLayoutAlign="space-between center">
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
            (click)="onActionShowErrors()"
          >
            {{ eventErrors.length }} warning{{ eventErrors.length > 1 ? "s" : "" }}
          </button>
          <button *ngIf="isSyncing" mat-flat-button color="accent" (click)="onActionStop()">Stop</button>
          <button *ngIf="!hiddenCloseButton" mat-icon-button (click)="onActionClose()">
            <mat-icon fontSet="material-icons-outlined">close</mat-icon>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .app-sync-bar {
        padding: 10px 20px;
      }

      button {
        margin-left: 10px;
      }
    `,
  ],
})
export class DesktopSyncBarComponent extends SyncBarComponent implements OnInit {
  @HostBinding("hidden")
  public hiddenSyncBar: boolean;
  public hiddenCloseButton: boolean;
  public isSyncing: boolean;
  public syncStatusText: string;
  public currentActivitySynced: CurrentActivitySynced;
  public activityCounter: number;
  public eventErrors: ErrorSyncEvent[];

  constructor(
    public desktopSyncService: DesktopSyncService,
    public dialog: MatDialog,
    public changeDetectorRef: ChangeDetectorRef
  ) {
    super();
    this.hideSyncBar();
    this.hideCloseButton();
    this.isSyncing = false;
    this.syncStatusText = null;
    this.currentActivitySynced = null;
    this.resetCounter();
    this.eventErrors = [];
  }

  public ngOnInit(): void {
    this.desktopSyncService.syncEvents$.subscribe((syncEvent: SyncEvent) => {
      this.handleSyncEventDisplay(syncEvent);
    });

    this.changeDetectorRef.detach();
  }

  public onActionStop(): Promise<void> {
    return this.desktopSyncService.stop().catch(error => {
      throw new SyncException(error); // Should be caught by Error Handler
    });
  }

  public onActionClose(): void {
    this.hideSyncBar();
  }

  public onActionShowErrors(): void {
    this.dialog.open(DesktopErrorsSyncDetailsDialogComponent, {
      minWidth: DesktopErrorsSyncDetailsDialogComponent.MIN_WIDTH,
      maxWidth: DesktopErrorsSyncDetailsDialogComponent.MAX_WIDTH,
      data: this.eventErrors,
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
    this.syncStatusText = `Sync started on connector "${DesktopSyncService.niceConnectorPrint(
      syncEvent.fromConnectorType
    )}"`;
  }

  private onActivitySyncEvent(syncEvent: SyncEvent): void {
    this.activityCounter++;
    const activitySyncEvent = syncEvent as ActivitySyncEvent;
    this.currentActivitySynced = {
      date: moment(activitySyncEvent.activity.start_time).format("ll"),
      name: activitySyncEvent.activity.name,
      isNew: activitySyncEvent.isNew,
    };
  }

  private onGenericSyncEvent(syncEvent: SyncEvent): void {
    this.syncStatusText = syncEvent.description;
  }

  private onErrorSyncEvent(errorSyncEvent: ErrorSyncEvent): void {
    this.eventErrors.push(errorSyncEvent);
  }

  private onStoppedSyncEvent(syncEvent: SyncEvent): void {
    this.syncStatusText =
      'Sync stopped on connector "' + DesktopSyncService.niceConnectorPrint(syncEvent.fromConnectorType) + '"';
    this.onSyncEnded();
  }

  private onCompleteSyncEvent(syncEvent: SyncEvent): void {
    this.syncStatusText =
      'Sync completed on connector "' + DesktopSyncService.niceConnectorPrint(syncEvent.fromConnectorType) + '"';
    this.onSyncEnded();

    if (!this.activityCounter) {
      // If no activity synced auto close sync bar within 750ms
      setTimeout(() => {
        this.hideSyncBar();
      }, 750);
    }
  }

  private onSyncEnded(): void {
    this.isSyncing = false;
    this.showCloseButton();
  }

  private showSyncBar(): void {
    this.hiddenSyncBar = false;
  }

  private hideSyncBar(): void {
    this.hiddenSyncBar = true;
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

@Component({
  selector: "app-extension-sync-bar",
  template: ``,
  styles: [``],
})
export class ExtensionSyncBarComponent extends SyncBarComponent implements OnInit {
  constructor() {
    super();
  }

  public ngOnInit(): void {}
}
