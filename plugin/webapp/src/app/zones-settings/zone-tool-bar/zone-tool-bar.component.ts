import { Component, Input, OnInit } from '@angular/core';
import { IZone } from "../../../../../common/scripts/interfaces/IActivityData";
import { ZonesService } from "../../services/zones.service";
import { MatSnackBar } from "@angular/material";
import { NotImplementedException } from "../../exceptions/NotImplementedException";
import { Router } from "@angular/router";

@Component({
	selector: 'app-zone-tool-bar',
	templateUrl: './zone-tool-bar.component.html',
	styleUrls: ['./zone-tool-bar.component.scss']
})
export class ZoneToolBarComponent implements OnInit {

	@Input("currentZones")
	private _currentZones: IZone[];

	constructor(private zonesService: ZonesService,
				// private router: Router,
				private snackBar: MatSnackBar /*TODO pop Snack from parent?!*/) {
	}

	public ngOnInit(): void {
	}

	public onAddLastZone(): void {

		this.zonesService.addLastZone()
			.then(
				message => this.popSnack(message),
				error => this.popSnack(error)
			);
	}

	public onRemoveLastZone(): void {
		this.zonesService.removeLastZone()
			.then(
				message => this.popSnack(message),
				error => this.popSnack(error)
			);
	}

	public onResetZonesToDefault(): void {
		this.zonesService.resetZonesToDefault()
			.then(
				() => this.popSnack(this.zonesService.zoneDefinition.name + " zones have been set to default"),
				error => this.popSnack(error)
			);
	}

	public onSaveZones(): void {

		this.zonesService.saveZones()
			.then(
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

	get currentZones(): IZone[] {
		return this._currentZones;
	}

	set currentZones(value: IZone[]) {
		this._currentZones = value;
	}

}
