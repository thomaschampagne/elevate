import { ListItemModel } from "./list-item.model";
import { UserSettings } from "@elevate/shared/models/user-settings/user-settings.namespace";

export class OptionModel {
  public key: UserSettings.Props;
  public type: string;
  public title: string;
  public labels: string[];
  public list?: ListItemModel[];
  public enableSubOption?: string[];
  public active?: any;
  public hidden?: boolean;
  public value?: any;
  public min?: number; // For input number type only
  public max?: number; // For input number type only
  public step?: number; // For input number type only
  public disableHelper?: boolean;
  public disableTooltip?: boolean; // For input number type only
}
