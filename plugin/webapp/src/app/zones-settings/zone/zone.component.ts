import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { IZone } from "../../../../../common/scripts/interfaces/IActivityData";
import { IZoneDefinition } from "../zone-definitions";
import { ZonesService } from "../../services/zones.service";
import { MatSnackBar } from "@angular/material";

@Component({
	selector: 'app-zone',
	templateUrl: './zone.component.html',
	styleUrls: ['./zone.component.scss']
})
export class ZoneComponent implements OnInit, OnChanges {

	@Input("zone")
	private _zone: IZone;

	@Input("zoneId")
	private _zoneId: number;

	@Input("prevZoneFrom")
	private _prevZoneFrom: number;

	@Input("nextZoneTo")
	private _nextZoneTo: number;

	@Input("isFirstZone")
	private _isFirstZone: boolean;

	@Input("isLastZone")
	private _isLastZone: boolean;

	@Input("currentZones")
	private _currentZones: IZone[];

	@Input("zoneDefinition")
	private _zoneDefinition: IZoneDefinition;

	constructor(private zonesService: ZonesService,
				private snackBar: MatSnackBar /*TODO pop Snack from parent?!*/) {
	}

	public ngOnInit() {
	}

	public ngOnChanges(changes: SimpleChanges): void {

		// @see https://www.concretepage.com/angular-2/angular-2-4-onchanges-simplechanges-example

		/*console.debug(changes, this._zoneId, this._zone);

		console.debug(changes.hasOwnProperty('_prevZoneFrom'));
		console.debug(changes.hasOwnProperty('_nextZoneTo'));

		console.debug(changes['_prevZoneFrom']);
		console.debug(changes['_nextZoneTo']);


		if (changes['_prevZoneFrom']) {
			const prevZoneFrom = changes['_prevZoneFrom'].currentValue;
			console.warn(prevZoneFrom);
		}*/

		/*
		for (let propName in changes) {
			let change = changes[propName];
			let curVal  = JSON.stringify(change.currentValue);
			let prevVal = JSON.stringify(change.previousValue);

			console.log(curVal);
			console.log(prevVal);
		}
		*/
	}

	public onRemoveZone(zoneId: number) {

		this.zonesService.removeZone(zoneId)
			.then(
				message => this.popSnack(message),
				error => this.popSnack(error)
			);
	}

	private popSnack(message: string): void {
		// TODO pop Snack from parent?! instead inject snackBar for each zones. low Perf ?!
		this.snackBar.open(message, 'Close', {duration: 2500});
	}

	get zone(): IZone {
		return this._zone;
	}

	set zone(value: IZone) {
		this._zone = value;
	}

	get zoneId(): number {
		return this._zoneId;
	}

	set zoneId(value: number) {
		this._zoneId = value;
	}

	get prevZoneFrom(): number {
		return this._prevZoneFrom;
	}

	set prevZoneFrom(value: number) {
		this._prevZoneFrom = value;
	}

	get nextZoneTo(): number {
		return this._nextZoneTo;
	}

	set nextZoneTo(value: number) {
		this._nextZoneTo = value;
	}

	get isFirstZone(): boolean {
		return this._isFirstZone;
	}

	set isFirstZone(value: boolean) {
		this._isFirstZone = value;
	}

	get isLastZone(): boolean {
		return this._isLastZone;
	}

	set isLastZone(value: boolean) {
		this._isLastZone = value;
	}

	get currentZones(): IZone[] {
		return this._currentZones;
	}

	set currentZones(value: IZone[]) {
		this._currentZones = value;
	}

	get zoneDefinition(): IZoneDefinition {
		return this._zoneDefinition;
	}

	set zoneDefinition(value: IZoneDefinition) {
		this._zoneDefinition = value;
	}
}
