import { Component, OnDestroy, OnInit } from "@angular/core";
import { UserSettingsService } from "../shared/services/user-settings/user-settings.service";
import { UserSettingsModel, UserZonesModel } from "../../../../common/scripts/models/UserSettings";
import { ZoneModel } from "../../../../common/scripts/models/ActivityData";
import * as _ from "lodash";
import { ZONE_DEFINITIONS } from "./zone-definitions";
import { ZonesService } from "./shared/zones.service";
import { ActivatedRoute, Router } from "@angular/router";
import { AppRoutesModel } from "../shared/models/app-routes.model";
import { userSettings } from "../../../../common/scripts/UserSettings";
import { ZoneDefinitionModel } from "../shared/models/zone-definition.model";
import { Subscription } from "rxjs/Subscription";

@Component({
	selector: "app-zones-settings",
	templateUrl: "./zones-settings.component.html",
	styleUrls: ["./zones-settings.component.scss"]
})
export class ZonesSettingsComponent implements OnInit, OnDestroy {

	public static DEFAULT_ZONE_VALUE = "heartRate";

	public zoneDefinitions: ZoneDefinitionModel[] = ZONE_DEFINITIONS;
	public zoneDefinitionSelected: ZoneDefinitionModel;
	public userZones: UserZonesModel;
	public currentZones: ZoneModel[];
	public routeParamsSubscription: Subscription;
	public zonesUpdatesSubscription: Subscription;

	public areZonesLoaded = false;

	constructor(public userSettingsService: UserSettingsService,
				public route: ActivatedRoute,
				public router: Router,
				public zonesService: ZonesService) {
	}

	public ngOnInit(): void {

		// Load user zones config
		this.userSettingsService.fetch().then((userSettingsSynced: UserSettingsModel) => {

			// Load user zones data
			this.userZones = userSettingsSynced.zones;

			// Check zoneValue provided in URL
			this.routeParamsSubscription = this.route.params.subscribe(routeParams => {

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
		this.zonesUpdatesSubscription = this.zonesService.zonesUpdates.subscribe((updatedZones: ZoneModel[]) => {
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

		setTimeout(() => { // Postpone display of zone at the end of all executions
			this.areZonesLoaded = true;
		});

	}

	/**
	 *
	 */
	public onZoneDefinitionSelected(zoneDefinition: ZoneDefinitionModel) {
		this.areZonesLoaded = false;
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

	/**
	 *
	 */
	public ngOnDestroy(): void {
		this.routeParamsSubscription.unsubscribe();
		this.zonesUpdatesSubscription.unsubscribe();
	}
}
