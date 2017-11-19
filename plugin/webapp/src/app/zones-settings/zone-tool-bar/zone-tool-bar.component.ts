import { Component, Input, OnInit } from '@angular/core';
import { IZone } from "../../../../../common/scripts/interfaces/IActivityData";
import { MatSnackBar } from "@angular/material";
import * as _ from "lodash";

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

	/**
	 *
	 */
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

	/**
	 *
	 */
	public onRemoveZone(zoneId?: number) {

		if (this._currentZones.length <= ZoneToolBarComponent.MIN_ZONES_COUNT) {

			this.snackBar.open("You can't remove more than " + ZoneToolBarComponent.MIN_ZONES_COUNT + " zones...",
				'Close',
				{duration: 2500}
			);

		} else {

			let message;
			if (_.isNumber(zoneId) && zoneId === 0) {

				// First zone... just remove it...
				this._currentZones.splice(zoneId, 1);
				message = "Zone <" + (zoneId + 1) + "> has been removed."; // TODO Check message OK

			} else if (_.isNumber(zoneId) && zoneId !== this._currentZones.length - 1) {

				// Delete middle zone id here...
				// Update next zone
				this._currentZones[zoneId + 1].from = this._currentZones[zoneId - 1].to;

				// Remove zone
				this._currentZones.splice(zoneId, 1);

				message = "Zone <" + (zoneId + 1) + "> has been removed."; // TODO Check message OK

			} else {

				// Delete last zone
				this._currentZones.pop();

				message = "Zone <" + (this._currentZones.length + 1) + "> has been removed."; // TODO Check message OK

				// Uncomment bellow to get two latest zone merged on deletion. Else last zone will just popup...
				// let oldLastZone = this._currentZones[this._currentZones.length - 1];
				// this._currentZones[this._currentZones.length - 1].to = oldLastZone.to;
			}

			this.snackBar.open(message,
				'Close',
				{duration: 2500}
			);
		}
	}

	get currentZones(): IZone[] {
		return this._currentZones;
	}

	set currentZones(value: IZone[]) {
		this._currentZones = value;
	}
}
