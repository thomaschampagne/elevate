import _ from "lodash";
import { Component, HostListener, Inject, OnDestroy, OnInit, Renderer2, Type, ViewChild } from "@angular/core";
import { NavigationEnd, Router, RouterEvent } from "@angular/router";
import { MatDialog } from "@angular/material/dialog";
import { MatIconRegistry } from "@angular/material/icon";
import { MatSidenav } from "@angular/material/sidenav";
import { MatSnackBar } from "@angular/material/snack-bar";
import { SideNavService } from "./shared/services/side-nav/side-nav.service";
import { SideNavStatus } from "./shared/services/side-nav/side-nav-status.enum";
import { Subscription } from "rxjs";
import { WindowService } from "./shared/services/window/window.service";
import { DomSanitizer } from "@angular/platform-browser";
import { OverlayContainer } from "@angular/cdk/overlay";
import { Theme } from "./shared/enums/theme.enum";
import { environment } from "../environments/environment";
import { SYNC_MENU_COMPONENT, SyncMenuComponent } from "./sync-menu/sync-menu.component";
import { SyncMenuDirective } from "./sync-menu/sync-menu.directive";
import { TopBarDirective } from "./top-bar/top-bar.directive";
import { TOP_BAR_COMPONENT, TopBarComponent } from "./top-bar/top-bar.component";
import { SYNC_BAR_COMPONENT, SyncBarComponent } from "./sync-bar/sync-bar.component";
import { SyncBarDirective } from "./sync-bar/sync-bar.directive";
import { LoggerService } from "./shared/services/logging/logger.service";
import {
  MENU_ITEMS_PROVIDER,
  MenuItemModel,
  MenuItemsProvider
} from "./shared/services/menu-items/menu-items-provider.interface";
import { APP_MORE_MENU_COMPONENT, AppMoreMenuComponent } from "./app-more-menu/app-more-menu.component";
import { AppMoreMenuDirective } from "./app-more-menu/app-more-menu.directive";
import {
  RECALCULATE_ACTIVITIES_BAR_COMPONENT,
  RecalculateActivitiesBarComponent
} from "./recalculate-activities-bar/recalculate-activities-bar.component";
import { RecalculateActivitiesBarDirective } from "./recalculate-activities-bar/recalculate-activities-bar.directive";
import { VersionsProvider } from "./shared/services/versions/versions-provider";
import { ComponentsFactoryService } from "./shared/services/components-factory.service";
import { AppService } from "./shared/services/app-service/app.service";
import { UPDATE_BAR_COMPONENT, UpdateBarComponent } from "./update-bar/update-bar.component";
import { UpdateBarDirective } from "./update-bar/update-bar.directive";
import { OPEN_RESOURCE_RESOLVER, OpenResourceResolver } from "./shared/services/links-opener/open-resource-resolver";
import { AppPackage } from "./app-package";
import { BuildTarget } from "@elevate/shared/enums/build-target.enum";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"]
})
export class AppComponent implements OnInit, OnDestroy {
  private static readonly DEFAULT_SIDE_NAV_STATUS: SideNavStatus = SideNavStatus.OPENED;
  public static readonly LS_SIDE_NAV_OPENED_KEY: string = "app_sideNavOpened";
  private readonly CUSTOM_ICONS: string[] = ["strava", "twitter", "github", "discord", "koyeb"];
  public readonly buildTarget: BuildTarget = environment.buildTarget;
  public BuildTarget = BuildTarget;
  public Theme = Theme;
  public mainMenuItems: MenuItemModel[];
  public toolBarTitle: string;
  public routerEventsSubscription: Subscription;

  @ViewChild(TopBarDirective, { static: true })
  public topBarDirective: TopBarDirective;

  @ViewChild(UpdateBarDirective, { static: true })
  public updateBarDirective: UpdateBarDirective;

  @ViewChild(SyncBarDirective, { static: true })
  public syncBarDirective: SyncBarDirective;

  @ViewChild(RecalculateActivitiesBarDirective, { static: true })
  public recalculateActivitiesBarDirective: RecalculateActivitiesBarDirective;

  @ViewChild(SyncMenuDirective, { static: true })
  public syncMenuDirective: SyncMenuDirective;

  @ViewChild(AppMoreMenuDirective, { static: true })
  public appMoreMenuDirective: AppMoreMenuDirective;

  @ViewChild(MatSidenav, { static: true })
  public sideNav: MatSidenav;

  public currentRoute: string;
  public showDebugRibbon: boolean;

  constructor(
    @Inject(AppService) public readonly appService: AppService,
    @Inject(Router) private readonly router: Router,
    @Inject(MatDialog) private readonly dialog: MatDialog,
    @Inject(MatSnackBar) private readonly snackBar: MatSnackBar,
    @Inject(SideNavService) private readonly sideNavService: SideNavService,
    @Inject(WindowService) private readonly windowService: WindowService,
    @Inject(OverlayContainer) private readonly overlayContainer: OverlayContainer,
    @Inject(Renderer2) private readonly renderer: Renderer2,
    @Inject(MatIconRegistry) private readonly iconRegistry: MatIconRegistry,
    @Inject(DomSanitizer) private readonly sanitizer: DomSanitizer,
    @Inject(ComponentsFactoryService) private readonly componentsFactoryService: ComponentsFactoryService,
    @Inject(VersionsProvider) public readonly versionsProvider: VersionsProvider,
    @Inject(OPEN_RESOURCE_RESOLVER) public readonly openResourceResolver: OpenResourceResolver,
    @Inject(LoggerService) private readonly logger: LoggerService,
    @Inject(MENU_ITEMS_PROVIDER) private readonly menuItemsProvider: MenuItemsProvider,
    @Inject(TOP_BAR_COMPONENT) private readonly topBarComponentType: Type<TopBarComponent>,
    @Inject(SYNC_BAR_COMPONENT) private readonly syncBarComponentType: Type<SyncBarComponent>,
    @Inject(UPDATE_BAR_COMPONENT) private readonly updateBarComponentType: Type<UpdateBarComponent>,
    @Inject(RECALCULATE_ACTIVITIES_BAR_COMPONENT)
    private readonly recalculateActivitiesBarComponentType: Type<RecalculateActivitiesBarComponent>,
    @Inject(SYNC_MENU_COMPONENT) private readonly syncMenuComponentType: Type<SyncMenuComponent>,
    @Inject(APP_MORE_MENU_COMPONENT) private readonly appMoreMenuComponentType: Type<AppMoreMenuComponent>
  ) {
    this.currentRoute = this.router.url;
    this.showDebugRibbon = environment.showDebugRibbon;
    this.registerCustomIcons();
  }

  public static convertRouteToTitle(route: string): string {
    if (!route) {
      return null;
    }

    // Remove first element if empty (occurs when first char is "/")
    route = route.replace(/^\//, "");

    // Remove query params from route on first part before first "/"
    const title = route.split("/")[0].split(new RegExp(/;|\?/g))[0]; // Remove query params from route

    return _.startCase(_.upperFirst(title));
  }

  public ngOnInit(): void {
    this.toolBarTitle = AppComponent.convertRouteToTitle(this.router.url);

    this.routerEventsSubscription = this.router.events.subscribe((routerEvent: RouterEvent) => {
      if (routerEvent instanceof NavigationEnd) {
        this.currentRoute = (routerEvent as NavigationEnd).urlAfterRedirects;
        this.toolBarTitle = AppComponent.convertRouteToTitle(this.currentRoute);
      }
    });

    this.initApp();
  }

  public initApp(): void {
    // Inject top bar, sync bar, sync menu
    this.componentsFactoryService.create<TopBarComponent>(
      this.topBarComponentType,
      this.topBarDirective.viewContainerRef
    );

    this.componentsFactoryService.create<UpdateBarComponent>(
      this.updateBarComponentType,
      this.updateBarDirective.viewContainerRef
    );

    this.componentsFactoryService.create<SyncBarComponent>(
      this.syncBarComponentType,
      this.syncBarDirective.viewContainerRef
    );

    this.componentsFactoryService.create<RecalculateActivitiesBarComponent>(
      this.recalculateActivitiesBarComponentType,
      this.recalculateActivitiesBarDirective.viewContainerRef
    );

    this.componentsFactoryService.create<SyncMenuComponent>(
      this.syncMenuComponentType,
      this.syncMenuDirective.viewContainerRef
    );

    this.componentsFactoryService.create<AppMoreMenuComponent>(
      this.appMoreMenuComponentType,
      this.appMoreMenuDirective.viewContainerRef
    );

    // Apply default theme
    this.applyTheme(this.appService.currentTheme);

    // Listen for theme changes
    this.appService.themeChanges$.subscribe(theme => this.applyTheme(theme));

    // Update list of sections names displayed in sidebar
    this.mainMenuItems = this.menuItemsProvider.getMenuItems();
    _.forEach(this.mainMenuItems, (menuItemModel: MenuItemModel) => {
      menuItemModel.name = AppComponent.convertRouteToTitle(menuItemModel.routerLink);
    });

    this.sideNavSetup();

    this.logger.debug("App initialized.");
  }

  public sideNavSetup(): void {
    this.sideNav.opened = AppComponent.DEFAULT_SIDE_NAV_STATUS === SideNavStatus.OPENED;

    const sideNavOpened: string = localStorage.getItem(AppComponent.LS_SIDE_NAV_OPENED_KEY);
    if (sideNavOpened) {
      this.sideNav.opened = sideNavOpened === "true";
    }
  }

  public applyTheme(theme: Theme): void {
    // Remove previous theme if exists
    const previousTheme = this.overlayContainer.getContainerElement().classList[1] as Theme;
    if (previousTheme) {
      this.overlayContainer.getContainerElement().classList.remove(previousTheme);
    }

    // Add theme/class to overlay list
    this.overlayContainer.getContainerElement().classList.add(theme);

    // Change body theme class
    this.renderer.setAttribute(document.body, "class", theme);
  }

  @HostListener("window:resize")
  public setupWindowResizeBroadcast(): void {
    this.windowService.onResize(); // When user resize the window. Tell it to subscribers
  }

  public onThemeToggle(): void {
    this.appService.toggleTheme();
  }

  public onSideNavClosed(): void {
    this.sideNavService.onChange(SideNavStatus.CLOSED);
  }

  public onSideNavOpened(): void {
    this.sideNavService.onChange(SideNavStatus.OPENED);
  }

  public onSideNavToggle(): void {
    this.sideNav.toggle();
    localStorage.setItem(AppComponent.LS_SIDE_NAV_OPENED_KEY, this.sideNav.opened ? "true" : "false");
  }

  public registerCustomIcons(): void {
    for (const icon of this.CUSTOM_ICONS) {
      this.iconRegistry.addSvgIcon(icon, this.sanitizer.bypassSecurityTrustResourceUrl(`./assets/icons/${icon}.svg`));
    }
  }

  public ngOnDestroy(): void {
    this.routerEventsSubscription.unsubscribe();
  }

  public onOpenWebSite(): void {
    this.openResourceResolver.openLink(AppPackage.getElevateWebSite());
  }
}
