import { Inject, Injectable } from "@angular/core";
import { UserSettingsService } from "../user-settings.service";
import { UserSettingsDao } from "../../../dao/user-settings/user-settings.dao";
import { LoggerService } from "../../logging/logger.service";

@Injectable()
export class DesktopUserSettingsService extends UserSettingsService {
  constructor(
    @Inject(UserSettingsDao) public readonly userSettingsDao: UserSettingsDao,
    @Inject(LoggerService) public readonly logger: LoggerService
  ) {
    super(userSettingsDao, logger);
  }
}
