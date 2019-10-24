import { AppResourcesModel } from "./app-resources.model";
import { UserSettings } from "@elevate/shared/models";
import ExtensionUserSettingsModel = UserSettings.ExtensionUserSettingsModel;

export class StartCoreDataModel {
	extensionId: string;
	userSettings: ExtensionUserSettingsModel;
	appResources: AppResourcesModel;
}
