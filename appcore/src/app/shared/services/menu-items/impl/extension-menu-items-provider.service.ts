import { Injectable } from "@angular/core";
import { MenuItemModel, MenuItemsProvider } from "../menu-items-provider.interface";
import { AppRoutes } from "../../../models/app-routes";

@Injectable()
export class ExtensionMenuItemsProvider implements MenuItemsProvider {
  public readonly mainMenuItems: MenuItemModel[] = [
    {
      icon: "view_list",
      routerLink: AppRoutes.activities,
      routerLinkActive: true
    },
    {
      icon: "timeline",
      routerLink: AppRoutes.fitnessTrend,
      routerLinkActive: true
    },
    {
      icon: "date_range",
      routerLink: AppRoutes.yearProgressions,
      routerLinkActive: true
    },
    {
      icon: "settings",
      routerLink: AppRoutes.globalSettings,
      routerLinkActive: true
    },
    {
      icon: "portrait",
      routerLink: AppRoutes.athleteSettings,
      routerLinkActive: true
    },
    {
      icon: "format_line_spacing",
      routerLink: AppRoutes.zonesSettings,
      routerLinkActive: true
    },
    {
      icon: "support",
      routerLink: AppRoutes.help,
      routerLinkActive: true
    },
    {
      icon: "favorite_border",
      routerLink: AppRoutes.donate,
      routerLinkActive: true
    },
    {
      icon: "get_app",
      iconClass: "warn",
      routerLink: AppRoutes.downloadDesktopApp,
      routerLinkActive: true
    }
  ];

  public getMenuItems(): MenuItemModel[] {
    return this.mainMenuItems;
  }
}
