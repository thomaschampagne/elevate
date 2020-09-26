import { Stat } from "./stat.model";

export abstract class StatsGroup {
  protected constructor(public name: string, public stats: Stat<any>[] = [], public color: string = null) {}
}
