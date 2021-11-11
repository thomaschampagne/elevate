import { injectable } from "tsyringe";
import { Environment } from "./environment.interface";

@injectable()
export class DevEnvironment implements Environment {
  readonly debugActivityFiles = {
    enabled: true,
    endpoint: "https://peak-dev-elevate.koyeb.app/debug/"
  };
  readonly allowActivitiesOverLapping: boolean = false;
}
