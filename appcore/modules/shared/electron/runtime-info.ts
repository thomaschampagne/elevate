import { GeoIp } from "./geo-ip";

export class RuntimeInfo {
  constructor(
    public osMachineId: string,
    public osPlatform: { name: string; arch: string },
    public osHostname: string,
    public osUsername: string,
    public machineId: string,
    public cpu: { name: string; threads: number },
    public memorySizeGb: number,
    public geoIp: GeoIp | null = null
  ) {
    this.osMachineId = osMachineId;
    this.osPlatform = osPlatform;
    this.osHostname = osHostname;
    this.osUsername = osUsername;
    this.machineId = machineId;
    this.cpu = cpu;
    this.memorySizeGb = memorySizeGb;
    this.geoIp = geoIp;
  }
}
