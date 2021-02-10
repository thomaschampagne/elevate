import { LoggerService } from "../app/shared/services/logging/logger.service";
import { BuildTarget } from "@elevate/shared/enums";

export const environment = {
  buildTarget: BuildTarget.EXTENSION,
  production: true,
  logLevel: LoggerService.LEVEL_INFO,
  minBackupVersion: "7.0.0-0.alpha",
  skipRestoreSyncedBackupCheck: false
};
