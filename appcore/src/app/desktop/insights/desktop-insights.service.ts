import { Inject, Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Insights } from "./insights.model";
import { LoggerService } from "../../shared/services/logging/logger.service";

@Injectable()
export class DesktopInsightsService {
  private static readonly MACHINE_ENDPOINT = "http://localhost:8080/api/machine";

  constructor(
    @Inject(HttpClient) private readonly httpClient: HttpClient,
    @Inject(LoggerService) private readonly logger: LoggerService
  ) {}

  public registerMachine(insightMachine: Insights.Machine): void {
    this.httpClient
      .put(DesktopInsightsService.MACHINE_ENDPOINT, insightMachine)
      .toPromise()
      .catch(err => {
        this.logger.warn(err);
      });
  }
}
