import { Inject, Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { LoggerService } from "../../shared/services/logging/logger.service";
import { environment } from "../../../environments/environment";
import pako from "pako";
import { InsightActivity } from "../models/insight-activity";
import { MachineService } from "../machine/machine.service";
import _ from "lodash";
import { MachineAuthenticatedService } from "../machine/machine-authenticated.service";
import { RuntimeInfoService } from "../machine/runtime-info.service";
import { SyncedActivityModel } from "@elevate/shared/models";

@Injectable()
export class DesktopInsightsService extends MachineAuthenticatedService {
  private static readonly REPLACE_ALL_ACTIVITIES_ENDPOINT = `${environment.backendBaseUrl}/insights/activities/replaceAll`;
  private static readonly UPSERT_ACTIVITIES_ENDPOINT = `${environment.backendBaseUrl}/insights/activities/upsert`;

  private static readonly PUSH_ACTIVITIES_ENDPOINT = (machineId: string, replaceAll: boolean) => {
    return replaceAll
      ? `${DesktopInsightsService.REPLACE_ALL_ACTIVITIES_ENDPOINT}/${machineId}`
      : `${DesktopInsightsService.UPSERT_ACTIVITIES_ENDPOINT}/${machineId}`;
  };

  constructor(
    @Inject(HttpClient) protected readonly httpClient: HttpClient,
    @Inject(MachineService) protected readonly machineService: MachineService,
    @Inject(RuntimeInfoService) public readonly runtimeInfoService: RuntimeInfoService,
    @Inject(LoggerService) protected readonly logger: LoggerService
  ) {
    super(httpClient, machineService);
  }

  public registerActivities(syncedActivities: SyncedActivityModel[], replaceAll: boolean): void {
    // Skip if no activities to push
    if (!syncedActivities || syncedActivities.length === 0) {
      return;
    }

    this.runtimeInfoService.getMachineCredentials().then(machineCredentials => {
      const machineId = machineCredentials.id;

      // Extract insight activities
      const insightActivities: InsightActivity[] = [];
      syncedActivities.forEach(syncedActivity => {
        insightActivities.push(new InsightActivity(machineId, syncedActivity));
      });

      // Compress insight activities before sending
      const compressedData = pako.gzip(JSON.stringify(insightActivities));
      const activitiesBlob = new Blob([compressedData]);

      this.logger.debug(`Sending ${_.round(activitiesBlob.size / 1024, 2)} KB of insight activities`);

      // Append blob to post form data
      const formData = new FormData();
      formData.append("activitiesBlob", activitiesBlob);

      // Upsert remote insight activities or replace all existing by given on if no datetime given
      const endpoint = DesktopInsightsService.PUSH_ACTIVITIES_ENDPOINT(machineId, replaceAll);

      // Push !
      this.postAuthenticated(endpoint, formData).subscribe(
        () => _.noop,
        error => {
          this.logger.warn("Unable to perform authenticated request", error);
        },
        () => this.logger.debug("Insight activities have been pushed")
      );
    });
  }
}
