import { Component, OnInit } from "@angular/core";
import { ConfirmDialogComponent } from "../confirm-dialog/confirm-dialog.component";
import { MatDialogRef } from "@angular/material";
import * as _ from "lodash";
import { SyncedBackupModel } from "../../services/sync/synced-backup.model";

@Component({
	selector: "app-import-backup-dialog",
	templateUrl: "./import-backup-dialog.component.html",
	styleUrls: ["./import-backup-dialog.component.scss"]
})
export class ImportBackupDialogComponent implements OnInit {

	public static readonly MAX_WIDTH: string = "80%";
	public static readonly MIN_WIDTH: string = "40%";

	public file: File;
	public displayName: string;
	public displaySize: string;

	constructor(public dialogRef: MatDialogRef<ConfirmDialogComponent>) {
	}

	public ngOnInit(): void {
		this.file = null;
	}

	public onRestore(): void {

		if (this.file) {

			// Reading file, when load, import it
			const reader = new FileReader();
			reader.readAsText(this.file);
			reader.onload = (event: Event) => {
				const syncedBackupModel: SyncedBackupModel = JSON.parse((event.target as IDBRequest).result) as SyncedBackupModel;
				this.dialogRef.close(syncedBackupModel);
			};
		}
	}

	public onCancel(): void {
		this.dialogRef.close(null);
	}

	public onFileSelected(file: File): void {
		this.file = file;
		this.displayName = this.file.name;
		this.displaySize = _.floor(this.file.size / (1024 * 1024), 2) + " MB";
	}
}
