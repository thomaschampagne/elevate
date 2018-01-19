import { Component, OnInit } from "@angular/core";
import { ConfirmDialogComponent } from "../confirm-dialog/confirm-dialog.component";
import { MatDialogRef } from "@angular/material";
import { AthleteHistoryModel } from "../../services/athlete-history/athlete-history.model";

@Component({
	selector: "app-athlete-history-import-dialog",
	templateUrl: "./athlete-history-import-dialog.component.html",
	styleUrls: ["./athlete-history-import-dialog.component.scss"]
})
export class AthleteHistoryImportDialogComponent implements OnInit {

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
				const athleteHistoryModel: AthleteHistoryModel = JSON.parse((event.target as IDBRequest).result) as AthleteHistoryModel;
				this.dialogRef.close(athleteHistoryModel);
			};
		}
	}

	public onCancel(): void {
		this.dialogRef.close(null);
	}

	public onFileSelected(file: File): void {
		this.file = file;
		this.displayName = this.file.name;
		this.displaySize = Math.floor(this.file.size / 1024).toLocaleString() + " MB";
	}
}
