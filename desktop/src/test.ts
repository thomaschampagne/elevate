import "reflect-metadata";
import { container } from "tsyringe";
import { Environment, EnvironmentToken } from "./environments/environment.interface";
import { DevEnvironment } from "./environments/environment.dev";
import { RuntimeInfoProvider, RuntimeInfoProviderToken } from "./runtime-info/runtime-info.provider";
import { RuntimeInfoServiceMock } from "./runtime-info/runtime-Info.service.mock";

container.register<Environment>(EnvironmentToken, { useClass: DevEnvironment });
container.register<RuntimeInfoProvider>(RuntimeInfoProviderToken, { useClass: RuntimeInfoServiceMock });
