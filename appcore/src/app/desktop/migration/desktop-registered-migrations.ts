import { DesktopMigration } from "./desktop-migrations.model";
import { Upgrade_7_0_0_$3_alpha } from "./7.0.0-3.alpha/upgrade_7_0_0_$3_alpha";

/*

Tip to emulate a version upgrade by downgrading current version:

function downgradeTo(version) {
    const properties = db.getCollection("properties").findOne();
    properties.existingVersion = version;
    db.getCollection("properties").update(properties);
    db.save()
}
downgradeTo("7.0.0");
*/

/**
 * Add desktop migrations inside LIST. The LIST is sorted from lowest to high versions
 */
export class DesktopRegisteredMigrations {
  public static readonly LIST: DesktopMigration[] = [new Upgrade_7_0_0_$3_alpha()];
}
