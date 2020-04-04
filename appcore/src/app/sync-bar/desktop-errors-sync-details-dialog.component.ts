import { Component, Inject, OnInit } from "@angular/core";
import { MAT_DIALOG_DATA } from "@angular/material/dialog";
import { ErrorSyncEvent } from "@elevate/shared/sync";
import * as moment from "moment";
import { saveAs } from "file-saver";
import { LoggerService } from "../shared/services/logging/logger.service";

@Component({
	selector: "app-desktop-errors-sync-details-dialog",
	template: `
		<h2 mat-dialog-title>{{eventErrors.length}} sync warning{{(eventErrors.length > 1) ? 's' : ''}} occurred</h2>
		<h3 class="mat-subheading-1">Warning are also displayed in developer console (CTRL+F12)</h3>
		<mat-dialog-content class="mat-body-1">
			<mat-accordion>
				<mat-expansion-panel *ngFor="let errorEvent of eventErrors">
					<mat-expansion-panel-header>
						<mat-panel-title>
							{{errorEvent.code}}
						</mat-panel-title>
						<mat-panel-description *ngIf="errorEvent.description">
							{{errorEvent.description}}
						</mat-panel-description>
					</mat-expansion-panel-header>
					<mat-form-field fxFill>
						<textarea matInput class="mat-caption" rows="40" disabled>{{errorEvent | json}}</textarea>
					</mat-form-field>
				</mat-expansion-panel>
			</mat-accordion>
		</mat-dialog-content>
		<mat-dialog-actions>
			<button mat-flat-button color="primary" (click)="exportToFile()">Export to file</button>
			<button mat-stroked-button mat-dialog-close color="primary">Ok</button>
		</mat-dialog-actions>
	`,
	styles: [``]
})
export class DesktopErrorsSyncDetailsDialogComponent implements OnInit {

	public static readonly MAX_WIDTH: string = "90%";
	public static readonly MIN_WIDTH: string = "80%";

	constructor(@Inject(MAT_DIALOG_DATA) public eventErrors: ErrorSyncEvent[],
				public logger: LoggerService) {
	}

	public ngOnInit(): void {
		this.logger.warn("SYNC WARNS", this.eventErrors);
	}

	public exportToFile(): void {
		const blob = new Blob([JSON.stringify(this.eventErrors, null, 2)], {type: "application/json; charset=utf-8"});
		const filename = "desktop_sync_warnings_" + moment().format("Y.M.D-H.mm.ss") + ".json";
		saveAs(blob, filename);
	}
}
