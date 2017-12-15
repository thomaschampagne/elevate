import { Component, OnInit } from "@angular/core";
import { AppRoutesModel } from "./shared/models/app-routes.model";
import { NavigationEnd, Router, RouterEvent } from "@angular/router";
import * as _ from "lodash";
import { MatDialog } from "@angular/material";
import { AboutDialogComponent } from "./about-dialog/about-dialog.component";

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
		}, {
			name: "Year Progression",
			icon: "date_range",
			routerLink: AppRoutesModel.yearProgress,
			routerLinkActive: true
		}, {
			name: "Common Settings",
			icon: "settings",
			routerLink: AppRoutesModel.commonSettings,
			routerLinkActive: true
		}, {
			name: "Athlete Settings",
			icon: "accessibility",
			routerLink: AppRoutesModel.athleteSettings,
			routerLinkActive: true
		}, {
			name: "Zones Settings",
			icon: "format_line_spacing",
			routerLink: AppRoutesModel.zonesSettings,
			routerLinkActive: true
		},
		{
			name: "Donate",
			icon: "favorite",
			routerLink: AppRoutesModel.donate,
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

	constructor(private router: Router,
				private dialog: MatDialog) {
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
		this.dialog.open(AboutDialogComponent, {
			minWidth: AboutDialogComponent.MIN_WIDTH,
			maxWidth: AboutDialogComponent.MAX_WIDTH,
		});
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
