import { Component, OnInit } from "@angular/core";
import { AppRoutesModel } from "./shared/models/app-routes.model";
import { NavigationEnd, Router, RouterEvent } from "@angular/router";
import * as _ from "lodash";

class MenuItemModel {
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
	public mainMenuItems: MenuItemModel[] = [
		{
			name: "Fitness Trend",
			icon: "timeline",
			routerLink: AppRoutesModel.fitnessTrend,
			routerLinkActive: true
		},
		{
			name: "Common Settings",
			icon: "settings",
			routerLink: AppRoutesModel.commonSettings,
			routerLinkActive: true
		},
		{
			name: "Athlete Settings",
			icon: "accessibility",
			routerLink: AppRoutesModel.athleteSettings,
			routerLinkActive: true
		},
		{
			name: "Zones Settings",
			icon: "format_line_spacing",
			routerLink: AppRoutesModel.zonesSettings,
			routerLinkActive: true
		}
	];

	public static updateToolBarTitle(routerUrl: string): string {

		if (_.isEmpty(routerUrl)) {
			return null;
		}

		const splitRouterUrl = _.split(routerUrl, "/");
		splitRouterUrl.shift(); // Remove first slash
		return _.startCase(_.upperFirst(_.first(splitRouterUrl)));

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

	public onShowShare(): void {
		// TODO ..
	}

	public onShowAbout(): void {
		// TODO ..
	}


	public onOpenLink(url: string): void {
		window.open(url, "_blank")
	}

	/*
        public onMenuClicked(item: MenuItemModel): void {
            console.log("Clicked %s", item.name);
        }
    */

}
