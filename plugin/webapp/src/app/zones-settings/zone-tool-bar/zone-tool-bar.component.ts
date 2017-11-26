import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ZonesService } from "../../services/zones.service";
import { MatDialog, MatSnackBar } from "@angular/material";
import { IZoneDefinition } from "../zone-definitions";
import {
	IZoneImportExportData,
	Mode,
	ZonesImportExportDialog
} from "../zones-import-export-dialog/zones-import-export-dialog.component";

@Component({
	selector: 'app-zone-tool-bar',
	templateUrl: './zone-tool-bar.component.html',
	styleUrls: ['./zone-tool-bar.component.scss']
})
export class ZoneToolBarComponent implements OnInit {

	@Input("currentZonesLength")
	private _currentZonesLength: number;

	@Input("zoneDefinitions")
	private _zoneDefinitions: IZoneDefinition[];

	@Input("zoneDefinitionSelected")
	private _zoneDefinitionSelected: IZoneDefinition;

	@Output("zoneDefinitionSelectedChange")
	private _zoneDefinitionSelectedChange: EventEmitter<IZoneDefinition> = new EventEmitter<IZoneDefinition>();

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
		this.zonesService.resetZonesToDefault().then(() => {

				this.popSnack(this.zonesService.zoneDefinition.name + " zones have been set to default");

			}, error => this.popSnack(error)
		);
	}

	public onSaveZones(): void {

		this.zonesService.saveZones().then(
			() => this.popSnack(this.zonesService.zoneDefinition.name + " zones have been saved"),
			error => this.popSnack(error)
		);
	}

	public onImportZones() {

		const importExportData: IZoneImportExportData = {
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

		const importExportData: IZoneImportExportData = {
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

	get zoneDefinitions(): IZoneDefinition[] {
		return this._zoneDefinitions;
	}

	set zoneDefinitions(value: IZoneDefinition[]) {
		this._zoneDefinitions = value;
	}

	get zoneDefinitionSelected(): IZoneDefinition {
		return this._zoneDefinitionSelected;
	}

	set zoneDefinitionSelected(value: IZoneDefinition) {
		this._zoneDefinitionSelected = value;
	}

	get zoneDefinitionSelectedChange(): EventEmitter<IZoneDefinition> {
		return this._zoneDefinitionSelectedChange;
	}

	set zoneDefinitionSelectedChange(value: EventEmitter<IZoneDefinition>) {
		this._zoneDefinitionSelectedChange = value;
	}
}
