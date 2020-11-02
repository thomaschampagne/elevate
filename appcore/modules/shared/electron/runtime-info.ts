import { GeoIp } from "./geo-ip";

export class RuntimeInfo {
  public osPlatform: { name: string; arch: string };
  public osHostname: string;

  // Unique user account identifier on the OS.
  public osUsername: string;

  // Unique machine installation id shared by all local users on the OS.
  public osMachineId: string;

  // Unique user athlete identifier based on sha256(osMachineId + osUsername) given by electron ipc main.
  public athleteMachineId: string;

  public cpu: { name: string; threads: number };
  public memorySizeGb: number;
  public geoIp: GeoIp | null;

  constructor(
    osMachineId: string,
    osPlatform: { name: string; arch: string },
    osHostname: string,
    osUsername: string,
    athleteMachineId: string,
    cpu: { name: string; threads: number },
    memorySizeGb: number,
    geoIp: GeoIp = null
  ) {
    this.osMachineId = osMachineId;
    this.osPlatform = osPlatform;
    this.osHostname = osHostname;
    this.osUsername = osUsername;
    this.athleteMachineId = athleteMachineId;
    this.cpu = cpu;
    this.memorySizeGb = memorySizeGb;
    this.geoIp = geoIp;
  }
}
