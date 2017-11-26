import { Component, OnInit } from '@angular/core';
import { UserSettingsService } from "../services/user-settings/user-settings.service";
import { IUserSettings, IUserZones } from "../../../../common/scripts/interfaces/IUserSettings";
import { IZone } from "../../../../common/scripts/interfaces/IActivityData";
import * as _ from "lodash";
import { IZoneDefinition, ZONE_DEFINITIONS, } from "./zone-definitions";
import { ZonesService } from "../services/zones/zones.service";
import { ActivatedRoute, Router } from "@angular/router";
import { appRouteNames } from "../app-route-names";
import { userSettings } from "../../../../common/scripts/UserSettings";

@Component({
	selector: 'app-zones-settings',
	templateUrl: './zones-settings.component.html',
	styleUrls: ['./zones-settings.component.scss']
})
export class ZonesSettingsComponent implements OnInit {

	public static DEFAULT_ZONE_VALUE: string = "speed";

	private _zoneDefinitions: IZoneDefinition[] = ZONE_DEFINITIONS;
	private _zoneDefinitionSelected: IZoneDefinition;
	private _userZones: IUserZones;
	private _currentZones: IZone[];

	constructor(private userSettingsService: UserSettingsService,
				private route: ActivatedRoute,
				private router: Router,
				private zonesService: ZonesService) {
	}

	public ngOnInit(): void {

		// Load user zones config
		this.userSettingsService.fetchUserSettings().then((userSettingsSynced: IUserSettings) => {

			// Load user zones data
			this._userZones = userSettingsSynced.zones;

			// Check zoneValue provided in URL
			this.route.params.subscribe(routeParams => {

				let zoneDefinition: IZoneDefinition = null;

				const hasZoneValueInRoute = !_.isEmpty(routeParams.zoneValue);

				if (hasZoneValueInRoute && _.has(userSettings.zones, routeParams.zoneValue)) {

					zoneDefinition = this.getZoneDefinitionFromZoneValue(routeParams.zoneValue);

				} else {
					this.navigateToZone(ZonesSettingsComponent.DEFAULT_ZONE_VALUE);
					return;
				}

				this.loadZonesFromDefinition(zoneDefinition);
			});

		});

		// Listen for reload request from ZonesService
		// This happen when ZoneService perform a resetZonesToDefault of a zones set.
		this.zonesService.zonesUpdates.subscribe((updatedZones: IZone[]) => {
			this._currentZones = updatedZones;
		});
	}

	/**
	 *
	 * @param {string} zoneValue
	 * @returns {IZoneDefinition}
	 */
	private getZoneDefinitionFromZoneValue(zoneValue: string): IZoneDefinition {
		return _.find(this.zoneDefinitions, {value: zoneValue});
	}

	/**
	 * Load current zones from a zone definition.
	 * Also update the current zones managed by the zone service to add, remove, reset, import, export, ... zones.
	 * @param {IZoneDefinition} zoneDefinition
	 * @param {string} overrideDefinitionTrigger
	 */
	private loadZonesFromDefinition(zoneDefinition: IZoneDefinition) {

		// Load current zone from zone definition provided
		this.currentZones = _.propertyOf(this._userZones)(zoneDefinition.value);

		// Update current zones & zone definition managed by the zones service
		this.zonesService.currentZones = this.currentZones;
		this.zonesService.zoneDefinition = zoneDefinition;

		// Update the zone definition used
		this.zoneDefinitionSelected = zoneDefinition;
	}

	/**
	 *
	 */
	public onZoneDefinitionSelected(zoneDefinition: IZoneDefinition) {
		this.navigateToZone(zoneDefinition.value);
	}

	private navigateToZone(zoneValue: string) {
		const selectedZoneUrl = appRouteNames.zonesSettings + "/" + zoneValue;
		this.router.navigate([selectedZoneUrl]);
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
