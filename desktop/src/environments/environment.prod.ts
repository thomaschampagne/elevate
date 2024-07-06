import { injectable } from "tsyringe";
import { Environment } from "./environment.interface";

@injectable()
export class ProdEnvironment implements Environment {
  readonly allowActivitiesOverLapping: boolean = false;
}
