import { RuntimeInfo } from "@elevate/shared/electron/runtime-info";
import { Platform } from "@elevate/shared/enums/platform.enum";
import { Arch } from "@elevate/shared/enums/arch";

export const RuntimeInfoProviderToken = "RUNTIME_INFO_SERVICE";

export interface RuntimeInfoProvider {
  getInfo(): Promise<RuntimeInfo>;
  getOsPlatform(): { name: Platform; arch: Arch };
}
