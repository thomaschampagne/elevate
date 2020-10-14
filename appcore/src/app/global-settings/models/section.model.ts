import { OptionModel } from "./option.model";
import { BuildTarget } from "@elevate/shared/enums";

export class SectionModel {
  public title: string;
  public options: OptionModel[];
  public buildTarget?: BuildTarget;
}
