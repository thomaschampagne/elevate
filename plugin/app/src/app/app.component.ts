import { Component, OnDestroy, OnInit, Renderer2, ViewChild } from "@angular/core";
import { AppRoutesModel } from "./shared/models/app-routes.model";
import { NavigationEnd, Router, RouterEvent } from "@angular/router";
import * as _ from "lodash";
import * as moment from "moment";
import { MatDialog, MatIconRegistry, MatSidenav, MatSnackBar } from "@angular/material";
import { AboutDialogComponent } from "./about-dialog/about-dialog.component";
import { SideNavService } from "./shared/services/side-nav/side-nav.service";
import { SideNavStatus } from "./shared/services/side-nav/side-nav-status.enum";
import { Subscription } from "rxjs/Subscription";
import { WindowService } from "./shared/services/window/window.service";
import { AthleteHistoryService } from "./shared/services/athlete-history/athlete-history.service";
import { ConfirmDialogComponent } from "./shared/dialogs/confirm-dialog/confirm-dialog.component";
import { ConfirmDialogDataModel } from "./shared/dialogs/confirm-dialog/confirm-dialog-data.model";
import { GotItDialogComponent } from "./shared/dialogs/got-it-dialog/got-it-dialog.component";
import { GotItDialogDataModel } from "./shared/dialogs/got-it-dialog/got-it-dialog-data.model";
import { AthleteHistoryImportDialogComponent } from "./shared/dialogs/athlete-history-import-dialog/athlete-history-import-dialog.component";
import { AthleteHistoryModel } from "./shared/services/athlete-history/athlete-history.model";
import { AthleteHistoryState } from "./shared/services/athlete-history/athlete-history-state.enum";
import { DomSanitizer } from "@angular/platform-browser";
import { OverlayContainer } from "@angular/cdk/overlay";
import { Theme } from "./shared/enums/theme.enum";

// TODO Try to reuse metrics graphics (official) back

//--------
// TODO:FEAT @YearProgress Add Trimp progress EZ !!
// TODO:FEAT @YearProgress Support Progress last year in graph (https://github.com/thomaschampagne/stravistix/issues/484)
// TODO:FEAT @YearProgress Year progress Targets line display (by KEYS = activityTypes & ProgressType)
// TODO: LoggerService

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

	public static readonly LS_SIDE_NAV_OPENED_KEY: string = "app_sideNavOpened";
	public static readonly LS_USER_THEME_PREF: string = "theme";

	public Theme = Theme;
	public currentTheme: Theme;

	public toolBarTitle: string;
	public AthleteHistoryState = AthleteHistoryState;
	public athleteHistoryState: AthleteHistoryState;
	public lastSyncDateMessage: string;
	public routerEventsSubscription: Subscription;

	@ViewChild(MatSidenav)
	public sideNav: MatSidenav;
	public sideNavMode: string;

	public readonly mainMenuItems: Partial<MenuItemModel>[] = [
		{
			icon: "home",
			routerLink: AppRoutesModel.welcome,
			routerLinkActive: true
		},
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
		}
	];

	public static convertRouteToTitle(route: string): string {

		if (_.isEmpty(route)) {
			return null;
		}

		const routeAsArray: string[] = _.split(route, "/");

		if (_.isEmpty(_.first(routeAsArray))) {
			routeAsArray.shift(); // Remove first element if empty (occurs when first char is "/")
		}

		let title = _.first(routeAsArray);
		title = _.first(title.split("?")); // Remove GET Params from route

		return _.startCase(_.upperFirst(title));
	}

	constructor(public router: Router,
				public athleteHistoryService: AthleteHistoryService,
				public dialog: MatDialog,
				public snackBar: MatSnackBar,
				public sideNavService: SideNavService,
				public windowService: WindowService,
				public overlayContainer: OverlayContainer,
				public renderer: Renderer2,
				public iconRegistry: MatIconRegistry,
				public sanitizer: DomSanitizer) {

		this.registerCustomIcons();

	}

	public ngOnInit(): void {

		this.setupThemeOnLoad();

		// Update list of sections names displayed in sidebar
		_.forEach(this.mainMenuItems, (menuItemModel: MenuItemModel) => {
			menuItemModel.name = AppComponent.convertRouteToTitle(menuItemModel.routerLink);
		});

		this.sideNavSetup();

		this.toolBarTitle = AppComponent.convertRouteToTitle(this.router.url);

		this.routerEventsSubscription = this.router.events.subscribe((routerEvent: RouterEvent) => {
			if (routerEvent instanceof NavigationEnd) {
				this.toolBarTitle = AppComponent.convertRouteToTitle(routerEvent.url);
			}
		});

		// Update sync status in toolbar and Refresh LastSyncDate displayed every minutes
		this.updateLastSyncDateStatus();
		setInterval(() => {
			this.updateLastSyncDateStatus();
		}, 1000 * 60);

		this.setupWindowResizeBroadcast();

		// Show warn ribbon if athlete settings do not match with athlete settings used for history synchronization
		this.athleteHistoryService.checkLocalRemoteAthleteProfileSame();
	}

	public sideNavSetup(): void {

		this.sideNav.opened = (AppComponent.DEFAULT_SIDE_NAV_STATUS === SideNavStatus.OPENED);

		const sideNavOpened: string = localStorage.getItem(AppComponent.LS_SIDE_NAV_OPENED_KEY);
		if (sideNavOpened) {
			this.sideNav.opened = (sideNavOpened === "true");
		}

		this.sideNavMode = AppComponent.DEFAULT_SIDE_NAV_MODE;
	}

	public setupThemeOnLoad(): void {

		let themeToBeLoaded: Theme = Theme.DEFAULT;

		const existingSavedTheme = localStorage.getItem(AppComponent.LS_USER_THEME_PREF) as Theme;

		if (existingSavedTheme) {
			themeToBeLoaded = existingSavedTheme;
		}

		this.setTheme(themeToBeLoaded);
	}

	public setTheme(theme: Theme): void {

		this.currentTheme = theme;

		// Remove previous theme if exists
		const previousTheme = this.overlayContainer.getContainerElement().classList[1] as Theme;
		if (previousTheme) {
			this.overlayContainer.getContainerElement().classList.remove(previousTheme);
		}

		// Add theme/class to overlay list
		this.overlayContainer.getContainerElement().classList.add(this.currentTheme);

		// Change body theme class
		this.renderer.setAttribute(document.body, "class", this.currentTheme);
	}

	public updateLastSyncDateStatus(): void {

		this.athleteHistoryService.getSyncState().then((athleteHistoryState: AthleteHistoryState) => {
			this.athleteHistoryState = athleteHistoryState;
			this.athleteHistoryService.getLastSyncDateTime().then((lastSyncDateTime: number) => {
				if (_.isNumber(lastSyncDateTime)) {
					this.lastSyncDateMessage = moment(lastSyncDateTime).fromNow();
				}
			});
		});

	}

	public setupWindowResizeBroadcast(): void {
		window.onresize = (event: Event) => {
			this.windowService.onResize(event); // When user resize the window. Tell it to subscribers
		};
	}

	public onAthleteHistorySync(forceSync: boolean): void {
		this.athleteHistoryService.sync(forceSync);
	}

	public onAthleteHistoryRemove(): void {

		const data: ConfirmDialogDataModel = {
			title: "Clear your athlete history",
			content: "Are you sure to perform this action? You will be able to re-import history through backup file " +
			"or a new re-synchronization."
		};

		const dialogRef = this.dialog.open(ConfirmDialogComponent, {
			minWidth: ConfirmDialogComponent.MIN_WIDTH,
			maxWidth: ConfirmDialogComponent.MAX_WIDTH,
			data: data
		});

		const afterClosedSubscription = dialogRef.afterClosed().subscribe((confirm: boolean) => {

			if (confirm) {
				this.athleteHistoryService.remove().then(() => {
					location.reload();
				}, error => {
					this.snackBar.open(error, "Close");
				});
			}
			afterClosedSubscription.unsubscribe();
		});
	}

	public onAthleteHistoryExport(): void {

		this.athleteHistoryService.export().then((result: any) => {

			this.dialog.open(GotItDialogComponent, {
				minWidth: GotItDialogComponent.MIN_WIDTH,
				maxWidth: GotItDialogComponent.MAX_WIDTH,
				data: new GotItDialogDataModel(null, "File \"" + result.filename + "\" is being saved to your download folder.")
			});

		}, error => {
			this.snackBar.open(error, "Close");
		});

	}

	public onAthleteHistoryImport(): void {

		const dialogRef = this.dialog.open(AthleteHistoryImportDialogComponent, {
			minWidth: AthleteHistoryImportDialogComponent.MIN_WIDTH,
			maxWidth: AthleteHistoryImportDialogComponent.MAX_WIDTH,
		});

		const afterClosedSubscription = dialogRef.afterClosed().subscribe((athleteHistoryModel: AthleteHistoryModel) => {

			if (athleteHistoryModel) {
				this.athleteHistoryService.import(athleteHistoryModel).then(() => {
					location.reload();
				}, error => {
					this.snackBar.open(error, "Close");
				});
			}

			afterClosedSubscription.unsubscribe();
		});
	}

	public onThemeToggle(): void {
		const targetTheme = (this.currentTheme === Theme.LIGHT) ? Theme.DARK : Theme.LIGHT;
		this.setTheme(targetTheme);
		localStorage.setItem(AppComponent.LS_USER_THEME_PREF, targetTheme);
	}

	public onShowReleaseNotes(): void {
		this.router.navigate([AppRoutesModel.releasesNotes]);
	}

	public onShowShare(): void {
		this.router.navigate([AppRoutesModel.share]);
	}

	public onShowReport(): void {
		this.router.navigate([AppRoutesModel.report]);
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

	public onSideNavToggle(): void {
		this.sideNav.toggle();
		localStorage.setItem(AppComponent.LS_SIDE_NAV_OPENED_KEY, (this.sideNav.opened) ? "true" : "false");
	}

	public onOpenLink(url: string): void {
		window.open(url, "_blank");
	}

	public registerCustomIcons(): void {
		this.iconRegistry.addSvgIcon("strava", this.sanitizer.bypassSecurityTrustResourceUrl("./assets/icons/strava.svg"));
	}

	public ngOnDestroy(): void {
		this.routerEventsSubscription.unsubscribe();
	}

}
