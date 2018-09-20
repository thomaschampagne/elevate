import { UserSettingsModel } from "./user-settings/user-settings.model";
import { AppResourcesModel } from "../../models/app-resources.model";

export class StartCoreDataModel {
	public extensionId: string;
	public userSettings: UserSettingsModel;
	public appResources: AppResourcesModel;
}
