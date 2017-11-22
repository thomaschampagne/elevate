import { Injectable } from '@angular/core';
import { IZone } from "../../../../common/scripts/interfaces/IActivityData";
import * as _ from "lodash";

@Injectable()
export class ZonesService {

	private readonly MAX_ZONES_COUNT: number = 50;
	private readonly MIN_ZONES_COUNT: number = 3;

	private _currentZones: IZone[];

	constructor() {
	}

	public addLastZone(): Promise<string> {

		return new Promise((resolve: (message: string) => void,
							reject: (error: string) => void) => {

			if (this._currentZones.length >= this.getMaxZoneCount()) {

				reject("You can't add more than " + this.getMaxZoneCount() + " zones...");

			} else {

				const oldLastZone: IZone = this.getLastZone();

				// Computed middle value between oldLastZone.from and oldLastZone.to
				const intermediateZoneValue: number = Math.floor((oldLastZone.from + oldLastZone.to) / 2);

				// Creating new Zone
				const lastZone: IZone = {
					from: intermediateZoneValue,
					to: oldLastZone.to,
				};

				// Apply middle value computed to previous last zone (to)
				this._currentZones[this._currentZones.length - 1].to = intermediateZoneValue;

				// Add the new last zone
				this._currentZones.push(lastZone);

				resolve("Zone <" + this._currentZones.length + "> has been added.");
			}
		});
	}

	/**
	 *
	 */
	public removeLastZone(): Promise<string> {

		return new Promise((resolve: (message: string) => void,
							reject: (error: string) => void) => {


			// Delete last zone
			this._currentZones.pop();

			resolve("Zone <" + (this._currentZones.length + 1) + "> has been removed.");
		});
	}

	/**
	 *
	 */
	// TODO To be removed
	public removeZone(zoneId?: number): Promise<string> {

		return new Promise((resolve: (message: string) => void,
							reject: (error: string) => void) => {

			if (this._currentZones.length <= this.getMinZoneCount()) {

				reject("You can't remove more than " + this.getMinZoneCount() + " zones...");

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

	public getLastZone() {
		return _.last(this._currentZones);
	}

	public getMaxZoneCount(): number {
		return this.MAX_ZONES_COUNT;
	}

	public getMinZoneCount(): number {
		return this.MIN_ZONES_COUNT;
	}

	get currentZones(): IZone[] {
		return this._currentZones;
	}

	set currentZones(value: IZone[]) {
		this._currentZones = value;
	}
}
