import { Inject, Injectable } from "@angular/core";
import { environment } from "../../../environments/environment";
import { HttpClient, HttpRequest } from "@angular/common/http";
import { LoggerService } from "../../shared/services/logging/logger.service";
import { StatusCodes } from "http-status-codes";
import { Subject } from "rxjs";
import { RuntimeInfoService } from "./runtime-info.service";
import { Machine } from "../models/machine";
import { AthleteService } from "../../shared/services/athlete/athlete.service";
import { VersionsProvider } from "../../shared/services/versions/versions-provider";
import _ from "lodash";
import { RuntimeInfo } from "@elevate/shared/electron/runtime-info";
import { AthleteModel } from "@elevate/shared/models/athlete/athlete.model";
import { StravaConnectorInfoService } from "../../shared/services/strava-connector-info/strava-connector-info.service";
import { StravaConnectorInfo } from "@elevate/shared/sync/connectors/strava-connector-info.model";
import { sha256 } from "@elevate/shared/tools/hash";

@Injectable()
export class MachineService {
  private static readonly MACHINE_CHECKIN_ENDPOINT = `${environment.backendBaseUrl}/machine/checkIn`;
  private static readonly MACHINE_AUTH_ENDPOINT = `${environment.backendBaseUrl}/machine/auth`;

  private static readonly AUTHENTICATED_PATH_REGEX = "/insights/.*|/map/token";
  private static readonly HEADER_TOKEN_NAME = "X-Elevate-Token";
  private static readonly LS_TOKEN_KEY = "machineToken";

  constructor(
    @Inject(RuntimeInfoService) public readonly runtimeInfoService: RuntimeInfoService,
    @Inject(VersionsProvider) private readonly versionsProvider: VersionsProvider,
    @Inject(HttpClient) private readonly httpClient: HttpClient,
    @Inject(AthleteService) private readonly athleteService: AthleteService,
    @Inject(StravaConnectorInfoService) public readonly stravaConnectorInfoService: StravaConnectorInfoService,
    @Inject(LoggerService) private readonly logger: LoggerService
  ) {}

  /**
   * Authenticate machine and provide JWT token
   */
  public auth(): Subject<void> {
    const authentication$ = new Subject<void>();
    this.runtimeInfoService.getMachineCredentials().then(machineCredentials => {
      this.httpClient
        .post(
          MachineService.MACHINE_AUTH_ENDPOINT,
          { id: machineCredentials.id, key: machineCredentials.key },
          { observe: "response" }
        )
        .subscribe(
          response => {
            const token = response.headers.get(MachineService.HEADER_TOKEN_NAME);
            if (response.status === StatusCodes.OK && token) {
              localStorage.setItem(MachineService.LS_TOKEN_KEY, token);
              authentication$.complete();
            } else {
              authentication$.error("Authentication failure");
            }
          },
          error => authentication$.error(error),
          () => authentication$.complete()
        );
    });
    return authentication$;
  }

  /**
   * Authenticate request if required by target url pattern
   */
  public authenticateRequest(request: HttpRequest<any>): HttpRequest<any> {
    if (!request.url.match(MachineService.AUTHENTICATED_PATH_REGEX)) {
      return request;
    }

    // Get token if exists
    const machineAuthToken = localStorage.getItem(MachineService.LS_TOKEN_KEY);
    if (machineAuthToken) {
      // We have a token, check to auth with it
      this.logger.debug(`We have a token set it in request header`);

      // Clone the request and replace the original headers with
      // cloned headers, updated with the authorization.
      request = request.clone({
        headers: request.headers.set("Authorization", `Bearer ${machineAuthToken}`)
      });
    }

    return request;
  }

  public checkIn(): void {
    Promise.all([this.runtimeInfoService.get(), this.athleteService.fetch(), this.stravaConnectorInfoService.fetch()])
      .then(results => {
        const [runtimeInfo, athleteModel, stravaConnectorInfo] =
          _.cloneDeep<[RuntimeInfo, AthleteModel, StravaConnectorInfo]>(results);

        const stravaHashPromise = stravaConnectorInfo?.stravaAccount?.id
          ? sha256(stravaConnectorInfo.stravaAccount.id.toString(), true)
          : Promise.resolve(null);

        return stravaHashPromise.then((stravaHash: string | null) => {
          // Register machine for insights
          const machine = new Machine(
            runtimeInfo.athleteMachineId,
            runtimeInfo.athleteMachineKey,
            this.versionsProvider.getPackageVersion(),
            runtimeInfo,
            athleteModel,
            stravaHash
          );

          return this.httpClient.put<void>(MachineService.MACHINE_CHECKIN_ENDPOINT, machine).toPromise();
        });
      })
      .catch(error => {
        // We dont care about errors for this request
        this.logger.warn(error);
      });
  }
}
