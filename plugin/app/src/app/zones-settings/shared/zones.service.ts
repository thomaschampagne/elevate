import { Injectable } from "@angular/core";
import { ZoneModel } from "../../../../../common/scripts/models/ActivityData";
import * as _ from "lodash";
import { Subject } from "rxjs/Subject";
import { UserSettingsService } from "../../shared/services/user-settings/user-settings.service";
import { userSettings } from "../../../../../common/scripts/UserSettings";
import { ZoneChangeWhisperModel } from "./zone-change-whisper.model";
import { ZoneChangeOrderModel } from "./zone-change-order.model";
import { ZoneDefinitionModel } from "../../shared/models/zone-definition.model";

@Injectable()
export class ZonesService {

	private readonly MAX_ZONES_COUNT: number = 50;
	private readonly MIN_ZONES_COUNT: number = 3;

	public currentZones: ZoneModel[];

	/**
	 * Subscription mechanism for a <ZonesComponent>.  When a whisper zone change occurs, then all zones receive
	 * the same instruction. Instruction is targeted toward 1 zone using <IZoneChangeOrder.destinationId>.
	 * That <ZonesComponent> has to follow change instruction
	 * @returns {Subject<ZoneChangeWhisperModel>}
	 */
	public zoneChangeOrderUpdates: Subject<ZoneChangeOrderModel>;

	/**
	 * Subscription mechanism that notify changes made by <ZonesService> via a zones update.
	 */
	public zonesUpdates: Subject<ZoneModel[]>;
	public stepUpdates: Subject<number>;
	public zoneDefinition: ZoneDefinitionModel;

	constructor(public userSettingsService: UserSettingsService) {
		this.zoneChangeOrderUpdates = new Subject<ZoneChangeOrderModel>();
		this.zonesUpdates = new Subject<ZoneModel[]>();
		this.stepUpdates = new Subject<number>();
	}

	/**
	 *
	 * @returns {Promise<string>}
	 */
	public addLastZone(): Promise<string> {

		return new Promise((resolve: (message: string) => void,
							reject: (error: string) => void) => {

			if (this.currentZones.length >= this.getMaxZoneCount()) {

				reject("You can't add more than " + this.getMaxZoneCount() + " zones...");

			} else {

				const oldLastZone: ZoneModel = this.getLastZone();

				// Computed middle value between oldLastZone.from and oldLastZone.to
				const intermediateZoneValue: number = Math.floor((oldLastZone.from + oldLastZone.to) / 2);

				// Creating new Zone
				const lastZone: ZoneModel = {
					from: intermediateZoneValue,
					to: oldLastZone.to,
				};

				// Apply middle value computed to previous last zone (to)
				this.currentZones[this.currentZones.length - 1].to = intermediateZoneValue;

				// Add the new last zone
				this.currentZones.push(lastZone);

				resolve("Zone <" + this.currentZones.length + "> has been added.");
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

			if (this.currentZones.length <= this.getMinZoneCount()) {

				reject("You can't remove more than " + this.getMinZoneCount() + " zones...");

			} else {

				const isFirstZone = (index === 0);
				const isLastZone = (index === (this.currentZones.length - 1));

				if (isFirstZone || isLastZone) {

					this.currentZones.splice(index, 1);

					resolve("Zone <" + (index + 1) + "> has been removed.");

				} else {

					// Update next from zone with previous zone to
					this.currentZones[index + 1].from = this.currentZones[index - 1].to;

					// Remove zone middle zone id here...
					this.currentZones.splice(index, 1);

					resolve("Zone <" + (index + 1) + "> has been removed.");

				}
			}
		});
	}

	/**
	 * Receive a <ZoneChangeWhisperModel> and notify all <ZonesComponents> of a zone change.
	 * Instructions are received by all <ZonesComponents>. But only 1 ZonesComponent will apply instructions to himself
	 * @param {ZoneChangeWhisperModel} zoneChange
	 */
	public whisperZoneChange(zoneChange: ZoneChangeWhisperModel): void {

		if (zoneChange.to && zoneChange.from && (zoneChange.to === zoneChange.from)) {
			this.zoneChangeOrderUpdates.error("Impossible to notify both 'from' & 'to' changes at the same time");
		}

		if (!_.isNumber(zoneChange.value)) {
			this.zoneChangeOrderUpdates.error("Value provided is not a number");
		}

		const isFirstZoneChange = (zoneChange.sourceId === 0);
		const isLastZoneChange = (zoneChange.sourceId === (this.currentZones.length - 1));

		let instruction: ZoneChangeOrderModel = {
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
	public isZonesCompliant(zones: ZoneModel[]): string {

		const NOT_COMPLIANT_ZONE = "Not compliant zones provided: pattern is not respected.";

		if (!zones) {
			return "No zones provided";
		}

		if (zones.length > this.getMaxZoneCount()) {
			return "Not compliant zones provided: expected at max " + this.getMaxZoneCount() + " zones";
		}

		if (zones.length < this.getMinZoneCount()) {
			return "Not compliant zones provided: expected at least " + this.getMinZoneCount() + " zones";
		}

		for (let i = 0; i < zones.length; i++) {


			if (i === 0) { // First zone
				if (zones[i].to !== zones[i + 1].from) {
					return NOT_COMPLIANT_ZONE;
				}

			} else if (i < (zones.length - 1)) { // Middle zone

				if (zones[i].to !== zones[i + 1].from || zones[i].from !== zones[i - 1].to) {
					return NOT_COMPLIANT_ZONE;
				}

			} else { // Last zone
				if (zones[i].from !== zones[i - 1].to) {
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
	public saveZones(): Promise<void> {

		return new Promise((resolve: () => void,
							reject: (error: string) => void) => {

			const complianceError = this.isZonesCompliant(this.currentZones);

			if (_.isNull(complianceError)) {
				this.userSettingsService.updateZones(
					this.zoneDefinition,
					this.currentZones
				).then(() => {
					return this.userSettingsService.markLocalStorageClear();
				}).then(() => {
					resolve();
				}).catch(error => {
					reject(error);
				});

			} else {
				reject(complianceError);
			}
		});
	}

	/**
	 *
	 * @returns {Promise<void>}
	 */
	public resetZonesToDefault(): Promise<void> {

		return new Promise((resolve: () => void,
							reject: (error: string) => void) => {

			this.currentZones = _.clone(_.propertyOf(userSettings.zones)(this.zoneDefinition.value));

			this.saveZones().then(() => {

				resolve();
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
	 * @returns {Promise<void>}
	 */
	public importZones(jsonInput: string): Promise<void> {

		return new Promise((resolve: () => void,
							reject: (error: string) => void) => {

			// Try to parse JSON input
			try {
				this.currentZones = <ZoneModel[]> JSON.parse(jsonInput);
			} catch (error) {
				reject("Provided zones do not respect expected format");
				return;
			}

			// Valid JSON Here... Save & emit zones update
			this.saveZones().then(() => {

				this.zonesUpdates.next(this.currentZones);
				resolve();

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

	public getLastZone(): ZoneModel {
		return _.last(this.currentZones);
	}

	public getMaxZoneCount(): number {
		return this.MAX_ZONES_COUNT;
	}

	public getMinZoneCount(): number {
		return this.MIN_ZONES_COUNT;
	}

}
