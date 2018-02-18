import { Component, Input, OnDestroy, OnInit } from "@angular/core";
import { ZoneModel } from "../../../../../common/scripts/models/ActivityData";
import { ZonesService } from "../shared/zones.service";
import { MatSnackBar } from "@angular/material";
import * as _ from "lodash";
import { ZoneChangeOrderModel } from "../shared/zone-change-order.model";
import { ZoneChangeWhisperModel } from "../shared/zone-change-whisper.model";
import { ZoneChangeTypeModel } from "./zone-change-type.model";
import { ZoneDefinitionModel } from "../../shared/models/zone-definition.model";
import { Subscription } from "rxjs/Subscription";

@Component({
	selector: "app-zone",
	templateUrl: "./zone.component.html",
	styleUrls: ["./zone.component.scss"]
})
export class ZoneComponent implements OnInit, OnDestroy {

	@Input("zone")
	public zone: ZoneModel;

	@Input("zoneId")
	public zoneId: number;

	@Input("zoneFrom")
	public zoneFrom: number;

	@Input("zoneTo")
	public zoneTo: number;

	@Input("prevZoneFrom")
	public prevZoneFrom: number;

	@Input("nextZoneTo")
	public nextZoneTo: number;

	@Input("isFirstZone")
	public isFirstZone: boolean;

	@Input("isLastZone")
	public isLastZone: boolean;

	@Input("currentZones")
	public currentZones: ZoneModel[];

	@Input("zoneDefinition")
	public zoneDefinition: ZoneDefinitionModel;

	public zoneChangeOrderSubscription: Subscription;

	public stepUpdatesSubscription: Subscription;

	constructor(public zonesService: ZonesService,
				public snackBar: MatSnackBar) {
	}

	public ngOnInit(): void {

		this.zoneChangeOrderSubscription = this.zonesService.zoneChangeOrderUpdates.subscribe((change: ZoneChangeOrderModel) => {

			const isChangeOrderForMe = (!_.isNull(change) && (this.zoneId === change.destinationId));

			if (isChangeOrderForMe) {
				this.applyChangeOrder(change);
			}

		}, error => {

			console.error(error);

		}, () => {

			console.log("InstructionListener complete");

		});

		this.stepUpdatesSubscription = this.zonesService.stepUpdates.subscribe((step: number) => {
			this.zoneDefinition.step = step;
		});
	}

	public onZoneChange(changeType: ZoneChangeTypeModel): void {
		this.whisperZoneChange(changeType);
	}

	/**
	 * Whisper a ZoneChangeWhisperModel to <ZoneService>
	 * @param {ZoneChangeTypeModel} changeType
	 */
	public whisperZoneChange(changeType: ZoneChangeTypeModel): void {

		if (changeType.from && changeType.to) { // Skip notify zone service on first component display
			return;
		}

		if (changeType.from || changeType.to) {

			const zoneChangeWhisper: ZoneChangeWhisperModel = {
				sourceId: this.zoneId,
				from: false,
				to: false,
				value: null
			};

			if (changeType.from) {
				zoneChangeWhisper.from = true;
				zoneChangeWhisper.value = this.zone.from;
			} else if (changeType.to) {
				zoneChangeWhisper.to = true;
				zoneChangeWhisper.value = this.zone.to;
			}

			this.zonesService.whisperZoneChange(zoneChangeWhisper);
		}
	}

	private applyChangeOrder(instruction: ZoneChangeOrderModel): void {

		if (instruction.from) {
			this.zone.from = instruction.value;
		}
		if (instruction.to) {
			this.zone.to = instruction.value;
		}
	}

	public onRemoveZoneAtIndex(zoneId: number): void {

		this.zonesService.removeZoneAtIndex(zoneId)
			.then(
				message => this.popSnack(message),
				error => this.popSnack(error)
			);
	}

	/**
	 * Avoid
	 * @param {KeyboardEvent} event
	 */
	public onKeyDown(event: KeyboardEvent): void {

		const whiteListCode = [
			38, // Up arrow
			40, // Down arrow
			9, // Tab
			16 // Shift
		];

		const isKeyWhiteListed = _.indexOf(whiteListCode, event.keyCode) === -1;

		if (isKeyWhiteListed) {
			event.preventDefault();
		}
	}

	private popSnack(message: string): void {
		this.snackBar.open(message, "Close", {duration: 2500});
	}

	public ngOnDestroy(): void {
		this.zoneChangeOrderSubscription.unsubscribe();
		this.stepUpdatesSubscription.unsubscribe();
	}
}
