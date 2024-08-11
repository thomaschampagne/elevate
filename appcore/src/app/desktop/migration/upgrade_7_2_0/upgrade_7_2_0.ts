import { DesktopMigration } from "../desktop-migrations.model";
import { Injector } from "@angular/core";

export class Upgrade_7_2_0 extends DesktopMigration {
  public version: string = "7.2.0";

  public description: string = "Trigger recalculation for efficiency new stats & settings lacks detection fix";

  public requiresRecalculation: boolean = true;

  public upgrade(db: LokiConstructor, injector: Injector): Promise<void> {
    return Promise.resolve();
  }
}
