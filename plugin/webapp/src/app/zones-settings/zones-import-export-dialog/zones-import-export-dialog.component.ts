import { Component, Inject, OnInit } from '@angular/core';
import { IZone } from "../../../../../common/scripts/interfaces/IActivityData";
import { MAT_DIALOG_DATA, MatDialogRef, MatSnackBar } from "@angular/material";
import { IZoneDefinition } from "../zone-definitions";
import { ZonesService } from "../../services/zones/zones.service";

export enum Mode {
	IMPORT,
	EXPORT
}

export interface IZoneImportExportData {
	zoneDefinition: IZoneDefinition;
	zonesData?: IZone[];
	mode: Mode;
}

@Component({
	selector: 'app-zones-import-export-dialog',
	templateUrl: './zones-import-export-dialog.component.html',
	styleUrls: ['./zones-import-export-dialog.component.scss']
})
export class ZonesImportExportDialog implements OnInit {

	public readonly Mode = Mode; // Inject enum as class member

	public static readonly MAX_WIDTH: string = '80%';
	public static readonly MIN_WIDTH: string = '40%';

	private _zonesJsonData: string;
	private _placeholder: string;

	constructor(private dialogRef: MatDialogRef<ZonesImportExportDialog>,
				@Inject(MAT_DIALOG_DATA) private _data: IZoneImportExportData,
				private zonesService: ZonesService,
				private snackBar: MatSnackBar) {
	}

	public ngOnInit() {
		this._placeholder = (this.data.mode == Mode.IMPORT) ? "Enter here something like [{ \"from\": a, \"to\": b }, { \"from\": b, \"to\": c }, { \"from\": c, \"to\": d }]" : null;
		this._zonesJsonData = JSON.stringify(this.data.zonesData);
	}

	public OnImport() {

		this.zonesService.importZones(this.zonesJsonData).then(() => {
			// Import goes well
			this.dialogRef.close();
		}, (error: string) => {
			this.snackBar.open(error, 'Close', {duration: 3500})
		});
	}

	get data(): IZoneImportExportData {
		return this._data;
	}

	set data(value: IZoneImportExportData) {
		this._data = value;
	}

	get zonesJsonData(): string {
		return this._zonesJsonData;
	}

	set zonesJsonData(value: string) {
		this._zonesJsonData = value;
	}

	get placeholder(): string {
		return this._placeholder;
	}

	set placeholder(value: string) {
		this._placeholder = value;
	}
}
