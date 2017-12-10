import { Component, OnInit } from "@angular/core";
import { UserSettingsService } from "../shared/services/user-settings/user-settings.service";
import { IUserSettings, IUserZones } from "../../../../common/scripts/interfaces/IUserSettings";
import { IZone } from "../../../../common/scripts/interfaces/IActivityData";
import * as _ from "lodash";
import { ZONE_DEFINITIONS } from "./zone-definitions";
import { ZonesService } from "./shared/zones.service";
import { ActivatedRoute, Router } from "@angular/router";
import { AppRoutesModel } from "../shared/models/app-routes.model";
import { userSettings } from "../../../../common/scripts/UserSettings";
import { ZoneDefinitionModel } from "../shared/models/zone-definition.model";

@Component({
	selector: "app-zones-settings",
	templateUrl: "./zones-settings.component.html",
	styleUrls: ["./zones-settings.component.scss"]
})
export class ZonesSettingsComponent implements OnInit {

	public static DEFAULT_ZONE_VALUE = "speed";

	public zoneDefinitions: ZoneDefinitionModel[] = ZONE_DEFINITIONS;
	public zoneDefinitionSelected: ZoneDefinitionModel;
	public userZones: IUserZones;
	public currentZones: IZone[];

	constructor(private userSettingsService: UserSettingsService,
				private route: ActivatedRoute,
				private router: Router,
				private zonesService: ZonesService) {
	}

	public ngOnInit(): void {

		// Load user zones config
		this.userSettingsService.fetch().then((userSettingsSynced: IUserSettings) => {

			// Load user zones data
			this.userZones = userSettingsSynced.zones;

			// Check zoneValue provided in URL
			this.route.params.subscribe(routeParams => {

				let zoneDefinition: ZoneDefinitionModel = null;

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
			this.currentZones = updatedZones;
		});
	}

	/**
	 *
	 * @param {string} zoneValue
	 * @returns {ZoneDefinitionModel}
	 */
	private getZoneDefinitionFromZoneValue(zoneValue: string): ZoneDefinitionModel {
		return _.find(this.zoneDefinitions, {value: zoneValue});
	}

	/**
	 * Load current zones from a zone definition.
	 * Also update the current zones managed by the zone service to add, remove, reset, import, export, ... zones.
	 * @param {ZoneDefinitionModel} zoneDefinition
	 * @param {string} overrideDefinitionTrigger
	 */
	private loadZonesFromDefinition(zoneDefinition: ZoneDefinitionModel) {

		// Load current zone from zone definition provided
		this.currentZones = _.propertyOf(this.userZones)(zoneDefinition.value);

		// Update current zones & zone definition managed by the zones service
		this.zonesService.currentZones = this.currentZones;
		this.zonesService.zoneDefinition = zoneDefinition;

		// Update the zone definition used
		this.zoneDefinitionSelected = zoneDefinition;
	}

	/**
	 *
	 */
	public onZoneDefinitionSelected(zoneDefinition: ZoneDefinitionModel) {
		this.navigateToZone(zoneDefinition.value);
	}

	/**
	 *
	 * @param {string} zoneValue
	 */
	private navigateToZone(zoneValue: string) {
		const selectedZoneUrl = AppRoutesModel.zonesSettings + "/" + zoneValue;
		this.router.navigate([selectedZoneUrl]);
	}
}
