import logger from "electron-log";
import { app } from "electron";
import path from "path";
import { Arch } from "@elevate/shared/enums/arch";
import { Platform } from "@elevate/shared/enums/platform.enum";
import { inject, singleton } from "tsyringe";
import { RuntimeInfoService } from "./runtime-info/RuntimeInfoService";

@singleton()
export class AppService {
  constructor(@inject(RuntimeInfoService) private readonly runtimeInfoService: RuntimeInfoService) {}

  private _isPackaged: boolean;

  get isPackaged(): boolean {
    return this._isPackaged;
  }

  set isPackaged(value: boolean) {
    this._isPackaged = value;
  }

  public getResourceFolder(): string {
    return path.dirname(app.getAppPath());
  }

  public getArch(): Promise<Arch> {
    return this.getRuntimeInfo().then(runtimeInfo => {
      return Promise.resolve(runtimeInfo.osPlatform.arch);
    });
  }

  public getPlatform(): Promise<Platform> {
    return this.getRuntimeInfo().then(runtimeInfo => {
      return Promise.resolve(runtimeInfo.osPlatform.name);
    });
  }

  public isWindows(): boolean {
    return this.runtimeInfoService.getOsPlatform().name === Platform.WINDOWS;
  }

  public isLinux(): boolean {
    return this.runtimeInfoService.getOsPlatform().name === Platform.LINUX;
  }

  public isMacOS(): boolean {
    return this.runtimeInfoService.getOsPlatform().name === Platform.MACOS;
  }

  public printRuntimeInfo(): void {
    this.runtimeInfoService.getInfo().then(runtimeInfo => {
      const infoStr = `Hostname ${runtimeInfo.osHostname}; Platform ${runtimeInfo.osPlatform.name} ${runtimeInfo.osPlatform.arch}; Cpu ${runtimeInfo.cpu.name}; Memory ${runtimeInfo.memorySizeGb}GB; athleteMachineId ${runtimeInfo.athleteMachineId}; Node v${process.versions.node}`;
      logger.info(`System details: ${infoStr}`);
    });
  }

  public getUnpackedNodeModules(): string {
    return `${this.getResourceFolder()}/app.asar.unpacked/node_modules/`;
  }

  public getRuntimeInfo(): Promise<RuntimeInfo> {
    return this.runtimeInfoService.getInfo();
  }
}
