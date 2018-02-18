import { Component, Inject, OnInit } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef, MatSnackBar } from "@angular/material";
import { ZonesService } from "../shared/zones.service";
import { ZoneImportExportDataModel } from "./zone-import-export-data.model";
import { Mode } from "./mode.enum";

@Component({
	selector: "app-zones-import-export-dialog",
	templateUrl: "./zones-import-export-dialog.component.html",
	styleUrls: ["./zones-import-export-dialog.component.scss"]
})
export class ZonesImportExportDialogComponent implements OnInit {

	public static readonly MAX_WIDTH: string = "80%";
	public static readonly MIN_WIDTH: string = "40%";

	public readonly Mode = Mode; // Inject enum as class member
	public zonesJsonData: string;
	public placeholder: string;

	constructor(private dialogRef: MatDialogRef<ZonesImportExportDialogComponent>,
				@Inject(MAT_DIALOG_DATA) public data: ZoneImportExportDataModel,
				private zonesService: ZonesService,
				private snackBar: MatSnackBar) {
	}

	public ngOnInit() {
		const enterMessage = "Enter here something like [{ \"from\": a, \"to\": b }, { \"from\": b, \"to\": c }, { \"from\": c, \"to\": d }]";
		this.placeholder = (this.data.mode === Mode.IMPORT) ? enterMessage : null;
		this.zonesJsonData = JSON.stringify(this.data.zonesData);
	}

	public OnImport() {

		this.zonesService.importZones(this.zonesJsonData).then(() => {
			// Import goes well
			this.dialogRef.close();
		}, (error: string) => {
			this.snackBar.open(error, "Close", {duration: 3500});
		});
	}


}
