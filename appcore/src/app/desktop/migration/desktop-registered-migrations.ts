import { DesktopMigration } from "./desktop-migrations.model";
import { Upgrade_7_0_0_$3_alpha } from "./7.0.0-3.alpha/upgrade_7_0_0_$3_alpha";
import { Upgrade_7_0_0_$4_alpha } from "./7.0.0-4.alpha/upgrade_7_0_0_$4_alpha";
import { Upgrade_7_0_0_$5_alpha } from "./7.0.0-5.alpha/upgrade_7_0_0_$5_alpha";

/**
 * Add desktop migrations inside LIST. The LIST is sorted from lowest to high versions
 */
export class DesktopRegisteredMigrations {
  public static readonly LIST: DesktopMigration[] = [
    new Upgrade_7_0_0_$3_alpha(),
    new Upgrade_7_0_0_$4_alpha(),
    new Upgrade_7_0_0_$5_alpha()
    /* Next Upgrade Here */
  ];
}
