import { Component, Input, OnInit } from '@angular/core';
import { IZone } from "../../../../../common/scripts/interfaces/IActivityData";
import { MatSnackBar } from "@angular/material";

@Component({
	selector: 'app-zone-tool-bar',
	templateUrl: './zone-tool-bar.component.html',
	styleUrls: ['./zone-tool-bar.component.scss']
})
export class ZoneToolBarComponent implements OnInit {

	public static MAX_ZONES_COUNT: number = 50;
	public static MIN_ZONES_COUNT: number = 3;

	@Input("currentZones")
	private _currentZones: IZone[];

	constructor(private snackBar: MatSnackBar) {
	}

	public ngOnInit() {
	}

	public onAddZone() {

		if (this._currentZones.length >= ZoneToolBarComponent.MAX_ZONES_COUNT) {

			this.snackBar.open("You can't add more than " + ZoneToolBarComponent.MAX_ZONES_COUNT + " zones...",
				'Close',
				{duration: 2500}
			);

		} else {

			const oldLastZone: IZone = this._currentZones[this._currentZones.length - 1];

			// Computed middle value between oldLastZone.from and oldLastZone.to
			const midValue: number = Math.floor((oldLastZone.from + oldLastZone.to) / 2);

			// Creating new Zone
			const newLastZone: IZone = {
				from: midValue,
				to: oldLastZone.to,
			};

			// Apply middle value computed to previous last zone (to)
			this._currentZones[this._currentZones.length - 1].to = midValue;

			// Add the new last zone
			this._currentZones.push(newLastZone);

			this.snackBar.open("Zone <" + this._currentZones.length + "> has been added.",
				'Close',
				{duration: 2500}
			);
		}
	}

	public onRemoveZone() {

	}

	get currentZones(): IZone[] {
		return this._currentZones;
	}

	set currentZones(value: IZone[]) {
		this._currentZones = value;
	}
}
