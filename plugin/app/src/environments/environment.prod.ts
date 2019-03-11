import { LoggerService } from "../app/shared/services/logging/logger.service";
import { EnvType } from "../app/shared/enums/env-type";

export const environment = {
	type: EnvType.EXTENSION,
	production: true,
	logLevel: LoggerService.LEVEL_DEBUG,
	skipRestoreSyncedBackupCheck: false
};
