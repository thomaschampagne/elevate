import { IZone } from "../../../../../common/scripts/interfaces/IActivityData";
import { Mode } from "./mode.enum";
import { ZoneDefinition } from "../../shared/models/zone-definition.model";

export class ZoneImportExportData {
	zoneDefinition: ZoneDefinition;
	zonesData?: IZone[];
	mode: Mode;
}
