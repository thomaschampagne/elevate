import { Injectable } from "@angular/core";
import { MenuItemModel, MenuItemsProvider } from "../menu-items-provider.interface";
import { AppRoutesModel } from "../../../models/app-routes.model";

@Injectable()
export class ExtensionMenuItemsProvider implements MenuItemsProvider {

	public readonly mainMenuItems: MenuItemModel[] = [
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
		}, {
			icon: "favorite",
			routerLink: AppRoutesModel.donate,
			routerLinkActive: true
		}
	];

	public getMenuItems(): MenuItemModel[] {
		return this.mainMenuItems;
	}

}
