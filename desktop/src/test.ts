import "reflect-metadata";
import { container } from "tsyringe";
import { Environment, EnvironmentToken } from "./environments/environment.interface";
import { DevEnvironment } from "./environments/environment.dev";

container.register<Environment>(EnvironmentToken, { useClass: DevEnvironment });
