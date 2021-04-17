import { DesktopMigration } from "../desktop-migrations.model";
import { Injector } from "@angular/core";

export class Upgrade_7_0_0_$6_alpha extends DesktopMigration {
  public version = "7.0.0-6.alpha";

  public description = "Drop activities and streams for new backup mechanism (violent but it's alpha... ;))";

  public requiresRecalculation = false;

  public upgrade(db: LokiConstructor, injector: Injector): Promise<void> {
    // Wipe activities, streams & connectorSyncDateTime
    db.getCollection("syncedActivities").clear();
    db.getCollection("streams").clear();
    db.getCollection("connectorSyncDateTime").clear();
    return this.saveDatabase(db);
  }
}
