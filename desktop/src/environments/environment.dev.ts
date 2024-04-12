import { injectable } from "tsyringe";
import { Environment } from "./environment.interface";

@injectable()
export class DevEnvironment implements Environment {
  readonly allowActivitiesOverLapping: boolean = false;
}
