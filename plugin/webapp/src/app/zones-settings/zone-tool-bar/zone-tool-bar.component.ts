import { Component, Input, OnInit } from '@angular/core';
import { IZone } from "../../../../../common/scripts/interfaces/IActivityData";
import { ZonesService } from "../../services/zones.service";

@Component({
	selector: 'app-zone-tool-bar',
	templateUrl: './zone-tool-bar.component.html',
	styleUrls: ['./zone-tool-bar.component.scss']
})
export class ZoneToolBarComponent implements OnInit {

	@Input("currentZones")
	private _currentZones: IZone[];

	constructor(private zonesService: ZonesService) {
	}

	public ngOnInit() {
	}

	public onAddZone() {
		this.zonesService.addZone();
	}

	public onRemoveZone() {
		this.zonesService.removeZone();
	}

	get currentZones(): IZone[] {
		return this._currentZones;
	}

	set currentZones(value: IZone[]) {
		this._currentZones = value;
	}
}
