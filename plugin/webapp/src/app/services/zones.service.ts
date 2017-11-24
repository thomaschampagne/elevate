import { Injectable } from '@angular/core';
import { IZone } from "../../../../common/scripts/interfaces/IActivityData";
import * as _ from "lodash";
import { Subject } from "rxjs/Subject";
import { ChromeStorageService } from "./chrome-storage.service";
import { IZoneDefinition } from "../zones-settings/zone-definitions";
import { userSettings } from "../../../../common/scripts/UserSettings";

export interface IZoneChangeWhisper {
	sourceId: number;
	to: boolean;
	from: boolean;
	value: number;
}

export interface IZoneChangeBroadcast extends IZoneChangeWhisper {
	destinationId: number;
}

@Injectable()
export class ZonesService {

	private readonly MAX_ZONES_COUNT: number = 50;
	private readonly MIN_ZONES_COUNT: number = 3;

	private _currentZones: IZone[];
	private _singleZoneUpdate: Subject<IZoneChangeBroadcast>;
	private _zonesUpdates: Subject<IZone[]>;
	private _zoneDefinition: IZoneDefinition;

	constructor(private _chromeStorageService: ChromeStorageService) {
		this._singleZoneUpdate = new Subject<IZoneChangeBroadcast>();
		this._zonesUpdates = new Subject<IZone[]>();
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
	 * Notify all <ZonesComponents> of a zone change that imply some instructions to 1 of them
	 * @param {IZoneChangeWhisper} zoneChange
	 */
	public notifyChange(zoneChange: IZoneChangeWhisper): void {

		if (zoneChange.to && zoneChange.from && (zoneChange.to == zoneChange.from)) {
			this._singleZoneUpdate.error("Impossible to notify both 'from' & 'to' changes at the same time");
		}

		if (!_.isNumber(zoneChange.value)) {
			this._singleZoneUpdate.error("Value provided is not a number");
		}

		const isFirstZoneChange = (zoneChange.sourceId == 0);
		const isLastZoneChange = (zoneChange.sourceId == (this._currentZones.length - 1));

		let instruction: IZoneChangeBroadcast = {
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

		this._singleZoneUpdate.next(instruction);
	}

	/**
	 *
	 * @returns {boolean}
	 */
	public isZonesCompliant(zone: IZone[]): boolean {

		if (!zone) {
			return false;
		}

		if (zone.length > this.getMaxZoneCount()) {
			return false;
		}

		if (zone.length < this.getMinZoneCount()) {
			return false;
		}

		for (let i = 0; i < zone.length; i++) {

			if (i === 0) { // First zone
				if (zone[i].to != zone[i + 1].from) {
					return false;
				}

			} else if (i < (zone.length - 1)) { // Middle zone

				if (zone[i].to != zone[i + 1].from || zone[i].from != zone[i - 1].to) {
					return false;
				}

			} else { // Last zone
				if (zone[i].from != zone[i - 1].to) {
					return false;
				}
			}
		}
		return true;
	}

	/**
	 *
	 */
	public saveZones(): Promise<boolean> {

		return new Promise((resolve: (ok: boolean) => void,
							reject: (error: string) => void) => {

			if (this.isZonesCompliant(this.currentZones)) {

				this._chromeStorageService.updateZoneSetting(this.zoneDefinition, this.currentZones)
					.then(status => {
						resolve(status);
					});

			} else {
				reject("Zones are not compliant");
			}
		});
	}

	/**
	 *
	 */
	public resetZonesToDefault(): Promise<boolean> {

		return new Promise((resolve: (ok: boolean) => void,
							reject: (error: string) => void) => {

			this.currentZones = _.clone(_.propertyOf(userSettings.zones)(this.zoneDefinition.value));

			this.saveZones().then((status: boolean) => {

				resolve(status);

				// Notify ZonesSettingsComponent to tell him to reload his zones
				this.zonesUpdates.next(this.currentZones);

			}, error => {

				reject(error);

				this.zonesUpdates.error(error);

			});

		});
	}

	/**
	 * Subscription mechanism for a <ZonesComponent>.  When a zone change occurs in zones, then all zones receive
	 * the same instruction. Instruction is targeted toward 1 zone using <IZoneChangeBroadcast.destinationId>.
	 * That <ZonesComponent> has to follow change instruction
	 * @returns {Subject<IZoneChangeWhisper>}
	 */
	get singleZoneUpdate(): Subject<IZoneChangeBroadcast> {
		return this._singleZoneUpdate;
	}

	/**
	 * Subscription mechanism that notify changes made by <ZonesService> via a zones update.
	 * @returns {Subject<IZoneChangeWhisper>}
	 */
	get zonesUpdates(): Subject<IZone[]> {
		return this._zonesUpdates;
	}

	get zoneDefinition(): IZoneDefinition {
		return this._zoneDefinition;
	}

	set zoneDefinition(value: IZoneDefinition) {
		this._zoneDefinition = value;
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

	get chromeStorageService(): ChromeStorageService {
		return this._chromeStorageService;
	}

}
