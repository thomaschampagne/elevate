import { UserSettingsModel } from "@elevate/shared/models";
import { AppResourcesModel } from "./app-resources.model";

export class StartCoreDataModel {
	extensionId: string;
	userSettings: UserSettingsModel;
	appResources: AppResourcesModel;
}
