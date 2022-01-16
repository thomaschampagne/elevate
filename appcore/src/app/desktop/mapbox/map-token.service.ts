import { Inject, Injectable } from "@angular/core";
import { MachineAuthenticatedService } from "../machine/machine-authenticated.service";
import { HttpClient } from "@angular/common/http";
import { MachineService } from "../machine/machine.service";
import { LoggerService } from "../../shared/services/logging/logger.service";
import { environment } from "../../../environments/environment";
import { DesktopUserSettingsService } from "../../shared/services/user-settings/desktop/desktop-user-settings.service";
import { UserSettingsService } from "../../shared/services/user-settings/user-settings.service";
import { UserSettings } from "@elevate/shared/models/user-settings/user-settings.namespace";
import _ from "lodash";
import DesktopUserSettings = UserSettings.DesktopUserSettings;

@Injectable()
export class MapTokenService extends MachineAuthenticatedService {
  private static readonly MAP_TOKEN_ENDPOINT = `${environment.backendBaseUrl}/map/token`;

  private static readonly FALLBACK_TOKENS: string[] = [
    "cGsuZXlKMUlqb2laV3hsZG1GMFpTMXpjRzl5ZEhNdFlYQndMV1ppTFRBeElpd2lZU0k2SW1OcmVEUmxjRGhrWmpGMWJHTXllRzlpYURsaE5tWnRaVzRpZlEubU1udUstUXF5RGxGSkZvYUtvRTBiQQ==",
    "cGsuZXlKMUlqb2laV3hsZG1GMFpTMXpjRzl5ZEhNdFlYQndMV1ppTFRBeUlpd2lZU0k2SW1OcmVEUmxjalpyY0RBeE0zb3lkbkJrYm1jd05HWXlhellpZlEuT0pFMG1pbUQ1REl1M0RRRnBnbGJNUQ==",
    "cGsuZXlKMUlqb2laV3hsZG1GMFpTMXpjRzl5ZEhNdFlYQndMV1ppTFRBeklpd2lZU0k2SW1OcmVEUmxlVFIzZVRBMGNURXlkbTU2TjNwMk5tcG1ZV2NpZlEuN0tSQlVKX1l4aHliQ2xUX3V2em15UQ==",
    "cGsuZXlKMUlqb2laV3hsZG1GMFpTMXpjRzl5ZEhNdFlYQndMV1ppTFRBMElpd2lZU0k2SW1OcmVEUm1aSEI1TnpGMWN6VXllRzlpWTJwc2JqaDBPVE1pZlEuZGc2YkZNQ1ZjVXhranhFNDY2T0lodw=="
  ];

  constructor(
    @Inject(HttpClient) protected readonly httpClient: HttpClient,
    @Inject(MachineService) protected readonly machineService: MachineService,
    @Inject(UserSettingsService) private readonly userSettingsService: DesktopUserSettingsService,
    @Inject(LoggerService) protected readonly logger: LoggerService
  ) {
    super(httpClient, machineService);
  }

  public get(): Promise<string> {
    return this.userSettingsService.fetch().then((userSettings: DesktopUserSettings) => {
      if (userSettings.mapToken) {
        this.logger.debug("Use user defined map token");
        return Promise.resolve(userSettings.mapToken.trim());
      } else {
        return this.getAuthenticated(MapTokenService.MAP_TOKEN_ENDPOINT)
          .toPromise()
          .then((result: { token: string }) => {
            this.logger.debug("Use remote map token");
            return Promise.resolve(result.token);
          })
          .catch(err => {
            this.logger.error(err.message);
            this.logger.debug("Use fallback map token");

            // Get a random fallback token
            const fallbackTokenIndex = _.random(0, MapTokenService.FALLBACK_TOKENS.length - 1);

            // Decode and return token
            const fallbackToken = atob(MapTokenService.FALLBACK_TOKENS[fallbackTokenIndex]);

            return Promise.resolve(fallbackToken);
          });
      }
    });
  }
}
