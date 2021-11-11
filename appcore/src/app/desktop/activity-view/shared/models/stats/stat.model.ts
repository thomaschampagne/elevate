import { BaseSensor } from "../sensors/base.sensor";
import { Activity, ActivityStats } from "@elevate/shared/models/sync/activity.model";

export class Stat<T> {
  public unit: string | null;
  public factor: number;
  public missingMessage: string | null;
  public forceDisplay: boolean;

  private constructor(
    public readonly baseSensor: BaseSensor,
    public readonly name: string,
    public readonly path: (keyof Activity | keyof ActivityStats | keyof T | string)[],
    public description: string = null,
    public readonly roundDecimals: number = null,
    public details: ((value: number | string) => string) | string = null
  ) {
    if (this.baseSensor.isEstimated) {
      this.name = `Est. ${this.name}`;
    }

    this.factor = 1;
    this.missingMessage = null;
    this.forceDisplay = false;
  }

  public static create<T>(
    baseSensor: BaseSensor,
    name: string,
    path: (keyof Activity | keyof ActivityStats | keyof T | string)[],
    description: string = null,
    roundDecimals: number = null,
    details: ((value: number | string) => string) | string = null
  ) {
    return new Stat<T>(baseSensor, name, path, description, roundDecimals, details);
  }

  public asEmptyUnit(): Stat<T> {
    this.unit = null;
    return this;
  }

  public setUnit(unit: string): Stat<T> {
    this.unit = unit;
    return this;
  }

  public setFactor(factor: number): Stat<T> {
    this.factor = factor;
    return this;
  }

  public setDetails(details: ((value: number | string) => string) | string): Stat<T> {
    this.details = details;
    return this;
  }
  public asForceDisplay(): Stat<T> {
    this.forceDisplay = true;
    return this;
  }

  public setMissingMessage(message: string): Stat<T> {
    this.missingMessage = message;
    return this;
  }
}
