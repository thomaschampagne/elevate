import { InjectionToken } from "@angular/core";

export const MENU_ITEMS_PROVIDER = new InjectionToken<MenuItemsProvider>("MENU_ITEMS_PROVIDER");

export class MenuItemModel {
	public icon: string;
	public routerLink: string;
	public routerLinkActive: boolean;
	public name?: string;
}

export interface MenuItemsProvider {
	getMenuItems(): MenuItemModel[];
}
