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
						<span *ngIf="syncStatusText">{{this.syncStatusText}}</span>
					</span>
					<span fxFlex class="mat-caption" *ngIf="counter > 0">{{counter}} activities processed</span>
				</div>
				<div fxLayout="row" fxLayoutAlign="space-between center">
					<button mat-flat-button color="warn" (click)="onStop()">
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

	public isStopped: boolean;
	public isSyncCompleted: boolean;

	public syncStatusText: string;
	public currentActivitySynced: CurrentActivitySynced;
	public counter: number;

	constructor(public desktopSyncService: DesktopSyncService,
				public changeDetectorRef: ChangeDetectorRef) {
		super();
		this.hideSyncBar = true;
		this.isStopped = false;
		this.isSyncCompleted = false;
		this.syncStatusText = null;
		this.currentActivitySynced = null;
		this.counter = 0;
	}

	public ngOnInit(): void {

		this.desktopSyncService.syncEvents$.subscribe((syncEvent: SyncEvent) => {
			this.handleSyncEventDisplay(syncEvent);
		});
	}

	public handleSyncEventDisplay(syncEvent: SyncEvent) {

		this.changeDetectorRef.markForCheck();


		if (this.isStopped) {
			return;
		}

		this.currentActivitySynced = null;
		this.syncStatusText = null;

		if (syncEvent.type === SyncEventType.STARTED) {

			this.hideSyncBar = false;
			this.isStopped = false;
			this.isSyncCompleted = false;
			this.counter = 0;
			this.syncStatusText = "Sync started on connector \"" + DesktopSyncService.niceConnectorPrint(syncEvent.fromConnectorType) + "\"";

		} else if (syncEvent.type === SyncEventType.GENERIC) {

			this.syncStatusText = syncEvent.description;

		} else if (syncEvent.type === SyncEventType.ACTIVITY) {

			this.counter++;
			const activitySyncEvent = <ActivitySyncEvent> syncEvent;
			this.currentActivitySynced = {
				date: moment(activitySyncEvent.activity.start_time).format("ll"),
				name: activitySyncEvent.activity.name,
				isNew: activitySyncEvent.isNew,
			};

		} else if (syncEvent.type === SyncEventType.ERROR) {

			const errorSyncEvent = <ErrorSyncEvent> syncEvent;
			this.syncStatusText = errorSyncEvent.description;
			const message = JSON.stringify(errorSyncEvent);
			alert(message); // TODO !!

		} else if (syncEvent.type === SyncEventType.STOPPED) {

			this.isStopped = true;
			this.syncStatusText = "Sync stopped on connector \"" + DesktopSyncService.niceConnectorPrint(syncEvent.fromConnectorType) + "\"";
			this.hideSyncBar = true;

		} else if (syncEvent.type === SyncEventType.COMPLETE) {
			this.isSyncCompleted = true;
			this.syncStatusText = "Sync completed on connector \"" + DesktopSyncService.niceConnectorPrint(syncEvent.fromConnectorType) + "\"";
			this.hideSyncBar = true;
		}

		this.changeDetectorRef.detectChanges();
	}

	public onStop(): Promise<void> {
		return this.desktopSyncService.stop().catch(error => {
			throw new SyncException(error); // Should be caught by Error Handler
		});
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
