import { Arch, Platform } from "../enums";

export class RuntimeInfo {
  constructor(
    public readonly athleteMachineId: string,
    public readonly athleteMachineKey: string,
    public readonly osPlatform: { name: Platform; arch: Arch },
    public readonly osHostname: string,
    public readonly osUsername: string,
    public readonly cpu: { name: string; threads: number },
    public readonly memorySizeGb: number,
    public readonly screenRes: string
  ) {}
}
