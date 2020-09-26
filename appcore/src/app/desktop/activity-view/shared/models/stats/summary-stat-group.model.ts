import { Stat } from "./stat.model";
import { WarningException } from "@elevate/shared/exceptions";
import { SyncedActivityModel } from "@elevate/shared/models";
import _ from "lodash";
import { StatsGroup } from "./stat-group.model";

export abstract class SummaryStatsGroup extends StatsGroup {
  public static readonly DEFAULT_COLUMNS_COUNT: number = 3;
  public static readonly DEFAULT_ROW_COUNT: number = 3;

  private readonly elementsSize: number;
  private statsPools: Stat<any>[][] = [];
  private uniqueStatList: Stat<any>[] = [];

  protected constructor(public name: string) {
    super(name);
    this.elementsSize = SummaryStatsGroup.DEFAULT_COLUMNS_COUNT * SummaryStatsGroup.DEFAULT_ROW_COUNT;
    this.statsPools = [];
    this.uniqueStatList = [];
  }

  public addStatsPool(pool: Stat<any>[]) {
    pool.forEach(stat => {
      if (stat && this.uniqueStatList.indexOf(stat) !== -1) {
        throw new WarningException(
          `Stat with path: "${stat.path.join(".")}" is already registered for activity summary view.`
        );
      }
      this.uniqueStatList.push(stat);
    });

    this.statsPools.push(pool);
  }

  public mutateAsStatsGroup(activity: SyncedActivityModel): StatsGroup {
    let isGridFull = false;
    for (const pool of this.statsPools) {
      // Grid size reached? If yes leave and return
      if (isGridFull) {
        break;
      }

      for (const stat of pool) {
        const statValue: number | string = stat ? _.get(activity, stat.path) : null;
        const statExists = statValue !== null && statValue !== undefined;

        if (statExists) {
          this.stats.push(stat);
          if (this.stats.length === this.elementsSize) {
            isGridFull = true;
          }
          break; // Found stat in pool, so exit and go to next pool
        }
      }
    }

    // Clean useless properties for mutation and return
    delete this.uniqueStatList;
    delete this.statsPools;
    return this;
  }
}
