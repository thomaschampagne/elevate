import { Component, OnDestroy, OnInit } from "@angular/core";
import { AppRoutesModel } from "./shared/models/app-routes.model";
import { NavigationEnd, Router, RouterEvent } from "@angular/router";
import * as _ from "lodash";
import { MatDialog } from "@angular/material";
import { AboutDialogComponent } from "./about-dialog/about-dialog.component";
import { SideNavService } from "./shared/services/side-nav/side-nav.service";
import { SideNavStatus } from "./shared/services/side-nav/side-nav-status.enum";
import { Subscription } from "rxjs/Subscription";
import { WindowService } from "./shared/services/window/window.service";
import { SyncedAthleteProfileService } from "./shared/services/synced-athlete-profile/synced-athlete-profile.service";
import * as moment from "moment";

// TODO Synchronisation start, display last sync (with Athlete Profile)
// TODO History import/export/clear
// TODO:BUG @Fitness Trend: resize windows from fitness table cause: ERROR TypeError: Cannot read property 'style' of null

// TODO:FEAT @YearProgress Add Trimp progress EZ !!
// TODO:FEAT @YearProgress Support Progress last year in graph (https://github.com/thomaschampagne/stravistix/issues/484)
// TODO:FEAT @YearProgress Year progress Targets line display (by KEYS = activityTypes & ProgressType)

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
export class AppComponent implements OnInit, OnDestroy {

	public static readonly DEFAULT_SIDE_NAV_STATUS: SideNavStatus = SideNavStatus.OPENED;
	public static readonly DEFAULT_SIDE_NAV_MODE: string = "side";

	public routerEventsSubscription: Subscription;
	public title: string;
	public sideNavOpened: boolean;
	public sideNavMode: string;
	public isSynced: boolean;
	public syncedStateMessage: string;
	public readonly mainMenuItems: Partial<MenuItemModel>[] = [
		{
			icon: "timeline",
			routerLink: AppRoutesModel.fitnessTrend,
			routerLinkActive: true
		}, {
			icon: "date_range",
			routerLink: AppRoutesModel.yearProgressions,
			routerLinkActive: true
		}, {
			icon: "settings",
			routerLink: AppRoutesModel.commonSettings,
			routerLinkActive: true
		}, {
			icon: "accessibility",
			routerLink: AppRoutesModel.athleteSettings,
			routerLinkActive: true
		}, {
			icon: "format_line_spacing",
			routerLink: AppRoutesModel.zonesSettings,
			routerLinkActive: true
		},
		{
			icon: "favorite",
			routerLink: AppRoutesModel.donate,
			routerLinkActive: true
		}
	];

	public static convertRouteToTitle(route: string): string {

		if (_.isEmpty(route)) {
			return null;
		}

		const routeAsArray: string[] = _.split(route, "/");

		let title = null;

		if (routeAsArray.length > 1) {
			routeAsArray.shift(); // Remove first slash
			title = _.first(routeAsArray);
		} else {
			title = routeAsArray;
		}

		return _.startCase(_.upperFirst(title));

	}

	constructor(public router: Router,
				public syncedAthleteProfileService: SyncedAthleteProfileService,
				public sideNavService: SideNavService,
				public windowService: WindowService,
				public dialog: MatDialog) {
	}

	public ngOnInit(): void {

		// Update list of sections names displayed in sidebar
		_.forEach(this.mainMenuItems, (menuItemModel: MenuItemModel) => {
			menuItemModel.name = AppComponent.convertRouteToTitle(menuItemModel.routerLink);
		});

		this.sideNavOpened = (AppComponent.DEFAULT_SIDE_NAV_STATUS === SideNavStatus.OPENED);
		this.sideNavMode = AppComponent.DEFAULT_SIDE_NAV_MODE;

		this.title = AppComponent.convertRouteToTitle(this.router.url);

		this.routerEventsSubscription = this.router.events.subscribe((routerEvent: RouterEvent) => {
			if (routerEvent instanceof NavigationEnd) {
				this.title = AppComponent.convertRouteToTitle(routerEvent.url);
			}
		});

		// Update sync status in toolbar
		this.syncedAthleteProfileService.getLastSyncDateTime().then((lastSyncDateTime: number) => {

			if (_.isNumber(lastSyncDateTime)) {
				this.isSynced = true;
				this.syncedStateMessage = "Synced " + moment(lastSyncDateTime).fromNow();
			} else {
				this.isSynced = false;
			}

		});

		this.setupWindowResizeBroadcast();
	}

	public setupWindowResizeBroadcast(): void {
		window.onresize = (event: Event) => {
			this.windowService.onResize(event); // When user resize the window. Tell it to subscribers
		};
	}

	public onSync(forceSync: boolean): void {
		chrome.tabs.getCurrent((tab: chrome.tabs.Tab) => {
			const params = "?stravistixSync=true&forceSync=" + forceSync + "&sourceTabId=" + tab.id;
			const url = "https://www.strava.com/dashboard" + params;
			window.open(url, "_blank", "width=700, height=675, location=0");
		});
	};

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
		this.sideNavService.onChange(SideNavStatus.CLOSED);
	}

	public onSideNavOpened(): void {
		this.sideNavService.onChange(SideNavStatus.OPENED);
	}

	public onOpenLink(url: string): void {
		window.open(url, "_blank")
	}

	public ngOnDestroy(): void {
		this.routerEventsSubscription.unsubscribe();
	}

}
