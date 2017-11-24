import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from "@angular/router";
import { ChromeStorageService } from "../services/chrome-storage.service";
import { IUserSettings, IUserZones } from "../../../../common/scripts/interfaces/IUserSettings";
import { IZone } from "../../../../common/scripts/interfaces/IActivityData";
import * as _ from "lodash";
import { IZoneDefinition, ZONE_DEFINITIONS } from "./zone-definitions";
import { ZonesService } from "../services/zones.service";

@Component({
	selector: 'app-zones-settings',
	templateUrl: './zones-settings.component.html',
	styleUrls: ['./zones-settings.component.scss']
})
// TODO Listen from route params and load proper zones!
export class ZonesSettingsComponent implements OnInit {

	public static DEFAULT_ZONE_VALUE: string = "speed"; // equals Cycling Speed

	private _zoneDefinitions: IZoneDefinition[] = ZONE_DEFINITIONS;
	private _zoneDefinitionSelected: IZoneDefinition;
	private _userZones: IUserZones;
	private _currentZones: IZone[];

	constructor(private chromeStorageService: ChromeStorageService,
				private zonesService: ZonesService,
				private route: ActivatedRoute) {
	}

	public ngOnInit() {

		this.chromeStorageService.fetchUserSettings().then((userSettingsSynced: IUserSettings) => {

			// Load user zones data
			this._userZones = userSettingsSynced.zones;

			// Set cycling speed zones as default current zones
			const cyclingSpeedZoneDefinition: IZoneDefinition = _.find(this.zoneDefinitions,
				{
					value: ZonesSettingsComponent.DEFAULT_ZONE_VALUE
				}
			);

			this.loadZonesFromDefinition(cyclingSpeedZoneDefinition);
		});
	}

	/**
	 * Load current zones from a zone definition.
	 * Also update the current zones managed by the zone service to add, remove, reset, import, export, ... zones.
	 * @param {IZoneDefinition} zoneDefinition
	 */
	private loadZonesFromDefinition(zoneDefinition: IZoneDefinition) {

		// Load current zone from zone definition provided
		this._currentZones = _.propertyOf(this._userZones)(zoneDefinition.value);

		// Update current zones & zone definition managed by the zones service
		this.zonesService.currentZones = this._currentZones;
		this.zonesService.zoneDefinition = zoneDefinition;

		// Update the zone definition used
		this._zoneDefinitionSelected = zoneDefinition;
	}

	/**
	 * Use
	 */
	public onZoneDefinitionSelected() {
		this.loadZonesFromDefinition(this._zoneDefinitionSelected);
	}

	get currentZones(): IZone[] {
		return this._currentZones;
	}

	set currentZones(value: IZone[]) {
		this._currentZones = value;
	}

	get zoneDefinitions(): IZoneDefinition[] {
		return this._zoneDefinitions;
	}

	set zoneDefinitions(value: IZoneDefinition[]) {
		this._zoneDefinitions = value;
	}

	get zoneDefinitionSelected(): IZoneDefinition {
		return this._zoneDefinitionSelected;
	}

	set zoneDefinitionSelected(value: IZoneDefinition) {
		this._zoneDefinitionSelected = value;
	}
}
