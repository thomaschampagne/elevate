import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from "@angular/router";
import { ChromeStorageService } from "../services/chrome-storage.service";
import { IUserSettings, IUserZones } from "../../../../common/scripts/interfaces/IUserSettings";
import { IZone } from "../../../../common/scripts/interfaces/IActivityData";
import * as _ from "lodash";
import { IZoneDefinition, ZONE_DEFINITIONS } from "./zone-definitions";

@Component({
	selector: 'app-zones-settings',
	templateUrl: './zones-settings.component.html',
	styleUrls: ['./zones-settings.component.scss']
})
// TODO Listen from route params and load proper zones!
export class ZonesSettingsComponent implements OnInit {

	private _zoneDefinitionSelected: string;
	private _zoneDefinitions: IZoneDefinition[] = ZONE_DEFINITIONS;
	private _userZones: IUserZones;
	private _currentZones: IZone[];

	constructor(private chromeStorageService: ChromeStorageService,
				private route: ActivatedRoute) {
	}

	public ngOnInit() {

		this.chromeStorageService.fetchUserSettings().then((userSettingsSynced: IUserSettings) => {
			this._userZones = userSettingsSynced.zones;
		});
	}

	public onZoneDefinitionSelected() {

		console.debug("selected: ", this._zoneDefinitionSelected);
		this._currentZones = _.propertyOf(this._userZones)(this._zoneDefinitionSelected);
		console.debug("currentZones to be edited: ", this._currentZones);
	}

	get userZones(): IUserZones {
		return this._userZones;
	}

	set userZones(value: IUserZones) {
		this._userZones = value;
	}

	get zoneDefinitions(): IZoneDefinition[] {
		return this._zoneDefinitions;
	}

	set zoneDefinitions(value: IZoneDefinition[]) {
		this._zoneDefinitions = value;
	}

	get zoneDefinitionSelected(): string {
		return this._zoneDefinitionSelected;
	}

	set zoneDefinitionSelected(value: string) {
		this._zoneDefinitionSelected = value;
	}

}
