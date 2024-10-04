import { Injectable } from "@angular/core";
import { MenuItemModel, MenuItemsProvider } from "../menu-items-provider.interface";
import { AppRoutes } from "../../../models/app-routes";

@Injectable()
export class DesktopMenuItemsProvider implements MenuItemsProvider {
  public readonly mainMenuItems: MenuItemModel[] = [
    /*    {
      icon: "space_dashboard",
      routerLink: AppRoutes.dashboard,
      routerLinkActive: true
    },
    {
      icon: "emoji_events",
      routerLink: AppRoutes.goals,
      routerLinkActive: true
    },*/
    {
      icon: "summarize",
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
      icon: "power",
      routerLink: AppRoutes.connectors,
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
      icon: "support",
      routerLink: AppRoutes.vert,
      routerLinkActive: true
    }
  ];

  public getMenuItems(): MenuItemModel[] {
    return this.mainMenuItems;
  }
}
