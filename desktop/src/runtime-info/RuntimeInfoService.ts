import { inject, singleton } from "tsyringe";
import netAddr from "public-ip";
import { HttpCodes } from "typed-rest-client/HttpClient";
import { GeoIp, RuntimeInfo } from "@elevate/shared/electron";
import os from "os";
import { machineIdSync } from "node-machine-id";
import { HttpClient } from "../clients/http.client";
import { Hash } from "../tools/hash";
import { Logger } from "../logger";

@singleton()
export class RuntimeInfoService {
  constructor(
    @inject(HttpClient) private readonly httpClient: HttpClient,
    @inject(Logger) private readonly logger: Logger
  ) {
    this._runtimeInfo = null;
  }

  private static readonly GEO_IP_API_TIMEOUT: number = 3000;
  private _runtimeInfo: RuntimeInfo;

  private static getGeoIpApiEndPoint(ip: string): string {
    return `https://api.db-ip.com/v2/free/${ip}`;
  }

  public getGeoIp(): Promise<GeoIp> {
    return netAddr
      .v4({ timeout: RuntimeInfoService.GEO_IP_API_TIMEOUT })
      .then(ip => {
        return this.httpClient.get(RuntimeInfoService.getGeoIpApiEndPoint(ip), {
          "Content-Type": "application/json"
        });
      })
      .then(response => {
        return response.message.statusCode === HttpCodes.OK ? response.readBody() : Promise.reject(response.message);
      })
      .then(body => {
        const geoIp = JSON.parse(body) as GeoIp;
        return Promise.resolve(new GeoIp(geoIp.ipAddress, geoIp.city, geoIp.stateProv, geoIp.countryName));
      })
      .catch(err => {
        return Promise.reject(err);
      });
  }

  public getInfo(): Promise<RuntimeInfo> {
    if (!this._runtimeInfo) {
      const osPlatform = this.getOsPlatform();
      const osHostname = os.hostname().trim();
      const osUsername = os.userInfo().username.trim();
      const osMachineId = Hash.asObjectId(machineIdSync());
      const athleteMachineId = Hash.asObjectId(osMachineId + ":" + osUsername);
      const cpuInfo = os.cpus()[0];
      const cpuName = { name: cpuInfo ? cpuInfo.model.trim() : "Unknown", threads: os.cpus().length };
      const memorySize = Math.round(os.totalmem() / 1024 / 1024 / 1024);

      const runtimeInfo = new RuntimeInfo(
        osMachineId,
        osPlatform,
        osHostname,
        osUsername,
        athleteMachineId,
        cpuName,
        memorySize
      );

      return this.getGeoIp()
        .then(
          geoIp => {
            runtimeInfo.geoIp = geoIp;
            return Promise.resolve(runtimeInfo);
          },
          err => {
            this.logger.warn(err);
            return Promise.resolve(runtimeInfo);
          }
        )
        .then(updatedRuntimeInfo => {
          this._runtimeInfo = updatedRuntimeInfo;
          return Promise.resolve(this._runtimeInfo);
        });
    }
    return Promise.resolve(this._runtimeInfo);
  }

  public getOsPlatform(): { name: string; arch: string } {
    return { name: os.platform(), arch: os.arch() };
  }
}
