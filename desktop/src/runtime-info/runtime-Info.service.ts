import { inject, singleton } from "tsyringe";
import os from "os";
import { machineIdSync } from "node-machine-id";
import { HttpClient } from "../clients/http.client";
import { Hash } from "../tools/hash";
import { Logger } from "../logger";
import { UserScreen } from "../tools/user-screen";
import { RuntimeInfo } from "@elevate/shared/electron/runtime-info";
import { Platform } from "@elevate/shared/enums/platform.enum";
import { Arch } from "@elevate/shared/enums/arch";
import { RuntimeInfoProvider } from "./runtime-info.provider";

@singleton()
export class RuntimeInfoService implements RuntimeInfoProvider {
  constructor(
    @inject(HttpClient) private readonly httpClient: HttpClient,
    @inject(Logger) private readonly logger: Logger
  ) {
    this._runtimeInfo = null;
  }

  private _runtimeInfo: RuntimeInfo;

  public getInfo(): Promise<RuntimeInfo> {
    if (!this._runtimeInfo) {
      const osPlatform = this.getOsPlatform();
      const osHostname = os.hostname().trim();
      const osUsername = os.userInfo().username.trim();
      const cpuInfo = os.cpus()[0];
      const cpu = { name: cpuInfo ? cpuInfo.model.trim() : "Unknown", threads: os.cpus().length };
      const memorySize = Math.round(os.totalmem() / 1024 / 1024 / 1024);
      const { width, height } = UserScreen.computeScreenRes();
      const screenRes = `${width}x${height}`;

      // Compute unique user machine key identifier based on hash of: unique machine id,
      const userMachineKey = `${machineIdSync()}:${JSON.stringify(osPlatform)}:${osHostname}:${osUsername}`;
      const hashedUserMachineKey = Hash.apply(userMachineKey, Hash.SHA256);

      // Cut unique hashed User Machine Key in 2.
      // First part become athlete machine key: act as machine password, should not be plain stored or given
      const midLength = hashedUserMachineKey.length / 2;
      const athleteMachineKey = hashedUserMachineKey.slice(0, midLength);

      // Second part become athlete machine identifier: act as machine login.
      const athleteMachineId = Hash.asObjectId(hashedUserMachineKey.slice(midLength));

      this._runtimeInfo = new RuntimeInfo(
        athleteMachineId,
        athleteMachineKey,
        osPlatform,
        osHostname,
        osUsername,
        cpu,
        memorySize,
        screenRes
      );

      return Promise.resolve(this._runtimeInfo);
    }
    return Promise.resolve(this._runtimeInfo);
  }

  public getOsPlatform(): { name: Platform; arch: Arch } {
    return { name: os.platform() as Platform, arch: os.arch() as Arch };
  }
}
