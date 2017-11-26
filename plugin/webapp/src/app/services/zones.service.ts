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

export interface IZoneChangeOrder extends IZoneChangeWhisper {
	destinationId: number;
}

@Injectable()
export class ZonesService {

	private readonly MAX_ZONES_COUNT: number = 50;
	private readonly MIN_ZONES_COUNT: number = 3;

	private _currentZones: IZone[];
	private _zoneChangeOrderUpdates: Subject<IZoneChangeOrder>; // TODO rename ?!
	private _zonesUpdates: Subject<IZone[]>;
	private _stepUpdates: Subject<number>;
	private _zoneDefinition: IZoneDefinition;

	constructor(private _chromeStorageService: ChromeStorageService) {
		this._zoneChangeOrderUpdates = new Subject<IZoneChangeOrder>();
		this._zonesUpdates = new Subject<IZone[]>();
		this._stepUpdates = new Subject<number>();
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

			if (this.currentZones.length <= this.getMinZoneCount()) {
				reject("You can't remove more than " + this.getMinZoneCount() + " zones...");
			} else {

				this.currentZones.pop(); // Delete last zone
				resolve("Zone <" + (this.currentZones.length + 1) + "> has been removed.");
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
	 * Receive a <IZoneChangeWhisper> and notify all <ZonesComponents> of a zone change.
	 * Instructions are received by all <ZonesComponents>. But only 1 ZonesComponent will apply instructions to himself
	 * @param {IZoneChangeWhisper} zoneChange
	 */
	public whisperZoneChange(zoneChange: IZoneChangeWhisper): void {

		if (zoneChange.to && zoneChange.from && (zoneChange.to == zoneChange.from)) {
			this.zoneChangeOrderUpdates.error("Impossible to notify both 'from' & 'to' changes at the same time");
		}

		if (!_.isNumber(zoneChange.value)) {
			this.zoneChangeOrderUpdates.error("Value provided is not a number");
		}

		const isFirstZoneChange = (zoneChange.sourceId == 0);
		const isLastZoneChange = (zoneChange.sourceId == (this._currentZones.length - 1));

		let instruction: IZoneChangeOrder = {
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

		this.zoneChangeOrderUpdates.next(instruction);
	}

	/**
	 *
	 * @returns {string} Resolve(null) if OK. Reject(errorString) if KO.
	 */
	public isZonesCompliant(zone: IZone[]): string {

		const NOT_COMPLIANT_ZONE = "Not compliant zones provided: pattern is not respected.";

		if (!zone) {
			return "No zones provided";
		}

		if (zone.length > this.getMaxZoneCount()) {
			return "Not compliant zones provided: expected at max " + this.getMaxZoneCount() + " zones";
		}

		if (zone.length < this.getMinZoneCount()) {
			return "Not compliant zones provided: expected at least " + this.getMinZoneCount() + " zones";
		}

		for (let i = 0; i < zone.length; i++) {


			if (i === 0) { // First zone
				if (zone[i].to != zone[i + 1].from) {
					return NOT_COMPLIANT_ZONE;
				}

			} else if (i < (zone.length - 1)) { // Middle zone

				if (zone[i].to != zone[i + 1].from || zone[i].from != zone[i - 1].to) {
					return NOT_COMPLIANT_ZONE;
				}

			} else { // Last zone
				if (zone[i].from != zone[i - 1].to) {
					return NOT_COMPLIANT_ZONE;
				}
			}
		}
		return null;
	}

	/**
	 *
	 * @returns {Promise<string>} Resolve(null) if OK. Reject(errorString) if KO.
	 */
	public saveZones(): Promise<string> {

		return new Promise((resolve: (pass: string) => void,
							reject: (error: string) => void) => {

			const complianceError = this.isZonesCompliant(this.currentZones);

			if (_.isNull(complianceError)) {
				this.chromeStorageService.updateZoneSetting(
					this.zoneDefinition,
					this.currentZones
				).then(() => {
					resolve(null);
				});

			} else {
				reject(complianceError);
			}
		});
	}

	/**
	 * Reset zones to default
	 * @returns {Promise<string>} Resolve(null) if OK. Reject(errorString) if KO.
	 */
	public resetZonesToDefault(): Promise<string> {

		return new Promise((resolve: (ok: string) => void,
							reject: (error: string) => void) => {

			this.currentZones = _.clone(_.propertyOf(userSettings.zones)(this.zoneDefinition.value));

			this.saveZones().then(() => {

				resolve(null);
				this.zonesUpdates.next(this.currentZones); // Notify ZonesSettingsComponent to tell him to reload his zones

			}, (error: string) => {

				reject(error);
				this.zonesUpdates.error(error);

			});

		});
	}

	/**
	 *
	 * @param {string} jsonInput
	 * @returns {Promise<string>} Resolve(null) if OK. Reject(errorString) if KO.
	 */
	public importZones(jsonInput: string): Promise<string> {

		return new Promise((resolve: (ok: string) => void,
							reject: (error: string) => void) => {

			// Try to parse JSON input
			try {
				this.currentZones = <IZone[]> JSON.parse(jsonInput);
			} catch (error) {
				reject("Provided zones do not respect expected JSON format");
				return;
			}

			// Valid JSON Here... Save & emit zones update
			this.saveZones().then(status => {

				this.zonesUpdates.next(this.currentZones);
				resolve(status);

			}, error => {
				reject(error);
			});
		});
	}

	/**
	 * Receive step changes from <ZoneToolBar> and broadcast step change
	 * to <ZoneComponents> which have subscribed to stepUpdates subject
	 * @param {number} step
	 */
	public notifyStepChange(step: number): void {
		this.stepUpdates.next(step);
	}

	/**
	 * Subscription mechanism for a <ZonesComponent>.  When a whisper zone change occurs, then all zones receive
	 * the same instruction. Instruction is targeted toward 1 zone using <IZoneChangeOrder.destinationId>.
	 * That <ZonesComponent> has to follow change instruction
	 * @returns {Subject<IZoneChangeWhisper>}
	 */
	get zoneChangeOrderUpdates(): Subject<IZoneChangeOrder> {
		return this._zoneChangeOrderUpdates;
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

	get stepUpdates(): Subject<number> {
		return this._stepUpdates;
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
