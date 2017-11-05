import { Component, OnInit } from '@angular/core';
import { appRoutes } from "./app-routes";

export interface MainMenuItem {
	name: string;
	icon: string;
	routerLink: string;
	routerLinkActive: boolean;
}

@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

	private _mainMenuItems: MainMenuItem[];

	get mainMenuItems(): MainMenuItem[] {
		return this._mainMenuItems;
	}

	public ngOnInit(): void {

		this._mainMenuItems = [
			{
				name: 'Common Settings',
				icon: 'settings',
				routerLink: appRoutes.commonSettings,
				routerLinkActive: true
			},
			{
				name: 'Athlete Settings',
				icon: 'accessibility',
				routerLink: appRoutes.athleteSettings,
				routerLinkActive: true
			}
		];
	}

	public onMenuClicked(item: MainMenuItem): void {
		console.log("Clicked %s", item.name);
	}
}
