import { ZoneModel } from "../../../../../common/scripts/models/ActivityData";
import { Mode } from "./mode.enum";
import { ZoneDefinitionModel } from "../../shared/models/zone-definition.model";

export class ZoneImportExportDataModel {

	public zoneDefinition: ZoneDefinitionModel;
	public zonesData?: ZoneModel[];
	public mode: Mode;

	constructor(zoneDefinition: ZoneDefinitionModel, zonesData: ZoneModel[], mode: Mode) {
		this.zoneDefinition = zoneDefinition;
		this.zonesData = zonesData;
		this.mode = mode;
	}
}
