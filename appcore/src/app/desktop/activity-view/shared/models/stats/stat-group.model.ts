import { Stat } from "./stat.model";

export abstract class StatsGroup {
  protected static readonly DEFAULT_COLOR: string = "#e7e7e7";

  protected constructor(
    public name: string,
    public stats: Stat<any>[] = [],
    public color: string = StatsGroup.DEFAULT_COLOR
  ) {}
}
