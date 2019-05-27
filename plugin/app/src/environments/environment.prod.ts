import { LoggerService } from "../app/shared/services/logging/logger.service";
import { EnvTarget } from "@elevate/shared/models";

export const environment = {
	target: EnvTarget.EXTENSION,
	production: true,
	logLevel: LoggerService.LEVEL_DEBUG,
	skipRestoreSyncedBackupCheck: false
};
