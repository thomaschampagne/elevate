import { injectable } from "tsyringe";
import { Environment } from "./environment.interface";

@injectable()
export class ProdEnvironment implements Environment {
  readonly debugActivityFiles = {
    enabled: true,
    endpoint: "https://peak-elevate.koyeb.app/debug/"
  };
  readonly allowActivitiesOverLapping: boolean = false;
}
