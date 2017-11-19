import { Injectable } from '@angular/core';
import { IZone } from "../../../../common/scripts/interfaces/IActivityData";
import * as _ from "lodash";

@Injectable()
export class ZonesService {

	public static MAX_ZONES_COUNT: number = 50;
	public static MIN_ZONES_COUNT: number = 3;

	private _currentZones: IZone[];

	constructor() {
	}

	/**
	 *
	 */
	public addZone(): Promise<string> {

		return new Promise((resolve: (message: string) => void,
							reject: (error: string) => void) => {
			if (this._currentZones.length >= ZonesService.MAX_ZONES_COUNT) {

				reject("You can't add more than " + ZonesService.MAX_ZONES_COUNT + " zones...");

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

				resolve("Zone <" + this._currentZones.length + "> has been added.");
			}
		});
	}

	/**
	 *
	 */
	public removeZone(zoneId?: number): Promise<string> {

		return new Promise((resolve: (message: string) => void,
							reject: (error: string) => void) => {

			if (this._currentZones.length <= ZonesService.MIN_ZONES_COUNT) {

				reject("You can't remove more than " + ZonesService.MIN_ZONES_COUNT + " zones...");

			} else {

				let message;
				if (_.isNumber(zoneId) && zoneId === 0) {

					// First zone... just remove it...
					this._currentZones.splice(zoneId, 1);
					message = "Zone <" + (zoneId + 1) + "> has been removed.";

				} else if (_.isNumber(zoneId) && zoneId !== this._currentZones.length - 1) {

					// Delete middle zone id here...
					// Update next zone
					this._currentZones[zoneId + 1].from = this._currentZones[zoneId - 1].to;

					// Remove zone
					this._currentZones.splice(zoneId, 1);

					message = "Zone <" + (zoneId + 1) + "> has been removed.";

				} else {

					// Delete last zone
					this._currentZones.pop();

					message = "Zone <" + (this._currentZones.length + 1) + "> has been removed.";

					// Uncomment bellow to get two latest zone merged on deletion. Else last zone will just popup...
					// let oldLastZone = this._currentZones[this._currentZones.length - 1];
					// this._currentZones[this._currentZones.length - 1].to = oldLastZone.to;
				}
				resolve(message);
			}
		});
	}

	get currentZones(): IZone[] {
		return this._currentZones;
	}

	set currentZones(value: IZone[]) {
		this._currentZones = value;
	}
}
