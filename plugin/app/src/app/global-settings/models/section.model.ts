import { OptionModel } from "./option.model";
import { EnvTarget } from "@elevate/shared/models";

export class SectionModel {
	public title: string;
	public options: OptionModel[];
	public envTarget?: EnvTarget;
}
