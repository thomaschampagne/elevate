import { Component, OnDestroy, OnInit } from "@angular/core";
import { AppRoutesModel } from "./shared/models/app-routes.model";
import { NavigationEnd, Router, RouterEvent } from "@angular/router";
import * as _ from "lodash";
import { MatDialog, MatSnackBar } from "@angular/material";
import { AboutDialogComponent } from "./about-dialog/about-dialog.component";
import { SideNavService } from "./shared/services/side-nav/side-nav.service";
import { SideNavStatus } from "./shared/services/side-nav/side-nav-status.enum";
import { Subscription } from "rxjs/Subscription";
import { WindowService } from "./shared/services/window/window.service";
import * as moment from "moment";
import { AthleteHistoryService } from "./shared/services/athlete-history/athlete-history.service";

// DONE Synchronisation start, display last sync (with Athlete Profile)
// TODO History import/export/clear
// DONE Move SyncedAthleteProfileService methods in AthleteHistoryService

// TODO:BUG synced activities models can be partially synced without last sync date time stored => fit trend & yaer progress can be loaded without full data
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
				public athleteHistoryService: AthleteHistoryService,
				public dialog: MatDialog,
				public snackBar: MatSnackBar,
				public sideNavService: SideNavService,
				public windowService: WindowService) {
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

		// Update sync status in toolbar and Refresh LastSyncDate displayed every minutes
		this.updateLastSyncDateStatus();
		setInterval(() => {
			this.updateLastSyncDateStatus()
		}, 1000 * 60);

		this.setupWindowResizeBroadcast();
	}

	public updateLastSyncDateStatus(): void {

		this.athleteHistoryService.getLastSyncDateTime().then((lastSyncDateTime: number) => {
			if (_.isNumber(lastSyncDateTime)) {
				this.isSynced = true;
				this.syncedStateMessage = "Synced " + moment(lastSyncDateTime).fromNow();
			} else {
				this.isSynced = false;
			}
		});
	}

	public setupWindowResizeBroadcast(): void {
		window.onresize = (event: Event) => {
			this.windowService.onResize(event); // When user resize the window. Tell it to subscribers
		};
	}

	public onAthleteHistorySync(forceSync: boolean): void {
		this.athleteHistoryService.sync(forceSync);
	};

	public onAthleteHistoryRemove(): void {

		// TODO warning confirm dialog
		this.athleteHistoryService.remove().then(() => {
			window.location.reload();
		}, error => {
			this.snackBar.open(error, "Close", {duration: 5000});
		});
	}

	public onAthleteHistoryExport(): void {
		// TODO info dialog in download folder
		this.athleteHistoryService.export().then((result: any) => {

			console.log(result);

		}, error => {
			this.snackBar.open(error, "Close", {duration: 5000});
		});
	}

	public onAthleteHistoryImport(): void {
		// TODO dialog import
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
