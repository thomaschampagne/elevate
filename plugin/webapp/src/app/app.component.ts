import { routes } from "./shared/routing.module";
import { Component, OnInit } from "@angular/core";

export interface MainMenuItem {
	name: string;
	icon: string;
	routerLink: string;
	routerLinkActive: boolean;
}

@Component({
	selector: "app-root",
	templateUrl: "./app.component.html",
	styleUrls: ["./app.component.css"]
})

export class AppComponent implements OnInit {

	private _mainMenuItems: MainMenuItem[];

	ngOnInit(): void {

		this._mainMenuItems = [
			{
				name: 'Common Settings',
				icon: 'settings',
				routerLink: routes.commonSettings,
				routerLinkActive: true
			},
			{
				name: 'Athlete Settings',
				icon: 'accessibility',
				routerLink: routes.athleteSettings,
				routerLinkActive: true
			}
		];
	}

	public onMenuClicked(item: MainMenuItem): void {
		alert(item.name);
	}

	get mainMenuItems(): MainMenuItem[] {
		return this._mainMenuItems;
	}
}

export interface MainMenuItem {
	name: string;
	icon: string;
	routerLink: string;
	routerLinkActive: boolean;
}
