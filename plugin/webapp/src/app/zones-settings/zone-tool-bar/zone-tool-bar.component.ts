import { Component, Input, OnInit } from '@angular/core';
import { IZone } from "../../../../../common/scripts/interfaces/IActivityData";
import { ZonesService } from "../../services/zones.service";
import { MatSnackBar } from "@angular/material";

@Component({
	selector: 'app-zone-tool-bar',
	templateUrl: './zone-tool-bar.component.html',
	styleUrls: ['./zone-tool-bar.component.scss']
})
export class ZoneToolBarComponent implements OnInit {

	@Input("currentZones")
	private _currentZones: IZone[];

	constructor(private zonesService: ZonesService,
				private snackBar: MatSnackBar /*TODO pop Snack from parent?!*/) {
	}

	public ngOnInit() {
	}

	public onAddLastZone() {

		this.zonesService.addLastZone()
			.then(
				message => this.popSnack(message),
				error => this.popSnack(error)
			);
	}

	public onRemoveLastZone() {
		this.zonesService.removeLastZone()
			.then(
				message => this.popSnack(message),
				error => this.popSnack(error)
			);
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
