import * as _ from "lodash";
import * as moment from "moment";
import { Component, HostListener, OnDestroy, OnInit, Renderer2, ViewChild } from "@angular/core";
import { AppRoutesModel } from "./shared/models/app-routes.model";
import { NavigationEnd, Router, RouterEvent } from "@angular/router";
import { MatDialog, MatIconRegistry, MatSidenav, MatSnackBar } from "@angular/material";
import { AboutDialogComponent } from "./about-dialog/about-dialog.component";
import { SideNavService } from "./shared/services/side-nav/side-nav.service";
import { SideNavStatus } from "./shared/services/side-nav/side-nav-status.enum";
import { Subscription } from "rxjs";
import { WindowService } from "./shared/services/window/window.service";
import { SyncService } from "./shared/services/sync/sync.service";
import { ConfirmDialogComponent } from "./shared/dialogs/confirm-dialog/confirm-dialog.component";
import { ConfirmDialogDataModel } from "./shared/dialogs/confirm-dialog/confirm-dialog-data.model";
import { GotItDialogComponent } from "./shared/dialogs/got-it-dialog/got-it-dialog.component";
import { GotItDialogDataModel } from "./shared/dialogs/got-it-dialog/got-it-dialog-data.model";
import { ImportBackupDialogComponent } from "./shared/dialogs/import-backup-dialog/import-backup-dialog.component";
import { SyncState } from "./shared/services/sync/sync-state.enum";
import { DomSanitizer } from "@angular/platform-browser";
import { OverlayContainer } from "@angular/cdk/overlay";
import { Theme } from "./shared/theme.enum";
import { ExternalUpdatesService } from "./shared/services/external-updates/external-updates.service";
import { SyncResultModel } from "../../../core/scripts/shared/models/sync/sync-result.model";
import { SyncedBackupModel } from "./shared/services/sync/synced-backup.model";

// TODO:FEAT @YearProgress Add Trimp progress EZ !!
// TODO:FEAT @YearProgress Support Progress last year in graph (https://github.com/thomaschampagne/elevate/issues/484)
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
	public SyncState = SyncState;
	public syncState: SyncState;
	public lastSyncDateMessage: string;
	public routerEventsSubscription: Subscription;

	@ViewChild(MatSidenav)
	public sideNav: MatSidenav;
	public sideNavMode: string;

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
			routerLink: AppRoutesModel.globalSettings,
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
				public syncService: SyncService,
				public dialog: MatDialog,
				public snackBar: MatSnackBar,
				public sideNavService: SideNavService,
				public windowService: WindowService,
				public overlayContainer: OverlayContainer,
				public renderer: Renderer2,
				public iconRegistry: MatIconRegistry,
				public sanitizer: DomSanitizer,
				public externalUpdatesService: ExternalUpdatesService) {

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
				const route: string = (<NavigationEnd> routerEvent).urlAfterRedirects;
				this.toolBarTitle = AppComponent.convertRouteToTitle(route);
			}
		});

		// Update sync status in toolbar and Refresh LastSyncDate displayed every minutes
		this.updateLastSyncDateStatus();
		setInterval(() => {
			this.updateLastSyncDateStatus();
		}, 1000 * 60);

		this.externalUpdatesService.onSyncDone.subscribe((syncResult: SyncResultModel) => {
			if (syncResult) {
				this.updateLastSyncDateStatus();
			}
		});

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
		this.syncService.getSyncState().then((syncState: SyncState) => {
			this.syncState = syncState;
			this.syncService.getLastSyncDateTime().then((lastSyncDateTime: number) => {
				if (_.isNumber(lastSyncDateTime)) {
					this.lastSyncDateMessage = moment(lastSyncDateTime).fromNow();
				}
			});
		});
	}

	@HostListener("window:resize")
	public setupWindowResizeBroadcast(): void {
		this.windowService.onResize(); // When user resize the window. Tell it to subscribers
	}

	public onSync(fastSync: boolean, forceSync: boolean): void {
		this.syncService.sync(fastSync, forceSync);
	}

	public onClearSyncedData(): void {

		const data: ConfirmDialogDataModel = {
			title: "Clear your athlete synced data",
			content: "Are you sure to perform this action? You will be able to re-import synced data through backup file " +
				"or a new re-synchronization."
		};

		const dialogRef = this.dialog.open(ConfirmDialogComponent, {
			minWidth: ConfirmDialogComponent.MIN_WIDTH,
			maxWidth: ConfirmDialogComponent.MAX_WIDTH,
			data: data
		});

		const afterClosedSubscription = dialogRef.afterClosed().subscribe((confirm: boolean) => {

			if (confirm) {
				this.syncService.clearSyncedData().then(() => {
					location.reload();
				}, error => {
					this.snackBar.open(error, "Close");
				});
			}
			afterClosedSubscription.unsubscribe();
		});
	}

	public onSyncedBackupExport(): void {

		this.syncService.export().then((result: any) => {

			this.dialog.open(GotItDialogComponent, {
				minWidth: GotItDialogComponent.MIN_WIDTH,
				maxWidth: GotItDialogComponent.MAX_WIDTH,
				data: new GotItDialogDataModel(null, "File \"" + result.filename + "\" is being saved to your download folder.")
			});

		}, error => {
			this.snackBar.open(error, "Close");
		});

	}

	public onSyncedBackupImport(): void {

		const dialogRef = this.dialog.open(ImportBackupDialogComponent, {
			minWidth: ImportBackupDialogComponent.MIN_WIDTH,
			maxWidth: ImportBackupDialogComponent.MAX_WIDTH,
		});

		const afterClosedSubscription = dialogRef.afterClosed().subscribe((backupModel: SyncedBackupModel) => {

			if (backupModel) {
				this.syncService.import(backupModel).then(() => {
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

	public onAdvanceMenu(): void {
		this.router.navigate([AppRoutesModel.advancedMenu]);
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
