import { Inject, Injectable } from "@angular/core";
import { environment } from "../../../environments/environment";
import { HttpClient, HttpRequest } from "@angular/common/http";
import { LoggerService } from "../../shared/services/logging/logger.service";
import { StatusCodes } from "http-status-codes";
import { Observable, Subject } from "rxjs";
import { RuntimeInfoService } from "./runtime-info.service";
import { Machine } from "../models/machine";
import { AthleteService } from "../../shared/services/athlete/athlete.service";
import { StravaConnectorInfoService } from "../../shared/services/strava-connector-info/strava-connector-info.service";
import { VersionsProvider } from "../../shared/services/versions/versions-provider";
import _ from "lodash";

@Injectable()
export class MachineService {
  private static readonly MACHINE_CHECKIN_ENDPOINT = `${environment.backendBaseUrl}/machine/checkIn`;

  private static readonly MACHINE_AUTH_ENDPOINT = `${environment.backendBaseUrl}/machine/auth`;
  private static readonly INSIGHT_API_MATCH_REGEX = "/insights/.*";
  private static readonly HEADER_TOKEN_NAME = "X-Elevate-Token";
  private static readonly LS_TOKEN_KEY = "machineToken";

  constructor(
    @Inject(RuntimeInfoService) public readonly runtimeInfoService: RuntimeInfoService,
    @Inject(VersionsProvider) private readonly versionsProvider: VersionsProvider,
    @Inject(HttpClient) private readonly httpClient: HttpClient,
    @Inject(AthleteService) private readonly athleteService: AthleteService,
    @Inject(StravaConnectorInfoService) private readonly stravaConnectorInfoService: StravaConnectorInfoService,
    @Inject(LoggerService) private readonly logger: LoggerService
  ) {}

  /**
   * Authenticate machine and provide JWT token
   */
  public auth(): Observable<void> {
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
    if (!request.url.match(MachineService.INSIGHT_API_MATCH_REGEX)) {
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
    Promise.all([this.runtimeInfoService.get(), this.stravaConnectorInfoService.fetch(), this.athleteService.fetch()])
      .then(results => {
        const [runtimeInfo, stravaConnectorInfo, athleteModel] = _.cloneDeep(results);

        // Register machine for insights
        const machine = new Machine(
          runtimeInfo.athleteMachineId,
          runtimeInfo.athleteMachineKey,
          this.versionsProvider.getPackageVersion(),
          runtimeInfo,
          athleteModel,
          stravaConnectorInfo.stravaAccount
        );

        return this.httpClient.put<void>(MachineService.MACHINE_CHECKIN_ENDPOINT, machine).toPromise();
      })
      .catch(error => {
        // We dont care about errors for this request
        this.logger.warn(error);
      });
  }
}
