import { DumpModel } from "./dump.model";
import { Gzip } from "@elevate/shared/tools";

export class DesktopDumpModel extends DumpModel {
  constructor(public readonly version: string, public readonly databaseDump: object) {
    super();
  }

  public static unzip(zipped: Uint8Array): DesktopDumpModel {
    const unPacked: { version: string; database: object } = Gzip.unpack(zipped);
    return new DesktopDumpModel(unPacked.version, unPacked.database);
  }

  public zip(): Uint8Array {
    return Gzip.pack({ version: this.version, database: this.databaseDump });
  }
}
