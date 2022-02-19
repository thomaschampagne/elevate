import { singleton } from "tsyringe";
import { RuntimeInfoProvider } from "./runtime-info.provider";
import { RuntimeInfo } from "@elevate/shared/electron/runtime-info";
import { Arch } from "@elevate/shared/enums/arch";
import { Platform } from "@elevate/shared/enums/platform.enum";
import os from "os";

@singleton()
export class RuntimeInfoServiceMock implements RuntimeInfoProvider {
  public getInfo(): Promise<RuntimeInfo> {
    const screenRes = `none:jest`;
    const osPlatform = this.getOsPlatform();
    const cpuInfo = os.cpus()[0];
    const cpu = { name: cpuInfo ? cpuInfo.model.trim() : "Unknown", threads: os.cpus().length };
    const memorySize = Math.round(os.totalmem() / 1024 / 1024 / 1024);
    return Promise.resolve(new RuntimeInfo("fake", "fake", osPlatform, "fake", "fake", cpu, memorySize, screenRes));
  }

  public getOsPlatform(): { name: Platform; arch: Arch } {
    return { name: os.platform() as Platform, arch: os.arch() as Arch };
  }
}
