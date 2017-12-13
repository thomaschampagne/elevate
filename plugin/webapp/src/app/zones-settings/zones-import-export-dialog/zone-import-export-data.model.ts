import { IZone } from "../../../../../common/scripts/interfaces/IActivityData";
import { Mode } from "./mode.enum";
import { ZoneDefinitionModel } from "../../shared/models/zone-definition.model";

export class ZoneImportExportDataModel {

	public zoneDefinition: ZoneDefinitionModel;
	public zonesData?: IZone[];
	public mode: Mode;

	constructor(zoneDefinition: ZoneDefinitionModel, zonesData: IZone[], mode: Mode) {
		this.zoneDefinition = zoneDefinition;
		this.zonesData = zonesData;
		this.mode = mode;
	}
}
