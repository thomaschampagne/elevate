import { Injectable } from '@angular/core';
import { IZone } from "../../../../common/scripts/interfaces/IActivityData";
import * as _ from "lodash";
import { Subject } from "rxjs/Subject";

export interface IZoneChange {
	sourceId: number;
	to: boolean;
	from: boolean;
	value: number;
}

export interface IZoneChangeInstruction extends IZoneChange {
	destinationId: number;
}

@Injectable()
export class ZonesService {

	private readonly MAX_ZONES_COUNT: number = 50;
	private readonly MIN_ZONES_COUNT: number = 3;

	private _currentZones: IZone[];
	private _instructionListener: Subject<IZoneChange>;

	constructor() {
		this._instructionListener = new Subject<IZoneChange>();
	}

	/**
	 *
	 * @returns {Promise<string>}
	 */
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
	 * @returns {Promise<string>}
	 */
	public removeLastZone(): Promise<string> {

		return new Promise((resolve: (message: string) => void,
							reject: (error: string) => void) => {

			if (this._currentZones.length <= this.getMinZoneCount()) {
				reject("You can't remove more than " + this.getMinZoneCount() + " zones...");
			} else {

				this._currentZones.pop(); // Delete last zone
				resolve("Zone <" + (this._currentZones.length + 1) + "> has been removed.");
			}

		});
	}

	/**
	 *
	 * @param {number} index
	 * @returns {Promise<string>}
	 */
	public removeZoneAtIndex(index: number): Promise<string> {

		return new Promise((resolve: (message: string) => void,
							reject: (error: string) => void) => {

			if (this._currentZones.length <= this.getMinZoneCount()) {

				reject("You can't remove more than " + this.getMinZoneCount() + " zones...");

			} else {

				const isFirstZone = (index == 0);
				const isLastZone = (index == (this._currentZones.length - 1));

				if (isFirstZone || isLastZone) {

					this._currentZones.splice(index, 1);

					resolve("Zone <" + (index + 1) + "> has been removed.");

				} else {

					// Update next from zone with previous zone to
					this._currentZones[index + 1].from = this._currentZones[index - 1].to;

					// Remove zone middle zone id here...
					this._currentZones.splice(index, 1);

					resolve("Zone <" + (index + 1) + "> has been removed.");

				}
			}
		});
	}


	/**
	 *
	 * @param {IZoneChange} zoneChange
	 */
	public notifyChange(zoneChange: IZoneChange): void {

		if (zoneChange.to && zoneChange.from && (zoneChange.to == zoneChange.from)) {
			this._instructionListener.error("Impossible to notify both 'from' & 'to' changes at the same time");
		}

		if (!_.isNumber(zoneChange.value)) {
			this._instructionListener.error("Value provided is not a number");
		}

		const isFirstZoneChange = (zoneChange.sourceId == 0);
		const isLastZoneChange = (zoneChange.sourceId == (this._currentZones.length - 1));

		let instruction: IZoneChangeInstruction = {
			sourceId: zoneChange.sourceId,
			destinationId: null,
			to: null,
			from: null,
			value: zoneChange.value,
		};

		if (!isFirstZoneChange && !isLastZoneChange) {

			if (zoneChange.from) {
				instruction.destinationId = zoneChange.sourceId - 1;
				instruction.from = false;
				instruction.to = true;
			}

			if (zoneChange.to) {
				instruction.destinationId = zoneChange.sourceId + 1;
				instruction.from = true;
				instruction.to = false;
			}

		} else if (isFirstZoneChange) {

			if (zoneChange.to) {
				instruction.destinationId = zoneChange.sourceId + 1;
				instruction.from = true;
				instruction.to = false;
			}

			if (zoneChange.from) {
				instruction = null;
			}

		} else if (isLastZoneChange) {

			if (zoneChange.to) {
				instruction = null;
			}

			if (zoneChange.from) {
				instruction.destinationId = zoneChange.sourceId - 1;
				instruction.from = false;
				instruction.to = true;
			}
		}

		this._instructionListener.next(instruction);
	}

	public isCurrentZonesCompliant(): boolean {

		if (!this.currentZones) {
			return false;
		}

		if (this.currentZones.length > this.getMaxZoneCount()) {
			return false;
		}

		if (this.currentZones.length < this.getMinZoneCount()) {
			return false;
		}

		for (let i = 0; i < this.currentZones.length; i++) {

			if (i === 0) { // First zone
				if (this.currentZones[i].to != this.currentZones[i + 1].from) {
					return false;
				}

			} else if (i < (this.currentZones.length - 1)) { // Middle zone

				if (this.currentZones[i].to != this.currentZones[i + 1].from || this.currentZones[i].from != this.currentZones[i - 1].to) {
					return false;
				}

			} else { // Last zone
				if (this.currentZones[i].from != this.currentZones[i - 1].to) {
					return false;
				}
			}
		}

		return true;
	}

	get instructionListener(): Subject<IZoneChange> {
		return this._instructionListener;
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
