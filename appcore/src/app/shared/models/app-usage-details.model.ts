import { AppUsage } from "./app-usage.model";

export class AppUsageDetails extends AppUsage {
  constructor(
    readonly appUsage: AppUsage,
    public readonly megaBytesInUse: number,
    public readonly megaBytesQuota: number,
    public readonly percentUsage: number
  ) {
    super(appUsage.bytesInUse, appUsage.quotaBytes);
  }
}
