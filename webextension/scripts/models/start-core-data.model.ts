import { AppResourcesModel } from "./app-resources.model";
import { UserSettings } from "@elevate/shared/models/user-settings/user-settings.namespace";
import ExtensionUserSettings = UserSettings.ExtensionUserSettings;

export class StartCoreDataModel {
  extensionId: string;
  userSettings: ExtensionUserSettings;
  appResources: AppResourcesModel;
}
