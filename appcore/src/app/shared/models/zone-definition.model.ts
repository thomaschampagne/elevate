import { ZoneType } from "@elevate/shared/enums/zone-type.enum";
import { ZoneCustomDisplayModel } from "./zone-custom-display.model";

export class ZoneDefinitionModel {
  public name: string;
  public value: ZoneType;
  public units: string;
  public step: number;
  public min: number;
  public max: number;
  public customDisplay: ZoneCustomDisplayModel;
}
