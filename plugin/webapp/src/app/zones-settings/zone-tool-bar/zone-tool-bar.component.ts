import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ZonesService } from "../../services/zones.service";
import { MatSnackBar } from "@angular/material";
import { NotImplementedException } from "../../exceptions/NotImplementedException";
import { IZoneDefinition } from "../zone-definitions";

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
		throw new NotImplementedException();
	}

	public onExportZones() {
		throw new NotImplementedException();
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
