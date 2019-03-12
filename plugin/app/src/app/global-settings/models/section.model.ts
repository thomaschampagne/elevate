import { OptionModel } from "./option.model";
import { EnvTarget } from "../../shared/enums/env-target";

export class SectionModel {
	public title: string;
	public options: OptionModel[];
	public envTarget?: EnvTarget;
}
