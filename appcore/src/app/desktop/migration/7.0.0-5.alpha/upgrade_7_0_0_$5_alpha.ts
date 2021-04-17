import { DesktopMigration } from "../desktop-migrations.model";
import { Injector } from "@angular/core";

export class Upgrade_7_0_0_$5_alpha extends DesktopMigration {
  public version = "7.0.0-5.alpha";

  public description = "Migration to force recalculation";

  public requiresRecalculation = true;

  public upgrade(db: LokiConstructor, injector: Injector): Promise<void> {
    return this.saveDatabase(db);
  }
}
