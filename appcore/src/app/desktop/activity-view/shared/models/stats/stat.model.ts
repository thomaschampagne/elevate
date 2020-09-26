import { BaseSensor } from "../sensors/base.sensor";
import { AnalysisDataModel, SyncedActivityModel } from "@elevate/shared/models";

export class Stat<T> {
  public unit: string | null;
  public missingMessage: string | null;

  private constructor(
    public readonly baseSensor: BaseSensor,
    public readonly name: string,
    public readonly path: (keyof SyncedActivityModel | keyof AnalysisDataModel | keyof T | string)[],
    public description: string = null,
    public readonly roundDecimals: number = null
  ) {
    if (this.baseSensor.isEstimated) {
      this.name = `Est. ${this.name}`;
    }

    this.missingMessage = null;
  }

  public static create<T>(
    baseSensor: BaseSensor,
    name: string,
    path: (keyof SyncedActivityModel | keyof AnalysisDataModel | keyof T | string)[],
    description: string = null,
    roundDecimals: number = null
  ) {
    return new Stat<T>(baseSensor, name, path, description, roundDecimals);
  }

  public asEmptyUnit(): Stat<T> {
    this.unit = null;
    return this;
  }

  public forceUnit(unit: string): Stat<T> {
    this.unit = unit;
    return this;
  }

  public setMissingMessage(message: string): Stat<T> {
    this.missingMessage = message;
    return this;
  }
}
