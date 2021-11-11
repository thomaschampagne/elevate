import os from "os";
import { machineIdSync } from "node-machine-id";
import crypto from "crypto";
import { app } from "electron";
import path from "path";
import { singleton } from "tsyringe";
import { RuntimeInfo } from "@elevate/shared/electron/runtime-info";
import { Arch } from "@elevate/shared/enums/arch";
import { Platform } from "@elevate/shared/enums/platform.enum";

@singleton()
export class AppService {
  private _runtimeInfo: RuntimeInfo;

  constructor() {
    this._runtimeInfo = null;
  }

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

  public getArch(): Arch {
    return this.getRuntimeInfo().osPlatform.arch as Arch;
  }

  public getPlatform(): Platform {
    return this.getRuntimeInfo().osPlatform.name as Platform;
  }

  public isWindows(): boolean {
    return this.getRuntimeInfo().osPlatform.name === Platform.WINDOWS;
  }

  public isLinux(): boolean {
    return this.getRuntimeInfo().osPlatform.name === Platform.LINUX;
  }

  public isMacOS(): boolean {
    return this.getRuntimeInfo().osPlatform.name === Platform.MACOS;
  }

  public getRuntimeInfo(): RuntimeInfo {
    if (!this._runtimeInfo) {
      const osPlatform = { name: os.platform(), arch: os.arch() };
      const osHostname = os.hostname().trim();
      const osUsername = os.userInfo().username.trim();
      const osMachineId = machineIdSync();
      const athleteMachineId = crypto
        .createHash("sha1")
        .update(osMachineId + ":" + osUsername)
        .digest("hex");
      const cpuInfo = os.cpus()[0];
      const cpuName = { name: cpuInfo ? cpuInfo.model.trim() : "Unknown", threads: os.cpus().length };
      const memorySize = Math.round(os.totalmem() / 1024 / 1024 / 1024);
      this._runtimeInfo = new RuntimeInfo(
        osPlatform,
        osHostname,
        osUsername,
        osMachineId,
        athleteMachineId,
        cpuName,
        memorySize
      );
    }
    return this._runtimeInfo;
  }

  public getUnpackedNodeModules(): string {
    return `${this.getResourceFolder()}/app.asar.unpacked/node_modules/`;
  }

  public printRuntimeInfo(): string {
    const runtimeInfo = this.getRuntimeInfo();
    return `Hostname ${runtimeInfo.osHostname}; Platform ${runtimeInfo.osPlatform.name} ${runtimeInfo.osPlatform.arch}; Cpu ${runtimeInfo.cpu.name}; Memory ${runtimeInfo.memorySizeGb}GB; athleteMachineId ${runtimeInfo.athleteMachineId}; Node v${process.versions.node}`;
  }
}
