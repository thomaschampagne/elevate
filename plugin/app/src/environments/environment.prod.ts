import { LoggerService } from "../app/shared/services/logging/logger.service";
import { EnvTarget } from "../app/shared/enums/env-target";

export const environment = {
	target: EnvTarget.EXTENSION,
	production: true,
	logLevel: LoggerService.LEVEL_DEBUG,
	skipRestoreSyncedBackupCheck: false
};
