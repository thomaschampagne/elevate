import { Component, OnInit } from "@angular/core";
import { AppRoutes } from "./shared/models/app-routes.model";
import { NavigationEnd, Router, RouterEvent } from "@angular/router";
import * as _ from "lodash";

export interface MainMenuItem {
	name: string;
	icon: string;
	routerLink: string;
	routerLinkActive: boolean;
}

@Component({
	selector: "app-root",
	templateUrl: "./app.component.html",
	styleUrls: ["./app.component.scss"]
})
export class AppComponent implements OnInit {

	public title: string;
	public mainMenuItems: MainMenuItem[] = [
		{
			name: "Fitness Trend",
			icon: "timeline",
			routerLink: AppRoutes.fitnessTrend,
			routerLinkActive: true
		},
		{
			name: "Common Settings",
			icon: "settings",
			routerLink: AppRoutes.commonSettings,
			routerLinkActive: true
		},
		{
			name: "Athlete Settings",
			icon: "accessibility",
			routerLink: AppRoutes.athleteSettings,
			routerLinkActive: true
		},
		{
			name: "Zones Settings",
			icon: "format_line_spacing",
			routerLink: AppRoutes.zonesSettings,
			routerLinkActive: true
		}
	];

	public static updateToolBarTitle(url: string): string {
		const splitUrl = _.split(url, "/");
		splitUrl.shift(); // Remove first slash
		return _.startCase(_.upperFirst(_.first(splitUrl)));
	}

	constructor(private router: Router) {
	}

	public ngOnInit(): void {

		this.title = AppComponent.updateToolBarTitle(this.router.url);

		this.router.events.subscribe((routerEvent: RouterEvent) => {
			if (routerEvent instanceof NavigationEnd) {
				this.title = AppComponent.updateToolBarTitle(routerEvent.url);
			}
		});
	}

	public onMenuClicked(item: MainMenuItem): void {
		console.log("Clicked %s", item.name);
	}

}
