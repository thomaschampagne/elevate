import { ChangeDetectorRef, Component, HostBinding, InjectionToken, OnInit } from "@angular/core";
import { DesktopSyncService } from "../shared/services/sync/impl/desktop-sync.service";
import { ActivitySyncEvent, ErrorSyncEvent, SyncEvent, SyncEventType } from "@elevate/shared/sync";
import { SyncException } from "@elevate/shared/exceptions";
import * as moment from "moment";

export const SYNC_BAR_COMPONENT = new InjectionToken<SyncBarComponent>("SYNC_BAR_COMPONENT");

class CurrentActivitySynced {
	public date: string;
	public name: string;
	public isNew: boolean;
}

@Component({template: ""})
export class SyncBarComponent {
}

@Component({
	selector: "app-desktop-sync-bar",
	template: `
		<div class="app-sync-bar">
			<div fxLayout="row" fxLayoutAlign="space-between center">
				<div fxLayout="column" fxLayoutAlign="center start">
					<span fxFlex class="mat-body-1">
						<span *ngIf="currentActivitySynced">{{currentActivitySynced.date}}: {{currentActivitySynced.name}} <span
							class="activity-existence-tag">{{currentActivitySynced.isNew ? 'new' : 'already exists'}}</span></span>
						<span *ngIf="!currentActivitySynced && syncStatusText">{{this.syncStatusText}}</span>
					</span>
					<span fxFlex class="mat-caption" *ngIf="counter > 0">{{counter}} activities processed</span>
				</div>
				<div fxLayout="row" fxLayoutAlign="space-between center">
					<button mat-flat-button color="warn" (click)="onActionStop()">
						Stop
					</button>
				</div>
			</div>
		</div>
	`,
	styles: [`
		.app-sync-bar {
			padding: 10px 20px;
		}

		button {
			margin-left: 10px;
		}
	`]
})
export class DesktopSyncBarComponent extends SyncBarComponent implements OnInit {

	@HostBinding("hidden")
	public hideSyncBar: boolean;

	public syncStatusText: string;
	public currentActivitySynced: CurrentActivitySynced;
	public counter: number;

	constructor(public desktopSyncService: DesktopSyncService,
				public changeDetectorRef: ChangeDetectorRef) {
		super();
		this.hideSyncBar = true;
		this.syncStatusText = null;
		this.currentActivitySynced = null;
		this.counter = 0;
	}

	public ngOnInit(): void {

		this.hideSyncBar = true;

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

	private onStartedSyncEvent(syncEvent: SyncEvent): void {
		this.hideSyncBar = false;
		this.counter = 0;
		this.syncStatusText = "Sync started on connector \"" + DesktopSyncService.niceConnectorPrint(syncEvent.fromConnectorType) + "\"";
	}

	private onActivitySyncEvent(syncEvent: SyncEvent): void {
		this.counter++;
		const activitySyncEvent = <ActivitySyncEvent> syncEvent;
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
		this.syncStatusText = errorSyncEvent.description;
		const message = JSON.stringify(errorSyncEvent);
		alert(message); // TODO !!
	}

	private onStoppedSyncEvent(syncEvent: SyncEvent): void {
		this.syncStatusText = "Sync stopped on connector \"" + DesktopSyncService.niceConnectorPrint(syncEvent.fromConnectorType) + "\"";
		this.hideSyncBar = true;
	}

	private onCompleteSyncEvent(syncEvent: SyncEvent): void {
		this.syncStatusText = "Sync completed on connector \"" + DesktopSyncService.niceConnectorPrint(syncEvent.fromConnectorType) + "\"";
		this.hideSyncBar = true;
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
			this.onErrorSyncEvent(<ErrorSyncEvent> syncEvent);
		}

		if (syncEvent.type === SyncEventType.STOPPED) {
			this.onStoppedSyncEvent(syncEvent);
		}

		if (syncEvent.type === SyncEventType.COMPLETE) {
			this.onCompleteSyncEvent(syncEvent);
		}

		this.changeDetectorRef.detectChanges();
	}

}

@Component({
	selector: "app-extension-sync-bar",
	template: ``,
	styles: [``]
})
export class ExtensionSyncBarComponent extends SyncBarComponent implements OnInit {

	constructor() {
		super();
	}

	public ngOnInit(): void {
	}
}
