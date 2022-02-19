import _ from "lodash";
import { ActivityFileType } from "@elevate/shared/sync/connectors/activity-file-type.enum";

/**
 * Model associated to File synced activities
 */
export class ActivityFile {
  public type: ActivityFileType;
  public location: { path: string };
  public lastModificationDate: string;

  constructor(type: ActivityFileType, absolutePath: string, lastModificationDate: Date) {
    this.type = type;
    this.location = { path: absolutePath };
    this.lastModificationDate = _.isDate(lastModificationDate) ? lastModificationDate.toISOString() : null;
  }
}
