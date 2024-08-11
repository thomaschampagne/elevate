// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses `environment.ts`, but if you do
// `ng build --env=prod` then `environment.prod.ts` will be used instead.
// The list of which env maps to which file can be found in `.angular-cli.json`.

import { LoggerService } from "../app/shared/services/logging/logger.service";
import { BuildTarget } from "@elevate/shared/enums/build-target.enum";

export const environment = {
  buildTarget: BuildTarget.DESKTOP,
  production: true,
  logLevel: LoggerService.LEVEL_INFO,
  // Backup version threshold at which a "greater or equal" imported backup version is compatible with current code.
  minBackupVersion: "7.0.0-beta.0",
  showDebugRibbon: false,
  showActivityDebugData: false,
  showRouteUrl: false,
  bypassProfileRestoreChecks: false,
  backendBaseUrl: "https://api.elevate-app.duckdns.org"
};
