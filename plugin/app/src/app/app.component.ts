import * as _ from "lodash";
import { Component, ComponentFactoryResolver, HostListener, Inject, OnDestroy, OnInit, Renderer2, Type, ViewChild } from "@angular/core";
import { AppRoutesModel } from "./shared/models/app-routes.model";
import { NavigationEnd, Router, RouterEvent } from "@angular/router";
import { MatDialog } from "@angular/material/dialog";
import { MatIconRegistry } from "@angular/material/icon";
import { MatSidenav } from "@angular/material/sidenav";
import { MatSnackBar } from "@angular/material/snack-bar";
import { AboutDialogComponent } from "./about-dialog/about-dialog.component";
import { SideNavService } from "./shared/services/side-nav/side-nav.service";
import { SideNavStatus } from "./shared/services/side-nav/side-nav-status.enum";
import { Subscription } from "rxjs";
import { WindowService } from "./shared/services/window/window.service";
import { DomSanitizer } from "@angular/platform-browser";
import { OverlayContainer } from "@angular/cdk/overlay";
import { Theme } from "./shared/enums/theme.enum";
import { EnvTarget } from "@elevate/shared/models";
import { environment } from "../environments/environment";
import { SYNC_MENU_COMPONENT_TOKEN, SyncMenuComponent } from "./sync-menu/sync-menu.component";
import { SyncMenuDirective } from "./sync-menu/sync-menu.directive";
import { TopBarDirective } from "./top-bar/top-bar.directive";
import { TOP_BAR_COMPONENT_TOKEN, TopBarComponent } from "./top-bar/top-bar.component";

class MenuItemModel {
	public name: string;
	public icon: string;
	public routerLink: string;
	public routerLinkActive: boolean;
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

	public envTarget: EnvTarget = environment.target;

	public EnvTarget = EnvTarget;
	public Theme = Theme;
	public currentTheme: Theme;

	public toolBarTitle: string;
	public routerEventsSubscription: Subscription;

	@ViewChild(TopBarDirective, {static: true})
	public topBarDirective: TopBarDirective;

	@ViewChild(SyncMenuDirective, {static: true})
	public syncMenuDirective: SyncMenuDirective;

	@ViewChild(MatSidenav, {static: true})
	public sideNav: MatSidenav;
	public sideNavMode: string;

	public readonly mainMenuItems: Partial<MenuItemModel>[] = [
		{
			icon: "view_list",
			routerLink: AppRoutesModel.activities,
			routerLinkActive: true
		}, {
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
				public dialog: MatDialog,
				public snackBar: MatSnackBar,
				public sideNavService: SideNavService,
				public windowService: WindowService,
				public overlayContainer: OverlayContainer,
				public renderer: Renderer2,
				public iconRegistry: MatIconRegistry,
				public sanitizer: DomSanitizer,
				public componentFactoryResolver: ComponentFactoryResolver,
				@Inject(TOP_BAR_COMPONENT_TOKEN) public topBarComponentType: Type<TopBarComponent>,
				@Inject(SYNC_MENU_COMPONENT_TOKEN) public syncMenuComponentImplType: Type<SyncMenuComponent>) {
		this.registerCustomIcons();
	}

	public ngOnInit(): void {

		this.instantiateTopBarComponent();

		// Instantiate and inject the platform based sync menu component (desktop, extension, ...);
		this.instantiateSyncMenuComponent();

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
	}

	public instantiateTopBarComponent(): TopBarComponent {
		const componentFactory = this.componentFactoryResolver.resolveComponentFactory(this.topBarComponentType);
		const componentRef = this.topBarDirective.viewContainerRef.createComponent(componentFactory);
		return <SyncMenuComponent> componentRef.instance;
	}

	public instantiateSyncMenuComponent(): SyncMenuComponent {
		const componentFactory = this.componentFactoryResolver.resolveComponentFactory(this.syncMenuComponentImplType);
		const componentRef = this.syncMenuDirective.viewContainerRef.createComponent(componentFactory);
		return <SyncMenuComponent> componentRef.instance;
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

	@HostListener("window:resize")
	public setupWindowResizeBroadcast(): void {
		this.windowService.onResize(); // When user resize the window. Tell it to subscribers
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

	public onShowFaq(): void {
		this.router.navigate([AppRoutesModel.frequentlyAskedQuestions]);
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
