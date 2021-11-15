import { LoggerService } from "../app/shared/services/logging/logger.service";
import { BuildTarget } from "@elevate/shared/enums/build-target.enum";

export const environment = {
  buildTarget: BuildTarget.EXTENSION,
  production: true,
  logLevel: LoggerService.LEVEL_INFO,
  // Backup version threshold at which a "greater or equal" imported backup version is compatible with current code.
  minBackupVersion: "7.0.0-0.alpha",
  showDebugRibbon: false,
  showActivityDebugData: false,
  showRouteUrl: false,
  bypassProfileRestoreChecks: false,
  backendBaseUrl: null // Only for desktop app
};
