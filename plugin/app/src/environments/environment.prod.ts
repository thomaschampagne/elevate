import { LoggerService } from "../app/shared/services/logging/logger.service";

export const environment = {
	desktop: false,
	production: true,
	logLevel: LoggerService.LEVEL_DEBUG,
	skipRestoreSyncedBackupCheck: false
};
