import { IZone } from "../../../../../common/scripts/interfaces/IActivityData";
import { Mode } from "./mode.enum";
import { ZoneDefinition } from "../../shared/models/zone-definition.model";

export class ZoneImportExportData {
	public zoneDefinition: ZoneDefinition;
	public zonesData?: IZone[];
	public mode: Mode;
}
