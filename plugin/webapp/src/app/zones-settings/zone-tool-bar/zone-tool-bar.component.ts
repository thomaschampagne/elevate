import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ZonesService } from "../shared/zones.service";
import { MatDialog, MatSnackBar } from "@angular/material";
import { ZonesImportExportDialog } from "../zones-import-export-dialog/zones-import-export-dialog.component";
import { ConfirmDialog } from "../../shared/dialogs/confirm-dialog/confirm-dialog.component";
import { ConfirmDialogData } from "../../shared/dialogs/confirm-dialog/confirm-dialog-data.model";
import { ZoneImportExportData } from "../zones-import-export-dialog/zone-import-export-data.model";
import { Mode } from "../zones-import-export-dialog/mode.enum";
import { ZoneDefinition } from "../../shared/models/zone-definition.model";

@Component({
	selector: 'app-zone-tool-bar',
	templateUrl: './zone-tool-bar.component.html',
	styleUrls: ['./zone-tool-bar.component.scss']
})
export class ZoneToolBarComponent implements OnInit {

	@Input("currentZonesLength")
	private _currentZonesLength: number;

	@Input("zoneDefinitions")
	private _zoneDefinitions: ZoneDefinition[];

	@Input("zoneDefinitionSelected")
	private _zoneDefinitionSelected: ZoneDefinition;

	@Output("zoneDefinitionSelectedChange")
	private _zoneDefinitionSelectedChange: EventEmitter<ZoneDefinition> = new EventEmitter<ZoneDefinition>();

	constructor(private zonesService: ZonesService,
				private dialog: MatDialog,
				private snackBar: MatSnackBar) {
	}

	public ngOnInit(): void {
	}

	public onZoneDefinitionSelected(): void {
		// Notify parent ZonesSettings component of new zone definition selected
		this.zoneDefinitionSelectedChange.emit(this.zoneDefinitionSelected);
	}

	public onStepChange(): void {
		this.zonesService.notifyStepChange(this.zoneDefinitionSelected.step);
	}

	public onAddLastZone(): void {

		this.zonesService.addLastZone().then(
			message => this.popSnack(message),
			error => this.popSnack(error)
		);
	}

	public onRemoveLastZone(): void {
		this.zonesService.removeLastZone().then(
			message => this.popSnack(message),
			error => this.popSnack(error)
		);
	}

	public onResetZonesToDefault(): void {

		const data: ConfirmDialogData = {
			title: "Reset <" + this.zonesService.zoneDefinition.name + "> zones",
			content: "Are you sure? Previous data will be lost."
		};

		const dialogRef = this.dialog.open(ConfirmDialog, {
			minWidth: ConfirmDialog.MIN_WIDTH,
			maxWidth: ConfirmDialog.MAX_WIDTH,
			data: data
		});

		dialogRef.afterClosed().subscribe((confirm: boolean) => {
			if (confirm) {
				this.zonesService.resetZonesToDefault().then(() => {
						this.popSnack(this.zonesService.zoneDefinition.name + " zones have been set to default");
					}, error => this.popSnack(error)
				);
			}
		});
	}

	public onSaveZones(): void {

		this.zonesService.saveZones().then(
			() => this.popSnack(this.zonesService.zoneDefinition.name + " zones have been saved"),
			error => this.popSnack(error)
		);
	}

	public onImportZones() {

		const importExportData: ZoneImportExportData = {
			zoneDefinition: this.zonesService.zoneDefinition,
			mode: Mode.IMPORT
		};

		this.dialog.open(ZonesImportExportDialog, {
			minWidth: ZonesImportExportDialog.MIN_WIDTH,
			maxWidth: ZonesImportExportDialog.MAX_WIDTH,
			data: importExportData
		});
	}

	public onExportZones() {

		const importExportData: ZoneImportExportData = {
			zoneDefinition: this.zonesService.zoneDefinition,
			zonesData: this.zonesService.currentZones,
			mode: Mode.EXPORT
		};

		this.dialog.open(ZonesImportExportDialog, {
			minWidth: ZonesImportExportDialog.MIN_WIDTH,
			maxWidth: ZonesImportExportDialog.MAX_WIDTH,
			data: importExportData
		});

	}

	private popSnack(message: string): void {
		this.snackBar.open(message, 'Close', {duration: 2500});
	}

	get currentZonesLength(): number {
		return this._currentZonesLength;
	}

	set currentZonesLength(value: number) {
		this._currentZonesLength = value;
	}

	get zoneDefinitions(): ZoneDefinition[] {
		return this._zoneDefinitions;
	}

	set zoneDefinitions(value: ZoneDefinition[]) {
		this._zoneDefinitions = value;
	}

	get zoneDefinitionSelected(): ZoneDefinition {
		return this._zoneDefinitionSelected;
	}

	set zoneDefinitionSelected(value: ZoneDefinition) {
		this._zoneDefinitionSelected = value;
	}

	get zoneDefinitionSelectedChange(): EventEmitter<ZoneDefinition> {
		return this._zoneDefinitionSelectedChange;
	}

	set zoneDefinitionSelectedChange(value: EventEmitter<ZoneDefinition>) {
		this._zoneDefinitionSelectedChange = value;
	}
}
