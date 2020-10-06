import { DumpModel } from "./dump.model";

export class DesktopDumpModel extends DumpModel {
  private static readonly SERIALIZE_SEPARATOR: string = ";";
  public version: string;
  public gzipData: string;

  constructor(version: string = null, gzippedDatabases: string = null) {
    super();
    this.version = version;
    this.gzipData = gzippedDatabases;
  }

  public static deserialize(serialized: string): DesktopDumpModel {
    const separatorPos = serialized.indexOf(DesktopDumpModel.SERIALIZE_SEPARATOR);
    return new DesktopDumpModel(serialized.slice(0, separatorPos), serialized.slice(separatorPos + 1));
  }

  public serialize(): string {
    return this.version + DesktopDumpModel.SERIALIZE_SEPARATOR + this.gzipData;
  }
}
