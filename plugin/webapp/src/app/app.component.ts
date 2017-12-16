import { Component, OnInit } from "@angular/core";
import { AppRoutesModel } from "./shared/models/app-routes.model";
import { NavigationEnd, Router, RouterEvent } from "@angular/router";
import * as _ from "lodash";
import { MatDialog } from "@angular/material";
import { AboutDialogComponent } from "./about-dialog/about-dialog.component";
import { SideNavService } from "./shared/services/side-nav/side-nav.service";
import { SideNavStatus } from "./shared/services/side-nav/side-nav-status.enum";

class MenuItemModel {
	name: string;
	icon: string;
	routerLink: string;
	routerLinkActive: boolean;
}

@Component({
	selector: "app-root",
	templateUrl: "./app.component.html",
	styleUrls: ["./app.component.scss"],
	providers: [SideNavService]
})
export class AppComponent implements OnInit {

	public static readonly DEFAULT_SIDE_NAV_STATUS: SideNavStatus = SideNavStatus.OPENED;
	public static readonly DEFAULT_SIDE_NAV_MODE: string = "side";

	public title: string;
	public sideNavOpened: boolean;
	public sideNavMode: string;
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

	constructor(public router: Router,
				public sideNavService: SideNavService,
				public dialog: MatDialog) {
	}

	public ngOnInit(): void {

		this.sideNavOpened = (AppComponent.DEFAULT_SIDE_NAV_STATUS === SideNavStatus.OPENED);
		this.sideNavMode = AppComponent.DEFAULT_SIDE_NAV_MODE;

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

	public onSideNavClosed(): void {
		this.sideNavService.onChanged(SideNavStatus.CLOSED);
	}

	public onSideNavOpened(): void {
		this.sideNavService.onChanged(SideNavStatus.OPENED);
	}

	public onOpenLink(url: string): void {
		window.open(url, "_blank")
	}
}
